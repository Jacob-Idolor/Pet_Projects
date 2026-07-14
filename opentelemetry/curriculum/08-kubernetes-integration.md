# Kubernetes integration

**Level:** L5 | **Lab:** [Lab 06](../labs/lab-06-kubernetes/) | **Ties to:** [kubernetes/](../kubernetes/) track

## OTel on Kubernetes

Three common patterns:

| Pattern | Components | When |
|---------|------------|------|
| **SDK in app** | App exports OTLP to Collector Service | Full control |
| **Collector DaemonSet** | Agent on each node | Node logs, host metrics |
| **Operator** | [OpenTelemetry Operator](https://github.com/open-telemetry/opentelemetry-operator) | Auto-inject sidecars, manage CRDs |

## OpenTelemetry Operator

Custom resources:

- `OpenTelemetryCollector` — deploy Collector instances
- `Instrumentation` — auto-instrumentation injection for Pods
- `OpAMP` — remote config (advanced)

Lab 06 uses Helm to install the operator and a Collector.

## Kubernetes attributes

The Collector or SDK can add:

```yaml
k8s.pod.name: checkout-api-7d8f9c-xk2lm
k8s.namespace.name: production
k8s.deployment.name: checkout-api
```

Use the `k8sattributes` processor in the Collector.

## Service mesh (awareness)

Istio, Linkerd, and others emit traces — OTel can **complement** or **replace** mesh telemetry depending on architecture. For learning, start with app-level OTel before mesh complexity.

## Relationship to Prometheus stack

The [kubernetes observability lab](../kubernetes/observability/lab-prometheus-grafana/) deploys kube-prometheus-stack. OTel **adds**:

- Distributed traces across services
- Unified instrumentation in application code
- Vendor-neutral export via OTLP

You can run both: OTel Collector → Prometheus exporter + Jaeger.

## Resource limits

Collector memory scales with batch size and tail sampling buffers. Set:

```yaml
resources:
  limits:
    memory: 512Mi
processors:
  memory_limiter:
    limit_mib: 400
```

## Practice goals

- [ ] Deploy OTel Collector to a kind cluster
- [ ] Export traces from a Pod to Jaeger (port-forward or ingress)
- [ ] List three K8s metadata attributes you'd want on every span

## Read next

[09 — Production patterns](09-production-patterns.md)
