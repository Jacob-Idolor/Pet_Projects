# StocksWatch NBIS Research Desk

## Product thesis

StocksWatch should be the calm, source-linked daily research page for people following Nebius Group and the AI-cloud buildout. The free page earns trust by showing the raw context, retrieval times, filings, assumptions, and evidence gaps in one place. It does not promise returns, issue trade signals, or execute trades.

This fits the existing project well: the site already has a public watchlist, AI-infrastructure data, a technical-data pipeline, and a preference for transparent, timestamped research rather than opaque recommendations.

## Income path

1. **Free discovery layer:** NBIS Deep Dive, indexed daily, with a clean technical/fundamental snapshot and direct primary-source links.
2. **Email habit:** a short “NBIS Close” email that summarizes what changed, what to verify, and which filing or data point moved. Add a consent-first signup only after choosing the email provider and publishing a privacy policy.
3. **Sponsor inventory:** sell one clearly labeled sponsor placement to an AI-infrastructure, developer-tool, or research-data company after the page has repeat readership. Keep it separate from analysis.
4. **Paid archive:** offer the daily archive, historical scenario changes, downloadable data, and a weekly research memo as a low-cost subscription. A reasonable initial test is $5–9/month; validate demand before adding billing complexity.
5. **Expansion:** reuse the same schema for a small number of adjacent AI-infrastructure names only after NBIS has a reliable publishing cadence.

The site should never imply guaranteed passive income. The asset is the repeatable research habit, search traffic, and owned audience; revenue is an experiment that follows evidence of readership.

## Daily operating loop

GitHub Actions runs once per day, fetches Yahoo market/statement data and SEC EDGAR filings, validates `public/nbis.json`, builds the static Astro site, and uploads `dist/` to Cloudflare Pages. Terraform owns the Cloudflare project, custom domain, and DNS record. There is no always-on server or database in the first version.

## Trust rules

- Every snapshot displays its retrieval time and provider context.
- Missing or stale data stays visibly missing; it is never replaced with invented numbers.
- Scenario outputs are explicitly labeled assumptions, not price targets.
- Alpaca can be used for product research or an optional authenticated market-data provider, but this public static site does not contain brokerage credentials or place trades.
- Preserve the site's not-financial-advice framing and link material claims to company or SEC sources.
