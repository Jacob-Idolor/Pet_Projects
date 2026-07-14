# Instrumentation

**Level:** L4 | **Lab:** [Lab 05](../labs/lab-05-auto-instrumentation/) | **Drill:** [instrumentation-checklist](../drills/instrumentation-checklist.md)

## Instrumentation layers

```
┌─────────────────────────────────────────────┐
│  Your business logic (manual spans)         │
├─────────────────────────────────────────────┤
│  Framework instrumentation (HTTP, gRPC)   │
├─────────────────────────────────────────────┤
│  OTel SDK (TracerProvider, MeterProvider)   │
└─────────────────────────────────────────────┘
```

## Auto-instrumentation

Language agents wrap common libraries without code changes:

```bash
# Python
opentelemetry-instrument python app.py

# Node (example)
node --require '@opentelemetry/auto-instrumentations-node/register' app.js
```

**Covers:** HTTP client/server, DB drivers, Redis, Kafka (varies by language).

**Gaps:** Custom business operations — add manual spans.

## Manual instrumentation

Add spans where **business meaning** matters:

- `validateInventory`
- `applyDiscount`
- `publishOrderEvent`

Keep span names **low cardinality** — not `processOrder(user=928374)`.

## Initialization pattern (all languages)

1. Create `Resource` with `service.name`
2. Create `TracerProvider` / `MeterProvider` with exporter
3. Register as global provider
4. Register instrumentation **before** framework imports (auto-inst)

## Semantic conventions

Follow [semconv](https://opentelemetry.io/docs/specs/semconv/) so:

- Dashboards work across teams
- Vendor products auto-detect dependencies
- You avoid reinventing attribute names

## Error recording

Always on failure paths:

```go
span.RecordError(err)
span.SetStatus(codes.Error, err.Error())
```

This marks spans red in Jaeger and enables error-rate metrics.

## Testing instrumentation

1. Unit tests — use in-memory exporter, assert span names/attributes
2. Integration — run Collector + Jaeger locally, hit endpoints
3. CI — optional: fail if critical spans missing (advanced)

## Practice goals

- [ ] Run Python Flask with `opentelemetry-instrument`
- [ ] Add one manual span to the Go sample
- [ ] Complete the [instrumentation checklist](../drills/instrumentation-checklist.md) for a hypothetical API

## Read next

[08 — Kubernetes integration](08-kubernetes-integration.md)
