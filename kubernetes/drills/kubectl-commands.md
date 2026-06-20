# kubectl command drills

**Setup:** `kubectl config current-context` should point at your practice cluster.

## Drill A — Discovery (daily, 5 min)

Run from memory, then verify output makes sense:

```bash
kubectl cluster-info
kubectl get nodes -o wide
kubectl get ns
kubectl get all -n kube-system
kubectl api-resources
kubectl explain pod.spec.containers
```

## Drill B — Workloads (10 min)

Namespace: create `drill` for practice.

```bash
kubectl create namespace drill
kubectl config set-context --current --namespace=drill

kubectl run nginx --image=nginx:1.25 --port=80
kubectl get pods -w
kubectl describe pod nginx
kubectl logs nginx
kubectl exec -it nginx -- curl localhost

kubectl delete pod nginx
kubectl apply -f ../manifests/examples/nginx-deployment.yaml
kubectl get deploy,rs,pod
kubectl scale deployment nginx --replicas=3
kubectl rollout status deployment/nginx
```

## Drill C — Services & networking (10 min)

```bash
kubectl expose deployment nginx --port=80 --target-port=80
kubectl get svc,endpoints
kubectl run curl --image=curlimages/curl -it --rm -- curl nginx

# Port-forward (access without Ingress)
kubectl port-forward svc/nginx 8080:80
```

## Drill D — Config & troubleshoot (10 min)

```bash
kubectl create configmap app-config --from-literal=LOG_LEVEL=debug
kubectl get cm app-config -o yaml

kubectl get events --sort-by='.lastTimestamp'
kubectl describe pod <failing-pod>
kubectl logs <pod> --previous
kubectl auth can-i create pods --as=system:serviceaccount:default:default
```

## Drill E — YAML fluency

Without applying, explain what each does:

```bash
kubectl apply -f manifest.yaml --dry-run=client -o yaml
kubectl diff -f manifest.yaml
kubectl delete -f manifest.yaml --ignore-not-found
```

## Speed challenge (CKA-style)

Fix a broken deployment in [../manifests/broken/](../manifests/broken/) **under 15 minutes**:

1. Pod not starting
2. Service has no endpoints
3. Wrong image tag

Log time in [PROGRESS.md](../PROGRESS.md).

## Cheat sheet (reference only)

| Task | Command |
|------|---------|
| All pods all ns | `kubectl get pods -A` |
| YAML export | `kubectl get deploy nginx -o yaml` |
| Edit live | `kubectl edit deployment nginx` |
| Shell | `kubectl exec -it pod -- sh` |
| Copy file | `kubectl cp pod:/path ./local` |
| Top resources | `kubectl top pods` (needs metrics-server) |
| Rollback | `kubectl rollout undo deployment/nginx` |
