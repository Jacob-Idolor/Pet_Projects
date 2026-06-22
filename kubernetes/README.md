# ☸ Kubernetes Learning Platform

**Browser-based** Kubernetes and container fundamentals — learn concepts, practice simulated `kubectl`, pass quizzes. Host on AWS CloudFront (~$1–5/mo). No downloads. No cloud clusters for learners.

## For learners (zero install)

1. Open the site (local: `cd site && npm run dev`)
2. **[Learn](site/)** → 7 modules with lessons + quizzes
3. **[Practice](site/)** → simulated kubectl terminal + debug scenarios
4. Progress saves in your browser automatically

## For you (hosting)

1. `cd kubernetes/infra/terraform` → `terraform apply`
2. `cd ../..` → `infra/deploy-site.ps1 -Profile pet-projects`
3. Share CloudFront URL
4. Add Google AdSense script in `site/src/layouts/BaseLayout.astro` after approval

See [PLATFORM.md](PLATFORM.md) and [infra/README.md](infra/README.md).

## What's in this folder

| Path | Purpose |
|------|---------|
| **`site/`** | **The product** — Astro static site with simulator, modules, ads |
| `infra/` | S3 + CloudFront Terraform (~$1–5/mo) |
| `labs/`, `drills/`, `curriculum/` | Source material / optional real-cluster depth |
| `manifests/`, `scripts/` | Optional: real local practice later (not required for learners) |

## Cost model

| Item | Cost |
|------|------|
| S3 + CloudFront | ~$1–5/mo |
| EKS / EC2 / Lambda | **$0** — not used |
| Learner installs | **$0** — browser only |

## Monetization

1. Publish useful content (modules + practice scenarios)
2. Grow traffic (SEO, share, build in public)
3. Google AdSense (after ~15 pages + privacy policy)
4. Optional: affiliate resources page, PDF cheat sheet

## Optional: real cluster later

When you're ready to deploy professionally, use `scripts/setup-kind.ps1` and `labs/` for real hands-on. The website teaches the **why** first; kind teaches the **real feel**.
