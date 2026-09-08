# Security — Stocks Radar

Static Astro app (no user auth). There is **no live AWS stack** right now.

## Still true in the app

| Control | Notes |
|---------|--------|
| XSS hardening | Symbol/id/priority sanitized; text fields HTML-escaped; DC score bar widths clamped |
| Scripts | `execFileSync` argv arrays (no shell injection); Yahoo host fixed |
| Personal alerts fail-closed | Missing topic map → skip; empty rules never auto-broadcast |
| Static-origin headers | Cloudflare `_headers` sets `nosniff`, referrer and permissions policy, frame denial, HSTS, and bounded data caching |
| Production data gate | Strict NBIS refresh requires an SEC contact identity and schema validation before deploy |
| Release secret scan | `npm run security:dist` fails if obvious credentials enter the generated static bundle |
| CI scope | GitHub workflows use read-only checkout permissions, a deployment timeout, and separate Cloudflare secrets |
| Not financial advice | Keep that framing in UI and docs |

## When you host again

- Do not commit `.env`, keys, or `terraform.tfvars`
- Treat `PUBLIC_*` values as browser-visible by design; only put non-secret publisher/access configuration there
- Prefer short-lived credentials / OIDC over long-lived access keys in GitHub
- Keep public browser config limited to `PUBLIC_` values
- If using object storage, block public access and put cooldown/private state off the public origin
