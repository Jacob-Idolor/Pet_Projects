# Data model and OTLP

**Level:** L2 | **Teachings:** [02-data-model](../teachings/02-data-model.md), [05-otlp-and-backends](../teachings/05-otlp-and-backends.md) | **Lab:** [Lab 04](../labs/lab-04-collector/)

## Learning objectives

- Navigate Resource → Scope → Telemetry hierarchy
- Explain what OTLP carries on the wire
- Map data model fields to Jaeger UI

## Hierarchy recap

```
Resource (service.name, env)
 └── Instrumentation Scope (library name)
      └── Span | Metric | LogRecord
```

## Span essentials

| Field | Jaeger UI |
|-------|-----------|
| `trace_id` | Trace search |
| Span name | Operation |
| Attributes | Tags |
| Parent link | Waterfall tree |
| Status ERROR | Red span |

## OTLP transports

| Protocol | Port |
|----------|------|
| gRPC | 4317 |
| HTTP | 4318 |

Messages: `TracesData`, `MetricsData`, `LogsData` — all protobuf-encoded (JSON for debug).

## Collector translation

OTLP in → backend format out:

- Jaeger: OTLP native
- Prometheus: metrics via scrape exporter
- Vendors: OTLP HTTP with auth headers

## Hands-on

1. Enable Collector `debug` exporter — observe span JSON
2. Open Jaeger — map Tags to span attributes
3. Read [05-otlp-and-backends](../teachings/05-otlp-and-backends.md)

## Self-check

[concept-self-check.md](../drills/concept-self-check.md) § Blocks 2 and 5

## Next

[12 — Semantic conventions](12-semantic-conventions.md)
