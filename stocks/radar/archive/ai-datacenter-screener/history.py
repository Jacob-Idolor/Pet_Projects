"""
Time-series history for the screener — a tiny SQLite layer.

One row per (ticker, day): the price, the app's composite score, and a couple of
trend metrics. The frontend POSTs a snapshot after each load (it owns the score
calculation), and we serve back day-over-day deltas and per-ticker series so the
dashboard can show what changed and draw sparklines.

We deliberately store the UNIVERSE-basis score (stable, independent of the user's
Universe/Layer toggle) so history stays comparable over time.
"""

import datetime
import sqlite3
import threading
import time

_LOCK = threading.Lock()
_DB_PATH = None

# fields captured per snapshot (besides the ticker/date/ts keys)
_FIELDS = ("price", "score", "market_cap", "pct_off_high", "pct_vs_ma200")


def configure(db_path):
    """Point the module at a database file and create the schema if needed."""
    global _DB_PATH
    _DB_PATH = db_path
    with _LOCK, _conn() as c:
        c.execute(
            """CREATE TABLE IF NOT EXISTS snapshots (
                   ticker TEXT NOT NULL,
                   date   TEXT NOT NULL,          -- YYYY-MM-DD (local)
                   ts     REAL NOT NULL,          -- unix seconds of capture
                   price  REAL, score INTEGER, market_cap REAL,
                   pct_off_high REAL, pct_vs_ma200 REAL,
                   PRIMARY KEY (ticker, date)
               )"""
        )


def _conn():
    c = sqlite3.connect(_DB_PATH)
    c.row_factory = sqlite3.Row
    return c


def _num(v):
    try:
        return None if v is None else float(v)
    except (TypeError, ValueError):
        return None


def record(rows, day=None):
    """Upsert today's snapshot for each row (re-running the same day overwrites).
    `rows` is a list of dicts with at least 'ticker'. Returns count written."""
    if not _DB_PATH:
        return 0
    day = day or datetime.date.today().isoformat()
    ts = time.time()
    payload = []
    for r in rows:
        tk = r.get("ticker")
        if not tk:
            continue
        payload.append((tk, day, ts, _num(r.get("price")),
                        r.get("score") if isinstance(r.get("score"), (int, float)) else None,
                        _num(r.get("market_cap")), _num(r.get("pct_off_high")), _num(r.get("pct_vs_ma200"))))
    if not payload:
        return 0
    with _LOCK, _conn() as c:
        c.executemany(
            "INSERT OR REPLACE INTO snapshots "
            "(ticker, date, ts, price, score, market_cap, pct_off_high, pct_vs_ma200) "
            "VALUES (?, ?, ?, ?, ?, ?, ?, ?)", payload)
    return len(payload)


def _pchg(a, b):
    if a is None or not b:
        return None
    return (a - b) / b * 100.0


def _diff(a, b):
    if a is None or b is None:
        return None
    return a - b


def deltas():
    """Map ticker -> change vs the previous snapshot (≈1d) and vs the snapshot
    closest to 7 days before the latest (≈7d). 'days' = points stored for it."""
    if not _DB_PATH:
        return {}
    by_ticker = {}
    with _LOCK, _conn() as c:
        for r in c.execute("SELECT ticker, date, price, score FROM snapshots ORDER BY ticker, date"):
            by_ticker.setdefault(r["ticker"], []).append(r)
    out = {}
    for tk, rows in by_ticker.items():
        latest = rows[-1]
        prev1 = rows[-2] if len(rows) >= 2 else None
        cutoff = (datetime.date.fromisoformat(latest["date"]) - datetime.timedelta(days=7)).isoformat()
        prev7 = None
        for r in rows[:-1]:
            if r["date"] <= cutoff:
                prev7 = r
        out[tk] = {
            "price_1d": _pchg(latest["price"], prev1["price"]) if prev1 else None,
            "price_7d": _pchg(latest["price"], prev7["price"]) if prev7 else None,
            "score_1d": _diff(latest["score"], prev1["score"]) if prev1 else None,
            "score_7d": _diff(latest["score"], prev7["score"]) if prev7 else None,
            "days": len(rows),
        }
    return out


def series(ticker, limit=60):
    """Chronological [{date, price, score}] for one ticker (for sparklines)."""
    if not _DB_PATH:
        return []
    with _LOCK, _conn() as c:
        rows = [dict(r) for r in c.execute(
            "SELECT date, price, score FROM snapshots WHERE ticker = ? ORDER BY date DESC LIMIT ?",
            (ticker, limit))]
    rows.reverse()
    return rows
