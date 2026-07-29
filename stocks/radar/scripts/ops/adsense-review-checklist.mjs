#!/usr/bin/env node
/**
 * Local/CI checks before requesting AdSense review or enabling live ads.
 * Does not talk to Google — verifies our static build policy gates.
 *
 *   node scripts/adsense-review-checklist.mjs
 *   node scripts/adsense-review-checklist.mjs --dist dist
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
const dc = read("datacenter.html");

if (!index) fail("dist/index.html missing — run npm run build");
else {
  if (/About this page|publisher-content|What StocksWatch publishes/i.test(index)) {
    pass("Home has publisher About content");
  } else fail("Home missing PublisherContent / About section");

  if (/watchlist-board|Master list/i.test(index)) {
    pass("Home includes watchlist board markup");
  } else fail("Home missing watchlist board");

  const adScript = /pagead2\.googlesyndication\.com|adsbygoogle/i.test(index);
  if (adScript) {
    warn("Home loads AdSense script (expected only when CLIENT + gates pass in this build)");
  } else {
    pass("Home has no AdSense script in this build (CLIENT unset or gates blocked — OK for pre-approval)");
  }

  // Ads must not appear before the board section id when present as slots
  const boardIdx = index.indexOf('id="watchlist-board"');
  const adSlotIdx = index.search(/data-ad-placement|class="[^"]*ad-slot/);
  if (adSlotIdx >= 0 && boardIdx >= 0 && adSlotIdx < boardIdx) {
    fail("Ad slot markup appears before #watchlist-board (policy risk)");
  } else if (adSlotIdx >= 0) {
    pass("Any ad slots are after the watchlist board");
  } else {
    pass("No live/preview ad slots in this build (expected until slots enabled)");
  }
}

if (!notFound) fail("dist/404.html missing");
else {
  if (/pagead2\.googlesyndication\.com|adsbygoogle/i.test(notFound)) {
    fail("404 loads AdSense — must not");
  } else pass("404 has no AdSense script");
  if (/noindex/i.test(notFound)) pass("404 is noindex");
  else warn("404 missing noindex (recommended)");
}

if (!dc) fail("dist/datacenter.html missing");
else {
  if (/pagead2\.googlesyndication\.com|adsbygoogle/i.test(dc)) {
    fail("Datacenter loads AdSense — must not (tool UI)");
  } else pass("Datacenter has no AdSense script");
}

console.log(`
Operator steps (cannot be automated here):
  1. AdSense → Ads → Auto ads → OFF for stockswatch.cc
  2. Use only manual Display units (board + footer)
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
