# Lab 06 — Kubernetes

**Level:** L5 · **Time:** 60–90 min · **Prerequisites:** [kubernetes lab](../../../kubernetes/) Labs 01–02, local cluster · **Curriculum:** [08 — Kubernetes integration](../../curriculum/08-kubernetes-integration.md)

## Concepts

On Kubernetes, the Collector usually runs as a **Deployment** (gateway) or **DaemonSet** (agent). Apps send OTLP to a ClusterIP Service.

## Goals

- Deploy OTel Collector to a local cluster
- Run the Go sample as a Pod exporting OTLP in-cluster
- Port-forward Jaeger or use the stack on your host

## Architecture for this lab

```
┌─────────────── kind cluster ───────────────┐
│  Pod: go-http  ──OTLP──►  otel-collector   │
└────────────────────────────────────────────┘
                                    │
                                    ▼ OTLP (host docker network or forward)
                            Jaeger on localhost:16686
```

For simplicity, this lab uses a **Collector in the cluster** that exports to Jaeger running in Docker on the host (`host.docker.internal`).

## Steps

### 1. Start host stack (Jaeger only minimum)

```bash
cd opentelemetry
make stack-up
```

### 2. Start Kubernetes cluster

```bash
cd ../kubernetes
make local-up
kubectl create namespace otel-lab
kubectl config set-context --current --namespace=otel-lab
```

### 3. Apply manifests

```bash
cd ../opentelemetry
kubectl apply -f examples/kubernetes/
kubectl get pods -w
```

Wait for `go-http` and `otel-collector` Running.

### 4. Generate traffic

```bash
kubectl port-forward svc/go-http 8080:8080
curl http://localhost:8080/work
```

### 5. View traces

Jaeger at http://localhost:16686 — service name `go-http-k8s`.

### 6. Optional — OpenTelemetry Operator

For production patterns, install the operator:

```bash
helm repo add open-telemetry https://open-telemetry.github.io/opentelemetry-helm-charts
helm install opentelemetry-operator open-telemetry/opentelemetry-operator \
  -n otel-lab --create-namespace
```

See [integrations/kubernetes-operator.md](../../integrations/kubernetes-operator.md) for CRD examples.

## Reflect

- Why use a Collector Service DNS name instead of Jaeger directly from the app?
- What K8s metadata would help during an incident?

## Checklist

- [ ] Collector Pod running in cluster
- [ ] App Pod exporting traces
- [ ] Traces visible in Jaeger with k8s resource attributes (if configured)
- [ ] Updated [PROGRESS.md](../../PROGRESS.md)

## Clean up

```bash
kubectl delete namespace otel-lab
cd ../kubernetes && make local-down
make stack-down
```

## Next

[Lab 07 — Sampling](../lab-07-sampling/)
