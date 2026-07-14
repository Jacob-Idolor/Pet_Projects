# Context propagation — how traces stay connected

The hardest OTel concept in production. If you master this, you master distributed tracing.

---

## The core idea

When Service A calls Service B, B's spans must know A's `trace_id` and `span_id` to appear **under** A in the waterfall.

That knowledge travels as **context** — not in your JSON body, but in **metadata** (HTTP headers, gRPC metadata, message headers).

---

## W3C Trace Context (the standard)

Primary header:

```http
traceparent: 00-4bf92f3577b34da6a3ce929d0e0e4736-00f067aa0ba902b7-01
             │  │                                │                │
             │  trace-id (32 hex chars)          span-id          flags
             version
```

Optional:

```http
tracestate: vendor1=value1,vendor2=value2
```

OTel's default propagator is **W3C Trace Context**. Legacy systems may use **B3** (Zipkin) — OTel can support both.

---

## Inject and extract

```
Service A (outgoing)                    Service B (incoming)
─────────────────────                   ─────────────────────
Span active in context
       │
       ▼
 Inject traceparent into HTTP headers ──► Extract from headers
       │                                         │
       │                                         ▼
       │                                  Start SERVER span
       │                                  as child of A's span
       ▼
  CLIENT span ends
```

In code (conceptual):

```go
// Outgoing — auto-instrumentation does this
otel.GetTextMapPropagator().Inject(ctx, carrier)

// Incoming — auto-instrumentation does this
ctx = otel.GetTextMapPropagator().Extract(ctx, carrier)
```

**You must pass `ctx`** through your call chain — context carries the active span.

---

## What breaks propagation

| Pitfall | Symptom | Fix |
|---------|---------|-----|
| New goroutine without context | Orphan spans | Pass `ctx` to goroutine |
| Thread pool drops context | Gaps in trace | Use context-aware executor |
| Forgot instrumented HTTP client | New trace per hop | Use `otelhttp.NewTransport` |
| Queue message without headers | Consumer starts new trace | Inject context into message metadata |
| API gateway strips headers | Trace stops at gateway | Configure gateway to forward `traceparent` |
| `@Async` / `setImmediate` | Broken parent link | Explicit context attach |

Lab 01 `/chain` endpoint shows **working** propagation inside one process. Multi-service breaks are listed in [troubleshooting-scenarios.md](../drills/troubleshooting-scenarios.md) S2.

---

## Context vs Baggage

| | Context (Trace Context) | Baggage |
|--|-------------------------|---------|
| **Carries** | trace_id, span_id, flags | Arbitrary key-value pairs |
| **Purpose** | Distributed tracing | Cross-service app data (e.g. `tenant=tier1`) |
| **Size limit** | Fixed small header | Can grow — use sparingly |
| **Security** | Safe | **Never** put secrets/PII here |
| **Backend visibility** | Always in traces | Propagated but not auto-stored |

Baggage example:

```http
baggage: tenant=acme,region=us-east
```

Use baggage when **every** downstream service needs a value for routing or tagging — not for debugging one service.

Deep dive: [curriculum/13-baggage-and-correlation.md](../curriculum/13-baggage-and-correlation.md)

---

## Single service vs multi-service

### Single process (Lab 01)

Context flows through function calls and `ctx` — no HTTP headers needed between internal spans.

### Multi-service

Each hop must:

1. **Extract** context on receive
2. Create span as **child**
3. **Inject** context on next outbound call

Auto-instrumentation handles HTTP/gRPC if enabled. **Your** job: ensure nothing in the middle drops headers.

---

## Propagators configuration

```bash
OTEL_PROPAGATORS=tracecontext,baggage
```

Legacy interop:

```bash
OTEL_PROPAGATORS=tracecontext,b3   # B3 for older services
```

---

## Debugging propagation

1. `curl -v` — verify `traceparent` on outbound requests (with instrumented client)
2. Jaeger — look for multiple root spans when there should be one
3. Collector `debug` exporter — compare trace_ids across services for same user action

Runbook: [missing-spans.md](../runbooks/missing-spans.md)

---

## Check yourself

1. What header carries trace context in W3C format?
2. Why is passing `context.Context` (Go) or equivalent critical?
3. What is the difference between baggage and span attributes?

Answers: [concept-self-check.md](../drills/concept-self-check.md) § Block 3

---

## Next

[04 — SDK internals](04-sdk-internals.md)
