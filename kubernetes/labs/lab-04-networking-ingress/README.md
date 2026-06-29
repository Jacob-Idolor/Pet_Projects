# Lab 04 — Networking & ingress

**Level:** L2 | **Time:** 60 min · **Module:** Networking & Ingress

## Concepts

**ClusterIP Services** are reachable only inside the cluster. **Ingress** adds HTTP routing (hostnames, paths, TLS) but requires an **Ingress controller** pod running in the cluster — applying an Ingress YAML alone does nothing without one.

Debug order: Pod Running → Service endpoints exist → Ingress rules point to correct Service → DNS/Host header correct.

## Goals

- Understand ClusterIP vs NodePort vs Ingress
- Install ingress controller (nginx) on kind
- Route HTTP paths to services

## Steps

### 1. Namespace + apps

```bash
kubectl create namespace lab-04
kubectl config set-context --current --namespace=lab-04
kubectl apply -f ../../manifests/examples/nginx-deployment.yaml
kubectl apply -f ../../manifests/examples/nginx-service-clusterip.yaml
```

### 2. Install ingress-nginx (kind)

```bash
kubectl apply -f https://raw.githubusercontent.com/kubernetes/ingress-nginx/main/deploy/static/provider/kind/deploy.yaml
kubectl wait --namespace ingress-nginx --for=condition=ready pod -l app.kubernetes.io/component=controller --timeout=120s
```

### 3. Apply ingress

```bash
kubectl apply -f ../../manifests/examples/ingress.yaml
kubectl get ingress
```

Add to `/etc/hosts` (or use curl with Host header):

```
127.0.0.1 practice.local
```

```bash
kubectl port-forward -n ingress-nginx svc/ingress-nginx-controller 8080:80
curl -H "Host: practice.local" http://localhost:8080/
```

### 4. Debug empty endpoints

Apply broken service scenario and fix:

```bash
kubectl apply -f ../../manifests/broken/scenario-02-no-endpoints.yaml
kubectl get endpoints
# Fix selector labels
```

## OpenShift parallel

If you have CRC: same app, use `oc expose svc/nginx` instead of Ingress — compare in [openshift/README.md](../../openshift/README.md).

## Checklist

- [ ] Ingress controller running
- [ ] HTTP reaches nginx via Ingress
- [ ] Fixed selector mismatch scenario
- [ ] Noted Ingress vs OpenShift Route differences

## Clean up

```bash
kubectl delete namespace lab-04
```

## Next

[Lab 05 — Storage](../lab-05-storage/)
