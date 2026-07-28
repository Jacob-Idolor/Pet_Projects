#!/usr/bin/env node
/**
 * Fetch live quotes + technical metrics for watchlist symbols → public/quotes.json
 * Run locally: npm run update-quotes
 * CI runs this before every deploy and on the quotes-refresh workflow.
 *
 * Resilience:
 *  - Retries per symbol with backoff
 *  - Keeps last-known quotes for symbols that fail this run (partial merge)
 *  - Writes health metadata (failedSymbols, partial, fetchedAt) for the UI
 *
 * Optional OpenTelemetry (no-op unless OTEL_EXPORTER_OTLP_ENDPOINT is set):
 *   OTEL_EXPORTER_OTLP_ENDPOINT=http://localhost:4318 npm run update-quotes
 *   See OBSERVABILITY.md
 */

import { existsSync, readFileSync, writeFileSync } from "node:fs";
import { resolve, dirname } from "node:path";
import { fileURLToPath } from "node:url";
import { buildMetrics } from "./market-metrics.mjs";
import { withOtel } from "./otel.mjs";
import { loadRuntimeConfig } from "./config.mjs";

const __dirname = dirname(fileURLToPath(import.meta.url));
const ROOT = resolve(__dirname, "..");
const WATCHLIST = resolve(ROOT, "src/data/watchlist.json");
const OUT = resolve(ROOT, "public/quotes.json");
const runtime = loadRuntimeConfig();

const delay = (ms) => new Promise((r) => setTimeout(r, ms));

const HEADERS = {
  Accept: "application/json",
  "User-Agent": "stocks-radar/1.1 (+https://github.com/Jacob-Idolor/Pet_Projects)",
};

const MAX_RETRIES = runtime.quotes.yahooMaxRetries;
const RETRY_BASE_MS = 500;
/** Quotes older than this (hours) are treated as stale in the UI. */
const STALE_AFTER_HOURS = runtime.quotes.staleAfterHours;
const CHUNK_SIZE = runtime.quotes.yahooChunkSize;

function loadPreviousQuotes() {
  if (!existsSync(OUT)) return { quotes: {}, fetchedAt: null };
  try {
    const prev = JSON.parse(readFileSync(OUT, "utf8"));
    return {
      quotes: prev.quotes && typeof prev.quotes === "object" ? prev.quotes : {},
      fetchedAt: prev.fetchedAt || prev.updatedAt || null,
    };
  } catch {
    return { quotes: {}, fetchedAt: null };
  }
}

async function fetchSymbolOnce(symbol) {
  const url = `https://query1.finance.yahoo.com/v8/finance/chart/${encodeURIComponent(symbol)}?interval=1d&range=max`;
  const res = await fetch(url, { headers: HEADERS });
  if (res.status === 429) {
    const err = new Error(`rate-limited ${symbol}`);
    err.retryable = true;
    err.status = 429;
    throw err;
  }
  if (!res.ok) {
    const err = new Error(`HTTP ${res.status} for ${symbol}`);
    err.retryable = res.status >= 500;
    err.status = res.status;
    throw err;
  }

  const data = await res.json();
  const result = data?.chart?.result?.[0];
  const meta = result?.meta;
  if (!meta?.regularMarketPrice) {
    const err = new Error(`no price for ${symbol}`);
    err.retryable = false;
    throw err;
  }

  const quote = result?.indicators?.quote?.[0] ?? {};
  const closes = (quote.close ?? []).filter((c) => c != null);
  const volumes = quote.volume ?? [];
  const highs = quote.high ?? [];
  const timestamps = result?.timestamp ?? [];

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
}

async function fetchSymbol(symbol, otel) {
  return otel.withSpan(
    "yahoo.fetch_symbol",
    async (span) => {
      span.setAttributes({
        "stock.symbol": symbol,
        "http.url.host": "query1.finance.yahoo.com",
      });
      let lastErr = null;
      for (let attempt = 0; attempt < MAX_RETRIES; attempt++) {
        span.setAttribute("yahoo.attempt", attempt + 1);
        try {
          const q = await fetchSymbolOnce(symbol);
          span.setAttributes({
            "yahoo.ok": true,
            "stock.price": q.price,
          });
          return q;
        } catch (e) {
          lastErr = e;
          span.addEvent("yahoo.fetch_retry", {
            "yahoo.attempt": attempt + 1,
            "error.message": String(e.message || e),
            "http.status_code": e.status ?? 0,
          });
          const retryable = e.retryable !== false;
          if (!retryable || attempt === MAX_RETRIES - 1) break;
          await delay(RETRY_BASE_MS * 2 ** attempt + Math.floor(Math.random() * 200));
        }
      }
      span.setAttributes({
        "yahoo.ok": false,
        "error.message": String(lastErr?.message || lastErr),
      });
      console.warn(`  ⚠ ${symbol}: ${lastErr?.message || lastErr}`);
      return null;
    },
    { "stock.symbol": symbol }
  );
}

async function fetchAll(symbols, otel) {
  const quotes = {};
  const failed = [];
  const chunkSize = CHUNK_SIZE;

  for (let i = 0; i < symbols.length; i += chunkSize) {
    const chunk = symbols.slice(i, i + chunkSize);
    const results = await Promise.all(
      chunk.map(async (symbol) => {
        const q = await fetchSymbol(symbol, otel);
        return [symbol, q];
      })
    );
    for (const [symbol, q] of results) {
      if (q) quotes[symbol] = q;
      else failed.push(symbol);
    }
    if (i + chunkSize < symbols.length) await delay(450);
  }

  return { quotes, failed };
}

await withOtel("stocks-radar-quotes", async (otel) => {
  await otel.withSpan("fetch-quotes.run", async (root) => {
    const watchlist = JSON.parse(readFileSync(WATCHLIST, "utf8"));
    const symbols = [...new Set(watchlist.stocks.map((s) => s.symbol))];
    const previous = loadPreviousQuotes();

    root.setAttributes({
      "radar.symbol_count": symbols.length,
      "radar.had_previous_quotes": Object.keys(previous.quotes).length > 0,
    });

    console.log(`Fetching quotes + technicals for ${symbols.length} symbols…`);
    const { quotes: fresh, failed } = await fetchAll(symbols, otel);

    const merged = { ...fresh };
    const carried = [];
    for (const sym of failed) {
      if (previous.quotes[sym]) {
        merged[sym] = {
          ...previous.quotes[sym],
          _carriedForward: true,
          _carriedFrom: previous.fetchedAt,
        };
        carried.push(sym);
      }
    }

    const now = new Date().toISOString();
    const missing = failed.filter((s) => !merged[s]);
    const partial = failed.length > 0;
    const coverage = Object.keys(merged).length;

    const payload = {
      updatedAt: now,
      fetchedAt: now,
      marketTime: "US/Eastern",
      schemaVersion: 4,
      count: coverage,
      total: symbols.length,
      freshCount: Object.keys(fresh).length,
      failedSymbols: failed,
      carriedForward: carried,
      missingSymbols: missing,
      partial,
      complete: coverage === symbols.length && failed.length === 0,
      staleAfterHours: STALE_AFTER_HOURS,
      quotes: merged,
    };

    writeFileSync(OUT, JSON.stringify(payload, null, 2) + "\n");

    root.setAttributes({
      "radar.fresh_count": payload.freshCount,
      "radar.failed_count": failed.length,
      "radar.carried_count": carried.length,
      "radar.missing_count": missing.length,
      "radar.coverage_count": coverage,
      "radar.coverage_total": symbols.length,
      "radar.partial": partial,
      "radar.complete": payload.complete,
    });

    const status = payload.complete
      ? "✓ complete"
      : partial
        ? `⚠ partial (${payload.freshCount} fresh, ${carried.length} carried, ${missing.length} missing)`
        : "✓";

    console.log(
      `${status} quotes.json — ${payload.count}/${payload.total} symbols (${payload.fetchedAt})`
    );

    if (coverage === 0) {
      console.error(
        "✗ No quotes fetched — refusing empty file overwrite of previous data would lose all prices."
      );
      root.setAttributes({ "radar.fetch_failed": true });
      if (Object.keys(previous.quotes).length) {
        const fallback = {
          ...payload,
          fetchedAt: previous.fetchedAt || now,
          updatedAt: now,
          quotes: previous.quotes,
          count: Object.keys(previous.quotes).length,
          partial: true,
          complete: false,
          fetchFailed: true,
          failedSymbols: symbols,
          carriedForward: Object.keys(previous.quotes),
          missingSymbols: [],
          note: "Yahoo fetch returned zero symbols; kept previous quotes.json body",
        };
        writeFileSync(OUT, JSON.stringify(fallback, null, 2) + "\n");
        console.warn("⚠ Wrote previous quotes with fetchFailed=true");
        process.exitCode = 1;
      } else {
        process.exitCode = 1;
      }
    }

    // Outlook layer: valuations + news + macro rates (soft-fail)
    try {
      const { fetchOutlook } = await import("./fetch-outlook.mjs");
      console.log("Fetching outlook (valuations, news, macro rates)…");
      await otel.withSpan("fetch-outlook.run", () => fetchOutlook());
    } catch (e) {
      console.warn(`⚠ outlook fetch failed (quotes still saved): ${e.message || e}`);
    }
  });
});
