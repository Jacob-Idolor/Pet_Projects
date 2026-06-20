# Contributing

Thanks for helping improve the K8s Practice Lab. This project is meant to be **forked, shared, and extended**.

## Ways to contribute

- Fix typos or unclear lab steps
- Add troubleshooting scenarios or drill questions
- Improve the static site (design, accessibility, content)
- Share your learning notes (with permission, anonymized)

## Ground rules

### Local-only Kubernetes

- Never add CI that runs `kubectl apply` against a cloud cluster
- Manifests in `manifests/` are for **local kind/minikube only** — see [manifests/LOCAL-ONLY.md](manifests/LOCAL-ONLY.md)
- Do not commit secrets, `.env`, kubeconfigs, or AWS keys

### AWS / hosting

- Infra in `infra/terraform/` is **S3 + CloudFront only**
- Do not add EKS, EC2, Lambda, or RDS modules without an explicit design review
- Each fork maintainer pays their own AWS bill (~$1–5/mo at low traffic)

### Pull requests

1. One logical change per PR when possible
2. Test locally: kind lab still works, `npm run build` in `site/` passes
3. Describe what you tested

## Fork & self-host

1. Fork the repo
2. Copy `infra/terraform/terraform.tfvars.example` → `terraform.tfvars`
3. Pick a **globally unique** bucket name
4. `terraform plan` — confirm only S3/CloudFront/budget
5. `terraform apply` then `infra/deploy-site.ps1`

You are responsible for your own AWS costs and IAM policies.

## Code of conduct

Be respectful. This is a learning space for beginners and career switchers alike.

## Questions

Open a GitHub issue with the `question` label.
