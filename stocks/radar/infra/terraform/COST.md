# Stocks Radar — infrastructure cost notes

Static hosting only: **S3 + CloudFront** (+ optional budget / custom domain / digests).

## Destroyed trial stack (confirmed)

After `terraform destroy`, ongoing AWS cost for this project is **~$0**. No S3 site bucket, no CloudFront distribution, no budget alarms remain unless something outside this Terraform was created manually.

## What the Terraform code costs when re-applied

| Item | Typical monthly | Notes |
|------|-----------------|-------|
| S3 storage + requests | **<$0.10** | Small static site + `quotes.json` |
| CloudFront `PriceClass_100` | **~$0.50–2** | US/EU/Canada; free-tier friendly for light traffic |
| AWS Budgets | **~$0** | Free for the first few budgets |
| Custom domain + **Cloudflare Free DNS** | **domain ~$10–12/yr** | `dns_management = "external"` — no Route53 |
| Route53 hosted zone | **+$0.50/mo** | Only if `dns_management = "route53"` |
| SNS daily digest (optional) | **~$0** | Needs IAM `sns:*` on the deploy user; leave off until allowed |
| Lambda / API / WAF | **Not in stack** | Avoid for feedback trials |

**Expected trial total: about $0.50–3/month** while live; destroy anytime to stop.

## Fixes in this Terraform revision (no meaningful cost bump)

1. **Real `/404.html`** — CloudFront `custom_error_response` now has a page to serve (Astro `src/pages/404.astro`). Was pointing at a missing object before.
2. **403 → 404 mapping** — S3 OAC private buckets often return 403 for missing keys; map that to the 404 page.
3. **`/quotes.json` CachingDisabled** — short-circuits CloudFront long cache so the board’s 60s poll can see fresh CI-deployed quotes. Extra origin GETs are tiny for friend traffic (**well under $0.10/mo**).

## What would cost more (do not enable unless needed)

| Change | Extra cost | When you’d want it |
|--------|------------|--------------------|
| Lambda@Edge / CloudFront Function quote proxy | **$1–5+/mo** | True browser live Yahoo quotes (CORS) |
| API Gateway + Lambda quote API | **$1–5+/mo** | Same, more control |
| WAF | **$5+/mo** | Not needed for a private friends site |
| Multi-region / `PriceClass_All` | Higher CF egress | Skip for trials |

**Recommendation:** keep static quotes refreshed by GitHub Actions deploy (or a scheduled `update-quotes` + sync). That keeps infra bill near zero and still makes prices “move” when the file updates — without a quote proxy.

## Redeploy checklist

1. `cd stocks/radar/infra/terraform && terraform apply`
2. Build + sync dist to the bucket (repo deploy workflow / `deploy.sh`)
3. Confirm `https://<distribution>.cloudfront.net/` loads the board (script is ESM `type=module`)
4. Confirm `/quotes.json` and `/404.html` return 200
5. When done: empty bucket if needed, then `terraform destroy`
