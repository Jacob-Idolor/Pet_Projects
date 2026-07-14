# AGENTS.md

## Cursor Cloud specific instructions

This repo is a portfolio monorepo. Most top-level folders (`games/`, `poker/`,
`Dynatrace/`) are README-only placeholders with nothing to run. The runnable
projects are three independent **Astro** static sites plus an optional
OpenTelemetry Docker lab.

### Runnable projects

| Project | Path | Dev command | Notes |
|---------|------|-------------|-------|
| Stocks Radar | `stocks/radar` | `npm run dev` | Watchlist SPA. `dev` runs `bundle:watchlist` (esbuild) then `astro dev`. |
| K8s Practice Lab | `kubernetes/site` | `npm run dev` | Learning site; the only project with a test suite (vitest + Playwright). |
| Terraform Practice Lab | `terraform/site` | `npm run dev` | Learning site. |
| OpenTelemetry Lab | `opentelemetry/examples/stack` | `docker compose up` | Optional; **requires Docker**, which is NOT installed in the base image. |

Each Astro project is its own npm package with its own `package-lock.json`, so
run npm commands inside each folder (or with `npm --prefix <dir>`). Astro's dev
default port is 4321; pass `--port` to run more than one at once, e.g.
`npm run dev -- --port 4322`.

### Build / test / lint

- There is no dedicated lint script anywhere; "validation" is `npm run build`
  (all three) plus the test suite in `kubernetes/site`. CI mirrors this — see
  `.github/workflows/*-validate.yml`.
- Stocks Radar build must set a base path: `STOCKS_RADAR_BASE=/ npm run build`
  (see `stocks/radar/astro.config.mjs` and `stocks-radar-validate.yml`).
- `kubernetes/site` test commands (see its `package.json`):
  `npm run test:unit` (vitest), `npm run test:ci` (build + unit + link/security
  checks + `npm audit --audit-level=critical`), `npm run test:e2e` (Playwright).
- `npm run test:ci` includes `npm audit --audit-level=critical`; the repo has
  known high/low advisories in Astro/esbuild that do NOT fail this gate (only
  `critical` fails). Do not "fix" them by force-upgrading Astro.
- Playwright e2e needs the chromium browser binary. If a fresh VM is missing
  system libs, run `npx playwright install chromium --with-deps` inside
  `kubernetes/site` (needs sudo/apt); the update script installs the browser
  without system deps.

### Gotchas

- `stocks/radar` client bundle is emitted as ESM (`public/watchlist-board.mjs`)
  and MUST be loaded with `type="module"`. If the watchlist table renders empty
  with an `Unexpected token 'export'` console error, that's the cause.
- `stocks/radar/src/data/watchlist.json` is imported directly by Astro; invalid
  JSON there makes the index page 500 and breaks the build.
- The Stocks Radar search box sits below the fold on first load; the watchlist
  table is further down the page.
