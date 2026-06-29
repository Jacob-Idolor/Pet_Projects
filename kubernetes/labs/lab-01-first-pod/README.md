# Lab 01 — First pod

**Level:** L1 · **Time:** 30–45 min · **Prerequisites:** [Lab 00](../lab-00-docker/) or Docker basics · **Lesson:** [L8 — Pods explained](../../site/src/pages/modules/k2-pods.html)

## Concepts

A **Pod** is the smallest thing Kubernetes schedules. It wraps your container(s) and gets a unique IP inside the cluster. Unlike a Deployment, a bare Pod is **not** self-healing — if you delete it, it's gone unless something else recreates it.

**Why this lab matters:** Every kubectl debug session starts with Pods. You'll use `get`, `describe`, `logs`, and `exec` thousands of times in your career — build the muscle memory here.

| Idea | Meaning |
|------|---------|
| Pod | One or more containers sharing network/storage |
| Namespace | Logical isolation (`lab-01` keeps practice tidy) |
| ImagePullBackOff | Cluster can't pull the image — bad tag or missing registry auth |
| port-forward | Tunnel from your laptop to a Pod port for local testing |

## Goals

- Apply your first Kubernetes manifest
- Inspect Pod lifecycle with `kubectl`
- Practice logs, exec, and describe
- Fix an `ImagePullBackOff` (bonus)

## Steps

### 1. Create practice namespace

Namespaces isolate resources. You'll create one per lab to keep cleanup easy.

```bash
kubectl create namespace lab-01
kubectl config set-context --current --namespace=lab-01
```

### 2. Deploy a pod

```bash
kubectl apply -f ../../manifests/examples/pod-nginx.yaml
kubectl get pods -w
```

Wait until `STATUS` is `Running`. Press Ctrl+C to stop watching.

**Observe:** READY column (1/1), which node it landed on, restart count.

### 3. Inspect

```bash
kubectl describe pod nginx
kubectl logs nginx
kubectl exec -it nginx -- nginx -v
```

**Write down:** What node is the Pod on? What container image? What restart policy? What do the Events say?

### 4. Port-forward

Cluster IPs aren't reachable from your laptop. Port-forward creates a local tunnel:

```bash
kubectl port-forward pod/nginx 8080:80
```

Open http://localhost:8080 — you should see nginx welcome page.

### 5. Delete and recreate

```bash
kubectl delete -f ../../manifests/examples/pod-nginx.yaml
kubectl apply -f ../../manifests/examples/pod-nginx.yaml
```

Notice: Pod name is fixed — for production use Deployments instead (Lab 02).

### 6. Bonus — break and fix

Apply broken manifest:

```bash
kubectl apply -f ../../manifests/broken/scenario-03-imagepull.yaml
kubectl get pods
kubectl describe pod broken-app
```

Fix the image in the YAML (use `nginx:1.25`), re-apply, verify Running.

## Reflect

- Why does `describe` show Events at the bottom, and when do you read them first?
- What would change if this Pod were managed by a Deployment?

## Checklist

- [ ] Pod reached Running state
- [ ] Used `describe`, `logs`, `exec`
- [ ] Port-forward worked
- [ ] Fixed ImagePullBackOff (bonus)
- [ ] Marked complete in [Tracker](../../site/) (`/progress.html`)

## Clean up

```bash
kubectl delete namespace lab-01
```

## Next

[Lab 02 — Deployments & services](../lab-02-deployments-services/)
