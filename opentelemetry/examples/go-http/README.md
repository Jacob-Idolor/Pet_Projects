# Go HTTP sample — OpenTelemetry instrumentation

Small HTTP service demonstrating manual spans, otelhttp middleware, metrics, and trace-correlated JSON logs.

## Run locally

Requires the lab stack (`make stack-up` from repo root).

```bash
export OTEL_EXPORTER_OTLP_ENDPOINT=http://localhost:4318
export OTEL_SERVICE_NAME=go-http-lab
go run .
```

## Endpoints

| Path | Behavior |
|------|----------|
| `/` | Hello + structured log |
| `/work` | Single child span + sleep |
| `/chain` | Parent + downstream child spans |
| `/error` | ERROR span status + 500 response |
| `/health` | Health check |

## View telemetry

- Traces: http://localhost:16686 (service `go-http-lab`)
- Metrics: http://localhost:9090
- Logs: `docker compose logs go-http` or stdout JSON with `trace_id`

## Learn

- [Lab 01](../../labs/lab-01-first-trace/)
- [Curriculum: Traces](../../curriculum/03-traces.md)
