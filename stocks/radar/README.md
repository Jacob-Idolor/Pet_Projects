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
- **Technical view** — SMA 20/50/200, RSI(14), 52-week range, trend badges, volume vs 20d avg

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

- **Add PT** button — send a ticker to the price-target list (e.g. PLTR @ $18)
- Expand any row (**+**) — set or update a target inline
- Group feed — post `PLTR @ 18` or `Watching NVDA under $120` to auto-detect PTs
- **By bucket** (default) — three collapsible sections for the full picture
- **All tickers** — paginated master table for 100+ names
- **/** — focus search
- **Technical** tab — moving averages, RSI, 52-week range position, trend
- **Technicals filters** — above/below MAs, bullish/bearish, near 52w high/low, RSI oversold
- **Theme chips** — filter one tag at a time
- **+** on a row — expand full thesis, sector, Yahoo link

## Go live (pick one — both stay under $5/mo)

**Live URL (after setup):** https://jacob-idolor.github.io/Pet_Projects/stocks-radar/

### Deploy in ~3 minutes (GitHub Pages, free)

1. **Merge** the stocks-radar PR to `main`
2. **Enable Pages** (once): [Settings → Pages](https://github.com/Jacob-Idolor/Pet_Projects/settings/pages) → Source: **Deploy from a branch** → Branch **`gh-pages`** → **`/ (root)`** → Save
3. **Run deploy:** Actions → **Stocks Radar — live deploy** → **Run workflow**
4. **Open on phone:** bookmark the URL above — works on mobile (responsive layout, touch-friendly tables)

Full troubleshooting: [`.github/PAGES_SETUP.md`](../../.github/PAGES_SETUP.md)

### Mobile

The page is built for phone and desktop: responsive grids, horizontal scroll on wide tables, touch-sized buttons, safe-area padding for notched phones. Add to home screen from Safari/Chrome for quick access.

| Option | Cost | URL |
|--------|------|-----|
| **GitHub Pages** (default) | **$0/mo** | `https://jacob-idolor.github.io/Pet_Projects/stocks-radar/` |
| **AWS S3 + CloudFront** | **~$0.50–3/mo** | CloudFront URL from Terraform |

**GitHub Pages (free):**

1. **One-time:** enable Pages → [setup guide](../../.github/PAGES_SETUP.md) (branch `gh-pages`, folder `/`)
2. Merge to `main` — deploy workflow runs automatically
3. URL: `https://jacob-idolor.github.io/Pet_Projects/stocks-radar/`

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
