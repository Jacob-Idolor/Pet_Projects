# Lab 07 — Helm

**Level:** L3 | **Time:** 45–60 min · **Module:** Production patterns

## Concepts

**Helm** is a package manager for Kubernetes. A **chart** bundles templated YAML + default **values.yaml**. `helm install` creates resources; `helm upgrade` changes them; `helm rollback` reverts to a previous revision — similar mental model to Deployment rollouts.

Charts help you avoid copy-pasting YAML and give you versioned, repeatable deploys.

## Goals

- Install chart from repo
- Override values
- Upgrade and rollback

## Steps

### 1. Setup

```bash
kubectl create namespace lab-07
helm repo add bitnami https://charts.bitnami.com/bitnami
helm repo update
```

### 2. Install nginx via Helm

```bash
helm install my-nginx bitnami/nginx -n lab-07 --set replicaCount=2
helm list -n lab-07
kubectl get pods -n lab-07
```

### 3. Upgrade

```bash
helm upgrade my-nginx bitnami/nginx -n lab-07 --set replicaCount=3
kubectl get deploy -n lab-07
```

### 4. Rollback

```bash
helm history my-nginx -n lab-07
helm rollback my-nginx 1 -n lab-07
```

### 5. Custom chart (portfolio prep)

Scaffold your own chart for a future app:

```bash
helm create ../../experiments/my-first-chart
# Edit templates/ and values.yaml — don't install until ready
```

Document in chart README: what values matter for deploy.

## Checklist

- [ ] Installed chart with custom values
- [ ] Upgrade changed replica count
- [ ] Rollback restored previous revision
- [ ] Created skeleton custom chart

## Clean up

```bash
helm uninstall my-nginx -n lab-07
kubectl delete namespace lab-07
```

## Next

[Lab 08 — Observability](../../observability/lab-prometheus-grafana/)
