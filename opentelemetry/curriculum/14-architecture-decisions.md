# Architecture decisions

**Level:** L4 | **Teachings:** [01-the-complete-picture](../teachings/01-the-complete-picture.md), [04-sdk-internals](../teachings/04-sdk-internals.md) | **Lab:** [Lab 06](../labs/lab-06-kubernetes/)

## Learning objectives

- Choose direct export vs Collector vs agent/gateway
- Decide SDK vs auto-instrumentation vs vendor agent
- Plan a migration from legacy instrumentation

## Decision matrix: export path

| Pattern | When |
|---------|------|
| SDK → backend direct | Local dev, single service, learning |
| SDK → Collector → backend(s) | **Production default** |
| Agent DaemonSet → Gateway → backend | Large K8s clusters, tail sampling |

## Decision matrix: instrumentation

| Approach | When |
|----------|------|
| Auto-instrumentation only | Quick win, standard frameworks |
| Auto + manual business spans | **Recommended production** |
| Manual only | Full control, non-standard stack |
| Vendor agent | Vendor-specific features; migrate to OTel over time |

## SDK vs Collector processing

| Concern | SDK | Collector |
|---------|-----|-----------|
| Head sampling | ✓ | ✓ |
| Tail sampling | ✗ (typical) | ✓ |
| PII redaction | possible | **preferred** (no redeploy) |
| Add `deployment.environment` | ✓ | ✓ |
| Fan-out to 3 backends | awkward | **natural** |

## Migration from legacy

| From | Steps |
|------|-------|
| OpenCensus | Replace library with OTel SDK; map exporters to OTLP |
| Jaeger client | Remove client; OTel SDK → OTLP → Jaeger |
| Custom metrics | Wrap in OTel Meter API; export via Collector |
| printf logs | Structured logging + trace_id bridge |

## Kubernetes placement

| Component | Deployment |
|-----------|------------|
| App with OTel SDK | Deployment per service |
| Collector agent | DaemonSet (optional) |
| Collector gateway | Deployment (1–3 replicas) |
| Operator | Cluster-scoped for CRDs |

See [integrations/kubernetes-operator.md](../integrations/kubernetes-operator.md).

## Cost and operations

- **Sampling** at gateway — control trace volume
- **Cardinality** review — monthly metric label audit
- **TLS** on OTLP — non-negotiable outside dev
- **Version pinning** — Collector and SDK semver

## Hands-on

1. Draw your ideal architecture for a 5-service app
2. List what runs in app vs Collector vs platform team
3. Read [10-mastery-checklist](../teachings/10-mastery-checklist.md) teach-back section

## Self-check

[concept-self-check.md](../drills/concept-self-check.md) § Block 9

## Next

Return to [CORE-CONCEPTS.md](../CORE-CONCEPTS.md) — verify all 15 ideas internalized
