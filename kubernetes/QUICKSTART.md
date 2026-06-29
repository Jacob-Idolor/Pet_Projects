# Quick start

Pick one path. You can combine them — most people use **browser + local**.

## I want to learn right now (no install)

```bash
cd kubernetes
make site-dev
```

Open http://localhost:4321 → **Learn** → **Practice**

## I want real kubectl on my machine

**Prerequisites:** Docker, kubectl, kind

```bash
cd kubernetes
make local-lab          # creates kind cluster "practice"
```

Then open [labs/lab-01-first-pod/README.md](labs/lab-01-first-pod/README.md).

```bash
kubectl create namespace lab-01
kubectl apply -f manifests/examples/pod-nginx.yaml
kubectl get pods -w
```

## I want to host the site on AWS

**Prerequisites:** AWS account, scoped IAM user, Terraform

```bash
cd kubernetes/infra/terraform
cp terraform.tfvars.example terraform.tfvars   # edit with your account + bucket name
terraform init && terraform plan && terraform apply

cd ../..
AWS_PROFILE=your-profile make aws-deploy
```

See [infra/README.md](infra/README.md) for safeguards and cost (~$1–5/mo).

---

## Folder map

| Folder | What it is |
|--------|------------|
| `site/` | Learning website (Astro) — modules, simulator, quizzes |
| `scripts/` | Local kind cluster setup/teardown |
| `labs/` | Step-by-step hands-on exercises (real cluster) |
| `manifests/` | YAML examples + broken scenarios to debug |
| `drills/` | Command cheat sheets and troubleshooting practice |
| `curriculum/` | Deep-dive reading material |
| `infra/terraform/` | AWS S3 + CloudFront for hosting the site |
| `docker/` | Sample app to build and containerize |

## All make targets

```bash
make help
```

## Track your progress

Edit [PROGRESS.md](PROGRESS.md) as you complete labs and drills.
