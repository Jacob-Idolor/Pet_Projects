# The complete picture — what OpenTelemetry actually is

Read this before diving into SDK code. It frames every other document in this lab.

---

## The problem OTel solves

Before OTel, every observability vendor had its own agents and SDKs:

- Datadog agent, Dynatrace OneAgent, New Relic agent
- Jaeger client, Zipkin client, Prometheus client per language
- No shared attribute names, no shared propagation format

**Cost:** re-instrument when you change vendors; inconsistent data across services; engineers learn N tools instead of one model.

**OTel's answer:** one instrumentation standard, one export protocol (OTLP), backends compete on storage and UX — not on lock-in.

---

## The four building blocks

| Block | Analogy | You interact via… |
|-------|---------|-------------------|
| **Specification** | The rulebook | Reading docs; ensures SDKs behave consistently |
| **API** | Electrical outlet shape | `tracer.Start()`, `meter.Counter()` in code |
| **SDK** | The wiring behind the outlet | Configuration, batching, export — initialized at startup |
| **Collector** | Power substation | YAML config; no app code changes to add backends |

Plus **Instrumentation Libraries** — pre-built wrappers for HTTP, gRPC, database drivers.

---

## Specification vs implementation

The **spec** defines:

- What a Span must contain
- How context propagates (W3C Trace Context)
- OTLP message format
- Environment variable names (`OTEL_*`)

The **SDK** (Go, Java, Python, …) implements the spec for one language.

The **Collector** is a separate binary — implements receive/process/export in YAML.

**You rarely read the spec** day-to-day — but when something behaves oddly across languages, the spec is the source of truth.

---

## Signals: one framework, three types

```
                    ┌───────────┐
                    │  Resource  │  ← shared: service.name, env, host
                    └─────┬─────┘
          ┌───────────────┼───────────────┐
          ▼               ▼               ▼
      Traces           Metrics          Logs
   (Spans/Trace)   (Counter/Histogram)  (Log records)
```

All three share:

- **Resource** attributes (identity of the producer)
- **Context** (trace ID links logs to spans)
- **OTLP** export path
- **Semantic conventions** (standard field names)

---

## Deployment patterns

### Pattern A — Direct export (learning / simple apps)

```
App SDK ──OTLP──► Jaeger
```

Fine for: local dev, single service, labs.

### Pattern B — Via Collector (production default)

```
App SDK ──OTLP──► Collector ──► Jaeger
                              ──► Prometheus
                              ──► Dynatrace
```

Fine for: multiple backends, sampling, PII scrubbing, central config.

### Pattern C — Agent + Gateway

```
Node DaemonSet (agent) ──► Gateway Collector ──► backends
```

Fine for: Kubernetes at scale, tail sampling at gateway.

---

## Who does what in your team

| Role | OTel responsibility |
|------|---------------------|
| **Application developer** | Add manual spans, enable auto-inst, set `service.name` |
| **Platform / SRE** | Deploy Collector, sampling policy, dashboards, alerts |
| **Security** | Review attributes for PII, TLS on OTLP |
| **FinOps** | Sampling + cardinality — control ingest cost |

---

## CNCF and industry adoption

- Donated by Google (OpenCensus) and Uber (OpenTracing lineage)
- **CNCF Graduated** — same maturity tier as Kubernetes, Prometheus
- Supported by: AWS, Google, Microsoft, Datadog, Dynatrace, Grafana Labs, Honeycomb, Splunk, and others

**Industry standard** means: job postings ask for OTel; vendors document OTLP ingest; new tools assume semantic conventions.

---

## Check yourself

Without scrolling up:

1. Name the four OTel building blocks.
2. Why export through a Collector in production?
3. What is OTLP?
4. How do traces and logs connect?

Answers: [concept-self-check.md](../drills/concept-self-check.md) § Block 1

---

## Next

[02 — Data model](02-data-model.md)
