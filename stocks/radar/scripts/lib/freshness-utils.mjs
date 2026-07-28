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
