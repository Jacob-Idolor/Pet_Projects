# Go live — Stocks Radar

Single checklist to take the static board from this repo to a live CloudFront URL with scheduled quotes, digest, and personal alerts.

Workflows are **code-ready** but stay idle until you set repository variable `STOCKS_RADAR_DEPLOY_ENABLED=true`.

## Order of operations

```text
1. Merge PR → main
2. terraform apply
3. IAM user + GitHub secrets (go-live.sh)
4. Confirm SNS emails
5. npm run go-live:preflight [-- --strict] [-- --aws]
6. STOCKS_RADAR_DEPLOY_ENABLED=true
7. Run deploy workflow → curl /health.json
```

### 1. Merge

Merge the Stocks Radar reliability PR to `main` so workflows and scripts are on the default branch.

### 2. Terraform

```bash
cd stocks/radar/infra/terraform
cp terraform.tfvars.example terraform.tfvars
# Edit: allowed_account_ids, site_bucket_name, budget_alert_email, digest_email
# Optional: alert_subscribers = [{ id = "jacob", email = "you@example.com" }]

terraform init && terraform plan && terraform apply
```

Leave `enable_custom_domain = false` until you buy a name ([DOMAIN.md](DOMAIN.md)).

### 3. IAM + secrets bootstrap

Create the deploy IAM user with [`infra/iam/deploy-policy.json`](infra/iam/deploy-policy.json), then:

```bash
cd stocks/radar
bash infra/go-live.sh
# Review printed `gh secret set` / `gh variable set` commands

# Or push Terraform-backed secrets automatically (IAM keys from env):
export AWS_ACCESS_KEY_ID=...
export AWS_SECRET_ACCESS_KEY=...
export AWS_REGION=us-west-2
bash infra/go-live.sh --apply
```

| Secret / var | Source |
|--------------|--------|
| `AWS_ACCESS_KEY_ID` / `AWS_SECRET_ACCESS_KEY` / `AWS_REGION` | IAM user |
| `STOCKS_RADAR_S3_BUCKET` | `s3_bucket_name` |
| `STOCKS_RADAR_CLOUDFRONT_DISTRIBUTION_ID` | `cloudfront_distribution_id` |
| `STOCKS_RADAR_CLOUDFRONT_DOMAIN` | `cloudfront_domain_name` (hostname only) |
| `STOCKS_RADAR_DIGEST_SNS_TOPIC_ARN` | `daily_digest_topic_arn` |
| `STOCKS_RADAR_ALERTS_SNS_TOPIC_ARN` | `signal_alerts_topic_arn` |
| `STOCKS_RADAR_ALERT_TOPICS` | JSON of `personal_alert_topic_arns` |
| **Variable** `STOCKS_RADAR_SITE` | `preferred_site_url` |
| **Variable** `STOCKS_RADAR_DEPLOY_ENABLED` | start as `false` |

Optional: GitHub Environment `stockwatch` (deploy workflow already references it).

### 4. Confirm SNS

Open the AWS confirmation emails for digest / personal alert topics before expecting mail.

### 5. Preflight

```bash
cd stocks/radar
npm ci
STOCKS_RADAR_SITE=https://YOUR.cloudfront.net npm run go-live:preflight -- --strict
# With AWS creds + terraform state:
npm run go-live:preflight -- --aws
```

### 6. Enable automation

```bash
gh variable set STOCKS_RADAR_DEPLOY_ENABLED --body "true"
# or: bash infra/go-live.sh --apply --enable
```

This unblocks:

- **Stocks Radar — deploy** (push to `main` + weekday schedule)
- **Stocks Radar — refresh quotes**
- **Stocks Radar — daily digest**
- **Stocks Radar — signal alerts**

### 7. First deploy + verify

```bash
gh workflow run "Stocks Radar — deploy"
# after success:
curl -sS "$STOCKS_RADAR_SITE/health.json" | jq .
curl -sS "$STOCKS_RADAR_SITE/settings.json" | jq .features
curl -sS "$STOCKS_RADAR_SITE/quotes.json" | jq '{count,total,partial,fetchedAt}'
```

## Later (not required for first CloudFront URL)

| Step | Doc |
|------|-----|
| Custom domain + ACM | [DOMAIN.md](DOMAIN.md) |
| AdSense approval + slots | [ADSENSE.md](ADSENSE.md) |
| Personal alert rules | [ALERTS.md](ALERTS.md) |
| Optional OTLP traces | [OBSERVABILITY.md](OBSERVABILITY.md) |
| Cost / AdSense economics | [PASSIVE_INCOME.md](PASSIVE_INCOME.md) |

## Pause without deleting infra

```bash
gh variable set STOCKS_RADAR_DEPLOY_ENABLED --body "false"
```

Schedules and pushes stop deploying; S3/CloudFront stay up until `terraform destroy`.

## Full production checklist

See [PRODUCTION.md](PRODUCTION.md). Deploy details: [DEPLOY.md](DEPLOY.md).
