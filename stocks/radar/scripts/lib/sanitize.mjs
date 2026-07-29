/**
 * HTML / ticker sanitize helpers for Node tests and scripts.
 * Keep behavior aligned with src/lib/format.ts.
 */

export function escapeHtml(text) {
  return String(text ?? "")
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;")
    .replace(/'/g, "&#39;");
}

export function sanitizeSymbol(raw) {
  const s = String(raw ?? "")
    .trim()
    .toUpperCase();
  if (!/^[A-Z0-9.^_-]{1,15}$/.test(s)) return "";
  return s;
}

export function sanitizeId(raw) {
  const s = String(raw ?? "").trim();
  if (!/^[a-zA-Z0-9_-]{1,64}$/.test(s)) return "";
  return s;
}

export function safeHttpUrl(raw, fallback = "#") {
  const s = String(raw ?? "").trim();
  if (!s) return fallback;
  try {
    const u = new URL(s);
    if (u.protocol !== "http:" && u.protocol !== "https:") return fallback;
    // Reject userinfo phishing (https://example.com@evil.com → host evil.com)
    if (u.username || u.password) return fallback;
    return u.href;
  } catch {
    /* ignore */
  }
  return fallback;
}
