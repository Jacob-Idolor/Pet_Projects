#!/usr/bin/env node
/** Verify that a production build contains the public release surfaces. */

import { existsSync, readFileSync, readdirSync } from "node:fs";
import { resolve, dirname, basename, relative } from "node:path";
import { fileURLToPath } from "node:url";

const ROOT = resolve(dirname(fileURLToPath(import.meta.url)), "../..");
const DIST = resolve(ROOT, "dist");
const requiredFiles = [
  "index.html", "guides.html", "resources.html", "about.html", "privacy.html", "404.html",
  "guides/before-you-automate.html", "guides/ai-output-you-can-check.html", "guides/starting-smaller.html",
  "build-meta.json", "robots.txt", "sitemap.xml",
];
const contentChecks = [
  ["index.html", /Make room for life/],
  ["guides.html", /Before you automate/],
  ["about.html", /Jacob Builds/],
  ["sitemap.xml", /guides\/before-you-automate\.html/],
];

// The full product is distributed separately through a protected checkout.
const pack = JSON.parse(readFileSync(resolve(ROOT, "src/data/workflow-pack.json"), "utf8"));
const privateNames = new Set(pack.files.map(({ name }) => name.toLowerCase()));
function findPrivateFiles(dir) {
  if (!existsSync(dir)) return [];
  return readdirSync(dir, { withFileTypes: true }).flatMap((entry) => {
    const path = resolve(dir, entry.name);
    const name = basename(path).toLowerCase();
    if (name === ".private-products" || privateNames.has(name) || /^stockswatch-research-workflow-pack.*\.zip$/i.test(name)) return [relative(DIST, path)];
    return entry.isDirectory() ? findPrivateFiles(path) : [];
  });
}
const privateFiles = findPrivateFiles(DIST);

const missingFiles = requiredFiles.filter((file) => !existsSync(resolve(DIST, file)));
const retiredFiles = ["screener.json", "dc-movers.json", "datacenter", "nbis.json", "health.json", "settings.json", "downloads", "watchlist-board.mjs", "ads.txt"].filter((file) => existsSync(resolve(DIST, file)));
const missingContent = contentChecks.filter(([file, pattern]) => {
  if (!existsSync(resolve(DIST, file))) return true;
  return !pattern.test(readFileSync(resolve(DIST, file), "utf8"));
});

if (missingFiles.length || missingContent.length || retiredFiles.length || privateFiles.length) {
  for (const file of privateFiles) console.error(`✗ paid product must not ship publicly: dist/${file}`);
  for (const file of retiredFiles) console.error(`✗ historical artifact must not ship: dist/${file}`);
  for (const file of missingFiles) console.error(`✗ missing dist/${file}`);
  for (const [file, pattern] of missingContent) console.error(`✗ dist/${file} missing ${pattern}`);
  process.exit(1);
}

console.log(`✓ static release verified — ${requiredFiles.length} required files and discovery markers present`);
