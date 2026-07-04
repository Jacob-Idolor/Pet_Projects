# Local environment setup

Use this when you want **hands-on OpenTelemetry practice** on your machine.

## Prerequisites

| Tool | Purpose | Install |
|------|---------|---------|
| Docker | Run stack + sample apps | [docs.docker.com/get-docker](https://docs.docker.com/get-docker/) |
| Docker Compose v2 | Orchestrate the lab stack | Included with Docker Desktop |
| curl or httpie | Generate HTTP traffic | Usually pre-installed |
| Go 1.21+ (optional) | Build Go sample locally | [go.dev/dl](https://go.dev/dl/) |
| Python 3.10+ (optional) | Auto-instrumentation lab | [python.org](https://www.python.org/downloads/) |
| kubectl + kind (optional) | Lab 06 Kubernetes | [kubernetes.io/docs/tasks/tools](https://kubernetes.io/docs/tasks/tools/) |

Verify:

```bash
docker version
docker compose version
curl --version
```

Run from repo:

```bash
cd opentelemetry
make check-tools
```

---

## Option A — Docker stack only (recommended start)

Best for Labs 00–05 and 07. No language SDK install required — sample apps run in containers.

```bash
cd opentelemetry
make stack-up
```

Teardown:

```bash
make stack-down
```

---

## Option B — Go SDK on host

For editing and rebuilding the Go sample quickly:

```bash
cd opentelemetry/examples/go-http
go mod download
export OTEL_EXPORTER_OTLP_ENDPOINT=http://localhost:4318
export OTEL_SERVICE_NAME=go-http-lab
go run .
```

Requires the stack running (`make stack-up`).

---

## Option C — Python auto-instrumentation on host

```bash
cd opentelemetry/examples/python-flask
python -m venv .venv
source .venv/bin/activate   # Windows: .venv\Scripts\activate
pip install -r requirements.txt
export OTEL_EXPORTER_OTLP_ENDPOINT=http://localhost:4318
export OTEL_SERVICE_NAME=python-flask-lab
opentelemetry-instrument python app.py
```

---

## Option D — Kubernetes (Lab 06)

Requires a local cluster. If you use the [kubernetes/](../kubernetes/) lab:

```bash
cd kubernetes
make local-up
cd ../opentelemetry
# follow labs/lab-06-kubernetes/README.md
```

---

## Environment variables reference

| Variable | Typical value | Meaning |
|----------|---------------|---------|
| `OTEL_EXPORTER_OTLP_ENDPOINT` | `http://localhost:4318` | Where SDK sends OTLP (HTTP) |
| `OTEL_SERVICE_NAME` | `my-service` | Resource attribute — appears in Jaeger service list |
| `OTEL_TRACES_EXPORTER` | `otlp` | Trace export protocol |
| `OTEL_METRICS_EXPORTER` | `otlp` | Metrics export protocol |
| `OTEL_LOGS_EXPORTER` | `otlp` | Logs export (when enabled) |
| `OTEL_RESOURCE_ATTRIBUTES` | `deployment.environment=dev` | Extra resource metadata |

Full list: [OpenTelemetry environment variable spec](https://opentelemetry.io/docs/specs/otel/configuration/sdk-environment-variables/)

---

## Troubleshooting setup

| Problem | Fix |
|---------|-----|
| Port 4317/4318 in use | `make stack-down`, check `docker ps`, change ports in `examples/stack/docker-compose.yml` |
| Jaeger empty | Confirm Collector logs: `docker compose -f examples/stack/docker-compose.yml logs otel-collector` |
| Grafana login fails | Default: `admin` / `practice` (see stack README) |
| Go build errors | `go mod tidy` in `examples/go-http` |
| Python `opentelemetry-instrument` not found | Activate venv; `pip install opentelemetry-distro opentelemetry-exporter-otlp` |

Once Jaeger shows services after `make lab-01`, start [Lab 02](labs/lab-02-metrics/README.md).
