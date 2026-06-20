# Lab 06 — RBAC

**Level:** L3 | **Time:** 45 min

## Goals

- Create ServiceAccount, Role, RoleBinding
- Verify permissions with `auth can-i`
- Run Pod with limited SA

## Steps

### 1. Setup

```bash
kubectl create namespace lab-06
kubectl config set-context --current --namespace=lab-06
kubectl apply -f ../../manifests/examples/rbac-readonly.yaml
```

### 2. Test permissions

```bash
kubectl auth can-i get pods --as=system:serviceaccount:lab-06:readonly-sa -n lab-06
kubectl auth can-i create pods --as=system:serviceaccount:lab-06:readonly-sa -n lab-06
```

Expect: get=yes, create=no.

### 3. Pod using SA

```bash
kubectl apply -f ../../manifests/examples/rbac-pod.yaml
kubectl exec -it rbac-test -- sh
# Inside: service account token mounted at /var/run/secrets/...
```

### 4. Extend (optional)

Create Role allowing `get/list` on ConfigMaps only. Bind to new SA. Test with `auth can-i`.

## Checklist

- [ ] Role limits verbs/resources correctly
- [ ] RoleBinding ties SA to Role
- [ ] `auth can-i` confirms expected access

## Clean up

```bash
kubectl delete namespace lab-06
```

## Next

[Lab 07 — Helm](../lab-07-helm/)
