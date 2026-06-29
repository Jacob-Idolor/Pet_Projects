# Cluster setup scripts

## Quick start (recommended)

From `kubernetes/`:

```bash
make local-lab     # create kind cluster + show next steps
make local-down    # teardown
make local-status  # check nodes
```

## Scripts

| Script | Purpose |
|--------|---------|
| `setup-kind.sh` / `setup-kind.ps1` | Create kind cluster `practice` |
| `teardown-kind.sh` / `teardown-kind.ps1` | Delete cluster |
| `bootstrap-lab.sh` | Verify cluster + print learning path |
| `kind-config.yaml` | Port 30080 mapped for NodePort labs |

## Requirements

- Docker running
- `kind` and `kubectl` in PATH

See [SETUP.md](../SETUP.md) for alternatives (minikube, Docker Desktop K8s, CRC).
