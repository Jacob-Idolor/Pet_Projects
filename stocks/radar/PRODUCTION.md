# Production readiness — StocksWatch

What “production-ready” means for this **static** product: predictable deploys, no silent stale data, visible snapshot age, and health checks that prove both surfaces work.

Hosting is currently **unconfigured**. Run locally with `npm run dev`. Domain `stockswatch.cc` is ready to point at a new origin — [DEPLOY.md](DEPLOY.md), [DOMAIN.md](DOMAIN.md).

### Surfaces

- `/` — AI Data Center screener (main)
- `/watchlist.html` — archived group watchlist
- `/datacenter.html` — redirect → `/`

Local Flask / full backtest: [archive/ai-datacenter-screener/](archive/ai-datacenter-screener/).

See [PASSIVE_INCOME.md](PASSIVE_INCOME.md) for AdSense vs hosting cost notes once something is live again.
