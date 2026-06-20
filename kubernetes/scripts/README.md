# Cluster setup scripts

## kind (recommended)

```powershell
# From repo root or kubernetes/scripts
.\setup-kind.ps1
```

Creates cluster named `practice` with port mappings for NodePort 30080.

```powershell
.\teardown-kind.ps1
```

## Requirements

- Docker Desktop running
- `kind` and `kubectl` in PATH

See [SETUP.md](../SETUP.md) for alternatives (minikube, Docker Desktop K8s, CRC).
