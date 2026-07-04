# Kubernetes Operator (advanced)

Optional follow-up after [Lab 06](../labs/lab-06-kubernetes/).

## Install operator

```bash
helm repo add open-telemetry https://open-telemetry.github.io/opentelemetry-helm-charts
helm repo update
helm install opentelemetry-operator open-telemetry/opentelemetry-operator \
  -n opentelemetry-operator-system --create-namespace
```

## OpenTelemetryCollector CR (minimal)

```yaml
apiVersion: opentelemetry.io/v1beta1
kind: OpenTelemetryCollector
metadata:
  name: otel
  namespace: otel-lab
spec:
  mode: deployment
  config:
    receivers:
      otlp:
        protocols:
          grpc: {}
          http: {}
    processors:
      batch: {}
    exporters:
      otlp:
        endpoint: host.docker.internal:4317
        tls:
          insecure: true
    service:
      pipelines:
        traces:
          receivers: [otlp]
          processors: [batch]
          exporters: [otlp]
```

Apply after operator is ready: `kubectl apply -f collector-cr.yaml`

## Auto-instrumentation injection

```yaml
apiVersion: opentelemetry.io/v1alpha1
kind: Instrumentation
metadata:
  name: python-instrumentation
  namespace: otel-lab
spec:
  exporter:
    endpoint: http://otel-collector:4318
  propagators:
    - tracecontext
  python:
    image: ghcr.io/open-telemetry/opentelemetry-operator/autoinstrumentation-python:latest
```

Annotate Pod template:

```yaml
annotations:
  instrumentation.opentelemetry.io/inject-python: "true"
```

## Docs

- [Operator repository](https://github.com/open-telemetry/opentelemetry-operator)
- [Curriculum: K8s integration](../curriculum/08-kubernetes-integration.md)
