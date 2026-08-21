# Domain — stockswatch.cc

**Registrar + DNS:** Cloudflare (Free). The name is yours; nothing is hosted on it right now.

Point it at whatever you run next. Typical Cloudflare records:

| Type | Name | Content | Proxy |
|------|------|---------|-------|
| CNAME | `@` | origin hostname from your host | follow the host’s docs |
| CNAME | `www` | `stockswatch.cc` or the same origin | same |

If the host terminates HTTPS itself (CloudFront, many PaaS CDNs), keep the orange cloud **off** (DNS only) unless that host says otherwise.

App/SEO URL when something is live: `STOCKS_RADAR_SITE=https://stockswatch.cc`.

AdSense: add **stockswatch.cc** when the site is public again — [ADSENSE.md](ADSENSE.md).

Domain cost is ~$10–12/yr. Cloudflare DNS is $0. Registration stays with Cloudflare until you cancel renewal.
