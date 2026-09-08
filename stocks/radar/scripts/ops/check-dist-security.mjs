#!/usr/bin/env node
/** Fail the release if obvious credentials are present in the static bundle. */

import { existsSync, readdirSync, readFileSync } from "node:fs";
import { relative, resolve } from "node:path";

const DIST = resolve(process.cwd(), "dist");
const patterns = [
  { name: "private key", re: /-----BEGIN [A-Z ]*PRIVATE KEY-----/ },
  { name: "AWS access key", re: /\b(?:AKIA|ASIA)[0-9A-Z]{16}\b/ },
  { name: "GitHub token", re: /\b(?:ghp|github_pat)_[A-Za-z0-9_]{20,}\b/ },
  { name: "Cloudflare API token", re: /\bv4\.sig\.[A-Za-z0-9_-]{20,}\b/ },
  { name: "generic secret assignment", re: /\b(?:SECRET|PASSWORD|PRIVATE_KEY)\s*[=:]\s*["'][^"']{12,}["']/i },
];

if (!existsSync(DIST)) {
  console.error("dist/ does not exist; run the production build before the bundle security scan.");
  process.exit(1);
}

const files = [];
function walk(dir) {
  for (const entry of readdirSync(dir, { withFileTypes: true })) {
    const path = resolve(dir, entry.name);
    if (entry.isDirectory()) walk(path);
    else files.push(path);
  }
}
walk(DIST);

const findings = [];
for (const file of files) {
  const buffer = readFileSync(file);
  if (buffer.includes(0)) continue;
  const text = buffer.toString("utf8");
  for (const pattern of patterns) {
    if (pattern.re.test(text)) findings.push({ name: pattern.name, file: relative(DIST, file) });
  }
}

if (findings.length) {
  console.error("Possible credentials found in dist/:");
  for (const finding of findings) console.error(`- ${finding.name}: ${finding.file}`);
  process.exit(1);
}

console.log(`Dist security scan OK (${files.length} files checked).`);
