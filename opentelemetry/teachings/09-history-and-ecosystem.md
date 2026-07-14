# History and ecosystem — where OTel came from

Understanding history explains duplicate docs, legacy headers, and why some older tutorials reference Jaeger clients directly.

---

## Timeline

| Year | Event |
|------|-------|
| 2016 | OpenTracing (Uber) — tracing API standard |
| 2018 | OpenCensus (Google) — metrics + traces |
| 2019 | **OpenTelemetry** announced — merge of OpenTracing + OpenCensus |
| 2021 | Trace API stable; heavy SDK adoption begins |
| 2023 | Logs signal maturing; Collector widely deployed |
| 2024 | **CNCF Graduation** — industry standard status |

---

## OpenTracing → OTel

OpenTracing provided:

- Tracer interface (`startSpan`, `finish`)
- Propagation inject/extract

**Migration:** OpenTracing APIs deprecated; OTel Trace API replaces them. Same mental model, richer data model.

---

## OpenCensus → OTel

OpenCensus provided:

- Metrics (stats) and tracing in one library
- Exporters to Prometheus, Stackdriver, etc.

**Migration:** OpenCensus libraries frozen; OTel SDK is the successor.

---

## Jaeger / Zipkin client libraries

Old pattern:

```
App → Jaeger Java agent → Jaeger backend
```

Current pattern:

```
App → OTel SDK → OTLP → Jaeger (or via Collector)
```

Jaeger **backend** is still widely used — only the **client** path changed.

---

## Prometheus relationship

Prometheus is **not replaced** by OTel:

- OTel generates metrics in OTLP
- Collector exposes Prometheus-format scrape endpoint
- Prometheus scrapes and alerts as before

Many teams: OTel instrumentation + Prometheus alerting + Grafana dashboards.

---

## Vendor agent vs OTel

| Approach | Pros | Cons |
|----------|------|------|
| **Vendor agent** (OneAgent, DD agent) | Zero-code, vendor features | Lock-in, less portable |
| **OTel SDK** | Portable, open standard | You own instrumentation config |
| **Both** | Some run OneAgent + OTel for migration | Complexity |

Dynatrace, Datadog, New Relic, Splunk, Honeycomb, Grafana Cloud all accept **OTLP ingest**.

See [integrations/dynatrace.md](../integrations/dynatrace.md).

---

## CNCF landscape

OTel sits alongside:

- **Prometheus** — metrics storage
- **Jaeger / Tempo** — trace storage
- **Fluent Bit / OpenTelemetry Collector** — collection
- **Kubernetes** — orchestration (Operator for OTel)

Graduated status = production-ready, large adoption, governance maturity.

---

## What "industry standard" means for you

1. **Learn OTel once** — applies across employers and stacks
2. **Job interviews** — expect OTel + one backend (Grafana, Datadog, Dynatrace)
3. **New projects** — default to OTel instrumentation, not vendor SDKs
4. **Legacy apps** — migration paths exist from OpenCensus, Jaeger clients, custom metrics

---

## Check yourself

1. What two projects merged to form OpenTelemetry?
2. Does OTel replace Prometheus?
3. Why do old tutorials mention "Jaeger client"?

Answers: [concept-self-check.md](../drills/concept-self-check.md) § Block 8

---

## Next

[10 — Mastery checklist](10-mastery-checklist.md)
