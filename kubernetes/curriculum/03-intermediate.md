# Intermediate Kubernetes

**Level:** L2–L3 | **Labs:** [03](../labs/lab-03-config-secrets/), [04](../labs/lab-04-networking-ingress/), [05](../labs/lab-05-storage/)

## Config & secrets

- **ConfigMap** — non-sensitive config (env vars, config files)
- **Secret** — sensitive data (base64 encoded, not encrypted at rest by default)
- Mount as env vars or volumes; update ConfigMap → may need Pod restart

## Networking

| Service type | Use case |
|--------------|----------|
| ClusterIP | Internal only (default) |
| NodePort | Expose on each node's IP:port |
| LoadBalancer | Cloud LB (or minikube tunnel) |
| Headless | Stable DNS per Pod (StatefulSets) |

**Ingress** — HTTP/S routing, TLS termination, path-based rules. Requires an Ingress controller (nginx, traefik, etc.).

## Storage

| Resource | Role |
|----------|------|
| PV | Cluster storage resource |
| PVC | Pod's claim on storage |
| StorageClass | Dynamic provisioning |

Understand `ReadWriteOnce` vs `ReadWriteMany` — affects which workloads can share volumes.

## Resource management

```yaml
resources:
  requests:
    cpu: "100m"
    memory: "128Mi"
  limits:
    cpu: "500m"
    memory: "256Mi"
```

- **Requests** — scheduling guarantee
- **Limits** — cap; OOM kills if memory exceeded

## Troubleshooting workflow

1. `kubectl get events -A --sort-by='.lastTimestamp'`
2. `kubectl describe` the failing object
3. `kubectl logs` (+ `--previous` for crashed container)
4. `kubectl exec` to verify DNS, files, env
5. Check Service endpoints: `kubectl get endpoints`

Practice: [troubleshooting-scenarios.md](../drills/troubleshooting-scenarios.md)

## Practice goals

- [ ] App that reads config from ConfigMap volume
- [ ] Ingress with two path rules
- [ ] PVC bound and mounted; data survives Pod delete
- [ ] Set requests/limits; observe OOM or CPU throttle

Next: [Advanced](04-advanced.md) → Labs 06–07
