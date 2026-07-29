/**
 * Guardrails for alert evaluation against quotes.json payloads.
 */

/**
 * @param {object} data quotes.json root
 * @returns {{ ok: boolean, reason?: string, quotes: Record<string, object> }}
 */
export function prepareQuotesForAlerts(data) {
  if (!data || typeof data !== "object") {
    return { ok: false, reason: "quotes payload missing", quotes: {} };
  }
  if (data.fetchFailed) {
    return { ok: false, reason: "quotes marked fetchFailed", quotes: {} };
  }
  const raw = data.quotes && typeof data.quotes === "object" ? data.quotes : {};
  const quotes = {};
  let skipped = 0;
  for (const [sym, row] of Object.entries(raw)) {
    if (!row || typeof row !== "object") continue;
    if (row._carriedForward || row.fetchFailed) {
      skipped++;
      continue;
    }
    quotes[sym] = row;
  }
  if (!Object.keys(quotes).length) {
    return {
      ok: false,
      reason: skipped
        ? "all quote rows carried-forward or failed"
        : "quotes map empty",
      quotes: {},
    };
  }
  return { ok: true, quotes, skippedCarried: skipped };
}
