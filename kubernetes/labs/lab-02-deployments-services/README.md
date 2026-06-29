# Lab 02 — Deployments & services

**Level:** L1–L2 | **Time:** 45–60 min · **Module:** Deployments & Services

## Concepts

A **Deployment** declares desired state: which image, how many replicas, which env vars. Kubernetes runs a control loop — if a Pod dies, it's replaced. If you scale to 3, three Pods run.

A **Service** is a stable network address for a set of Pods. Pods have ephemeral IPs; Services have DNS names and selectors that find Pods by labels.

| Type | Use case |
|------|----------|
| ClusterIP | Internal traffic only (default) |
| NodePort | Expose on each node's IP at a high port |
| LoadBalancer | Cloud LB in front of NodePort |

**Endpoints** connect Services to Pod IPs. No endpoints = selector mismatch.

## Goals

- Deploy with Deployment (declarative, self-healing)
- Scale replicas
- Expose via Service (ClusterIP + NodePort)
- Rolling update and rollback

## Steps

### 1. Namespace

```bash
kubectl create namespace lab-02
kubectl config set-context --current --namespace=lab-02
```

### 2. Apply deployment

```bash
kubectl apply -f ../../manifests/examples/nginx-deployment.yaml
kubectl get deploy,rs,pod
kubectl describe deployment nginx
```

### 3. Scale

```bash
kubectl scale deployment nginx --replicas=3
kubectl get pods -o wide
```

Delete one Pod — watch it come back:

```bash
kubectl delete pod <one-nginx-pod>
kubectl get pods -w
```

### 4. ClusterIP service

```bash
kubectl apply -f ../../manifests/examples/nginx-service-clusterip.yaml
kubectl get svc,endpoints

kubectl run curl --image=curlimages/curl -it --rm --restart=Never -- curl -s nginx
```

### 5. NodePort (external access on kind/minikube)

```bash
kubectl apply -f ../../manifests/examples/nginx-service-nodeport.yaml
kubectl get svc nginx-nodeport
```

Find NodePort (30080 in manifest). On kind, forward or use:

```bash
kubectl port-forward svc/nginx-nodeport 8080:80
```

### 6. Rolling update

```bash
kubectl set image deployment/nginx nginx=nginx:1.24
kubectl rollout status deployment/nginx
kubectl rollout history deployment/nginx
```

Break it on purpose:

```bash
kubectl set image deployment/nginx nginx=nginx:doesnotexist
kubectl get pods
kubectl rollout undo deployment/nginx
```

## Checklist

- [ ] 3 replicas running
- [ ] Service endpoints match Pod labels
- [ ] curl from in-cluster Pod works
- [ ] Successful rollout and rollback
- [ ] Updated [PROGRESS.md](../../PROGRESS.md)

## Clean up

```bash
kubectl delete namespace lab-02
```

## Next

[Lab 03 — ConfigMaps & secrets](../lab-03-config-secrets/)
