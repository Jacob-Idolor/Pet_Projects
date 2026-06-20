# Lab 05 — Storage

**Level:** L3 | **Time:** 45 min

## Goals

- Create PVC and mount in Pod
- Verify data persists across Pod deletion
- Understand StorageClass (dynamic provisioning)

## Steps

### 1. Setup

```bash
kubectl create namespace lab-05
kubectl config set-context --current --namespace=lab-05
kubectl get storageclass
```

### 2. Apply PVC + Pod

```bash
kubectl apply -f ../../manifests/examples/pvc-demo.yaml
kubectl get pvc,pv,pod
```

Wait for PVC `Bound`.

### 3. Write data

```bash
kubectl exec -it pvc-demo -- sh -c 'echo hello-persistent > /data/message.txt'
kubectl exec pvc-demo -- cat /data/message.txt
```

### 4. Delete Pod, recreate

```bash
kubectl delete pod pvc-demo
kubectl apply -f ../../manifests/examples/pvc-demo.yaml
kubectl exec pvc-demo -- cat /data/message.txt
```

Data should still be `hello-persistent`.

### 5. Pending pod scenario

```bash
kubectl apply -f ../../manifests/broken/scenario-05-pending.yaml
kubectl describe pod
# Fix excessive resource requests
```

## Checklist

- [ ] PVC bound
- [ ] Data survived Pod delete
- [ ] Fixed pending scenario
- [ ] Can explain RWO vs RWM

## Clean up

```bash
kubectl delete namespace lab-05
```

## Next

[Lab 06 — RBAC](../lab-06-rbac/)
