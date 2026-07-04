# Progress tracker

Mark items as you complete them. Add dates if you want a visible learning journal.

## Environment

- [ ] Docker installed and running
- [ ] `make check-tools` passes
- [ ] Local stack up (`make stack-up`)
- [ ] Jaeger UI reachable at http://localhost:16686
- [ ] (Optional) Go SDK installed
- [ ] (Optional) Python 3.10+ with venv
- [ ] (Optional) kubectl + local Kubernetes cluster

## Curriculum (concept reading)

- [ ] [00 — Overview](curriculum/00-overview.md)
- [ ] [01 — Observability fundamentals](curriculum/01-observability-fundamentals.md)
- [ ] [02 — OpenTelemetry concepts](curriculum/02-opentelemetry-concepts.md)
- [ ] [03 — Traces](curriculum/03-traces.md)
- [ ] [04 — Metrics](curriculum/04-metrics.md)
- [ ] [05 — Logs](curriculum/05-logs.md)
- [ ] [06 — Collector](curriculum/06-collector.md)
- [ ] [07 — Instrumentation](curriculum/07-instrumentation.md)
- [ ] [08 — Kubernetes integration](curriculum/08-kubernetes-integration.md)
- [ ] [09 — Production patterns](curriculum/09-production-patterns.md)

## Labs

- [ ] [Lab 00 — Stack setup](labs/lab-00-stack/)
- [ ] [Lab 01 — First trace](labs/lab-01-first-trace/)
- [ ] [Lab 02 — Metrics](labs/lab-02-metrics/)
- [ ] [Lab 03 — Logs](labs/lab-03-logs/)
- [ ] [Lab 04 — Collector pipelines](labs/lab-04-collector/)
- [ ] [Lab 05 — Auto-instrumentation](labs/lab-05-auto-instrumentation/)
- [ ] [Lab 06 — Kubernetes](labs/lab-06-kubernetes/)
- [ ] [Lab 07 — Sampling](labs/lab-07-sampling/)

## Drills

- [ ] [OTel CLI & env commands](drills/otel-cli-commands.md) — 3 sessions
- [ ] [Instrumentation checklist](drills/instrumentation-checklist.md) — applied to one app
- [ ] [Troubleshooting scenarios](drills/troubleshooting-scenarios.md) — 5+ solved

## Integrations (optional stretch)

- [ ] Export OTLP to Dynatrace ([integrations/dynatrace.md](integrations/dynatrace.md))
- [ ] Deploy OTel Collector on Kubernetes (Lab 06)
- [ ] Correlate traces with existing [kubernetes observability lab](../kubernetes/observability/)

## Portfolio milestone

- [ ] Instrumented an app from another track in this repo
- [ ] Screenshot of trace waterfall in Jaeger in app README
- [ ] Documented `OTEL_*` env vars and Collector config
- [ ] Wrote a mini runbook for "no traces appearing"

---

**Notes / journal**:

```
Date:
Topic:
What broke:
What fixed it:
Command I'll remember:
```
