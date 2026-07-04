# Curriculum overview

Structured path from observability fundamentals → OpenTelemetry signals → core concepts → production patterns. Do labs in order; use **teachings/** when you need extra depth.

**Master map:** [CORE-CONCEPTS.md](../CORE-CONCEPTS.md)

## Level map

```
L1 Foundations     Three pillars, OTel architecture, local stack
       ↓
L2 Signals           Traces, metrics, logs — each signal in depth
       ↓
L2b Core concepts    Context, data model, OTLP, semantic conventions
       ↓
L3 Pipeline          Collector receivers, processors, exporters
       ↓
L4 Instrumentation   Manual spans, auto-instrumentation, semantic conventions
       ↓
L5 Platform          Kubernetes, service mesh, multi-service propagation
       ↓
L6 Production        Sampling, cardinality, security, vendor export
```

## Module index — fundamentals (01–09)

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

## Module index — core concepts (10–14)

| # | Module | Teaching companion |
|---|--------|-------------------|
| 10 | [Context & propagation](10-context-and-propagation.md) | [teaching/03](../teachings/03-context-propagation.md) |
| 11 | [Data model & OTLP](11-data-model-and-otlp.md) | [teachings/02](../teachings/02-data-model.md), [05](../teachings/05-otlp-and-backends.md) |
| 12 | [Semantic conventions](12-semantic-conventions.md) | [teaching/06](../teachings/06-semantic-conventions.md) |
| 13 | [Baggage & correlation](13-baggage-and-correlation.md) | [teaching/03](../teachings/03-context-propagation.md) |
| 14 | [Architecture decisions](14-architecture-decisions.md) | [teachings/01](../teachings/01-the-complete-picture.md), [09](../teachings/09-history-and-ecosystem.md) |

## Deep teachings (optional but recommended for full understanding)

See [teachings/README.md](../teachings/README.md) — 10 guides + glossary + mastery checklist.

## Suggested pace

| Phase | Focus | Activities |
|-------|-------|------------|
| Phase 1 | Stack + traces | CORE-CONCEPTS, Labs 00–01, curriculum 01–03, teaching 01–02 |
| Phase 2 | Signals + context | Labs 02–03, curriculum 04–05, 10–11, teachings 03–05 |
| Phase 3 | Collector + conventions | Labs 04–05, curriculum 06–07, 12–13, teachings 04–06 |
| Phase 4 | Production + mastery | Labs 06–07, curriculum 08–09, 14, teachings 07–10, self-check |

## How to use each module

1. Skim the concept doc (15 min).
2. Read linked **teaching** if the topic still feels fuzzy (15–25 min).
3. Do the linked lab hands-on (30–60 min).
4. Answer **concept-self-check** block without notes (10 min).
5. Log one takeaway in [PROGRESS.md](../PROGRESS.md).

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

Adjust depth based on your goals — full understanding = curriculum + teachings + labs + self-check.
