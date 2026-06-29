# 📈 Stocks & Trading

Trading tools, indicators, and research — built in the open.

## Structure

```
stocks/
  radar/             # single-page group watchlist (own / targets / watching)
  pine-scripts/      # TradingView Pine Script indicators & strategies
  research/          # backtests, analysis notebooks, write-ups
  tools/             # screeners, alert bots, data pipelines
```

### Radar (group watchlist)

[`radar/`](radar/) — a one-page dashboard for tracking tickers with friends:

- **Currently holding** — positions you're in
- **Price targets** — waiting for a specific entry or trim level
- **Long-term watchlist** — keeping an eye on, no rush

Drop broker screenshots locally (IndexedDB — nothing hits a server). Edit `radar/src/data/watchlist.ts` to update the shared list.

```bash
cd stocks/radar && npm install && npm run dev
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
