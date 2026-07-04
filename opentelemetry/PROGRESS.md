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

- [ ] [CORE-CONCEPTS.md](CORE-CONCEPTS.md) — master map read
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

## Core concepts (extended — for full understanding)

- [ ] [10 — Context & propagation](curriculum/10-context-and-propagation.md)
- [ ] [11 — Data model & OTLP](curriculum/11-data-model-and-otlp.md)
- [ ] [12 — Semantic conventions](curriculum/12-semantic-conventions.md)
- [ ] [13 — Baggage & correlation](curriculum/13-baggage-and-correlation.md)
- [ ] [14 — Architecture decisions](curriculum/14-architecture-decisions.md)

## Teachings (deep guides)

- [ ] [01 — The complete picture](teachings/01-the-complete-picture.md)
- [ ] [02 — Data model](teachings/02-data-model.md)
- [ ] [03 — Context propagation](teachings/03-context-propagation.md)
- [ ] [04 — SDK internals](teachings/04-sdk-internals.md)
- [ ] [05 — OTLP and backends](teachings/05-otlp-and-backends.md)
- [ ] [06 — Semantic conventions](teachings/06-semantic-conventions.md)
- [ ] [07 — Sampling strategies](teachings/07-sampling-strategies.md)
- [ ] [09 — History and ecosystem](teachings/09-history-and-ecosystem.md)
- [ ] [10 — Mastery checklist](teachings/10-mastery-checklist.md) — all tiers checked
- [ ] [Glossary](teachings/GLOSSARY.md) — reviewed

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
- [ ] [Concept self-check](drills/concept-self-check.md) — 80%+ without notes
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
