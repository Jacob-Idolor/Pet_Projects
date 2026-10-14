# Domain — stockswatch.cc

**Registrar + DNS:** Cloudflare. Jacob Builds is published as a static Astro site
on the existing Cloudflare Pages project `stockswatch-nbis` at
`https://stockswatch.cc`. The previous StocksWatch investment product is retired.

## Verified state on October 14, 2026

The apex serves all nine active reader routes, robots.txt and sitemap.xml.
`www.stockswatch.cc` does not resolve. The checked infrastructure source manages
one Pages domain and one proxied CNAME for `site_domain` (default
`stockswatch.cc`); it does not define a separate www hostname or redirect.

Publishing the website does not create missing DNS records or zone redirect
rules. Previous automated www DNS/redirect writes were denied; do not retry
them through a different API, Terraform, workflow or account.

All canonical URLs and the submitted sitemap continue to use the apex:
`STOCKS_RADAR_SITE=https://stockswatch.cc` and
`https://stockswatch.cc/sitemap.xml`.

The www resolver failure explains the www robots/DNS warnings. It is not
established as the cause of the separate apex sitemap fetch error. The last
reported GSC check on October 14 still showed Couldn't fetch, Last read
October 13 and zero discovered pages; successful public/Inspection Tool fetches
do not establish successful automatic sitemap processing.

## Pending domain repair and acceptance checks

The previously denied change remains a separate Cloudflare action: one proxied
`A` record for `www` pointing to `192.0.2.1`, plus a redirect restricted to
`http.host eq "www.stockswatch.cc"`. The target is
`concat("https://stockswatch.cc", http.request.uri.path)`, status 301, with query
strings preserved. No such change is included in this website patch. Applying
it requires an execution path that is explicitly permitted; user approval does
not by itself override an automatic approval rejection.

After an authorized repair, verify that www resolves, HTTPS has a valid
certificate, and both HTTP/HTTPS requests for `/`, `/guides`, `/robots.txt`,
`/sitemap.xml` and `/guides?source=profile` receive a 301 to the identical HTTPS
apex path/query. Verify the apex sitemap still returns a direct 200 XML response
and that no apex redirect loop was introduced. Leave retired-page noindex rules
and the existing sitemap submission intact.

References: [Cloudflare www redirect setup](https://developers.cloudflare.com/pages/how-to/www-redirect/),
[exact-match Single Redirects](https://developers.cloudflare.com/rules/url-forwarding/single-redirects/create-dashboard/),
and [Google sitemap fetch troubleshooting](https://support.google.com/webmasters/answer/7451001?hl=en).
