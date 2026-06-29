# Stocks Radar

A single-page watchlist for you and your friends — built to handle **100+ tickers** with search, filters, and a holistic overview of what's closest to your entry targets.

> ⚠️ Not financial advice. Personal tooling for tracking tickers and theses with friends.

## What it does

- **Full watchlist table** — sortable, searchable, filterable (owned / targets / watching)
- **Holistic overview** — total counts, how many are at target, within 5%/10% of entry
- **Closest to entry** — quick chips for the tickers nearest your price targets
- **Bulk CSV import** — paste or import hundreds of tickers at once
- **Live-ish quotes** — server-fetched `quotes.json` on deploy + auto-refresh every 60s in the browser
- **Holdings screenshots** — drag-and-drop broker screenshots; stored locally in IndexedDB

## Quick start

```bash
cd stocks/radar
npm install
npm run update-quotes   # optional — refresh prices locally
npm run dev
```

Open [http://localhost:4321](http://localhost:4321).

## Go live (automatic updates)

The site can run on **GitHub Pages** with prices that refresh on their own — no manual rebuild needed.

### One-time setup

1. Merge this to `main`
2. In GitHub → **Settings → Pages** → Source: **GitHub Actions**
3. The workflow `Stocks Radar — live deploy` handles the rest

### What stays automatic

| What | How often |
|------|-----------|
| **Price quotes** | Fetched before every deploy; page polls `quotes.json` every **60s** |
| **Scheduled redeploy** | Weekdays, every **15 min** (refreshes quotes + republishes) |
| **On git push** | Any change under `stocks/radar/` triggers a fresh deploy |

**Live URL (after setup):**  
https://jacob-idolor.github.io/Pet_Projects/stocks-radar/

Share that link with your group — bookmark it on your phones. When anyone pushes watchlist changes to `main`, everyone gets them on the next deploy.

### Manual refresh

GitHub → **Actions** → **Stocks Radar — live deploy** → **Run workflow**

Or locally:

```bash
npm run update-quotes && npm run build
```

## Adding 100+ tickers

### Option A — CSV file (shared with the group)

1. Put tickers in a CSV (see `src/data/watchlist.example.csv`):

```csv
symbol,name,category,targetPrice,targetNote,thesis,addedBy
NVDA,NVIDIA,owned,180,Trim above 175,AI infra,J
PLTR,Palantir,targets,18,Wait for dip,Want entry,K
SOFI,SoFi,watching,12,,Fintech,M
```

Minimal format — one symbol per line also works:

```csv
NVDA
AAPL
MSFT
```

2. Merge into the shared watchlist:

```bash
npm run import-csv -- my-tickers.csv          # merge
npm run import-csv -- my-tickers.csv --replace # replace all
```

3. Commit `src/data/watchlist.json` — everyone gets the full list on deploy.

### Option B — Paste in the browser (personal overlay)

Click **Import CSV** on the page, paste tickers from a spreadsheet, hit **Add to my watchlist**. Stored in your browser and merged with the shared list (marked with ★).

### Option C — Edit JSON directly

Edit `src/data/watchlist.json` — same fields as before, just easier to bulk-generate from a script or spreadsheet export.

## Categories

| Category | Use for |
|----------|---------|
| `owned` | Positions you're in |
| `targets` | Waiting for a specific entry or trim price |
| `watching` | Long-term radar — no specific trigger yet |

## Using the dashboard

- **Search** — symbol, company name, or thesis text
- **Filter chips** — narrow to owned, targets, has-target, at-target
- **Sort** — click column headers; default sort is closest to target
- **Export CSV** — download the merged list (shared + your imports)
- **Closest to entry** — click a chip to jump to that ticker in the table

## Holdings screenshots

1. Enter your initials
2. Drop broker screenshots (tickers only — no values needed)
3. Images stay in **IndexedDB** on your device

## Build & deploy

```bash
npm run update-quotes   # refresh public/quotes.json
npm run build           # runs update-quotes automatically (prebuild)
npm run preview
```

**GitHub Pages (recommended):** enable Pages → GitHub Actions source. See [Go live](#go-live-automatic-updates) above.

Also works on S3 + CloudFront, Netlify, or Vercel — set `STOCKS_RADAR_BASE` if not hosting at domain root.

## Project layout

```
stocks/radar/
  src/data/watchlist.json       # shared ticker list (100+ OK)
  src/data/watchlist.example.csv
  scripts/csv-to-watchlist.mjs  # bulk CSV → JSON
  src/components/WatchlistBoard.astro
  src/pages/index.astro
```

## License

[MIT](../../LICENSE)
