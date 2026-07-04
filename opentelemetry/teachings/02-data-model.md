# The OpenTelemetry data model

Every piece of telemetry OTel emits fits this model. Backends store it differently, but **OTLP speaks this language**.

---

## Hierarchy

```
Resource
 └── Instrumentation Scope
      └── Telemetry (Span | Metric | LogRecord)
           └── Attributes / Events / Links
```

---

## Resource — *who* produced this?

Describes the **entity** being observed — not the individual operation.

| Attribute | Example | Required? |
|-----------|---------|-----------|
| `service.name` | `checkout-api` | **Yes** (always set this) |
| `service.version` | `2.4.1` | Recommended |
| `deployment.environment` | `production` | Recommended |
| `k8s.pod.name` | `checkout-api-abc123` | When on Kubernetes |
| `host.name` | `node-7` | Often auto-detected |

Set via:

```bash
OTEL_SERVICE_NAME=checkout-api
OTEL_RESOURCE_ATTRIBUTES=deployment.environment=prod,service.version=2.4.1
```

Or in code with `resource.New()`.

**Rule:** Every span, metric, and log from the same process should share the same Resource.

---

## Instrumentation scope — *which library* produced this?

Identifies the **instrumentation library**, not your business service:

```yaml
name: go.opentelemetry.io/contrib/instrumentation/net/http/otelhttp
version: 0.49.0
```

Why it matters:

- Debug which library created noisy spans
- Filter in Jaeger by instrumentation scope
- Distinguish auto-inst spans from your manual `tracer.Start("processOrder")`

---

## Span — one operation

| Field | Purpose |
|-------|---------|
| `trace_id` | 128-bit hex — groups all spans in one request |
| `span_id` | 64-bit hex — unique within trace |
| `parent_span_id` | Links to parent (empty = root span) |
| `name` | Operation name — **low cardinality** (`HTTP GET`, not `/users/928374`) |
| `kind` | `SERVER`, `CLIENT`, `INTERNAL`, `PRODUCER`, `CONSUMER` |
| `start_time` / `end_time` | Nanosecond timestamps |
| `attributes` | Key-value metadata on the span |
| `events` | Named timestamps within span (`cache miss`, `retry`) |
| `links` | References to other traces (batch jobs, async) |
| `status` | `UNSET`, `OK`, `ERROR` |

### Span kinds (when to use)

| Kind | Example |
|------|---------|
| `SERVER` | Incoming HTTP request handler |
| `CLIENT` | Outgoing HTTP call to payment API |
| `INTERNAL` | Business logic inside your process |
| `PRODUCER` | Message published to Kafka |
| `CONSUMER` | Message consumed from queue |

Correct kinds help backends build service dependency graphs.

---

## Trace — the full story

A **trace** = all spans with the same `trace_id`.

```
trace_id: 4bf92f3577b34da6a3ce929d0e0e4736

[SERVER GET /checkout] ──► [CLIENT POST /payment] ──► [INTERNAL validateCart]
```

**Broken trace:** spans with same logical request but **different trace_ids** — propagation failure.

---

## Metrics — instruments and data points

| Instrument | Behavior | Example |
|------------|----------|---------|
| **Counter** | Only increases | `http.server.request.count` |
| **UpDownCounter** | Up or down | `queue.depth` |
| **Histogram** | Distribution + buckets | `http.server.duration` |
| **Gauge** | Latest value | `memory.usage` |

Each data point has:

- Name (often dotted: `http.server.duration`)
- Unit (`ms`, `By`, `{request}`)
- Attributes (labels — **keep cardinality low**)
- Timestamp
- Value or bucket counts

---

## Logs — log records

A **log record** in OTel is structured:

| Field | Example |
|-------|---------|
| `timestamp` | When it happened |
| `severity_text` | `INFO`, `ERROR` |
| `body` | Message string or structured payload |
| `attributes` | Extra fields |
| `trace_id` / `span_id` | Correlation to active span |

Bridging existing loggers (logrus, slog, Python logging) is the common migration path — you don't rewrite all logging on day one.

---

## Attributes vs events vs links

| Feature | Use when |
|---------|----------|
| **Attributes** | Static facts about the operation (`http.status_code=500`) |
| **Events** | Something happened *during* the span at a specific moment |
| **Links** | Relationship to another trace without parent/child (`batch processed item from trace X`) |

---

## Cardinality in the data model

**Low cardinality** (good labels/attributes):

- `http.method=GET`
- `http.route=/users/{id}`
- `db.system=postgresql`

**High cardinality** (avoid as metric labels):

- `user.id=928374`
- `trace_id` as metric label
- Full URL with query string

High cardinality is fine in **span attributes** for individual debugging — dangerous in **metrics**.

---

## How this appears in Jaeger

| Data model | Jaeger UI |
|------------|-----------|
| Resource `service.name` | Service dropdown |
| Span name | Operation name |
| Span attributes | Tags on span |
| Parent link | Waterfall indentation |
| Trace ID | Trace search |

---

## Check yourself

1. What is the difference between Resource and Instrumentation Scope?
2. When would you use span `kind=CLIENT`?
3. Why must `service.name` always be set?

Answers: [concept-self-check.md](../drills/concept-self-check.md) § Block 2

---

## Next

[03 — Context propagation](03-context-propagation.md)
