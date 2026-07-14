# Kubernetes manifests for Lab 06

Deploy OTel Collector + Go sample to a local cluster. Jaeger runs on the Docker host stack.

## Prerequisites

1. `make stack-up` on host (Jaeger receives OTLP on port 4317)
2. kind cluster from [kubernetes/](../../../kubernetes/) lab
3. Build and load Go image into kind:

```bash
cd opentelemetry/examples/go-http
docker build -t otel-go-http:lab .
kind load docker-image otel-go-http:lab --name practice
```

## Deploy

```bash
kubectl create namespace otel-lab
kubectl apply -f manifests.yaml
kubectl get pods -n otel-lab -w
```

## Test

```bash
kubectl port-forward -n otel-lab svc/go-http 8080:8080
curl http://localhost:8080/work
```

View traces in Jaeger: service `go-http-k8s`.

## Notes

- `host.docker.internal` lets in-cluster Collector reach host Jaeger (works on Docker Desktop and kind with extraPortMappings)
- For production, run Jaeger/Tempo inside the cluster or use a managed backend

## Learn

- [Lab 06](../../labs/lab-06-kubernetes/)
- [Operator option](../../integrations/kubernetes-operator.md)
