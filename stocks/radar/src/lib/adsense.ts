/**
 * AdSense config for Stocks Radar.
 *
 * Local/dev always uses labeled preview slots (Google rarely fills localhost).
 * Production loads the real script only when PUBLIC_ADSENSE_CLIENT is set
 * and PUBLIC_ADSENSE_ENABLED is not "false".
 */

export type AdSlotPlacement = "banner" | "in-feed" | "footer";

export interface AdSenseConfig {
  client: string;
  enabled: boolean;
  /** True when we show the dashed local preview box instead of a real unit. */
  preview: boolean;
  slots: {
    hero: string;
    board: string;
    footer: string;
  };
  verifyMeta: string;
}

function env(name: string): string {
  const v = import.meta.env[name];
  return typeof v === "string" ? v.trim() : "";
}

export function getAdSenseConfig(): AdSenseConfig {
  const client = env("PUBLIC_ADSENSE_CLIENT");
  const enabledFlag = env("PUBLIC_ADSENSE_ENABLED");
  const forcePreview = env("PUBLIC_ADSENSE_PREVIEW") === "true";
  const isDev = import.meta.env.DEV;

  const enabled =
    Boolean(client) && enabledFlag !== "false" && !isDev && !forcePreview;

  return {
    client,
    enabled,
    /** Preview placeholders: local/dev, or explicit PUBLIC_ADSENSE_PREVIEW=true */
    preview: isDev || forcePreview,
    slots: {
      hero: env("PUBLIC_ADSENSE_SLOT_HERO"),
      board: env("PUBLIC_ADSENSE_SLOT_BOARD"),
      footer: env("PUBLIC_ADSENSE_SLOT_FOOTER"),
    },
    /** AdSense site verification meta content=… from Sites → Get code */
    verifyMeta: env("PUBLIC_ADSENSE_VERIFY_META"),
  };
}

export function slotIdFor(
  config: AdSenseConfig,
  placement: "hero" | "board" | "footer",
): string {
  return config.slots[placement];
}
