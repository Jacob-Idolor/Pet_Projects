# Stocks Radar — cost & scale (AWS principles)

Static hosting only: **S3 + CloudFront** (+ optional budget / custom domain / SNS). Designed for **low cost** and **automatic scale** — no servers to resize.

## Principles we follow

| AWS / Well-Architected idea | Implementation |
|----------------------------|----------------|
| Use managed edge for scale | CloudFront in front of private S3 (OAC) |
| Right-size price class | `PriceClass_100` only (US/EU/Canada) — enforced in Terraform |
| Maximize cache hit ratio | Tiered `Cache-Control` on sync; `/_astro/*` behavior; narrow invalidations |
| Avoid idle compute | No Lambda/EC2/ECS/RDS; quotes via GitHub Actions |
| Cost visibility | AWS Budget ($3 default) + tags (`Project`, `CostCenter`) |
| Account/region guardrails | `allowed_account_ids`, `allowed_regions` checks |
| Tear down when idle | `prevent_destroy = false`; destroy → ~$0 |

Passive-income math (AdSense vs hosting): **[../../PASSIVE_INCOME.md](../../PASSIVE_INCOME.md)**.

## Destroyed trial stack

After `terraform destroy`, ongoing AWS cost for this project is **~$0**.

## What it costs when live

| Item | Typical monthly | Scale note |
|------|-----------------|------------|
| S3 storage + requests | **<$0.10** → low $ at high traffic | Origin mostly on cache miss |
| CloudFront `PriceClass_100` | **~$0.50–2** friends; **~$2–10** growing | Scales with requests + egress |
| Security headers (managed) | **$0** | |
| AWS Budgets | **~$0** | |
| Custom domain + Cloudflare DNS | **~$10–12/yr** domain | No Route53 fee |
| SNS digests / personal alerts | **~$0** | |
| Lambda / API / WAF | **Not in stack** | Would break the cost model |

**Expected:** about **$0.50–3/mo** at friend scale; still single-digit–low tens at meaningful hobby traffic if cache stays healthy.

## Caching strategy (cost × scale lever)

| Path | Cache | Why |
|------|-------|-----|
| `/_astro/*` | Long (immutable object headers + CF behavior) | Hashed bundles — safe to cache hard |
| HTML / SEO files | ~60s + must-revalidate | Fresh chrome after deploy |
| `/quotes.json`, `/build-meta.json` | CachingDisabled | Live board + status bar |
| Invalidation paths | `/`, HTML, JSON, SEO — **not** `/*` | Keeps hashed assets warm |

Deploy uses [`../sync-s3-tiered.sh`](../sync-s3-tiered.sh).

## What would cost more (avoid until revenue justifies)

| Change | Extra cost | When |
|--------|------------|------|
| WAF | **$5+/mo** | Public abuse at real scale |
| Lambda@Edge quote proxy | **$1–5+/mo** | Only if GHA refresh is not enough |
| API Gateway + Lambda + DB | **$1–5+/mo idle** | Shared suggestions backend |
| `PriceClass_All` | Higher egress | Global audience proven |
| Route53 hosted zone | **+$0.50/mo** | Prefer Cloudflare Free DNS |

## Redeploy checklist

1. `terraform apply`
2. `npm run build` + `./infra/deploy.sh` (tiered sync)
3. Confirm `/`, `/quotes.json`, `/_astro/*` headers
4. Watch CloudFront **cache hit rate** after a few days of traffic
5. Idle? Empty bucket → `terraform destroy`
