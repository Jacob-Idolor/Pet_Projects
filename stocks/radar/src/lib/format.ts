export function escapeHtml(text: string): string {
  return text
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;")
    .replace(/'/g, "&#39;");
}

/** Ticker / attribute-safe token (Yahoo-style symbols). */
export function sanitizeSymbol(raw: unknown): string {
  const s = String(raw ?? "").trim().toUpperCase();
  if (!/^[A-Z0-9.^_-]{1,15}$/.test(s)) return "";
  return s;
}

export function sanitizeId(raw: unknown): string {
  const s = String(raw ?? "").trim();
  if (!/^[a-zA-Z0-9_-]{1,64}$/.test(s)) return "";
  return s;
}

export function sanitizePriority(raw: unknown): "high" | "medium" | "low" {
  const s = String(raw ?? "").toLowerCase();
  if (s === "high" || s === "medium" || s === "low") return s;
  return "medium";
}

export function yahooUrl(symbol: string): string {
  const sym = sanitizeSymbol(symbol) || "INVALID";
  return `https://finance.yahoo.com/quote/${encodeURIComponent(sym)}`;
}
