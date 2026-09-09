# AdSense readiness — StocksWatch

AdSense is prepared as a future, supplemental revenue stream for the NBIS research desk. It is not required for the site to build or operate, and no paid infrastructure is needed to keep the integration dormant.

## Guardrails

- Use manual Display units only; keep Auto ads off.
- Place units after substantial NBIS research content, never in the header, navigation, error page, or an empty state.
- Label every unit “Sponsored”.
- Live units require a valid `ca-pub-…` client, a numeric manual slot ID, the custom domain, and an explicit enabled flag.
- The site keeps the AdSense script and units out of production when the gate fails.
- Publish privacy, cookie/consent, terms, data-source, and not-financial-advice disclosures before monetization.

## Configuration

Set these as GitHub Actions repository variables or build environment values, not in source files:

```text
PUBLIC_ADSENSE_CLIENT=ca-pub-…
PUBLIC_ADSENSE_ENABLED=true
PUBLIC_ADSENSE_VERIFY_META=ca-pub-…
PUBLIC_ADSENSE_SLOT_FOOTER=<numeric display-unit-id>
STOCKS_RADAR_SITE=https://stockswatch.cc
```

`PUBLIC_ADSENSE_SLOT_HERO` remains available but the hero placement is disabled by default. Keep the first test unit late on the page so the research is useful before any sponsored content appears.

## Files

| Path | Role |
| --- | --- |
| `src/lib/adsense.ts` | Domain, content, and placement gates |
| `scripts/lib/adsense-policy.mjs` | Pure policy logic with unit tests |
| `src/components/AdSlot.astro` | Labeled manual unit / local preview |
| `src/layouts/BaseLayout.astro` | Optional script and account metadata |
| `scripts/ops/write-seo-files.mjs` | `ads.txt`, robots, and sitemap |
| `scripts/ops/adsense-review-checklist.mjs` | Build-side review checks |

The current NBIS page opts into the gate but does not require ad configuration. Without approved slots, no live unit is rendered.
