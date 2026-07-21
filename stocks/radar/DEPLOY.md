# Deploy — Stocks Radar (AWS)

GitHub Pages is **not** used. Deploys go to **AWS S3 + CloudFront** on every push to `main` and on a weekday quote-refresh schedule.

## Status: gated by `STOCKS_RADAR_DEPLOY_ENABLED`

Workflows are in the repo with schedules, but jobs only run when the repository variable **`STOCKS_RADAR_DEPLOY_ENABLED=true`**. Local `npm run dev` / validate still work without it.

**Fast path:** follow **[GO_LIVE.md](GO_LIVE.md)** (`infra/go-live.sh` + preflight).

To resume manually:

1. `terraform apply` + fill secrets from this doc (or `bash infra/go-live.sh`)
2. IAM from [`infra/iam/deploy-policy.json`](infra/iam/deploy-policy.json)
3. Set Actions variable `STOCKS_RADAR_SITE` and `STOCKS_RADAR_DEPLOY_ENABLED=true`
4. Run **Stocks Radar — deploy**

`terraform output reenable_ci_hint` points at the same steps.

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
| `STOCKS_RADAR_ALERTS_SNS_TOPIC_ARN` | optional — board-wide lean-buy/sell alerts |
| `STOCKS_RADAR_ALERT_TOPICS` | optional — JSON map of personal alert topics (`terraform output -json personal_alert_topic_arns`) |

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

### Personal alerts (per friend)

Email **only that person** when a rule they configured fires (ticker, tag, price, RSI, lean-buy, …).

Full guide: **[ALERTS.md](ALERTS.md)**

1. `alert_subscribers = [{ id = "jacob", email = "..." }]` in `terraform.tfvars`
2. `terraform apply` → confirm SNS emails
3. GitHub secret `STOCKS_RADAR_ALERT_TOPICS` = `terraform output -json personal_alert_topic_arns`
4. Edit `src/data/alert-rules.json` (`subscriberId` must match)
5. Ensure `STOCKS_RADAR_DEPLOY_ENABLED=true` so **Stocks Radar — signal alerts** runs

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
