#!/usr/bin/env node
/** Writes public/settings.json (safe, no secrets) + public/health.json for ops checks. */

import { writeFileSync } from "node:fs";
import { resolve, dirname } from "node:path";
import { fileURLToPath } from "node:url";
import { loadRuntimeConfig, publicSettingsPayload } from "./config.mjs";

const ROOT = resolve(dirname(fileURLToPath(import.meta.url)), "..");
const config = loadRuntimeConfig();
const settings = publicSettingsPayload(config);

const settingsOut = resolve(ROOT, "public/settings.json");
writeFileSync(settingsOut, JSON.stringify(settings, null, 2) + "\n");

const health = {
  ok: true,
  status: "ok",
  service: config.app.name,
  version: config.app.version,
  environment: config.app.environment,
  builtAt: process.env.DEPLOY_TIME ?? new Date().toISOString(),
  gitSha: process.env.GITHUB_SHA ?? "local",
  siteUrl: config.site.url || null,
  checks: {
    settings: true,
    quotesExpected: true,
  },
  paths: {
    quotes: "/quotes.json",
    settings: config.ops.settingsPath,
    health: config.ops.healthPath,
  },
};

const healthOut = resolve(ROOT, "public/health.json");
writeFileSync(healthOut, JSON.stringify(health, null, 2) + "\n");

console.log(`✓ settings.json + health.json (${config.app.environment})`);
