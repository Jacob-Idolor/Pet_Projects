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

Keep dependency updates within supported version ranges unless a major upgrade has been reviewed and tested. TypeScript remains on version 5. Wrangler is pinned in the npm lockfile. Python snapshot dependencies are hash-locked in `scripts/datacenter/requirements.txt`; install with `python -m pip install --require-hashes -r scripts/datacenter/requirements.txt`. Regenerate on Python 3.13 from `requirements.in` using pip-tools 7.5.0.

For this Windows checkout, activate the installed project-local Node 22.23.2 toolchain before using npm:

```powershell
. ./scripts/ops/use-node.ps1
npm ci
```

The helper changes only the current PowerShell session. Other machines can install the version in `.nvmrc`; `package.json` declares the supported Node range. The cached runtime is not committed.

Snapshot percentages use explicit units: provider growth/margin fractions and scenario CAGR are multiplied by 100 for display; market returns are already percentage points. Initial HTML and browser refresh share the same renderer. The retired screener files remain local and are stripped from releases.

## Product direction

The first asset is the free NBIS Deep Dive: current context, raw sources, retrieval time, filings, assumptions, and evidence gaps in one page. The long-term revenue ladder is:

1. Search and repeat readership from the free research desk.
2. A free, editable [research kit](https://stockswatch.cc/research-kit.html), then optional consent-based email once a provider is connected.
3. A proposed one-time Research Workflow Pack, with price and demand still to be tested.
4. Later, disclosed sponsorship or a paid archive if readership, demand and data rights justify them.
5. Later, practical AI/automation guides, templates, and tools for technically minded professionals.

This follows the supplied business strategy: build a credible system that compounds, avoid hype and guaranteed-income claims, and keep recurring operating work small.

The implementation includes `/research-kit.html`, `/workflow-pack.html` and original free Markdown downloads in `public/downloads/`. These authored resources are not generated market-data artifacts. The full Workflow Pack is prepared locally in Git-ignored `.private-products/`; `npm run product:pack` creates a private ZIP with an integrity manifest. Back it up privately: a Git clone does not include it. Email collection and checkout remain unimplemented. See [WORKFLOW_PACK.md](WORKFLOW_PACK.md) for packaging and sales setup, [NEWSLETTER_SETUP.md](NEWSLETTER_SETUP.md) for the email flow, and [INCOME_MVP.md](INCOME_MVP.md) for the strategy.

## Ads

AdSense is wired for later but is not required for the site to work. Ads are manual, labeled, domain-gated, and only appear after substantial NBIS content when client, approval, and unit IDs are configured. Auto ads should remain off. See [ADSENSE.md](ADSENSE.md).

## Hosting

The site is hosted on Cloudflare Pages with static output. Terraform configuration remains under `infra/terraform/`; no deployment or infrastructure mutation is performed by normal local builds.

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
