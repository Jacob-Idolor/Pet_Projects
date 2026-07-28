export {
  escapeHtml,
  sanitizeSymbol,
  sanitizeId,
  safeHttpUrl,
} from "../../scripts/lib/sanitize.mjs";

import { sanitizeSymbol } from "../../scripts/lib/sanitize.mjs";

export function sanitizePriority(raw: unknown): "high" | "medium" | "low" {
  const s = String(raw ?? "").toLowerCase();
  if (s === "high" || s === "medium" || s === "low") return s;
  return "medium";
}

export function yahooUrl(symbol: string): string {
  const sym = sanitizeSymbol(symbol) || "INVALID";
  return `https://finance.yahoo.com/quote/${encodeURIComponent(sym)}`;
}
