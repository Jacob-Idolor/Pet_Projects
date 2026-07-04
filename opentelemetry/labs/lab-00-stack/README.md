# Lab 00 — Local observability stack

**Level:** L1 · **Time:** 20–30 min · **Prerequisites:** Docker · **Curriculum:** [01 — Observability fundamentals](../curriculum/01-observability-fundamentals.md)

## Concepts

Before instrumenting code, you need a **backend** to receive telemetry. This lab brings up:

| Component | Role |
|-----------|------|
| **OpenTelemetry Collector** | Receives OTLP, routes to backends |
| **Jaeger** | Trace storage and UI |
| **Prometheus** | Metrics storage |
| **Grafana** | Dashboards |

## Goals

- Start the stack with one command
- Verify each UI is reachable
- Understand OTLP ports (4317 gRPC, 4318 HTTP)

## Steps

### 1. Start the stack

```bash
cd opentelemetry
make stack-up
```

Wait until all containers are healthy:

```bash
make stack-status
```

### 2. Open the UIs

| UI | URL | Login |
|----|-----|-------|
| Jaeger | http://localhost:16686 | — |
| Grafana | http://localhost:3000 | admin / practice |
| Prometheus | http://localhost:9090 | — |

In Grafana, explore the pre-provisioned **OpenTelemetry Lab** dashboard folder.

### 3. Inspect the Collector

```bash
make stack-logs
```

You should see the Collector start with pipelines for traces, metrics, and logs. Press Ctrl+C to stop tailing.

### 4. Verify OTLP endpoints

From your host, the app SDK should target:

```bash
export OTEL_EXPORTER_OTLP_ENDPOINT=http://localhost:4318
```

gRPC alternative: `http://localhost:4317`

### 5. Architecture sketch

Draw this on paper — you'll reference it in every later lab:

```
App (SDK) --OTLP--> Collector --+--> Jaeger (traces)
                                +--> Prometheus (metrics via exporter)
                                +--> debug (Collector logs)
```

Config file: [examples/stack/otel-collector-config.yaml](../../examples/stack/otel-collector-config.yaml)

## Reflect

- Which UI would you use to answer "why was this request slow?"
- Which UI for "how many 500 errors in the last hour?"
- Why put the Collector between the app and Jaeger instead of exporting directly?

## Checklist

- [ ] All containers healthy
- [ ] Jaeger UI loads
- [ ] Grafana login works
- [ ] Prometheus targets show `otel-collector` UP
- [ ] Marked complete in [PROGRESS.md](../../PROGRESS.md)

## Clean up

```bash
make stack-down
```

## Next

[Lab 01 — First trace](../lab-01-first-trace/)
