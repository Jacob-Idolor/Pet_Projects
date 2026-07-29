/**
 * Shared freshness helpers for check-live-freshness and unit tests.
 */

export function ageHours(isoOrSec) {
  if (isoOrSec == null || isoOrSec === "") return null;
  let ms;
  if (typeof isoOrSec === "number") {
    ms = isoOrSec < 1e12 ? isoOrSec * 1000 : isoOrSec;
  } else {
    ms = Date.parse(String(isoOrSec));
  }
  if (!Number.isFinite(ms)) return null;
  return (Date.now() - ms) / 3_600_000;
}

export function coverageRatio(okCount, total) {
  const ok = Number(okCount);
  const n = Number(total);
  if (!Number.isFinite(ok) || !Number.isFinite(n) || n <= 0) return null;
  return ok / n;
}

export function coverageOk(okCount, total, minRatio = 0.85) {
  const r = coverageRatio(okCount, total);
  return r != null && r >= minRatio;
}

export function ageOk(ageH, maxHours) {
  if (ageH == null || !Number.isFinite(ageH)) return false;
  return ageH <= maxHours;
}

/**
 * Prefer freshCount over merged row count so carried-forward quotes
 * do not inflate coverage after a Yahoo outage.
 */
export function quotesFreshCount(quotes) {
  if (!quotes || typeof quotes !== "object") return 0;
  if (quotes.fetchFailed) return 0;
  const fresh = Number(quotes.freshCount);
  if (Number.isFinite(fresh)) return Math.max(0, fresh);
  const map =
    quotes.quotes && typeof quotes.quotes === "object" ? quotes.quotes : null;
  const count = map ? Object.keys(map).length : Number(quotes.count) || 0;
  const carried = Array.isArray(quotes.carriedForward)
    ? quotes.carriedForward.length
    : 0;
  return Math.max(0, count - carried);
}

export function quotesFreshRatio(quotes) {
  if (!quotes || typeof quotes !== "object") return null;
  const total =
    Number(quotes.total) ||
    (quotes.quotes && typeof quotes.quotes === "object"
      ? Object.keys(quotes.quotes).length
      : Number(quotes.count) || 0);
  return coverageRatio(quotesFreshCount(quotes), total);
}
