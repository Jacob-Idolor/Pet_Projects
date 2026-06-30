#!/usr/bin/env node
/**
 * Fetch live quotes for all symbols in watchlist.json → public/quotes.json
 * Run locally: npm run update-quotes
 * CI runs this before every deploy and on a schedule.
 */

import { readFileSync, writeFileSync } from "node:fs";
import { resolve, dirname } from "node:path";
import { fileURLToPath } from "node:url";

const __dirname = dirname(fileURLToPath(import.meta.url));
const ROOT = resolve(__dirname, "..");
const WATCHLIST = resolve(ROOT, "src/data/watchlist.json");
const OUT = resolve(ROOT, "public/quotes.json");

const delay = (ms) => new Promise((r) => setTimeout(r, ms));

async function fetchOne(symbol) {
  try {
    const url = `https://query1.finance.yahoo.com/v8/finance/chart/${encodeURIComponent(symbol)}?interval=1d&range=1d`;
    const res = await fetch(url, {
      headers: { Accept: "application/json", "User-Agent": "stocks-radar/1.0" },
    });
    if (!res.ok) return null;
    const data = await res.json();
    const meta = data?.chart?.result?.[0]?.meta;
    if (!meta?.regularMarketPrice) return null;
    return {
      price: meta.regularMarketPrice,
      changePct: meta.regularMarketChangePercent ?? null,
      prevClose: meta.chartPreviousClose ?? null,
      currency: meta.currency ?? "USD",
    };
  } catch {
    return null;
  }
}

async function fetchAll(symbols) {
  const quotes = {};
  const chunkSize = 15;

  for (let i = 0; i < symbols.length; i += chunkSize) {
    const chunk = symbols.slice(i, i + chunkSize);
    const results = await Promise.all(
      chunk.map(async (symbol) => {
        const q = await fetchOne(symbol);
        return q ? [symbol, q] : null;
      })
    );
    for (const row of results) {
      if (row) quotes[row[0]] = row[1];
    }
    if (i + chunkSize < symbols.length) await delay(300);
  }

  return quotes;
}

const watchlist = JSON.parse(readFileSync(WATCHLIST, "utf8"));
const symbols = [...new Set(watchlist.stocks.map((s) => s.symbol))];

console.log(`Fetching quotes for ${symbols.length} symbols…`);
const quotes = await fetchAll(symbols);

const payload = {
  updatedAt: new Date().toISOString(),
  marketTime: "US/Eastern",
  count: Object.keys(quotes).length,
  total: symbols.length,
  quotes,
};

writeFileSync(OUT, JSON.stringify(payload, null, 2) + "\n");
console.log(`✓ quotes.json — ${payload.count}/${payload.total} symbols (${payload.updatedAt})`);
