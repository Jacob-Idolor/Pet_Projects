# ☸️ Kubernetes & DevOps Practice Lab

Hands-on training for containers, Kubernetes, OpenShift, and observability — built to **level up your DevOps skills** and eventually support a **low-cost hosted learning site** (content + ads + digital products), without running real clusters in AWS.

> **Platform model:** Practice for real on your laptop (kind). Publish lab content as a static website on AWS (~$3–8/mo). Earn passively via AdSense, affiliates, and digital products. See [PLATFORM.md](PLATFORM.md) and [infra/README.md](infra/README.md).

## Quick start

1. **Set up a local cluster** → [SETUP.md](SETUP.md)
2. **Pick your level** → [curriculum/00-overview.md](curriculum/00-overview.md)
3. **Do a lab** → [labs/](labs/)
4. **Drill commands** → [drills/](drills/)
5. **Track progress** → [PROGRESS.md](PROGRESS.md)

## What you'll practice

| Area | Folder | Skills |
|------|--------|--------|
| Docker | [docker/](docker/) | Images, containers, Dockerfile, compose, debugging |
| Kubernetes | [labs/](labs/) + [manifests/](manifests/) | Pods → Deployments → Services → Ingress → Storage → RBAC |
| OpenShift | [openshift/](openshift/) | `oc` CLI, Routes, Projects, SCCs, templates |
| Observability | [observability/](observability/) | Metrics, logs, traces, alerts, dashboards |
| Command drills | [drills/](drills/) | Speed + muscle memory for `docker`, `kubectl`, `oc` |
| Troubleshooting | [drills/troubleshooting-scenarios.md](drills/troubleshooting-scenarios.md) | Realistic break/fix scenarios |

## Curriculum levels

| Level | Focus | Start here |
|-------|-------|------------|
| **L1 — Foundations** | Docker + first cluster + Pods/Deployments | [Lab 01](labs/lab-01-first-pod/) |
| **L2 — Core K8s** | Services, ConfigMaps, Secrets, Ingress | [Lab 02](labs/lab-02-deployments-services/) |
| **L3 — Production patterns** | Storage, RBAC, Helm, resource limits | [Lab 05](labs/lab-05-storage/) |
| **L4 — Platform & OpenShift** | `oc`, Routes, Projects, platform ops | [OpenShift guide](openshift/README.md) |
| **L5 — Observability** | Prometheus, Grafana, logging, alerting | [Lab 08](observability/lab-prometheus-grafana/) |

Full syllabus: [curriculum/00-overview.md](curriculum/00-overview.md)

## Repo layout

```
kubernetes/
  PLATFORM.md           # Architecture, costs, monetization, safeguards
  CONTRIBUTING.md       # How others fork, contribute, and self-host
  SETUP.md              # Local cluster setup (kind, minikube, Docker Desktop, CRC)
  PROGRESS.md           # Your checklist — mark labs and drills complete
  infra/                # Terraform (S3 + CloudFront only) + deploy script
  site/                 # Astro static site → build & deploy to S3
  curriculum/           # Concept guides by topic and level
  labs/                 # Step-by-step hands-on exercises (local cluster only)
  drills/               # Command practice + troubleshooting scenarios
  manifests/            # LOCAL ONLY YAML — see manifests/LOCAL-ONLY.md
  docker/               # Container fundamentals before/alongside k8s
  openshift/            # OpenShift-specific practice
  observability/        # Monitoring & observability labs
  scripts/              # Local kind bootstrap only
```

## Daily practice routine (30–45 min)

1. **5 min** — Pick 5 commands from a drill sheet; run them without looking.
2. **20 min** — Work through one lab step or one troubleshooting scenario.
3. **10 min** — Write one thing you learned in [notes/](notes/) (create as you go).

## Certification alignment (optional)

This lab covers topics found in:

- **CKA** (Certified Kubernetes Administrator) — cluster ops, troubleshooting, networking, storage
- **CKAD** (Certified Kubernetes Application Developer) — workloads, config, observability basics
- **EX180 / EX280** (Red Hat OpenShift) — containers, `oc`, platform deployment

You don't need to sit an exam to benefit — the labs map to real on-the-job skills.

## End goal

Deploy something from another track (`games/`, `poker/`, `stocks/`) to your cluster with:

- Dockerfile + health checks
- Kubernetes manifests or Helm chart
- Metrics and logs wired to an observability stack
- Documented runbook in the project's README

That is a complete **deployable + observable** story for your portfolio.
