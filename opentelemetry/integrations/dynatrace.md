# Dynatrace OTLP export

Export the same instrumentation to Dynatrace via OTLP — no OneAgent required for this path (OneAgent is an alternative).

## Prerequisites

- Dynatrace environment with OTLP ingest enabled
- API token with **OpenTelemetry trace ingest** permissions

## Collector exporter snippet

```yaml
exporters:
  otlphttp/dynatrace:
    endpoint: https://{YOUR_ENV_ID}.live.dynatrace.com/api/v2/otlp
    headers:
      Authorization: "Api-Token ${DT_API_TOKEN}"

service:
  pipelines:
    traces:
      exporters: [otlp/jaeger, otlphttp/dynatrace]
    metrics:
      exporters: [prometheus, otlphttp/dynatrace]
```

Pass token via environment — never commit it:

```bash
export DT_API_TOKEN=dt0c01.xxxx
docker compose -f examples/stack/docker-compose.yml up -d
```

## SDK direct export (alternative)

```bash
export OTEL_EXPORTER_OTLP_ENDPOINT=https://{YOUR_ENV_ID}.live.dynatrace.com/api/v2/otlp
export OTEL_EXPORTER_OTLP_HEADERS="Authorization=Api-Token%20${DT_API_TOKEN}"
```

## Mapping to Dynatrace concepts

| OTel | Dynatrace |
|------|-----------|
| Trace | PurePath / distributed trace |
| Span | Span |
| Resource attributes | Server-side context |
| Metrics | Custom metrics / built-in ingestion |

## Related in this repo

- [Dynatrace track](../../Dynatrace/)
- [kubernetes observability lab](../../kubernetes/observability/)

## Docs

- [Dynatrace OpenTelemetry](https://docs.dynatrace.com/docs/ingest-from/opentelemetry)
