# ⚠️ LOCAL ONLY — do not deploy to AWS

These YAML files are for **your local kind / minikube / Docker Desktop cluster only**.

They must **never** be:

- Applied by CI/CD to a cloud account
- Used to provision shared lab environments for website visitors
- Run on EKS or any production AWS cluster

## Why

Running multi-tenant or public Kubernetes labs on AWS is:

- **Expensive** ($70+/mo for EKS alone, more with nodes)
- **Risky** (crypto mining abuse, escape attempts, your AWS bill)
- **Unnecessary** for a learning + passive-income site (static content + local practice is enough)

## Safe workflow

```bash
# On YOUR machine only
kubectl config current-context   # must be kind-practice or docker-desktop
kubectl apply -f examples/       # never against prod context
```

## Website visitors

Practice via:

- Reading lab guides on the static site
- Browser-based command drills (simulated — future)
- Downloading manifests and running locally themselves

See [PLATFORM.md](../PLATFORM.md).
