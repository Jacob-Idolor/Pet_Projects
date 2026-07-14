#!/usr/bin/env node
/** Fail if built output contains obvious secret patterns */

import fs from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const distDir = path.resolve(__dirname, "../dist");

const patterns = [
  { name: "AWS access key", re: /AKIA[0-9A-Z]{16}/ },
  { name: "Stripe live key", re: /sk_live_[0-9a-zA-Z]{20,}/ },
  { name: "Private key block", re: /-----BEGIN (RSA |EC )?PRIVATE KEY-----/ },
  { name: "GitHub token", re: /ghp_[0-9a-zA-Z]{30,}/ },
];

function walk(dir, files = []) {
  for (const entry of fs.readdirSync(dir, { withFileTypes: true })) {
    const full = path.join(dir, entry.name);
    if (entry.isDirectory()) walk(full, files);
    else files.push(full);
  }
  return files;
}

if (!fs.existsSync(distDir)) {
  console.error("dist/ not found — run npm run build first");
  process.exit(1);
}

const hits = [];
for (const file of walk(distDir)) {
  if (!/\.(html|js|css|json|svg)$/i.test(file)) continue;
  const text = fs.readFileSync(file, "utf8");
  for (const { name, re } of patterns) {
    if (re.test(text)) hits.push({ file: path.relative(distDir, file), name });
  }
}

if (hits.length) {
  console.error("Possible secrets in dist/:");
  for (const h of hits) console.error(`  ${h.name} in ${h.file}`);
  process.exit(1);
}

console.log("Dist security scan OK (no obvious secret patterns)");
