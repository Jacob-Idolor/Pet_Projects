/**
 * AdSense config for StocksWatch.
 *
 * Local `npm run dev` shows labeled preview slots (Google rarely fills localhost).
 * Production builds never show preview boxes. Live units need client + slot IDs.
 * AdSense script/meta can stay on for site review even before slots exist.
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
  const fromImport = import.meta.env[name];
  if (typeof fromImport === "string" && fromImport.trim()) return fromImport.trim();
  if (typeof process !== "undefined" && process.env?.[name]) {
    return String(process.env[name]).trim();
  }
  return "";
}

export function getAdSenseConfig(): AdSenseConfig {
  const client = env("PUBLIC_ADSENSE_CLIENT");
  const enabledFlag = env("PUBLIC_ADSENSE_ENABLED");
  const forcePreviewRequested = env("PUBLIC_ADSENSE_PREVIEW") === "true";
  const isDev = import.meta.env.DEV;
  const isProdBuild = import.meta.env.PROD;

  // Never ship preview placeholders from a production build (ignore force flag).
  const preview = isDev || (forcePreviewRequested && !isProdBuild);

  const enabled =
    Boolean(client) &&
    enabledFlag !== "false" &&
    !preview;

  return {
    client,
    enabled,
    preview,
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

/** Whether any live unit can render for this placement. */
export function canShowAdSlot(
  config: AdSenseConfig,
  placement: "hero" | "board" | "footer",
): boolean {
  if (config.preview) return true;
  return config.enabled && Boolean(config.client) && Boolean(config.slots[placement]);
}
