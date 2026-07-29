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
import { buildMetrics } from "../market-metrics.mjs";
import { withOtel } from "../otel.mjs";
import { loadRuntimeConfig } from "../config.mjs";

const __dirname = dirname(fileURLToPath(import.meta.url));
const ROOT = resolve(__dirname, "../..");
const WATCHLIST = resolve(ROOT, "src/data/watchlist.json");
const OUT = resolve(ROOT, "public/quotes.json");
const runtime = loadRuntimeConfig();
/** Pretty JSON locally; compact in CI/production to cut transfer on every poll. */
const JSON_SPACE =
  process.env.QUOTES_PRETTY === "1" ||
  (!process.env.GITHUB_ACTIONS && process.env.STOCKS_RADAR_ENV !== "production")
    ? 2
    : undefined;

const delay = (ms) => new Promise((r) => setTimeout(r, ms));

const HEADERS = {
  Accept: "application/json",
  "User-Agent": "stocks-radar/1.1 (+https://github.com/Jacob-Idolor/Pet_Projects)",
};

const MAX_RETRIES = runtime.quotes.yahooMaxRetries;
const RETRY_BASE_MS = 500;
const FETCH_TIMEOUT_MS = Number(process.env.YAHOO_FETCH_TIMEOUT_MS || 15000);
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
  // range=max often returns monthly bars while advertising interval=1d — SMA/RSI
  // would then use month-scale windows. Prefer a bounded daily window.
  const url = `https://query1.finance.yahoo.com/v8/finance/chart/${encodeURIComponent(symbol)}?interval=1d&range=2y`;
  const res = await fetch(url, {
    headers: HEADERS,
    signal: AbortSignal.timeout(FETCH_TIMEOUT_MS),
  });
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

  const gran = meta.dataGranularity;
  if (gran && gran !== "1d") {
    const err = new Error(`unexpected granularity ${gran} for ${symbol} (want 1d)`);
    err.retryable = true;
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
  if (process.env.QUOTES_SKIP === "1") {
    if (!existsSync(OUT)) {
      console.error("QUOTES_SKIP=1 but public/quotes.json is missing");
      process.exit(1);
    }
    console.log("QUOTES_SKIP=1 — leaving existing quotes.json");
    return;
  }

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
    const freshCount = Object.keys(fresh).length;
    const coverage = Object.keys(merged).length;
    const freshRatio = symbols.length > 0 ? freshCount / symbols.length : 0;

    // Zero fresh quotes: keep prior body + prior fetchedAt so freshness gates trip.
    if (freshCount === 0) {
      console.error("✗ No fresh quotes fetched this run");
      root.setAttributes({ "radar.fetch_failed": true, "radar.fresh_count": 0 });
      if (Object.keys(previous.quotes).length) {
        const fallback = {
          updatedAt: now,
          fetchedAt: previous.fetchedAt || now,
          marketTime: "US/Eastern",
          schemaVersion: 4,
          count: Object.keys(previous.quotes).length,
          total: symbols.length,
          freshCount: 0,
          failedSymbols: symbols,
          carriedForward: Object.keys(previous.quotes),
          missingSymbols: [],
          partial: true,
          complete: false,
          fetchFailed: true,
          staleAfterHours: STALE_AFTER_HOURS,
          quotes: previous.quotes,
          note: "Yahoo fetch returned zero fresh symbols; kept previous quotes.json body",
        };
        writeFileSync(OUT, JSON.stringify(fallback, null, JSON_SPACE) + "\n");
        console.warn("⚠ Wrote previous quotes with fetchFailed=true (fetchedAt unchanged)");
      }
      process.exitCode = 1;
      return;
    }

    const payload = {
      updatedAt: now,
      fetchedAt: now,
      marketTime: "US/Eastern",
      schemaVersion: 4,
      count: coverage,
      total: symbols.length,
      freshCount,
      failedSymbols: failed,
      carriedForward: carried,
      missingSymbols: missing,
      partial,
      complete: coverage === symbols.length && failed.length === 0,
      staleAfterHours: STALE_AFTER_HOURS,
      quotes: merged,
    };

    writeFileSync(OUT, JSON.stringify(payload, null, JSON_SPACE) + "\n");

    root.setAttributes({
      "radar.fresh_count": payload.freshCount,
      "radar.failed_count": failed.length,
      "radar.carried_count": carried.length,
      "radar.missing_count": missing.length,
      "radar.coverage_count": coverage,
      "radar.coverage_total": symbols.length,
      "radar.fresh_ratio": freshRatio,
      "radar.partial": partial,
      "radar.complete": payload.complete,
    });

    const status = payload.complete
      ? "✓ complete"
      : partial
        ? `⚠ partial (${payload.freshCount} fresh, ${carried.length} carried, ${missing.length} missing)`
        : "✓";

    console.log(
      `${status} quotes.json — ${payload.freshCount}/${payload.total} fresh (${payload.fetchedAt})`
    );

    const minRatio = Number(process.env.QUOTES_MIN_OK_RATIO || 0.85);
    const production =
      process.env.STOCKS_RADAR_ENV === "production" ||
      process.env.DEPLOY_PROVIDER === "github-actions" ||
      Boolean(process.env.GITHUB_ACTIONS);
    if (production && freshRatio < minRatio) {
      console.error(
        `✗ Quote fresh coverage ${(freshRatio * 100).toFixed(0)}% < ${minRatio * 100}% in production — failing refresh`
      );
      process.exitCode = 1;
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
