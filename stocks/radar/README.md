# Stocks Radar

A robust single-page watchlist for you and your friends — holdings, price targets, and long-term watches in one place. Built for **100+ tickers**, zero API keys, zero monthly cost.

> ⚠️ Not financial advice. Personal tooling for tracking tickers and theses.

## What you get

- **Holdings strip** — top cards for everything you own (thesis, tags, live price)
- **Three buckets** — Owned · Targets · Watching (collapsible sections)
- **All-tickers table** — pagination (25–200/page), sort any column, expand rows for full detail
- **Theme tags** — filter by photonics, semi, mag7, etc.
- **Closest to entry** — tickers nearest their target price
- **Overview stats** — at target, within 5%/10%, counts by bucket
- **CSV import/export** — bulk load your full watchlist
- **Live prices** — free quote fetch on deploy + browser refresh (no paid APIs)

## Quick start

```bash
cd stocks/radar
npm install
npm run dev
```

## Watchlist data

Edit `src/data/watchlist.json` or import CSV:

```csv
symbol,name,category,sector,tags,targetPrice,thesis,priority,addedBy
NBIS,Nebius Group,owned,AI Infrastructure,ai;high-conviction,,Favorite for next few years,high,J
PLTR,Palantir,targets,Software,ai;gov,18,Want better entry,medium,K
```

```bash
npm run import-csv -- my-tickers.csv
```

### Fields

| Field | Purpose |
|-------|---------|
| `category` | `owned` · `targets` · `watching` |
| `sector` | Grouping label (Semiconductors, Photonics, …) |
| `tags` | Semicolon-separated themes (`photonics;speculative`) |
| `priority` | `high` · `medium` · `low` — conviction signal |
| `targetPrice` | Entry or trim level |
| `thesis` | Your one-liner — shows on cards and expandable rows |

## Using the page

- **By bucket** (default) — three collapsible sections for the full picture
- **All tickers** — paginated master table for 100+ names
- **/** — focus search
- **Theme chips** — filter one tag at a time
- **+** on a row — expand full thesis, sector, Yahoo link

## Go live (pick one — both stay under $5/mo)

| Option | Cost | URL |
|--------|------|-----|
| **GitHub Pages** (default) | **$0/mo** | `https://jacob-idolor.github.io/Pet_Projects/stocks-radar/` |
| **AWS S3 + CloudFront** | **~$0.50–3/mo** | CloudFront URL from Terraform |

**GitHub Pages (free):**

1. Merge to `main`
2. GitHub → Settings → Pages → Source: **GitHub Actions**
3. Push to `main` triggers deploy (or run the workflow manually)

**AWS (optional):** infra lives in [`infra/`](infra/README.md) — Terraform + `./deploy.sh`. Does not touch app code; local dev is unchanged.

Prices refresh on deploy + every 15 min on weekdays (scheduled CI). Page polls every 60s while open.

## Project layout

```
stocks/radar/
  src/data/watchlist.json
  src/scripts/watchlist-board.ts   # table, filters, buckets UI
  scripts/csv-to-watchlist.mjs
  scripts/fetch-quotes.mjs
  infra/                           # AWS only — see infra/README.md
```

## License

[MIT](../../LICENSE)
