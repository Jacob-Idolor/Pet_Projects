# Curriculum overview

Structured path from observability fundamentals → OpenTelemetry signals → Collector → production patterns. Do labs in order; use curriculum docs when you need concept depth.

## Level map

```
L1 Foundations     Three pillars, OTel architecture, local stack
       ↓
L2 Signals           Traces, metrics, logs — each signal in depth
       ↓
L3 Pipeline          Collector receivers, processors, exporters
       ↓
L4 Instrumentation   Manual spans, auto-instrumentation, semantic conventions
       ↓
L5 Platform          Kubernetes, service mesh, multi-service propagation
       ↓
L6 Production        Sampling, cardinality, security, vendor export
```

## Module index

| # | Module | Level | Lab | Drill |
|---|--------|-------|-----|-------|
| 01 | [Observability fundamentals](01-observability-fundamentals.md) | L1 | [Lab 00](../labs/lab-00-stack/) | — |
| 02 | [OpenTelemetry concepts](02-opentelemetry-concepts.md) | L1 | [Lab 01](../labs/lab-01-first-trace/) | [CLI](../drills/otel-cli-commands.md) |
| 03 | [Traces](03-traces.md) | L2 | Lab 01 | troubleshooting |
| 04 | [Metrics](04-metrics.md) | L2 | [Lab 02](../labs/lab-02-metrics/) | — |
| 05 | [Logs](05-logs.md) | L2 | [Lab 03](../labs/lab-03-logs/) | — |
| 06 | [Collector](06-collector.md) | L3 | [Lab 04](../labs/lab-04-collector/) | CLI |
| 07 | [Instrumentation](07-instrumentation.md) | L4 | [Lab 05](../labs/lab-05-auto-instrumentation/) | [checklist](../drills/instrumentation-checklist.md) |
| 08 | [Kubernetes integration](08-kubernetes-integration.md) | L5 | [Lab 06](../labs/lab-06-kubernetes/) | — |
| 09 | [Production patterns](09-production-patterns.md) | L6 | [Lab 07](../labs/lab-07-sampling/) | troubleshooting |

## Suggested pace

| Phase | Focus | Activities |
|-------|-------|------------|
| Week 1 | Stack + traces | Labs 00–01, curriculum 01–03 |
| Week 2 | Metrics + logs | Labs 02–03, curriculum 04–05 |
| Week 3 | Collector + auto-inst | Labs 04–05, curriculum 06–07 |
| Week 4+ | K8s + production | Labs 06–07, vendor integration stretch |

## How to use each module

1. Skim the concept doc (15 min).
2. Run the linked lab hands-on (30–60 min).
3. Run the drill sheet without notes (10 min).
4. Log one takeaway in [PROGRESS.md](../PROGRESS.md).

## Industry context

OpenTelemetry graduated from the CNCF in 2024 and is supported by every major observability vendor. Learning OTel means:

- **Portable skills** — same SDK across jobs and stacks
- **Standards alignment** — W3C Trace Context, semantic conventions
- **Future-proofing** — vendor-neutral telemetry pipeline

## Crosswalk: OTel ↔ other tracks

| Topic | This lab | Kubernetes lab | Dynatrace track |
|-------|----------|------------------|-----------------|
| Metrics | OTel SDK + Collector → Prometheus | kube-prometheus-stack | Metrics API / DQL |
| Traces | Jaeger via OTLP | (add OTel operator) | OneAgent / OTLP ingest |
| Logs | OTel logs bridge | kubectl logs, Loki patterns | Log monitoring |
| Golden signals | curriculum 01, 09 | curriculum 06 | Dashboards |

Adjust depth based on your goals — instrumenting a real app beats reading every spec page.
