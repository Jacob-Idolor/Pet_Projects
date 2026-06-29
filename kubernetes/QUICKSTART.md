# Quick start

**Open the Lab Hub** — one page to pick any lab:

```bash
cd kubernetes
make site-dev
```

Open http://localhost:4321 and choose Docker, Kubernetes, Troubleshoot, or Local cluster labs.

## Local commands (when you pick a local lab)

```bash
make docker-lab    # Lab 00 — build & run sample container
make local-lab     # kind cluster for Labs 01–07
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
| `site/` | Learning website — Docker + kubectl simulators, modules, troubleshoot hub |
| `docker/` | Sample app + containerization exercises |
| `scripts/` | Local kind cluster + `docker-lab` bootstrap |
| `labs/` | Lab 00 (Docker) + 7 Kubernetes hands-on exercises |
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
