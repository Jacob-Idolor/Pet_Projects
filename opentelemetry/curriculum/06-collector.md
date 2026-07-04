# OpenTelemetry Collector

**Level:** L3 | **Lab:** [Lab 04](../labs/lab-04-collector/) | **Drill:** [otel-cli-commands](../drills/otel-cli-commands.md)

## Why a Collector?

The Collector sits between apps and backends:

- **Decouple** apps from vendor SDKs — apps only speak OTLP
- **Process** — batch, filter, sample, redact PII
- **Fan-out** — one app → Jaeger + Prometheus + vendor simultaneously
- **Agent pattern** — DaemonSet on every K8s node

## Pipeline model

```yaml
receivers:    # ingest (otlp, prometheus, filelog, hostmetrics...)
processors:   # transform (batch, memory_limiter, attributes, tail_sampling)
exporters:    # send (otlp, prometheus, debug, file)
connectors:   # join pipelines (spanmetrics, servicegraph)
```

Each **signal** (traces, metrics, logs) has its own pipeline:

```yaml
service:
  pipelines:
    traces:
      receivers: [otlp]
      processors: [batch]
      exporters: [otlp/jaeger, debug]
    metrics:
      receivers: [otlp]
      processors: [batch]
      exporters: [prometheus, debug]
```

## Key processors

| Processor | Purpose |
|-----------|---------|
| `batch` | Efficiency — group exports |
| `memory_limiter` | Protect Collector from OOM |
| `attributes` | Add/remove/transform attributes |
| `probabilistic_sampler` | Head sampling at Collector |
| `tail_sampling` | Keep interesting traces after completion |
| `resource` | Set `deployment.environment` centrally |

## Deployment modes

| Mode | Runs as | Use case |
|------|---------|----------|
| **Agent** | Sidecar / DaemonSet | Per-node collection |
| **Gateway** | Central deployment | Aggregation, tail sampling |
| **Combined** | Both | Large clusters |

## Debugging the Collector

```bash
make stack-logs
# or
docker compose -f examples/stack/docker-compose.yml logs otel-collector
```

Enable `debug` exporter with `verbosity: detailed` for learning — **never** in high-volume production.

## Reference configs

See [configs/](../configs/) and [examples/stack/otel-collector-config.yaml](../examples/stack/otel-collector-config.yaml).

## Practice goals

- [ ] Add a `resource` processor that sets `deployment.environment=lab`
- [ ] Route traces to Jaeger and metrics to Prometheus via one Collector
- [ ] Explain agent vs gateway deployment

## Read next

[07 — Instrumentation](07-instrumentation.md)
