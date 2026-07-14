# Observability fundamentals

**Level:** L1 | **Lab:** [Lab 00](../labs/lab-00-stack/) | **Next:** [02 — OTel concepts](02-opentelemetry-concepts.md)

## Why observability?

**Monitoring** tells you *that* something broke. **Observability** helps you understand *why* — especially in distributed systems where failures emerge from interactions you didn't anticipate.

| Question | Signal | Example |
|----------|--------|---------|
| How fast? How much? | **Metrics** | Request rate, p99 latency, CPU |
| What happened? | **Logs** | `ERROR payment failed: timeout` |
| Where did time go? | **Traces** | Checkout span → payment span → DB span |

## The three pillars

These pillars are **complementary**, not interchangeable:

1. **Metrics** — aggregated, cheap at scale, great for dashboards and alerts
2. **Logs** — high detail, expensive at volume, essential for debugging specifics
3. **Traces** — request-scoped, show causality across services

Modern practice **correlates** them: trace IDs in logs, exemplars linking metrics to traces.

## Golden signals (Google SRE)

1. **Latency** — time to serve a request (watch distributions, not just averages)
2. **Traffic** — demand on the system
3. **Errors** — rate of failed requests
4. **Saturation** — how "full" the system is (queue depth, CPU throttling)

## RED vs USE

| Method | Applies to | Metrics |
|--------|------------|---------|
| **RED** | Services | Rate, Errors, Duration |
| **USE** | Resources | Utilization, Saturation, Errors |

Use RED when instrumenting HTTP/gRPC services. Use USE for nodes, disks, and connection pools.

## Before OpenTelemetry

Teams often had:

- Prometheus client libraries for metrics (per language)
- Jaeger/Zipkin agents for traces (per language)
- Log shippers with no shared context

**Problem:** three different instrumentation stories, vendor lock-in, inconsistent attribute names.

## Where OTel fits

OpenTelemetry provides **one SDK** and **one wire protocol (OTLP)** for all three signals, with:

- Standard **resource** attributes (`service.name`, `deployment.environment`)
- **Semantic conventions** for HTTP, DB, messaging
- A **Collector** to receive, process, and fan out to any backend

## Practice goals

- [ ] Start the local stack (`make stack-up`)
- [ ] Open Jaeger and Grafana — know which UI answers which question
- [ ] Name one metric, one log line, and one span you'd want for a checkout API

## Read next

[02 — OpenTelemetry concepts](02-opentelemetry-concepts.md)
