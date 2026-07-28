#!/usr/bin/env node
/**
 * Soft-fail wrapper around scripts/fetch-screener.py.
 * Keeps Astro builds working when Python/yfinance aren't available;
 * the committed placeholder public/screener.json is used instead.
 */
import { spawnSync } from "node:child_process";
import { existsSync } from "node:fs";
import { resolve, dirname } from "node:path";
import { fileURLToPath } from "node:url";

const __dirname = dirname(fileURLToPath(import.meta.url));
const ROOT = resolve(__dirname, "..");
const SCRIPT = resolve(ROOT, "scripts/fetch-screener.py");
const OUT = resolve(ROOT, "public/screener.json");

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

if (result.status === 0) {
  if (result.stdout) process.stdout.write(result.stdout);
  if (result.stderr) process.stderr.write(result.stderr);
  process.exit(0);
}

console.warn("fetch-screener.py failed — keeping existing screener.json if present.");
if (result.stdout) console.warn(result.stdout);
if (result.stderr) console.warn(result.stderr);
if (result.error) console.warn(String(result.error));

if (!existsSync(OUT)) {
  console.error("No public/screener.json available. Run: pip install -r scripts/datacenter/requirements.txt && npm run update-screener");
  process.exit(1);
}

process.exit(0);
