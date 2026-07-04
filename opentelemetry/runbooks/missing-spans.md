# Runbook — missing or partial spans

## Symptoms

- Traces never appear in backend
- Some spans present but parent missing (orphans)
- Intermittent gaps under load

## Quick checks

| Step | Command / action |
|------|------------------|
| 1 | Confirm backend healthy (`make stack-status`) |
| 2 | Verify `OTEL_EXPORTER_OTLP_ENDPOINT` from app's network |
| 3 | Tail Collector logs (`make stack-logs`) |
| 4 | Generate single request, search Jaeger by service |
| 5 | Check span processor didn't drop (sampling) |

## Common causes

### Wrong OTLP endpoint

- Host app → `http://localhost:4318`
- Docker app → `http://otel-collector:4318`
- K8s Pod → `http://otel-collector.otel-lab.svc:4318`

### Sampling too aggressive

Review `probabilistic_sampler` and tail sampling policies. Temporarily set 100% for debugging.

### Context not propagated

- Async: pass context to goroutines / thread pools
- HTTP clients: use OTel-instrumented transport
- Message queues: inject trace context in message headers

### Collector overload

Add `memory_limiter` processor. Increase Collector memory limits.

## Escalation

1. Enable `debug` exporter with `verbosity: detailed` (short window)
2. Capture one failing request's curl with response headers
3. Compare trace_id in logs vs Jaeger

## Prevention

- Integration test that asserts critical spans exist
- Document propagation requirements for all service owners
- Monitor Collector export error metrics
