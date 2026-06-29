# Local environment setup

Use this when you want **real kubectl practice** on your machine.
For browser-only learning, run `make site-dev` instead — no cluster needed.

Pick **one** cluster option. You only need one running to start Lab 01.

## Prerequisites

| Tool | Purpose | Install |
|------|---------|---------|
| Docker Desktop | Container runtime + optional built-in Kubernetes | [docker.com/products/docker-desktop](https://www.docker.com/products/docker-desktop/) |
| kubectl | Kubernetes CLI | [kubernetes.io/docs/tasks/tools](https://kubernetes.io/docs/tasks/tools/) |
| kind | Lightweight local clusters in Docker | `choco install kind` or see [kind.sigs.k8s.io](https://kind.sigs.k8s.io/) |
| Helm | Package manager for k8s | [helm.sh/docs/intro/install](https://helm.sh/docs/intro/install/) |
| oc (optional) | OpenShift CLI | [docs.openshift.com](https://docs.redhat.com/en/documentation/openshift_container_platform/) |

Verify:

```powershell
docker version
kubectl version --client
kind version
helm version
```

---

## Option A — kind (recommended for this repo)

Best for repeatable labs and CI-like practice. One command from repo root:

```bash
cd kubernetes
make local-lab
```

Or run scripts directly:

```powershell
# Windows
cd kubernetes/scripts
.\setup-kind.ps1
```

```bash
# Linux / macOS
cd kubernetes/scripts
./setup-kind.sh
```

Teardown when done:

```powershell
.\teardown-kind.ps1
```

---

## Option B — Docker Desktop Kubernetes

1. Docker Desktop → Settings → Kubernetes → Enable Kubernetes
2. Wait for the green "running" indicator
3. `kubectl config use-context docker-desktop`
4. `kubectl get nodes`

---

## Option C — minikube

```powershell
minikube start --driver=docker
minikube status
kubectl get nodes
```

Useful extras:

```powershell
minikube dashboard   # Web UI
minikube tunnel      # LoadBalancer support on local
```

---

## Option D — OpenShift Local (CRC)

For OpenShift-specific labs in [openshift/](openshift/). Requires Red Hat account and ~16 GB RAM.

1. Download CRC from Red Hat Console
2. `crc setup` → `crc start`
3. `eval $(crc oc-env)` (PowerShell: run the command CRC prints)
4. `oc login -u developer -p developer`
5. `oc whoami`

See [openshift/README.md](openshift/README.md) for OpenShift lab prerequisites.

---

## Recommended tooling

```powershell
# Terminal UI for cluster browsing
kubectl krew install ctx
kubectl krew install ns

# Or install k9s
choco install k9s
```

Optional: [Lens](https://k8slens.dev/) or [OpenShift Web Console](http://console-openshift-console.apps-crc.testing) for visual cluster exploration.

---

## Troubleshooting setup

| Problem | Fix |
|---------|-----|
| `kubectl` can't connect | Check context: `kubectl config current-context` |
| kind cluster won't start | Ensure Docker Desktop is running; try `kind delete cluster` and re-run setup |
| Image pull errors in labs | For kind: `kind load docker-image <name>:<tag> --name practice` after building locally |
| Port already in use | Change NodePort in manifest or stop conflicting service |
| Windows path issues | Run scripts from repo root or `kubernetes/scripts` as documented |

Once `kubectl get nodes` shows Ready, start [Lab 01](labs/lab-01-first-pod/README.md).
