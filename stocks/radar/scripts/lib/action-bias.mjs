/**
 * Weighted radar action bias — single source for Node (alerts/digest) and the home board.
 *
 * Design (friend feedback):
 * - Not every factor is equal: RSI extremes + location in range + SMA50 stretch weigh more.
 * - Trend is lighter context (can fight mean-reversion).
 * - Extra “pre-momentum” points for quiet / coiling names that haven’t run yet.
 *
 * Score → label:
 *   ≥ +3  Lean buy
 *   ≤ −3  Lean sell
 *   else  Watch
 */

/** @typedef {"buy"|"sell"|"watch"|"idle"} BiasCls */
/** @typedef {"washed-out"|"pre-momentum"|"trending"|"extended"|"mixed"|"idle"} SetupKind */

/**
 * Quiet tape + not extended = possible coil before momentum.
 * Uses volume vs 20d avg, RSI mid-zone, and position vs SMA50 / 52w range.
 */
export function isPreMomentum(q) {
  if (!q || q.price == null) return false;
  const volQuiet = q.volRatio != null && q.volRatio < 0.75;
  const rsi = q.rsi14;
  const rsiMid = rsi != null && rsi >= 35 && rsi <= 55;
  const vs50 = q.vsSma?.[50];
  const nearOrUnder50 =
    vs50 != null && vs50 > -12 && vs50 <= 3; /* under / kissing 50-day */
  const range = q.range52Pct;
  const notHigh = range == null || range < 70;
  const notAth = q.pctFromAth == null || q.pctFromAth < -8;
  return Boolean(volQuiet && rsiMid && nearOrUnder50 && notHigh && notAth);
}

/**
 * @param {object|undefined} q quote row from quotes.json
 * @param {{ newsCheck?: { tilt?: string, scoreDelta?: number }|null }} [opts]
 * @returns {{ label: string, cls: BiasCls, reason: string, score: number, setup: SetupKind }}
 */
export function actionBias(q, opts = {}) {
  if (!q || q.price == null) {
    return { label: "—", cls: "idle", reason: "Waiting on quotes", score: 0, setup: "idle" };
  }

  let score = 0;
  const bits = [];

  // --- Heavy: RSI extremes (mean-reversion) ---
  if (q.rsi14 != null && q.rsi14 <= 30) {
    score += 3;
    bits.push("RSI oversold (+3)");
  } else if (q.rsi14 != null && q.rsi14 <= 40) {
    score += 1;
    bits.push("RSI soft (+1)");
  } else if (q.rsi14 != null && q.rsi14 >= 70) {
    score -= 3;
    bits.push("RSI overbought (−3)");
  } else if (q.rsi14 != null && q.rsi14 >= 65) {
    score -= 1;
    bits.push("RSI elevated (−1)");
  }

  // --- Heavy: where it sits in the year ---
  if (q.range52Pct != null && q.range52Pct <= 20) {
    score += 2;
    bits.push("near 52w low (+2)");
  } else if (q.range52Pct != null && q.range52Pct >= 85) {
    score -= 2;
    bits.push("near 52w high (−2)");
  }

  // --- Medium-heavy: all-time stretch ---
  if (q.pctFromAth != null && q.pctFromAth >= -3) {
    score -= 2;
    bits.push("near ATH (−2)");
  }

  // --- Heavy: distance from 50-day average ---
  if (q.signals?.includes("deep-below-50") || (q.vsSma?.[50] != null && q.vsSma[50] < -10)) {
    score += 2;
    bits.push("deep below SMA50 (+2)");
  }
  if (q.signals?.includes("extended-above-50") || (q.vsSma?.[50] != null && q.vsSma[50] > 10)) {
    score -= 2;
    bits.push("extended above SMA50 (−2)");
  }

  // --- Light: trend is context only ---
  if (q.trend === "bullish") {
    score += 1;
    bits.push("bullish trend (+1)");
  } else if (q.trend === "bearish") {
    score -= 1;
    bits.push("bearish trend (−1)");
  }

  // --- Pre-momentum: quiet names that haven’t run ---
  if (isPreMomentum(q)) {
    score += 2;
    bits.push("quiet coil / pre-momentum (+2)");
  } else if (
    q.volRatio != null &&
    q.volRatio < 0.7 &&
    q.range52Pct != null &&
    q.range52Pct >= 80
  ) {
    // Quiet + already high = less interesting (sleeping near highs)
    score -= 1;
    bits.push("quiet near highs (−1)");
  }

  // --- News tape check (from outlook.json lexicon tilt) ---
  const delta = opts?.newsCheck?.scoreDelta;
  if (typeof delta === "number" && delta !== 0) {
    score += delta;
    const sign = delta > 0 ? `+${delta}` : String(delta);
    const tilt = opts?.newsCheck?.tilt || (delta > 0 ? "positive" : "negative");
    bits.push(`news ${tilt} (${sign})`);
  }

  // Classify setup flavor for UI (independent of lean threshold)
  /** @type {SetupKind} */
  let setup = "mixed";
  if (isPreMomentum(q)) setup = "pre-momentum";
  else if (
    (q.rsi14 != null && q.rsi14 <= 35) ||
    (q.vsSma?.[50] != null && q.vsSma[50] < -10) ||
    (q.range52Pct != null && q.range52Pct <= 20)
  ) {
    setup = "washed-out";
  } else if (
    (q.rsi14 != null && q.rsi14 >= 65) ||
    (q.vsSma?.[50] != null && q.vsSma[50] > 10) ||
    (q.range52Pct != null && q.range52Pct >= 85) ||
    (q.pctFromAth != null && q.pctFromAth >= -5)
  ) {
    setup = "extended";
  } else if (q.trend === "bullish" || q.trend === "bearish") {
    setup = "trending";
  }

  const reason = bits.length ? bits.slice(0, 4).join(" · ") : "Neutral setup";
  if (score >= 3) return { label: "Lean buy", cls: "buy", reason, score, setup };
  if (score <= -3) return { label: "Lean sell", cls: "sell", reason, score, setup };
  return { label: "Watch", cls: "watch", reason, score, setup };
}
