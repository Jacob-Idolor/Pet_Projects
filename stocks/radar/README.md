# StocksWatch

StocksWatch is a calm, source-linked daily research desk for Nebius Group (`NBIS`) and the AI infrastructure buildout. It is intentionally small: Astro static output, one daily snapshot, Cloudflare Pages, and GitHub Actions. It is educational and not financial advice.

The old group watchlist and its quote/alert machinery have been retired. The NBIS desk is the main product and the foundation for a long-term, low-overhead digital asset.

## Quick start

```bash
cd stocks/radar
npm ci
npm run dev
```

Useful checks:

```bash
npm test
npm run security:deps
npm run screener:schema
npm run nbis:schema
npm run typecheck
npm run adsense:checklist
SCREENER_SKIP=1 NBIS_SKIP=1 npm run build
npm run verify:dist
npm run test:e2e
```

For a local refresh with provider access, install the Python requirements and run `npm run update-nbis`. Production refreshes require `SEC_CONTACT_EMAIL` or `SEC_USER_AGENT`.

## Dependency maintenance

Use Node.js 22.19 or newer in the Node 22 release line (CI installs the latest Node 22). Run `npm ci` after pulling lockfile updates. `npm run security:deps` audits all dependencies, including optional image-processing packages, and blocks high/critical vulnerabilities. Dependabot checks this application's npm packages weekly. Pull requests run source checks, an offline snapshot build, bundle checks, and Chromium tests; daily refreshes also audit dependencies and validate source before building. The active workflows and Dependabot configuration live in the parent repository's `.github/` directory.

Keep dependency updates within supported version ranges unless a major upgrade has been reviewed and tested. TypeScript remains on version 5 for this maintenance update.

## Product direction

The first asset is the free NBIS Deep Dive: current context, raw sources, retrieval time, filings, assumptions, and evidence gaps in one page. The long-term revenue ladder is:

1. Search and repeat readership from the free research desk.
2. A consent-first “NBIS Close” email brief.
3. One clearly labeled sponsor relevant to AI infrastructure or developer tools.
4. A low-cost paid archive with historical snapshots and weekly research notes.
5. Later, practical AI/automation guides, templates, and tools for technically minded professionals.

This follows the supplied business strategy: build a credible system that compounds, avoid hype and guaranteed-income claims, and keep recurring operating work small.

## Ads

AdSense is wired for later but is not required for the site to work. Ads are manual, labeled, domain-gated, and only appear after substantial NBIS content when client, approval, and unit IDs are configured. Auto ads should remain off. See [ADSENSE.md](ADSENSE.md).

## Hosting

The intended host is Cloudflare Pages with static output. Terraform configuration remains under `infra/terraform/`; no deployment or infrastructure mutation is performed by normal local builds.

## Important files

```text
src/pages/index.astro          # NBIS research desk
src/client/nbis-dashboard.ts   # browser hydration
src/data/nbis-profile.json     # editorial profile and primary sources
public/nbis.json               # generated daily snapshot
scripts/fetch/fetch-nbis.py    # NBIS data collection
scripts/fetch/fetch-screener.py# AI infrastructure screener collection
src/lib/adsense.ts             # future monetization gates
```

See [ARCHITECTURE.md](ARCHITECTURE.md), [PRODUCT.md](PRODUCT.md), [PASSIVE_INCOME.md](PASSIVE_INCOME.md), [PRODUCTION.md](PRODUCTION.md), and [SECURITY.md](SECURITY.md) for operating details.
