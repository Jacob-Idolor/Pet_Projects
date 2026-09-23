#!/usr/bin/env node
/**
 * Validate Stocks Radar configuration for the current environment.
 *
 * Usage:
 *   npm run config:validate              # local / PR (lenient)
 *   STOCKS_RADAR_ENV=production npm run config:validate   # strict
 *   npm run config:validate -- --production
 */

import { loadRuntimeConfig, configExists } from "../config.mjs";

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

if (strict) {
  if (!config.site.url) {
    errors.push("STOCKS_RADAR_SITE required in production");
  } else if (/localhost|example\.cloudfront\.net/i.test(config.site.url)) {
    errors.push(`Production site URL looks like a placeholder: ${config.site.url}`);
  }

  if (process.env.PUBLIC_ADSENSE_PREVIEW === "true") {
    errors.push("PUBLIC_ADSENSE_PREVIEW must not be true in production builds");
  }

  // The feature flag describes supported placements; live ads are an explicit
  // monetization opt-in. A production build must remain valid while AdSense
  // review or slot configuration is still pending.
  const adsRequested =
    process.env.PUBLIC_ADSENSE_ENABLED === "true" || Boolean(process.env.PUBLIC_ADSENSE_CLIENT);
  if (adsRequested) {
    if (process.env.PUBLIC_ADSENSE_CONSENT_READY !== "true") {
      warnings.push("Ad scripts disabled until PUBLIC_ADSENSE_CONSENT_READY=true after consent setup is verified");
    }
    if (!config.adsense.client.startsWith("ca-pub-")) {
      errors.push("PUBLIC_ADSENSE_CLIENT must be a ca-pub-… id when ads are enabled");
    }
    if (!config.adsense.slots.board || !config.adsense.slots.footer) {
      warnings.push(
        "AdSense board/footer slots incomplete — units stay hidden until PUBLIC_ADSENSE_SLOT_BOARD/FOOTER are set (OK while pending review)"
      );
    }
    if (config.rawSettings.seo?.requireCustomDomainForAds) {
      if (/cloudfront\.net/i.test(config.site.url || "")) {
        warnings.push(
          "AdSense on CloudFront URL often fails approval — prefer custom domain (DOMAIN.md)"
        );
      }
    }
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

for (const w of warnings) console.warn(`⚠ ${w}`);
for (const e of errors) console.error(`✗ ${e}`);

if (errors.length) {
  console.error(`\nconfig:validate failed (${errors.length} error(s))`);
  process.exit(1);
}

console.log(strict ? "\n✓ production config OK" : "\n✓ config OK (lenient)");
