# Kubernetes basics

**Level:** L1–L2 | **Labs:** [01](../labs/lab-01-first-pod/), [02](../labs/lab-02-deployments-services/) | **Drill:** [kubectl-commands.md](../drills/kubectl-commands.md)

## Architecture (simplified)

```
Control plane: API server, etcd, scheduler, controller-manager
Worker nodes:  kubelet, kube-proxy, container runtime (containerd)
You:           kubectl → API server
```

## Core objects (learn in this order)

| Object | Purpose |
|--------|---------|
| **Pod** | Smallest deployable unit; one or more containers |
| **Deployment** | Declarative Pod management, rolling updates |
| **Service** | Stable network endpoint for Pods |
| **Namespace** | Logical isolation |
| **ConfigMap / Secret** | Config and sensitive data |
| **Ingress** | HTTP routing into cluster |

## Pod lifecycle

```
Pending → Running → Succeeded / Failed
              ↓
         CrashLoopBackOff (restart policy)
```

Always check: `kubectl describe pod <name>` and `kubectl logs <name>`.

## Essential kubectl

```bash
kubectl get pods,svc,deploy -A
kubectl apply -f manifest.yaml
kubectl describe pod <name>
kubectl logs <name> [-f] [-c container]
kubectl exec -it <name> -- sh
kubectl delete -f manifest.yaml
```

## Declarative vs imperative

- **Declarative (preferred):** YAML in git → `kubectl apply -f`
- **Imperative:** `kubectl run`, `kubectl expose` — fine for learning, bad for prod

## Probes (readiness vs liveness)

| Probe | Question |
|-------|----------|
| **Liveness** | Is the process alive? Restart if not. |
| **Readiness** | Can this Pod receive traffic? Remove from Service if not. |
| **Startup** | Has slow-start app finished booting? |

## Practice goals

- [ ] Explain Pod vs Deployment vs ReplicaSet
- [ ] Deploy nginx via YAML, scale to 3 replicas
- [ ] Expose Deployment with ClusterIP and NodePort
- [ ] Fix a Pod in `ImagePullBackOff` (Lab 01 bonus)
- [ ] Complete kubectl drill sheet 5 times

Next: [Intermediate](03-intermediate.md) → Labs 03–05
