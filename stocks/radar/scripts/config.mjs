/**
 * Unified Stocks Radar configuration — site-settings.json + environment overlays.
 * Used by Node scripts (quotes, alerts, validate, health). No secrets in the JSON file.
 */

import { existsSync, readFileSync } from "node:fs";
import { resolve, dirname } from "node:path";
import { fileURLToPath } from "node:url";

const __dirname = dirname(fileURLToPath(import.meta.url));
const ROOT = resolve(__dirname, "..");
const SETTINGS_PATH = resolve(ROOT, "src/data/site-settings.json");

function truthy(v, fallback = false) {
  if (v == null || v === "") return fallback;
  return !["0", "false", "no", "off"].includes(String(v).toLowerCase());
}

function num(v, fallback) {
  const n = Number(v);
  return Number.isFinite(n) ? n : fallback;
}

export function loadSiteSettings() {
  const raw = JSON.parse(readFileSync(SETTINGS_PATH, "utf8"));
  return raw;
}

/**
 * Resolve runtime config for scripts / CI.
 * @param {{ production?: boolean }} [opts]
 */
export function loadRuntimeConfig(opts = {}) {
  const settings = loadSiteSettings();
  const production =
    opts.production === true ||
    process.env.STOCKS_RADAR_ENV === "production" ||
    process.env.DEPLOY_PROVIDER === "github-actions" ||
    Boolean(process.env.GITHUB_ACTIONS);

  const site =
    process.env.STOCKS_RADAR_SITE?.replace(/\/$/, "") ||
    (process.env.STOCKS_RADAR_CLOUDFRONT_DOMAIN
      ? `https://${process.env.STOCKS_RADAR_CLOUDFRONT_DOMAIN.replace(/^https?:\/\//, "")}`
      : "");

  const environment =
    process.env.STOCKS_RADAR_ENV ||
    (production ? "production" : settings.app?.environment || "development");

  return {
    app: {
      name: settings.app?.name || "Stocks Radar",
      version: settings.app?.version || "0.0.0",
      environment,
      production,
    },
    site: {
      url: site,
      base: process.env.STOCKS_RADAR_BASE || "/",
      cloudfrontDomain: process.env.STOCKS_RADAR_CLOUDFRONT_DOMAIN || "",
      s3Bucket: process.env.STOCKS_RADAR_S3_BUCKET || "",
      distributionId: process.env.STOCKS_RADAR_CLOUDFRONT_DISTRIBUTION_ID || "",
    },
    features: {
      adsense: truthy(process.env.PUBLIC_ADSENSE_ENABLED, settings.features?.adsense !== false),
      personalAlerts: settings.features?.personalAlerts !== false,
      groupSubmissions: settings.features?.groupSubmissions !== false,
      checkInPulse: settings.features?.checkInPulse !== false,
      technicalView: settings.features?.technicalView !== false,
      dayMood: settings.features?.dayMood !== false,
      otelScripts: settings.features?.otelScripts === true,
    },
    quotes: {
      staleAfterHours: num(
        process.env.QUOTES_STALE_AFTER_HOURS,
        settings.quotes?.staleAfterHours ?? 6
      ),
      pollIntervalMs: settings.quotes?.pollIntervalMs ?? 300_000,
      browserFallback: settings.quotes?.browserFallback === true,
      yahooChunkSize: settings.quotes?.yahooChunkSize ?? 8,
      yahooMaxRetries: settings.quotes?.yahooMaxRetries ?? 3,
    },
    board: {
      defaultPageSize: settings.board?.defaultPageSize ?? 50,
      defaultSort: settings.board?.defaultSort ?? "symbol",
      defaultView: settings.board?.defaultView ?? "table",
      pageSizeOptions: settings.board?.pageSizeOptions ?? [25, 50, 100],
    },
    alerts: {
      defaultCooldownHours: settings.alerts?.defaultCooldownHours ?? 24,
      nearTargetPct: num(process.env.ALERT_NEAR_TARGET_PCT, settings.alerts?.nearTargetPct ?? 5),
      minBuyScore: num(process.env.ALERT_MIN_BUY_SCORE, settings.alerts?.minBuyScore ?? 3),
      onlyOnSignal: truthy(process.env.ALERTS_ONLY_ON_SIGNAL, settings.alerts?.onlyOnSignal !== false),
    },
    adsense: {
      client: process.env.PUBLIC_ADSENSE_CLIENT || "",
      enabled: truthy(process.env.PUBLIC_ADSENSE_ENABLED, false) && Boolean(process.env.PUBLIC_ADSENSE_CLIENT),
      slots: {
        hero: process.env.PUBLIC_ADSENSE_SLOT_HERO || "",
        board: process.env.PUBLIC_ADSENSE_SLOT_BOARD || "",
        footer: process.env.PUBLIC_ADSENSE_SLOT_FOOTER || "",
      },
    },
    otel: {
      endpoint: process.env.OTEL_EXPORTER_OTLP_ENDPOINT || "",
      enabled:
        settings.features?.otelScripts === true &&
        Boolean(process.env.OTEL_EXPORTER_OTLP_ENDPOINT) &&
        process.env.OTEL_SDK_DISABLED !== "true",
    },
    ops: {
      healthPath: settings.ops?.healthPath || "/health.json",
      settingsPath: settings.ops?.settingsPath || "/settings.json",
      budgetUsd: settings.ops?.budgetUsd ?? 3,
      awsRegion: process.env.AWS_REGION || "us-west-2",
      awsProfile: process.env.AWS_PROFILE || "",
    },
    rawSettings: settings,
    settingsPath: SETTINGS_PATH,
    root: ROOT,
  };
}

/** Public payload — safe to publish (no secrets). */
export function publicSettingsPayload(config = loadRuntimeConfig()) {
  return {
    app: config.app,
    features: {
      adsense: config.features.adsense,
      personalAlerts: config.features.personalAlerts,
      groupSubmissions: config.features.groupSubmissions,
      checkInPulse: config.features.checkInPulse,
      technicalView: config.features.technicalView,
      dayMood: config.features.dayMood,
    },
    quotes: {
      staleAfterHours: config.quotes.staleAfterHours,
      pollIntervalMs: config.quotes.pollIntervalMs,
      browserFallback: config.quotes.browserFallback,
    },
    board: config.board,
    alerts: {
      defaultCooldownHours: config.alerts.defaultCooldownHours,
      nearTargetPct: config.alerts.nearTargetPct,
      minBuyScore: config.alerts.minBuyScore,
    },
    ops: {
      healthPath: config.ops.healthPath,
      settingsPath: config.ops.settingsPath,
    },
    siteUrl: config.site.url || null,
    generatedAt: new Date().toISOString(),
  };
}

export function configExists() {
  return existsSync(SETTINGS_PATH);
}
