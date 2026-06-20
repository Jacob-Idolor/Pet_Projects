# Lab 01 — First pod

**Level:** L1 | **Time:** 30–45 min | **Prerequisites:** [SETUP.md](../../SETUP.md)

## Goals

- Apply your first Kubernetes manifest
- Inspect Pod lifecycle with `kubectl`
- Practice logs, exec, and describe
- Fix an `ImagePullBackOff` (bonus)

## Steps

### 1. Create practice namespace

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

### 3. Inspect

```bash
kubectl describe pod nginx
kubectl logs nginx
kubectl exec -it nginx -- nginx -v
```

**Write down:** What node is the Pod on? What container image? What restart policy?

### 4. Port-forward

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

## Checklist

- [ ] Pod reached Running state
- [ ] Used `describe`, `logs`, `exec`
- [ ] Port-forward worked
- [ ] Fixed ImagePullBackOff (bonus)
- [ ] Logged takeaway in [PROGRESS.md](../../PROGRESS.md)

## Clean up

```bash
kubectl delete namespace lab-01
```

## Next

[Lab 02 — Deployments & services](../lab-02-deployments-services/)
