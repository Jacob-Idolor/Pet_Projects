# OpenShift

**Level:** L4 | **Practice:** [openshift/README.md](../openshift/README.md) | **Drill:** [oc-commands.md](../drills/oc-commands.md)

## Kubernetes vs OpenShift

OpenShift is **Kubernetes + opinionated platform**:

| Feature | Kubernetes | OpenShift |
|---------|------------|-----------|
| CLI | kubectl | oc (kubectl-compatible) + oc extras |
| Routes | Ingress (bring your own) | Route (built-in) |
| Projects | Namespaces | Projects (enhanced namespace) |
| Security | You configure | SCCs (Security Context Constraints) |
| Registry | Bring your own | Integrated image registry |
| UI | Optional | Web console (first-class) |

## oc vs kubectl

Most `kubectl` commands work as `oc`:

```bash
oc get pods
oc apply -f manifest.yaml
oc project my-project    # switch project (namespace)
oc new-app --docker-image=nginx
oc expose svc/myapp      # creates Route
oc logs -f deployment/myapp
```

## Key OpenShift concepts

- **Project** — namespace with quotas, limits, default network policy
- **Route** — external hostname → Service (like Ingress + TLS)
- **SCC** — what Pods are allowed (run as user, volumes, privileges)
- **BuildConfig / ImageStream** — platform-native build pipeline (optional depth)

## Local practice

- **CRC (OpenShift Local)** — full-ish cluster on laptop
- **Developer Sandbox** — free cloud OpenShift for experiments
- **kind/minikube** — use kubectl labs; map concepts mentally to Routes/SCCs

## Certification path

- **EX180** — containers, Dockerfiles, basic orchestration
- **EX280** — OpenShift admin: projects, routes, storage, operators

## Practice goals

- [ ] `oc login`, create project, deploy app, expose Route
- [ ] Compare same app on kind (Ingress) vs OpenShift (Route)
- [ ] Read SCC on a Pod: `oc describe pod` → security context
- [ ] Complete [oc command drill](../drills/oc-commands.md) 3 times

Next: [Observability](06-observability.md)
