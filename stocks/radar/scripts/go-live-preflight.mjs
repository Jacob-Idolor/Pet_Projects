#!/usr/bin/env node
/**
 * Local / CI preflight before flipping STOCKS_RADAR_DEPLOY_ENABLED.
 * Does not require AWS credentials (except optional --aws).
 *
 *   npm run go-live:preflight
 *   STOCKS_RADAR_SITE=https://xxx.cloudfront.net npm run go-live:preflight -- --strict
 *   npm run go-live:preflight -- --aws
 */
import { spawnSync } from "node:child_process";
import { existsSync, readFileSync } from "node:fs";
import { dirname, join } from "node:path";
import { fileURLToPath } from "node:url";

const root = join(dirname(fileURLToPath(import.meta.url)), "..");
const repoRoot = join(root, "../..");
const strict = process.argv.includes("--strict");
const checkAws = process.argv.includes("--aws");

const failures = [];
const warnings = [];

function ok(msg) {
  console.log(`  ✓ ${msg}`);
}

function fail(msg) {
  failures.push(msg);
  console.error(`  ✗ ${msg}`);
}

function warn(msg) {
  warnings.push(msg);
  console.warn(`  ! ${msg}`);
}

function run(cmd, args, opts = {}) {
  return spawnSync(cmd, args, {
    cwd: root,
    encoding: "utf8",
    ...opts,
  });
}

console.log("Stocks Radar — go-live preflight\n");

// 1. Required files
console.log("1. Project files");
for (const rel of [
  "src/data/site-settings.json",
  "src/data/watchlist.json",
  "src/data/alert-rules.json",
  "infra/terraform/main.tf",
  "infra/terraform/alerts.tf",
  "infra/sync-s3-tiered.sh",
  "infra/go-live.sh",
]) {
  const p = join(root, rel);
  if (existsSync(p)) ok(rel);
  else fail(`missing ${rel}`);
}

const deployYmlPath = join(repoRoot, ".github/workflows/stocks-radar-deploy.yml");
if (existsSync(deployYmlPath)) ok(".github/workflows/stocks-radar-deploy.yml");
else fail("missing repo-root deploy workflow");

// 2. Config validate
console.log("\n2. Config validation");
const site = (process.env.STOCKS_RADAR_SITE || "").replace(/\/$/, "");
if (site) {
  process.env.STOCKS_RADAR_SITE = site;
  const r = run("node", ["scripts/validate-config.mjs", "--production"]);
  if (r.status === 0) ok(`config:validate:prod (${site})`);
  else fail(`config:validate:prod failed\n${r.stderr || r.stdout}`);
} else {
  const r = run("node", ["scripts/validate-config.mjs"]);
  if (r.status === 0) ok("config:validate (dev defaults)");
  else fail(`config:validate failed\n${r.stderr || r.stdout}`);
  warn("STOCKS_RADAR_SITE unset — skip production validate");
  if (strict) fail("STOCKS_RADAR_SITE required in --strict mode");
}

// 3. Workflow gate
console.log("\n3. Workflow gates");
if (existsSync(deployYmlPath)) {
  const deployYml = readFileSync(deployYmlPath, "utf8");
  if (deployYml.includes("STOCKS_RADAR_DEPLOY_ENABLED")) {
    ok("deploy workflow uses STOCKS_RADAR_DEPLOY_ENABLED");
  } else if (/\bif:\s*false\b/.test(deployYml)) {
    fail("deploy workflow still hard-disabled (if: false)");
  } else {
    warn("could not detect deploy enable gate");
  }
  for (const name of [
    "stocks-radar-refresh-quotes.yml",
    "stocks-radar-daily-digest.yml",
    "stocks-radar-signal-alerts.yml",
  ]) {
    const p = join(repoRoot, ".github/workflows", name);
    if (!existsSync(p)) {
      fail(`missing workflow ${name}`);
      continue;
    }
    const y = readFileSync(p, "utf8");
    if (y.includes("STOCKS_RADAR_DEPLOY_ENABLED")) ok(`${name} gated`);
    else if (/\bif:\s*false\b/.test(y)) fail(`${name} still if: false`);
    else warn(`${name}: no DEPLOY_ENABLED gate found`);
  }
}

// 4. Alert rules
console.log("\n4. Alert rules");
try {
  const rules = JSON.parse(
    readFileSync(join(root, "src/data/alert-rules.json"), "utf8"),
  );
  const n = (rules.rules || []).filter((r) => r.enabled !== false).length;
  if (n === 0) ok("0 enabled alert rules (personal alerts UI off — expected)");
  else ok(`${n} enabled rule(s) in alert-rules.json`);
} catch (e) {
  fail(`alert-rules.json: ${e.message}`);
}

// 5. Quotes fetch
console.log("\n5. Quote fetch smoke");
const q = run("node", ["scripts/fetch-quotes.mjs"], {
  env: { ...process.env, OTEL_SDK_DISABLED: "true" },
});
if (q.status === 0) {
  try {
    const quotes = JSON.parse(
      readFileSync(join(root, "public/quotes.json"), "utf8"),
    );
    const total = quotes.total ?? Object.keys(quotes.quotes || {}).length;
    const okN = quotes.count ?? quotes.freshCount ?? 0;
    if (okN === 0) fail(`quotes fetch returned 0/${total} ok`);
    else if (quotes.partial || okN < total) warn(`partial quotes ${okN}/${total} ok`);
    else ok(`quotes ${okN}/${total} ok`);
  } catch (e) {
    fail(`read quotes.json: ${e.message}`);
  }
} else {
  fail(`fetch-quotes failed (exit ${q.status})`);
}

// 6. Optional AWS
if (checkAws) {
  console.log("\n6. AWS / Terraform outputs");
  const aws = run("aws", ["sts", "get-caller-identity"]);
  if (aws.status !== 0) fail("aws sts get-caller-identity failed — configure credentials");
  else ok("AWS credentials work");

  const tfDir = join(root, "infra/terraform");
  const out = run("terraform", ["output", "-json"], { cwd: tfDir });
  if (out.status !== 0) {
    fail("terraform output failed — run terraform apply in infra/terraform first");
  } else {
    try {
      const j = JSON.parse(out.stdout);
      for (const key of [
        "s3_bucket_name",
        "cloudfront_distribution_id",
        "cloudfront_domain_name",
        "preferred_site_url",
      ]) {
        if (j[key]?.value) ok(`tf output ${key}`);
        else fail(`tf output missing ${key}`);
      }
      if (j.daily_digest_topic_arn?.value) ok("tf output daily_digest_topic_arn");
      else warn("daily_digest_topic_arn empty — digest email optional");

      const alertMap = j.personal_alert_topic_arns?.value;
      if (alertMap && typeof alertMap === "object") {
        const keys = Object.keys(alertMap);
        if (keys.length) ok(`personal alert topics: ${keys.join(", ")}`);
        else warn("personal_alert_topic_arns empty — set alert_subscribers in tfvars");
      }
    } catch (e) {
      fail(`parse terraform output: ${e.message}`);
    }
  }
} else {
  console.log("\n6. AWS (skipped — pass --aws to check)");
}

console.log("\n───");
if (warnings.length) console.log(`${warnings.length} warning(s)`);
if (failures.length) {
  console.error(`${failures.length} failure(s) — fix before go-live`);
  process.exit(1);
}
console.log("Preflight passed.");
console.log("Next: bash infra/go-live.sh  (prints gh secret / var commands)");
process.exit(0);
