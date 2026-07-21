# Stocks Radar — infrastructure cost notes

Static hosting only: **S3 + CloudFront** (+ optional budget / custom domain / digests / alerts).

## Destroyed trial stack (confirmed)

After `terraform destroy`, ongoing AWS cost for this project is **~$0**. No S3 site bucket, no CloudFront distribution, no budget alarms remain unless something outside this Terraform was created manually.

## What the Terraform code costs when re-applied

| Item | Typical monthly | Notes |
|------|-----------------|-------|
| S3 storage + requests | **<$0.10** | Small static site + `quotes.json` |
| CloudFront `PriceClass_100` | **~$0.50–2** | US/EU/Canada; free-tier friendly for light traffic |
| AWS managed security headers | **$0** | `enable_security_headers` (default on) |
| AWS Budgets | **~$0** | Free for the first few budgets |
| Custom domain + **Cloudflare Free DNS** | **domain ~$10–12/yr** | `dns_management = "external"` — no Route53; buy later |
| Route53 hosted zone | **+$0.50/mo** | Only if `dns_management = "route53"` |
| SNS daily digest + signal alerts | **~$0** | Optional; leave off until IAM allows CreateTopic |
| Lambda / API / WAF | **Not in stack** | Avoid for feedback trials |

**Expected trial total: about $0.50–3/month** while live; destroy anytime to stop.

## Fixes in this Terraform revision (no meaningful cost bump)

1. **Real `/404.html`** — CloudFront `custom_error_response` serves Astro `src/pages/404.astro`.
2. **403 → 404 mapping** — S3 OAC private buckets often return 403 for missing keys.
3. **`/quotes.json` + `/build-meta.json` CachingDisabled** — board polls see fresh CI quotes/meta.
4. **Security headers policy** — AWS managed SecurityHeadersPolicy on cache behaviors.
5. **Domain-ready ACM** — `include_www_alias` / `domain_aliases` so apex+www cert is one apply after purchase.
6. **Signal alerts SNS** — optional; can reuse digest topic (`alerts_use_digest_topic`).

## What would cost more (do not enable unless needed)

| Change | Extra cost | When you’d want it |
|--------|------------|--------------------|
| Lambda@Edge / CloudFront Function quote proxy | **$1–5+/mo** | True browser live Yahoo quotes (CORS) |
| API Gateway + Lambda quote API / shared suggestions backend | **$1–5+/mo** | Cross-device friend queue sync |
| WAF | **$5+/mo** | Not needed for a private friends site |
| Multi-region / `PriceClass_All` | Higher CF egress | Skip for trials |

**Recommendation:** keep static quotes refreshed by GitHub Actions (**refresh quotes** workflow). Friend suggestions stay device-local (IndexedDB) until you deliberately add a backend.

## Redeploy checklist

1. `cd stocks/radar/infra/terraform && terraform apply`
2. Build + sync dist to the bucket (repo deploy workflow / `deploy.sh`)
3. Confirm `https://<distribution>.cloudfront.net/` loads the board
4. Confirm `/quotes.json`, `/build-meta.json`, and `/404.html` return 200
5. When done: empty bucket if needed, then `terraform destroy`
