#!/usr/bin/env node
/** Writes public/build-meta.json — shown in the live status bar after deploy. */

import { writeFileSync } from "node:fs";
import { resolve, dirname } from "node:path";
import { fileURLToPath } from "node:url";

const ROOT = resolve(dirname(fileURLToPath(import.meta.url)), "../..");
const OUT = resolve(ROOT, "public/build-meta.json");

const payload = {
  builtAt: process.env.DEPLOY_TIME ?? new Date().toISOString(),
  gitSha: process.env.GITHUB_SHA ?? "local",
  gitRef: process.env.GITHUB_REF_NAME ?? "local",
  siteUrl: process.env.STOCKS_RADAR_SITE ?? "",
  deployProvider: process.env.DEPLOY_PROVIDER ?? "local",
  workflowRun: process.env.GITHUB_RUN_ID ?? null,
};

writeFileSync(OUT, JSON.stringify(payload, null, 2) + "\n");
console.log(`✓ build-meta.json (${payload.deployProvider})`);
