# StocksWatch architecture

Static Astro site (`stockswatch.cc`): **AI Data Center screener on `/`**, archived group watchlist on `/watchlist.html`. No app server — CI writes JSON to S3; CloudFront serves it.

## Surfaces

| Surface | Where to edit | Runtime |
|---------|---------------|---------|
| Home (AI Data Center) | `src/pages/index.astro`, `public/datacenter/*` | Astro + hashed JS/CSS + `static-api.js` |
| Archived watchlist | `src/pages/watchlist.astro`, `src/client/board/*` | Astro HTML + `public/watchlist-board.mjs` |
| Legacy `/datacenter.html` | `src/pages/datacenter.astro` | Client redirect → `/` |
| Local Flask (dev only) | `archive/ai-datacenter-screener/` | Not deployed to AWS |
| Shared tokens | `src/styles/tokens.css` → synced to `public/tokens.css` | Both surfaces |
| Site settings | `src/data/site-settings.json` | Astro + Node via `scripts/config.mjs` |

## Data flow

```text
GitHub Actions (fetch / refresh)
  → public/quotes.json, outlook.json, screener.json, datacenter/campuses.json, …
  → S3 + CloudFront (~60s edge TTL for live JSON)
  → Browser: homepage screener via static-api.js
  → Archived watchlist: LiveStatus → radar:quotes → board re-render
```

## Client code (`src/client/`)

| Path | Role |
|------|------|
| `watchlist-board.ts` | esbuild entry (side-effect import) |
| `board/state.ts` | Shared mutable board state + filters/sort/IDB |
| `board/render-*.ts` | Table / mobile / check-in HTML |
| `board/quotes.ts` | quotes.json + outlook loaders |
| `board/events.ts` | DOM wiring |
| `board/init.ts` | `initWatchlistBoard` |
| `group-submissions.ts` | Friend suggestions form |

Rebuild the board bundle: `npm run bundle:watchlist` → `public/watchlist-board.mjs` (**generated**).

## Node scripts

| Folder | Role |
|--------|------|
| `scripts/fetch/` | Yahoo quotes, outlook, screener, movers |
| `scripts/ops/` | Health, SEO, validate, hash assets, bundle, go-live |
| `scripts/alerts/` | Digest, signal alerts, radar score |
| `scripts/lib/` | Shared pure helpers (`action-bias`, `sanitize`, `aws-cli`, `alert-quote-guard`, freshness) |
| `scripts/config.mjs` | Settings + env overlays (stays at scripts root) |
| `scripts/datacenter/` | Python universe helpers for the screener |

Action bias math lives in **`scripts/lib/action-bias.mjs`** (Node alerts + home board via `src/lib/market-format.ts`). Do not duplicate it.

## Styles

`src/styles/global.css` is an ordered `@import` entry over `src/styles/home/*.css`. Do not rename selectors casually — cascade order matters.

## Generated artifacts (do not hand-edit)

- `public/watchlist-board.mjs`
- `public/datacenter/*.<hash>.*` (from `npm run hash:datacenter`)
- `public/settings.json`, `public/health.json`, quote/screener JSON from CI

See also [README.md](README.md), [DEPLOY.md](DEPLOY.md), [infra/terraform/COST.md](infra/terraform/COST.md).
