#!/usr/bin/env node
/**
 * Signal alerts — email users when *their* configured rules fire.
 *
 * Personal rules: src/data/alert-rules.json (subscriberId + signal + symbols/tags)
 * Emails live in Terraform alert_subscribers (not in git) → per-person SNS topics.
 *
 * Also supports legacy broadcast mode (all lean-buy/sell to one topic) when
 * ALERTS_BROADCAST=true or no personal rules are enabled.
 *
 * Env:
 *   STOCKS_RADAR_SITE / STOCKS_RADAR_CLOUDFRONT_DOMAIN — live quotes
 *   STOCKS_RADAR_ALERT_TOPICS — JSON map { "jacob": "arn:aws:sns:..." }
 *   STOCKS_RADAR_ALERTS_SNS_TOPIC_ARN / DIGEST — broadcast fallback topic
 *   STOCKS_RADAR_S3_BUCKET — optional; load/save cooldown under _private/ (not public via CF)
 *   ALERT_STATE_PATH — local state path (default .cache/alert-state.json)
 *   ALERT_STATE_S3_KEY — must be under _private/ (default _private/alert-state.json)
 *   ALERTS_DRY_RUN=true — print only
 *   ALERTS_ONLY_ON_SIGNAL=true — skip publish when nothing fresh
 *   ALERTS_BROADCAST=true — send legacy board-wide lean-buy/sell digest (explicit only)
 *   ALERTS_ALLOW_BROADCAST_FALLBACK=true — allow personal hits to use shared topic (INSECURE; off by default)
 *   AWS_REGION / AWS_PROFILE
 *
 * Optional OpenTelemetry (off unless OTEL_EXPORTER_OTLP_ENDPOINT is set):
 *   OTEL_EXPORTER_OTLP_ENDPOINT=http://localhost:4318 npm run alerts
 *   See OBSERVABILITY.md
 */

import { execFileSync } from "node:child_process";
import { existsSync, mkdirSync, readFileSync, writeFileSync } from "node:fs";
import { resolve, dirname } from "node:path";
import { fileURLToPath } from "node:url";
import { scoreWatchlist } from "./radar-score.mjs";
import {
  matchAlertRules,
  filterHitsByCooldown,
  updateFiredState,
} from "./match-alert-rules.mjs";
import { withOtel } from "./otel.mjs";
import { loadRuntimeConfig } from "./config.mjs";

const __dirname = dirname(fileURLToPath(import.meta.url));
const ROOT = resolve(__dirname, "..");
const WATCHLIST = resolve(ROOT, "src/data/watchlist.json");
const RULES = resolve(ROOT, "src/data/alert-rules.json");
const LOCAL_QUOTES = resolve(ROOT, "public/quotes.json");
const DEFAULT_STATE = resolve(ROOT, ".cache/alert-state.json");

const dryRun = process.env.ALERTS_DRY_RUN === "true" || process.env.DIGEST_DRY_RUN === "true";
const runtime = loadRuntimeConfig();
const region = process.env.AWS_REGION || runtime.ops.awsRegion || "us-west-2";
const profile = process.env.AWS_PROFILE || runtime.ops.awsProfile || "";
const bucket = process.env.STOCKS_RADAR_S3_BUCKET?.trim() || runtime.site.s3Bucket || "";
const rawStateKey = process.env.ALERT_STATE_S3_KEY?.trim() || "_private/alert-state.json";
if (!rawStateKey.startsWith("_private/")) {
  console.error(
    `ALERT_STATE_S3_KEY must start with "_private/" (got "${rawStateKey}") — refusing public path`,
  );
  process.exit(1);
}
const stateKey = rawStateKey;
const statePath = process.env.ALERT_STATE_PATH?.trim() || DEFAULT_STATE;
const onlyOnSignal =
  process.env.ALERTS_ONLY_ON_SIGNAL != null
    ? process.env.ALERTS_ONLY_ON_SIGNAL === "true"
    : runtime.alerts.onlyOnSignal;
const forceBroadcast = process.env.ALERTS_BROADCAST === "true";
const allowBroadcastFallback = process.env.ALERTS_ALLOW_BROADCAST_FALLBACK === "true";

const broadcastTopic =
  process.env.STOCKS_RADAR_ALERTS_SNS_TOPIC_ARN?.trim() ||
  process.env.STOCKS_RADAR_DIGEST_SNS_TOPIC_ARN?.trim() ||
  "";

let topicMap = {};
try {
  topicMap = JSON.parse(process.env.STOCKS_RADAR_ALERT_TOPICS || "{}");
} catch {
  console.warn("STOCKS_RADAR_ALERT_TOPICS is not valid JSON — personal emails disabled");
}

let site =
  process.env.STOCKS_RADAR_SITE?.replace(/\/$/, "") ||
  (process.env.STOCKS_RADAR_CLOUDFRONT_DOMAIN
    ? `https://${process.env.STOCKS_RADAR_CLOUDFRONT_DOMAIN.replace(/^https?:\/\//, "")}`
    : "");

function aws(args, { json = true } = {}) {
  const cmd = ["aws", ...args, "--region", region];
  if (json) cmd.push("--output", "json");
  if (profile) cmd.push("--profile", profile);
  const out = execFileSync(cmd[0], cmd.slice(1), { encoding: "utf8" });
  if (!json) return out;
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

function loadState() {
  if (bucket) {
    try {
      const out = execFileSync(
        "aws",
        [
          "s3",
          "cp",
          `s3://${bucket}/${stateKey}`,
          "-",
          "--region",
          region,
          ...(profile ? ["--profile", profile] : []),
        ],
        { encoding: "utf8" }
      );
      return JSON.parse(out);
    } catch {
      /* first run or missing */
    }
  }
  if (existsSync(statePath)) {
    try {
      return JSON.parse(readFileSync(statePath, "utf8"));
    } catch {
      return { fired: {} };
    }
  }
  return { fired: {} };
}

function saveState(state) {
  const body = JSON.stringify(state, null, 2) + "\n";
  if (dryRun) {
    console.log(
      `(dry run — state would save to ${statePath}${bucket ? ` and s3://${bucket}/${stateKey}` : ""})`
    );
    return;
  }
  mkdirSync(dirname(statePath), { recursive: true });
  writeFileSync(statePath, body);
  if (bucket) {
    aws(
      [
        "s3",
        "cp",
        statePath,
        `s3://${bucket}/${stateKey}`,
        "--content-type",
        "application/json",
        "--cache-control",
        "no-store",
      ],
      { json: false }
    );
    console.log(`✓ cooldown state → s3://${bucket}/${stateKey} (CloudFront-blocked _private/)`);
  } else {
    console.log(`✓ cooldown state → ${statePath}`);
  }
}

function publish(topicArn, subject, message) {
  if (!topicArn) {
    console.log(`(no topic for subject: ${subject})`);
    return false;
  }
  if (dryRun) {
    console.log(`(dry run — would publish to ${topicArn})`);
    console.log(`  subject: ${subject}`);
    return true;
  }
  aws([
    "sns",
    "publish",
    "--topic-arn",
    topicArn,
    "--subject",
    subject.slice(0, 100),
    "--message",
    message,
  ]);
  console.log(`✓ published to ${topicArn}`);
  return true;
}

function fmtPct(v) {
  if (v == null || Number.isNaN(v)) return "—";
  const sign = v > 0 ? "+" : "";
  return `${sign}${v.toFixed(1)}%`;
}

function lineBroadcast(row) {
  const chg = fmtPct(row.changePct);
  return `  ${row.symbol.padEnd(6)} ${row.label} (score ${row.score}) ${chg}\n    ${row.reason}`;
}

function buildPersonalEmail(subscriberId, rows, meta) {
  const lines = [
    "Stocks Radar — personal signal alert",
    `For: ${subscriberId}`,
    `Generated: ${meta.when}`,
    `Quotes as of: ${meta.fetchedAt}`,
    meta.site ? `Site: ${meta.site}` : "Source: local quotes.json",
    "",
    `Matched rules (${rows.length}):`,
    "",
  ];
  for (const row of rows) {
    const note = row.rule.note ? ` — ${row.rule.note}` : "";
    lines.push(`• ${row.hit.summary}${note}`);
    lines.push(`  Rule: ${row.rule.id} (${row.rule.signal})`);
    if (row.hit.detail) lines.push(`  ${row.hit.detail}`);
    if (row.hit.price != null) {
      lines.push(`  Price: $${Number(row.hit.price).toFixed(2)} · Day: ${fmtPct(row.hit.changePct)}`);
    }
    lines.push("");
  }
  lines.push(
    "Not financial advice — you asked to be notified when this condition was met.",
    "Edit rules in stocks/radar/src/data/alert-rules.json · see ALERTS.md"
  );
  return lines.join("\n") + "\n";
}

await withOtel("stocks-radar-alerts", async (otel) => {
  await otel.withSpan("signal-alerts.run", async (root) => {
    const watchlist = JSON.parse(readFileSync(WATCHLIST, "utf8"));
    const rulesConfig = existsSync(RULES)
      ? JSON.parse(readFileSync(RULES, "utf8"))
      : { rules: [], defaults: {} };
    const data = await otel.withSpan("alerts.load_quotes", () => loadQuotes());
    const quotes = data.quotes || {};
    const fetchedAt = data.fetchedAt || data.updatedAt || "unknown";
    const when = new Date().toISOString();
    const cooldownHours = rulesConfig.defaults?.cooldownHours ?? runtime.alerts.defaultCooldownHours;

    const enabledRules = (rulesConfig.rules || []).filter((r) => r && r.enabled !== false);
    const hits = matchAlertRules(rulesConfig, watchlist.stocks || [], quotes);
    const state = loadState();
    const { fresh, skipped } = filterHitsByCooldown(hits, state, Date.now(), cooldownHours);

    root.setAttributes({
      "radar.rules_enabled": enabledRules.length,
      "radar.hits_total": hits.length,
      "radar.hits_fresh": fresh.length,
      "radar.hits_cooldown": skipped.length,
      "radar.quote_coverage": data.count ?? Object.keys(quotes).length,
      "radar.dry_run": dryRun,
    });

    console.log(`Rules enabled: ${enabledRules.length}`);
    console.log(
      `Hits this run: ${hits.length} (${fresh.length} fresh, ${skipped.length} in cooldown)`
    );

    const bySubscriber = new Map();
    for (const row of fresh) {
      const id = row.rule.subscriberId;
      if (!bySubscriber.has(id)) bySubscriber.set(id, []);
      bySubscriber.get(id).push(row);
    }

    root.setAttribute("radar.subscribers_notified", bySubscriber.size);

    const outChunks = [];
    let published = 0;

    for (const [subscriberId, rows] of bySubscriber) {
      await otel.withSpan(
        "alerts.publish_personal",
        async (span) => {
          const body = buildPersonalEmail(subscriberId, rows, { when, fetchedAt, site });
          outChunks.push(body);
          console.log(body);

          const mapped = topicMap[subscriberId];
          if (!mapped) {
            const msg = `No STOCKS_RADAR_ALERT_TOPICS["${subscriberId}"] — skipping personal publish (fail-closed)`;
            if (allowBroadcastFallback && broadcastTopic) {
              console.warn(`${msg}; ALERTS_ALLOW_BROADCAST_FALLBACK=true → using shared topic`);
            } else {
              console.warn(msg);
              span.setAttributes({ "radar.skipped_no_topic": true });
              return;
            }
          }
          const topic = mapped || broadcastTopic;
          const symbols = [...new Set(rows.map((r) => r.stock.symbol))].join(", ");
          const subject = `Radar alert (${subscriberId}): ${symbols}`.slice(0, 100);

          span.setAttributes({
            "radar.subscriber_id": subscriberId,
            "radar.hit_count": rows.length,
            "radar.symbols": symbols,
            "radar.has_topic": Boolean(topic),
          });

          if (onlyOnSignal && rows.length === 0) return;
          if (publish(topic, subject, body)) published++;
        },
        { "radar.subscriber_id": subscriberId }
      );
    }

    // Legacy board-wide broadcast (optional)
    if (forceBroadcast || (enabledRules.length === 0 && broadcastTopic)) {
      await otel.withSpan("alerts.publish_broadcast", async (span) => {
        const scored = scoreWatchlist(watchlist.stocks || [], quotes);
        const minBuy = Number(process.env.ALERT_MIN_BUY_SCORE || runtime.alerts.minBuyScore);
        const nearPct = Number(
          process.env.ALERT_NEAR_TARGET_PCT ||
            rulesConfig.defaults?.nearTargetPct ||
            runtime.alerts.nearTargetPct
        );
        const buy = scored.buy.filter((r) => r.score >= minBuy);
        const sell = scored.sell;
        const nearTarget = scored.nearTarget.filter(
          (r) => r.distPct != null && Math.abs(r.distPct) <= nearPct
        );
        const hasSignal = buy.length > 0 || sell.length > 0 || nearTarget.length > 0;

        span.setAttributes({
          "radar.broadcast_buy": buy.length,
          "radar.broadcast_sell": sell.length,
          "radar.broadcast_near_target": nearTarget.length,
        });

        const lines = [
          "Stocks Radar — board-wide signal alert",
          `Generated: ${when}`,
          `Quotes as of: ${fetchedAt}`,
          "",
        ];
        if (buy.length) {
          lines.push(`--- Lean buy (${buy.length}) ---`);
          for (const r of buy) lines.push(lineBroadcast(r));
          lines.push("");
        }
        if (sell.length) {
          lines.push(`--- Lean sell (${sell.length}) ---`);
          for (const r of sell) lines.push(lineBroadcast(r));
          lines.push("");
        }
        if (nearTarget.length) {
          lines.push(`--- Near target ±${nearPct}% ---`);
          for (const r of nearTarget) lines.push(lineBroadcast(r));
          lines.push("");
        }
        if (!hasSignal) lines.push("(no board-wide signals)", "");
        lines.push("Not financial advice.");
        const body = lines.join("\n") + "\n";
        outChunks.push(body);
        console.log(body);

        if (!(onlyOnSignal && !hasSignal)) {
          const subjectParts = [];
          if (buy.length) subjectParts.push(`${buy.length} lean-buy`);
          if (sell.length) subjectParts.push(`${sell.length} lean-sell`);
          const subject = hasSignal
            ? `Radar signals: ${subjectParts.join(", ")}`
            : "Radar signals: quiet tape";
          if (publish(broadcastTopic, subject, body)) published++;
        }
      });
    }

    if (fresh.length) {
      const nextState = updateFiredState(state, fresh, when);
      saveState(nextState);
    } else {
      console.log("(no fresh hits — cooldown state unchanged)");
    }

    root.setAttribute("radar.published_count", published);

    const outPath = process.env.ALERTS_OUTPUT_PATH || process.env.DIGEST_OUTPUT_PATH;
    if (outPath) {
      writeFileSync(
        outPath,
        outChunks.join("\n---\n\n") ||
          `No personal alert hits.\nFresh: 0 · Cooldown: ${skipped.length}\n`
      );
    }

    if (!published && dryRun) {
      console.log("(dry run complete)");
    } else if (!published && onlyOnSignal) {
      console.log("(nothing published — quiet or cooldown)");
    }
  });
});

