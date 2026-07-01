# Stocks Radar — AWS hosting

Static site: **S3** + **CloudFront** (~$1–5/mo at watchlist scale).

## One-time setup

```bash
cd stocks/radar/infra
cp terraform.tfvars.example terraform.tfvars
# edit project_name if you want
terraform init && terraform apply
```

Note outputs:

- `s3_bucket_name`
- `cloudfront_distribution_id`
- `cloudfront_domain_name`

## GitHub Actions (recommended)

Add repository **Secrets** (Settings → Secrets → Actions):

| Secret | From |
|--------|------|
| `AWS_ACCESS_KEY_ID` | IAM user |
| `AWS_SECRET_ACCESS_KEY` | IAM user |
| `AWS_REGION` | e.g. `us-east-1` |
| `STOCKS_RADAR_S3_BUCKET` | terraform output |
| `STOCKS_RADAR_CLOUDFRONT_DISTRIBUTION_ID` | terraform output |
| `STOCKS_RADAR_CLOUDFRONT_DOMAIN` | terraform output |

Push to `main` (under `stocks/radar/**`) runs **Stocks Radar Deploy** — visible under **Actions** with a **production** environment and live URL in the job summary.

See [../DEPLOY.md](../DEPLOY.md) for IAM policy and troubleshooting.

## Manual deploy

```bash
cd stocks/radar
npm ci && npm run build
./infra/deploy.sh
```

## Teardown

```bash
terraform destroy
```
