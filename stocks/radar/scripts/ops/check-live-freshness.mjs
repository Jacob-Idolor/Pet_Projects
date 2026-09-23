#!/usr/bin/env node
/** Check current NBIS freshness and optionally the exact deployed revision. */
import { readFileSync } from "node:fs";
import { validateNbisSnapshot } from "../lib/nbis-quality.mjs";
const args = process.argv.slice(2);
const index = args.indexOf("--url");
const base = index >= 0 ? String(args[index + 1] || "").replace(/\/$/, "") : "";
const expectedSha = process.env.EXPECTED_GIT_SHA;
async function remote(path) {
  const url = new URL(path, base + "/");
  url.searchParams.set("check", String(Date.now()));
  const response = await fetch(url, { cache: "no-store", signal: AbortSignal.timeout(15000) });
  if (!response.ok) throw new Error(`HTTP ${response.status}: ${url.pathname}`);
  return response.json();
}
try {
  if (index >= 0 && !/^https?:\/\//.test(base)) throw new Error("--url requires an http(s) URL");
  const data = base ? await remote("nbis.json") : JSON.parse(readFileSync(new URL("../../public/nbis.json", import.meta.url), "utf8"));
  const errors = validateNbisSnapshot(data, { requireFresh: true });
  if (errors.length) throw new Error(errors.join("; "));
  if (base && expectedSha) {
    const meta = await remote("build-meta.json");
    if (meta.gitSha !== expectedSha) throw new Error(`Deployed revision ${meta.gitSha} does not match ${expectedSha}`);
  }
  console.log(`NBIS freshness OK: ${data.fetchedAt} · ${data.priceHistory.length} price points`);
} catch (error) {
  console.error(error.message);
  process.exit(1);
}
