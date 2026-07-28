/**
 * AdSense config for StocksWatch — policy-safe placements only.
 *
 * Google policy: no Google-served ads on screens without (or with low-value)
 * publisher content, under construction, or used only for alerts/navigation.
 *
 * Rules enforced here:
 * - Live units only on pages that opt in (`allowAds` / content gates)
 * - Prefer mid-content + footer; hero/top-of-page is off by default
 * - Optional custom-domain requirement before serving live units
 * - Local preview boxes never ship in production builds
 *
 * Turn OFF “Auto ads” in the AdSense console — only use the manual units
 * we place after substantial content.
 */

import { getSiteSettings } from "./site-config";
import { stocks } from "../data/watchlist";

export type AdPlacement = "hero" | "board" | "footer";

export interface AdSenseConfig {
  client: string;
  enabled: boolean;
  /** True when we show the dashed local preview box instead of a real unit. */
  preview: boolean;
  slots: Record<AdPlacement, string>;
  /** Placements allowed by policy / settings (hero defaults off). */
  allowedPlacements: Record<AdPlacement, boolean>;
  verifyMeta: string;
  /** Why live ads are blocked (for docs / validate). Empty when OK. */
  blockReason: string | null;
}

function env(name: string): string {
  const fromImport = import.meta.env[name];
  if (typeof fromImport === "string" && fromImport.trim()) return fromImport.trim();
  if (typeof process !== "undefined" && process.env?.[name]) {
    return String(process.env[name]).trim();
  }
  return "";
}

function siteUrl(): string {
  return (
    env("STOCKS_RADAR_SITE") ||
    (typeof import.meta.env.SITE === "string" ? import.meta.env.SITE : "") ||
    ""
  ).replace(/\/$/, "");
}

function isCustomDomain(url: string): boolean {
  if (!url) return false;
  try {
    const host = new URL(url.startsWith("http") ? url : `https://${url}`).hostname;
    if (!host || host === "localhost") return false;
    if (/\.cloudfront\.net$/i.test(host)) return false;
    if (/\.amazonaws\.com$/i.test(host)) return false;
    return true;
  } catch {
    return false;
  }
}

/** Enough publisher content to justify ad inventory on the home board. */
export function hasPublisherContent(minTickers = 5): boolean {
  return Array.isArray(stocks) && stocks.length >= minTickers;
}

export function getAdSenseConfig(): AdSenseConfig {
  const client = env("PUBLIC_ADSENSE_CLIENT");
  const enabledFlag = env("PUBLIC_ADSENSE_ENABLED");
  const forcePreviewRequested = env("PUBLIC_ADSENSE_PREVIEW") === "true";
  const isDev = import.meta.env.DEV;
  const isProdBuild = import.meta.env.PROD;
  const settings = getSiteSettings();

  // Never ship preview placeholders from a production build (ignore force flag).
  const preview = isDev || (forcePreviewRequested && !isProdBuild);

  // Hero/top ads sit above the watchlist — high risk for “no publisher content”.
  // Opt in only with PUBLIC_ADSENSE_ALLOW_HERO=true after the page is content-rich.
  const allowHero = env("PUBLIC_ADSENSE_ALLOW_HERO") === "true";

  const allowedPlacements: Record<AdPlacement, boolean> = {
    hero: allowHero,
    board: true,
    footer: true,
  };

  let blockReason: string | null = null;
  const requireDomain = settings.seo?.requireCustomDomainForAds !== false;
  const url = siteUrl();

  if (!client) {
    blockReason = "PUBLIC_ADSENSE_CLIENT unset";
  } else if (enabledFlag === "false") {
    blockReason = "PUBLIC_ADSENSE_ENABLED=false";
  } else if (preview) {
    blockReason = "preview mode (dev)";
  } else if (requireDomain && !isCustomDomain(url)) {
    blockReason =
      "Live ads require a custom domain (seo.requireCustomDomainForAds) — see DOMAIN.md";
  } else if (!hasPublisherContent(5)) {
    blockReason = "Watchlist too small for ads (need ≥5 tickers with theses)";
  }

  const enabled =
    Boolean(client) &&
    enabledFlag !== "false" &&
    !preview &&
    blockReason === null;

  return {
    client,
    enabled,
    preview,
    slots: {
      hero: env("PUBLIC_ADSENSE_SLOT_HERO"),
      board: env("PUBLIC_ADSENSE_SLOT_BOARD"),
      footer: env("PUBLIC_ADSENSE_SLOT_FOOTER"),
    },
    allowedPlacements,
    verifyMeta: env("PUBLIC_ADSENSE_VERIFY_META"),
    blockReason: preview ? null : blockReason,
  };
}

export function slotIdFor(config: AdSenseConfig, placement: AdPlacement): string {
  return config.slots[placement];
}

/** Whether any live or preview unit can render for this placement. */
export function canShowAdSlot(config: AdSenseConfig, placement: AdPlacement): boolean {
  if (!config.allowedPlacements[placement]) return false;
  if (config.preview) return true;
  return (
    config.enabled &&
    Boolean(config.client) &&
    Boolean(config.slots[placement])
  );
}
