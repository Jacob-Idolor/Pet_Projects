# Public deployment — cheapest options

This static Astro site has **no backend** — hosting is cheap if you avoid compute (EC2, EKS, Lambda).

## Cost comparison

| Option | Monthly cost | Custom domain | Best for |
|--------|-------------|---------------|----------|
| **GitHub Pages** | **$0** | Yes (via repo settings) | Public repos, lowest bill |
| **AWS S3 + CloudFront** | **~$1–3** typical | Optional (+Route53 ~$0.50) | AWS ecosystem, budget alerts |
| Vercel/Netlify free tier | $0 | Yes | Alternative if you prefer their UI |

**Target: under $5/month** — both GitHub Pages and the included AWS stack meet this. Default AWS config uses `PriceClass_100` (US/EU edges only) and skips WAF, Lambda@Edge, and custom domain unless you opt in.

---

## Option A — GitHub Pages ($0) **recommended to start**

1. Push this repo to GitHub (public repo = free Pages).
2. **Settings → Pages → Build and deployment → Source: GitHub Actions**
3. Run workflow: **Actions → Site deploy GitHub Pages (manual, $0) → Run workflow**
4. Site live at `https://<user>.github.io/<repo>/` (or custom domain in Pages settings)

Tests run automatically before deploy in that workflow.

---

## Option B — AWS S3 + CloudFront (~$1–5/mo)

### One-time setup

```bash
cd kubernetes/infra/terraform
cp terraform.tfvars.example terraform.tfvars
# Edit: allowed_account_ids, site_bucket_name, budget_alert_email

terraform init
terraform plan    # MUST show only S3 + CloudFront (+ budget)
terraform apply
```

Use the scoped IAM policy: `kubernetes/infra/iam/deploy-policy.json` — **not** root or AdministratorAccess.

Also create a **$5 billing budget** in AWS Console → Billing → Budgets (Terraform can email alerts too).

### Deploy (runs tests first)

```bash
cd kubernetes
make aws-deploy
# or: AWS_PROFILE=pet-projects bash infra/deploy-site.sh
```

### GitHub Actions (manual deploy)

**Actions → Site deploy AWS (manual) → Run workflow**

Required secrets:

| Secret | Value |
|--------|--------|
| `AWS_ACCESS_KEY_ID` | IAM user key |
| `AWS_SECRET_ACCESS_KEY` | IAM user secret |
| `AWS_REGION` | e.g. `us-west-2` |
| `S3_BUCKET` | From `terraform output s3_bucket_name` |
| `CLOUDFRONT_DISTRIBUTION_ID` | From `terraform output cloudfront_distribution_id` |

### Cost savers built in

- **No compute** — static files only
- **PriceClass_100** — cheapest CloudFront tier (enforced in Terraform)
- **Skip invalidation** when `s3 sync` uploads nothing (saves invalidation + edge churn)
- **Budget alerts** at 50%, 80%, 100% of $5
- **Account ID lock** — Terraform refuses wrong AWS account
- **S3 public access blocked** — CloudFront OAC only

### Typical bill breakdown (low traffic)

| Item | ~Cost |
|------|-------|
| S3 storage + requests | < $0.50 |
| CloudFront transfer | $1–3 |
| Invalidations | Free tier (1000 paths/mo) |
| Route 53 (if custom domain) | +$0.50 |

---

## Tear down AWS (stop all charges)

1. Edit `kubernetes/infra/terraform/main.tf` — set `prevent_destroy = false` on S3 and CloudFront
2. `terraform apply` then `terraform destroy`

See `kubernetes/infra/TEARDOWN.md` for edge cases.

---

## Security checklist before going public

- [ ] Run `make ci` locally — all green
- [ ] IAM user uses `deploy-policy.json` only
- [ ] `allowed_account_ids` set in `terraform.tfvars`
- [ ] No secrets in repo (AdSense client ID is OK in public config)
- [ ] `$5` AWS budget + email alerts enabled
- [ ] Deploy workflows are **manual** (default) — no surprise deploys

See also: [TESTING.md](TESTING.md)
