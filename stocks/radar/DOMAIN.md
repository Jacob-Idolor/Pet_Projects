# Domain — stockswatch.cc

**Registrar + DNS:** Cloudflare (Free). Cloudflare Pages is the intended host for the static site; Terraform attaches the custom domain after the Pages project is available.

Point it at whatever you run next. Typical Cloudflare records:

| Type | Name | Content | Proxy |
|------|------|---------|-------|
| CNAME | `@` | the Pages project `*.pages.dev` hostname | normally created by Pages when the custom domain is attached |
| CNAME | `www` | `stockswatch.cc` or the same origin | same |

For a Cloudflare-managed Pages custom domain, leave `manage_dns_record = false` in Terraform and do not create a competing apex record manually. If the record was deleted, restore it from the Pages custom-domain screen using the project’s `pages.dev` hostname.

App/SEO URL when something is live: `STOCKS_RADAR_SITE=https://stockswatch.cc`.

AdSense: add **stockswatch.cc** after the site is publicly deployed — [ADSENSE.md](ADSENSE.md).

Domain cost is ~$10–12/yr. Cloudflare DNS is $0. Registration stays with Cloudflare until you cancel renewal.
