"""
Backtest / validation of the composite score.

Reconstructs a daily, close-of-day composite score over a lookback window and
measures whether higher scores preceded higher forward returns — the test of
whether the score is actually predictive.

IMPORTANT APPROXIMATION (free data has no point-in-time fundamentals):
  • Price-driven inputs ARE recomputed each day from real historical closes:
    the moving-average / 52-week technicals, and the valuation multiples
    (P/E, P/S, EV/EBITDA, P/B, PEG) + FCF yield + analyst upside, which scale
    with price.
  • Slow statement inputs (margins, ROE/ROA, revenue/earnings growth, debt,
    current ratio, beta, analyst rating, thematic exposure) are HELD at today's
    values. They move quarterly, not daily, so this is a standard, disclosed
    simplification — but it means the absolute scores drift toward today's
    fundamentals the further back you look.

The factor weights / metrics below MIRROR `SCORE_FACTORS` in static/app.js — keep
the two in sync if you change the live scoring.
"""

import numpy as np
import pandas as pd
import yfinance as yf

import history

WEIGHTS = {"valuation": 0.18, "moat": 0.20, "growth": 0.14, "technical": 0.15,
           "health": 0.10, "consensus": 0.08, "exposure": 0.15}
EXPOSURE_SCORE = {"pure": 1.0, "high": 0.7, "moderate": 0.4, "diversified": 0.15}

# factor -> list of (metric_key, direction, positive_only); excludes the special exposure factor
FACTORS = {
    "valuation": [("forward_pe", -1, True), ("trailing_pe", -1, True), ("price_to_sales", -1, True),
                  ("ev_ebitda", -1, True), ("price_to_book", -1, True), ("peg", -1, True), ("fcf_yield", 1, False)],
    "moat": [("gross_margin", 1, False), ("operating_margin", 1, False), ("profit_margin", 1, False),
             ("roe", 1, False), ("roa", 1, False)],
    "growth": [("revenue_growth", 1, False), ("earnings_growth", 1, False), ("rule_of_40", 1, False)],
    "technical": [("pct_vs_ma50", 1, False), ("pct_vs_ma200", 1, False), ("range_pos", 1, False),
                  ("pct_off_high", 1, False), ("week52_change", 1, False)],
    "health": [("debt_to_equity", -1, True), ("current_ratio", 1, False), ("beta", -1, True)],
    "consensus": [("implied_upside", 1, False), ("recommendation_mean", -1, True)],
}
PRICE_MULTIPLES = ["forward_pe", "trailing_pe", "price_to_sales", "ev_ebitda", "price_to_book", "peg"]
HELD_CONSTANT = ["gross_margin", "operating_margin", "profit_margin", "roe", "roa",
                 "revenue_growth", "earnings_growth", "debt_to_equity", "current_ratio", "beta", "recommendation_mean"]


def _num(v):
    try:
        f = float(v)
        return f if f == f else np.nan
    except (TypeError, ValueError):
        return np.nan


def _reconstruct(current):
    """Download 2y of closes and rebuild the daily composite score (see module
    docstring). Returns (close, composite, matrices) — or None if data is too thin.
    `matrices` includes market_cap / pct_off_high / pct_vs_ma200 for backfilling."""
    tickers = [t for t, m in current.items() if not np.isnan(_num(m.get("price")))]
    if len(tickers) < 20:
        return None

    raw = yf.download(tickers, period="2y", interval="1d", auto_adjust=True, progress=False, threads=True)
    close = raw["Close"] if isinstance(raw.columns, pd.MultiIndex) else raw
    if isinstance(close, pd.Series):
        close = close.to_frame()
    close = close.dropna(how="all")
    tickers = [t for t in tickers if t in close.columns and close[t].notna().sum() > 60]
    close = close[tickers]
    if len(tickers) < 20 or len(close) < 120:
        return None

    P_now = close.ffill().iloc[-1]                       # latest close per ticker
    ratio = close.divide(P_now, axis=1)                  # P_d / P_now  (dates × tickers)

    # ---- per-metric matrices (dates × tickers) -------------------------
    cur = lambda k: pd.Series({t: _num(current[t].get(k)) for t in tickers})
    M = {}
    for k in PRICE_MULTIPLES:
        M[k] = ratio.multiply(cur(k), axis=1)            # multiples scale with price
    M["market_cap"] = ratio.multiply(cur("market_cap"), axis=1)
    # fcf yield = free_cashflow / market_cap → scales inversely with price
    fcfy = pd.Series({t: (_num(current[t].get("free_cashflow")) / _num(current[t].get("market_cap")))
                      if _num(current[t].get("market_cap")) else np.nan for t in tickers})
    M["fcf_yield"] = ratio.rdiv(1.0).multiply(fcfy, axis=1)   # (1/ratio) * fcfy_now
    # analyst implied upside vs a held-constant target price
    u = cur("implied_upside")
    M["implied_upside"] = (ratio.rdiv(1.0).multiply(1.0 + u / 100.0, axis=1) - 1.0) * 100.0
    # held-constant statement metrics (broadcast today's value across all days)
    for k in HELD_CONSTANT:
        M[k] = pd.DataFrame(np.tile(cur(k).values, (len(close), 1)), index=close.index, columns=tickers)
    # rule_of_40 derived from held-constant revenue_growth + operating_margin (both in fractions → *100 → %)
    M["rule_of_40"] = M["revenue_growth"].multiply(100).add(M["operating_margin"].multiply(100))
    # technicals from real historical closes
    ma50, ma200 = close.rolling(50, min_periods=30).mean(), close.rolling(200, min_periods=120).mean()
    hi, lo = close.rolling(252, min_periods=60).max(), close.rolling(252, min_periods=60).min()
    M["pct_vs_ma50"] = (close - ma50) / ma50 * 100
    M["pct_vs_ma200"] = (close - ma200) / ma200 * 100
    M["pct_off_high"] = (close - hi) / hi * 100
    M["range_pos"] = (close - lo) / (hi - lo)
    M["week52_change"] = close.pct_change(252)

    # ---- daily composite score -----------------------------------------
    composite = pd.DataFrame(0.0, index=close.index, columns=tickers)
    for factor, metrics in FACTORS.items():
        fsum = pd.DataFrame(0.0, index=close.index, columns=tickers)
        fcnt = pd.DataFrame(0.0, index=close.index, columns=tickers)
        for key, direction, pos in metrics:
            m = M[key].copy()
            if pos:
                m = m.where(m > 0)
            # winsorize per day (across tickers) at 2nd/98th pct — mirrors computeScores in app.js
            lo_q = m.quantile(0.02, axis=1)
            hi_q = m.quantile(0.98, axis=1)
            m = m.clip(lower=lo_q, upper=hi_q, axis=0)
            pr = m.rank(axis=1, pct=True)                # 0..1 percentile across tickers, per day
            if direction == -1:
                pr = 1.0 - pr
            fsum = fsum.add(pr.fillna(0.0))
            fcnt = fcnt.add(pr.notna().astype(float))
        fscore = (fsum / fcnt.replace(0, np.nan)).fillna(0.5)   # neutral 0.5 when no data
        composite = composite.add(WEIGHTS[factor] * fscore)
    # exposure factor (constant per ticker)
    expo = pd.Series({t: EXPOSURE_SCORE.get(current[t].get("exposure"), 0.4) for t in tickers})
    composite = composite.add(WEIGHTS["exposure"] * pd.DataFrame(
        np.tile(expo.values, (len(close), 1)), index=close.index, columns=tickers))
    return close, composite * 100.0, M


def run(current, months=6, horizon=21):
    """Backtest: did higher scores precede higher forward returns? Returns a results dict."""
    rec = _reconstruct(current)
    if rec is None:
        return {"ok": False, "error": "Insufficient data / price history for a backtest."}
    close, composite, _M = rec

    # ---- forward returns + validation over the window ------------------
    fwd = close.shift(-horizon) / close - 1.0
    win = max(months * 21, 21)
    eligible = close.index[:-horizon]                    # days that have a forward return
    window = eligible[-win:] if len(eligible) > win else eligible

    ics, q_returns, hits = [], [], []
    for d in window:
        pair = pd.concat([composite.loc[d], fwd.loc[d]], axis=1, keys=["s", "f"]).dropna()
        if len(pair) < 25:
            continue
        ics.append(pair["s"].rank().corr(pair["f"].rank()))           # Spearman IC (no scipy)
        pair["q"] = (pair["s"].rank(pct=True) * 5).clip(upper=4.999).astype(int)
        qm = pair.groupby("q")["f"].mean()
        q_returns.append(qm.reindex(range(5)))
        if 0 in qm.index and 4 in qm.index:
            hits.append(1.0 if qm[4] > qm[0] else 0.0)

    if not q_returns:
        return {"ok": False, "error": "Not enough overlapping data to validate."}

    qdf = pd.concat(q_returns, axis=1).mean(axis=1) * 100.0           # mean fwd return % per quintile
    quintiles = [round(float(qdf.get(i, np.nan)), 2) if not np.isnan(qdf.get(i, np.nan)) else None for i in range(5)]
    ic_arr = np.array([x for x in ics if x == x])
    spread = (quintiles[4] - quintiles[0]) if (quintiles[0] is not None and quintiles[4] is not None) else None
    horizon_label = {5: "1 week", 10: "2 weeks", 21: "1 month", 42: "2 months", 63: "3 months"}.get(horizon, f"{horizon} days")

    return {
        "ok": True,
        "months": months, "horizon": horizon, "horizon_label": horizon_label,
        "n_tickers": composite.shape[1], "days_tested": len(ic_arr),
        "ic_mean": round(float(ic_arr.mean()), 4) if ic_arr.size else None,
        "ic_positive_rate": round(float((ic_arr > 0).mean()), 3) if ic_arr.size else None,
        "quintile_returns": quintiles,          # Q1 (lowest score) … Q5 (highest)
        "top_bottom_spread": round(spread, 2) if spread is not None else None,
        "hit_rate": round(float(np.mean(hits)), 3) if hits else None,
        "monotonic": all(quintiles[i] is not None and quintiles[i + 1] is not None and quintiles[i + 1] >= quintiles[i]
                         for i in range(4)),
    }


def _f(v):
    try:
        f = float(v)
        return None if f != f else round(f, 4)
    except (TypeError, ValueError):
        return None


def backfill_history(current, months=3):
    """Reconstruct daily close price + composite score for the last `months` and
    write them into history.db (so the per-ticker 'Price & score trend' sparklines
    show real history immediately). The most recent day is left to the live daily
    snapshot. Returns {days, tickers}."""
    rec = _reconstruct(current)
    if rec is None:
        return {"days": 0, "tickers": 0}
    close, composite, M = rec
    win = max(months * 21, 21)
    idx = list(close.index)
    days = idx[-(win + 1):-1] if len(idx) > win + 1 else idx[:-1]   # drop the latest day
    mc, poh, pma = M.get("market_cap"), M.get("pct_off_high"), M.get("pct_vs_ma200")
    written = 0
    for d in days:
        rows = []
        for t in composite.columns:
            price, score = close.at[d, t], composite.at[d, t]
            if price != price or score != score:           # skip NaN
                continue
            rows.append({
                "ticker": t, "price": round(float(price), 4), "score": int(round(float(score))),
                "market_cap": _f(mc.at[d, t]) if mc is not None else None,
                "pct_off_high": _f(poh.at[d, t]) if poh is not None else None,
                "pct_vs_ma200": _f(pma.at[d, t]) if pma is not None else None,
            })
        if rows:
            history.record(rows, day=d.strftime("%Y-%m-%d"))
            written += 1
    return {"days": written, "tickers": composite.shape[1]}
