#!/usr/bin/env node
/**
 * Fetch live quotes + technical metrics for watchlist symbols → public/quotes.json
 * Run locally: npm run update-quotes
 * CI runs this before every deploy and on a schedule.
 */

import { readFileSync, writeFileSync } from "node:fs";
import { resolve, dirname } from "node:path";
import { fileURLToPath } from "node:url";
import { buildMetrics } from "./market-metrics.mjs";

const __dirname = dirname(fileURLToPath(import.meta.url));
const ROOT = resolve(__dirname, "..");
const WATCHLIST = resolve(ROOT, "src/data/watchlist.json");
const OUT = resolve(ROOT, "public/quotes.json");

const delay = (ms) => new Promise((r) => setTimeout(r, ms));

const HEADERS = { Accept: "application/json", "User-Agent": "stocks-radar/1.0" };

async function fetchChart(symbol, range) {
  const url = `https://query1.finance.yahoo.com/v8/finance/chart/${encodeURIComponent(symbol)}?interval=1d&range=${range}`;
  const res = await fetch(url, { headers: HEADERS });
  if (!res.ok) return null;
  return res.json();
}

async function fetchSymbol(symbol) {
  try {
    const [chart1y, chartMax] = await Promise.all([fetchChart(symbol, "1y"), fetchChart(symbol, "max")]);
    const result = chart1y?.chart?.result?.[0];
    const meta = result?.meta;
    if (!meta?.regularMarketPrice) return null;

    const quote = result?.indicators?.quote?.[0] ?? {};
    const closes = (quote.close ?? []).filter((c) => c != null);
    const volumes = quote.volume ?? [];

    const maxResult = chartMax?.chart?.result?.[0];
    const maxQuote = maxResult?.indicators?.quote?.[0] ?? {};
    const highs = maxQuote.high ?? [];
    const timestamps = maxResult?.timestamp ?? [];

    const price = meta.regularMarketPrice;
    const prevClose =
      closes.length >= 2 ? closes[closes.length - 2] : meta.chartPreviousClose ?? null;
    const changePct =
      prevClose != null && prevClose !== 0 ? ((price - prevClose) / prevClose) * 100 : null;

    const metrics = buildMetrics(price, closes, meta, volumes, highs, timestamps);

    return {
      price,
      changePct,
      prevClose,
      currency: meta.currency ?? "USD",
      name: meta.longName ?? meta.shortName ?? symbol,
      ...metrics,
    };
  } catch {
    return null;
  }
}

async function fetchAll(symbols) {
  const quotes = {};
  const chunkSize = 10;

  for (let i = 0; i < symbols.length; i += chunkSize) {
    const chunk = symbols.slice(i, i + chunkSize);
    const results = await Promise.all(
      chunk.map(async (symbol) => {
        const q = await fetchSymbol(symbol);
        return q ? [symbol, q] : null;
      })
    );
    for (const row of results) {
      if (row) quotes[row[0]] = row[1];
    }
    if (i + chunkSize < symbols.length) await delay(400);
  }

  return quotes;
}

const watchlist = JSON.parse(readFileSync(WATCHLIST, "utf8"));
const symbols = [...new Set(watchlist.stocks.map((s) => s.symbol))];

console.log(`Fetching quotes + technicals for ${symbols.length} symbols…`);
const quotes = await fetchAll(symbols);

const payload = {
  updatedAt: new Date().toISOString(),
  marketTime: "US/Eastern",
  schemaVersion: 3,
  count: Object.keys(quotes).length,
  total: symbols.length,
  quotes,
};

writeFileSync(OUT, JSON.stringify(payload, null, 2) + "\n");
console.log(`✓ quotes.json — ${payload.count}/${payload.total} symbols (${payload.updatedAt})`);
