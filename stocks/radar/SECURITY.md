# Security - J Sol

J Sol is a static Astro site deployed to Cloudflare Pages. Active reader pages
have no authentication, forms, embedded frames, client JavaScript or payment
processing. Historical market-data and product-delivery code is retained outside
the active distribution; it is not evidence of a running production service.

## Active release controls

| Control | Notes |
|---------|--------|
| XSS hardening | Astro escapes text; article JSON-LD serializes `<` safely; no executable client scripts are required |
| External links | Public creator links retain `noopener noreferrer` for new tabs |
| Static-origin headers | `_headers` declares `nosniff`, referrer/permissions policy, frame denial, HSTS, bounded caching and restrictive CSP |
| Publishing gate | Manual release repeats dependency audit, tests, typecheck, offline build, policy/security scans and browser checks |
| Release secret scan | `npm run security:dist` fails if obvious credentials enter the generated static bundle |
| CI scope | GitHub workflows use read-only checkout permissions, source type/unit checks, required-output verification, a deployment timeout, and separate Cloudflare secrets |
| Not financial advice | Keep that framing in UI and docs |

## Secrets and configuration

- Do not commit `.env`, keys, or `terraform.tfvars`
- Treat `PUBLIC_*` values as browser-visible by design; only put non-secret publisher/access configuration there
- Prefer short-lived credentials / OIDC over long-lived access keys in GitHub
- Keep public browser config limited to `PUBLIC_` values
- If using object storage, block public access and put cooldown/private state off the public origin

## October 30, 2026 bounded review

The Substack PR initially had the same package manifest and lockfile as base
`2c87e466dc8ea118a50f9d245e9ac90749290669`. Its five audit findings were preexisting:
high-severity findings in Undici, Vite and Zod, with moderate transitive findings
in Miniflare and Wrangler. Reviewed primary advisories included:

- https://github.com/advisories/GHSA-4w7w-5xrc-9h26
- https://github.com/advisories/GHSA-587h-7wmj-h5pm
- https://github.com/advisories/GHSA-mrhx-c7xc-m3w5

The scoped repair keeps Astro 7.3.4 and the existing APIs, pins Wrangler 4.153.0,
and resolves compatible transitive patches: Miniflare 5.20261023.0-beta,
Undici 7.30.1/8.12.3, Vite 8.3.5 and Zod 4.6.7. The local npm audit reported
zero findings for that lockfile. This is a dated audit result, not a guarantee.

The public origin serves generated HTML, CSS and local assets. Vite, Zod,
Unifont/Undici and Wrangler/Miniflare are build/development dependencies in this
usage; their presence does not establish a remotely exploitable service on the
static origin. Build and developer environments still need patches. No active
application use of Undici's vulnerable shared redirect/cache composition was found.

Read-only HTTPS header checks of `/` and `/about` returned 200 with HSTS,
`nosniff`, frame denial, referrer and permissions policies. Production did not yet
send CSP at review time; the proposed `_headers` change needs reviewed deployment
and a fresh live-header check. CSP denies scripts, connections, forms, objects,
framing and base-URL changes, allowing local styles/fonts/images and data images.
The release policy requires the core CSP restrictions globally.
Wildcard CORS was present on public static content; no credentialed or private
endpoint was identified in this review.

A limited high-confidence token/private-key scan covered 512 current tracked
text files and found no matches; the generated-bundle scan is also retained.
This does not cover all Git history, external secret stores or every secret format.

Residual work: immutable SHA pinning of third-party CI actions would reduce
supply-chain exposure. Account permissions, credential rotation, branch-protection
configuration and historic-secret remediation require separate scoped review;
none were changed. No intrusive live scanning was performed.
