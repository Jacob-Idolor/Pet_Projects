# Stocks Radar

A single-page group watchlist — one tracking list, live quotes, and a clean mobile layout. Built for **100+ tickers**, zero API keys, low hosting cost.

> Not financial advice. Personal tooling for tracking tickers and theses.

## What you get

- **Unified tracking list** — every ticker in one place (no owned vs watching split)
- **Live prices** — free Yahoo quotes on deploy + browser refresh
- **Mobile-first cards** — simple price view on phone; full table + technicals on desktop
- **Day mood banner** — quick read on how the list is doing today
- **Theme tags** — filter by semi, photonics, ai, etc.
- **Technical view** (desktop) — SMA 20/50/200, RSI, 52-week range, trend badges
- **Group feed** (desktop) — post ticker notes; auto-detects symbols

## Quick start

```bash
cd stocks/radar
npm install
npm run dev
```

Open http://localhost:4321

## Watchlist data

Edit `src/data/watchlist.json`:

| Field | Purpose |
|-------|---------|
| `category` | `tracking` (single list) |
| `sector` | Grouping label |
| `tags` | Themes (`semi`, `photonics`, …) |
| `priority` | `high` · `medium` · `low` |
| `thesis` | One-liner shown on cards and rows |

Bulk import via CSV: `npm run import-csv -- my-tickers.csv`

## Deploy (AWS S3 + CloudFront)

GitHub Pages is **not** used. Deploys run through **GitHub Actions → AWS** so every push shows up clearly under **Actions** with a live URL in the job summary.

**Full setup:** [`DEPLOY.md`](DEPLOY.md)

1. `terraform apply` in `infra/terraform/` (creates S3 + CloudFront)
2. Add 6 GitHub secrets (AWS creds + bucket/CloudFront outputs)
3. Push to `main` — workflow **Stocks Radar — deploy** runs automatically

**Live URL:** `https://<your-cloudfront-domain>/` (root path, no repo subpath)

Quotes refresh on deploy and every 15 minutes on weekdays (scheduled CI). The status bar shows quote age, deploy time, and commit SHA.

## Manual deploy

```bash
cd stocks/radar
npm ci && npm run build
./infra/deploy.sh
```

## Project layout

```
stocks/radar/
  src/data/watchlist.json
  src/scripts/watchlist-board.ts
  scripts/fetch-quotes.mjs
  scripts/write-build-meta.mjs
  infra/                    # Terraform + deploy.sh
  DEPLOY.md                 # AWS + GitHub secrets guide
```

## License

[MIT](../../LICENSE)
