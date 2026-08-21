# Deploy

Production hosting is **unconfigured**. The previous AWS S3 + CloudFront stack was destroyed.

- **Domain:** [`stockswatch.cc`](https://stockswatch.cc) is registered on Cloudflare (Free DNS). No origin is attached yet — you can point it at anything.
- **Local:** `cd stocks/radar && npm run dev`
- **CI:** Stocks Radar validate only (build, tests, Playwright). There is no deploy workflow.

When you pick a host (Cloudflare Pages, Amplify, S3 + CloudFront, etc.), document it here and wire DNS in Cloudflare (grey-cloud CNAMEs or the host’s recommended records).
