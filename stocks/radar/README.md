# Stocks Radar

A single-page group watchlist — one tracking list, live quotes, and a clean mobile layout. Built for **100+ tickers**, zero API keys, low hosting cost.

> Not financial advice. Personal tooling for tracking tickers and theses.

**Design:** [StocksWatch Figma](https://www.figma.com/design/24Rzh5v3d95ngIMQdv5wTz) (shared tokens for Home + AI Data Center).

## What you get

- **Unified tracking list** — every ticker in one place (no owned vs watching split)
- **Live prices** — free Yahoo quotes on deploy + weekday refresh workflow; browser falls back when stale
- **Quote health bar** — age, coverage (e.g. 13/14), partial/stale/error states; last-good prices kept on Yahoo misses
- **Mobile-first cards** — simple price view on phone; full table + technicals on desktop
- **Day mood banner** — quick read on how the list is doing today
- **Theme tags** — filter by semi, photonics, ai, etc.
- **Technical view** (desktop) — SMA 20/50/200, RSI, 52-week range, trend badges
- **Radar signals** — Weighted lean buy / watch / lean sell (+ pre-momentum coils) — [SCORE.md](SCORE.md)
- **Optional OpenTelemetry** — CI/script traces for Yahoo fetch ([OBSERVABILITY.md](OBSERVABILITY.md); off by default)
- **Production config** — `site-settings.json` + `/settings.json` + `/health.json` for ops ([PRODUCTION.md](PRODUCTION.md); not shown on the public board)
- **Go-live bootstrap** — gated CI + `infra/go-live.sh` + preflight ([GO_LIVE.md](GO_LIVE.md))
- **Security posture** — private S3/OAC, `_private/` blocked, hardened IAM/alerts ([SECURITY.md](SECURITY.md))
- **Group feed** — post ticker notes; auto-detects symbols; emailed to you via free [Web3Forms](https://web3forms.com) when `PUBLIC_WEB3FORMS_ACCESS_KEY` is set (also kept in the browser until merged in git)
- **AI Data Center screener** — six-layer thematic board at `/datacenter.html` (map, rack explorer, composite score, copy-paste AI research prompts). Home bridges in with a layer teaser + chips on overlapping tickers (`features.datacenterBridge`).

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

## AI Data Center screener

Thematic universe lives in `src/data/datacenter-universe.json` (six layers: land → power → cooling → compute → networking → software). The UI is at `/datacenter.html`.

```bash
pip install -r scripts/datacenter/requirements.txt
npm run update-screener   # writes public/screener.json (+ news)
```

Build-time Yahoo snapshots power the table (same static hosting as the watchlist — no Flask server). AI Analyst runs in **copy-prompt** mode (paste into Claude/Gemini). Trends/history and locally added stocks use the browser's `localStorage`.

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

Infra stays **Terraform S3 + CloudFront** (~$0.50–3/mo). No second host. See [DEPLOY.md](DEPLOY.md), cost/scale + AdSense math [PASSIVE_INCOME.md](PASSIVE_INCOME.md), cheap custom domain [DOMAIN.md](DOMAIN.md), and [ADSENSE.md](ADSENSE.md).

## AdSense (passive income)

Local `npm run dev` shows labeled **AdSense preview** slots. Production uses your publisher ID after site approval (custom domain preferred — [DOMAIN.md](DOMAIN.md)).

**Guide:** [`ADSENSE.md`](ADSENSE.md) · env template: [`.env.example`](.env.example)

## Deploy (AWS S3 + CloudFront)

**Friend feedback trial (cheap → destroy when done):** [`FRIENDS_FEEDBACK.md`](FRIENDS_FEEDBACK.md)

GitHub Pages is **not** used. Deploys run through **GitHub Actions → AWS**.

**Go live (one checklist):** [`GO_LIVE.md`](GO_LIVE.md) · details: [`DEPLOY.md`](DEPLOY.md)

1. `terraform apply` in `infra/terraform/` (S3 + CloudFront + optional SNS digest/alerts)
2. `bash infra/go-live.sh` (or add GitHub secrets manually — [GO_LIVE.md](GO_LIVE.md))
3. Set `STOCKS_RADAR_DEPLOY_ENABLED=true` and run **Stocks Radar — deploy**
4. When friends are done: `infra/destroy.sh` or `terraform destroy`

**Live URL:** `https://<your-cloudfront-domain>/`

Daily email (viewers + mood + signals): confirm SNS subscription, then **Stocks Radar — daily digest**.  
Optional personal signal emails (ops only, not shown on the public board): [ALERTS.md](ALERTS.md).

Weekday **quote-only refresh** (no full rebuild): **Stocks Radar — refresh quotes** — see [DEPLOY.md](DEPLOY.md).

Custom domain when you are ready to buy: [DOMAIN.md](DOMAIN.md) (`include_www_alias` covers apex + www in one ACM cert).

## Group suggestions (email you)

Friend notes save in the visitor’s browser **and** can email you for free via [Web3Forms](https://web3forms.com):

1. Create an access key (free tier) pointed at your inbox
2. Set `PUBLIC_WEB3FORMS_ACCESS_KEY` in local `.env` and as a GitHub Actions **variable** (or secret)
3. Redeploy — the deploy workflow already passes the key into `npm run build`

Without the key, the form still works locally (IndexedDB only) and shows a soft “device only” status.

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
  src/data/datacenter-universe.json
  src/pages/datacenter.astro
  public/datacenter/        # screener UI + assets
  scripts/fetch-quotes.mjs
  scripts/fetch-screener.py # build-time Yahoo fundamentals for /datacenter
  infra/                    # Terraform + deploy.sh
  GO_LIVE.md                # One checklist: TF → secrets → enable CI
  SECURITY.md               # Audit posture + residual risks
  DEPLOY.md                 # AWS + GitHub secrets guide
  DOMAIN.md                 # Cheapest domain (Cloudflare/Porkbun) + DNS
  ADSENSE.md                # Publisher ads after domain approval
  PRODUCTION.md             # Production readiness
  FRIENDS_FEEDBACK.md       # Apply → share → digest → destroy
```

## License

[MIT](../../LICENSE)
