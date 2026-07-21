# Deploy — Stocks Radar (AWS)

GitHub Pages is **not** used. Deploys go to **AWS S3 + CloudFront** on every push to `main` and on a weekday quote-refresh schedule.

## Status: deploy paused

GitHub Actions **deploy**, **quote refresh**, **daily digest**, and **signal alerts** are paused (`if: false`) until AWS secrets exist again. Local `npm run dev` / validate workflow still work.

To resume:

1. `terraform apply` + fill secrets from this doc
2. Re-attach IAM from [`infra/iam/deploy-policy.json`](infra/iam/deploy-policy.json) (now includes ACM + response headers)
3. Set `if: true` (or remove the gate) on:
   - `.github/workflows/stocks-radar-deploy.yml`
   - `.github/workflows/stocks-radar-refresh-quotes.yml`
   - `.github/workflows/stocks-radar-daily-digest.yml`
   - `.github/workflows/stocks-radar-signal-alerts.yml`
4. Uncomment `push` / `schedule` blocks where noted in those files

`terraform output reenable_ci_hint` prints the same reminder.

## One-time setup (~15 min)

### 1. Terraform (creates bucket + CloudFront)

```bash
cd stocks/radar/infra/terraform
cp terraform.tfvars.example terraform.tfvars
# Edit: allowed_account_ids, site_bucket_name, budget_alert_email

terraform init && terraform plan && terraform apply
```

Leave `enable_custom_domain = false` until you buy a name ([DOMAIN.md](DOMAIN.md)). Security headers and `/quotes.json` + `/build-meta.json` no-cache behaviors are on by default.

Save outputs:

```bash
terraform output preferred_site_url
terraform output cloudfront_distribution_id
terraform output s3_bucket_name
terraform output daily_digest_topic_arn
terraform output signal_alerts_topic_arn
```

### 2. GitHub repo secrets

**Settings → Secrets and variables → Actions → New repository secret**

| Secret | Value |
|--------|--------|
| `AWS_ACCESS_KEY_ID` | IAM user key |
| `AWS_SECRET_ACCESS_KEY` | IAM user secret |
| `AWS_REGION` | e.g. `us-west-2` |
| `STOCKS_RADAR_S3_BUCKET` | from terraform output |
| `STOCKS_RADAR_CLOUDFRONT_DISTRIBUTION_ID` | from terraform output |
| `STOCKS_RADAR_CLOUDFRONT_DOMAIN` | hostname only, e.g. `d111111abcdef8.cloudfront.net` |
| `STOCKS_RADAR_DIGEST_SNS_TOPIC_ARN` | optional — daily digest |
| `STOCKS_RADAR_ALERTS_SNS_TOPIC_ARN` | optional — lean-buy/sell alerts (defaults to digest ARN if unset) |

IAM policy: [`infra/iam/deploy-policy.json`](infra/iam/deploy-policy.json)

### 3. GitHub environment (optional but recommended)

**Settings → Environments → New environment → `stockwatch`**

Add the CloudFront URL as environment URL. Each deploy shows under **Actions → Stocks Radar — deploy** with a **View deployment** link.

### 4. First deploy

Push to `main` or run **Actions → Stocks Radar — deploy → Run workflow**.

## Live URL

After secrets + terraform: **`https://<your-cloudfront-domain>/`** (or custom domain later).

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

## Quote refresh (weekday)

Workflow **Stocks Radar — refresh quotes** syncs only `quotes.json` (no full rebuild). After re-enable, suggested schedule is mid-session + near close (see workflow comments).

Local: `npm run update-quotes`

## Daily digest email (viewers + mood + signals)

Terraform creates an SNS topic (`enable_daily_digest = true`). GitHub Actions emails you once/day with CloudFront request counts, watchlist mood, and lean-buy/sell summary — **no Lambda**.

1. `terraform apply` with `digest_email` / `budget_alert_email`
2. Confirm the AWS SNS subscription email
3. Add secret `STOCKS_RADAR_DIGEST_SNS_TOPIC_ARN` = `terraform output -raw daily_digest_topic_arn`
4. Run **Actions → Stocks Radar — daily digest** (or wait for the schedule)

## Signal alerts (lean buy / sell / near target)

Same SNS pattern as digests (`enable_signal_alerts`). By default `alerts_use_digest_topic = true` so you confirm one email subscription.

```bash
cd stocks/radar
ALERTS_DRY_RUN=true npm run alerts
```

Workflow **Stocks Radar — signal alerts** can run after quote refresh (`ALERTS_ONLY_ON_SIGNAL=true` skips quiet days).

## AdSense variables (optional)

For publisher ads after domain approval, add **Actions variables** (not secrets) — see [ADSENSE.md](ADSENSE.md):

`PUBLIC_ADSENSE_CLIENT`, `PUBLIC_ADSENSE_ENABLED`, `PUBLIC_ADSENSE_SLOT_HERO`, `PUBLIC_ADSENSE_SLOT_BOARD`, `PUBLIC_ADSENSE_SLOT_FOOTER`

## Troubleshooting

| Issue | Fix |
|-------|-----|
| Workflow fails "Missing secret" | Add all required secrets above |
| Old content on phone | CloudFront cache — deploy invalidates `/*`; quote refresh invalidates `/quotes.json` |
| Status bar says stale/partial | Yahoo miss or old file — run refresh workflow; UI keeps last-good symbols when possible |
| AdSense empty / policy | Confirm `/ads.txt` on CloudFront matches publisher ID; site must be approved |
| Local ads look empty | Expected — use preview boxes in `npm run dev` |
| Site 404 | Run `terraform apply`, verify S3 bucket has `index.html` at root |
| Custom domain ACM stuck | Add **all** `acm_dns_validation_records` in Cloudflare (grey cloud), including www |
