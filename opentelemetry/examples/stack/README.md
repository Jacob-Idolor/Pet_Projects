# Local observability stack

Docker Compose bundle for the OpenTelemetry Learning Lab.

## Components

| Service | Port | Purpose |
|---------|------|---------|
| otel-collector | 4317, 4318, 8889 | OTLP ingest + Prometheus exporter |
| jaeger | 16686 | Trace UI |
| prometheus | 9090 | Metrics |
| grafana | 3000 | Dashboards (admin / practice) |
| go-http | 8080 | Instrumented Go sample |
| python-flask | 8081 | Auto-instrumented Python sample |

## Usage

From `opentelemetry/`:

```bash
make stack-up
make stack-down
```

## Config files

- `otel-collector-config.yaml` — Collector pipelines
- `prometheus.yml` — scrapes Collector `:8889`
- `grafana/provisioning/` — datasource + RED dashboard

## Learn

- [Lab 00](../../labs/lab-00-stack/)
