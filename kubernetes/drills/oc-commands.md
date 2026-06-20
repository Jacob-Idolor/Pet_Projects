# OpenShift (oc) command drills

Requires OpenShift Local (CRC), Developer Sandbox, or any OpenShift cluster. Most commands also work with `kubectl` on vanilla k8s except where noted.

## Drill A — Login & projects (5 min)

```bash
oc login <api-url> -u developer -p developer
oc whoami
oc projects
oc new-project drill-practice
oc project drill-practice
```

## Drill B — Deploy & expose (10 min)

```bash
# Imperative deploy (learning)
oc new-app --docker-image=nginx:1.25 --name=web

# Or declarative
oc apply -f ../manifests/examples/nginx-deployment.yaml
oc expose deployment web --port=80
oc expose svc/web    # Creates OpenShift Route

oc get routes
oc get url          # CLI shortcut for route URL
curl $(oc get route web -o jsonpath='{.spec.host}')
```

## Drill C — Builds & registry (optional, 10 min)

```bash
oc new-build --binary --name=myapp --strategy=docker
oc start-build myapp --from-dir=../docker/sample-app --follow
oc logs -f bc/myapp
oc get is
```

## Drill D — Debug & security (10 min)

```bash
oc describe pod <name>
oc logs -f deployment/web
oc rsh deployment/web    # remote shell

oc get scc
oc adm policy who-can use scc anyuid -n drill-practice
oc get rolebindings -n drill-practice
```

## kubectl → oc mapping

| kubectl | oc equivalent |
|---------|---------------|
| `kubectl get ns` | `oc get projects` |
| `kubectl config set-context --namespace=x` | `oc project x` |
| `kubectl create ns x` | `oc new-project x` |
| Ingress manifest | Route manifest or `oc expose` |

## Route vs Ingress exercise

1. Deploy same nginx app on **kind** with Ingress ([Lab 04](../labs/lab-04-networking-ingress/))
2. Deploy on **OpenShift** with Route
3. Document differences in your notes: TLS, hostname, annotations

## Self-check

1. What is a Project vs Namespace?
2. What does `oc expose svc` create that kubectl doesn't by default?
3. What are SCCs and why do they matter?
4. When would you use `oc new-app` vs `oc apply -f`?

<details>
<summary>Answers</summary>

1. Project is an OpenShift-enhanced namespace (quota, default policies, display name).
2. A Route resource with cluster-assigned hostname.
3. Security Context Constraints — Pod security policies enforced by platform.
4. `new-app` for quick experiments; `apply -f` for git-managed declarative deploys (preferred for portfolio).

</details>
