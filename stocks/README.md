# 📈 Stocks & Trading

Trading tools, indicators, and research — built in the open.

## Structure

```
stocks/
  radar/             # single-page group watchlist (unified tracking list)
  pine-scripts/      # TradingView Pine Script indicators & strategies
  research/          # backtests, analysis notebooks, write-ups
  tools/             # screeners, alert bots, data pipelines
```

### Radar (group watchlist)

[`radar/`](radar/) — a one-page dashboard for tracking tickers with friends:

- **Unified tracking list** — every ticker in one place
- **Live quotes** — refreshed on deploy and in the browser
- **Mobile-friendly** — card layout on phone, full table on desktop

Deploy via **AWS S3 + CloudFront** (see [`radar/DEPLOY.md`](radar/DEPLOY.md)). Supports **100+ tickers** via CSV import, searchable table, and theme filters.

```bash
cd stocks/radar && npm install && npm run dev
npm run import-csv -- my-tickers.csv   # bulk merge into watchlist.json
```

## Conventions

- **Pine Scripts**: one `.pine` file per indicator/strategy, with a header comment block covering what it does, how to use it, and known limitations. Include a screenshot of it on a chart where possible.
- **Strategies vs indicators**: label clearly which is which, and never present backtest results as guarantees.
- **Tools**: anything that touches broker or market-data APIs keeps credentials in `.env` (never committed).

## Journey log

I'll document what I try, what works, and what doesn't — wins and losses both. Each meaningful experiment gets a short write-up in `research/`.

> ⚠️ Nothing in this folder is financial advice. These are personal tools and experiments shared for learning purposes.

## Notes

The old `stock-buy-bot` (FastAPI + Alpaca paper-trading bot with Docker and Postgres) is preserved in git history (`pre-reset-archive` tag) and may get revived here.
