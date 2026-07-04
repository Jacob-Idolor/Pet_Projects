# How to learn with this lab

This repo is designed for **concept → instrument → observe → debug**. OpenTelemetry is best learned by generating real telemetry and tracing it through the pipeline.

## The learning loop

```
1. Read curriculum module     → understand traces, metrics, logs, Collector
2. Start local stack          → make stack-up (Jaeger, Grafana, Collector)
3. Run the lab                → instrument code, export OTLP, view in UI
4. Troubleshoot scenario      → missing spans, wrong endpoint, cardinality
5. Mark complete + notes      → PROGRESS.md
```

## Recommended path

| Step | Curriculum | Lab | Drill |
|------|------------|-----|-------|
| 1 | [00 — Overview](curriculum/00-overview.md) | — | — |
| 2 | [01 — Observability fundamentals](curriculum/01-observability-fundamentals.md) | [Lab 00 — Stack](labs/lab-00-stack/) | — |
| 3 | [02 — OTel concepts](curriculum/02-opentelemetry-concepts.md) | [Lab 01 — First trace](labs/lab-01-first-trace/) | [CLI commands](drills/otel-cli-commands.md) |
| 4 | [03 — Traces](curriculum/03-traces.md) | [Lab 01](labs/lab-01-first-trace/) | troubleshooting |
| 5 | [04 — Metrics](curriculum/04-metrics.md) | [Lab 02 — Metrics](labs/lab-02-metrics/) | — |
| 6 | [05 — Logs](curriculum/05-logs.md) | [Lab 03 — Logs](labs/lab-03-logs/) | — |
| 7 | [06 — Collector](curriculum/06-collector.md) | [Lab 04 — Collector](labs/lab-04-collector/) | CLI commands |
| 8 | [07 — Instrumentation](curriculum/07-instrumentation.md) | [Lab 05 — Auto-instrumentation](labs/lab-05-auto-instrumentation/) | [checklist](drills/instrumentation-checklist.md) |
| 9 | [08 — Kubernetes](curriculum/08-kubernetes-integration.md) | [Lab 06 — K8s](labs/lab-06-kubernetes/) | — |
| 10 | [09 — Production](curriculum/09-production-patterns.md) | [Lab 07 — Sampling](labs/lab-07-sampling/) | troubleshooting |

Run the stack: `make stack-up`

## Difficulty levels

- **Beginner** — Stack setup, first trace, Jaeger UI, auto-instrumentation
- **Intermediate** — Collector pipelines, metrics with exemplars, log correlation
- **Advanced** — Sampling strategies, K8s operator, cardinality, production runbooks

## Tips for retention

1. **Always follow a request** — generate a trace in the app, then find that exact trace in Jaeger (don't just read docs).
2. **Draw the pipeline** — App → SDK → OTLP → Collector → Backend. When something breaks, walk the path.
3. **One signal at a time** — master traces before layering metrics and logs.
4. **Break things on purpose** — stop the Collector, wrong port, missing service.name — then use drills to fix.
5. **Connect to your stack** — if you use Dynatrace or Grafana Cloud, add an exporter and see the same spans there.

## Methodologies to study alongside OTel

| Method | What it teaches | Where in this lab |
|--------|-----------------|-------------------|
| **Three pillars** | Metrics, logs, traces | [curriculum/01](curriculum/01-observability-fundamentals.md) |
| **RED method** | Rate, Errors, Duration for services | [curriculum/04](curriculum/04-metrics.md), Lab 02 |
| **USE method** | Utilization, Saturation, Errors for resources | Lab 02, K8s integration |
| **Golden signals** | Latency, traffic, errors, saturation | curriculum 01, 09 |
| **Distributed tracing** | Span context propagation | [curriculum/03](curriculum/03-traces.md), Lab 01 |
| **OpenTelemetry semantic conventions** | Standard attribute names | curriculum 07, drills checklist |

## When you're stuck

| Symptom | First check |
|---------|-------------|
| No traces in Jaeger | `docker compose ps` — is Collector healthy? App `OTEL_EXPORTER_OTLP_ENDPOINT` correct? |
| Partial traces (missing spans) | Context propagation — is downstream service receiving trace headers? |
| Metrics not in Prometheus | Collector `prometheus` exporter enabled? Scrape config matches job name? |
| High cardinality warning | Label values — avoid user IDs as metric labels |
| Logs without trace_id | Logger bridge configured? Same `trace_id` format as spans? |

See [SETUP.md](SETUP.md) and [drills/troubleshooting-scenarios.md](drills/troubleshooting-scenarios.md).

## Portfolio milestone

When you finish the core labs, you should be able to:

- Instrument a small HTTP service with traces + metrics
- Run data through the OpenTelemetry Collector
- Explain sampling, resource attributes, and semantic conventions in an interview
- Export OTLP to at least one vendor backend (optional stretch)

Log completion in [PROGRESS.md](PROGRESS.md).
