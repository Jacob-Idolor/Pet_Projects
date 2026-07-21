#!/usr/bin/env node
/**
 * Signal alerts — email lean-buy / lean-sell / near-target names via SNS.
 * No Lambda: GitHub Actions (or laptop) runs this after quotes refresh.
 *
 * Env:
 *   STOCKS_RADAR_SITE or STOCKS_RADAR_CLOUDFRONT_DOMAIN — fetch live quotes.json
 *   Or omit site URL to use local public/quotes.json + watchlist.json
 *   STOCKS_RADAR_ALERTS_SNS_TOPIC_ARN — publish (falls back to DIGEST topic)
 *   STOCKS_RADAR_DIGEST_SNS_TOPIC_ARN — fallback topic
 *   ALERT_MIN_BUY_SCORE=2  ALERT_NEAR_TARGET_PCT=5
 *   ALERTS_DRY_RUN=true — print only
 *   AWS_REGION / AWS_PROFILE
 */

import { execFileSync } from "node:child_process";
import { existsSync, readFileSync, writeFileSync } from "node:fs";
import { resolve, dirname } from "node:path";
import { fileURLToPath } from "node:url";
import { scoreWatchlist } from "./radar-score.mjs";

const __dirname = dirname(fileURLToPath(import.meta.url));
const ROOT = resolve(__dirname, "..");
const WATCHLIST = resolve(ROOT, "src/data/watchlist.json");
const LOCAL_QUOTES = resolve(ROOT, "public/quotes.json");

const dryRun = process.env.ALERTS_DRY_RUN === "true" || process.env.DIGEST_DRY_RUN === "true";
const region = process.env.AWS_REGION || "us-west-2";
const profile = process.env.AWS_PROFILE || "";
const topicArn =
  process.env.STOCKS_RADAR_ALERTS_SNS_TOPIC_ARN?.trim() ||
  process.env.STOCKS_RADAR_DIGEST_SNS_TOPIC_ARN?.trim() ||
  "";
const minBuy = Number(process.env.ALERT_MIN_BUY_SCORE || 2);
const nearPct = Number(process.env.ALERT_NEAR_TARGET_PCT || 5);

let site =
  process.env.STOCKS_RADAR_SITE?.replace(/\/$/, "") ||
  (process.env.STOCKS_RADAR_CLOUDFRONT_DOMAIN
    ? `https://${process.env.STOCKS_RADAR_CLOUDFRONT_DOMAIN.replace(/^https?:\/\//, "")}`
    : "");

function aws(args) {
  const cmd = ["aws", ...args, "--region", region, "--output", "json"];
  if (profile) cmd.push("--profile", profile);
  const out = execFileSync(cmd[0], cmd.slice(1), { encoding: "utf8" });
  return out ? JSON.parse(out) : null;
}

async function loadQuotes() {
  if (site) {
    const res = await fetch(`${site}/quotes.json?t=${Date.now()}`, { cache: "no-store" });
    if (!res.ok) throw new Error(`quotes.json HTTP ${res.status} from ${site}`);
    return res.json();
  }
  if (!existsSync(LOCAL_QUOTES)) throw new Error("No site URL and no public/quotes.json");
  return JSON.parse(readFileSync(LOCAL_QUOTES, "utf8"));
}

function fmtPct(v) {
  if (v == null || Number.isNaN(v)) return "—";
  const sign = v > 0 ? "+" : "";
  return `${sign}${v.toFixed(1)}%`;
}

function lineFor(row) {
  const chg = fmtPct(row.changePct);
  const tgt =
    row.distPct != null
      ? ` · target ${fmtPct(row.distPct)}`
      : row.targetPrice != null
        ? ` · target $${row.targetPrice}`
        : "";
  return `  ${row.symbol.padEnd(6)} ${row.label} (score ${row.score}) ${chg}${tgt}\n    ${row.reason}`;
}

const watchlist = JSON.parse(readFileSync(WATCHLIST, "utf8"));
const data = await loadQuotes();
const quotes = data.quotes || {};
const scored = scoreWatchlist(watchlist.stocks, quotes);

const buy = scored.buy.filter((r) => r.score >= minBuy);
const sell = scored.sell;
const nearTarget = scored.nearTarget.filter(
  (r) => r.distPct != null && Math.abs(r.distPct) <= nearPct
);

const fetchedAt = data.fetchedAt || data.updatedAt || "unknown";
const when = new Date().toISOString();
const hasSignal = buy.length > 0 || sell.length > 0 || nearTarget.length > 0;

const lines = [
  "Stocks Radar — signal alert",
  `Generated: ${when}`,
  `Quotes as of: ${fetchedAt}`,
  data.partial ? `Coverage: PARTIAL ${data.count}/${data.total}` : `Coverage: ${data.count}/${data.total}`,
  site ? `Site: ${site}` : "Source: local quotes.json",
  "",
];

if (buy.length) {
  lines.push(`--- Lean buy (${buy.length}) ---`);
  for (const r of buy) lines.push(lineFor(r));
  lines.push("");
} else {
  lines.push("--- Lean buy ---", "  (none)", "");
}

if (sell.length) {
  lines.push(`--- Lean sell / caution (${sell.length}) ---`);
  for (const r of sell) lines.push(lineFor(r));
  lines.push("");
} else {
  lines.push("--- Lean sell / caution ---", "  (none)", "");
}

if (nearTarget.length) {
  lines.push(`--- Near price target ±${nearPct}% (${nearTarget.length}) ---`);
  for (const r of nearTarget) lines.push(lineFor(r));
  lines.push("");
}

if (scored.missing.length) {
  lines.push(`Missing quotes: ${scored.missing.join(", ")}`, "");
}

lines.push(
  "Not financial advice — group check-in signals only.",
  "See stocks/radar/README.md"
);

const body = lines.join("\n") + "\n";
console.log(body);

const outPath = process.env.ALERTS_OUTPUT_PATH || process.env.DIGEST_OUTPUT_PATH;
if (outPath) writeFileSync(outPath, body);

const subjectParts = [];
if (buy.length) subjectParts.push(`${buy.length} lean-buy`);
if (sell.length) subjectParts.push(`${sell.length} lean-sell`);
if (nearTarget.length) subjectParts.push(`${nearTarget.length} near-target`);
const subject = hasSignal
  ? `Radar signals: ${subjectParts.join(", ")}`
  : "Radar signals: quiet tape";

if (!hasSignal && process.env.ALERTS_ONLY_ON_SIGNAL === "true") {
  console.log("(quiet — ALERTS_ONLY_ON_SIGNAL=true, not publishing)");
} else if (topicArn && !dryRun) {
  aws([
    "sns",
    "publish",
    "--topic-arn",
    topicArn,
    "--subject",
    subject.slice(0, 100),
    "--message",
    body,
  ]);
  console.log(`✓ published to SNS ${topicArn}`);
} else if (dryRun) {
  console.log("(dry run — not published)");
} else {
  console.log("(no alerts/digest SNS topic — printed only)");
}
