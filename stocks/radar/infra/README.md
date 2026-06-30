# AWS deploy — Stocks Radar

**Cheapest public hosting under ~$5/mo:** static files on **S3 + CloudFront** (no servers, no database).

This folder is **only** infrastructure and deploy scripts. App code stays in `../` (`stocks/radar/src`, etc.) — local dev is unchanged.

---

## Recommendation (pick one)

| Option | Cost | Best for |
|--------|------|----------|
| **A. GitHub Pages** (already in repo) | **$0/mo** | Cheapest. URL: `https://<user>.github.io/Pet_Projects/stocks-radar/` |
| **B. AWS S3 + CloudFront** (this folder) | **~$0.50–3/mo** typical | Custom CloudFront URL, same pattern as K8s lab, Terraform-managed |

Both can coexist. For a friends “guiding light” page with almost no traffic, **GitHub Pages is free and enough**. Use AWS if you want a dedicated bucket, your own deploy workflow, or might add a custom domain later.

**What we do *not* use** (keeps cost down): EC2, EKS, Lambda always-on, RDS, WAF, custom domain (unless you opt in).

---

## Expected AWS cost (low traffic)

| Service | Typical |
|---------|---------|
| S3 storage + requests | pennies |
| CloudFront (PriceClass_100, US/EU) | ~$0.50–2/mo |
| Route 53 + domain | **skip** for cheapest path |
| **Budget alert** | set to **$5** in tfvars |

Same safeguards as `kubernetes/infra`: static-site only, bucket prefix lock, account ID check.

---

## One-time AWS setup

1. **Billing budget** in AWS Console → $5/mo email alert (belt + suspenders).
2. **IAM user** with scoped policy → [iam/deploy-policy.json](iam/deploy-policy.json) (same `pet-projects-*` prefix as K8s lab — one IAM user can deploy both sites to different buckets).
3. **CLI profile:** `aws configure --profile pet-projects`
4. **Verify:** `aws sts get-caller-identity --profile pet-projects`

### Terraform

```bash
cd stocks/radar/infra/terraform
cp terraform.tfvars.example terraform.tfvars
# Edit: allowed_account_ids, site_bucket_name, budget_alert_email

terraform init
terraform plan    # should show ONLY S3 + CloudFront (+ optional budget)
terraform apply
```

Save outputs:

```bash
terraform output cloudfront_url
terraform output s3_bucket_name
```

---

## Deploy / update the live site

From repo root or this folder:

```bash
cd stocks/radar/infra
chmod +x deploy.sh
./deploy.sh
```

This builds with `STOCKS_RADAR_BASE=/` (site at CloudFront root), syncs `dist/` to S3, invalidates CloudFront.

**Manual GitHub Action:** `.github/workflows/stocks-radar-deploy-aws.yml` (workflow_dispatch, uses repo secrets).

---

## Local dev (unchanged)

```bash
cd stocks/radar
npm install
npm run dev
```

Open http://localhost:4321 — no AWS needed for development.

---

## Teardown

1. Empty bucket: `aws s3 rm s3://YOUR-BUCKET --recursive --profile pet-projects`
2. In `terraform/main.tf`, set `prevent_destroy = false` on S3 + CloudFront (see k8s infra docs)
3. `terraform destroy`

---

## Folder layout

```
stocks/radar/
  src/              ← app (untouched by infra)
  infra/
    terraform/      ← S3 + CloudFront only
    iam/            ← scoped deploy policy
    deploy.sh       ← build + sync + invalidate
    README.md       ← this file
```
