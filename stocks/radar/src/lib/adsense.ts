/**
 * AdSense config for StocksWatch — policy-safe placements only.
 *
 * Google policy: no Google-served ads on screens without (or with low-value)
 * publisher content, under construction, or used only for alerts/navigation.
 *
 * Pure gates live in scripts/lib/adsense-policy.mjs (unit-tested).
 * Turn OFF “Auto ads” in the AdSense console — only use manual units after content.
 */

import {
  canShowAdSlot as canShowAdSlotPure,
  evaluateLiveAdsGate,
  hasPublisherContent as hasPublisherContentCount,
  isCustomDomain,
} from "../../scripts/lib/adsense-policy.mjs";
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

export { isCustomDomain };

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

/** Enough publisher content to justify ad inventory on the home board. */
export function hasPublisherContent(minTickers = 5): boolean {
  return hasPublisherContentCount(stocks.length, minTickers);
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

  const requireDomain = settings.seo?.requireCustomDomainForAds !== false;
  const { enabled, blockReason } = evaluateLiveAdsGate({
    client,
    enabledFlag,
    preview,
    siteUrl: siteUrl(),
    requireCustomDomain: requireDomain,
    tickerCount: stocks.length,
    minTickers: 5,
  });

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
  return canShowAdSlotPure(config, placement);
}
