# Deploy — Stocks Radar (AWS)

GitHub Pages is **not** used. Deploys go to **AWS S3 + CloudFront** on every push to `main` and on a weekday schedule (quote refresh).

## One-time setup (~15 min)

### 1. Terraform (creates bucket + CloudFront)

```bash
cd stocks/radar/infra/terraform
cp terraform.tfvars.example terraform.tfvars
# Edit: allowed_account_ids, site_bucket_name, budget_alert_email

terraform init && terraform plan && terraform apply
```

Save outputs:

```bash
terraform output cloudfront_url
terraform output cloudfront_distribution_id
terraform output s3_bucket_name
```

### 2. GitHub repo secrets

**Settings → Secrets and variables → Actions → New repository secret**

| Secret | Value |
|--------|--------|
| `AWS_ACCESS_KEY_ID` | IAM user key |
| `AWS_SECRET_ACCESS_KEY` | IAM user secret |
| `AWS_REGION` | e.g. `us-west-2` |
| `STOCKS_RADAR_S3_BUCKET` | from `terraform output s3_bucket_name` |
| `STOCKS_RADAR_CLOUDFRONT_DISTRIBUTION_ID` | from terraform output |
| `STOCKS_RADAR_CLOUDFRONT_DOMAIN` | hostname only, e.g. `d111111abcdef8.cloudfront.net` |

IAM policy: [`infra/iam/deploy-policy.json`](infra/iam/deploy-policy.json)

### 3. GitHub environment (optional but recommended)

**Settings → Environments → New environment → `production`**

Add the CloudFront URL as environment URL. Each deploy shows under **Actions → Stocks Radar — deploy** with a **View deployment** link.

### 4. First deploy

Push to `main` or run **Actions → Stocks Radar — deploy → Run workflow**.

## Live URL

After secrets + terraform: **`https://<your-cloudfront-domain>/`**

Root path (`/`) — no `/Pet_Projects/stocks-radar/` subpath.

## Local dev (unchanged)

```bash
cd stocks/radar
npm install
npm run dev
```

## Manual deploy from laptop

```bash
cd stocks/radar/infra
./deploy.sh
```

## Cost

Typically **~$0.50–3/mo** at low traffic. Budget alert in Terraform tfvars.

## Troubleshooting

| Issue | Fix |
|-------|-----|
| Workflow fails "Missing secret" | Add all 6 secrets above |
| Old content on phone | CloudFront cache — workflow invalidates `/*` each deploy |
| Site 404 | Run `terraform apply`, verify S3 bucket has `index.html` at root |
