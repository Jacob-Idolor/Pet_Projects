# StocksWatch architecture

StocksWatch is a static Astro site for the NBIS research desk at `/`. It is designed as a low-cost, source-linked daily research asset: no browser API keys, no always-on server, no database, and no brokerage credentials.

## Surfaces

| Surface | Source | Runtime |
| --- | --- | --- |
| NBIS Deep Dive | `src/pages/index.astro` | Build-rendered snapshot HTML + browser refresh from `public/nbis.json` |
| NBIS reading guide | `src/pages/guides/nbis-research-guide.astro` | Static Astro HTML |
| NBIS SEC filings guide | `src/pages/guides/nbis-sec-filings.astro` | Static Astro HTML |
| Free research kit | `src/pages/research-kit.astro` | Static Astro HTML; optional browser engagement event |
| Editable kit download | `public/downloads/ai-infrastructure-research-kit.md` | Original authored Markdown, copied into releases |
| Workflow Pack preview | `src/pages/workflow-pack.astro` | Static product preview; no checkout or live Offer metadata |
| Workflow sample | `public/downloads/research-workflow-sample.md` | Intentionally public sample with fictional teaching data |
| Privacy & sponsorship | `src/pages/privacy.astro` | Static Astro HTML |
| Legacy data-center redirect | `src/pages/datacenter.astro` | Redirects bookmarks to `/` |
| Not found | `src/pages/404.astro` | Noindex, no ads |

The former group watchlist, quote board, personal alerts, and submission form have been removed. Retained `public/datacenter/`, screener and movers files are historical local sources. `postbuild` excludes them from `dist/`; they are not published feeds.

The complete Workflow Pack is local-only in Git-ignored `.private-products/`, outside the Astro source/public trees. `npm run product:pack` reads an explicit list from `src/data/workflow-pack.json` and writes a private, versioned ZIP. Website builds do not require private files. Release verification rejects known full-product filenames, archive names and private product directories in `dist/`. Email copy and setup are documented but no collection endpoint or provider is active.

## Data flow

```text
Daily refresh
  → fetch-nbis.py → public/nbis.json
  → shared quality gate → Astro static build → exclude historical artifacts
  → Cloudflare Pages / static CDN
  → browser checks snapshot age and refreshes from nbis.json
```

The NBIS snapshot contains market context, fundamentals, scenarios, filings, research readouts, and timestamps. Missing or stale data remains visible as missing or stale; the site never invents numbers to make a page look healthy.

## Source map

| Path | Role |
| --- | --- |
| `src/client/nbis-dashboard.ts` | Snapshot hydration, chart, tables, readouts, and local engagement hooks |
| `src/lib/nbis-render.ts` | Pure escaped renderer shared by initial HTML and browser refresh |
| `scripts/lib/nbis-quality.mjs` | Shared structural, coverage, and freshness validation |
| `src/data/nbis-profile.json` | Company profile, monitoring checklist, and primary sources |
| `scripts/fetch/fetch-nbis.py` | Yahoo Finance + SEC snapshot collection |
| `scripts/fetch/fetch-screener.py` | AI infrastructure screener snapshot |
| `scripts/ops/validate-nbis-schema.mjs` | NBIS data contract check |
| `scripts/ops/validate-screener-schema.mjs` | Screener data contract check |
| `src/lib/adsense.ts` | Domain, content, and placement gates for future ads |
| `src/components/AdSlot.astro` | Manual, labeled ad units only when configured |

## Build lifecycle

`npm run prebuild` validates configuration, syncs tokens, refreshes NBIS when requested, validates its snapshot schema, and writes health/SEO metadata. Astro renders NBIS data directly into HTML through the same renderer used by browser refreshes. `postbuild` removes historical feeds from the release. Production validates fresh data before deployment and checks the public revision afterward. Offline builds use `SCREENER_SKIP=1 NBIS_SKIP=1`; stale data stays explicitly labeled. The static health file's `validUntil` must be compared to the current time, not treated as a perpetual health guarantee.

## Design and safety rules

- Keep the NBIS research desk as the product wedge; future guides, tools, templates, and email products should extend the same evidence-first audience.
- Keep action/scenario language educational. Do not describe scenarios as forecasts, targets, or guaranteed outcomes.
- Keep ad placement after substantial research content, manually labeled, and disabled until the custom domain, consent/privacy surface, and AdSense review requirements are satisfied.
- Keep `src/styles/global.css` import order stable: tokens, shared shell, then ad styles.
- Do not hand-edit generated artifacts under `public/`; use their matching scripts.
