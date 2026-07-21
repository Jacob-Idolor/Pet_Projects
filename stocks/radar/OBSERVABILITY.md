# Observability — OpenTelemetry for Stocks Radar

Deeper visibility **without** putting a Collector in the AWS static-site stack.

| Signal source | What you learn | Cost |
|---------------|----------------|------|
| CloudFront metrics (digest) | Traffic / bytes | ~$0 (already) |
| **OTel on CI scripts** (this doc) | Yahoo latency, coverage, alert fires | $0 when off; free SaaS / local stack when on |
| Browser RUM | Not wired yet | Defer until traffic justifies it |

## What is instrumented

| Script | Service name | Spans / attributes |
|--------|--------------|--------------------|
| `npm run update-quotes` | `stocks-radar-quotes` | `fetch-quotes.run`, per-symbol `yahoo.fetch_symbol`, coverage / partial / failed counts |
| `npm run alerts` | `stocks-radar-alerts` | `signal-alerts.run`, load quotes, personal publish, hit / cooldown / subscriber counts |

Off by default: no OTLP export unless `OTEL_EXPORTER_OTLP_ENDPOINT` is set.

## Local (your OTel lab)

```bash
cd opentelemetry && make stack-up   # Collector :4318, Jaeger :16686

cd stocks/radar
export OTEL_EXPORTER_OTLP_ENDPOINT=http://localhost:4318
# optional: also print spans in the terminal
export OTEL_TRACES_EXPORTER=console

npm run update-quotes
npm run alerts   # ALERTS_DRY_RUN=true is fine

# Open Jaeger → service stocks-radar-quotes / stocks-radar-alerts
open http://localhost:16686
```

## Console-only (no Collector)

```bash
OTEL_EXPORTER_OTLP_ENDPOINT=http://127.0.0.1:4318 \
OTEL_TRACES_EXPORTER=console \
npm run update-quotes
```

OTLP export may warn if nothing listens on 4318; console spans still print.

## GitHub Actions (optional)

Add a repository variable or secret when you have an OTLP endpoint (Grafana Cloud free, Honeycomb free, etc.):

| Name | Example |
|------|---------|
| `OTEL_EXPORTER_OTLP_ENDPOINT` | `https://otlp-gateway-prod-…/otlp` |
| `OTEL_EXPORTER_OTLP_HEADERS` | `Authorization=Basic …` (if required by vendor) |

Wire into **refresh quotes** / **signal alerts** workflows after deploy is re-enabled. Until then, leave unset — Actions behave as today.

## Design rules (cost + scale)

- **No** OTel Collector / Jaeger / Prometheus in Radar Terraform
- Scripts stay useful with OTel completely off
- Prefer attributes on spans (`radar.*`, `yahoo.*`, `stock.symbol`) over a separate metrics pipeline for now
- Browser RUM later, heavily sampled, only after AdSense traffic exists

## Related

- Local stack: [`../../opentelemetry/`](../../opentelemetry/)
- Cost model: [PASSIVE_INCOME.md](PASSIVE_INCOME.md) · [infra/terraform/COST.md](infra/terraform/COST.md)
