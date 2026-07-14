# SDK internals — how telemetry gets from code to wire

Understanding the SDK lifecycle prevents "it works locally but not in prod" surprises.

---

## SDK components

```
Application code
      │
      ▼
   OTel API  ─── Tracer, Meter, Logger interfaces
      │
      ▼
   OTel SDK  ─── Providers + Processors + Exporters
      │
      ▼
   OTLP on the wire
```

| Component | Responsibility |
|-----------|----------------|
| **TracerProvider** | Creates tracers; owns span processors |
| **SpanProcessor** | Called when span starts/ends — batch or export immediately |
| **SpanExporter** | Sends finished spans to OTLP endpoint |
| **MeterProvider** | Creates meters; owns metric readers |
| **MetricReader** | Collects metrics on interval → MetricExporter |
| **LoggerProvider** | Same pattern for logs (newer, maturing) |

---

## Initialization order (critical)

Correct startup:

```text
1. Create Resource (service.name, etc.)
2. Create Exporter(s) (OTLP HTTP/gRPC)
3. Create Provider with Processor/Reader + Resource
4. Register global Provider (otel.SetTracerProvider)
5. Register Propagator (TraceContext)
6. Register auto-instrumentation / HTTP middleware
7. Start accepting traffic
```

**Wrong:** start HTTP server before step 4 → early requests have no traces.

---

## Batch span processor (default)

Spans are **not** sent one-by-one on every request — that would crush performance.

```
Span ends ──► queue ──► batch every N ms or M spans ──► OTLP export
```

Trade-off:

- **Larger batch** → fewer network calls, slightly delayed visibility in Jaeger
- **Export on shutdown** → `TracerProvider.Shutdown(ctx)` flushes pending spans

Always call **Shutdown** on graceful app exit.

---

## Exporters

| Exporter | Use |
|----------|-----|
| `otlptracehttp` | OTLP over HTTP — common default (`:4318`) |
| `otlptracegrpc` | OTLP over gRPC — `:4317` |
| `stdout` | Learning — print spans to console |
| `jaeger` (legacy) | Deprecated — use OTLP to Jaeger instead |

Environment-driven (zero code):

```bash
OTEL_TRACES_EXPORTER=otlp
OTEL_EXPORTER_OTLP_ENDPOINT=http://localhost:4318
OTEL_EXPORTER_OTLP_PROTOCOL=http/protobuf
```

---

## Global vs explicit providers

**Global** (typical):

```go
otel.SetTracerProvider(tp)
tracer := otel.Tracer("my-lib")
```

**Explicit** (tests, multi-tenant):

```go
tracer := tp.Tracer("my-lib")
```

Use explicit providers in unit tests with in-memory exporters to assert span names without network.

---

## Auto-instrumentation hook point

Auto-inst patches or wraps libraries **at startup** before they load:

```bash
opentelemetry-instrument python app.py
```

Must run **before** Flask/Django/requests imports execute — the wrapper registers handlers first.

Manual equivalent:

```go
handler := otelhttp.NewHandler(mux, "server")
client := http.Client{Transport: otelhttp.NewTransport(http.DefaultTransport)}
```

---

## Error handling in the SDK

SDK export failures should **not** crash your app. Failed exports are logged internally and retried with backoff.

Symptoms of export failure:

- App healthy, Jaeger empty
- SDK internal error logs (enable `OTEL_LOG_LEVEL=debug`)

---

## Metrics: periodic reader

Unlike spans (event-driven), metrics export on a **interval**:

```go
sdkmetric.NewPeriodicReader(metricExp, sdkmetric.WithInterval(15*time.Second))
```

Prometheus scraping the Collector may use different intervals — expect 15–60s delay in dashboards.

---

## SDK vs Collector processors

| Location | Examples | When |
|----------|----------|------|
| **SDK** | Simple head sampling | Reduce egress from app |
| **Collector** | Tail sampling, PII redaction, attribute enrichment | Central policy, no redeploy |

**Rule of thumb:** sampling policy in Collector; basic resource attributes can be in either.

---

## Check yourself

1. What does the BatchSpanProcessor do?
2. Why call `Shutdown()` on the TracerProvider?
3. SDK head sampling vs Collector tail sampling — which can keep all error traces?

Answers: [concept-self-check.md](../drills/concept-self-check.md) § Block 4

---

## Next

[05 — OTLP and backends](05-otlp-and-backends.md)
