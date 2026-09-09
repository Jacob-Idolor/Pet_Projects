# Observability — StocksWatch

StocksWatch uses build-time checks and a public health snapshot instead of an always-on telemetry stack. This keeps the early product inexpensive and reduces moving parts.

## Signals

| Signal | Source | Purpose |
| --- | --- | --- |
| NBIS snapshot status | `/health.json` | Freshness, price-history coverage, and filing count |
| Screener status | `/health.json` | Freshness and coverage of the optional AI-infrastructure screener |
| Build validity | GitHub/Cloudflare build output | Schema, static build, and security-scan result |
| User behavior | Future privacy-conscious analytics | Returning readers, newsletter opt-ins, and paid conversion |

## Local checks

```bash
npm run nbis:schema
npm run screener:schema
npm run freshness
npm run security:dist
```

The daily workflow should alert on a failed build or an unhealthy `/health.json`. Do not add a hosted observability service until traffic or operational risk justifies its cost.
