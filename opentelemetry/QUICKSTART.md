# Quick start

**Bring up the local observability stack** — one command:

```bash
cd opentelemetry
make stack-up
```

| UI | URL | Purpose |
|----|-----|---------|
| Jaeger | http://localhost:16686 | Trace search and waterfall view |
| Grafana | http://localhost:3000 | Dashboards (admin / practice) |
| Prometheus | http://localhost:9090 | Raw metrics queries |

## First trace in 5 minutes

```bash
make stack-up          # wait until healthy
make lab-01            # prints Lab 01 steps + runs sample traffic
```

Or follow [labs/lab-01-first-trace/README.md](labs/lab-01-first-trace/README.md) manually.

## Folder map

| Folder | What it is |
|--------|------------|
| `curriculum/` | Concept reading — start with 00-overview |
| `labs/` | Hands-on exercises (Lab 00–07) |
| `examples/stack/` | Docker Compose — Collector + backends |
| `examples/go-http/` | Go service with OTel SDK |
| `examples/python-flask/` | Python Flask with auto-instrumentation |
| `configs/` | Reference Collector and Prometheus configs |
| `drills/` | Command cheat sheets and debug scenarios |
| `integrations/` | Kubernetes, Dynatrace, vendor export notes |
| `runbooks/` | Production troubleshooting |

## All make targets

```bash
make help
```

## Track your progress

Edit [PROGRESS.md](PROGRESS.md) as you complete labs and curriculum modules.
