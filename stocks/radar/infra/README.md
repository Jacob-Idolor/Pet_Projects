# Stocks Radar — AWS hosting

Static site: **S3** + **CloudFront** (~$0.50–3/mo at friend scale). Optional **SNS** for daily email digests (no Lambda).

## Friend trial (recommended path)

See **[../FRIENDS_FEEDBACK.md](../FRIENDS_FEEDBACK.md)** — apply → deploy → share → daily digests → **destroy**.

## One-time setup

```bash
cd stocks/radar/infra/terraform
cp terraform.tfvars.example terraform.tfvars
# edit: allowed_account_ids, site_bucket_name, budget_alert_email, digest_email
terraform init && terraform apply
```

Confirm the SNS subscription email if digests are enabled.

Note outputs:

- `s3_bucket_name`
- `cloudfront_distribution_id`
- `cloudfront_domain_name` / `cloudfront_url`
- `daily_digest_topic_arn`

## GitHub Actions (recommended)

Add repository **Secrets** (Settings → Secrets → Actions):

| Secret | From |
|--------|------|
| `AWS_ACCESS_KEY_ID` | IAM user |
| `AWS_SECRET_ACCESS_KEY` | IAM user |
| `AWS_REGION` | e.g. `us-west-2` |
| `STOCKS_RADAR_S3_BUCKET` | terraform output |
| `STOCKS_RADAR_CLOUDFRONT_DISTRIBUTION_ID` | terraform output |
| `STOCKS_RADAR_CLOUDFRONT_DOMAIN` | hostname only |
| `STOCKS_RADAR_DIGEST_SNS_TOPIC_ARN` | `daily_digest_topic_arn` (optional, for email) |

Push to `main` (under `stocks/radar/**`) runs **Stocks Radar — deploy**.

See [../DEPLOY.md](../DEPLOY.md) for IAM policy and troubleshooting. Attach/update IAM from [`iam/deploy-policy.json`](iam/deploy-policy.json) so CloudWatch metrics + SNS publish work for digests.

## Manual deploy

```bash
cd stocks/radar
npm ci && npm run build
./infra/deploy.sh
```

## Teardown (stop the meter)

```bash
cd stocks/radar/infra
./destroy.sh
# Windows PowerShell:
# .\destroy.ps1
```

Or: empty the bucket, then `terraform destroy` in `terraform/`.
