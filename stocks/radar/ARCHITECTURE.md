# StocksWatch architecture

StocksWatch is a static Astro site for the NBIS research desk at `/`. It is designed as a low-cost, source-linked daily research asset: no browser API keys, no always-on server, no database, and no brokerage credentials.

## Surfaces

| Surface | Source | Runtime |
| --- | --- | --- |
| NBIS Deep Dive | `src/pages/index.astro` | Astro HTML + `public/nbis.json` hydration |
| NBIS reading guide | `src/pages/guides/nbis-research-guide.astro` | Static Astro HTML |
| Privacy & sponsorship | `src/pages/privacy.astro` | Static Astro HTML |
| Legacy data-center redirect | `src/pages/datacenter.astro` | Redirects bookmarks to `/` |
| Not found | `src/pages/404.astro` | Noindex, no ads |

The former group watchlist, quote board, personal alerts, and submission form have been removed. The retained `public/datacenter/` assets are historical/supporting screener assets and are not a separate product surface.

## Data flow

```text
Daily refresh
  → fetch-nbis.py → public/nbis.json
  → fetch-screener.py → public/screener.json + public/dc-movers.json
  → schema checks → Astro static build
  → Cloudflare Pages / static CDN
  → browser hydrates the NBIS research desk from nbis.json
```

The NBIS snapshot contains market context, fundamentals, scenarios, filings, research readouts, and timestamps. Missing or stale data remains visible as missing or stale; the site never invents numbers to make a page look healthy.

## Source map

| Path | Role |
| --- | --- |
| `src/client/nbis-dashboard.ts` | Snapshot hydration, chart, tables, readouts, and local engagement hooks |
| `src/data/nbis-profile.json` | Company profile, monitoring checklist, and primary sources |
| `scripts/fetch/fetch-nbis.py` | Yahoo Finance + SEC snapshot collection |
| `scripts/fetch/fetch-screener.py` | AI infrastructure screener snapshot |
| `scripts/ops/validate-nbis-schema.mjs` | NBIS data contract check |
| `scripts/ops/validate-screener-schema.mjs` | Screener data contract check |
| `src/lib/adsense.ts` | Domain, content, and placement gates for future ads |
| `src/components/AdSlot.astro` | Manual, labeled ad units only when configured |

## Build lifecycle

`npm run prebuild` validates configuration, syncs design tokens, hashes retained data-center assets, refreshes the screener and NBIS snapshot, validates both schemas, writes health/SEO metadata, and then lets Astro build the static site. CI runs source type/unit checks before the fetch, then verifies required static release files before the bundle scan and deploy. Production sets strict data-fetch behavior; local builds may preserve an existing valid snapshot with `NBIS_SKIP=1`.

## Design and safety rules

- Keep the NBIS research desk as the product wedge; future guides, tools, templates, and email products should extend the same evidence-first audience.
- Keep action/scenario language educational. Do not describe scenarios as forecasts, targets, or guaranteed outcomes.
- Keep ad placement after substantial research content, manually labeled, and disabled until the custom domain, consent/privacy surface, and AdSense review requirements are satisfied.
- Keep `src/styles/global.css` import order stable: tokens, shared shell, then ad styles.
- Do not hand-edit generated artifacts under `public/`; use their matching scripts.
