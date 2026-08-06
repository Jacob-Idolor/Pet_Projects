#!/usr/bin/env node
/**
 * Content-hash datacenter JS/CSS so CloudFront can cache them immutably.
 * Writes hashed copies + src/data/datacenter-asset-manifest.json for Astro.
 *
 * Source files stay unhashed under public/datacenter/ for local editing;
 * hashed copies are what the page references after prebuild.
 */
import { createHash } from "node:crypto";
import { existsSync, mkdirSync, readdirSync, readFileSync, unlinkSync, writeFileSync } from "node:fs";
import { basename, dirname, join, resolve } from "node:path";
import { fileURLToPath } from "node:url";

const ROOT = resolve(dirname(fileURLToPath(import.meta.url)), "../..");
const DC = resolve(ROOT, "public/datacenter");
const MANIFEST = resolve(ROOT, "src/data/datacenter-asset-manifest.json");

const SOURCES = ["static-api.js", "app.js", "map.js", "backtest.js", "style.css"];

function shortHash(buf) {
  return createHash("sha256").update(buf).digest("hex").slice(0, 10);
}

function hashedName(file, hash) {
  const i = file.lastIndexOf(".");
  if (i < 0) return `${file}.${hash}`;
  return `${file.slice(0, i)}.${hash}${file.slice(i)}`;
}

/** Match app.abc123def0.js / style.abc123def0.css */
function isHashedSibling(name, source) {
  const i = source.lastIndexOf(".");
  const stem = i < 0 ? source : source.slice(0, i);
  const ext = i < 0 ? "" : source.slice(i);
  return new RegExp(`^${stem}\\.[a-f0-9]{10}${ext.replace(".", "\\.")}$`).test(name);
}

if (!existsSync(DC)) {
  console.error("Missing public/datacenter");
  process.exit(1);
}

mkdirSync(dirname(MANIFEST), { recursive: true });

const manifest = { generatedAt: new Date().toISOString(), files: {} };

for (const source of SOURCES) {
  const srcPath = join(DC, source);
  if (!existsSync(srcPath)) {
    console.error(`Missing ${srcPath}`);
    process.exit(1);
  }
  const body = readFileSync(srcPath);
  const hash = shortHash(body);
  const out = hashedName(source, hash);
  const outPath = join(DC, out);

  // Remove prior hashed siblings for this source
  for (const name of readdirSync(DC)) {
    if (isHashedSibling(name, source) && name !== out) {
      unlinkSync(join(DC, name));
    }
  }

  writeFileSync(outPath, body);
  manifest.files[source] = out;
  console.log(`  ${source} → ${out}`);
}

writeFileSync(MANIFEST, JSON.stringify(manifest, null, 2) + "\n");
console.log(`✓ datacenter assets hashed → ${basename(MANIFEST)}`);
