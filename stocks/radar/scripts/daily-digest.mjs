#!/usr/bin/env node
/**
 * Daily Stocks Radar digest — CloudFront viewers (24h) + watchlist mood.
 * Runs in GitHub Actions (cron) or locally with AWS CLI + profile.
 *
 * Env:
 *   STOCKS_RADAR_CLOUDFRONT_DISTRIBUTION_ID (required for metrics)
 *   STOCKS_RADAR_SITE or STOCKS_RADAR_CLOUDFRONT_DOMAIN (site URL for quotes)
 *   STOCKS_RADAR_DIGEST_SNS_TOPIC_ARN (optional — publish email via SNS)
 *   AWS_REGION / AWS_PROFILE
 *   DIGEST_DRY_RUN=true — print only, do not publish
 */

import { execFileSync } from "node:child_process";
import { existsSync, readFileSync, writeFileSync } from "node:fs";
import { resolve, dirname } from "node:path";
import { fileURLToPath } from "node:url";
import { scoreWatchlist } from "./radar-score.mjs";

const __dirname = dirname(fileURLToPath(import.meta.url));
const ROOT = resolve(__dirname, "..");
const WATCHLIST = resolve(ROOT, "src/data/watchlist.json");
const OUTLOOK = resolve(ROOT, "public/outlook.json");

const distId = process.env.STOCKS_RADAR_CLOUDFRONT_DISTRIBUTION_ID?.trim();
const topicArn = process.env.STOCKS_RADAR_DIGEST_SNS_TOPIC_ARN?.trim();
const dryRun = process.env.DIGEST_DRY_RUN === "true";
const region = process.env.AWS_REGION || "us-west-2";
const profile = process.env.AWS_PROFILE || "";

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

function metricSum(metricName) {
  if (!distId) return null;
  const end = new Date();
  const start = new Date(end.getTime() - 24 * 60 * 60 * 1000);
  const data = aws([
    "cloudwatch",
    "get-metric-statistics",
    "--namespace",
    "AWS/CloudFront",
    "--metric-name",
    metricName,
    "--dimensions",
    `Name=DistributionId,Value=${distId},Name=Region,Value=Global`,
    "--start-time",
    start.toISOString(),
    "--end-time",
    end.toISOString(),
    "--period",
    "86400",
    "--statistics",
    "Sum",
  ]);
  const points = data?.Datapoints || [];
  if (!points.length) return 0;
  return points.reduce((s, p) => s + (p.Sum || 0), 0);
}

async function loadQuotesPayload() {
  if (site) {
    const res = await fetch(`${site}/quotes.json?t=${Date.now()}`, { cache: "no-store" });
    if (!res.ok) throw new Error(`quotes.json HTTP ${res.status}`);
    return res.json();
  }
  const local = resolve(ROOT, "public/quotes.json");
  if (!existsSync(local)) throw new Error("No site URL and no public/quotes.json");
  return JSON.parse(readFileSync(local, "utf8"));
}

async function watchlistMood() {
  try {
    const data = await loadQuotesPayload();
    const quotes = data.quotes || {};
    let up = 0;
    let down = 0;
    let flat = 0;
    let n = 0;
    let sum = 0;
    for (const q of Object.values(quotes)) {
      if (!q || q.changePct == null || Number.isNaN(q.changePct)) continue;
      n++;
      sum += q.changePct;
      if (q.changePct > 0.05) up++;
      else if (q.changePct < -0.05) down++;
      else flat++;
    }
    if (!n) return { ok: false, note: "No quote changes yet", data };
    const avg = sum / n;
    let mood = "mixed";
    if (up > down * 1.35 && avg >= 0.1) mood = "bullish";
    else if (down > up * 1.35 && avg <= -0.1) mood = "bearish";
    return {
      ok: true,
      mood,
      up,
      down,
      flat,
      counted: n,
      avg: Number(avg.toFixed(2)),
      fetchedAt: data.fetchedAt || data.updatedAt || "unknown",
      partial: Boolean(data.partial),
      coverage: `${data.count ?? n}/${data.total ?? n}`,
      data,
    };
  } catch (e) {
    return { ok: false, note: String(e.message || e) };
  }
}

function formatBytes(n) {
  if (n == null) return "n/a";
  if (n < 1024) return `${Math.round(n)} B`;
  if (n < 1024 ** 2) return `${(n / 1024).toFixed(1)} KB`;
  if (n < 1024 ** 3) return `${(n / 1024 ** 2).toFixed(1)} MB`;
  return `${(n / 1024 ** 3).toFixed(2)} GB`;
}

const requests = distId ? metricSum("Requests") : null;
const bytes = distId ? metricSum("BytesDownloaded") : null;
const mood = await watchlistMood();
const when = new Date().toISOString();

const lines = [
  "Stocks Radar — daily digest",
  `Generated: ${when}`,
  site ? `Site: ${site}` : "Site: (unset)",
  "",
  "--- Viewers (CloudFront, last ~24h) ---",
  distId
    ? `Requests: ${Math.round(requests ?? 0)}\nBytes transferred: ${formatBytes(bytes)}\nDistribution: ${distId}`
    : "CloudFront distribution ID not set — skip viewer metrics",
  "",
  "--- Watchlist mood ---",
];

if (mood.ok) {
  lines.push(
    `Mood: ${mood.mood}`,
    `Tickers with quotes: ${mood.counted}`,
    `Coverage: ${mood.coverage}${mood.partial ? " (partial)" : ""}`,
    `Up / down / flat: ${mood.up} / ${mood.down} / ${mood.flat}`,
    `Avg change: ${mood.avg >= 0 ? "+" : ""}${mood.avg}%`,
    `Quotes as of: ${mood.fetchedAt}`,
  );
} else {
  lines.push(`Unavailable: ${mood.note}`);
}

try {
  const watchlist = JSON.parse(readFileSync(WATCHLIST, "utf8"));
  const quotes = mood.data?.quotes || {};
  let outlookStocks = {};
  if (existsSync(OUTLOOK)) {
    try {
      outlookStocks = JSON.parse(readFileSync(OUTLOOK, "utf8")).stocks || {};
    } catch {
      outlookStocks = {};
    }
  }
  const scored = scoreWatchlist(watchlist.stocks || [], quotes, outlookStocks);
  lines.push("", "--- Radar signals ---");
  if (scored.buy.length) {
    lines.push(`Lean buy: ${scored.buy.map((r) => `${r.symbol}(${r.score})`).join(", ")}`);
  } else {
    lines.push("Lean buy: (none)");
  }
  if (scored.sell.length) {
    lines.push(`Lean sell: ${scored.sell.map((r) => `${r.symbol}(${r.score})`).join(", ")}`);
  } else {
    lines.push("Lean sell: (none)");
  }
  if (scored.nearTarget.length) {
    lines.push(
      `Near target ±5%: ${scored.nearTarget
        .map((r) => `${r.symbol}(${r.distPct.toFixed(1)}%)`)
        .join(", ")}`
    );
  }
  if (scored.missing.length) {
    lines.push(`Missing quotes: ${scored.missing.join(", ")}`);
  }
} catch (e) {
  lines.push("", `--- Radar signals ---`, `Unavailable: ${e.message || e}`);
}

lines.push(
  "",
  "--- Cost reminder ---",
  "Friend-feedback hosting is S3 + CloudFront only (~$0.50–3/mo).",
  "When feedback is done: empty the bucket if needed, then terraform destroy.",
  "See stocks/radar/FRIENDS_FEEDBACK.md",
);

const body = lines.join("\n") + "\n";
console.log(body);

const outPath = process.env.DIGEST_OUTPUT_PATH;
if (outPath) writeFileSync(outPath, body);

if (topicArn && !dryRun) {
  aws([
    "sns",
    "publish",
    "--topic-arn",
    topicArn,
    "--subject",
    `Radar digest: ${mood.ok ? mood.mood : "update"} / ${Math.round(requests ?? 0)} req`,
    "--message",
    body,
  ]);
  console.log(`✓ published to SNS ${topicArn}`);
} else if (dryRun) {
  console.log("(dry run — not published)");
} else {
  console.log("(no STOCKS_RADAR_DIGEST_SNS_TOPIC_ARN — printed only)");
}
