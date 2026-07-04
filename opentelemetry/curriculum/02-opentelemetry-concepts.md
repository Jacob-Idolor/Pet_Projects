# OpenTelemetry concepts

**Level:** L1 | **Lab:** [Lab 01](../labs/lab-01-first-trace/) | **Drill:** [otel-cli-commands](../drills/otel-cli-commands.md)

## What is OpenTelemetry?

OpenTelemetry (OTel) is an **observability framework** — specifications, SDKs, and tools to generate, collect, and export telemetry data.

It is **not** a storage backend. You still need Jaeger, Prometheus, Grafana, Dynatrace, etc. OTel gets data *to* those systems via OTLP.

## Architecture at a glance

```
┌─────────────┐     OTLP      ┌──────────────────┐     export    ┌─────────┐
│  Your app   │ ────────────► │ OTel Collector   │ ────────────► │ Jaeger  │
│  (SDK)      │   gRPC/HTTP   │ (optional middle)│               │ Prom... │
└─────────────┘               └──────────────────┘               └─────────┘
```

**Direct export:** App SDK → backend (fine for learning).

**Via Collector:** App SDK → Collector → one or more backends (recommended for production).

## Core components

| Component | Role |
|-----------|------|
| **API** | Interfaces your code calls (`tracer.start_span`) |
| **SDK** | Implementation — sampling, batching, export |
| **Instrumentation** | Libraries that auto-wrap HTTP, DB, etc. |
| **Collector** | Vendor-neutral pipeline (receive → process → export) |
| **OTLP** | OpenTelemetry Protocol — gRPC (4317) or HTTP (4318) |

## Signals

| Signal | OTel type | Typical backend |
|--------|-----------|-----------------|
| Traces | Spans grouped in traces | Jaeger, Tempo, Dynatrace |
| Metrics | Counters, gauges, histograms | Prometheus, Mimir, Dynatrace |
| Logs | Log records with attributes | Loki, Elasticsearch, Dynatrace |

## Resource

Every piece of telemetry carries **resource** metadata:

```yaml
service.name: checkout-api
service.version: 1.2.0
deployment.environment: staging
```

Set via `OTEL_SERVICE_NAME` and `OTEL_RESOURCE_ATTRIBUTES`.

## Context propagation

When Service A calls Service B, the **trace context** (trace ID, span ID) must flow across the wire — usually W3C `traceparent` header. Without it, you get **broken traces** (orphan spans).

## Specification vs implementation

- **Spec** — behavior all SDKs must follow ([opentelemetry.io/docs/specs](https://opentelemetry.io/docs/specs/otel/))
- **SDKs** — Go, Java, Python, Node.js, .NET, etc.
- **Collector** — single binary, YAML config

## Zero-code vs code-based instrumentation

| Approach | Pros | Cons |
|----------|------|------|
| **Auto** (`opentelemetry-instrument`) | Fast, broad coverage | Less control, language-dependent |
| **Manual** | Precise span names/attributes | More code |
| **Hybrid** | Best of both | Recommended for production |

## Practice goals

- [ ] Set `OTEL_SERVICE_NAME` and export one trace to Jaeger
- [ ] Explain the difference between API, SDK, and Collector in one sentence each
- [ ] Draw the data path from your app to Jaeger

## Read next

[03 — Traces](03-traces.md)
