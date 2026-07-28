# StocksWatch (stocks/radar)

Group watchlist + AI data-center thematic screener. Static Astro site on **S3 + CloudFront** — no app server, zero API keys for market data.

> Not financial advice. Personal tooling for tracking tickers and theses.

**Design tokens:** `src/styles/tokens.css` (shared by Home + AI Data Center). Figma capture later when Edit seat is available: [StocksWatch Figma](https://www.figma.com/design/24Rzh5v3d95ngIMQdv5wTz).

## What you get

**Group watchlist (`/`)**

- Unified tracking list with theses, tags, and conviction
- Yahoo quotes on deploy + weekday refresh; browser fallback when stale
- Quote health, day mood, macro strip, technical lean / radar signals — [SCORE.md](SCORE.md)
- Group feed (device-local; optional email via Web3Forms)
- Optional AdSense, alerts, OTel — see docs below

**AI Data Center (`/datacenter.html`)**

- Six-layer universe (land → power → cooling → compute → networking → software)
- Screener table, map, rack explorer, composite score, copy-paste AI research prompts
- Build/CI Yahoo snapshot (`screener.json`) — not a live Python server
- Same site header + design tokens as the watchlist

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
pip install -r scripts/datacenter/requirements.txt
npm ci && npm run build
./infra/deploy.sh    # needs AWS profile
```

Infra: **Terraform S3 + CloudFront** (~$0.50–3/mo). See [DEPLOY.md](DEPLOY.md), [DOMAIN.md](DOMAIN.md), [ADSENSE.md](ADSENSE.md), [GO_LIVE.md](GO_LIVE.md), [PASSIVE_INCOME.md](PASSIVE_INCOME.md).

## AdSense (passive income)

Local `npm run dev` shows labeled **AdSense preview** slots. Production uses your publisher ID after site approval (custom domain preferred — [DOMAIN.md](DOMAIN.md)).

**Guide:** [`ADSENSE.md`](ADSENSE.md) · env template: [`.env.example`](.env.example)

## Deploy (AWS)

1. `terraform apply` in `infra/terraform/`
2. `bash infra/go-live.sh` (secrets) — [GO_LIVE.md](GO_LIVE.md)
3. Set `STOCKS_RADAR_DEPLOY_ENABLED=true` → **Stocks Radar — deploy**
4. Weekday quote + screener refresh: **Stocks Radar — refresh quotes**

Live site: `https://stockswatch.cc/` (or your CloudFront domain).

Friend feedback trial: [`FRIENDS_FEEDBACK.md`](FRIENDS_FEEDBACK.md).

### Group suggestions (email you)

Friend notes save in the visitor’s browser **and** can email you via free [Web3Forms](https://web3forms.com) when `PUBLIC_WEB3FORMS_ACCESS_KEY` is set (local `.env` + GitHub Actions variable). Without the key, the form stays device-local.

## Project layout

```
stocks/radar/
  src/styles/tokens.css       # shared design tokens
  src/components/SiteHeader.astro
  src/data/watchlist.json
  src/data/datacenter-universe.json
  src/pages/index.astro
  src/pages/datacenter.astro
  public/quotes.json
  public/screener.json
  public/datacenter/          # screener UI + assets
  scripts/fetch-quotes.mjs
  scripts/fetch-screener.py
  scripts/fetch-screener-soft.mjs
  infra/
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
