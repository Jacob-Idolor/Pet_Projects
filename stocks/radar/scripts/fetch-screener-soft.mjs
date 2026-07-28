#!/usr/bin/env node
/**
 * Wrapper around scripts/fetch-screener.py.
 * Local/PR: soft-fail (keep existing screener.json) unless SCREENER_STRICT=1.
 * Production (GitHub Actions / STOCKS_RADAR_ENV=production): fail hard so stale
 * data is not silently shipped.
 */
import { spawnSync } from "node:child_process";
import { existsSync, readFileSync } from "node:fs";
import { resolve, dirname } from "node:path";
import { fileURLToPath } from "node:url";

const __dirname = dirname(fileURLToPath(import.meta.url));
const ROOT = resolve(__dirname, "..");
const SCRIPT = resolve(ROOT, "scripts/fetch-screener.py");
const OUT = resolve(ROOT, "public/screener.json");

const production =
  process.env.STOCKS_RADAR_ENV === "production" ||
  process.env.DEPLOY_PROVIDER === "github-actions" ||
  Boolean(process.env.GITHUB_ACTIONS);
const strict =
  process.env.SCREENER_STRICT === "1" ||
  (production && process.env.SCREENER_STRICT !== "0");

if (process.env.SCREENER_SKIP === "1") {
  console.log("SCREENER_SKIP=1 — leaving existing screener.json");
  process.exit(0);
}

const py = process.env.PYTHON || (process.platform === "win32" ? "python" : "python3");
const result = spawnSync(py, [SCRIPT], {
  cwd: ROOT,
  encoding: "utf8",
  env: process.env,
  stdio: ["ignore", "pipe", "pipe"],
});

if (result.stdout) process.stdout.write(result.stdout);
if (result.stderr) process.stderr.write(result.stderr);

if (result.status === 0) {
  try {
    const payload = JSON.parse(readFileSync(OUT, "utf8"));
    if (!payload.ok_count) {
      console.error("screener.json has ok_count=0");
      process.exit(strict ? 1 : 0);
    }
  } catch (e) {
    console.error("Could not validate screener.json:", e.message || e);
    process.exit(strict ? 1 : 0);
  }
  process.exit(0);
}

console.warn("fetch-screener.py failed.");
if (result.error) console.warn(String(result.error));

if (strict) {
  console.error("SCREENER_STRICT / production — refusing to ship without a fresh screener fetch.");
  process.exit(1);
}

if (!existsSync(OUT)) {
  console.error("No public/screener.json available. Run: pip install -r scripts/datacenter/requirements.txt && npm run update-screener");
  process.exit(1);
}

console.warn("Keeping existing screener.json (local soft-fail).");
process.exit(0);
