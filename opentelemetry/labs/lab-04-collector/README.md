# Lab 04 — Collector pipelines

**Level:** L3 · **Time:** 45–60 min · **Prerequisites:** Labs 00–03 · **Curriculum:** [06 — Collector](../../curriculum/06-collector.md)

## Concepts

The Collector config defines **pipelines** — receivers, processors, exporters — per signal. Changing config lets you add attributes, sampling, and fan-out without redeploying apps.

## Goals

- Read and modify `otel-collector-config.yaml`
- Add a resource attribute via the `resource` processor
- Use the `debug` exporter to inspect telemetry

## Steps

### 1. Baseline config

Open [examples/stack/otel-collector-config.yaml](../../examples/stack/otel-collector-config.yaml)

Identify the three pipelines under `service.pipelines`.

### 2. Add environment attribute

Edit the config — add to `processors`:

```yaml
  resource:
    attributes:
      - key: deployment.environment
        value: lab
        action: upsert
```

Add `resource` to each pipeline's processor list (after `batch` or before — try before `batch`):

```yaml
    traces:
      receivers: [otlp]
      processors: [resource, batch]
      exporters: [otlp/jaeger, debug]
```

Restart Collector:

```bash
docker compose -f examples/stack/docker-compose.yml restart otel-collector
make lab-sample-traffic
```

In Jaeger, open a span → **Tags** — confirm `deployment.environment=lab`.

Reference copy: [configs/collector-with-resource.yaml](../../configs/collector-with-resource.yaml)

### 3. Debug exporter

With `verbosity: detailed` on the `debug` exporter, tail logs:

```bash
make stack-logs
```

Generate one request. Observe span JSON in Collector output.

**Production note:** disable detailed debug at scale.

### 4. Break and fix — wrong exporter endpoint

In config, temporarily set Jaeger endpoint to `jaeger:9999`. Restart Collector, generate traffic, observe export errors in logs. Fix and verify.

## Reflect

- Why batch before export?
- What would you use `attributes` processor for (hint: PII redaction)?

## Checklist

- [ ] Added `deployment.environment` attribute
- [ ] Saw attribute in Jaeger span tags
- [ ] Used debug exporter output
- [ ] Fixed misconfigured exporter (bonus)
- [ ] Updated [PROGRESS.md](../../PROGRESS.md)

## Next

[Lab 05 — Auto-instrumentation](../lab-05-auto-instrumentation/)
