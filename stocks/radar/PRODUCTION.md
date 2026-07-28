# Production readiness — StocksWatch

What “production-ready” means for this **static** product: predictable deploys, no silent stale data, visible snapshot age, CDN invalidation that matches what changed, and health checks that prove both surfaces work.

## Architecture (keep this)

```text
GitHub Actions  →  S3 (tiered cache)  →  CloudFront
       │                                    │
       ├─ quote + screener refresh          ├─ /health.json
       └─ optional OTel / alerts (SNS)      ├─ /quotes.json
                                            ├─ /screener.json
                                            └─ /datacenter.html
```

No app servers. Scale = CloudFront. Cost stays low ([PASSIVE_INCOME.md](PASSIVE_INCOME.md)).

## Already live — operating model

Treat every merge to `main` as a **production release**.

**Keep forever:** static hosting, Yahoo snapshots in CI, copy-prompt AI Analyst, browser `localStorage` for trends — not a live Flask/LLM server.

**On every deploy/refresh (already wired):**

- Screener Python deps in Actions; screener fetch **hard-fails** if `ok_count` is 0
- Invalidate `/quotes.json`, `/screener.json`, `/datacenter.html`, `/datacenter/*`
- Health-curl `/`, `/health.json`, `/quotes.json`, `/screener.json`, `/datacenter.html`
- **Freshness assert** — `node scripts/check-live-freshness.mjs --url $HOST` (quotes ≤12h, screener ≤24h, coverage ≥85%, news present)
- Datacenter status bar shows **snapshot age** (amber/red when stale)

**After every upload, spot-check:**

1. Home board loads quotes
2. `/datacenter.html` loads the table
3. Expand one row — headlines present

## Next hardening (do in this order)

| Priority | Item | Why |
|----------|------|-----|
| **Now** | ~~Freshness assert~~ **done** — `npm run freshness` + deploy step | Catch silent stale JSON |
| **Now** | ~~Visible snapshot age~~ **done** — datacenter status bar | Trust / “is this live?” |
| **Now** | ~~tokens.css sync~~ **done** — `npm run sync:tokens` in prebuild | No Home/DC token drift |
| **Next** | Shorter cache or content-hash for `public/datacenter/*.js` | Shim/UI fixes ship same day |
| **Next** | CI smoke: non-empty `news.json` + screener schema check | Stop contract regressions |
| **Later** | Finish custom domain / AdSense ([DOMAIN.md](DOMAIN.md)) | Shareable URL + monetize |
| **Later** | Optional OTel on fetch scripts ([OBSERVABILITY.md](OBSERVABILITY.md)) | Yahoo failure visibility |
| **Defer** | Live Yahoo / in-app LLM backend | Breaks the $0.50–3/mo model |

## Configuration model

| Layer | Where | Holds |
|-------|--------|--------|
| **Site settings** | `src/data/site-settings.json` | Features, quote staleness, board defaults |
| **Env / CI vars** | `.env`, GitHub Actions vars | Site URL, AdSense IDs, OTEL endpoint |
| **Secrets** | GitHub Secrets + `terraform.tfvars` | AWS keys, SNS ARNs |
| **Runtime public** | `/settings.json`, `/health.json` | Safe snapshot for ops + UI |

```bash
npm run config:validate           # PR / local (lenient)
npm run config:validate:prod      # strict — requires real STOCKS_RADAR_SITE
```

## Production checklist

### A. Code / repo

- [x] Unified settings + validation
- [x] Health + public settings endpoints
- [x] Quote resilience + stale UI
- [x] Datacenter screener on static hosting
- [x] Tiered caching / narrow invalidation
- [x] Optional OTel on scripts
- [ ] Ship latest UI/API/news fixes to `main`

### B. AWS — see [GO_LIVE.md](GO_LIVE.md)

- [x] Deploy enabled (`STOCKS_RADAR_DEPLOY_ENABLED`) when live
- [ ] Confirm `/_private/alert-state.json` is **not** publicly readable
- [ ] Optional: digest + alert subscribers — [ALERTS.md](ALERTS.md)

### C. Domain + AdSense

- [ ] Custom domain fully wired — [DOMAIN.md](DOMAIN.md)
- [ ] `STOCKS_RADAR_SITE=https://stockswatch.cc` (or your domain)
- [ ] AdSense approval + slots — [ADSENSE.md](ADSENSE.md)

### D. Observability

- [ ] Optional `OTEL_EXPORTER_OTLP_ENDPOINT` — [OBSERVABILITY.md](OBSERVABILITY.md)
- [ ] Watch AWS budget monthly — [infra/terraform/COST.md](infra/terraform/COST.md)

## Environments

| Env | `STOCKS_RADAR_ENV` | Site URL | Ads | Strict validate |
|-----|--------------------|----------|-----|-----------------|
| Local | `development` | localhost | preview boxes | no |
| CloudFront trial | `staging` or unset | `*.cloudfront.net` | usually off | optional |
| Public | `production` | custom domain | on after approval | **yes** |

## What we are *not* adding yet (on purpose)

| Item | Why wait |
|------|----------|
| App server / DB | Breaks cost model |
| WAF | ~$5+/mo before revenue |
| Self-serve alert signup UI | Needs backend auth |
| Full browser RUM | Sample later when traffic exists |
| In-app LLM generation | Needs API keys + server; copy-prompt is enough |

## Quick verify after deploy

```bash
HOST=https://stockswatch.cc   # or your CloudFront domain
curl -sS "$HOST/health.json" | jq .
curl -sS "$HOST/settings.json" | jq .features
curl -sS "$HOST/quotes.json" | jq '{fetchedAt,count:(.quotes|length)}'
curl -sS "$HOST/screener.json" | jq '{fetched_at_iso,ok_count,ticker_count}'
curl -sS -o /dev/null -w "%{http_code}\n" "$HOST/datacenter.html"
```
