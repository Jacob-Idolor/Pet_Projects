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

Typically **~$0.50–3/mo** at friend-scale traffic (`PriceClass_100`). Budget alert default **$3**.

**Cheap custom domain:** [DOMAIN.md](DOMAIN.md) (Cloudflare/Porkbun + Cloudflare Free DNS — no Route53).

**Friend trial loop (apply → share → daily email → destroy):** [`FRIENDS_FEEDBACK.md`](FRIENDS_FEEDBACK.md)

## Daily digest email (viewers + mood)

Terraform creates an SNS topic (`enable_daily_digest = true`). GitHub Actions emails you once/day with CloudFront request counts and watchlist mood — **no Lambda**.

1. `terraform apply` with `digest_email` / `budget_alert_email`
2. Confirm the AWS SNS subscription email
3. Add secret `STOCKS_RADAR_DIGEST_SNS_TOPIC_ARN` = `terraform output -raw daily_digest_topic_arn`
4. Run **Actions → Stocks Radar — daily digest** (or wait for the schedule)

## AdSense variables (optional)

For publisher ads after domain approval, add **Actions variables** (not secrets) — see [ADSENSE.md](ADSENSE.md):

`PUBLIC_ADSENSE_CLIENT`, `PUBLIC_ADSENSE_ENABLED`, `PUBLIC_ADSENSE_SLOT_HERO`, `PUBLIC_ADSENSE_SLOT_BOARD`, `PUBLIC_ADSENSE_SLOT_FOOTER`

## Troubleshooting

| Issue | Fix |
|-------|-----|
| Workflow fails "Missing secret" | Add all 6 secrets above |
| Old content on phone | CloudFront cache — workflow invalidates `/*` each deploy |
| AdSense empty / policy | Confirm `/ads.txt` on CloudFront matches publisher ID; site must be approved |
| Local ads look empty | Expected — use preview boxes in `npm run dev` |
| Site 404 | Run `terraform apply`, verify S3 bucket has `index.html` at root |
