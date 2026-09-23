#!/usr/bin/env node
/** Write safe public settings and build-time health for the NBIS desk. */

import { existsSync, readFileSync, writeFileSync } from "node:fs";
import { resolve, dirname } from "node:path";
import { fileURLToPath } from "node:url";
import { loadRuntimeConfig, publicSettingsPayload } from "../config.mjs";
import { ageHours, freshUntil } from "../lib/freshness-utils.mjs";

import { NBIS_MAX_AGE_HOURS, validateNbisSnapshot } from "../lib/nbis-quality.mjs";

const ROOT = resolve(dirname(fileURLToPath(import.meta.url)), "../..");
const config = loadRuntimeConfig();
const settings = publicSettingsPayload(config);
writeFileSync(resolve(ROOT, "public/settings.json"), JSON.stringify(settings, null, 2) + "\n");

const nbisMaxH = NBIS_MAX_AGE_HOURS;

function readJson(rel) {
  const path = resolve(ROOT, rel);
  if (!existsSync(path)) return { missing: true, path: rel };
  try {
    return { data: JSON.parse(readFileSync(path, "utf8")), path: rel };
  } catch (error) {
    return { error: String(error.message || error), path: rel };
  }
}

const nbisFile = readJson("public/nbis.json");
const checks = { nbis: { ok: false } };

if (nbisFile.data) {
  const data = nbisFile.data;
  const age = ageHours(data.fetchedAt);
  const pricePoints = Array.isArray(data.priceHistory) ? data.priceHistory.length : 0;
  const filings = Array.isArray(data.sec?.filings) ? data.sec.filings.length : 0;
  checks.nbis = {
    ok: validateNbisSnapshot(data, { requireFresh: true }).length === 0,
    ageHours: age,
    pricePoints,
    filings,
    status: data.status || "unknown",
  };
} else {
  checks.nbis = { ok: false, missing: true, error: nbisFile.error || "missing" };
}

const dataOk = checks.nbis.ok;

const evaluatedAt = new Date().toISOString();
const validUntil = nbisFile.data ? freshUntil(nbisFile.data.fetchedAt, nbisMaxH) : null;
const health = {
  ok: dataOk,
  status: dataOk ? "ok" : "unhealthy",
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
    note: "Build-time NBIS health; compare validUntil with the current time. Historical screener feeds are not published.",
  },
  checks,
  paths: {
    nbis: "/nbis.json",
    settings: config.ops.settingsPath,
    health: config.ops.healthPath,
  },
};

writeFileSync(resolve(ROOT, "public/health.json"), JSON.stringify(health, null, 2) + "\n");
console.log(`✓ settings.json + health.json (${config.app.environment}) — status=${health.status}`);
if (!dataOk) {
  console.warn("⚠ NBIS health is not ok — snapshot age, status, or price-history coverage is below threshold");
}
