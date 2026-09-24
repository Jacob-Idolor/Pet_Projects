# Passive income — NBIS Research Desk

This is a small, honest product experiment: publish useful source-linked NBIS research for free, build a repeat audience, then test one reusable digital product. Revenue is not guaranteed and the site must remain educational, transparent, and clearly not financial advice. See [INCOME_MVP.md](INCOME_MVP.md) for the current offer, content backlog and validation plan.

## Sequence implemented

- **Discovery:** the homepage now emits WebSite/WebPage structured data, links to evergreen NBIS reading and SEC-filings guides, and includes both guides plus the transparency page in the sitemap.
- **Retention:** “Follow this desk” remembers a reader’s preference locally in the browser. It does not imply email delivery or create an account.
- **Measurement:** the client emits provider-neutral `stockswatch:engagement` events for navigation, guide opens, follow toggles, and snapshot hydration. No third-party analytics script is enabled by default.
- **Monetization readiness:** a late, manually labeled board ad slot is available behind the existing domain, content, publisher, and unit-ID gates. It remains dormant until configuration and review are complete.
- **Free resource:** `/research-kit.html` offers an editable Markdown research kit without collecting email. A download click emits `research_kit_download`; it is not persisted unless an analytics consumer is connected, and a click does not prove the file was used.
- **Product preparation:** `/workflow-pack.html` provides a public sample, complete contents list and a clearly labeled proposed price. The full ten-document pack is prepared locally and packages into a private ZIP. Sales are not open. Sample clicks emit `workflow_sample_download`; this is not purchase or subscriber measurement.

## Cheap architecture

| Principle | Implementation |
|---|---|
| No always-on compute | Astro static output on Cloudflare Pages |
| No database in v1 | `public/nbis.json` is the daily snapshot |
| Work out-of-band | One GitHub Actions run per day fetches data and deploys `dist/` |
| Hosting | Cloudflare Pages; parent-repository GitHub Actions deploy the static build. Terraform is retained reference material, not an active stack. |
| Fail closed | Strict production fetch refuses to deploy without a fresh NBIS snapshot |
| No public credentials | SEC contact is a GitHub secret; brokerage credentials never ship to the browser |

The expected fixed cost is the domain registration. Cloudflare Pages static delivery and GitHub Actions are intended to stay within their free tiers at small traffic levels; verify current limits before scaling. The first paid dependency should be a better data provider only when readership or revenue justifies it.

## Revenue ladder

1. **Free discovery:** the NBIS Deep Dive page is the SEO and trust surface.
2. **Useful resource and optional email:** offer the free kit now; connect consent-based email only after selecting a provider and testing delivery and unsubscribe.
3. **One reusable product:** test a proposed $19 Research Workflow Pack after finishing the files, preview, license and automated delivery. It is not currently available for purchase.
4. **Later revenue:** test a disclosed sponsor or affiliate only with measured readership. A paid archive needs demonstrated demand and appropriate data rights; a weekly paid memo is deferred.
5. **Small expansion:** add adjacent infrastructure or engineering resources only after NBIS publishing is dependable and reader demand is visible.

Ads can be tested later, but they should not be the primary business model: finance pages need substantial original content and careful policy compliance, and low traffic often produces less than the domain cost.

## Metrics that matter

- returning visitors and 7-day retention;
- daily snapshot success rate and visible data freshness;
- email opt-in rate and open rate;
- sponsor inquiries or paid conversion;
- provider/API cost as a percentage of revenue.

Do not optimize for page views alone. The defensible asset is a trusted daily research habit and an owned audience.

## Guardrails

- Do not call scenarios forecasts or price targets.
- Do not present automated flags as buy/sell/hold recommendations.
- Keep source timestamps and provider names visible.
- Preserve the not-financial-advice language on every monetized surface.
- Keep sponsor labeling and editorial decisions separate.

See [PRODUCT.md](PRODUCT.md) for the product thesis and [PRODUCTION.md](PRODUCTION.md) for active deployment details.
