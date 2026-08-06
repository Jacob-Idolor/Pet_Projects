#!/usr/bin/env node
/**
 * Local/CI checks before requesting AdSense review or enabling live ads.
 * Does not talk to Google — verifies our static build policy gates.
 *
 *   node scripts/ops/adsense-review-checklist.mjs
 *   node scripts/ops/adsense-review-checklist.mjs --dist dist
 */
import { existsSync, readFileSync } from "node:fs";
import { resolve, dirname } from "node:path";
import { fileURLToPath } from "node:url";

const ROOT = resolve(dirname(fileURLToPath(import.meta.url)), "../..");
const args = process.argv.slice(2);
const distIdx = args.indexOf("--dist");
const dist = resolve(ROOT, distIdx >= 0 ? args[distIdx + 1] || "dist" : "dist");

const checks = [];
function pass(msg) {
  checks.push({ ok: true, msg });
  console.log(`✓ ${msg}`);
}
function fail(msg) {
  checks.push({ ok: false, msg });
  console.error(`✗ ${msg}`);
}
function warn(msg) {
  console.warn(`⚠ ${msg}`);
}

function read(rel) {
  const p = resolve(dist, rel);
  if (!existsSync(p)) return null;
  return readFileSync(p, "utf8");
}

console.log("AdSense review checklist (build artifacts + operator reminders)");
console.log(`  dist: ${dist}\n`);

const index = read("index.html");
const notFound = read("404.html");
const watchlist = read("watchlist.html");
const dcRedirect = read("datacenter.html");

if (!index) fail("dist/index.html missing — run npm run build");
else {
  if (/AI Data Center|mainnav|id="layers"/i.test(index)) {
    pass("Home is AI Data Center screener");
  } else fail("Home missing AI Data Center screener markup");

  const adScript = /pagead2\.googlesyndication\.com|adsbygoogle/i.test(index);
  if (adScript) {
    warn("Home loads AdSense script (expected only when CLIENT + gates pass in this build)");
  } else {
    pass("Home has no AdSense script in this build (CLIENT unset or gates blocked — OK for pre-approval)");
  }

  const layersIdx = index.indexOf('id="layers"');
  const adSlotIdx = index.search(/data-ad-placement|class="[^"]*ad-slot/);
  if (adSlotIdx >= 0 && layersIdx >= 0 && adSlotIdx < layersIdx) {
    fail("Ad slot markup appears before #layers (policy risk)");
  } else if (adSlotIdx >= 0) {
    pass("Any ad slots are after the screener main content");
  } else {
    pass("No live/preview ad slots in this build (expected until slots enabled)");
  }
}

if (!watchlist) fail("dist/watchlist.html missing (archived watchlist)");
else {
  if (/watchlist-board|Archived watchlist/i.test(watchlist)) {
    pass("Archived watchlist page present");
  } else fail("watchlist.html missing board / archive banner");
}

if (!notFound) fail("dist/404.html missing");
else {
  if (/pagead2\.googlesyndication\.com|adsbygoogle/i.test(notFound)) {
    fail("404 loads AdSense — must not");
  } else pass("404 has no AdSense script");
  if (/noindex/i.test(notFound)) pass("404 is noindex");
  else warn("404 missing noindex (recommended)");
}

if (!dcRedirect) fail("dist/datacenter.html missing (should redirect to /)");
else {
  if (/refresh|location\.replace|Continue/i.test(dcRedirect)) {
    pass("Legacy datacenter.html redirects to home");
  } else warn("datacenter.html may not redirect — check for bookmarks");
  if (/pagead2\.googlesyndication\.com|adsbygoogle/i.test(dcRedirect)) {
    fail("Redirect page loads AdSense — must not");
  } else pass("Legacy datacenter redirect has no AdSense script");
}

console.log(`
Operator steps (cannot be automated here):
  1. AdSense → Ads → Auto ads → OFF for stockswatch.cc
  2. Use only manual Display units (board + footer on /)
  3. Deploy latest main to production
  4. Spot-check live / and a 404 URL in DevTools (no unexpected pagead requests on 404)
  5. Confirm https://stockswatch.cc/ads.txt
  6. Request site review in AdSense
`);

const failed = checks.filter((c) => !c.ok).length;
if (failed) {
  console.error(`\n${failed} check(s) failed`);
  process.exit(1);
}
console.log("Build-side AdSense policy checks passed.");
