# Instrumentation checklist

Apply to any service before calling instrumentation "done."

## Resource & identity

- [ ] `service.name` set (via `OTEL_SERVICE_NAME` or code)
- [ ] `service.version` or `deployment.environment` on resource
- [ ] Same resource attributes across traces, metrics, logs

## Traces

- [ ] HTTP/gRPC entry spans (auto or middleware)
- [ ] Outbound calls propagate W3C `traceparent`
- [ ] Manual spans for critical business operations
- [ ] Errors call `RecordError` + ERROR status
- [ ] Span names are low cardinality (no user IDs in names)

## Metrics (RED)

- [ ] Request rate counter or histogram count
- [ ] Error rate (status code or explicit error counter)
- [ ] Latency histogram (p50/p95/p99 in dashboards)
- [ ] No high-cardinality labels (user_id, order_id, UUID)

## Logs

- [ ] Structured JSON (or key-value) logs
- [ ] `trace_id` / `span_id` in log context when trace active
- [ ] Log levels used consistently (no ERROR for debug)

## Collector / export

- [ ] OTLP endpoint reachable from app/network
- [ ] Batch processor enabled
- [ ] Sampling policy documented
- [ ] PII not in attributes or log fields

## Verification

- [ ] End-to-end test request visible in trace backend
- [ ] Metrics appear in Prometheus/vendor within 1–2 scrape intervals
- [ ] Error path tested — visible in traces and metrics
- [ ] Cross-service trace (if applicable) — no broken parent links

## Portfolio

- [ ] README documents `OTEL_*` variables
- [ ] Screenshot of trace waterfall attached
