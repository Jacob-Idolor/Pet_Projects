# Examples

Runnable sample code and infrastructure for the OpenTelemetry lab.

| Directory | Description |
|-----------|-------------|
| [stack/](stack/) | Docker Compose — Collector, Jaeger, Prometheus, Grafana |
| [go-http/](go-http/) | Go HTTP server with manual OTel instrumentation |
| [python-flask/](python-flask/) | Flask app with `opentelemetry-instrument` |
| [kubernetes/](kubernetes/) | Manifests for Lab 06 (in-cluster Collector + app) |

Start with `make stack-up` from the repo root, then [Lab 01](../labs/lab-01-first-trace/).
