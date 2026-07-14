# Baggage and correlation

**Level:** L3 | **Teachings:** [03-context-propagation](../teachings/03-context-propagation.md) | **Labs:** [01](../labs/lab-01-first-trace/), [03](../labs/lab-03-logs/)

## Learning objectives

- Distinguish baggage from span attributes and trace context
- Correlate traces, metrics, and logs with one `trace_id`
- Design unified observability for incident response

## Three correlation mechanisms

| Mechanism | Links |
|-----------|-------|
| **Trace context** | Spans across services (same trace_id) |
| **Log correlation** | Log lines to spans (trace_id in log) |
| **Metric exemplars** | Histogram buckets to example traces |

## Baggage

Propagated key-value pairs alongside trace context:

```http
baggage: tenant=acme,experiment=checkout-v2
```

| Do | Don't |
|----|-------|
| Pass tenant tier for routing | Put JWT or password |
| Keep values small | Store large payloads |
| Document allowed keys | Allow arbitrary dev keys in prod |

Enable: `OTEL_PROPAGATORS=tracecontext,baggage`

## Unified incident workflow

1. **Alert** fires on metric (error rate ↑)
2. **Dashboard** shows exemplar or filter by route
3. **Trace** in Jaeger — find slow/error span
4. **Logs** searched by `trace_id` — root cause detail

This is the "three pillars working together" in practice.

## Logs in this lab

Go sample emits JSON logs with `trace_id` when context is active — see Lab 03.

## Hands-on

1. Trigger `/error` — find trace in Jaeger, match log line by trace_id
2. Explain why baggage ≠ span attribute
3. Read golden signals in [01-observability-fundamentals](01-observability-fundamentals.md)

## Self-check

[concept-self-check.md](../drills/concept-self-check.md) § Block 3 (baggage questions)

## Next

[14 — Architecture decisions](14-architecture-decisions.md)
