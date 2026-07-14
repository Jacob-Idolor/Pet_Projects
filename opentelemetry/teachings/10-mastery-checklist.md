# Mastery checklist — know you fully understand OpenTelemetry

Use this after completing curriculum, teachings, and labs. Check each box only when you can explain the item **without looking**.

---

## Tier 1 — Foundations

- [ ] Explain the three observability signals and when to use each
- [ ] Draw App → SDK → OTLP → Collector → Backend from memory
- [ ] Define OTLP and name both default ports
- [ ] Explain why OTel is not the same as Jaeger or Prometheus
- [ ] Set `OTEL_SERVICE_NAME` and `OTEL_EXPORTER_OTLP_ENDPOINT` correctly for Docker vs host

---

## Tier 2 — Data model

- [ ] Difference between Resource, Instrumentation Scope, and Span
- [ ] What `trace_id`, `span_id`, and `parent_span_id` mean
- [ ] Name four span kinds and give an example of each
- [ ] Explain span attributes vs events vs links
- [ ] Why metric labels need low cardinality but span attributes can be richer

---

## Tier 3 — Context and propagation

- [ ] Format and purpose of W3C `traceparent` header
- [ ] What breaks propagation (async, queues, uninstrumented clients)
- [ ] Difference between trace context and baggage
- [ ] Why secrets must never go in baggage

---

## Tier 4 — SDK and Collector

- [ ] Role of TracerProvider, SpanProcessor, SpanExporter
- [ ] Why BatchSpanProcessor exists
- [ ] Why call Shutdown on providers
- [ ] Collector pipeline: receivers → processors → exporters
- [ ] Name three useful Collector processors

---

## Tier 5 — Production

- [ ] Head vs tail sampling — trade-offs
- [ ] Why metrics aren't sampled like traces
- [ ] Semantic conventions for HTTP (three attributes)
- [ ] How to export same OTLP to two backends
- [ ] PII handling in attributes and logs

---

## Teach-back exercise (15 min)

Explain to an imaginary teammate:

> "We're adding OpenTelemetry to our checkout service. Walk me through what we'd install, what we'd configure, where traces would go, and how we'd debug a slow payment call."

Cover: SDK, service.name, auto-inst, Collector, Jaeger, propagation to payment service, sampling policy.

---

## Interview questions — model answers

**Q: What is OpenTelemetry?**  
A: Vendor-neutral observability framework — APIs, SDKs, Collector, and OTLP protocol for traces, metrics, and logs. Instrument once, export anywhere.

**Q: Why use a Collector?**  
A: Decouple apps from backends; central sampling, PII scrubbing, fan-out to multiple systems without redeploying apps.

**Q: How do traces and logs correlate?**  
A: Same `trace_id` in span context and log records — find trace in Jaeger, search logs by trace_id.

**Q: What is high cardinality and why is it bad?**  
A: Unbounded label values (user IDs) create millions of metric time series — storage explosion, slow queries, cost.

**Q: OpenTracing vs OTel?**  
A: OpenTracing merged into OTel; OTel adds unified metrics/logs and OTLP.

---

## Final lab proof

Complete all items:

- [ ] [Lab 01](../labs/lab-01-first-trace/) — trace in Jaeger
- [ ] [Lab 04](../labs/lab-04-collector/) — modified Collector config
- [ ] [Lab 07](../labs/lab-07-sampling/) — sampling policy written
- [ ] [concept-self-check.md](../drills/concept-self-check.md) — 80%+ without notes
- [ ] Instrument one app outside this lab folder

When all checked: you fully understand OpenTelemetry at a working professional level.

Log completion in [PROGRESS.md](../PROGRESS.md).
