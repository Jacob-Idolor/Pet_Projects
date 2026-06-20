# OpenShift practice

OpenShift-specific labs and exercises. Requires CRC, Developer Sandbox, or a corporate cluster.

## Prerequisites

- `oc` CLI installed and logged in
- Project (namespace) created: `oc new-project openshift-practice`

## Lab O1 — Deploy and route

```bash
oc new-project openshift-practice
oc apply -f ../manifests/examples/nginx-deployment.yaml
oc apply -f ../manifests/examples/nginx-service-clusterip.yaml
oc expose svc/nginx
oc get route
curl -k https://$(oc get route nginx -o jsonpath='{.spec.host}')
```

## Lab O2 — Compare with vanilla Kubernetes

| Step | kind + kubectl | OpenShift + oc |
|------|----------------|----------------|
| Deploy app | `kubectl apply -f` | `oc apply -f` |
| External access | Ingress + controller | `oc expose` → Route |
| Namespace | `kubectl create ns` | `oc new-project` |
| Web UI | optional (Lens) | OpenShift Console |

Document differences in your notes — interview gold.

## Lab O3 — Security context

```bash
oc apply -f ../manifests/examples/nginx-deployment.yaml
oc get pod -o yaml | findstr /i "securityContext"
oc describe scc restricted
oc describe scc anyuid
```

Why might a Pod fail on OpenShift but work on kind? (SCC, runAsUser, capabilities)

## Drill

[oc-commands.md](../drills/oc-commands.md) — 3 full sessions.

## Read

[Curriculum: OpenShift](../curriculum/05-openshift.md)

## Certification

- EX180 — containers & images
- EX280 — OpenShift administration

Map each lab here to exam objectives as you progress.
