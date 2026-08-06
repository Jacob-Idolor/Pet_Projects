# Production readiness — StocksWatch

What “production-ready” means for this **static** product: predictable deploys, no silent stale data, visible snapshot age, CDN invalidation that matches what changed, and health checks that prove both surfaces work.

## Architecture (keep this)

```text
GitHub Actions  →  S3 (tiered cache)  →  CloudFront
       │                                    │
       ├─ quote + screener refresh          ├─ /health.json
       └─ optional OTel / alerts (SNS)      ├─ /quotes.json
                                            ├─ /screener.json
                                            └─ / (AI Data Center) + /watchlist.html
```

### Surfaces

- `/` — AI Data Center screener (main)
- `/watchlist.html` — archived group watchlist
- `/datacenter.html` — redirect → `/`

No app servers. Scale = CloudFront. Cost stays low ([PASSIVE_INCOME.md](PASSIVE_INCOME.md)).

## Already live — operating model

Treat every merge to `main` as a **production release**.

**Keep forever:** static hosting, Yahoo snapshots in CI, copy-prompt AI Analyst, browser `localStorage` for trends — not a live Flask/LLM server.

**On every deploy/refresh (already wired):**

- Screener Python deps in Actions; screener fetch **hard-fails** if `ok_count` is 0
- Invalidate `/`, `/quotes.json`, `/screener.json`, `/watchlist.html`, `/datacenter/*`
- Health-curl `/`, `/watchlist.html`, `/health.json`, `/quotes.json`, `/screener.json`
- **Freshness assert** — live freshness script (quotes ≤12h, screener ≤24h, coverage ≥85%, news present)
- Datacenter status bar shows **snapshot age** (amber/red when stale)

**After every upload, spot-check:**

1. `/` loads the AI Data Center screener table
2. `/watchlist.html` loads the archived board + quotes
3. `/datacenter.html` redirects to `/`

Local Flask / full backtest: [archive/ai-datacenter-screener/](archive/ai-datacenter-screener/).

See [DEPLOY.md](DEPLOY.md), [COST.md](infra/terraform/COST.md), [PASSIVE_INCOME.md](PASSIVE_INCOME.md).
