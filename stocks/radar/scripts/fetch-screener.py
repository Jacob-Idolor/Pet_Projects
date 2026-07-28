#!/usr/bin/env python3
"""
Build-time AI data-center screener fetch → public/screener.json

Replaces the Flask /api/screen endpoint for static StockWatch hosting.
Run:  python scripts/fetch-screener.py
      npm run update-screener
"""

from __future__ import annotations

import json
import os
import sys
import time
from concurrent.futures import ThreadPoolExecutor, as_completed
from datetime import datetime, timezone

ROOT = os.path.abspath(os.path.join(os.path.dirname(__file__), ".."))
sys.path.insert(0, os.path.join(ROOT, "scripts", "datacenter"))

from universe import LAYERS, all_tickers, layer_index, is_excluded, market_overrides  # noqa: E402

try:
    import yfinance as yf
except ImportError:
    print("Missing yfinance. Install with: pip install -r scripts/datacenter/requirements.txt", file=sys.stderr)
    sys.exit(1)

OUT = os.path.join(ROOT, "public", "screener.json")
NEWS_OUT = os.path.join(ROOT, "public", "datacenter", "news.json")
MAX_WORKERS = int(os.environ.get("SCREENER_WORKERS", "10"))
FETCH_NEWS = os.environ.get("SCREENER_FETCH_NEWS", "1") != "0"


def _num(value):
    try:
        if value is None:
            return None
        f = float(value)
        if f != f:
            return None
        return f
    except (TypeError, ValueError):
        return None


_FX_CACHE: dict[str, float | None] = {}


def fx_rate(currency: str | None):
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


def fetch_one(ticker: str) -> dict:
    out = {
        "ticker": ticker,
        "ok": False,
        "price": None,
        "change_pct": None,
        "currency": None,
        "market_cap": None,
        "trailing_pe": None,
        "forward_pe": None,
        "price_to_sales": None,
        "ev_ebitda": None,
        "high_52w": None,
        "low_52w": None,
        "pct_off_high": None,
        "ma50": None,
        "ma200": None,
        "pct_vs_ma50": None,
        "pct_vs_ma200": None,
        "revenue_growth": None,
        "gross_margin": None,
        "profit_margin": None,
        "roe": None,
        "price_to_book": None,
        "peg": None,
        "free_cashflow": None,
        "operating_margin": None,
        "roa": None,
        "earnings_growth": None,
        "debt_to_equity": None,
        "current_ratio": None,
        "beta": None,
        "target_mean_price": None,
        "target_high_price": None,
        "target_low_price": None,
        "implied_upside": None,
        "num_analysts": None,
        "recommendation_key": None,
        "recommendation_mean": None,
        "dividend_yield": None,
        "earnings_ts": None,
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
        out["revenue_growth"] = _num(info.get("revenueGrowth"))
        out["gross_margin"] = _num(info.get("grossMargins"))
        out["profit_margin"] = _num(info.get("profitMargins"))
        out["operating_margin"] = _num(info.get("operatingMargins"))
        out["roe"] = _num(info.get("returnOnEquity"))
        out["roa"] = _num(info.get("returnOnAssets"))
        out["earnings_growth"] = _num(info.get("earningsGrowth"))
        out["price_to_book"] = _num(info.get("priceToBook"))
        out["peg"] = _num(info.get("trailingPegRatio")) or _num(info.get("pegRatio"))
        out["free_cashflow"] = _num(info.get("freeCashflow"))
        out["debt_to_equity"] = _num(info.get("debtToEquity"))
        out["current_ratio"] = _num(info.get("currentRatio"))
        out["beta"] = _num(info.get("beta"))
        out["target_mean_price"] = _num(info.get("targetMeanPrice"))
        out["target_high_price"] = _num(info.get("targetHighPrice"))
        out["target_low_price"] = _num(info.get("targetLowPrice"))
        out["num_analysts"] = _num(info.get("numberOfAnalystOpinions"))
        out["recommendation_key"] = info.get("recommendationKey")
        out["recommendation_mean"] = _num(info.get("recommendationMean"))
        if price and out["target_mean_price"]:
            out["implied_upside"] = (out["target_mean_price"] - price) / price * 100.0
        out["dividend_yield"] = _num(info.get("dividendYield"))
        out["earnings_ts"] = _num(info.get("earningsTimestampStart")) or _num(info.get("earningsTimestamp"))
        if price and out["high_52w"]:
            out["pct_off_high"] = (price - out["high_52w"]) / out["high_52w"] * 100.0
        if price and out["ma50"]:
            out["pct_vs_ma50"] = (price - out["ma50"]) / out["ma50"] * 100.0
        if price and out["ma200"]:
            out["pct_vs_ma200"] = (price - out["ma200"]) / out["ma200"] * 100.0
        out["ok"] = price is not None
    except Exception as exc:  # noqa: BLE001
        out["error"] = str(exc)
    return out


def fetch_news(ticker: str, limit: int = 6) -> list[dict]:
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
                    published = (datetime.utcfromtimestamp(ts)
                                 .replace(tzinfo=timezone.utc).isoformat())
                except Exception:  # noqa: BLE001
                    published = None
        if title and url:
            out.append({
                "title": title,
                "publisher": publisher or "",
                "url": url,
                "published": published,
            })
        if len(out) >= limit:
            break
    return out


def fetch_all(tickers: list[str]) -> dict[str, dict]:
    results: dict[str, dict] = {}
    with ThreadPoolExecutor(max_workers=MAX_WORKERS) as pool:
        futures = {pool.submit(fetch_one, t): t for t in tickers}
        for fut in as_completed(futures):
            data = fut.result()
            results[data["ticker"]] = data
    return results


def build_payload() -> dict:
    tickers = all_tickers()
    print(f"Fetching {len(tickers)} tickers…")
    market = fetch_all(tickers)
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
            cur = md.get("currency")
            if cur and cur != "USD":
                rate = fx_rate(cur)
                if rate:
                    md["fx_rate"] = rate
                    for k in (
                        "market_cap", "price", "high_52w", "low_52w", "ma50", "ma200",
                        "free_cashflow", "target_mean_price", "target_high_price", "target_low_price",
                    ):
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
    states: dict[str, int] = {}
    for m in market.values():
        s = m.get("market_state")
        if s:
            states[s] = states.get(s, 0) + 1
    market_state = max(states, key=states.get) if states else None

    return {
        "fetched_at": time.time(),
        "fetched_at_iso": datetime.now(timezone.utc).isoformat(),
        "ticker_count": len(market),
        "ok_count": ok_count,
        "market_state": market_state,
        "cached": False,
        "layers": layers_out,
    }


def build_news(tickers: list[str]) -> dict[str, list]:
    print(f"Fetching news for {len(tickers)} tickers…")
    news: dict[str, list] = {}
    with ThreadPoolExecutor(max_workers=MAX_WORKERS) as pool:
        futures = {pool.submit(fetch_news, t): t for t in tickers}
        for fut in as_completed(futures):
            t = futures[fut]
            try:
                news[t] = fut.result()
            except Exception:  # noqa: BLE001
                news[t] = []
    return news


def main() -> int:
    payload = build_payload()
    os.makedirs(os.path.dirname(OUT), exist_ok=True)
    with open(OUT, "w", encoding="utf-8") as f:
        json.dump(payload, f)
    print(f"Wrote {OUT} ({payload['ok_count']}/{payload['ticker_count']} ok)")

    if FETCH_NEWS:
        news = build_news(all_tickers())
        os.makedirs(os.path.dirname(NEWS_OUT), exist_ok=True)
        with open(NEWS_OUT, "w", encoding="utf-8") as f:
            json.dump({"fetched_at": time.time(), "news": news}, f)
        print(f"Wrote {NEWS_OUT}")
    else:
        print("Skipped news (SCREENER_FETCH_NEWS=0)")

    return 0 if payload["ok_count"] > 0 else 1


if __name__ == "__main__":
    raise SystemExit(main())
