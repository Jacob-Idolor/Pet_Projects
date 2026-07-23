# Passive income — costs, AdSense, and break-even

Honest unit economics for Stocks Radar as a **static** site: AWS hosting cost stays tiny; Google **AdSense** (ads *on* your pages) is the revenue path. This is not financial advice and AdSense payouts vary a lot by niche, geography, and season.

> **AdSense ≠ Google Ads.** AdSense pays *you* when visitors see ads on the radar. Google Ads is what advertisers buy. You do not need a Google Ads campaign to earn — you need an approved AdSense site + traffic.

## Architecture choice (why this scales cheap)

| Principle | How Radar follows it |
|-----------|----------------------|
| **Push work to the edge** | CloudFront `PriceClass_100` + compression; hashed `/_astro/*` cached ~1 year |
| **No always-on compute** | S3 origin only — no EC2, ECS, Lambda, RDS |
| **Invalidate narrowly** | Redeploys invalidate HTML + live JSON, not `/*` (protects cache hit ratio) |
| **Refresh data out-of-band** | GitHub Actions quote refresh / alerts — not a 24/7 API |
| **Fail closed on spend** | Budget alarm default **$3/mo**; stack is destroyable |

CloudFront and S3 scale automatically with traffic. Your real ceilings are Yahoo rate limits on quote refresh and AdSense policy — not AWS capacity.

## Monthly cost model (USD)

| Line item | Friends trial (~100–1k visits) | Growing (~10k–50k visits) | Notes |
|-----------|-------------------------------|---------------------------|-------|
| S3 storage + requests | $0.01–0.10 | $0.10–1 | Tiny objects |
| CloudFront egress + requests | $0.50–2 | $2–8 | `PriceClass_100`; cache hits keep this down |
| SNS digests / personal alerts | ~$0 | ~$0 | Email free tier |
| AWS Budgets | $0 | $0 | First budgets free |
| GitHub Actions | $0 on free minutes | watch minutes | Quote refresh ~2×/weekday |
| **Domain** (amortized) | ~$1/mo | ~$1/mo | $10–12/yr .com |
| Cloudflare DNS | $0 | $0 | Free plan |
| **AWS subtotal** | **~$0.50–3** | **~$2–10** | Destroy → ~$0 |
| **All-in with domain** | **~$1.50–4** | **~$3–11** | |

**Do not add** for passive-income phase: WAF (~$5+/mo), Lambda quote proxy, multi-region `PriceClass_All`, Route53 (use Cloudflare DNS).

### Rough AWS formula

At low/medium traffic, think:

`monthly ≈ CloudFront_requests_fees + egress_GB × ~$0.085 (PriceClass_100 US/EU) + pennies of S3`

Tiered caching (immutable `_astro`, short HTML, no-cache `quotes.json`) is what keeps **origin** and **egress** from growing linearly with page views.

## AdSense revenue model (order-of-magnitude)

AdSense pays on **RPM** (revenue per 1,000 page views) or related metrics. Finance / investing sites often see higher RPM than generic blogs — but Google can also restrict ads on “get rich” or advice-heavy pages. Keep the product as a **tools/check-in** site, not investment advice.

| Scenario | Page views / mo | Assumed RPM | Gross AdSense | Hosting+domain | **Net** |
|----------|-----------------|-------------|-----------------|----------------|---------|
| Friends only | 500 | $2 | $1 | ~$3 | **−$2** (learning / utility) |
| Small SEO | 5,000 | $4 | $20 | ~$4 | **~$16** |
| Niche traction | 25,000 | $6 | $150 | ~$6 | **~$144** |
| Strong niche | 100,000 | $8 | $800 | ~$10 | **~$790** |

RPM $2–8 is a **planning band**, not a promise. Your real RPM shows in AdSense after approval + a few weeks of data.

### Break-even traffic (rule of thumb)

With ~$4/mo all-in cost and RPM $4:

`break-even page views ≈ (4 / 4) × 1000 = **1,000 views/mo**`

Below that, treat the site as a **group tool** that happens to have ads. Above that, ads can cover hosting and start compounding with SEO.

## Path to passive income (ordered)

1. **Ship cheap** — `terraform apply` + CloudFront URL; confirm budget email.
2. **Buy domain** — [DOMAIN.md](DOMAIN.md); keep Cloudflare DNS (no Route53 fee).
3. **AdSense site approval** — [ADSENSE.md](ADSENSE.md); custom domain preferred.
4. **Keep UX useful** — 3 ad slots max (hero / after board / footer); never cover the table.
5. **SEO basics** — real theses, stable URLs, `sitemap.xml` / `ads.txt` on the public hostname.
6. **Optional growth** — share in communities, light content pages later — still static on S3.
7. **Watch unit economics monthly** — AdSense estimated earnings − AWS bill − domain amortization.

## What would kill the margin

| Temptation | Why it hurts |
|------------|--------------|
| WAF “because security” | Fixed ~$5+/mo before any revenue |
| Live Yahoo via Lambda@Edge | Compute + cold paths; GHA refresh is enough |
| Serverful DB for suggestions | Ops + idle cost; IndexedDB + git is fine until paid demand |
| Buying traffic (Google Ads) | Different product — you become the *advertiser*; easy to lose money |
| Global CloudFront price class | Higher egress for little friend-group benefit |

## Dashboard checklist (once live)

- AWS Billing → confirm Stocks Radar tags / budget alert
- CloudFront → cache hit ratio (want high on `/_astro/*`)
- AdSense → RPM, page RPM, active views
- Compare: `AdSense month − (AWS + domain/12)`

## Related docs

- [COST.md](infra/terraform/COST.md) — infra line items  
- [ADSENSE.md](ADSENSE.md) — publisher setup  
- [DOMAIN.md](DOMAIN.md) — cheap domain path  
- [DEPLOY.md](DEPLOY.md) — re-enable CI after secrets  
