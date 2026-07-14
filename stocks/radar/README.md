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

Infra stays **Terraform S3 + CloudFront** (~$0.50–3/mo). No second host. See [DEPLOY.md](DEPLOY.md), cheap custom domain [DOMAIN.md](DOMAIN.md), and [ADSENSE.md](ADSENSE.md).

## AdSense (passive income)

Local `npm run dev` shows labeled **AdSense preview** slots. Production uses your publisher ID after site approval (custom domain preferred — [DOMAIN.md](DOMAIN.md)).

**Guide:** [`ADSENSE.md`](ADSENSE.md) · env template: [`.env.example`](.env.example)

## Deploy (AWS S3 + CloudFront)

**Friend feedback trial (cheap → destroy when done):** [`FRIENDS_FEEDBACK.md`](FRIENDS_FEEDBACK.md)

GitHub Pages is **not** used. Deploys run through **GitHub Actions → AWS**.

**Full setup:** [`DEPLOY.md`](DEPLOY.md)

1. `terraform apply` in `infra/terraform/` (S3 + CloudFront + optional SNS digest)
2. Add GitHub secrets (AWS + bucket/CloudFront; optional digest topic ARN)
3. Push to `main` — **Stocks Radar — deploy**
4. When friends are done: `infra/destroy.ps1` or `terraform destroy`

**Live URL:** `https://<your-cloudfront-domain>/`

Daily email (viewers + mood): confirm SNS subscription, then **Stocks Radar — daily digest** workflow.

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
  DOMAIN.md                 # Cheapest domain (Cloudflare/Porkbun) + DNS
  ADSENSE.md                # Publisher ads after domain approval
  FRIENDS_FEEDBACK.md       # Apply → share → digest → destroy
  ADSENSE.md                # Publisher setup + local preview
```

## License

[MIT](../../LICENSE)
