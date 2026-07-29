#!/usr/bin/env node
/**
 * Writes public/settings.json (safe, no secrets) + public/health.json for ops checks.
 * health.ok reflects build stamp AND local data readiness (age/coverage), not always-green.
 */

import { existsSync, readFileSync, writeFileSync } from "node:fs";
import { resolve, dirname } from "node:path";
import { fileURLToPath } from "node:url";
import { loadRuntimeConfig, publicSettingsPayload } from "./config.mjs";
import { ageHours, coverageOk, coverageRatio } from "./lib/freshness-utils.mjs";

const ROOT = resolve(dirname(fileURLToPath(import.meta.url)), "..");
const config = loadRuntimeConfig();
const settings = publicSettingsPayload(config);

const settingsOut = resolve(ROOT, "public/settings.json");
writeFileSync(settingsOut, JSON.stringify(settings, null, 2) + "\n");

const quotesMaxH = Math.max(config.quotes?.staleAfterHours ?? 6, 12);
const screenerMaxH = Number(process.env.SCREENER_MAX_AGE_HOURS || 24);
const minOkRatio = Number(process.env.SCREENER_MIN_OK_RATIO || 0.85);
const quotesMinRatio = Number(process.env.QUOTES_MIN_OK_RATIO || 0.85);

function readJson(rel) {
  const p = resolve(ROOT, rel);
  if (!existsSync(p)) return { missing: true, path: rel };
  try {
    return { data: JSON.parse(readFileSync(p, "utf8")), path: rel };
  } catch (e) {
    return { error: String(e.message || e), path: rel };
  }
}

const quotesFile = readJson("public/quotes.json");
const screenerFile = readJson("public/screener.json");

const checks = {
  settings: true,
  quotes: { ok: false },
  screener: { ok: false },
};

if (quotesFile.data) {
  const q = quotesFile.data;
  const count =
    q.quotes && typeof q.quotes === "object"
      ? Object.keys(q.quotes).length
      : Number(q.count) || 0;
  const total = Number(q.total) || count;
  const age = ageHours(q.fetchedAt || q.updatedAt);
  const ratio = coverageRatio(count, total) ?? (total > 0 ? 0 : null);
  const ok =
    age != null &&
    age <= quotesMaxH &&
    count >= 1 &&
    (ratio == null || ratio >= quotesMinRatio) &&
    !q.fetchFailed;
  checks.quotes = {
    ok,
    ageHours: age,
    count,
    total,
    coverage: ratio,
    partial: Boolean(q.partial),
    fetchFailed: Boolean(q.fetchFailed),
  };
} else {
  checks.quotes = { ok: false, missing: true, error: quotesFile.error || "missing" };
}

if (screenerFile.data) {
  const s = screenerFile.data;
  const okCount = Number(s.ok_count) || 0;
  const tickerCount = Number(s.ticker_count) || 0;
  const age = ageHours(s.fetched_at_iso || s.fetched_at);
  const ok =
    age != null &&
    age <= screenerMaxH &&
    okCount >= 1 &&
    coverageOk(okCount, tickerCount, minOkRatio);
  checks.screener = {
    ok,
    ageHours: age,
    ok_count: okCount,
    ticker_count: tickerCount,
    coverage: coverageRatio(okCount, tickerCount),
  };
} else {
  checks.screener = { ok: false, missing: true, error: screenerFile.error || "missing" };
}

const dataOk = checks.quotes.ok && checks.screener.ok;
const status = dataOk ? "ok" : checks.quotes.ok || checks.screener.ok ? "degraded" : "unhealthy";

const health = {
  ok: dataOk,
  status,
  buildOk: true,
  service: config.app.name,
  version: config.app.version,
  environment: config.app.environment,
  builtAt: process.env.DEPLOY_TIME ?? new Date().toISOString(),
  gitSha: process.env.GITHUB_SHA ?? "local",
  siteUrl: config.site.url || null,
  checks,
  paths: {
    quotes: "/quotes.json",
    outlook: "/outlook.json",
    screener: "/screener.json",
    datacenter: "/datacenter.html",
    settings: config.ops.settingsPath,
    health: config.ops.healthPath,
  },
};

const healthOut = resolve(ROOT, "public/health.json");
writeFileSync(healthOut, JSON.stringify(health, null, 2) + "\n");

console.log(
  `✓ settings.json + health.json (${config.app.environment}) — status=${status}`
);
if (!dataOk) {
  console.warn("⚠ health status is not ok — quotes/screener age or coverage below threshold");
}
