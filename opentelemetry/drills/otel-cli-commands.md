# OpenTelemetry CLI & environment reference

Practice these until automatic. Run labs with `make stack-up` active.

## Environment variables (SDK)

```bash
export OTEL_SERVICE_NAME=my-service
export OTEL_EXPORTER_OTLP_ENDPOINT=http://localhost:4318
export OTEL_TRACES_EXPORTER=otlp
export OTEL_METRICS_EXPORTER=otlp
export OTEL_LOGS_EXPORTER=otlp
export OTEL_RESOURCE_ATTRIBUTES=deployment.environment=dev,service.version=1.0.0
```

## Docker stack

```bash
make stack-up
make stack-status
make stack-logs
make stack-down
make lab-sample-traffic
```

## Jaeger workflow

1. Open http://localhost:16686
2. Select **Service** → **Find Traces**
3. Open trace → read waterfall
4. Copy **Trace ID** for log correlation

## Collector inspection

```bash
docker compose -f examples/stack/docker-compose.yml logs otel-collector --tail 50
docker compose -f examples/stack/docker-compose.yml restart otel-collector
```

## Prometheus

```bash
# Targets
open http://localhost:9090/targets

# Example query
curl -s 'http://localhost:9090/api/v1/query?query=up' | jq .
```

## Python auto-instrumentation

```bash
opentelemetry-instrument python app.py
opentelemetry-bootstrap -a install   # install instrumentation packages
```

## Go run with OTel

```bash
cd examples/go-http
OTEL_EXPORTER_OTLP_ENDPOINT=http://localhost:4318 OTEL_SERVICE_NAME=go-http-lab go run .
```

## Useful curl patterns

```bash
curl -v http://localhost:8080/work
curl -w "\nstatus:%{http_code}\n" http://localhost:8080/error
for i in $(seq 1 20); do curl -s http://localhost:8080/ > /dev/null; done
```

## Drill sessions

| Session | Goal | Time |
|---------|------|------|
| 1 | Set all OTEL_* vars from memory | 5 min |
| 2 | Start stack, generate traffic, find trace in Jaeger | 10 min |
| 3 | Restart Collector, read logs, fix wrong endpoint | 15 min |

## Spec links

- [Environment variables](https://opentelemetry.io/docs/specs/otel/configuration/sdk-environment-variables/)
- [OTLP specification](https://opentelemetry.io/docs/specs/otlp/)
