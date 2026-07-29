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
# Edit: allowed_account_ids, site_bucket_name, budget_alert_email
# Domain: enable_custom_domain + domain_name = "stockswatch.cc" (Cloudflare DNS)
# Optional: alert_subscribers = [{ id = "jacob", email = "you@example.com" }]
# Budgets: $3 early warning + $15 high-spend tripwire — see infra/terraform/COST.md

terraform init && terraform plan && terraform apply
```

After apply: **Billing → Cost allocation tags → activate `Project`** (needed for the budget filter; up to 24h).

Leave `enable_custom_domain = false` until you buy a name ([DOMAIN.md](DOMAIN.md)).

### 3. IAM + secrets bootstrap

**Preferred: GitHub OIDC (no long-lived access keys)**

```bash
cd stocks/radar/infra/terraform
# In terraform.tfvars:
#   enable_github_oidc = true
#   github_repository  = "Jacob-Idolor/Pet_Projects"
terraform apply   # needs an admin/IAM-capable profile — not the narrowed deploy-policy user

gh secret set AWS_ROLE_ARN --body "$(terraform output -raw github_actions_role_arn)"
gh secret set AWS_REGION --body "us-west-2"
gh variable set STOCKS_RADAR_USE_OIDC --body "true"
```

Workflows use [`.github/actions/stocks-radar-aws`](../../.github/actions/stocks-radar-aws) and assume the role when `STOCKS_RADAR_USE_OIDC=true`.

**Fallback: IAM user access keys**

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
| `AWS_ROLE_ARN` + **var** `STOCKS_RADAR_USE_OIDC=true` | OIDC (preferred) |
| `AWS_ACCESS_KEY_ID` / `AWS_SECRET_ACCESS_KEY` / `AWS_REGION` | IAM user (legacy) |
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
