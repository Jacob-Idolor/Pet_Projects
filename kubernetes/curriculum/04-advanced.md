# Advanced Kubernetes

**Level:** L3 | **Labs:** [06](../labs/lab-06-rbac/), [07](../labs/lab-07-helm/)

## RBAC

```
Subject (User/SA) + Role (rules) + RoleBinding → permissions in namespace
ClusterRole + ClusterRoleBinding → cluster-wide
```

ServiceAccounts are how **Pods** authenticate to the API. Default SA often has too much or too little — design explicitly.

## Workload types beyond Deployment

| Type | When |
|------|------|
| **StatefulSet** | Stable identity, ordered rollout, persistent storage |
| **DaemonSet** | One Pod per node (agents, log collectors) |
| **Job / CronJob** | Batch, scheduled tasks |

## Helm

- **Chart** — templated manifests (values.yaml)
- `helm install`, `helm upgrade`, `helm rollback`
- Use for repeatable deploys; tie into GitOps later (Argo CD, Flux)

## Upgrades & rollbacks

```bash
kubectl rollout status deployment/myapp
kubectl rollout history deployment/myapp
kubectl rollout undo deployment/myapp
kubectl rollout undo deployment/myapp --to-revision=2
```

## Security basics

- NetworkPolicies — restrict Pod-to-Pod traffic
- Pod Security Standards / restricted profiles
- No secrets in images or ConfigMaps
- Scan images (Trivy, etc.) in CI

## Multi-cluster / GitOps (awareness)

- Git as source of truth for manifests
- Argo CD / Flux reconcile cluster to git
- Useful for portfolio: "here's my app + Helm chart + deploy pipeline"

## Practice goals

- [ ] Create SA + Role + RoleBinding; verify access with `kubectl auth can-i`
- [ ] Install a chart with Helm; change values; rollback
- [ ] Perform rolling update; break bad image; undo rollout
- [ ] Write a NetworkPolicy that denies all ingress except from one namespace

Next: [OpenShift](05-openshift.md) or [Observability](06-observability.md)
