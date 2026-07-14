#!/usr/bin/env node
/** Verify internal links in built static HTML resolve to files in dist/ */

import fs from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const distDir = path.resolve(__dirname, "../dist");

if (!fs.existsSync(distDir)) {
  console.error("dist/ not found — run npm run build first");
  process.exit(1);
}

const htmlFiles = [];
function walk(dir) {
  for (const entry of fs.readdirSync(dir, { withFileTypes: true })) {
    const full = path.join(dir, entry.name);
    if (entry.isDirectory()) walk(full);
    else if (entry.name.endsWith(".html")) htmlFiles.push(full);
  }
}
walk(distDir);

const hrefRe = /href="(\/[^"#?]+(?:\.html)?)"/g;
const broken = [];

for (const file of htmlFiles) {
  const content = fs.readFileSync(file, "utf8");
  let match;
  while ((match = hrefRe.exec(content)) !== null) {
    let href = match[1];
    if (href.endsWith("/")) href = href.slice(0, -1);
    let target = path.join(distDir, href.replace(/^\//, ""));
    if (!target.endsWith(".html") && !fs.existsSync(target)) {
      target += ".html";
    }
    if (!fs.existsSync(target)) {
      broken.push({ from: path.relative(distDir, file), href });
    }
  }
}

if (broken.length) {
  console.error("Broken internal links:");
  for (const b of broken) console.error(`  ${b.from} → ${b.href}`);
  process.exit(1);
}

console.log(`Link check OK (${htmlFiles.length} HTML files)`);
