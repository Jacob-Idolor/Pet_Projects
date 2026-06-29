# Lab 03 — ConfigMaps & secrets

**Level:** L2 | **Time:** 45 min · **Module:** Config & Secrets

## Concepts

**Twelve-factor apps** store config in the environment, not in the image. ConfigMaps hold non-sensitive config; Secrets hold sensitive data (still protect with RBAC — base64 is not encryption).

Pods can consume config via **environment variables** (simple) or **volume mounts** (files on disk). After changing a ConfigMap, many apps need a **rollout restart** to pick up new values.

## Goals

- Inject config via env vars and volumes
- Create and use Secrets (never commit real secrets)
- Restart workload after config change

## Steps

### 1. Setup

```bash
kubectl create namespace lab-03
kubectl config set-context --current --namespace=lab-03
kubectl apply -f ../../manifests/examples/configmap-app.yaml
```

### 2. Verify config mounted

```bash
kubectl get cm,secret
kubectl exec deployment/config-demo -- cat /config/app.conf
kubectl exec deployment/config-demo -- printenv APP_MODE
```

### 3. Update ConfigMap

Edit `../../manifests/examples/configmap-app.yaml` — change `APP_MODE` to `production`, re-apply.

Pods may not reload automatically:

```bash
kubectl rollout restart deployment/config-demo
kubectl exec deployment/config-demo -- printenv APP_MODE
```

### 4. Secret as env var

Check secret is mounted (values are base64 in etcd — still protect RBAC):

```bash
kubectl get secret app-secret -o yaml
kubectl exec deployment/config-demo -- printenv API_TOKEN
```

**Practice rule:** In real repos use Sealed Secrets, External Secrets, or vault — not plain YAML secrets in git.

### 5. Break/fix scenario

```bash
kubectl apply -f ../../manifests/broken/scenario-04-config.yaml
# Fix wrong key reference or mount path, re-apply
```

## Checklist

- [ ] ConfigMap volume mount works
- [ ] Env from ConfigMap and Secret works
- [ ] Rollout restart after config change
- [ ] Fixed scenario-04

## Clean up

```bash
kubectl delete namespace lab-03
```

## Next

[Lab 04 — Networking & ingress](../lab-04-networking-ingress/)
