# How to learn with this lab

This repo is designed for **concept → instrument → observe → debug**. OpenTelemetry is best learned by generating real telemetry and tracing it through the pipeline.

**For full conceptual mastery**, start with **[CORE-CONCEPTS.md](CORE-CONCEPTS.md)** and the [teachings/](teachings/) deep guides — then do labs to make it stick.

## The learning loop

```
1. Read CORE-CONCEPTS + teaching     → build mental model
2. Read curriculum module            → structured topic coverage
3. Start local stack                 → make stack-up
4. Run the lab                       → instrument, export, view in UI
5. Self-check + mastery checklist    → prove understanding without notes
6. Mark complete + notes             → PROGRESS.md
```

## Recommended path (hands-on)

| Step | Curriculum | Lab | Drill |
|------|------------|-----|-------|
| 1 | [00 — Overview](curriculum/00-overview.md) | — | — |
| 2 | [01 — Observability fundamentals](curriculum/01-observability-fundamentals.md) | [Lab 00 — Stack](labs/lab-00-stack/) | — |
| 3 | [02 — OTel concepts](curriculum/02-opentelemetry-concepts.md) + [teaching 01](teachings/01-the-complete-picture.md) | [Lab 01 — First trace](labs/lab-01-first-trace/) | [CLI commands](drills/otel-cli-commands.md) |
| 4 | [03 — Traces](curriculum/03-traces.md) + [teaching 02](teachings/02-data-model.md) | [Lab 01](labs/lab-01-first-trace/) | troubleshooting |
| 5 | [04 — Metrics](curriculum/04-metrics.md) | [Lab 02 — Metrics](labs/lab-02-metrics/) | — |
| 6 | [05 — Logs](curriculum/05-logs.md) | [Lab 03 — Logs](labs/lab-03-logs/) | — |
| 7 | [06 — Collector](curriculum/06-collector.md) + [teaching 05](teachings/05-otlp-and-backends.md) | [Lab 04 — Collector](labs/lab-04-collector/) | CLI commands |
| 8 | [07 — Instrumentation](curriculum/07-instrumentation.md) + [teaching 04](teachings/04-sdk-internals.md) | [Lab 05 — Auto-instrumentation](labs/lab-05-auto-instrumentation/) | [checklist](drills/instrumentation-checklist.md) |
| 9 | [08 — Kubernetes](curriculum/08-kubernetes-integration.md) | [Lab 06 — K8s](labs/lab-06-kubernetes/) | — |
| 10 | [09 — Production](curriculum/09-production-patterns.md) + [teaching 07](teachings/07-sampling-strategies.md) | [Lab 07 — Sampling](labs/lab-07-sampling/) | troubleshooting |

Run the stack: `make stack-up`

## Recommended path (core concepts — read deeply)

After step 3 above, work through these **before** rushing to Lab 07:

| Step | Focus | Materials |
|------|-------|-----------|
| A | Context & propagation | [curriculum/10](curriculum/10-context-and-propagation.md), [teaching/03](teachings/03-context-propagation.md) |
| B | Data model & OTLP | [curriculum/11](curriculum/11-data-model-and-otlp.md), [teachings/02](teachings/02-data-model.md), [05](teachings/05-otlp-and-backends.md) |
| C | Semantic conventions | [curriculum/12](curriculum/12-semantic-conventions.md), [teaching/06](teachings/06-semantic-conventions.md) |
| D | Correlation & baggage | [curriculum/13](curriculum/13-baggage-and-correlation.md) |
| E | Architecture decisions | [curriculum/14](curriculum/14-architecture-decisions.md), [teaching/09](teachings/09-history-and-ecosystem.md) |
| F | Prove mastery | [concept-self-check](drills/concept-self-check.md), [mastery checklist](teachings/10-mastery-checklist.md) |

## Difficulty levels

- **Beginner** — CORE-CONCEPTS, stack setup, first trace, Jaeger UI, auto-instrumentation
- **Intermediate** — Context propagation, data model, Collector pipelines, semantic conventions
- **Advanced** — Tail sampling, K8s operator, architecture decisions, teach-back exercise

## Tips for retention

1. **Draw the pipeline** after every module — App → SDK → OTLP → Collector → Backend.
2. **The 15 ideas** in [CORE-CONCEPTS.md](CORE-CONCEPTS.md) — explain each aloud in 30 seconds.
3. **One signal at a time** — master traces before layering metrics and logs.
4. **Self-check closed-book** — [concept-self-check.md](drills/concept-self-check.md) after each teaching block.
5. **Teach-back** — explain OTel to an imaginary teammate ([mastery checklist](teachings/10-mastery-checklist.md)).
6. **Break things on purpose** — stop Collector, break propagation, fix with runbooks.

## Methodologies to study alongside OTel

| Method | What it teaches | Where in this lab |
|--------|-----------------|-------------------|
| **Three pillars** | Metrics, logs, traces | [curriculum/01](curriculum/01-observability-fundamentals.md) |
| **RED method** | Rate, Errors, Duration for services | [curriculum/04](curriculum/04-metrics.md), Lab 02 |
| **USE method** | Utilization, Saturation, Errors for resources | Lab 02, K8s integration |
| **Golden signals** | Latency, traffic, errors, saturation | curriculum 01, 09 |
| **Distributed tracing** | Span context propagation | [curriculum/10](curriculum/10-context-and-propagation.md), [teaching/03](teachings/03-context-propagation.md) |
| **Semantic conventions** | Standard attribute names | [curriculum/12](curriculum/12-semantic-conventions.md) |
| **Unified observability** | Metrics → traces → logs workflow | [curriculum/13](curriculum/13-baggage-and-correlation.md) |

## When you're stuck

| Symptom | First check |
|---------|-------------|
| No traces in Jaeger | `docker compose ps` — is Collector healthy? App `OTEL_EXPORTER_OTLP_ENDPOINT` correct? |
| Partial traces (missing spans) | [teaching/03](teachings/03-context-propagation.md) — propagation |
| Metrics not in Prometheus | Collector `prometheus` exporter enabled? Scrape config matches job name? |
| High cardinality warning | [teaching/06](teachings/06-semantic-conventions.md), [runbooks/high-cardinality.md](runbooks/high-cardinality.md) |
| Logs without trace_id | [curriculum/13](curriculum/13-baggage-and-correlation.md) |
| "I don't understand the big picture" | [CORE-CONCEPTS.md](CORE-CONCEPTS.md) → [teaching/01](teachings/01-the-complete-picture.md) |

See [SETUP.md](SETUP.md) and [drills/troubleshooting-scenarios.md](drills/troubleshooting-scenarios.md).

## Portfolio milestone

When you finish the core path, you should be able to:

- Explain all **15 core ideas** in [CORE-CONCEPTS.md](CORE-CONCEPTS.md) without notes
- Score **80%+** on [concept-self-check.md](drills/concept-self-check.md)
- Complete [10-mastery-checklist.md](teachings/10-mastery-checklist.md) teach-back exercise
- Instrument a small HTTP service and document architecture decisions

Log completion in [PROGRESS.md](PROGRESS.md).
