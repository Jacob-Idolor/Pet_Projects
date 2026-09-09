#!/usr/bin/env node
/** Write safe public settings and build-time health for the NBIS desk. */

import { existsSync, readFileSync, writeFileSync } from "node:fs";
import { resolve, dirname } from "node:path";
import { fileURLToPath } from "node:url";
import { loadRuntimeConfig, publicSettingsPayload } from "../config.mjs";
import { ageHours, coverageOk, coverageRatio, freshUntil } from "../lib/freshness-utils.mjs";

const ROOT = resolve(dirname(fileURLToPath(import.meta.url)), "../..");
const config = loadRuntimeConfig();
const settings = publicSettingsPayload(config);
writeFileSync(resolve(ROOT, "public/settings.json"), JSON.stringify(settings, null, 2) + "\n");

const screenerMaxH = Number(process.env.SCREENER_MAX_AGE_HOURS || 24);
const nbisMaxH = Number(process.env.NBIS_MAX_AGE_HOURS || 30);
const nbisMinPricePoints = Number(process.env.NBIS_MIN_PRICE_POINTS || 20);
const minOkRatio = Number(process.env.SCREENER_MIN_OK_RATIO || 0.85);

function readJson(rel) {
  const path = resolve(ROOT, rel);
  if (!existsSync(path)) return { missing: true, path: rel };
  try {
    return { data: JSON.parse(readFileSync(path, "utf8")), path: rel };
  } catch (error) {
    return { error: String(error.message || error), path: rel };
  }
}

const screenerFile = readJson("public/screener.json");
const nbisFile = readJson("public/nbis.json");
const checks = { screener: { ok: false }, nbis: { ok: false } };

if (screenerFile.data) {
  const data = screenerFile.data;
  const okCount = Number(data.ok_count) || 0;
  const tickerCount = Number(data.ticker_count) || 0;
  const age = ageHours(data.fetched_at_iso || data.fetched_at);
  checks.screener = {
    ok: age != null && age <= screenerMaxH && okCount >= 1 && coverageOk(okCount, tickerCount, minOkRatio),
    ageHours: age,
    ok_count: okCount,
    ticker_count: tickerCount,
    coverage: coverageRatio(okCount, tickerCount),
  };
} else {
  checks.screener = { ok: false, missing: true, error: screenerFile.error || "missing" };
}

if (nbisFile.data) {
  const data = nbisFile.data;
  const age = ageHours(data.fetchedAt);
  const pricePoints = Array.isArray(data.priceHistory) ? data.priceHistory.length : 0;
  const filings = Array.isArray(data.sec?.filings) ? data.sec.filings.length : 0;
  checks.nbis = {
    ok: data.status === "ok" && age != null && age <= nbisMaxH && pricePoints >= nbisMinPricePoints,
    ageHours: age,
    pricePoints,
    filings,
    status: data.status || "unknown",
  };
} else {
  checks.nbis = { ok: false, missing: true, error: nbisFile.error || "missing" };
}

const dataOk = checks.nbis.ok;
const screenerOk = checks.screener.ok;
const evaluatedAt = new Date().toISOString();
const validUntil = nbisFile.data ? freshUntil(nbisFile.data.fetchedAt, nbisMaxH) : null;
const screenerValidUntil = screenerFile.data
  ? freshUntil(screenerFile.data.fetched_at_iso || screenerFile.data.fetched_at, screenerMaxH)
  : null;
const health = {
  ok: dataOk,
  status: dataOk ? "ok" : "unhealthy",
  secondaryStatus: screenerOk ? "ok" : "stale",
  buildOk: true,
  service: config.app.name,
  version: config.app.version,
  environment: config.app.environment,
  builtAt: process.env.DEPLOY_TIME ?? new Date().toISOString(),
  gitSha: process.env.GITHUB_SHA ?? "local",
  siteUrl: config.site.url || null,
  freshnessSnapshot: {
    evaluatedAt,
    validUntil,
    screenerValidUntil,
    note: "Build-time snapshot. The NBIS desk is the primary health signal; the screener is reported separately.",
  },
  checks,
  paths: {
    nbis: "/nbis.json",
    screener: "/screener.json",
    datacenter: "/datacenter.html",
    settings: config.ops.settingsPath,
    health: config.ops.healthPath,
  },
};

writeFileSync(resolve(ROOT, "public/health.json"), JSON.stringify(health, null, 2) + "\n");
console.log(`✓ settings.json + health.json (${config.app.environment}) — status=${health.status}`);
if (!dataOk) {
  console.warn("⚠ NBIS health is not ok — snapshot age, status, or price-history coverage is below threshold");
} else if (!screenerOk) {
  console.warn("⚠ NBIS health is ok — AI data-center screener data is stale or unavailable");
}
