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

## Local rebuild loop (test then ship)

Cheapest path: edit locally → preview the static build → push → Actions syncs to the same Terraform S3/CloudFront stack.

```bash
cd stocks/radar
npm install
npm run dev          # hot reload + AdSense preview boxes
# …or full static parity:
npm run rebuild      # quotes + SEO files + build + preview
```

Then either push to `main` (auto-deploy) or:

```bash
npm run build
./infra/deploy.sh    # laptop → S3 + invalidate (needs AWS profile)
```

Infra stays **Terraform S3 + CloudFront** (~$0.50–3/mo). No second host. See [DEPLOY.md](DEPLOY.md) and [ADSENSE.md](ADSENSE.md).

## AdSense (passive income)

Local `npm run dev` shows labeled **AdSense preview** slots. Production uses your publisher ID after CloudFront domain approval.

**Guide:** [`ADSENSE.md`](ADSENSE.md) · env template: [`.env.example`](.env.example)

## Deploy (AWS S3 + CloudFront)

GitHub Pages is **not** used. Deploys run through **GitHub Actions → AWS** so every push shows up clearly under **Actions** with a live URL in the job summary.

**Full setup:** [`DEPLOY.md`](DEPLOY.md)

1. `terraform apply` in `infra/terraform/` (creates S3 + CloudFront)
2. Add 6 GitHub secrets (AWS creds + bucket/CloudFront outputs)
3. Optional: AdSense GitHub **variables** (`PUBLIC_ADSENSE_*`) — see ADSENSE.md
4. Push to `main` — workflow **Stocks Radar — deploy** runs automatically

**Live URL:** `https://<your-cloudfront-domain>/` (root path, no repo subpath)

Quotes refresh on deploy and every 15 minutes on weekdays (scheduled CI). The status bar shows quote age, deploy time, and commit SHA. SEO build writes `robots.txt`, `sitemap.xml`, and `ads.txt`.

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
  src/components/AdSlot.astro
  src/scripts/watchlist-board.ts
  scripts/fetch-quotes.mjs
  scripts/write-seo-files.mjs
  infra/                    # Terraform + deploy.sh
  DEPLOY.md                 # AWS + GitHub secrets guide
  ADSENSE.md                # Publisher setup + local preview
```

## License

[MIT](../../LICENSE)
