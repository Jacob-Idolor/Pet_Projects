# Context and propagation

**Level:** L2 | **Teachings:** [03-context-propagation](../teachings/03-context-propagation.md) | **Lab:** [Lab 01](../labs/lab-01-first-trace/)

## Learning objectives

After this module you can:

- Explain W3C Trace Context headers
- Identify why traces break across services
- Choose between context and baggage correctly

## W3C Trace Context

The `traceparent` header carries:

- **trace-id** — links all spans in one logical request
- **parent-span-id** — who called whom
- **trace-flags** — includes sampled bit

Default OTel propagator: `TraceContext`.

## Inject / extract flow

1. **Server** receives request → extract context → start SERVER span as child
2. **Client** makes outbound call → inject context into headers → start CLIENT span
3. Pass **context object** through your code (`context.Context` in Go)

Auto-instrumentation handles HTTP/gRPC when configured.

## Async and queues

| Pattern | Risk |
|---------|------|
| Goroutine without ctx | Orphan spans |
| Thread pool | Lost parent |
| Kafka/Rabbit without headers | New trace per message |

**Fix:** propagate context in message metadata; use OTel messaging conventions.

## Baggage preview

Baggage propagates business keys (e.g. `tenant=tier1`) — **not** for secrets.

Full module: [13 — Baggage and correlation](13-baggage-and-correlation.md)

## Hands-on

1. Run Lab 01 `/chain` — see in-process propagation
2. `curl -v` through an instrumented client — find `traceparent`
3. Read [S2 troubleshooting](../drills/troubleshooting-scenarios.md)

## Self-check

Answer without notes: [concept-self-check.md](../drills/concept-self-check.md) § Block 3

## Next

[11 — Data model and OTLP](11-data-model-and-otlp.md)
