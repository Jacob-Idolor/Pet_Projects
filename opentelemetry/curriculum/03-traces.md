# Traces

**Level:** L2 | **Lab:** [Lab 01](../labs/lab-01-first-trace/) | **Next:** [04 — Metrics](04-metrics.md)

## What is a trace?

A **trace** represents one logical operation — often one user request — as it flows through your system.

A trace is a tree of **spans**:

```
Trace abc123
└── [HTTP GET /checkout] 120ms
    ├── [validate cart] 5ms
    ├── [charge payment] 95ms
    │   └── [Stripe API] 90ms
    └── [send confirmation] 15ms
```

## Span anatomy

| Field | Meaning |
|-------|---------|
| `trace_id` | Shared by all spans in one request |
| `span_id` | Unique ID for this span |
| `parent_span_id` | Links child to parent |
| `name` | Operation name (`HTTP GET`, `db.query`) |
| `start_time` / `end_time` | Duration |
| `attributes` | Key-value metadata (`http.status_code=200`) |
| `events` | Timestamped log points within a span |
| `status` | OK, ERROR |

## Semantic conventions

Use standard attribute names so dashboards work across services:

| Convention | Examples |
|------------|----------|
| HTTP | `http.method`, `http.route`, `http.status_code` |
| Database | `db.system`, `db.statement` (careful with PII) |
| RPC | `rpc.system`, `rpc.service`, `rpc.method` |

Docs: [Semantic conventions](https://opentelemetry.io/docs/specs/semconv/)

## Context propagation

**W3C Trace Context** header:

```
traceparent: 00-{trace-id}-{parent-span-id}-01
```

Outgoing HTTP clients must **inject**; servers must **extract**. OTel instrumentation libraries handle this when configured.

### Common failure: broken traces

- Missing propagation on async paths (message queues, thread pools)
- Load balancer stripping headers
- Different tracer provider instances in the same process

## Manual instrumentation (Go example)

```go
ctx, span := tracer.Start(ctx, "processOrder")
defer span.End()

span.SetAttributes(attribute.String("order.id", orderID))
if err != nil {
    span.RecordError(err)
    span.SetStatus(codes.Error, err.Error())
}
```

Pass `ctx` to downstream calls so child spans attach correctly.

## Viewing traces

In **Jaeger**:

1. Select service → Find Traces
2. Open a trace → waterfall view
3. Look for long spans (latency) and ERROR status (failures)

## Practice goals

- [ ] Generate a multi-span trace in the Go sample app
- [ ] Find it in Jaeger by service name and operation
- [ ] Identify parent/child relationships in the waterfall

## Read next

[04 — Metrics](04-metrics.md)
