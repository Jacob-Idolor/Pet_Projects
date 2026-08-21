# Observability — OpenTelemetry for Stocks Radar

Deeper visibility for local and CI scripts. There is no AWS static-site stack right now.

| Signal source | What you learn | Cost |
|---------------|----------------|------|
| **OTel on CI scripts** (this doc) | Yahoo latency, coverage, alert fires | $0 when off; free SaaS / local stack when on |
| Browser RUM | Not wired yet | Defer until traffic justifies it |

## What is instrumented

| Script | Service name | Spans / attributes |
|--------|--------------|--------------------|
| `npm run update-quotes` | `stocks-radar-quotes` | `fetch-quotes.run`, per-symbol `yahoo.fetch_symbol`, coverage / partial / failed counts |
| `npm run alerts` | `stocks-radar-alerts` | `signal-alerts.run`, load quotes, personal publish, hit / cooldown / subscriber counts |

Off by default: no OTLP export unless `OTEL_EXPORTER_OTLP_ENDPOINT` is set.

OTel SDKs live in **`optionalDependencies`**. Quote-refresh / alert jobs use `npm ci --omit=optional` (no Astro build). **Deploy/validate must use full `npm ci`** — Astro’s Rolldown platform bindings are also optional and break with `--omit=optional`.

For local traces:

```bash
cd stocks/radar
npm install   # includes optional OTel + platform bindings
export OTEL_EXPORTER_OTLP_ENDPOINT=http://localhost:4318
npm run update-quotes
```

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

Wire into quote-refresh / alert jobs if you add them again. Until then, leave unset.

## Design rules (cost + scale)

- **No** OTel Collector in hosting unless you explicitly want it
- Scripts stay useful with OTel completely off
- Prefer attributes on spans (`radar.*`, `yahoo.*`, `stock.symbol`) over a separate metrics pipeline for now
- Browser RUM later, heavily sampled, only after AdSense traffic exists

## Related

- Local stack: [`../../opentelemetry/`](../../opentelemetry/)
- Cost model: [PASSIVE_INCOME.md](PASSIVE_INCOME.md)
