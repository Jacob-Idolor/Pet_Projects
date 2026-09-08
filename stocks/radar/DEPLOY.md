# Deploy

Production hosting is designed around Cloudflare Pages direct uploads. The previous AWS S3 + CloudFront stack was destroyed.

- **Domain:** [`stockswatch.cc`](https://stockswatch.cc) is registered on Cloudflare Free DNS. Terraform attaches the apex to the Pages project.
- **Local:** `cd stocks/radar && npm run dev`
- **CI:** `.github/workflows/stocks-radar-nbis-daily.yml` fetches NBIS, validates the snapshot, builds, and deploys `dist/` with Wrangler.

## First deployment

1. From `radar/infra/terraform`, export `CLOUDFLARE_API_TOKEN` and fill `terraform.tfvars` from `terraform.tfvars.example`.
2. Run `terraform init`, `terraform validate`, `terraform plan`, and `terraform apply`.
3. Add GitHub secrets `CLOUDFLARE_API_TOKEN`, `CLOUDFLARE_ACCOUNT_ID`, and `SEC_CONTACT_EMAIL`.
4. Run the `StocksWatch — NBIS daily refresh and deploy` workflow manually once, then let the daily schedule take over.

The workflow has no always-on compute or database. If the NBIS fetch fails in production, the strict job stops before deployment instead of publishing stale data as fresh.
