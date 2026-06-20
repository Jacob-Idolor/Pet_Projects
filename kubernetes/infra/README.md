# AWS infrastructure (static site only)

Low-cost hosting for the public learning site. This stack **cannot** create EKS, EC2, RDS, or Lambda — only S3 + CloudFront (+ optional Route 53).

**Expected cost:** ~$1–5/month at low traffic if you skip custom domain. See [costs](#expected-costs).

---

## Before you run anything

1. Create a **billing budget** in AWS Console → Billing → Budgets → **$5/month** with email alerts.
2. Use a **scoped IAM user** — attach [iam/deploy-policy.json](iam/deploy-policy.json). Not root. Not AdministratorAccess.
3. Configure AWS CLI: `aws configure --profile pet-projects`
4. Verify: `aws sts get-caller-identity --profile pet-projects`

---

## One-time setup

```powershell
cd kubernetes/infra/terraform

# Copy and edit — use unique bucket name globally
copy terraform.tfvars.example terraform.tfvars

terraform init
terraform plan    # READ THIS — confirm only S3 + CloudFront (+ budget)
terraform apply
```

Save outputs:

```powershell
terraform output cloudfront_url
terraform output s3_bucket_name
```

---

## Deploy site content

```powershell
cd kubernetes/infra
.\deploy-site.ps1 -Profile pet-projects
```

Builds the Astro site, syncs to S3, invalidates CloudFront cache.

---

## What this creates

| Resource | Purpose | Cost driver |
|----------|---------|-------------|
| S3 bucket | Static files | Storage + requests (pennies) |
| CloudFront | CDN + HTTPS | Data transfer ($1–5 typical) |
| Budget alarm | Email at 80%/100% of $5 | Free |
| Route 53 (optional) | Custom domain | +$0.50/mo + domain registration |

## What this does NOT create

- EKS / ECS / EC2
- RDS / DynamoDB
- Lambda / API Gateway
- NAT Gateway (the usual bill killer)

`terraform plan` should show **only** the resources above. If you see anything else, stop.

---

## Expected costs

| Setup | Monthly (approx) |
|-------|------------------|
| CloudFront URL only (default) | **$1–3** |
| + Custom domain (Route 53) | **+$1–2** |
| 50k pageviews | **$3–8** |
| WAF, Lambda, EKS | **Not in this stack** |

---

## Custom domain (optional, costs extra)

In `terraform.tfvars`:

```hcl
enable_custom_domain = true
domain_name            = "learn.yourdomain.com"
route53_zone_id        = "Z1234567890ABC"
```

Requires an ACM certificate in **us-east-1** for CloudFront. Terraform can create DNS validation records if `route53_zone_id` is set.

Leave `enable_custom_domain = false` until you're ready — the CloudFront URL works for testing at **$0 extra**.

---

## Tear down (stop all charges)

```powershell
cd kubernetes/infra/terraform
terraform destroy
```

Empty the S3 bucket first if destroy fails (versioned objects). `deploy-site.ps1` does not delete the bucket.

---

## CI/CD (optional)

GitHub Actions workflow [`.github/workflows/site-deploy.yml`](../../.github/workflows/site-deploy.yml) is **manual only** (`workflow_dispatch`) so you never deploy or incur transfer costs by accident.

Required secrets:

- `AWS_ACCESS_KEY_ID`
- `AWS_SECRET_ACCESS_KEY`
- `AWS_REGION` (e.g. `us-east-1`)
- `S3_BUCKET` (from terraform output)
- `CLOUDFRONT_DISTRIBUTION_ID` (from terraform output)

---

## Sharing this with others

- Fork the repo — they run their own Terraform with their own bucket name.
- Each person pays their own ~$1–5/mo AWS bill.
- Never share IAM access keys; each contributor uses their own profile.
- See [CONTRIBUTING.md](../CONTRIBUTING.md).
