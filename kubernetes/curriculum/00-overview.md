# Curriculum overview

Structured path from containers → Kubernetes → OpenShift → observability. Do labs in order; use curriculum docs when you need concept depth.

## Level map

```
L1 Foundations     Docker + cluster + Pods/Deployments
       ↓
L2 Core K8s        Services, Config, Ingress, debugging
       ↓
L3 Production      Storage, RBAC, limits, Helm, upgrades
       ↓
L4 Platform        OpenShift, Routes, Projects, SCCs
       ↓
L5 Observability   Metrics, logs, traces, SLOs, alerting
```

## Module index

| # | Module | Level | Lab | Drill |
|---|--------|-------|-----|-------|
| 01 | [Docker fundamentals](01-docker-fundamentals.md) | L1 | — | [docker-commands](../drills/docker-commands.md) |
| 02 | [Kubernetes basics](02-kubernetes-basics.md) | L1–L2 | [Lab 01](../labs/lab-01-first-pod/) | [kubectl-commands](../drills/kubectl-commands.md) |
| 03 | [Intermediate K8s](03-intermediate.md) | L2–L3 | Labs 03–05 | troubleshooting |
| 04 | [Advanced K8s](04-advanced.md) | L3 | Labs 06–07 | troubleshooting |
| 05 | [OpenShift](05-openshift.md) | L4 | [openshift](../openshift/README.md) | [oc-commands](../drills/oc-commands.md) |
| 06 | [Observability](06-observability.md) | L5 | [Lab 08](../observability/lab-prometheus-grafana/) | — |

## Suggested pace

| Week | Focus | Hours |
|------|-------|-------|
| 1 | Docker + Lab 01–02 | 3–5 |
| 2 | Labs 03–04 + kubectl drills | 3–5 |
| 3 | Labs 05–06 + troubleshooting | 3–5 |
| 4 | Helm + observability lab | 3–5 |
| 5+ | OpenShift + deploy your own app | ongoing |

## How to use each module

1. Skim the concept doc (15 min).
2. Do the linked lab hands-on (30–60 min).
3. Run the drill sheet without notes (10 min).
4. Log one takeaway in [PROGRESS.md](../PROGRESS.md).

## Exam topic crosswalk (CKA-heavy)

| CKA domain | Covered in |
|------------|------------|
| Cluster architecture | Lab 01, curriculum 02 |
| Workloads & scheduling | Labs 01–02, curriculum 02–03 |
| Services & networking | Labs 02, 04, curriculum 03 |
| Storage | Lab 05, curriculum 03 |
| Troubleshooting | All labs + [troubleshooting-scenarios](../drills/troubleshooting-scenarios.md) |
| Core concepts | curriculum 02–04 |

Adjust depth based on your goals — portfolio deployables matter as much as exam checklists.
