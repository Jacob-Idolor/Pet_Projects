#!/usr/bin/env python3
"""Build the daily NBIS research snapshot.

The output is deliberately static JSON so the site needs no database or
always-on server. Yahoo Finance supplies market and statement data through
yfinance; SEC submissions and company facts are fetched from the official
EDGAR APIs. The page displays retrieval times and source links so stale or
missing data is visible instead of being silently filled with estimates.
"""

from __future__ import annotations

import json
import math
import os
import re
import sys
import time
from datetime import date, datetime, timezone
from pathlib import Path
from typing import Any

import requests

try:
    import yfinance as yf
    import yfinance.cache as yf_cache
except ImportError:
    print("Missing yfinance. Install with: pip install -r scripts/datacenter/requirements.txt", file=sys.stderr)
    raise SystemExit(1)


ROOT = Path(__file__).resolve().parents[2]
OUT = ROOT / "public" / "nbis.json"
PROFILE_PATH = ROOT / "src" / "data" / "nbis-profile.json"
TICKER = "NBIS"
CIK = "0001513845"
SEC_SUBMISSIONS_URL = f"https://data.sec.gov/submissions/CIK{CIK}.json"
SEC_FACTS_URL = f"https://data.sec.gov/api/xbrl/companyfacts/CIK{CIK}.json"
YAHOO_URL = "https://finance.yahoo.com/quote/NBIS/"

# Keep yfinance's cookie/time-zone cache inside the checkout. This makes the
# fetcher reproducible in CI and avoids depending on a writable user profile.
YF_CACHE = ROOT / ".cache" / "yfinance"
YF_CACHE.mkdir(parents=True, exist_ok=True)
try:
    yf_cache.set_cache_location(str(YF_CACHE))
    yf.set_tz_cache_location(str(YF_CACHE))
except Exception as error:  # pragma: no cover - provider-version fallback
    print(f"Warning: could not configure yfinance cache location: {error}", file=sys.stderr)


def now_iso() -> str:
    return datetime.now(timezone.utc).isoformat()


def number(value: Any) -> float | None:
    """Convert provider values to JSON-safe finite floats."""
    if value is None:
        return None
    try:
        if hasattr(value, "item"):
            value = value.item()
        value = float(value)
        return value if math.isfinite(value) else None
    except (TypeError, ValueError, OverflowError):
        return None


def text(value: Any) -> str | None:
    if value is None:
        return None
    value = str(value).strip()
    return value or None


def iso_date(value: Any) -> str | None:
    if value is None:
        return None
    if isinstance(value, datetime):
        return value.date().isoformat()
    if isinstance(value, date):
        return value.isoformat()
    if hasattr(value, "date"):
        try:
            return value.date().isoformat()
        except Exception:  # noqa: BLE001
            pass
    raw = str(value)
    return raw[:10] if re.match(r"^\d{4}-\d{2}-\d{2}", raw) else raw


def json_safe(value: Any) -> Any:
    if isinstance(value, dict):
        return {str(k): json_safe(v) for k, v in value.items()}
    if isinstance(value, (list, tuple)):
        return [json_safe(v) for v in value]
    if isinstance(value, (datetime, date)):
        return value.isoformat()
    if hasattr(value, "item"):
        try:
            return json_safe(value.item())
        except Exception:  # noqa: BLE001
            pass
    if isinstance(value, float) and not math.isfinite(value):
        return None
    return value


def first_number(info: dict[str, Any], *keys: str) -> float | None:
    for key in keys:
        value = number(info.get(key))
        if value is not None:
            return value
    return None


def pct_change(current: float | None, previous: float | None) -> float | None:
    if current is None or previous in (None, 0):
        return None
    return (current / previous - 1) * 100


def sma(values: list[float], period: int) -> float | None:
    if len(values) < period:
        return None
    return sum(values[-period:]) / period


def rsi(values: list[float], period: int = 14) -> float | None:
    if len(values) < period + 1:
        return None
    changes = [values[i] - values[i - 1] for i in range(1, len(values))]
    window = changes[-period:]
    gains = sum(max(c, 0) for c in window) / period
    losses = sum(max(-c, 0) for c in window) / period
    if losses == 0:
        return 100.0 if gains > 0 else 50.0
    return 100 - (100 / (1 + gains / losses))


def max_drawdown(values: list[float]) -> float | None:
    if not values:
        return None
    peak = values[0]
    worst = 0.0
    for value in values:
        peak = max(peak, value)
        if peak:
            worst = min(worst, (value / peak - 1) * 100)
    return worst


def fetch_sec_json(url: str, session: requests.Session) -> dict[str, Any]:
    response = session.get(url, timeout=30)
    response.raise_for_status()
    payload = response.json()
    if not isinstance(payload, dict):
        raise ValueError(f"SEC response was not an object: {url}")
    return payload


def statement_value(frame: Any, column: Any, labels: list[str]) -> float | None:
    if frame is None or getattr(frame, "empty", True):
        return None
    index = {str(item).lower(): item for item in frame.index}
    for label in labels:
        row = index.get(label.lower())
        if row is None:
            continue
        try:
            return number(frame.loc[row, column])
        except Exception:  # noqa: BLE001
            continue
    return None


def statement_rows(income: Any, cashflow: Any, balance: Any, frequency: str) -> list[dict[str, Any]]:
    columns: list[Any] = []
    for frame in (income, cashflow, balance):
        if frame is None or getattr(frame, "empty", True):
            continue
        for column in frame.columns:
            if column not in columns:
                columns.append(column)
    rows = []
    for column in sorted(columns, key=lambda item: iso_date(item) or "", reverse=True):
        row = {
            "period": iso_date(column),
            "frequency": frequency,
            "revenue": statement_value(income, column, ["Total Revenue", "Operating Revenue", "Revenue"]),
            "grossProfit": statement_value(income, column, ["Gross Profit"]),
            "operatingIncome": statement_value(income, column, ["Operating Income", "Operating Income Loss"]),
            "netIncome": statement_value(income, column, ["Net Income", "Net Income Common Stockholders", "Net Income Including Noncontrolling Interests"]),
            "ebitda": statement_value(income, column, ["EBITDA", "Normalized EBITDA"]),
            "operatingCashFlow": statement_value(cashflow, column, ["Operating Cash Flow", "Total Cash From Operating Activities"]),
            "capitalExpenditure": statement_value(cashflow, column, ["Capital Expenditure", "Capital Expenditure Reported"]),
            "freeCashFlow": statement_value(cashflow, column, ["Free Cash Flow"]),
            "cash": statement_value(balance, column, ["Cash Cash Equivalents And Short Term Investments", "Cash And Cash Equivalents", "Cash Financial"]),
            "totalDebt": statement_value(balance, column, ["Total Debt", "Total Debt And Equity"]),
            "totalAssets": statement_value(balance, column, ["Total Assets"]),
            "totalEquity": statement_value(balance, column, ["Stockholders Equity", "Total Equity Gross Minority Interest"]),
            "shares": statement_value(balance, column, ["Ordinary Shares Number", "Share Issued"]),
        }
        if any(value is not None for key, value in row.items() if key not in {"period", "frequency"}):
            rows.append(row)
    return rows[:8]


def build_price_data(history: Any, info: dict[str, Any]) -> tuple[dict[str, Any], dict[str, Any], list[dict[str, Any]]]:
    closes: list[float] = []
    volumes: list[float] = []
    series: list[dict[str, Any]] = []
    if history is not None and not getattr(history, "empty", True):
        for index, row in history.iterrows():
            close = number(row.get("Close"))
            if close is None:
                continue
            closes.append(close)
            volumes.append(number(row.get("Volume")) or 0)
            series.append({"date": iso_date(index), "close": close, "volume": number(row.get("Volume"))})

    current = closes[-1] if closes else first_number(info, "currentPrice", "regularMarketPrice")
    previous = closes[-2] if len(closes) > 1 else first_number(info, "previousClose", "regularMarketPreviousClose")
    one_year = closes[-252:] if closes else []
    one_year_returns = {
        "1d": pct_change(current, closes[-2] if len(closes) >= 2 else None),
        "1w": pct_change(current, closes[-6] if len(closes) >= 6 else None),
        "1m": pct_change(current, closes[-22] if len(closes) >= 22 else None),
        "3m": pct_change(current, closes[-64] if len(closes) >= 64 else None),
        "6m": pct_change(current, closes[-127] if len(closes) >= 127 else None),
        "1y": pct_change(current, closes[-253] if len(closes) >= 253 else None),
        "ytd": None,
    }
    if series:
        current_year = series[-1]["date"][:4]
        ytd_start = next((i for i, item in enumerate(series) if item["date"].startswith(current_year)), None)
        if ytd_start is not None and ytd_start > 0:
            one_year_returns["ytd"] = pct_change(current, closes[ytd_start - 1])

    daily_returns = [closes[i] / closes[i - 1] - 1 for i in range(1, len(closes)) if closes[i - 1]]
    recent_returns = daily_returns[-252:]
    volatility = None
    if len(recent_returns) >= 20:
        mean = sum(recent_returns) / len(recent_returns)
        variance = sum((x - mean) ** 2 for x in recent_returns) / (len(recent_returns) - 1)
        volatility = math.sqrt(variance) * math.sqrt(252) * 100

    price = {
        "symbol": TICKER,
        "provider": "Yahoo Finance",
        "currency": text(info.get("currency")) or "USD",
        "exchange": text(info.get("exchange")) or "NASDAQ",
        "quoteType": text(info.get("quoteType")),
        "current": current,
        "previousClose": previous,
        "open": number(info.get("regularMarketOpen")) or (number(history.iloc[-1].get("Open")) if series else None),
        "dayHigh": number(info.get("dayHigh")) or (number(history.iloc[-1].get("High")) if series else None),
        "dayLow": number(info.get("dayLow")) or (number(history.iloc[-1].get("Low")) if series else None),
        "change": (current - previous) if current is not None and previous is not None else None,
        "changePercent": pct_change(current, previous),
        "changePct": pct_change(current, previous),
        "volume": number(info.get("regularMarketVolume")) or (volumes[-1] if volumes else None),
        "averageVolume": first_number(info, "averageVolume", "averageDailyVolume10Day"),
        "marketCap": first_number(info, "marketCap", "impliedMarketCap"),
        "fiftyTwoWeekHigh": first_number(info, "fiftyTwoWeekHigh") or (max(one_year) if one_year else None),
        "fiftyTwoWeekLow": first_number(info, "fiftyTwoWeekLow") or (min(one_year) if one_year else None),
        "fetchedAt": now_iso(),
    }
    if price["current"] and price["fiftyTwoWeekHigh"]:
        price["pctOff52wHigh"] = pct_change(price["current"], price["fiftyTwoWeekHigh"])
    if price["current"] and price["fiftyTwoWeekLow"]:
        price["pctAbove52wLow"] = pct_change(price["current"], price["fiftyTwoWeekLow"])

    technical = {
        "sma20": sma(closes, 20),
        "sma50": sma(closes, 50),
        "sma200": sma(closes, 200),
        "rsi14": rsi(closes),
        "annualizedVolatility": volatility,
        "maxDrawdown5y": max_drawdown(closes),
        "returns": one_year_returns,
    }
    technical["trend"] = (
        "Above 50d and 200d averages"
        if current and technical["sma50"] and technical["sma200"] and current > technical["sma50"] > technical["sma200"]
        else "Below 50d and 200d averages"
        if current and technical["sma50"] and technical["sma200"] and current < technical["sma50"] < technical["sma200"]
        else "Mixed trend"
    )
    return price, technical, series[-1260:]


def build_sec_facts(raw: dict[str, Any]) -> dict[str, Any]:
    candidates = {
        "revenue": ["Revenue", "RevenueFromContractWithCustomerExcludingAssessedTax", "Revenues"],
        "netIncome": ["ProfitLoss", "NetIncomeLoss", "ProfitLossAttributableToOwnersOfParent"],
        "operatingIncome": ["OperatingIncomeLoss"],
        "assets": ["Assets"],
        "cash": ["CashAndCashEquivalents" , "CashAndCashEquivalentsAtCarryingValue"],
        "debt": ["Borrowings", "LongtermDebtNoncurrent", "LongTermDebtNoncurrent"],
        "equity": ["Equity", "StockholdersEquity"],
        "shares": ["WeightedAverageNumberOfSharesOutstandingBasic", "EntityCommonStockSharesOutstanding"],
    }
    facts_out: dict[str, Any] = {}
    namespaces = raw.get("facts", {})
    for key, tags in candidates.items():
        selected = None
        selected_namespace = None
        selected_tag = None
        for namespace in ("ifrs-full", "us-gaap", "dei"):
            for tag in tags:
                candidate = namespaces.get(namespace, {}).get(tag)
                if candidate:
                    selected = candidate
                    selected_namespace = namespace
                    selected_tag = tag
                    break
            if selected:
                break
        if not selected:
            facts_out[key] = {"label": None, "unit": None, "annual": []}
            continue
        units = selected.get("units", {})
        unit_name = next(iter(units), None)
        points = units.get(unit_name, []) if unit_name else []
        annual: dict[str, dict[str, Any]] = {}
        for point in points:
            if point.get("form") not in {"20-F", "20-F/A", "10-K", "10-K/A"} and point.get("fp") != "FY":
                continue
            year = str(point.get("fy") or point.get("end", "")[:4])
            if not year:
                continue
            candidate_point = {
                "year": year,
                "period": point.get("end"),
                "filed": point.get("filed"),
                "form": point.get("form"),
                "value": number(point.get("val")),
            }
            prior = annual.get(year)
            if prior is None or str(candidate_point.get("filed")) > str(prior.get("filed")):
                annual[year] = candidate_point
        facts_out[key] = {
            "label": selected.get("label") or selected_tag,
            "namespace": selected_namespace,
            "tag": selected_tag,
            "unit": unit_name,
            "annual": sorted(annual.values(), key=lambda item: item["year"], reverse=True)[:6],
        }
    return facts_out


def build_filings(submissions: dict[str, Any]) -> list[dict[str, Any]]:
    recent = submissions.get("filings", {}).get("recent", {})
    keys = ["form", "filingDate", "reportDate", "accessionNumber", "primaryDocument", "primaryDocDescription"]
    filings = []
    count = len(recent.get("accessionNumber", []))
    for index in range(min(count, 40)):
        item = {key: recent.get(key, [None] * count)[index] for key in keys}
        accession = str(item.get("accessionNumber") or "")
        document = str(item.get("primaryDocument") or "")
        if accession and document:
            item["url"] = f"https://www.sec.gov/Archives/edgar/data/{int(CIK)}/{accession.replace('-', '')}/{document}"
        filings.append(item)
    return filings


def build_news(ticker: Any) -> list[dict[str, Any]]:
    out = []
    try:
        raw = ticker.news or []
    except Exception:  # noqa: BLE001
        raw = []
    for item in raw:
        content = item.get("content") if isinstance(item, dict) else None
        if isinstance(content, dict):
            title = content.get("title")
            publisher = (content.get("provider") or {}).get("displayName")
            url = ((content.get("canonicalUrl") or {}).get("url") or (content.get("clickThroughUrl") or {}).get("url"))
            published = content.get("pubDate") or content.get("displayTime")
        else:
            title = item.get("title") if isinstance(item, dict) else None
            publisher = item.get("publisher") if isinstance(item, dict) else None
            url = item.get("link") if isinstance(item, dict) else None
            published = None
            stamp = item.get("providerPublishTime") if isinstance(item, dict) else None
            if stamp:
                try:
                    published = datetime.fromtimestamp(float(stamp), timezone.utc).isoformat()
                except (TypeError, ValueError, OverflowError):
                    pass
        if title and url:
            out.append({"title": str(title), "publisher": str(publisher or ""), "url": str(url), "published": published})
        if len(out) >= 12:
            break
    return out


def build_research(price: dict[str, Any], technical: dict[str, Any], fundamentals: dict[str, Any], statements: dict[str, Any]) -> dict[str, Any]:
    risks = []
    catalysts = []
    fcf = fundamentals.get("freeCashflow")
    revenue_growth = fundamentals.get("revenueGrowth")
    ps = fundamentals.get("priceToSales")
    cash = fundamentals.get("cash")
    debt = fundamentals.get("totalDebt")
    if fcf is not None and fcf < 0:
        risks.append({"title": "Negative free cash flow", "severity": "High", "detail": "The latest provider-reported free cash flow is negative; expansion may require external capital or balance-sheet capacity."})
    if ps is not None and ps >= 20:
        risks.append({"title": "High sales multiple", "severity": "High", "detail": "The market is valuing each dollar of reported trailing revenue at a high multiple, leaving less room for execution misses."})
    if debt is not None and cash is not None and debt > cash:
        risks.append({"title": "Debt exceeds cash", "severity": "Medium", "detail": "Reported total debt is above reported cash; monitor financing costs, maturities, and any new capital raises."})
    if technical.get("annualizedVolatility") and technical["annualizedVolatility"] > 70:
        risks.append({"title": "High price volatility", "severity": "Medium", "detail": "Annualized volatility from the daily price history is elevated; quoted prices can move faster than fundamentals."})
    if revenue_growth is not None and revenue_growth > 0.5:
        catalysts.append({"title": "Rapid revenue scaling", "detail": "The latest provider-reported revenue-growth figure is above 50%; verify the period, base effects, and whether growth is concentrated in the core AI cloud."})
    if technical.get("sma200") and price.get("current") and price["current"] > technical["sma200"]:
        catalysts.append({"title": "Price above 200-day average", "detail": "The current price is above its calculated 200-day simple moving average; this is a market-trend observation, not a forecast."})
    if not risks:
        risks.append({"title": "Data review required", "severity": "Watch", "detail": "No automatic flag crossed its threshold. Read the latest filing and verify the underlying figures before drawing conclusions."})
    if not catalysts:
        catalysts.append({"title": "Next filing and earnings update", "detail": "The next company filing, earnings release, and management commentary are the cleanest way to refresh operating assumptions."})

    latest_annual = (statements.get("annual") or [{}])[0]
    readouts = [
        {"label": "Growth", "value": "Strong" if revenue_growth is not None and revenue_growth > 0.25 else "Moderate / unclear", "detail": "Revenue growth is provider-reported and may include acquisitions, mix, and base effects."},
        {"label": "Cash generation", "value": "Positive" if fcf is not None and fcf > 0 else "Negative / unclear", "detail": "Use the cash-flow statement and financing activity to assess the path to self-funding."},
        {"label": "Balance sheet", "value": "Net cash" if cash is not None and debt is not None and cash > debt else "Needs monitoring", "detail": "Cash and debt are most useful alongside capex commitments, leases, and convertible terms."},
        {"label": "Valuation", "value": "Sales multiple", "detail": "Earnings-based multiples can be unreliable while profitability is volatile; this page uses EV/revenue scenarios as an explicit assumption framework."},
        {"label": "Trend", "value": technical.get("trend") or "Unavailable", "detail": "Trend is calculated from the fetched daily close history and is not a recommendation."},
    ]
    return {"readouts": readouts, "risks": risks, "catalysts": catalysts, "latestAnnualPeriod": latest_annual.get("period")}


def build_payload() -> dict[str, Any]:
    fetched_at = now_iso()
    profile = json.loads(PROFILE_PATH.read_text(encoding="utf-8"))
    ticker = yf.Ticker(TICKER)
    info = ticker.info or {}
    history = ticker.history(period="5y", interval="1d", auto_adjust=False, actions=False)
    price, technical, price_history = build_price_data(history, info)

    annual_income = getattr(ticker, "financials", None)
    annual_cashflow = getattr(ticker, "cashflow", None)
    annual_balance = getattr(ticker, "balance_sheet", None)
    quarterly_income = getattr(ticker, "quarterly_financials", None)
    quarterly_cashflow = getattr(ticker, "quarterly_cashflow", None)
    quarterly_balance = getattr(ticker, "quarterly_balance_sheet", None)
    statements = {
        "annual": statement_rows(annual_income, annual_cashflow, annual_balance, "annual"),
        "quarterly": statement_rows(quarterly_income, quarterly_cashflow, quarterly_balance, "quarterly"),
    }

    fundamentals = {
        "marketCap": price.get("marketCap"),
        "enterpriseValue": first_number(info, "enterpriseValue"),
        "trailingPe": first_number(info, "trailingPE"),
        "forwardPe": first_number(info, "forwardPE"),
        "priceToSales": first_number(info, "priceToSalesTrailing12Months"),
        "priceToBook": first_number(info, "priceToBook"),
        "enterpriseToRevenue": first_number(info, "enterpriseToRevenue"),
        "enterpriseToEbitda": first_number(info, "enterpriseToEbitda"),
        "pegRatio": first_number(info, "trailingPegRatio", "pegRatio"),
        "revenueGrowth": first_number(info, "revenueGrowth"),
        "earningsGrowth": first_number(info, "earningsGrowth"),
        "grossMargin": first_number(info, "grossMargins"),
        "operatingMargin": first_number(info, "operatingMargins"),
        "profitMargin": first_number(info, "profitMargins"),
        "returnOnEquity": first_number(info, "returnOnEquity"),
        "returnOnAssets": first_number(info, "returnOnAssets"),
        "freeCashflow": first_number(info, "freeCashflow"),
        "operatingCashflow": first_number(info, "operatingCashflow"),
        "totalRevenue": first_number(info, "totalRevenue"),
        "totalDebt": first_number(info, "totalDebt"),
        "cash": first_number(info, "totalCash", "cash"),
        "debtToEquity": first_number(info, "debtToEquity"),
        "currentRatio": first_number(info, "currentRatio"),
        "beta": first_number(info, "beta"),
        "sharesOutstanding": first_number(info, "sharesOutstanding", "impliedSharesOutstanding"),
        "floatShares": first_number(info, "floatShares"),
        "recommendationKey": text(info.get("recommendationKey")),
        "recommendationMean": first_number(info, "recommendationMean"),
        "numberOfAnalystOpinions": first_number(info, "numberOfAnalystOpinions"),
        "targetMeanPrice": first_number(info, "targetMeanPrice"),
        "targetHighPrice": first_number(info, "targetHighPrice"),
        "targetLowPrice": first_number(info, "targetLowPrice"),
        "earningsTimestamp": first_number(info, "earningsTimestamp", "earningsTimestampStart"),
        "dividendYield": first_number(info, "dividendYield"),
        "asOf": fetched_at,
    }

    contact = os.environ.get("SEC_CONTACT_EMAIL", "").strip()
    user_agent = os.environ.get("SEC_USER_AGENT", "").strip() or f"StocksWatch NBIS research snapshot (+https://stockswatch.cc; contact: {contact or 'contact unavailable'})"
    sec_session = requests.Session()
    sec_session.headers.update({"User-Agent": user_agent, "Accept-Encoding": "gzip, deflate"})
    submissions = fetch_sec_json(SEC_SUBMISSIONS_URL, sec_session)
    facts_raw = fetch_sec_json(SEC_FACTS_URL, sec_session)
    sec = {
        "cik": CIK,
        "companyName": submissions.get("name"),
        "sic": submissions.get("sic"),
        "sicDescription": submissions.get("sicDescription"),
        "retrievedAt": fetched_at,
        "submissionsUrl": SEC_SUBMISSIONS_URL,
        "factsUrl": SEC_FACTS_URL,
        "filings": build_filings(submissions),
        "facts": build_sec_facts(facts_raw),
    }

    base_revenue = fundamentals.get("totalRevenue") or (statements["annual"][0].get("revenue") if statements["annual"] else None)
    current = price.get("current")
    shares = fundamentals.get("sharesOutstanding") or ((price.get("marketCap") / current) if price.get("marketCap") and current else None)
    scenarios = []
    for name, growth, multiple in (("Bear", 0.20, 8.0), ("Base", 0.50, 15.0), ("Bull", 0.85, 25.0)):
        revenue_3y = base_revenue * ((1 + growth) ** 3) if base_revenue is not None else None
        enterprise_value = revenue_3y * multiple if revenue_3y is not None else None
        equity_value = enterprise_value + (fundamentals.get("cash") or 0) - (fundamentals.get("totalDebt") or 0) if enterprise_value is not None else None
        scenarios.append({
            "name": name,
            "revenueCagr3y": growth,
            "exitEvRevenue": multiple,
            "revenue3y": revenue_3y,
            "enterpriseValue": enterprise_value,
            "equityValue": equity_value,
            "impliedPrice": (equity_value / shares) if equity_value is not None and shares else None,
        })

    news = build_news(ticker)
    sources = [
        {"label": "Yahoo Finance market and statement data", "url": YAHOO_URL, "retrievedAt": fetched_at, "coverage": "Quote, price history, valuation, statements, estimates, and headlines."},
        {"label": "SEC EDGAR submissions", "url": SEC_SUBMISSIONS_URL, "retrievedAt": fetched_at, "coverage": "Company metadata and filing index."},
        {"label": "SEC EDGAR company facts", "url": SEC_FACTS_URL, "retrievedAt": fetched_at, "coverage": "Structured reported facts where the issuer taxonomy provides them."},
    ]
    return json_safe({
        "schemaVersion": 1,
        "ticker": TICKER,
        "company": profile["company"],
        "fetchedAt": fetched_at,
        "status": "ok",
        "profile": profile,
        "price": price,
        "technical": technical,
        "fundamentals": fundamentals,
        "statements": statements,
        "sec": sec,
        "scenarios": {
            "baseRevenue": base_revenue,
            "sharesUsed": shares,
            "assumptionNote": "Illustrative three-year EV/revenue scenarios. Growth, exit multiple, cash, debt, and share-count inputs are assumptions or provider values; this is not a price target or investment advice.",
            "rows": scenarios,
        },
        "research": build_research(price, technical, fundamentals, statements),
        "news": news,
        "sources": sources,
        "priceHistory": price_history,
    })


def main() -> int:
    payload = build_payload()
    OUT.parent.mkdir(parents=True, exist_ok=True)
    OUT.write_text(json.dumps(payload, separators=(",", ":")), encoding="utf-8")
    print(f"Wrote {OUT} — {payload['ticker']} snapshot at {payload['fetchedAt']}")
    print(f"SEC filings: {len(payload['sec']['filings'])}; price points: {len(payload['priceHistory'])}")
    return 0


if __name__ == "__main__":
    raise SystemExit(main())
