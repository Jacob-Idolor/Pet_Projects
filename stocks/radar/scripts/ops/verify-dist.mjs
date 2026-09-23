#!/usr/bin/env node
/** Verify that a production build contains the public release surfaces. */

import { existsSync, readFileSync } from "node:fs";
import { resolve, dirname } from "node:path";
import { fileURLToPath } from "node:url";

const ROOT = resolve(dirname(fileURLToPath(import.meta.url)), "../..");
const DIST = resolve(ROOT, "dist");
const requiredFiles = [
  "index.html",
  "404.html",
  "datacenter.html",
  "guides/nbis-research-guide.html",
  "guides/nbis-sec-filings.html",
  "privacy.html",
  "nbis.json",
  "health.json",
  "settings.json",
  "robots.txt",
  "sitemap.xml",
];
const contentChecks = [
  ["index.html", /application\/ld\+json/],
  ["index.html", /How to read this desk/],
  ["guides/nbis-research-guide.html", /How to read the NBIS research desk/],
  ["guides/nbis-sec-filings.html", /How to read NBIS SEC filings/],
  ["sitemap.xml", /guides\/nbis-research-guide\.html/],
  ["sitemap.xml", /guides\/nbis-sec-filings\.html/],
  ["sitemap.xml", /privacy\.html/],
];

const missingFiles = requiredFiles.filter((file) => !existsSync(resolve(DIST, file)));
const retiredFiles = ["screener.json", "dc-movers.json", "datacenter"].filter((file) => existsSync(resolve(DIST, file)));
const missingContent = contentChecks.filter(([file, pattern]) => {
  if (!existsSync(resolve(DIST, file))) return true;
  return !pattern.test(readFileSync(resolve(DIST, file), "utf8"));
});

if (missingFiles.length || missingContent.length || retiredFiles.length) {
  for (const file of retiredFiles) console.error(`✗ historical artifact must not ship: dist/${file}`);
  for (const file of missingFiles) console.error(`✗ missing dist/${file}`);
  for (const [file, pattern] of missingContent) console.error(`✗ dist/${file} missing ${pattern}`);
  process.exit(1);
}

console.log(`✓ static release verified — ${requiredFiles.length} required files and discovery markers present`);
