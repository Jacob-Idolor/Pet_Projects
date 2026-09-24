#!/usr/bin/env node
/** Verify that a production build contains the public release surfaces. */

import { existsSync, readFileSync, readdirSync } from "node:fs";
import { resolve, dirname, basename, relative } from "node:path";
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
  "research-kit.html",
  "downloads/ai-infrastructure-research-kit.md",
  "workflow-pack.html",
  "downloads/research-workflow-sample.md",
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
  ["sitemap.xml", /research-kit\.html/],
  ["research-kit.html", /downloads\/ai-infrastructure-research-kit\.md/],
  ["workflow-pack.html", /downloads\/research-workflow-sample\.md/],
  ["sitemap.xml", /workflow-pack\.html/],
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
const retiredFiles = ["screener.json", "dc-movers.json", "datacenter"].filter((file) => existsSync(resolve(DIST, file)));
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
