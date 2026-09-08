# Production readiness — StocksWatch

What “production-ready” means for this **static** product: predictable deploys, no silent stale data, visible snapshot age, and health checks that prove both surfaces work.

Cloudflare Pages is configured as the intended low-cost host, but the first `terraform apply` and GitHub Actions secrets still need to be run. Run locally with `npm run dev`. Domain `stockswatch.cc` remains managed in Cloudflare DNS.

### Surfaces

- `/` — NBIS Deep Dive research desk (main)
- `/watchlist.html` — archived group watchlist
- `/datacenter.html` — redirect → `/`

`/health.json` reports NBIS as the primary service status and exposes archived quote/screener freshness separately as `legacyStatus`.

### Daily NBIS refresh

- `scripts/fetch/fetch-nbis.py` collects Yahoo market/statement data and SEC EDGAR filings.
- `scripts/ops/validate-nbis-schema.mjs` fails malformed snapshots.
- `.github/workflows/stocks-radar-nbis-daily.yml` builds and uploads `dist/` to Cloudflare Pages once per day.
- `infra/terraform/` owns the Pages project, custom domain, and DNS record; it does not store provider credentials.

Local Flask / full backtest: [archive/ai-datacenter-screener/](archive/ai-datacenter-screener/).

See [PRODUCT.md](PRODUCT.md) for the research-product and monetization path, and [infra/terraform/README.md](infra/terraform/README.md) for the deployment checklist.
