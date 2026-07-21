#!/usr/bin/env node
/**
 * Validate Stocks Radar configuration for the current environment.
 *
 * Usage:
 *   npm run config:validate              # local / PR (lenient)
 *   STOCKS_RADAR_ENV=production npm run config:validate   # strict
 *   npm run config:validate -- --production
 */

import { loadRuntimeConfig, configExists } from "./config.mjs";

const strict =
  process.argv.includes("--production") ||
  process.env.STOCKS_RADAR_ENV === "production" ||
  process.env.VALIDATE_PRODUCTION === "true";

const errors = [];
const warnings = [];

if (!configExists()) {
  errors.push("Missing src/data/site-settings.json");
}

const config = loadRuntimeConfig({ production: strict });

if (!config.app.version) errors.push("settings.app.version is required");
if (!config.app.name) errors.push("settings.app.name is required");

if (config.quotes.staleAfterHours < 1 || config.quotes.staleAfterHours > 72) {
  errors.push("quotes.staleAfterHours must be between 1 and 72");
}

if (strict) {
  if (!config.site.url) {
    errors.push("STOCKS_RADAR_SITE (or CLOUDFRONT_DOMAIN) required in production");
  } else if (/localhost|example\.cloudfront\.net/i.test(config.site.url)) {
    errors.push(`Production site URL looks like a placeholder: ${config.site.url}`);
  }

  if (config.features.adsense || config.adsense.enabled) {
    if (!config.adsense.client.startsWith("ca-pub-")) {
      errors.push("PUBLIC_ADSENSE_CLIENT must be a ca-pub-… id when ads are enabled");
    }
    if (!config.adsense.slots.hero || !config.adsense.slots.board || !config.adsense.slots.footer) {
      warnings.push("AdSense slots incomplete — hero/board/footer recommended before go-live");
    }
    if (config.rawSettings.seo?.requireCustomDomainForAds) {
      if (/cloudfront\.net/i.test(config.site.url || "")) {
        warnings.push(
          "AdSense on CloudFront URL often fails approval — prefer custom domain (DOMAIN.md)"
        );
      }
    }
  }

  if (!config.site.s3Bucket) {
    warnings.push("STOCKS_RADAR_S3_BUCKET unset — deploy sync will fail until secrets exist");
  }
  if (!config.site.distributionId) {
    warnings.push("STOCKS_RADAR_CLOUDFRONT_DISTRIBUTION_ID unset — invalidation will fail");
  }
}

console.log(`Config: ${config.app.name} v${config.app.version} (${config.app.environment})`);
console.log(`Site: ${config.site.url || "(unset)"}`);
console.log(
  `Features: ${Object.entries(config.features)
    .filter(([, v]) => v)
    .map(([k]) => k)
    .join(", ") || "(none)"}`
);
console.log(`Quotes stale after: ${config.quotes.staleAfterHours}h`);
console.log(`OTel: ${config.otel.enabled ? "on" : "off"}`);

for (const w of warnings) console.warn(`⚠ ${w}`);
for (const e of errors) console.error(`✗ ${e}`);

if (errors.length) {
  console.error(`\nconfig:validate failed (${errors.length} error(s))`);
  process.exit(1);
}

console.log(strict ? "\n✓ production config OK" : "\n✓ config OK (lenient)");
