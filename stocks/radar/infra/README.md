# Stocks Radar — AWS hosting

Static site: **S3** + **CloudFront** (~$0.50–3/mo at friend scale). Optional **SNS** for daily digests + signal alerts (no Lambda).

## Friend trial (recommended path)

See **[../FRIENDS_FEEDBACK.md](../FRIENDS_FEEDBACK.md)** — apply → deploy → share → daily digests → **destroy**.

Buy a domain later — stack works on `*.cloudfront.net` first. Domain wiring: **[../DOMAIN.md](../DOMAIN.md)**.

## One-time setup

```bash
cd stocks/radar/infra/terraform
cp terraform.tfvars.example terraform.tfvars
# edit: allowed_account_ids, site_bucket_name, budget_alert_email, digest_email
terraform init && terraform apply
```

Confirm the SNS subscription email if digests/alerts are enabled.

Note outputs:

- `preferred_site_url`
- `s3_bucket_name`
- `cloudfront_distribution_id`
- `cloudfront_domain_name` / `cloudfront_url`
- `daily_digest_topic_arn`
- `signal_alerts_topic_arn`
- `reenable_ci_hint`

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
| `STOCKS_RADAR_DIGEST_SNS_TOPIC_ARN` | `daily_digest_topic_arn` (optional) |
| `STOCKS_RADAR_ALERTS_SNS_TOPIC_ARN` | shared board-wide alerts (optional) |
| `STOCKS_RADAR_ALERT_TOPICS` | `personal_alert_topic_arns` JSON (personal rules — [ALERTS.md](../ALERTS.md)) |

Workflows (paused until secrets exist — see [../DEPLOY.md](../DEPLOY.md)):

| Workflow | Role |
|----------|------|
| **Stocks Radar — deploy** | Full site build + sync |
| **Stocks Radar — refresh quotes** | Quotes-only weekday refresh |
| **Stocks Radar — daily digest** | Viewers + mood + signals email |
| **Stocks Radar — signal alerts** | Lean-buy/sell email when tape is active |

Attach/update IAM from [`iam/deploy-policy.json`](iam/deploy-policy.json) so CloudWatch metrics, SNS, ACM, and response-headers reads work.

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
```

Or: empty the bucket, then `terraform destroy` in `terraform/`.
