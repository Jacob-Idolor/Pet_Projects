# Logs

**Level:** L2 | **Lab:** [Lab 03](../labs/lab-03-logs/) | **Next:** [06 — Collector](06-collector.md)

## Logs in OpenTelemetry

OTel treats logs as another signal with **structured attributes** — not just plain text strings. The goal: **correlate logs with traces** via shared `trace_id` and `span_id`.

## Three logging approaches

| Approach | Description |
|----------|-------------|
| **Log appenders / bridges** | Existing logger (logrus, zap, Python logging) emits OTel log records |
| **Direct OTel Logger API** | Create log records via OTel API |
| **Filelog receiver** | Collector tails JSON log files and parses trace context |

For brownfield apps, **bridges** are most common — keep your logger, add trace correlation.

## Structured logging

Prefer JSON with stable fields:

```json
{
  "timestamp": "2026-07-04T12:00:00Z",
  "level": "error",
  "message": "payment timeout",
  "trace_id": "abc123...",
  "span_id": "def456...",
  "service.name": "checkout-api"
}
```

## Correlation workflow

1. User reports slow checkout — find trace in Jaeger
2. Copy `trace_id`
3. Search logs (Loki, Elasticsearch, Dynatrace) by `trace_id`
4. Read error details not visible in span attributes

## Logs vs span events

| Feature | Logs | Span events |
|---------|------|-------------|
| Scope | Process-wide | Attached to one span |
| Volume | Can be very high | Keep sparse |
| Use | Debugging, audit | Milestones within an operation |

Don't duplicate every log line as span events — use logs for detail, spans for structure.

## Collector pipeline for logs

```yaml
receivers:
  otlp:
processors:
  batch:
exporters:
  debug:          # learning
  otlphttp:       # vendor backend
```

Lab 03 walks through enabling log export from the sample app.

## Practice goals

- [ ] Emit a log line that includes trace context
- [ ] Find the same request in Jaeger and in Collector debug output
- [ ] Describe when you'd use logs vs traces for debugging

## Read next

[06 — Collector](06-collector.md)
