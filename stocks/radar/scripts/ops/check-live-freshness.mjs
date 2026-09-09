#!/usr/bin/env node
/** Freshness / coverage assert for the NBIS desk and AI data-center screener. */

import { existsSync, readFileSync, writeFileSync, mkdirSync } from "node:fs";
import { resolve, dirname } from "node:path";
import { fileURLToPath } from "node:url";
import { ageHours, coverageRatio } from "../lib/freshness-utils.mjs";

const ROOT = resolve(dirname(fileURLToPath(import.meta.url)), "../..");
const args = process.argv.slice(2);
const urlIdx = args.indexOf("--url");
const baseUrl = urlIdx >= 0 ? String(args[urlIdx + 1] || "").replace(/\/$/, "") : "";
const strict = process.env.FRESHNESS_STRICT !== "0";
const nbisMaxH = Number(process.env.NBIS_MAX_AGE_HOURS || 30);
const screenerMaxH = Number(process.env.SCREENER_MAX_AGE_HOURS || 24);
const minOkRatio = Number(process.env.SCREENER_MIN_OK_RATIO || 0.85);
const nbisMinPricePoints = Number(process.env.NBIS_MIN_PRICE_POINTS || 20);

function fmtAge(hours) {
  if (hours == null) return "unknown";
  if (hours < 1) return `${Math.round(hours * 60)}m`;
  if (hours < 48) return `${hours.toFixed(1)}h`;
  return `${(hours / 24).toFixed(1)}d`;
}

async function loadJson(pathOrUrl) {
  if (pathOrUrl.startsWith("http")) {
    const response = await fetch(pathOrUrl, {
      headers: { Accept: "application/json", "User-Agent": "stockswatch-freshness/1.0" },
      cache: "no-store",
    });
    if (!response.ok) throw new Error(`HTTP ${response.status} for ${pathOrUrl}`);
    return response.json();
  }
  if (!existsSync(pathOrUrl)) throw new Error(`Missing file ${pathOrUrl}`);
  return JSON.parse(readFileSync(pathOrUrl, "utf8"));
}

function fail(message) {
  console.error(`✗ ${message}`);
  return false;
}

function ok(message) {
  console.log(`✓ ${message}`);
  return true;
}

async function main() {
  const paths = {
    nbis: baseUrl ? `${baseUrl}/nbis.json` : resolve(ROOT, "public/nbis.json"),
    screener: baseUrl ? `${baseUrl}/screener.json` : resolve(ROOT, "public/screener.json"),
  };
  console.log(`Freshness check ${baseUrl || "(local public/)"}`);
  console.log(`  NBIS max age: ${nbisMaxH}h · screener max age: ${screenerMaxH}h · min coverage: ${minOkRatio}`);

  let passed = true;
  const report = { checkedAt: new Date().toISOString(), baseUrl: baseUrl || null, checks: {} };

  try {
    const nbis = await loadJson(paths.nbis);
    const age = ageHours(nbis.fetchedAt);
    const pricePoints = Array.isArray(nbis.priceHistory) ? nbis.priceHistory.length : 0;
    report.checks.nbis = { status: nbis.status, fetchedAt: nbis.fetchedAt, ageHours: age, pricePoints };
    if (nbis.status !== "ok") passed = fail(`nbis.json status is ${nbis.status || "unknown"}`) && passed;
    else if (age == null || age > nbisMaxH) passed = fail(`nbis.json stale (${fmtAge(age)} > ${nbisMaxH}h)`) && passed;
    else if (pricePoints < nbisMinPricePoints) passed = fail(`nbis.json has ${pricePoints} price points (< ${nbisMinPricePoints})`) && passed;
    else ok(`nbis.json age ${fmtAge(age)} · ${pricePoints} price points`);
  } catch (error) {
    passed = fail(`nbis.json: ${error.message || error}`) && passed;
  }

  try {
    const screener = await loadJson(paths.screener);
    const age = ageHours(screener.fetched_at_iso || screener.fetched_at);
    const okCount = Number(screener.ok_count) || 0;
    const tickerCount = Number(screener.ticker_count) || 0;
    const ratio = coverageRatio(okCount, tickerCount) ?? 0;
    report.checks.screener = { fetchedAt: screener.fetched_at_iso || screener.fetched_at, ageHours: age, okCount, tickerCount, coverage: ratio };
    if (age == null || age > screenerMaxH) passed = fail(`screener.json stale (${fmtAge(age)} > ${screenerMaxH}h)`) && passed;
    else if (okCount < 1 || ratio < minOkRatio) passed = fail(`screener coverage ${(ratio * 100).toFixed(0)}% is below ${minOkRatio * 100}%`) && passed;
    else ok(`screener.json age ${fmtAge(age)} · ${okCount}/${tickerCount} ok`);
  } catch (error) {
    passed = fail(`screener.json: ${error.message || error}`) && passed;
  }

  try {
    const outDir = resolve(ROOT, ".cache");
    mkdirSync(outDir, { recursive: true });
    writeFileSync(resolve(outDir, "freshness-report.json"), JSON.stringify(report, null, 2) + "\n");
  } catch {
    /* Cache output is optional. */
  }

  if (!passed && strict) process.exit(1);
  if (!passed) console.warn("FRESHNESS_STRICT=0 — continuing despite failures");
  else console.log("Freshness OK");
}

main().catch((error) => {
  console.error(error);
  process.exit(1);
});
