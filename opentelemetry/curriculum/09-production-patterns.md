# Production patterns

**Level:** L6 | **Lab:** [Lab 07](../labs/lab-07-sampling/) | **Drill:** [troubleshooting](../drills/troubleshooting-scenarios.md)

## Sampling

At high traffic, storing **every** trace is expensive. Sampling reduces volume while preserving insight.

| Strategy | When decided | Pros | Cons |
|----------|--------------|------|------|
| **Head sampling** | Trace start | Simple, cheap | May drop interesting errors |
| **Tail sampling** | Trace complete | Keep errors/slow traces | Needs Collector memory |

Example — probabilistic head sampling (50%):

```yaml
processors:
  probabilistic_sampler:
    sampling_percentage: 50
```

Example — tail sampling (keep errors and slow):

```yaml
processors:
  tail_sampling:
    policies:
      - name: errors
        type: status_code
        status_code: {status_codes: [ERROR]}
      - name: slow
        type: latency
        latency: {threshold_ms: 2000}
```

Lab 07 exercises both.

## Security

- **Never** put secrets in span attributes or log fields
- Use **Collector processors** to drop/redact PII (`attributes` processor)
- TLS for OTLP in production (`otlp` exporter with `tls:` config)
- Restrict Collector endpoints — not public internet

## Multi-environment

Use resource attributes consistently:

```yaml
deployment.environment: production
service.namespace: checkout
```

Filter Jaeger and dashboards by environment — avoid mixing staging and prod traces.

## Vendor export

Same instrumentation, multiple backends:

```yaml
exporters:
  otlp/jaeger:
    endpoint: jaeger:4317
  otlphttp/dynatrace:
    endpoint: https://{env}.live.dynatrace.com/api/v2/otlp
    headers:
      Authorization: "Api-Token ${DT_API_TOKEN}"
```

See [integrations/dynatrace.md](../integrations/dynatrace.md).

## SLOs and alerting

1. Define SLI from OTel metrics (e.g. p99 latency, error rate)
2. Dashboard in Grafana / vendor
3. Alert on burn rate — tie to runbooks in [runbooks/](../runbooks/)

## Operational checklist

- [ ] `service.name` set on every service
- [ ] Context propagation verified across all hop types (HTTP, gRPC, queues)
- [ ] Sampling configured with documented rationale
- [ ] Cardinality reviewed on metric labels
- [ ] Collector has memory limits and health checks
- [ ] Runbooks for "no telemetry" and "broken traces"

## Practice goals

- [ ] Configure tail sampling in Collector config
- [ ] Document sampling strategy for a 10k req/s service
- [ ] Complete two [troubleshooting scenarios](../drills/troubleshooting-scenarios.md)

## Portfolio capstone

Instrument an app from another track in this repo, export to the local stack, screenshot Jaeger + Grafana, document env vars and Collector config in the app README.
