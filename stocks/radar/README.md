# StocksWatch (stocks/radar)

Group watchlist + AI data-center thematic screener. Static Astro site on **S3 + CloudFront** — no app server, zero API keys for market data.

> Not financial advice. Personal tooling for tracking tickers and theses.

**Design:** [StocksWatch Figma](https://www.figma.com/design/24Rzh5v3d95ngIMQdv5wTz) (shared tokens for Home + AI Data Center).

## What you get

<<<<<<< Updated upstream
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
=======
**Group watchlist (`/`)**

- Unified tracking list with theses, tags, and conviction
- Yahoo quotes on deploy + weekday refresh; browser fallback when stale
- Day mood, macro strip, technical lean / radar signals — [SCORE.md](SCORE.md)
- Optional group feed, AdSense, alerts, OTel — see docs below

**AI Data Center (`/datacenter.html`)**

- Six-layer universe (land → power → cooling → compute → networking → software)
- Screener table (valuation / momentum / quality / consensus / trends), map, rack explorer
- Composite score + copy-paste AI research prompts
- Build/CI Yahoo snapshot (`screener.json`) — not a live Python server
>>>>>>> Stashed changes

## Quick start

```bash
cd stocks/radar
npm install
npm run dev
```

- Watchlist: http://localhost:4321  
- Data center: http://localhost:4321/datacenter.html  

### Screener snapshot (Python)

```bash
pip install -r scripts/datacenter/requirements.txt
npm run update-screener   # → public/screener.json (+ public/datacenter/news.json)
```

`prebuild` runs this via `fetch-screener-soft.mjs`: soft-fail locally if Python/Yahoo fails; **hard-fail in production CI** so stale data is not silently shipped.

## Data you edit

| File | Purpose |
|------|---------|
| `src/data/watchlist.json` | Group list (symbol, sector, tags, thesis, priority) |
| `src/data/datacenter-universe.json` | AI DC layers + holdings + `dataOverrides` |
| `src/data/site-settings.json` | Features, quote freshness, board defaults |

CSV import for the watchlist: `npm run import-csv -- my-tickers.csv`

### Screener limits (by design on static hosting)

| Feature | Behavior |
|---------|----------|
| Prices / fundamentals | Snapshot from last `update-screener` / deploy / quote-refresh job |
| Refresh button | Reloads `screener.json` from the CDN — does not call Yahoo from the browser |
| News | From `datacenter/news.json` (generated with the screener fetch) |
| AI Analyst | Copy-prompt only (paste into Claude/Gemini) |
| Stock Lookup | Pins names already in the universe (browser `localStorage`); expand the shared list by editing `datacenter-universe.json` |
| Trends / history | Browser `localStorage` only |

## Local rebuild → ship

```bash
cd stocks/radar
npm install
npm run dev          # or:
npm run rebuild      # quotes + screener soft-fetch + build + preview
```

Push to `main` (gated deploy) or:

```bash
<<<<<<< Updated upstream
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
=======
pip install -r scripts/datacenter/requirements.txt
>>>>>>> Stashed changes
npm ci && npm run build
./infra/deploy.sh    # needs AWS profile
```

Infra: **Terraform S3 + CloudFront** (~$0.50–3/mo). See [DEPLOY.md](DEPLOY.md), [DOMAIN.md](DOMAIN.md), [ADSENSE.md](ADSENSE.md), [GO_LIVE.md](GO_LIVE.md).

## Deploy (AWS)

1. `terraform apply` in `infra/terraform/`
2. `bash infra/go-live.sh` (secrets) — [GO_LIVE.md](GO_LIVE.md)
3. Set `STOCKS_RADAR_DEPLOY_ENABLED=true` → **Stocks Radar — deploy**
4. Weekday quote + screener refresh: **Stocks Radar — refresh quotes**

Live site: `https://stockswatch.cc/` (or your CloudFront domain).

## Project layout

```
stocks/radar/
  src/data/watchlist.json
  src/data/datacenter-universe.json
  src/pages/index.astro
  src/pages/datacenter.astro
  public/quotes.json
  public/screener.json
  public/datacenter/          # UI (app.js, static-api.js, map, rack, CSS, assets)
  scripts/fetch-quotes.mjs
  scripts/fetch-screener.py
  scripts/fetch-screener-soft.mjs
  infra/                      # Terraform + deploy.sh
```

## Docs

| Doc | Topic |
|-----|--------|
| [SCORE.md](SCORE.md) | Radar lean buy / sell |
| [DEPLOY.md](DEPLOY.md) | AWS + GitHub Actions |
| [DOMAIN.md](DOMAIN.md) | Custom domain |
| [PRODUCTION.md](PRODUCTION.md) | Ops readiness |
| [SECURITY.md](SECURITY.md) | Hardening |
| [ADSENSE.md](ADSENSE.md) | Ads |
| [ALERTS.md](ALERTS.md) | Personal signal emails |
| [GO_LIVE.md](GO_LIVE.md) | One checklist |

## License

[MIT](../../LICENSE)
