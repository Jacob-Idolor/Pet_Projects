# OpenTelemetry Learning Lab

A **practice-first** path for learning OpenTelemetry — the industry-standard observability framework for traces, metrics, and logs.

| Path | What | When |
|------|------|------|
| **Read** | Curriculum + learning path | Understand concepts before touching code |
| **Stack** | Docker Compose — Collector, Jaeger, Prometheus, Grafana | Run a local backend in one command |
| **Labs** | 8 guided exercises | Instrument apps, configure pipelines, debug gaps |
| **Drills** | Command sheets + troubleshooting scenarios | Build muscle memory |

Start here: run `make stack-up` → open Jaeger at http://localhost:16686

Full learning guide: **[LEARNING-PATH.md](LEARNING-PATH.md)**

---

## Why OpenTelemetry?

OpenTelemetry (OTel) is a **CNCF graduated** project and the de facto standard for:

- **Vendor-neutral instrumentation** — write once, export to Jaeger, Grafana, Dynatrace, Datadog, Honeycomb, and more
- **Unified signals** — traces, metrics, and logs share context (trace IDs in logs, exemplars on metrics)
- **Automatic + manual instrumentation** — auto-instrument HTTP/DB/gRPC, then add custom spans where it matters

If you already use the [Kubernetes lab](../kubernetes/) or [Dynatrace track](../Dynatrace/), OTel is the bridge between app code and those backends.

---

## Fast commands

```bash
cd opentelemetry

make help           # all targets
make stack-up       # Jaeger + Prometheus + Grafana + OTel Collector
make stack-down     # tear down
make lab-01         # run first trace lab
make check-tools    # verify docker, curl, etc.
```

---

## Repository layout

```
opentelemetry/
├── curriculum/          # Concept deep-dives (reading)
├── labs/                # 8 guided hands-on labs
├── drills/              # CLI commands, checklists, troubleshooting
├── examples/            # Sample apps + docker-compose stack
│   ├── stack/           # Local observability backend
│   ├── go-http/         # Go app with manual instrumentation
│   └── python-flask/    # Python app with auto-instrumentation
├── configs/             # Collector, Prometheus configs (reference)
├── integrations/        # Kubernetes, Dynatrace, cloud vendor notes
├── runbooks/            # Production troubleshooting guides
├── scripts/             # Stack bootstrap, lab helpers
├── Makefile             # One entry point
├── SETUP.md             # Tool installation
├── LEARNING-PATH.md     # Recommended order + learning loop
└── PROGRESS.md          # Your checklist
```

---

## Learning loop

1. **Read** — Skim the curriculum module for the topic (15 min)
2. **Stack** — Ensure `make stack-up` is running
3. **Lab** — Follow the lab steps, generate telemetry, view in Jaeger/Grafana
4. **Drill** — Repeat commands from `drills/` without notes
5. **Reflect** — Log one takeaway in [PROGRESS.md](PROGRESS.md)

---

## Prerequisites

| Tool | Purpose |
|------|---------|
| Docker | Run the local stack and sample apps |
| curl / httpie | Hit endpoints to generate traces |
| (Optional) Go 1.21+ | Build the Go sample app locally |
| (Optional) Python 3.10+ | Run the Python auto-instrumentation lab |
| (Optional) kubectl + kind | Lab 06 — Kubernetes integration |

See [SETUP.md](SETUP.md) for install links.

---

## What's free vs what costs money

| Item | Cost |
|------|------|
| Local Docker stack | **$0** |
| OTel SDKs and Collector | **$0** (open source) |
| Managed backends (Dynatrace, Datadog, etc.) | **Vendor pricing** — not included |
| Grafana Cloud / Honeycomb free tiers | **$0** at low volume — optional export targets |

---

## Related tracks in this repo

| Track | Connection |
|-------|------------|
| [kubernetes/](../kubernetes/) | Lab 06 deploys OTel on Kubernetes; curriculum 06 covers K8s observability |
| [Dynatrace/](../Dynatrace/) | Dynatrace accepts OTLP — same instrumentation, different backend |
| [kubernetes/observability](../kubernetes/observability/) | Prometheus/Grafana lab complements OTel metrics |

---

## Contributing

See [CONTRIBUTING.md](CONTRIBUTING.md). Add labs, fix steps, share runbooks — keep everything runnable locally with Docker.
