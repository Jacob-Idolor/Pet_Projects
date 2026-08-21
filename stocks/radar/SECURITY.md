# Security — Stocks Radar

Static Astro app (no user auth). There is **no live AWS stack** right now.

## Still true in the app

| Control | Notes |
|---------|--------|
| XSS hardening | Symbol/id/priority sanitized; text fields HTML-escaped; DC score bar widths clamped |
| Scripts | `execFileSync` argv arrays (no shell injection); Yahoo host fixed |
| Personal alerts fail-closed | Missing topic map → skip; empty rules never auto-broadcast |
| Not financial advice | Keep that framing in UI and docs |

## When you host again

- Do not commit `.env`, keys, or `terraform.tfvars`
- Prefer short-lived credentials / OIDC over long-lived access keys in GitHub
- Keep public browser config limited to `PUBLIC_` values
- If using object storage, block public access and put cooldown/private state off the public origin
