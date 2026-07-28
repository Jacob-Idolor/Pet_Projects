#!/usr/bin/env node
/**
 * Offline screener.json schema smoke — no Yahoo / network.
 * Catches broken or truncated committed baselines in PR validate.
 *
 * Usage: node scripts/validate-screener-schema.mjs [path]
 */
import { existsSync, readFileSync } from "node:fs";
import { resolve, dirname } from "node:path";
import { fileURLToPath } from "node:url";

const ROOT = resolve(dirname(fileURLToPath(import.meta.url)), "..");
const path = resolve(ROOT, process.argv[2] || "public/screener.json");
const EXPECTED_LAYERS = ["land", "power", "cooling", "compute", "networking", "software"];
const minOkRatio = Number(process.env.SCREENER_MIN_OK_RATIO || 0.85);

if (!existsSync(path)) {
  console.error(`✗ missing ${path}`);
  process.exit(1);
}

let data;
try {
  data = JSON.parse(readFileSync(path, "utf8"));
} catch (e) {
  console.error(`✗ invalid JSON: ${e.message || e}`);
  process.exit(1);
}

const errors = [];
const okCount = Number(data.ok_count);
const tickerCount = Number(data.ticker_count);

if (!Number.isFinite(okCount)) errors.push("ok_count missing/non-numeric");
if (!Number.isFinite(tickerCount) || tickerCount < 1) errors.push("ticker_count missing/invalid");
if (!data.fetched_at && !data.fetched_at_iso) errors.push("fetched_at / fetched_at_iso missing");
if (!Array.isArray(data.layers) || data.layers.length < 1) errors.push("layers[] missing");

if (Array.isArray(data.layers)) {
  const ids = new Set(data.layers.map((l) => l?.id).filter(Boolean));
  for (const id of EXPECTED_LAYERS) {
    if (!ids.has(id)) errors.push(`missing layer id: ${id}`);
  }
  for (const layer of data.layers) {
    if (!Array.isArray(layer.holdings)) {
      errors.push(`layer ${layer.id || "?"} missing holdings[]`);
      continue;
    }
    for (const h of layer.holdings.slice(0, 3)) {
      if (!h?.ticker) errors.push(`holding without ticker in ${layer.id}`);
      if (!h?.market || typeof h.market !== "object") {
        errors.push(`holding ${h?.ticker || "?"} missing market object`);
      }
    }
  }
}

if (Number.isFinite(okCount) && Number.isFinite(tickerCount) && tickerCount > 0) {
  const ratio = okCount / tickerCount;
  if (ratio < minOkRatio) {
    errors.push(`ok coverage ${(ratio * 100).toFixed(0)}% < ${minOkRatio * 100}%`);
  }
}

if (errors.length) {
  console.error(`✗ screener schema (${path}):`);
  for (const e of errors) console.error(`  - ${e}`);
  process.exit(1);
}

console.log(
  `✓ screener schema OK — ${okCount}/${tickerCount} ok · ${data.layers.length} layers · ${path}`
);
