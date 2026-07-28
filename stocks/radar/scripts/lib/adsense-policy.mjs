/**
 * Pure AdSense policy helpers (Node + browser). No Astro import.meta.env.
 * Used by src/lib/adsense.ts and unit tests.
 */

export function isCustomDomain(url) {
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

export function hasPublisherContent(tickerCount, minTickers = 5) {
  return Number(tickerCount) >= minTickers;
}

/**
 * @param {{
 *   allowedPlacements: Record<string, boolean>,
 *   preview: boolean,
 *   enabled: boolean,
 *   client: string,
 *   slots: Record<string, string>,
 * }} config
 * @param {string} placement
 */
export function canShowAdSlot(config, placement) {
  if (!config.allowedPlacements?.[placement]) return false;
  if (config.preview) return true;
  return (
    Boolean(config.enabled) &&
    Boolean(config.client) &&
    Boolean(config.slots?.[placement])
  );
}

/**
 * Decide whether live ads may enable (not preview).
 * @returns {{ enabled: boolean, blockReason: string|null }}
 */
export function evaluateLiveAdsGate({
  client,
  enabledFlag,
  preview,
  siteUrl,
  requireCustomDomain,
  tickerCount,
  minTickers = 5,
}) {
  let blockReason = null;
  if (!client) blockReason = "PUBLIC_ADSENSE_CLIENT unset";
  else if (enabledFlag === "false") blockReason = "PUBLIC_ADSENSE_ENABLED=false";
  else if (preview) blockReason = "preview mode (dev)";
  else if (requireCustomDomain && !isCustomDomain(siteUrl || "")) {
    blockReason =
      "Live ads require a custom domain (seo.requireCustomDomainForAds) — see DOMAIN.md";
  } else if (!hasPublisherContent(tickerCount, minTickers)) {
    blockReason = "Watchlist too small for ads (need ≥5 tickers with theses)";
  }

  const enabled =
    Boolean(client) &&
    enabledFlag !== "false" &&
    !preview &&
    blockReason === null;

  return { enabled, blockReason };
}
