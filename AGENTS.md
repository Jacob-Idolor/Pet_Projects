# AGENTS.md

## Cursor Cloud specific instructions

This repo is a monorepo of independent "pet projects". Only two directories contain
runnable products, both static [Astro](https://astro.build) sites (Node.js, npm). The
rest (`games/`, `poker/`, `Dynatrace/`, most of `kubernetes/`) are notes/learning
material with no service to run.

### Products & how to run them

- **Stocks Radar** — `stocks/radar/`
  - Dev server: `npm run dev` (Astro, `http://localhost:4321`). The `dev` script first
    runs `bundle:watchlist` automatically.
  - Build (this is the CI validation — there are no lint/test scripts): `npm run build`.
    CI builds with `STOCKS_RADAR_BASE=/Pet_Projects/stocks-radar` for GitHub Pages.
  - `npm run build`/`prebuild` and `npm run update-quotes` fetch live prices from Yahoo
    Finance (`query1.finance.yahoo.com`, no API key). They need internet; the app still
    builds/serves without live quotes.
  - **Known pre-existing bug (not an environment issue):** the generated client bundle
    `public/watchlist-board.mjs` is emitted as an ES module (top-level `export`) but the
    page loads it with a plain `<script defer src=...>` (no `type="module"`), so browsers
    throw `Uncaught SyntaxError: Unexpected token 'export'`. This breaks watchlist
    rendering and the Import CSV feature in both `npm run dev` and the production build.
    Do not treat this as a setup problem.

- **K8s Practice Lab** — `kubernetes/site/`
  - Dev server: `npm run dev` (Astro, defaults to `http://localhost:4321`), or from
    `kubernetes/` use `make site-dev` / `make site-build` / `make site-preview`.
  - Build (CI validation, no lint/test scripts): `npm run build`.
  - Fully interactive and working: e.g. the simulated kubectl terminal on `/practice`
    and the quizzes/progress tracking (browser `localStorage`, no backend).

### Gotchas

- Both Astro sites default to port **4321**; when running them at the same time pass
  `--port` (e.g. `npm run dev -- --port 4322`) or the second one auto-shifts.
- No database, backend service, or secrets are required for local development of either
  product.
- The other `kubernetes/` Makefile targets (kind cluster, docker lab, terraform/AWS
  deploy) are optional learning labs and need docker/kubectl/kind/terraform, which are
  not required to develop or run the two web apps.
