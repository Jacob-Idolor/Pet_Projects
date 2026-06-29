# ☸ Kubernetes Learning Lab

A **dual-path** practice environment for containers and Kubernetes:

| Path | What | When |
|------|------|------|
| **Browser** | Interactive site — modules, quizzes, simulated kubectl | Learn concepts anywhere, zero install |
| **Localhost** | kind cluster + hands-on labs + real manifests | Build muscle memory with real `kubectl` |
| **AWS** | Terraform → S3 + CloudFront (~$1–5/mo) | Share the learning site publicly |

Start here: **[QUICKSTART.md](QUICKSTART.md)**

---

## Fast commands

```bash
cd kubernetes

make help          # all targets
make site-dev      # browser learning @ localhost:4321
make docker-lab    # build & run sample container
make local-lab     # kind cluster + Lab instructions
make aws-deploy    # build site → S3 (after terraform apply)
```

---

## Repository layout

```
kubernetes/
├── site/              # Learning website (Astro) — the main UI
├── scripts/           # Local cluster: kind setup, teardown, bootstrap
├── labs/              # 7+ guided labs (real cluster required)
├── manifests/         # Example YAML + broken debug scenarios
├── drills/            # kubectl / docker command practice sheets
├── curriculum/        # Concept deep-dives (reading)
├── docker/            # Sample app to build and containerize
├── infra/
│   ├── terraform/     # AWS: S3 + CloudFront (site hosting only)
│   └── deploy-site.*  # Build + sync site to AWS
├── observability/     # Prometheus/Grafana lab
├── openshift/         # Optional OpenShift (CRC) notes
├── Makefile           # One entry point for all paths
├── SETUP.md           # Local cluster options (kind, minikube, etc.)
└── PROGRESS.md        # Your learning checklist
```

---

## Learning loop

1. **Browser** — Read a module, pass the quiz, practice in the kubectl simulator
2. **Local** — Run the same ideas on a kind cluster (`labs/lab-01` onward)
3. **Break things** — Debug `manifests/broken/` scenarios (CrashLoop, ImagePull, no endpoints)
4. **Drills** — Repeat commands from `drills/` until they stick
5. **Optional** — Deploy the site to AWS so you can access it from anywhere

---

## Local cluster

**Recommended:** kind via `make local-lab`

```bash
make check-tools     # docker + kubectl + kind
make local-up        # create cluster "practice"
make local-down      # teardown
```

Alternatives: Docker Desktop Kubernetes, minikube, OpenShift Local — see [SETUP.md](SETUP.md).

---

## AWS hosting

Terraform provisions **only** static site infrastructure (no EKS, no EC2):

```bash
cd infra/terraform
cp terraform.tfvars.example terraform.tfvars   # edit account + bucket
terraform init && terraform plan && terraform apply
cd ../.. && make aws-deploy
```

Safeguards, IAM policy, teardown: [infra/README.md](infra/README.md).

---

## What's free vs what costs money

| Item | Cost |
|------|------|
| Browser site locally | **$0** |
| kind cluster on your laptop | **$0** |
| AWS S3 + CloudFront (optional) | **~$1–5/mo** |
| EKS / managed K8s on AWS | **Not included** — use local kind for practice |

---

## Contributing

See [CONTRIBUTING.md](CONTRIBUTING.md). Fork → own AWS account → own hosting bill if you publish the site.
