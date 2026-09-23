# Production readiness — StocksWatch

StocksWatch is served by Cloudflare Pages at `https://stockswatch.cc`. No AWS stack is active. Deployment workflows are in the parent repository's `.github/workflows/`; Terraform files are retained infrastructure references, not a prerequisite for ordinary builds.

## Release flow

The NBIS daily workflow runs on main changes, a daily schedule, or manual dispatch. It installs the npm lockfile and hashed Python requirements, audits dependencies, checks source, fetches NBIS with a required SEC identity, and validates data quality before building. Wrangler is an exact development dependency, invoked with `npx --no-install`. After deployment, a bounded retry checks the public snapshot and exact Git commit.

`npm run nbis:quality` requires a positive price, at least 20 ordered price points, annual and quarterly statements, SEC filings, a snapshot no older than 30 hours, and a latest market close within seven calendar days. Weekends and holidays are allowed. The fetcher validates before atomically replacing its previous snapshot. These are minimum coverage checks, not a guarantee of provider accuracy.

## Public surfaces

- `/`: NBIS research desk, with data available without JavaScript.
- `/datacenter.html`: legacy redirect to `/`.
- `/health.json`: build-time NBIS health and `freshnessSnapshot.validUntil`.
- `/build-meta.json`: deployed revision and workflow identity.

Historical screener/movers/map files remain locally for reference but are excluded from production by `npm run postbuild`. They are no longer part of production freshness monitoring.

## Checks

Run `npm run freshness:live -- https://stockswatch.cc` for a current public-data check. Set `EXPECTED_GIT_SHA` to additionally verify the release revision. No recurring monitor is provisioned by this command; deployment checks only run when the workflow runs.

For an offline build, set `SCREENER_SKIP=1` and `NBIS_SKIP=1`. Offline fixtures can be stale; the UI reports their timestamp and age. Browser refresh failure preserves the saved page data, explicitly labels the failure, and offers retry. It does not manufacture replacement market data.

Ad scripts remain blocked until `PUBLIC_ADSENSE_CONSENT_READY=true` records verified consent setup. See [ADSENSE.md](ADSENSE.md) for the remaining account-side step.
