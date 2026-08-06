"""
AI Data Center Stock Screener — backend.

A small Flask server that:
  1. Serves the dashboard (templates/index.html).
  2. Exposes /api/screen which pulls live data from Yahoo Finance (yfinance),
     enriches the curated universe, caches the result, and returns JSON.

Run:
    python app.py
Then open http://127.0.0.1:5000

This is the FOUNDATION version: it organizes & displays the universe with live
quotes and basic valuation. No filtering logic yet — that's the next layer.
"""

import datetime
import os
import re
import sys
import time
from concurrent.futures import ThreadPoolExecutor, as_completed

from flask import Flask, jsonify, render_template, request

import yfinance as yf
from universe import (
    LAYERS, all_tickers, layer_index, is_excluded, market_overrides,
    EXPOSURE_LEVELS, add_user_stock, remove_user_stock, load_user_stocks,
)
from reports import REPORTS, REPORTS_BY_ID, build_messages
from datacenters import (
    datacenter_sites, add_user_datacenter, remove_user_datacenter,
    DISCLAIMER as DC_DISCLAIMER, POWER_SOURCES,
)
import history
import backtest


def _load_dotenv():
    """Load KEY=VALUE lines from a local .env file (next to app.py) into the
    environment, without overriding anything already set. Keeps secrets out of
    the shell profile and out of source control (.env is git-ignored)."""
    path = os.path.join(os.path.dirname(os.path.abspath(__file__)), ".env")
    if not os.path.exists(path):
        return
    try:
        with open(path) as f:
            for line in f:
                line = line.strip()
                if not line or line.startswith("#") or "=" not in line:
                    continue
                key, val = line.split("=", 1)
                os.environ.setdefault(key.strip(), val.strip().strip('"').strip("'"))
    except Exception:  # noqa: BLE001 — a malformed .env shouldn't crash the app
        pass


_load_dotenv()


def resource_path(rel):
    """Locate bundled files whether running from source or a PyInstaller build.

    PyInstaller unpacks data files (templates/, static/) into a temp dir exposed
    as sys._MEIPASS; from source they sit next to this file.
    """
    base = getattr(sys, "_MEIPASS", os.path.dirname(os.path.abspath(__file__)))
    return os.path.join(base, rel)


def data_dir():
    """A writable directory for app data (the history DB). Lives next to the
    source in a normal run; in a frozen build __file__ points into the read-only
    PyInstaller temp dir, so fall back to a per-user folder under home."""
    if getattr(sys, "frozen", False):
        d = os.path.join(os.path.expanduser("~"), ".ai-datacenter-screener")
    else:
        d = os.path.dirname(os.path.abspath(__file__))
    os.makedirs(d, exist_ok=True)
    return d


history.configure(os.path.join(data_dir(), "history.db"))


app = Flask(
    __name__,
    template_folder=resource_path("templates"),
    static_folder=resource_path("static"),
)

# --- simple in-memory cache so we don't hammer Yahoo on every page load ----
_CACHE = {"data": None, "fetched_at": 0.0}
CACHE_TTL_SECONDS = 600  # 10 minutes

# FX rates so foreign-listed names (KRW, TWD, JPY…) can be shown in USD and
# compared apples-to-apples. yf ticker "KRW=X" = USDKRW (local units per USD).
_FX_CACHE = {}

# per-ticker headline cache (news is fetched lazily, only when a row is expanded)
_NEWS_CACHE = {}
NEWS_TTL_SECONDS = 1800  # 30 minutes


def fx_rate(currency):
    """Local-currency units per 1 USD (1.0 for USD/None). None if unavailable."""
    if not currency or currency == "USD":
        return 1.0
    if currency in _FX_CACHE:
        return _FX_CACHE[currency]
    rate = None
    try:
        info = yf.Ticker(f"{currency}=X").info
        rate = _num(info.get("regularMarketPrice")) or _num(info.get("previousClose"))
    except Exception:  # noqa: BLE001
        rate = None
    _FX_CACHE[currency] = rate
    return rate


def _num(value):
    """Coerce to float or return None (keeps JSON clean for missing data)."""
    try:
        if value is None:
            return None
        f = float(value)
        # yfinance sometimes returns NaN
        if f != f:  # NaN check
            return None
        return f
    except (TypeError, ValueError):
        return None


def fetch_one(ticker):
    """Fetch the metrics we care about for a single ticker. Never raises."""
    out = {
        "ticker": ticker,
        "ok": False,
        "price": None, "change_pct": None, "currency": None,
        "market_cap": None, "trailing_pe": None, "forward_pe": None,
        "price_to_sales": None, "ev_ebitda": None,
        "high_52w": None, "low_52w": None, "pct_off_high": None,
        "ma50": None, "ma200": None, "pct_vs_ma50": None, "pct_vs_ma200": None,
        "revenue_growth": None, "gross_margin": None, "profit_margin": None, "roe": None,
        "price_to_book": None, "peg": None, "free_cashflow": None, "operating_margin": None,
        "roa": None, "earnings_growth": None, "debt_to_equity": None, "current_ratio": None,
        "beta": None,
        "week52_change": None,
        # analyst consensus / income / events (Street's view — what pros check first)
        "target_mean_price": None, "target_high_price": None, "target_low_price": None,
        "implied_upside": None, "num_analysts": None,
        "recommendation_key": None, "recommendation_mean": None,
        "dividend_yield": None, "earnings_ts": None,
        "market_state": None,
        "error": None,
    }
    try:
        t = yf.Ticker(ticker)
        info = t.info or {}

        price = _num(info.get("currentPrice")) or _num(info.get("regularMarketPrice"))
        out["price"] = price
        out["change_pct"] = _num(info.get("regularMarketChangePercent"))
        out["currency"] = info.get("currency")
        out["market_cap"] = _num(info.get("marketCap"))
        out["trailing_pe"] = _num(info.get("trailingPE"))
        out["forward_pe"] = _num(info.get("forwardPE"))
        out["price_to_sales"] = _num(info.get("priceToSalesTrailing12Months"))
        out["ev_ebitda"] = _num(info.get("enterpriseToEbitda"))
        out["high_52w"] = _num(info.get("fiftyTwoWeekHigh"))
        out["low_52w"] = _num(info.get("fiftyTwoWeekLow"))
        out["ma50"] = _num(info.get("fiftyDayAverage"))
        out["ma200"] = _num(info.get("twoHundredDayAverage"))
        out["market_state"] = info.get("marketState")

        # quality / growth (yfinance returns margins & growth as fractions)
        out["revenue_growth"] = _num(info.get("revenueGrowth"))
        out["gross_margin"] = _num(info.get("grossMargins"))
        out["profit_margin"] = _num(info.get("profitMargins"))
        out["operating_margin"] = _num(info.get("operatingMargins"))
        out["roe"] = _num(info.get("returnOnEquity"))
        out["roa"] = _num(info.get("returnOnAssets"))
        out["earnings_growth"] = _num(info.get("earningsGrowth"))
        # extra valuation + financial-health inputs for the composite score
        out["price_to_book"] = _num(info.get("priceToBook"))
        out["peg"] = _num(info.get("trailingPegRatio")) or _num(info.get("pegRatio"))
        out["free_cashflow"] = _num(info.get("freeCashflow"))
        out["debt_to_equity"] = _num(info.get("debtToEquity"))
        out["current_ratio"] = _num(info.get("currentRatio"))
        out["beta"] = _num(info.get("beta"))
        out["week52_change"] = _num(info.get("52WeekChange"))

        # analyst consensus: Street price target, implied upside, rating, coverage.
        # Targets are in the listing's currency (USD-normalized later in build_payload);
        # implied upside is a ratio, so it's currency-independent and computed here.
        out["target_mean_price"] = _num(info.get("targetMeanPrice"))
        out["target_high_price"] = _num(info.get("targetHighPrice"))
        out["target_low_price"] = _num(info.get("targetLowPrice"))
        out["num_analysts"] = _num(info.get("numberOfAnalystOpinions"))
        out["recommendation_key"] = info.get("recommendationKey")  # e.g. "buy", "strong_buy"
        out["recommendation_mean"] = _num(info.get("recommendationMean"))  # 1=strong buy … 5=sell
        if price and out["target_mean_price"]:
            out["implied_upside"] = (out["target_mean_price"] - price) / price * 100.0
        # income: yfinance ≥0.2.40 returns dividendYield already as a percent (e.g. 1.12 = 1.12%)
        out["dividend_yield"] = _num(info.get("dividendYield"))
        # next scheduled earnings: ...Start is the upcoming date; plain earningsTimestamp
        # can be the *last* report, so prefer Start and fall back.
        out["earnings_ts"] = _num(info.get("earningsTimestampStart")) or _num(info.get("earningsTimestamp"))

        # trend: price relative to moving averages and the 52-week high
        if price and out["high_52w"]:
            out["pct_off_high"] = (price - out["high_52w"]) / out["high_52w"] * 100.0
        if price and out["ma50"]:
            out["pct_vs_ma50"] = (price - out["ma50"]) / out["ma50"] * 100.0
        if price and out["ma200"]:
            out["pct_vs_ma200"] = (price - out["ma200"]) / out["ma200"] * 100.0

        out["ok"] = price is not None
    except Exception as exc:  # noqa: BLE001 — never let one ticker break the batch
        out["error"] = str(exc)
    return out


def fetch_news(ticker, limit=6):
    """Recent headlines for a ticker from Yahoo Finance (free, aggregates
    reputable publishers). Normalizes yfinance's nested 'content' format and the
    older flat format. Never raises."""
    out = []
    try:
        raw = yf.Ticker(ticker).news or []
    except Exception:  # noqa: BLE001
        raw = []
    for n in raw:
        if not isinstance(n, dict):
            continue
        c = n.get("content") if isinstance(n.get("content"), dict) else None
        if c:
            title = c.get("title")
            publisher = (c.get("provider") or {}).get("displayName")
            url = ((c.get("canonicalUrl") or {}).get("url")
                   or (c.get("clickThroughUrl") or {}).get("url"))
            published = c.get("pubDate") or c.get("displayTime")
        else:
            title = n.get("title")
            publisher = n.get("publisher")
            url = n.get("link")
            ts = n.get("providerPublishTime")
            published = None
            if ts:
                try:
                    published = (datetime.datetime.utcfromtimestamp(ts)
                                .replace(tzinfo=datetime.timezone.utc).isoformat())
                except Exception:  # noqa: BLE001
                    published = None
        if title and url:
            out.append({"title": title, "publisher": publisher or "",
                        "url": url, "published": published})
        if len(out) >= limit:
            break
    return out


def fetch_all(tickers, max_workers=20):
    """Concurrently fetch all tickers; returns {ticker: data}."""
    results = {}
    with ThreadPoolExecutor(max_workers=max_workers) as pool:
        futures = {pool.submit(fetch_one, t): t for t in tickers}
        for fut in as_completed(futures):
            data = fut.result()
            results[data["ticker"]] = data
    return results


def build_payload():
    """Merge live market data onto the curated universe structure."""
    market = fetch_all(all_tickers())
    idx = layer_index()

    layers_out = []
    for layer in LAYERS:
        holdings_out = []
        for h in layer["holdings"]:
            if is_excluded(h["ticker"]):
                continue
            md = dict(market.get(h["ticker"], {}))
            ov = market_overrides(h["ticker"])
            if ov:
                md.update(ov)
                md["ok"] = True
            # normalize foreign-listed names into USD (absolute values only;
            # P/E, P/S, EV/EBITDA & % moves are ratios and stay valid as-is)
            cur = md.get("currency")
            if cur and cur != "USD":
                rate = fx_rate(cur)
                if rate:
                    md["fx_rate"] = rate
                    for k in ("market_cap", "price", "high_52w", "low_52w", "ma50", "ma200",
                              "free_cashflow", "target_mean_price", "target_high_price", "target_low_price"):
                        if md.get(k) is not None:
                            md[k] = md[k] / rate
            holdings_out.append({
                **h,
                "also_in": [lid for lid in idx.get(h["ticker"], []) if lid != layer["id"]],
                "market": md,
            })
        layers_out.append({
            "id": layer["id"],
            "name": layer["name"],
            "blurb": layer["blurb"],
            "holdings": holdings_out,
        })

    ok_count = sum(1 for m in market.values() if m.get("ok"))

    # Representative market state = most common non-empty value across tickers
    # (US-listed names dominate, so this reflects the US session).
    states = {}
    for m in market.values():
        s = m.get("market_state")
        if s:
            states[s] = states.get(s, 0) + 1
    market_state = max(states, key=states.get) if states else None

    return {
        "fetched_at": time.time(),
        "ticker_count": len(market),
        "ok_count": ok_count,
        "market_state": market_state,
        "layers": layers_out,
    }


@app.route("/")
def index():
    return render_template("index.html")


@app.route("/api/datacenters")
def api_datacenters():
    """Curated global data-center campuses at/above a capacity threshold (MW)."""
    try:
        min_mw = float(request.args.get("min_mw", 0))
    except (TypeError, ValueError):
        min_mw = 0
    sites = datacenter_sites(min_mw)
    return jsonify({"sites": sites, "count": len(sites),
                    "disclaimer": DC_DISCLAIMER, "power_sources": POWER_SOURCES})


_DC_STATUSES = {"operational", "construction", "planned"}


@app.route("/api/add-datacenter", methods=["POST"])
def api_add_datacenter():
    """Log a newly-announced campus (persisted to user_datacenters.json)."""
    d = request.get_json(force=True, silent=True) or {}
    name = (d.get("name") or "").strip()
    lat, lng, mw = _num(d.get("lat")), _num(d.get("lng")), _num(d.get("mw"))
    if not name or lat is None or lng is None or mw is None:
        return jsonify({"ok": False, "error": "Need at least a name, latitude, longitude and MW."}), 400
    status = d.get("status") if d.get("status") in _DC_STATUSES else "planned"
    power = d.get("power") if d.get("power") in POWER_SOURCES else "Grid"
    tickers = d.get("tickers") or []
    if isinstance(tickers, str):
        tickers = [t.strip().upper() for t in tickers.split(",") if t.strip()]
    item = {
        "name": name, "operator": (d.get("operator") or "").strip(),
        "lat": lat, "lng": lng, "mw": mw, "status": status, "power": power,
        "country": (d.get("country") or "").strip(), "region": (d.get("region") or "").strip(),
        "note": (d.get("note") or "").strip(), "tickers": tickers,
    }
    return jsonify({"ok": True, "item": add_user_datacenter(item)})


@app.route("/api/remove-datacenter", methods=["POST"])
def api_remove_datacenter():
    d = request.get_json(force=True, silent=True) or {}
    name = (d.get("name") or "").strip()
    if not name:
        return jsonify({"ok": False, "error": "Provide a site name."}), 400
    remove_user_datacenter(name)
    return jsonify({"ok": True})


_BACKTEST_CACHE = {}
BACKTEST_TTL_SECONDS = 3600   # the 2y price pull is heavy — cache per (months, horizon)


@app.route("/api/backtest")
def api_backtest():
    """Reconstruct daily historical scores and test whether they predicted forward returns."""
    try:
        months = int(request.args.get("months", 6))
        horizon = int(request.args.get("horizon", 21))
    except (TypeError, ValueError):
        months, horizon = 6, 21
    months = max(1, min(months, 12))
    horizon = max(5, min(horizon, 63))
    key = (months, horizon)
    now = time.time()
    cached = _BACKTEST_CACHE.get(key)
    if cached and now - cached["at"] < BACKTEST_TTL_SECONDS:
        return jsonify({**cached["res"], "cached": True})

    payload = _CACHE["data"] or build_payload()
    cur = {}
    for layer in payload["layers"]:
        for h in layer["holdings"]:
            m = h.get("market") or {}
            if h["ticker"] not in cur and m.get("ok"):
                cur[h["ticker"]] = {**m, "exposure": h.get("exposure")}
    try:
        res = backtest.run(cur, months=months, horizon=horizon)
    except Exception as exc:  # noqa: BLE001 — surface a clean error to the UI
        return jsonify({"ok": False, "error": str(exc)[:200]})
    if res.get("ok"):
        _BACKTEST_CACHE[key] = {"res": res, "at": now}
    return jsonify({**res, "cached": False})


@app.route("/api/backfill")
def api_backfill():
    """Reconstruct the last N months of close price + composite score for every
    ticker and write it into history.db, so the trend sparklines fill in at once."""
    try:
        months = int(request.args.get("months", 3))
    except (TypeError, ValueError):
        months = 3
    months = max(1, min(months, 12))
    payload = _CACHE["data"] or build_payload()
    cur = {}
    for layer in payload["layers"]:
        for h in layer["holdings"]:
            m = h.get("market") or {}
            if h["ticker"] not in cur and m.get("ok"):
                cur[h["ticker"]] = {**m, "exposure": h.get("exposure")}
    try:
        res = backtest.backfill_history(cur, months)
    except Exception as exc:  # noqa: BLE001
        return jsonify({"ok": False, "error": str(exc)[:200]})
    return jsonify({"ok": True, "months": months, **res})


@app.route("/api/health")
def api_health():
    """Lightweight marker so the launcher can detect an already-running instance
    (and reuse it instead of starting a duplicate on a different port)."""
    return jsonify({"ok": True, "app": "ai-dc-screener"})


@app.route("/api/screen")
def api_screen():
    now = time.time()
    if _CACHE["data"] and (now - _CACHE["fetched_at"] < CACHE_TTL_SECONDS):
        payload = _CACHE["data"]
        payload["cached"] = True
        return jsonify(payload)

    payload = build_payload()
    payload["cached"] = False
    _CACHE["data"] = payload
    _CACHE["fetched_at"] = now
    return jsonify(payload)


def fetch_insider(ticker):
    """6-month insider buy/sell summary from yfinance (spotty; None if unavailable)."""
    try:
        ip = yf.Ticker(ticker).insider_purchases
        if ip is None or ip.empty:
            return None
        label_col = ip.columns[0]
        rows = {str(r[label_col]).strip(): r for _, r in ip.iterrows()}

        def g(label, col):
            r = rows.get(label)
            return _num(r.get(col)) if r is not None else None

        net = g("Net Shares Purchased (Sold)", "Shares")
        data = {
            "buy_shares": g("Purchases", "Shares"), "buy_trans": g("Purchases", "Trans"),
            "sell_shares": g("Sales", "Shares"), "sell_trans": g("Sales", "Trans"),
            "net_shares": net, "net_pct": g("% Net Shares Purchased (Sold)", "Shares"),
        }
        if net is None and data["buy_shares"] is None and data["sell_shares"] is None:
            return None
        data["sentiment"] = "buying" if (net or 0) > 0 else ("selling" if (net or 0) < 0 else "flat")
        return data
    except Exception:  # noqa: BLE001
        return None


def fetch_buzz(ticker):
    """Headline volume over the last 7/30 days (a proxy for 'mentions'/attention)."""
    items = fetch_news(ticker, limit=25)
    now = datetime.datetime.now(datetime.timezone.utc)
    c7 = c30 = 0
    for it in items:
        p = it.get("published")
        if not p:
            continue
        try:
            d = datetime.datetime.fromisoformat(p.replace("Z", "+00:00"))
            days = (now - d).total_seconds() / 86400.0
            if days <= 7:
                c7 += 1
            if days <= 30:
                c30 += 1
        except Exception:  # noqa: BLE001
            pass
    return {"count_7d": c7, "count_30d": c30, "total": len(items)}


_SIGNALS_CACHE = {}
SIGNALS_TTL_SECONDS = 3600


@app.route("/api/signals/<path:ticker>")
def api_signals(ticker):
    """Insider activity + news-buzz — surfaced as indicators, NOT part of the score."""
    t = ticker.strip().upper()
    now = time.time()
    cached = _SIGNALS_CACHE.get(t)
    if cached and now - cached["at"] < SIGNALS_TTL_SECONDS:
        return jsonify({"ticker": t, **cached["data"], "cached": True})
    data = {"insider": fetch_insider(t), "buzz": fetch_buzz(t)}
    _SIGNALS_CACHE[t] = {"data": data, "at": now}
    return jsonify({"ticker": t, **data, "cached": False})


@app.route("/api/news/<path:ticker>")
def api_news(ticker):
    now = time.time()
    cached = _NEWS_CACHE.get(ticker)
    if cached and now - cached["at"] < NEWS_TTL_SECONDS:
        return jsonify({"ticker": ticker, "items": cached["items"], "cached": True})
    items = fetch_news(ticker)
    _NEWS_CACHE[ticker] = {"items": items, "at": now}
    return jsonify({"ticker": ticker, "items": items, "cached": False})


# ---- AI Analyst (Claude-generated research reports) --------------------
_ANALYSIS_CACHE = {}
ANALYSIS_TTL_SECONDS = 86400  # 24h — reports are expensive; "Regenerate" forces


def detect_provider():
    """Which LLM backend to use, based on which key is present. Anthropic wins
    if both are set; otherwise Gemini (free tier)."""
    if os.environ.get("ANTHROPIC_API_KEY") or os.environ.get("ANTHROPIC_AUTH_TOKEN"):
        return "anthropic"
    if os.environ.get("GEMINI_API_KEY") or os.environ.get("GOOGLE_API_KEY"):
        return "gemini"
    return None


PROVIDER_LABEL = {"anthropic": "Claude (Opus 4.8)", "gemini": "Google Gemini"}


def has_api_key():
    return detect_provider() is not None


def _find_holding(payload, ticker):
    for layer in payload["layers"]:
        for h in layer["holdings"]:
            if h["ticker"] == ticker:
                return h
    return None


def _peer_holdings(payload, ticker, limit=4):
    """Same-layer peers, top by market cap, excluding the company itself."""
    idx = layer_index()
    my_layers = set(idx.get(ticker, []))
    seen, peers = set(), []
    for layer in payload["layers"]:
        if layer["id"] not in my_layers:
            continue
        for h in layer["holdings"]:
            if h["ticker"] == ticker or h["ticker"] in seen:
                continue
            if h["market"].get("market_cap") is not None:
                seen.add(h["ticker"])
                peers.append(h)
    peers.sort(key=lambda h: h["market"].get("market_cap") or 0, reverse=True)
    return peers[:limit]


def _fmt(v, kind=""):
    if v is None:
        return "n/a"
    if kind == "money":
        a = abs(v)
        if a >= 1e12: return f"${v/1e12:.2f}T"
        if a >= 1e9: return f"${v/1e9:.2f}B"
        if a >= 1e6: return f"${v/1e6:.1f}M"
        return f"${v:.0f}"
    if kind == "pct":
        return f"{v:+.1f}%"
    if kind == "frac":
        return f"{v*100:+.1f}%"
    if kind == "pctraw":          # value already in percent units (e.g. dividend yield)
        return f"{v:.2f}%"
    return f"{v:.2f}"


def _fmt_date(ts):
    """Unix seconds -> 'YYYY-MM-DD (in N days)' / 'N days ago'. 'n/a' if missing."""
    if not ts:
        return "n/a"
    try:
        d = datetime.datetime.utcfromtimestamp(int(ts)).date()
        delta = (d - datetime.date.today()).days
        when = "today" if delta == 0 else (f"in {delta} days" if delta > 0 else f"{-delta} days ago")
        return f"{d.isoformat()} ({when})"
    except Exception:  # noqa: BLE001
        return "n/a"


def _metrics_line(m):
    return (
        f"price {_fmt(m.get('price'))}, mkt cap {_fmt(m.get('market_cap'),'money')}, "
        f"P/E ttm {_fmt(m.get('trailing_pe'))}, P/E fwd {_fmt(m.get('forward_pe'))}, "
        f"P/S {_fmt(m.get('price_to_sales'))}, EV/EBITDA {_fmt(m.get('ev_ebitda'))}, "
        f"P/B {_fmt(m.get('price_to_book'))}, PEG {_fmt(m.get('peg'))}, "
        f"rev growth {_fmt(m.get('revenue_growth'),'frac')}, gross margin {_fmt(m.get('gross_margin'),'frac')}, "
        f"op margin {_fmt(m.get('operating_margin'),'frac')}, net margin {_fmt(m.get('profit_margin'),'frac')}, "
        f"ROE {_fmt(m.get('roe'),'frac')}, ROA {_fmt(m.get('roa'),'frac')}, "
        f"debt/equity {_fmt(m.get('debt_to_equity'))}, current ratio {_fmt(m.get('current_ratio'))}, "
        f"FCF {_fmt(m.get('free_cashflow'),'money')}, beta {_fmt(m.get('beta'))}, "
        f"div yield {_fmt(m.get('dividend_yield'),'pctraw')}, "
        f"analyst target {_fmt(m.get('target_mean_price'))} (upside {_fmt(m.get('implied_upside'),'pct')}, "
        f"rating {m.get('recommendation_key') or 'n/a'} {_fmt(m.get('recommendation_mean'))}/5 "
        f"from {_fmt(m.get('num_analysts'))} analysts), "
        f"% off 52w high {_fmt(m.get('pct_off_high'),'pct')}, vs 200d MA {_fmt(m.get('pct_vs_ma200'),'pct')}"
    )


def build_context(holding, peers, news, score, score_parts):
    m = holding["market"]
    cur = m.get("currency")
    lines = [
        f"Company: {holding['name']} ({holding['ticker']})",
        f"AI-data-center layer(s): {', '.join(holding.get('also_in', []) + []) or 'see thesis'}",
        f"Thematic exposure rating: {holding.get('exposure')}",
        f"One-line thesis: {holding.get('thesis')}",
        f"Currency: {cur or 'USD'}" + (" (figures converted to USD)" if cur and cur != "USD" else ""),
        f"Metrics: {_metrics_line(m)}",
        f"Next scheduled earnings date: {_fmt_date(m.get('earnings_ts'))} "
        f"(use this real date for the catalyst calendar instead of estimating)",
    ]
    if score is not None:
        parts = score_parts or {}
        pstr = ", ".join(f"{k} {v}" for k, v in parts.items())
        lines.append(f"App composite score: {score}/100 (factor percentiles: {pstr})")
    if peers:
        lines.append("Peers (same layer):")
        for p in peers:
            lines.append(f"  - {p['name']} ({p['ticker']}): {_metrics_line(p['market'])}")
    if news:
        lines.append("Recent headlines:")
        for n in news:
            when = (n.get("published") or "")[:10]
            lines.append(f"  - {n['title']} [{n.get('publisher','')}, {when}]")
    lines.append("(Data via Yahoo Finance; may be delayed or incomplete. Assistant knowledge cutoff applies to anything not listed here.)")
    return "\n".join(lines)


def _gen_anthropic(system, user):
    import anthropic
    client = anthropic.Anthropic()
    with client.messages.stream(
        model="claude-opus-4-8",
        max_tokens=8000,
        thinking={"type": "adaptive"},
        output_config={"effort": "medium"},
        system=system,
        messages=[{"role": "user", "content": user}],
    ) as stream:
        msg = stream.get_final_message()
    text = "".join(b.text for b in msg.content if b.type == "text")
    return text, "claude-opus-4-8"


def _clean_markdown(t):
    """Tidy LLM output: kill degenerate whitespace runs (flash models sometimes
    emit thousands of spaces), strip trailing spaces, collapse blank lines."""
    t = t.replace("\r", "")
    t = re.sub(r"[ \t]{4,}", " ", t)                  # 4+ spaces -> 1 (keeps 2-space nesting)
    t = "\n".join(line.rstrip() for line in t.split("\n"))
    t = re.sub(r"\n{3,}", "\n\n", t)
    return t.strip()


def _gen_gemini(system, user):
    import requests
    key = os.environ.get("GEMINI_API_KEY") or os.environ.get("GOOGLE_API_KEY")
    model = os.environ.get("GEMINI_MODEL", "gemini-2.5-flash")
    gen_cfg = {"maxOutputTokens": 16384, "temperature": 0.4}
    if "2.5" in model:  # 2.5 models think by default; disable so output budget isn't eaten
        gen_cfg["thinkingConfig"] = {"thinkingBudget": 0}
    body = {
        "systemInstruction": {"parts": [{"text": system}]},
        "contents": [{"role": "user", "parts": [{"text": user}]}],
        "generationConfig": gen_cfg,
    }
    url = f"https://generativelanguage.googleapis.com/v1beta/models/{model}:generateContent"
    r = requests.post(url, headers={"x-goog-api-key": key, "Content-Type": "application/json"},
                      json=body, timeout=120)
    if r.status_code != 200:
        raise RuntimeError(f"Gemini API {r.status_code}: {r.text[:300]}")
    data = r.json()
    cands = data.get("candidates") or []
    if not cands:
        raise RuntimeError(f"Gemini returned no candidates ({str(data)[:200]})")
    parts = (cands[0].get("content") or {}).get("parts") or []
    text = "".join(p.get("text", "") for p in parts).strip()
    if not text:
        raise RuntimeError(f"Gemini returned empty text (finishReason={cands[0].get('finishReason')})")
    return text, model


def generate_report(system, user):
    provider = detect_provider()
    if provider == "anthropic":
        text, model = _gen_anthropic(system, user)
    elif provider == "gemini":
        text, model = _gen_gemini(system, user)
    else:
        raise RuntimeError("No API key configured.")
    return _clean_markdown(text), model


@app.route("/api/report-types")
def api_report_types():
    provider = detect_provider()
    return jsonify({
        "reports": [{"id": r["id"], "label": r["label"], "icon": r["icon"]} for r in REPORTS],
        "has_key": provider is not None,
        "provider": PROVIDER_LABEL.get(provider, ""),
    })


@app.route("/api/analyze", methods=["POST"])
def api_analyze():
    data = request.get_json(force=True, silent=True) or {}
    ticker = data.get("ticker")
    rtype = data.get("type")
    force = bool(data.get("force"))
    if not ticker or rtype not in REPORTS_BY_ID:
        return jsonify({"ok": False, "error": "Provide a valid ticker and report type."}), 400

    cache_key = (ticker, rtype)
    now = time.time()
    cached = _ANALYSIS_CACHE.get(cache_key)
    if cached and not force and now - cached["at"] < ANALYSIS_TTL_SECONDS:
        return jsonify({"ok": True, "markdown": cached["markdown"], "cached": True,
                        "generated": True, "model": cached.get("model", "")})

    payload = _CACHE["data"] or build_payload()
    holding = _find_holding(payload, ticker)
    if not holding:
        return jsonify({"ok": False, "error": f"{ticker} is not in the universe."}), 404

    peers = _peer_holdings(payload, ticker)
    news = fetch_news(ticker, limit=8)
    ctx = build_context(holding, peers, news, data.get("score"), data.get("score_parts"))
    peer_str = ", ".join(f"{p['name']} ({p['ticker']})" for p in peers)
    system, user = build_messages(rtype, ctx, holding["name"], ticker, peer_str)

    if not has_api_key():
        return jsonify({"ok": True, "generated": False, "need_key": True,
                        "prompt": system + "\n\n" + user})
    try:
        md, model = generate_report(system, user)
    except Exception as exc:  # noqa: BLE001 — surface error + let user copy the prompt
        return jsonify({"ok": False, "error": str(exc), "prompt": system + "\n\n" + user})

    _ANALYSIS_CACHE[cache_key] = {"markdown": md, "at": now, "model": model}
    return jsonify({"ok": True, "markdown": md, "cached": False, "generated": True, "model": model})


# ---- Stock Lookup + layer recommendation ------------------------------
LAYER_NAME = {L["id"]: L["name"] for L in LAYERS}
LAYER_KEYWORDS = {
    "land":       ["reit", "real estate", "real-estate", "construction", "engineering & construction",
                   "building material", "aggregate", "cement", "property", "data center reit"],
    "power":      ["utilit", "electric", "power", "nuclear", "uranium", "transformer", "switchgear",
                   "electrical equipment", "electrical component", "generator", "turbine", "grid",
                   "renewable", "solar", "independent power", "fuel cell"],
    "cooling":    ["hvac", "cooling", "thermal", "heat", "climate", "refriger", "air condition",
                   "building products & equipment"],
    "compute":    ["semiconductor", "chip", "gpu", "memory", "foundry", "wafer", "processor",
                   "computer hardware", "server", "electronic component", "integrated circuit",
                   "semiconductor equipment", "packaging"],
    "networking": ["network", "communication equipment", "optical", "fiber", "fibre", "connector",
                   "telecom equipment", "switching", "interconnect", "transceiver"],
    "software":   ["software", "cloud", "internet", "information technology services", "application",
                   "saas", "platform", "analytics", "cybersecurity", "it services", "data center"],
}


def recommend_layer(sector, industry, summary):
    sources = [((industry or "").lower(), 3), ((sector or "").lower(), 2), ((summary or "").lower(), 1)]
    ranked = []
    for lid, kws in LAYER_KEYWORDS.items():
        score, matched = 0, []
        for text, weight in sources:
            for kw in kws:
                if kw in text and kw not in matched:
                    score += weight
                    matched.append(kw)
        ranked.append({"layer": lid, "name": LAYER_NAME.get(lid, lid), "score": score, "matched": matched})
    ranked.sort(key=lambda r: r["score"], reverse=True)
    total = sum(r["score"] for r in ranked) or 1
    for r in ranked:
        r["confidence"] = round(r["score"] / total * 100) if r["score"] else 0
    best = ranked[0] if ranked[0]["score"] > 0 else None
    return best, ranked


def lookup_stock(ticker):
    try:
        info = yf.Ticker(ticker).info or {}
    except Exception as exc:  # noqa: BLE001
        return {"ticker": ticker, "ok": False, "error": str(exc)[:160]}
    name = info.get("longName") or info.get("shortName")
    price = _num(info.get("currentPrice")) or _num(info.get("regularMarketPrice"))
    mcap = _num(info.get("marketCap"))
    if not name and price is None and mcap is None:
        return {"ticker": ticker, "ok": False, "error": "No data found for that ticker."}
    cur = info.get("currency")
    out = {
        "ticker": ticker, "ok": True, "name": name or ticker,
        "sector": info.get("sector"), "industry": info.get("industry"),
        "summary": (info.get("longBusinessSummary") or "").strip()[:1000],
        "currency": cur, "price": price, "market_cap": mcap,
        "trailing_pe": _num(info.get("trailingPE")), "forward_pe": _num(info.get("forwardPE")),
        "price_to_sales": _num(info.get("priceToSalesTrailing12Months")),
        "ev_ebitda": _num(info.get("enterpriseToEbitda")),
        "revenue_growth": _num(info.get("revenueGrowth")), "profit_margin": _num(info.get("profitMargins")),
    }
    if cur and cur != "USD":          # USD-normalize foreign listings for display
        rate = fx_rate(cur)
        if rate:
            out["fx_rate"] = rate
            for k in ("price", "market_cap"):
                if out.get(k) is not None:
                    out[k] = out[k] / rate
    return out


@app.route("/api/layers")
def api_layers():
    return jsonify({"layers": [{"id": L["id"], "name": L["name"]} for L in LAYERS]})


@app.route("/api/lookup/<path:ticker>")
def api_lookup(ticker):
    t = ticker.strip().upper()
    data = lookup_stock(t)
    data["ticker"] = t
    if data.get("ok"):
        data["existing_layers"] = layer_index().get(t, [])
        best, ranked = recommend_layer(data.get("sector"), data.get("industry"), data.get("summary"))
        data["recommend"] = best
        data["ranked"] = ranked
    return jsonify(data)


@app.route("/api/add-stock", methods=["POST"])
def api_add_stock():
    d = request.get_json(force=True, silent=True) or {}
    t = (d.get("ticker") or "").strip().upper()
    layer = d.get("layer")
    if not t or layer not in {L["id"] for L in LAYERS}:
        return jsonify({"ok": False, "error": "Provide a ticker and a valid layer."}), 400
    exposure = d.get("exposure", "moderate")
    if exposure not in EXPOSURE_LEVELS:
        exposure = "moderate"
    tags = d.get("tags") or []
    if isinstance(tags, str):
        tags = [x.strip() for x in tags.split(",") if x.strip()]
    item = {"ticker": t, "name": (d.get("name") or t), "exposure": exposure,
            "tags": tags, "thesis": (d.get("thesis") or ""), "layer": layer}
    add_user_stock(item)
    _CACHE["data"] = None
    _CACHE["fetched_at"] = 0.0          # force re-fetch so the new ticker loads
    return jsonify({"ok": True, "item": item})


@app.route("/api/remove-stock", methods=["POST"])
def api_remove_stock():
    d = request.get_json(force=True, silent=True) or {}
    t = (d.get("ticker") or "").strip().upper()
    layer = d.get("layer")
    if not t or not layer:
        return jsonify({"ok": False, "error": "Provide ticker and layer."}), 400
    remove_user_stock(t, layer)
    _CACHE["data"] = None
    _CACHE["fetched_at"] = 0.0
    return jsonify({"ok": True})


@app.route("/api/user-stocks")
def api_user_stocks():
    return jsonify({"items": load_user_stocks()})


@app.route("/api/refresh")
def api_refresh():
    """Force-bust the cache, then re-fetch."""
    _CACHE["data"] = None
    _CACHE["fetched_at"] = 0.0
    return api_screen()


# ---- History / trends (SQLite snapshots) ------------------------------
@app.route("/api/snapshot", methods=["POST"])
def api_snapshot():
    """Record today's snapshot. The frontend owns the composite score, so it
    posts the rows (price + universe-basis score + a couple of trend metrics)."""
    d = request.get_json(force=True, silent=True) or {}
    rows = d.get("rows") or []
    n = history.record(rows)
    return jsonify({"ok": True, "recorded": n})


@app.route("/api/deltas")
def api_deltas():
    """Day-over-day (≈1d) and ≈7d change per ticker, from stored snapshots."""
    return jsonify({"deltas": history.deltas()})


@app.route("/api/history/<path:ticker>")
def api_history(ticker):
    """Chronological price/score series for one ticker (sparklines)."""
    return jsonify({"ticker": ticker, "series": history.series(ticker.strip().upper())})


if __name__ == "__main__":
    port = int(os.environ.get("PORT", 5050))
    print(f"AI Data Center Screener -> http://127.0.0.1:{port}")
    app.run(debug=True, port=port)
