# Glossary

Quick reference for every term used in this lab. Read top-to-bottom once, then use as lookup.

| Term | Definition |
|------|------------|
| **API** | Language interfaces (`Tracer`, `Meter`) — no export logic |
| **Attribute** | Key-value metadata on spans, metrics, or logs |
| **Auto-instrumentation** | Agent/wrapper that instruments libraries without code changes |
| **Baggage** | Key-value propagated with context across services — not stored in spans automatically |
| **Backend** | System that stores/querys telemetry (Jaeger, Prometheus, Dynatrace) |
| **Batch processor** | Groups telemetry before export for efficiency |
| **CNCF** | Cloud Native Computing Foundation — hosts Kubernetes, Prometheus, OTel |
| **Collector** | Vendor-neutral telemetry pipeline binary (receivers/processors/exporters) |
| **Context** | Carries active trace/span IDs through a process |
| **Counter** | Metric that only increases |
| **Exemplar** | Link from metric bucket to example trace ID |
| **Exporter** | Sends telemetry from SDK or Collector to a destination |
| **Golden signals** | Latency, traffic, errors, saturation (SRE) |
| **Head sampling** | Sampling decision at trace start |
| **Histogram** | Metric capturing value distribution in buckets |
| **Instrumentation scope** | Identifies the library that produced telemetry |
| **Instrumentation library** | Package that wraps HTTP/DB/etc. (e.g. otelhttp) |
| **Jaeger** | Open-source trace backend and UI |
| **Log record** | Structured OTel log unit with severity, body, attributes |
| **Metric reader** | SDK component that periodically exports metrics |
| **OTLP** | OpenTelemetry Protocol — wire format for all signals |
| **Propagator** | Injects/extracts context (W3C Trace Context, B3) |
| **Provider** | SDK factory for tracers, meters, or loggers |
| **RED method** | Rate, Errors, Duration — service metrics |
| **Resource** | Entity being observed (`service.name`, host, k8s metadata) |
| **Sampler** | Decides whether to record a trace |
| **SDK** | Language implementation of OTel API with export |
| **Semantic conventions** | Standard names for attributes and metrics |
| **Signal** | One of: traces, metrics, logs |
| **Span** | Single timed operation within a trace |
| **Span event** | Timestamped annotation within a span |
| **Span kind** | SERVER, CLIENT, INTERNAL, PRODUCER, CONSUMER |
| **Span link** | Reference to another trace without parent-child |
| **Tail sampling** | Sampling decision after trace completes |
| **Trace** | All spans sharing one `trace_id` |
| **Trace ID** | 128-bit identifier for a distributed request |
| **USE method** | Utilization, Saturation, Errors — resource metrics |
| **W3C Trace Context** | Standard `traceparent` / `tracestate` headers |

See also: [CORE-CONCEPTS.md](../CORE-CONCEPTS.md)
