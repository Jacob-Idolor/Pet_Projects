/**
 * Compute technical metrics from daily close prices (Yahoo chart API).
 */

export function sma(closes, period) {
  if (!closes?.length || closes.length < period) return null;
  const slice = closes.slice(-period);
  return slice.reduce((a, b) => a + b, 0) / period;
}

export function rsi(closes, period = 14) {
  if (!closes?.length || closes.length < period + 1) return null;

  let gains = 0;
  let losses = 0;
  for (let i = closes.length - period; i < closes.length; i++) {
    const diff = closes[i] - closes[i - 1];
    if (diff >= 0) gains += diff;
    else losses -= diff;
  }
  const avgGain = gains / period;
  const avgLoss = losses / period;
  if (avgLoss === 0) return 100;
  const rs = avgGain / avgLoss;
  return 100 - 100 / (1 + rs);
}

/** 0 = at 52w low, 100 = at 52w high */
export function rangePosition(price, low, high) {
  if (price == null || low == null || high == null || high <= low) return null;
  return ((price - low) / (high - low)) * 100;
}

export function pctVs(price, level) {
  if (price == null || level == null || level === 0) return null;
  return ((price - level) / level) * 100;
}

export function deriveTrend(price, sma50, sma200) {
  if (price == null || sma50 == null || sma200 == null) return "unknown";
  if (price > sma50 && sma50 > sma200) return "bullish";
  if (price < sma50 && sma50 < sma200) return "bearish";
  return "mixed";
}

export function deriveSignals(price, metrics) {
  const signals = [];
  const { sma: ma, vsSma, range52Pct, rsi14 } = metrics;

  if (ma?.[20] != null && price > ma[20]) signals.push("above-sma20");
  if (ma?.[50] != null && price > ma[50]) signals.push("above-sma50");
  if (ma?.[200] != null && price > ma[200]) signals.push("above-sma200");
  if (ma?.[200] != null && price < ma[200]) signals.push("below-sma200");
  if (ma?.[50] != null && price < ma[50]) signals.push("below-sma50");

  if (vsSma?.[50] != null && vsSma[50] > 10) signals.push("extended-above-50");
  if (vsSma?.[50] != null && vsSma[50] < -10) signals.push("deep-below-50");
  if (vsSma?.[50] != null && Math.abs(vsSma[50]) <= 3) signals.push("coiling-near-50");

  if (range52Pct != null && range52Pct >= 85) signals.push("near-52w-high");
  if (range52Pct != null && range52Pct <= 15) signals.push("near-52w-low");

  if (rsi14 != null && rsi14 >= 70) signals.push("rsi-overbought");
  if (rsi14 != null && rsi14 <= 30) signals.push("rsi-oversold");

  if (metrics.pctFromAth != null && metrics.pctFromAth >= -0.5) signals.push("at-ath");
  if (metrics.pctFromAth != null && metrics.pctFromAth >= -5 && metrics.pctFromAth < -0.5) {
    signals.push("near-ath");
  }

  // Volume vs 20-day average — quiet tape often precedes (or follows) a move
  if (metrics.volRatio != null && metrics.volRatio < 0.75) signals.push("quiet-volume");
  if (metrics.volRatio != null && metrics.volRatio >= 1.8) signals.push("volume-surge");

  // Pre-momentum coil: quiet + mid RSI + near/under 50 + not at highs
  if (
    metrics.volRatio != null &&
    metrics.volRatio < 0.75 &&
    rsi14 != null &&
    rsi14 >= 35 &&
    rsi14 <= 55 &&
    vsSma?.[50] != null &&
    vsSma[50] > -12 &&
    vsSma[50] <= 3 &&
    (range52Pct == null || range52Pct < 70) &&
    (metrics.pctFromAth == null || metrics.pctFromAth < -8)
  ) {
    signals.push("pre-momentum");
  }

  return signals;
}

export function computeAth(highs, timestamps) {
  if (!highs?.length) return { athHigh: null, athDate: null };

  let max = null;
  let maxIdx = -1;
  for (let i = 0; i < highs.length; i++) {
    const h = highs[i];
    if (h != null && (max == null || h > max)) {
      max = h;
      maxIdx = i;
    }
  }

  if (max == null) return { athHigh: null, athDate: null };

  const ts = timestamps?.[maxIdx];
  const athDate =
    ts != null ? new Date(ts * 1000).toISOString().slice(0, 10) : null;

  return { athHigh: max, athDate };
}

export function buildMetrics(price, closes, meta, volumes, highs, timestamps) {
  const high52 = meta?.fiftyTwoWeekHigh ?? null;
  const low52 = meta?.fiftyTwoWeekLow ?? null;
  const sma20 = sma(closes, 20);
  const sma50 = sma(closes, 50);
  const sma200 = sma(closes, 200);
  const rsi14 = rsi(closes, 14);
  const range52Pct = rangePosition(price, low52, high52);

  const vols = (volumes ?? []).filter((v) => v != null);
  const avgVol20 = vols.length >= 20 ? sma(vols, 20) : null;
  const lastVol = vols.length ? vols[vols.length - 1] : meta?.regularMarketVolume ?? null;
  const volRatio =
    lastVol != null && avgVol20 != null && avgVol20 > 0 ? lastVol / avgVol20 : null;

  const vsSma = {
    20: pctVs(price, sma20),
    50: pctVs(price, sma50),
    200: pctVs(price, sma200),
  };

  const trend = deriveTrend(price, sma50, sma200);
  const { athHigh, athDate } = computeAth(highs, timestamps);
  const pctFromAth = pctVs(price, athHigh);

  const base = {
    high52,
    low52,
    range52Pct,
    athHigh,
    athDate,
    pctFromAth,
    sma: { 20: sma20, 50: sma50, 200: sma200 },
    vsSma,
    trend,
    rsi14,
    volume: lastVol,
    avgVolume20: avgVol20,
    volRatio,
  };

  return { ...base, signals: deriveSignals(price, base) };
}
