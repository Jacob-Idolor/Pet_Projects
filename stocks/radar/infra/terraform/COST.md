# Stocks Radar — cost & scale (AWS principles)

Static hosting only: **S3 + CloudFront** (+ optional budget / custom domain / SNS). Designed for **low cost** and **automatic scale** — no servers to resize.

## Monthly cost (what you should expect)

| Scenario | AWS / mo | All-in with domain | What it looks like |
|----------|----------|--------------------|--------------------|
| **Friends trial** (this default) | **~$0.50–3** | **~$1.50–4** | Dozens–low thousands of page views; weekday quote refresh |
| Growing hobby / light SEO | **~$2–10** | **~$3–11** | Tens of thousands of views; cache stays healthy |
| After `terraform destroy` | **~$0** | domain only if you keep it | Tear down anytime |

### Line items in *this* Terraform stack

| Resource | Typical | Notes |
|----------|---------|--------|
| S3 storage + requests | **<$0.10** | Tiny static objects; origin hits only on cache miss |
| CloudFront `PriceClass_100` | **~$0.50–2** friends | US/EU/Canada edges only (enforced) |
| SNS digests / personal alerts | **~$0** | Email notifications; free tier covers hobby volume |
| ACM cert (custom domain) | **$0** | Public certs free |
| AWS Budgets | **$0** | First budgets free |
| Route53 hosted zone | **$0** if `dns_management = external` | Prefer Cloudflare Free DNS |
| WAF / Lambda / EC2 / RDS | **Not created** | Would break the cost model |

Passive-income math (AdSense vs hosting): **[../../PASSIVE_INCOME.md](../../PASSIVE_INCOME.md)**.

## Budget alerts — do they make sense?

**Yes — with the defaults, if you activate the `Project` cost-allocation tag.**

| Setting | Default | Why |
|---------|---------|-----|
| `monthly_budget_usd` | **$3** | Above typical friend spend (~$0.50–2), below “something is wrong” |
| `max_monthly_budget_usd` | **$15** | Typo cap (blocks `5000`); raise limit only when traffic grows |
| Scope | **`Project = stocks-radar`** | Tracks *this* stack, not the whole AWS account |
| Alerts | 50% actual, 80% forecast + actual, 100% actual | Early warning → act before month-end |

At **$3**:

| Threshold | ≈ USD | Meaning |
|-----------|-------|---------|
| 50% actual | $1.50 | Normal-to-busy friends traffic, or first deploy month with invalidations |
| 80% forecast | $2.40 | AWS thinks you’ll finish the month over ~$2.40 |
| 80% actual | $2.40 | Already burning hot for this stack |
| 100% actual | $3.00 | Over the intentional ceiling — investigate CloudFront egress / wrong price class / other tagged resources |

### One-time Billing setup (required for tag filter)

1. AWS Console → **Billing → Cost allocation tags**
2. Activate user-defined tag **`Project`** (resources already get `Project = stocks-radar` from Terraform `default_tags`)
3. Wait up to **24h** for the filter to populate
4. Confirm the AWS Budgets subscription email

Until the tag is active, a tag-filtered budget may show **$0** spend — the limit is still fine; just don’t assume silence means “no cost” on day one. Check **Cost Explorer** filtered by tag `Project: stocks-radar`.

If this AWS account is **only** Stocks Radar, you may set `budget_scope_to_project_tag = false` for an account-wide $3 tripwire. If the account has *anything* else, keep the Project filter (default).

### When to raise the budget

| Situation | Suggested `monthly_budget_usd` |
|-----------|--------------------------------|
| Friends / go-live | **3** (default) |
| Stable hobby traffic, occasional spikes | **5** |
| Meaningful SEO / AdSense traffic | **8–10** |
| Considering WAF or `PriceClass_All` | Revisit architecture first — those change the model |

## Principles we follow

| AWS / Well-Architected idea | Implementation |
|----------------------------|----------------|
| Use managed edge for scale | CloudFront in front of private S3 (OAC) |
| Right-size price class | `PriceClass_100` only — enforced in Terraform |
| Maximize cache hit ratio | Tiered `Cache-Control`; `/_astro/*` behavior; narrow invalidations |
| Avoid idle compute | No Lambda/EC2/ECS/RDS; quotes via GitHub Actions |
| Cost visibility | Project-scoped AWS Budget + tags (`Project`, `CostCenter`) |
| Account/region guardrails | `allowed_account_ids`, `allowed_regions` checks |
| Tear down when idle | `prevent_destroy = false`; destroy → ~$0 |

## Caching strategy (cost × scale lever)

| Path | Cache | Why |
|------|-------|-----|
| `/_astro/*` | Long (immutable + CF behavior) | Hashed bundles |
| HTML / SEO files | ~60s + must-revalidate | Fresh chrome after deploy |
| `/quotes.json`, `/health.json`, `/settings.json` | CachingDisabled | Live board + ops |
| Invalidation paths | HTML + live JSON — **not** `/*` | Keeps hashed assets warm |

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
2. Activate Cost allocation tag `Project` (once)
3. `npm run build` + `./infra/deploy.sh` (tiered sync)
4. Confirm budget email + `/health.json`
5. Watch CloudFront **cache hit rate** after a few days
6. Idle? Empty bucket → `terraform destroy`
