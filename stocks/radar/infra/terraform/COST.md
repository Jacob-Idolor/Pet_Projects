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

## Ops cost controls (Actions + transfer)

AWS is already in the $0.50–3 band. Recurring waste is mostly **GitHub Actions minutes** and **browser polls**, not CloudFront price class.

| Control | Why |
|---------|-----|
| No weekday **scheduled full deploy** | Refresh workflow owns freshness; push deploy ships HTML |
| Mid-session refresh = **quotes only**; near-close = quotes + screener | Cuts ~80 Yahoo calls mid-day |
| Signal alerts via **`workflow_run` only** (no duplicate cron) | One `npm ci` per refresh, not two |
| Invalidate live JSON on refresh (`/quotes.json` + outlook/screener) | Freshness before 60s TTL; stay under free tier |
| Don’t invalidate `/datacenter/*` on deploy | Hashed JS/CSS stay immutable at the edge |
| Single browser quotes poller (LiveStatus) · **5 min** interval · skip when tab hidden | Cuts poll volume vs 60s dual-fetch |
| No `?t=` cache bust on live JSON | Lets CloudFront + browser share one edge object |
| Compact `quotes.json` / `outlook.json` in CI | ~25–30% smaller transfer per poll |
| Home page loads `dc-movers.json` (~1–2 KB) not full `screener.json` | Cuts ~100 KB/home view |
| MacroStrip shares `outlook.json` with the board (`radar:outlook`) | One fetch per page load |
| Coalesced `renderAll` (rAF + resize debounce) | Less main-thread work when many tabs poll |
| OTel SDKs are `optionalDependencies`; refresh/alerts use `npm ci --omit=optional` | Smaller installs on non-build jobs (deploy/validate keep full `npm ci` for Rolldown) |
| Reference JPGs kept under `docs/` (not `public/`) | Avoid shipping ~2.6 MB unused images |

**Do not “save” money by:** opening `PriceClass_All`, adding WAF/Lambda, caching live quotes for **hours**, or shrinking Yahoo `range=2y` (breaks SMA/RSI). **~60s** edge TTL is intentional for 100× traffic.

## Budget alerts — do they make sense?

**Yes — with the defaults, if you activate the `Project` cost-allocation tag.**

| Setting | Default | Why |
|---------|---------|-----|
| `monthly_budget_usd` | **$3** | Early warning above typical friend spend (~$0.50–2) |
| `high_spend_budget_usd` | **$15** | Separate email tripwire for abnormal / large spend |
| `max_monthly_budget_usd` | **$50** | Typo cap only (blocks `5000`); not an alert by itself |
| Scope | **`Project = stocks-radar`** | Tracks *this* stack, not the whole AWS account |
| Alerts (each budget) | 50% actual, 80% forecast + actual, 100% actual | Early → act before month-end |

### Budget A — early warning ($3)

| Threshold | ≈ USD | Meaning |
|-----------|-------|---------|
| 50% actual | $1.50 | Normal-to-busy friends traffic, or first deploy month with invalidations |
| 80% forecast | $2.40 | AWS thinks you’ll finish the month over ~$2.40 |
| 80% actual | $2.40 | Already burning hot for this stack |
| 100% actual | $3.00 | Over the intentional early ceiling — investigate |

### Budget B — high spend / large amounts ($15)

| Threshold | ≈ USD | Meaning |
|-----------|-------|---------|
| 50% actual | $7.50 | Climbing into “something is wrong” |
| 80% forecast | $12.00 | Forecast says you’ll blow past ~$12 |
| 80% actual | $12.00 | Act now (price class, traffic spike, wrong resources) |
| 100% actual | **$15.00** | Passed the hard tripwire — treat as urgent |

> Before this change, `$15` was only a Terraform typo cap (`max_monthly_budget_usd`), **not** an email alert. It is now a real second AWS Budget.

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
| `/quotes.json`, `/outlook.json`, `/screener.json`, `/dc-movers.json`, `/datacenter/news.json` | **CachingOptimized** + S3 `max-age=60` | Coalesce polls at 100×; CI invalidates on refresh |
| `/health.json`, `/settings.json`, `/build-meta.json` | CachingDisabled | Ops / deploy probes |
| Invalidation paths | HTML + live JSON — **not** `/*` | Keeps hashed assets warm |

Deploy uses [`../sync-s3-tiered.sh`](../sync-s3-tiered.sh).

## 100× traffic — bottleneck review

Static S3 + CloudFront has **no app server, no DB, no cold start**. At 100× page views the failure mode is **uncacheable polls + client re-render**, not CPU on origin.

| Rank | Bottleneck | Impact at 100× | Status |
|------|------------|----------------|--------|
| 1 | Uncached `/quotes.json` (+ `?t=` bust) | Origin GETs ≈ concurrent tabs × polls | **Fixed:** 60s edge TTL, no bust |
| 2 | Outlook / screener / movers same pattern | Same as #1 for other live JSON | **Fixed** |
| 3 | Dual pollers + aggressive poll | Network + S3 request waste | **Fixed:** single poller, 5 min |
| 4 | Full `renderAll` on every quote/resize | Main-thread CPU / layout thrash | **Fixed:** rAF coalesce + resize debounce |
| 5 | Large `screener.json` on home | Transfer | Already mitigated via `dc-movers.json` |
| 6 | Unhashed `watchlist-board.mjs` | Cache miss on every HTML deploy | Defer until deploy invalidations hurt |
| 7 | Browser Yahoo fallback (`browserFallback`) | N× Yahoo from clients | Keep **off** in prod settings |
| 8 | Bundle / Astro startup | One-time per visit | Already hashed `/_astro/*`; fine |
| 9 | Database / server CPU / cold starts | N/A | No backend |

**Measure after apply:** CloudFront **cache hit rate** on `/quotes.json`, origin request count, and browser Performance (long tasks on home) before/after a weekday open.

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
