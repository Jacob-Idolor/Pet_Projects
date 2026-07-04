# Concept self-check

Answer from memory, then expand answers below. Aim for 80%+ before calling yourself "done."

---

## Block 1 — The big picture

1. What is OpenTelemetry in one sentence?
2. Name the four building blocks (spec, API, SDK, Collector).
3. Why export through a Collector in production?
4. What does CNCF Graduated imply?

<details>
<summary>Answers</summary>

1. Vendor-neutral framework for generating and exporting traces, metrics, and logs via OTLP.
2. Specification (rules), API (interfaces), SDK (implementation), Collector (pipeline).
3. Decouple apps from backends; central sampling, PII scrubbing, multi-backend fan-out without redeploy.
4. Production maturity, broad adoption, long-term governance — industry standard tier.

</details>

---

## Block 2 — Data model

1. Resource vs Instrumentation Scope?
2. Four span kinds with examples?
3. Why always set `service.name`?
4. Counter vs Histogram?

<details>
<summary>Answers</summary>

1. Resource = entity observed (service); Scope = library that produced telemetry.
2. SERVER (incoming HTTP), CLIENT (outbound call), INTERNAL (business logic), PRODUCER/CONSUMER (messaging).
3. Required identity — appears in every backend UI; without it traces are orphaned anonymously.
4. Counter only increases (request count); Histogram captures distribution (latency buckets).

</details>

---

## Block 3 — Context

1. W3C header name and contents?
2. Three propagation failure modes?
3. Baggage vs span attributes?
4. Why no secrets in baggage?

<details>
<summary>Answers</summary>

1. `traceparent` — version, trace-id, parent-span-id, flags.
2. Async without ctx, uninstrumented HTTP client, message queues without header injection.
3. Baggage propagates across all services automatically; attributes belong to one span.
4. Baggage flows to every downstream service and may appear in logs — uncontrolled exposure.

</details>

---

## Block 4 — SDK

1. BatchSpanProcessor purpose?
2. Why Shutdown()?
3. Head vs tail sampling location?

<details>
<summary>Answers</summary>

1. Batch spans before export — reduce network overhead.
2. Flush pending spans/metrics on graceful exit.
3. Head = SDK or Collector at start; Tail = Collector after trace complete (keep errors/slow).

</details>

---

## Block 5 — OTLP

1. Default OTLP HTTP port?
2. Does switching Jaeger → Dynatrace require code changes?
3. How do metrics reach Prometheus?

<details>
<summary>Answers</summary>

1. 4318 (gRPC is 4317).
2. No — change exporter/Collector config only; instrumentation stays.
3. SDK → OTLP → Collector → Prometheus exporter → Prometheus scrape.

</details>

---

## Block 6 — Semantic conventions

1. `http.route` vs full URL path?
2. Three HTTP semconv attributes?
3. Stable vs experimental?

<details>
<summary>Answers</summary>

1. Route templates are low cardinality; full paths with IDs explode metric/trace cardinality.
2. e.g. `http.request.method`, `http.route`, `http.response.status_code`.
3. Stable = safe for production alerts; experimental = may change.

</details>

---

## Block 7 — Sampling

1. Head vs tail trade-off?
2. Why not sample metrics at 10%?
3. Where run tail sampling?

<details>
<summary>Answers</summary>

1. Head = simple early decision but may drop important traces; Tail = smart retention but needs Collector memory.
2. Sampled metrics would lie about true error rate and request volume.
3. Gateway Collector — needs full trace before decision.

</details>

---

## Block 8 — History

1. Two projects that merged into OTel?
2. OTel vs Prometheus?
3. Old Jaeger client pattern vs current?

<details>
<summary>Answers</summary>

1. OpenTracing and OpenCensus.
2. Complementary — OTel generates; Prometheus stores/scrapes metrics.
3. Old: app → Jaeger client → backend. Current: app → OTel SDK → OTLP → backend.

</details>

---

## Block 9 — Architecture

1. When direct export is OK?
2. Auto-inst alone enough for production?
3. Three things for platform team vs app team?

<details>
<summary>Answers</summary>

1. Local dev, learning, single-service simple apps.
2. No — add manual spans for business operations; review cardinality and sampling.
3. Example split — App: SDK, service.name, business spans. Platform: Collector, sampling, dashboards, TLS, runbooks.

</details>

---

## Scoring

| Score | Next step |
|-------|-----------|
| 0–60% | Re-read [CORE-CONCEPTS.md](../CORE-CONCEPTS.md) + teachings 01–03 |
| 60–80% | Labs 04–07 + teachings 04–07 |
| 80%+ | [10-mastery-checklist.md](../teachings/10-mastery-checklist.md) — portfolio capstone |

Log score in [PROGRESS.md](../PROGRESS.md).
