/**
 * Unified StocksWatch configuration — site-settings.json + environment overlays.
 * No secrets are stored in the JSON file or returned by publicSettingsPayload().
 */

import { existsSync, readFileSync } from "node:fs";
import { resolve, dirname } from "node:path";
import { fileURLToPath } from "node:url";

const __dirname = dirname(fileURLToPath(import.meta.url));
const ROOT = resolve(__dirname, "..");
const SETTINGS_PATH = resolve(ROOT, "src/data/site-settings.json");

function truthy(value, fallback = false) {
  if (value == null || value === "") return fallback;
  return !["0", "false", "no", "off"].includes(String(value).toLowerCase());
}

export function loadSiteSettings() {
  return JSON.parse(readFileSync(SETTINGS_PATH, "utf8"));
}

/** @param {{ production?: boolean }} [opts] */
export function loadRuntimeConfig(opts = {}) {
  const settings = loadSiteSettings();
  const production =
    opts.production === true ||
    process.env.STOCKS_RADAR_ENV === "production" ||
    process.env.DEPLOY_PROVIDER === "github-actions" ||
    Boolean(process.env.GITHUB_ACTIONS);
  const site = process.env.STOCKS_RADAR_SITE?.replace(/\/$/, "") || "";
  const environment =
    process.env.STOCKS_RADAR_ENV ||
    (production ? "production" : settings.app?.environment || "development");

  return {
    app: {
      name: settings.app?.name || "StocksWatch",
      version: settings.app?.version || "0.0.0",
      environment,
      production,
    },
    site: {
      url: site,
      base: process.env.STOCKS_RADAR_BASE || "/",
    },
    features: {
      adsense: truthy(process.env.PUBLIC_ADSENSE_ENABLED, settings.features?.adsense !== false),
    },
    adsense: {
      client: process.env.PUBLIC_ADSENSE_CLIENT || "",
      enabled: truthy(process.env.PUBLIC_ADSENSE_ENABLED, false) && process.env.PUBLIC_ADSENSE_CONSENT_READY === "true" && Boolean(process.env.PUBLIC_ADSENSE_CLIENT),
      slots: {
        hero: process.env.PUBLIC_ADSENSE_SLOT_HERO || "",
        board: process.env.PUBLIC_ADSENSE_SLOT_BOARD || "",
        footer: process.env.PUBLIC_ADSENSE_SLOT_FOOTER || "",
      },
    },
    ops: {
      healthPath: settings.ops?.healthPath || "/health.json",
      settingsPath: settings.ops?.settingsPath || "/settings.json",
      budgetUsd: settings.ops?.budgetUsd ?? 3,
    },
    rawSettings: settings,
    settingsPath: SETTINGS_PATH,
    root: ROOT,
  };
}

/** Safe payload — no provider credentials or ad IDs. */
export function publicSettingsPayload(config = loadRuntimeConfig()) {
  return {
    app: config.app,
    features: {
      adsense: config.features.adsense,
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
