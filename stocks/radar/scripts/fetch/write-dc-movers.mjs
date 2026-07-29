#!/usr/bin/env node
/**
 * Build a tiny home-page movers payload from screener.json.
 * Avoids fetching ~100KB screener.json on every `/` view (DatacenterBridge).
 *
 *   node scripts/write-dc-movers.mjs
 */
import { existsSync, readFileSync, writeFileSync } from "node:fs";
import { resolve, dirname } from "node:path";
import { fileURLToPath } from "node:url";

const ROOT = resolve(dirname(fileURLToPath(import.meta.url)), "../..");
const IN = resolve(ROOT, "public/screener.json");
const OUT = resolve(ROOT, "public/dc-movers.json");
const TOP_N = 3;

const JSON_SPACE =
  process.env.QUOTES_PRETTY === "1" ||
  (!process.env.GITHUB_ACTIONS && process.env.STOCKS_RADAR_ENV !== "production")
    ? 2
    : undefined;

if (!existsSync(IN)) {
  console.warn("write-dc-movers: no screener.json — skipping");
  process.exit(0);
}

const data = JSON.parse(readFileSync(IN, "utf8"));
const seen = new Set();
const rows = [];

for (const layer of data.layers || []) {
  for (const h of layer.holdings || []) {
    const ticker = String(h.ticker || "").toUpperCase();
    if (!ticker || seen.has(ticker)) continue;
    seen.add(ticker);
    const m = h.market || {};
    const chg = Number(m.change_pct);
    if (m.ok === false || !Number.isFinite(chg)) continue;
    rows.push({
      ticker,
      name: h.name || ticker,
      chg,
      layerId: layer.id,
    });
  }
}

rows.sort((a, b) => b.chg - a.chg);
const gainers = rows.slice(0, TOP_N);
const losers = rows.slice(-TOP_N).reverse();

const payload = {
  updatedAt: new Date().toISOString(),
  sourceFetchedAt: data.fetched_at_iso || data.fetched_at || null,
  gainers,
  losers,
};

writeFileSync(OUT, JSON.stringify(payload, null, JSON_SPACE) + "\n");
console.log(
  `✓ dc-movers.json — ${gainers.length} gainers / ${losers.length} losers (from ${rows.length} priced)`
);
