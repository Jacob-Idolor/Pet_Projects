# Core concepts — understand OpenTelemetry fully

This is the **concept map** for the lab. Read it once for orientation, then work through the linked teachings in order. Each section answers one question you need to be able to explain without notes.

---

## The one-sentence definition

**OpenTelemetry is a vendor-neutral standard and toolkit for generating, processing, and exporting telemetry (traces, metrics, logs) from your applications to observability backends.**

OTel is **not** Jaeger, Prometheus, or Dynatrace. It is the **pipe and the language** those tools understand.

---

## Mental model (draw this from memory)

```
┌─────────────────────────────────────────────────────────────────┐
│                        YOUR APPLICATION                          │
│  Business code ──► Instrumentation ──► OTel SDK (API + SDK)   │
└───────────────────────────────┬─────────────────────────────────┘
                                │ OTLP (gRPC :4317 / HTTP :4318)
                                ▼
┌─────────────────────────────────────────────────────────────────┐
│              OpenTelemetry Collector (optional but typical)      │
│   receivers ──► processors ──► exporters                         │
└───────────────┬─────────────────┬─────────────────┬───────────┘
                ▼                 ▼                 ▼
            Jaeger/Tempo    Prometheus/Mimir    Loki / vendor OTLP
            (traces)         (metrics)           (logs / all signals)
```

**Key insight:** Your app should only know about **OTLP + semantic conventions**. Backends are swappable.

---

## Concept layers (what to learn in order)

| Layer | Question it answers | Deep dive |
|-------|---------------------|-----------|
| **1. Why observability?** | Why not just print debugging? | [curriculum/01](curriculum/01-observability-fundamentals.md) |
| **2. What is OTel?** | API vs SDK vs Collector vs OTLP | [teachings/01-the-complete-picture.md](teachings/01-the-complete-picture.md) |
| **3. Data model** | What is a Resource, Span, Metric? | [teachings/02-data-model.md](teachings/02-data-model.md) |
| **4. Context** | How does trace ID cross service boundaries? | [teachings/03-context-propagation.md](teachings/03-context-propagation.md) |
| **5. Signals** | Traces vs metrics vs logs — when to use which | [curriculum/03–05](curriculum/03-traces.md) |
| **6. SDK internals** | Providers, processors, exporters, batching | [teachings/04-sdk-internals.md](teachings/04-sdk-internals.md) |
| **7. Collector** | Why middleware beats direct export | [curriculum/06](curriculum/06-collector.md) |
| **8. Conventions** | Standard attribute names | [teachings/06-semantic-conventions.md](teachings/06-semantic-conventions.md) |
| **9. Sampling** | What to keep at 10k req/s | [teachings/07-sampling-strategies.md](teachings/07-sampling-strategies.md) |
| **10. Production** | Security, cardinality, SLOs | [curriculum/09](curriculum/09-production-patterns.md) |

---

## The 15 ideas you must internalize

Study these until you can explain each in ~30 seconds:

1. **Three signals** — metrics (aggregates), logs (events), traces (causality)
2. **Resource** — *who* produced telemetry (`service.name`, `k8s.pod.name`)
3. **Instrumentation scope** — *which library* produced it (module name + version)
4. **Span** — one operation with timing, attributes, status, parent link
5. **Trace** — all spans sharing one `trace_id`
6. **Context propagation** — W3C `traceparent` carries IDs across network hops
7. **Baggage** — optional key/value propagated with context (not the same as attributes)
8. **OTLP** — the wire format; gRPC or HTTP/protobuf or JSON
9. **Collector pipeline** — receivers → processors → exporters per signal
10. **Head vs tail sampling** — decide early vs decide after trace completes
11. **Semantic conventions** — standard names so dashboards work everywhere
12. **Auto vs manual instrumentation** — breadth vs business meaning
13. **Cardinality** — bounded labels good; user IDs as labels bad
14. **Correlation** — same `trace_id` in spans, logs, and metric exemplars
15. **Vendor neutrality** — instrument once, export to Jaeger today and Dynatrace tomorrow

Full explanations: [teachings/GLOSSARY.md](teachings/GLOSSARY.md)

---

## How OTel relates to older standards

| Legacy | Status | OTel equivalent |
|--------|--------|-----------------|
| OpenTracing | Merged into OTel | Tracing API + SDK |
| OpenCensus | Merged into OTel | Metrics + traces |
| Zipkin B3 headers | Still supported | Prefer W3C Trace Context |
| Prometheus client libs | Still valid | OTel metrics can export to Prom format |
| Jaeger client libs | Deprecated path | OTel SDK → OTLP → Jaeger |

History: [teachings/09-history-and-ecosystem.md](teachings/09-history-and-ecosystem.md)

---

## Teaching methods in this lab

| Method | What you do | File |
|--------|-------------|------|
| **Read → draw** | Sketch architecture after each module | CORE-CONCEPTS (this page) |
| **Read → run** | Generate telemetry, find it in Jaeger | [LEARNING-PATH.md](LEARNING-PATH.md) |
| **Compare signals** | Same request: trace waterfall + metric + log line | Labs 01–03 |
| **Break → fix** | Collector down, broken propagation | [drills/troubleshooting-scenarios.md](drills/troubleshooting-scenarios.md) |
| **Self-check** | Answer questions without looking | [drills/concept-self-check.md](drills/concept-self-check.md) |
| **Teach-back** | Explain OTel to an imaginary teammate | [teachings/10-mastery-checklist.md](teachings/10-mastery-checklist.md) |
| **Interview prep** | Common questions + model answers | [teachings/10-mastery-checklist.md](teachings/10-mastery-checklist.md) |

---

## Extended curriculum (core concepts track)

After modules 01–09, read these for full depth:

| # | Module | Topic |
|---|--------|-------|
| 10 | [Context & propagation](curriculum/10-context-and-propagation.md) | W3C, inject/extract, async pitfalls |
| 11 | [Data model & OTLP](curriculum/11-data-model-and-otlp.md) | Resource, scope, OTLP encoding |
| 12 | [Semantic conventions](curriculum/12-semantic-conventions.md) | HTTP, DB, messaging, stability |
| 13 | [Baggage & correlation](curriculum/13-baggage-and-correlation.md) | Baggage vs attributes, unified observability |
| 14 | [Architecture decisions](curriculum/14-architecture-decisions.md) | Agent vs gateway, direct vs Collector |

---

## Signal selection guide (when stuck)

| You need to… | Use | Why |
|--------------|-----|-----|
| Alert on error rate | **Metrics** | Cheap to aggregate at scale |
| Debug one failed checkout | **Traces** + **Logs** | Follow causality + read details |
| Prove p99 latency regression | **Metrics** (histogram) | Percentiles from histogram buckets |
| Find which downstream service is slow | **Traces** | Waterfall shows per-hop latency |
| Audit who changed what | **Logs** | Immutable event record |
| Link latency spike to example request | **Metrics exemplars** → **Trace** | Bridge aggregate to individual |

---

## Common misconceptions (read carefully)

| Wrong | Right |
|-------|-------|
| "OTel replaces Prometheus" | OTel **feeds** Prometheus (and others) via Collector |
| "More spans = better" | Too many fine-grained spans add noise and cost |
| "Auto-instrumentation is enough" | Auto covers frameworks; **business spans** need manual code |
| "Logs replace traces" | Logs lack automatic parent/child timing across services |
| "Sampling means losing all data" | Metrics stay complete; traces are sampled, not metrics |
| "Baggage is for PII" | Never put sensitive data in baggage — it propagates everywhere |

---

## Mastery path

```
Week 1   CORE-CONCEPTS + teachings 01–03 + Labs 00–01
Week 2   teachings 04–06 + curriculum 03–05 + Labs 02–03
Week 3   teachings 07–09 + curriculum 06–07 + Labs 04–05
Week 4   curriculum 10–14 + Labs 06–07 + concept-self-check
Finish   10-mastery-checklist — all boxes checked
```

Track progress: [PROGRESS.md](PROGRESS.md)

---

## Official references (when you outgrow this lab)

- [OpenTelemetry docs](https://opentelemetry.io/docs/)
- [Specification](https://opentelemetry.io/docs/specs/otel/)
- [Semantic conventions](https://opentelemetry.io/docs/specs/semconv/)
- [OTLP spec](https://opentelemetry.io/docs/specs/otlp/)
- [Collector config](https://opentelemetry.io/docs/collector/configuration/)
