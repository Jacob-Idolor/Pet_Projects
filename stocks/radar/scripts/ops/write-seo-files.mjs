#!/usr/bin/env node
/**
 * Writes public/robots.txt, public/sitemap.xml, and public/ads.txt
 * from STOCKS_RADAR_SITE + PUBLIC_ADSENSE_CLIENT (build-time).
 */

import { writeFileSync } from "node:fs";
import { resolve, dirname } from "node:path";
import { fileURLToPath } from "node:url";

const ROOT = resolve(dirname(fileURLToPath(import.meta.url)), "../..");
const PUBLIC = resolve(ROOT, "public");

const rawSite = (process.env.STOCKS_RADAR_SITE ?? "https://stockswatch.cc").replace(
  /\/$/,
  "",
);
const site = rawSite.startsWith("http") ? rawSite : `https://${rawSite}`;
const client = (process.env.PUBLIC_ADSENSE_CLIENT ?? "").trim();

const robots = `User-agent: *
Allow: /

Sitemap: ${site}/sitemap.xml
`;

const sitemap = `<?xml version="1.0" encoding="UTF-8"?>
<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">
  <url>
    <loc>${site}/</loc>
    <changefreq>hourly</changefreq>
    <priority>1.0</priority>
  </url>
  <url>
    <loc>${site}/watchlist.html</loc>
    <changefreq>daily</changefreq>
    <priority>0.5</priority>
  </url>
</urlset>
`;

writeFileSync(resolve(PUBLIC, "robots.txt"), robots);
writeFileSync(resolve(PUBLIC, "sitemap.xml"), sitemap);
console.log(`✓ robots.txt + sitemap.xml → ${site}`);

if (client && /^ca-pub-\d+$/i.test(client)) {
  const pub = client.replace(/^ca-pub-/i, "pub-");
  const adsTxt = `google.com, ${pub}, DIRECT, f08c47fec0942fa0\n`;
  writeFileSync(resolve(PUBLIC, "ads.txt"), adsTxt);
  console.log(`✓ ads.txt (${pub})`);
} else {
  // Keep a stub so CloudFront always has /ads.txt once enabled
  const stub =
    "# Set PUBLIC_ADSENSE_CLIENT=ca-pub-... at build time to publish ads.txt\n";
  writeFileSync(resolve(PUBLIC, "ads.txt"), stub);
  console.log("✓ ads.txt (stub — set PUBLIC_ADSENSE_CLIENT to publish)");
}
