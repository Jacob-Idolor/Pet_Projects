#!/usr/bin/env node
/**
 * Merge a CSV of tickers into watchlist.json
 *
 * Usage:
 *   node scripts/csv-to-watchlist.mjs my-tickers.csv
 *   node scripts/csv-to-watchlist.mjs my-tickers.csv --replace
 *
 * CSV columns (header row optional):
 *   symbol, name, category, sector, tags, targetPrice, targetNote, thesis, priority, addedBy, holder, lastPrice
 *
 * Minimal CSV — one symbol per line also works:
 *   NVDA
 *   AAPL
 */

import { readFileSync, writeFileSync } from "node:fs";
import { resolve, dirname } from "node:path";
import { fileURLToPath } from "node:url";

const __dirname = dirname(fileURLToPath(import.meta.url));
const WATCHLIST_PATH = resolve(__dirname, "../../src/data/watchlist.json");

const VALID_CATEGORIES = new Set(["owned", "targets", "watching"]);

function parseCsv(text) {
  const lines = text
    .split(/\r?\n/)
    .map((l) => l.trim())
    .filter(Boolean);

  if (!lines.length) return [];

  const first = lines[0].toLowerCase();
  const hasHeader = first.includes("symbol");
  const dataLines = hasHeader ? lines.slice(1) : lines;

  if (hasHeader) {
    const headers = lines[0].split(",").map((h) => h.trim().toLowerCase());
    return dataLines.map((line) => {
      const cols = splitCsvLine(line);
      const row = {};
      headers.forEach((h, i) => {
        row[h] = (cols[i] ?? "").trim();
      });
      return rowToStock(row);
    });
  }

  return dataLines.map((line) => {
    const cols = splitCsvLine(line);
    return rowToStock({
      symbol: cols[0],
      name: cols[1],
      category: cols[2],
      targetprice: cols[3],
      targetnote: cols[4],
      thesis: cols[5],
      addedby: cols[6],
      holder: cols[7],
      lastprice: cols[8],
    });
  });
}

function splitCsvLine(line) {
  const out = [];
  let cur = "";
  let inQuotes = false;
  for (const ch of line) {
    if (ch === '"') {
      inQuotes = !inQuotes;
      continue;
    }
    if (ch === "," && !inQuotes) {
      out.push(cur);
      cur = "";
      continue;
    }
    cur += ch;
  }
  out.push(cur);
  return out.map((s) => s.trim());
}

function rowToStock(row) {
  const symbol = (row.symbol ?? "").toUpperCase();
  if (!symbol) return null;

  const category = (row.category ?? "watching").toLowerCase();
  const cat = VALID_CATEGORIES.has(category) ? category : "watching";

  const num = (v) => {
    if (v == null || v === "") return undefined;
    const n = Number(v);
    return Number.isFinite(n) ? n : undefined;
  };

  const stock = {
    id: `${symbol.toLowerCase()}-${cat}`,
    symbol,
    name: row.name || symbol,
    category: cat,
  };

  const lastPrice = num(row.lastprice ?? row.last_price);
  const targetPrice = num(row.targetprice ?? row.target_price);
  if (lastPrice != null) stock.lastPrice = lastPrice;
  if (targetPrice != null) stock.targetPrice = targetPrice;
  if (row.targetnote) stock.targetNote = row.targetnote;
  if (row.thesis) stock.thesis = row.thesis;
  if (row.addedby) stock.addedBy = row.addedby;
  if (row.holder) stock.holder = row.holder;
  if (row.sector) stock.sector = row.sector;
  if (row.priority) stock.priority = row.priority;
  if (row.tags) {
    stock.tags = row.tags.split(/[;|]/).map((t) => t.trim()).filter(Boolean);
  }

  return stock;
}

const csvPath = process.argv[2];
const replace = process.argv.includes("--replace");

if (!csvPath) {
  console.error("Usage: node scripts/csv-to-watchlist.mjs <file.csv> [--replace]");
  process.exit(1);
}

const csvText = readFileSync(resolve(csvPath), "utf8");
const incoming = parseCsv(csvText).filter(Boolean);

const watchlist = JSON.parse(readFileSync(WATCHLIST_PATH, "utf8"));

if (replace) {
  watchlist.stocks = incoming;
} else {
  const byId = new Map(watchlist.stocks.map((s) => [s.id, s]));
  for (const s of incoming) {
    byId.set(s.id, s);
  }
  watchlist.stocks = [...byId.values()].sort((a, b) =>
    a.symbol.localeCompare(b.symbol)
  );
}

watchlist.meta.lastUpdated = new Date().toISOString().slice(0, 10);
writeFileSync(WATCHLIST_PATH, JSON.stringify(watchlist, null, 2) + "\n");

console.log(`✓ watchlist.json now has ${watchlist.stocks.length} tickers`);
