#!/usr/bin/env node
/**
 * Freshness / coverage assert for live (or local) StocksWatch JSON.
 *
 * Local (prebuild / laptop):
 *   node scripts/check-live-freshness.mjs
 *
 * Against a live host (post-deploy):
 *   node scripts/check-live-freshness.mjs --url https://stockswatch.cc
 *
 * Env overrides:
 *   QUOTES_MAX_AGE_HOURS      (default 12)
 *   SCREENER_MAX_AGE_HOURS    (default 24)
 *   SCREENER_MIN_OK_RATIO     (default 0.85)
 *   FRESHNESS_STRICT=0        (warn only, exit 0)
 */

import { existsSync, readFileSync, writeFileSync, mkdirSync } from "node:fs";
import { resolve, dirname } from "node:path";
import { fileURLToPath } from "node:url";
import { loadRuntimeConfig } from "./config.mjs";
import { ageHours, coverageRatio, quotesFreshCount, quotesFreshRatio } from "./lib/freshness-utils.mjs";

const ROOT = resolve(dirname(fileURLToPath(import.meta.url)), "..");
const args = process.argv.slice(2);
const urlIdx = args.indexOf("--url");
const baseUrl = urlIdx >= 0 ? String(args[urlIdx + 1] || "").replace(/\/$/, "") : "";
const strict = process.env.FRESHNESS_STRICT !== "0";

const runtime = loadRuntimeConfig();
const quotesMaxH = num(
  process.env.QUOTES_MAX_AGE_HOURS,
  Math.max(runtime.quotes?.staleAfterHours ?? 6, 12)
);
const screenerMaxH = num(process.env.SCREENER_MAX_AGE_HOURS, 24);
const minOkRatio = num(process.env.SCREENER_MIN_OK_RATIO, 0.85);
const quotesMinRatio = num(process.env.QUOTES_MIN_OK_RATIO, 0.85);

function num(v, fallback) {
  const n = Number(v);
  return Number.isFinite(n) ? n : fallback;
}

function fmtAge(h) {
  if (h == null) return "unknown";
  if (h < 1) return `${Math.round(h * 60)}m`;
  if (h < 48) return `${h.toFixed(1)}h`;
  return `${(h / 24).toFixed(1)}d`;
}

async function loadJson(pathOrUrl) {
  if (pathOrUrl.startsWith("http")) {
    const res = await fetch(pathOrUrl, {
      headers: { Accept: "application/json", "User-Agent": "stocks-radar-freshness/1.0" },
      cache: "no-store",
    });
    if (!res.ok) throw new Error(`HTTP ${res.status} for ${pathOrUrl}`);
    return res.json();
  }
  if (!existsSync(pathOrUrl)) throw new Error(`Missing file ${pathOrUrl}`);
  return JSON.parse(readFileSync(pathOrUrl, "utf8"));
}

function fail(msg) {
  console.error(`✗ ${msg}`);
  return false;
}

function ok(msg) {
  console.log(`✓ ${msg}`);
  return true;
}

async function main() {
  const quotesPath = baseUrl ? `${baseUrl}/quotes.json` : resolve(ROOT, "public/quotes.json");
  const screenerPath = baseUrl ? `${baseUrl}/screener.json` : resolve(ROOT, "public/screener.json");
  const newsPath = baseUrl
    ? `${baseUrl}/datacenter/news.json`
    : resolve(ROOT, "public/datacenter/news.json");

  console.log(`Freshness check ${baseUrl || "(local public/)"}`);
  console.log(
    `  quotes max age: ${quotesMaxH}h · min coverage: ${quotesMinRatio} · screener max age: ${screenerMaxH}h · min ok ratio: ${minOkRatio}`
  );

  let passed = true;
  const report = { checkedAt: new Date().toISOString(), baseUrl: baseUrl || null, checks: {} };

  // ---- quotes ----
  try {
    const quotes = await loadJson(quotesPath);
    const fetched = quotes.fetchedAt || quotes.updatedAt;
    const age = ageHours(fetched);
    const count =
      quotes.quotes && typeof quotes.quotes === "object"
        ? Object.keys(quotes.quotes).length
        : quotes.count ?? 0;
    const total = Number(quotes.total) || count;
    const freshCount = quotesFreshCount(quotes);
    const ratio = quotesFreshRatio(quotes) ?? (total > 0 ? 0 : null);
    report.checks.quotes = {
      fetchedAt: fetched,
      ageHours: age,
      count,
      freshCount,
      total,
      okRatio: ratio,
      partial: Boolean(quotes.partial),
      fetchFailed: Boolean(quotes.fetchFailed),
      carriedForward: Array.isArray(quotes.carriedForward)
        ? quotes.carriedForward.length
        : 0,
    };

    if (age == null) passed = fail("quotes.json missing fetchedAt") && passed;
    else if (age > quotesMaxH) {
      passed = fail(`quotes.json stale (${fmtAge(age)} > ${quotesMaxH}h)`) && passed;
    } else {
      ok(`quotes.json age ${fmtAge(age)} · ${freshCount}/${total || count} fresh`);
    }
    if (freshCount < 1) passed = fail("quotes.json has no fresh symbols") && passed;
    if (quotes.fetchFailed) passed = fail("quotes.json marked fetchFailed") && passed;
    if (ratio != null && ratio < quotesMinRatio) {
      passed =
        fail(`quotes fresh coverage ${(ratio * 100).toFixed(0)}% < ${quotesMinRatio * 100}%`) &&
        passed;
    }
  } catch (e) {
    passed = fail(`quotes.json: ${e.message || e}`) && passed;
  }

  // ---- screener ----
  try {
    const screener = await loadJson(screenerPath);
    const fetched = screener.fetched_at_iso || screener.fetched_at;
    const age = ageHours(fetched);
    const okCount = Number(screener.ok_count) || 0;
    const tickerCount = Number(screener.ticker_count) || 0;
    const ratio = coverageRatio(okCount, tickerCount) ?? 0;
    report.checks.screener = {
      fetchedAt: fetched,
      ageHours: age,
      ok_count: okCount,
      ticker_count: tickerCount,
      okRatio: ratio,
    };

    if (age == null) passed = fail("screener.json missing fetched_at") && passed;
    else if (age > screenerMaxH) {
      passed = fail(`screener.json stale (${fmtAge(age)} > ${screenerMaxH}h)`) && passed;
    } else {
      ok(`screener.json age ${fmtAge(age)} · ${okCount}/${tickerCount} ok`);
    }
    if (okCount < 1) passed = fail("screener.json ok_count is 0") && passed;
    else if (ratio < minOkRatio) {
      passed =
        fail(`screener coverage ${(ratio * 100).toFixed(0)}% < ${minOkRatio * 100}%`) && passed;
    }
  } catch (e) {
    passed = fail(`screener.json: ${e.message || e}`) && passed;
  }

  // ---- news (warn only unless completely missing file on live) ----
  try {
    const news = await loadJson(newsPath);
    const map = news.news && typeof news.news === "object" ? news.news : {};
    const keys = Object.keys(map);
    const withHeadlines = keys.filter((k) => Array.isArray(map[k]) && map[k].length > 0).length;
    report.checks.news = { tickers: keys.length, withHeadlines };
    if (keys.length === 0) {
      console.warn("⚠ news.json has no tickers (headlines will be empty)");
      if (baseUrl && strict) passed = fail("news.json empty on live host") && passed;
    } else if (withHeadlines === 0) {
      console.warn("⚠ news.json has tickers but zero headlines");
    } else {
      ok(`news.json ${withHeadlines}/${keys.length} tickers with headlines`);
    }
  } catch (e) {
    console.warn(`⚠ news.json: ${e.message || e}`);
    if (baseUrl && strict) passed = fail(`news.json required on live: ${e.message || e}`) && passed;
  }

  const outDir = resolve(ROOT, ".cache");
  try {
    mkdirSync(outDir, { recursive: true });
    writeFileSync(resolve(outDir, "freshness-report.json"), JSON.stringify(report, null, 2) + "\n");
  } catch {
    /* ignore cache write */
  }

  if (!passed) {
    if (!strict) {
      console.warn("FRESHNESS_STRICT=0 — continuing despite failures");
      process.exit(0);
    }
    process.exit(1);
  }
  console.log("Freshness OK");
}

main().catch((e) => {
  console.error(e);
  process.exit(1);
});
