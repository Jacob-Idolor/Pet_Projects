# Production readiness — Stocks Radar

What “professional / production-ready” means for this **static** product, what is already in code, and what you still flip on in AWS / Google.

## Architecture (keep this)

```text
GitHub Actions  →  S3 (tiered cache)  →  CloudFront
       │                                    │
       ├─ quote refresh + OTel (optional)   ├─ /health.json
       └─ personal alerts (SNS)             └─ /settings.json
```

No app servers. Scale = CloudFront. Cost stays low ([PASSIVE_INCOME.md](PASSIVE_INCOME.md)).

## Configuration model

| Layer | Where | Holds |
|-------|--------|--------|
| **Site settings** | `src/data/site-settings.json` | Features, quote staleness, board defaults, alert defaults |
| **Env / CI vars** | `.env`, GitHub Actions vars | Site URL, AdSense IDs, OTEL endpoint |
| **Secrets** | GitHub Secrets + `terraform.tfvars` | AWS keys, SNS ARNs, subscriber emails |
| **Runtime public** | `/settings.json`, `/health.json` | Safe snapshot for ops + UI |

```bash
npm run config:validate           # PR / local (lenient)
npm run config:validate:prod      # strict — requires real STOCKS_RADAR_SITE
```

Edit product knobs in `site-settings.json`, then rebuild. Toggle features with booleans under `features.*`. The public board does **not** show a settings or personal-alerts panel — those are ops-only (`/settings.json`, [ALERTS.md](ALERTS.md)).

## Production checklist

### A. Code / repo (this PR)

- [x] Unified settings + validation
- [x] Health + public settings endpoints
- [x] Quote resilience + stale UI
- [x] Personal alert rules
- [x] Tiered caching / narrow invalidation
- [x] Optional OTel on scripts
- [ ] Merge PR #38 to `main`

### B. AWS go-live — see [GO_LIVE.md](GO_LIVE.md)

- [ ] `terraform apply` (budget email on)
- [ ] IAM policy from `infra/iam/deploy-policy.json` (narrowed — [SECURITY.md](SECURITY.md))
- [ ] `bash infra/go-live.sh` (secrets + `STOCKS_RADAR_SITE`)
- [ ] `npm run go-live:preflight -- --strict`
- [ ] Set `STOCKS_RADAR_DEPLOY_ENABLED=true`
- [ ] Confirm `/health.json` and `/settings.json` on CloudFront
- [ ] Confirm `/_private/alert-state.json` is **not** publicly readable (403/404)
- [ ] Optional: digest + `alert_subscribers` + `STOCKS_RADAR_ALERT_TOPICS` — [ALERTS.md](ALERTS.md)

### C. Domain + AdSense (passive income)

- [ ] Buy domain — [DOMAIN.md](DOMAIN.md)
- [ ] `enable_custom_domain = true` + ACM CNAMEs
- [ ] Update variable `STOCKS_RADAR_SITE=https://yourdomain.com`
- [ ] AdSense site approval + slots — [ADSENSE.md](ADSENSE.md)
- [x] Deploy workflow runs `config:validate:prod` when `STOCKS_RADAR_ENV=production`

### D. Observability

- [ ] Optional `OTEL_EXPORTER_OTLP_ENDPOINT` (Grafana Cloud / Honeycomb free) — [OBSERVABILITY.md](OBSERVABILITY.md)
- [ ] Watch AWS budget + AdSense RPM monthly

## Environments

| Env | `STOCKS_RADAR_ENV` | Site URL | Ads | Strict validate |
|-----|--------------------|----------|-----|-----------------|
| Local | `development` | localhost | preview boxes | no |
| CloudFront trial | `staging` or unset | `*.cloudfront.net` | usually off | optional |
| Public | `production` | custom domain | on after approval | **yes** |

## What we are *not* adding yet (on purpose)

| Item | Why wait |
|------|----------|
| App server / DB | Breaks cost model; IndexedDB + git is enough |
| WAF | ~$5+/mo before revenue |
| Self-serve alert signup UI | Needs backend auth |
| Full browser RUM | Sample later when traffic exists |

## Quick verify after deploy

```bash
curl -sS https://YOUR_HOST/health.json | jq .
curl -sS https://YOUR_HOST/settings.json | jq .features
curl -sS https://YOUR_HOST/quotes.json | jq '{count,total,partial,fetchedAt}'
```
