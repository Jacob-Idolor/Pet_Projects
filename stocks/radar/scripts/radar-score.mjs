/**
 * Radar action bias — mirrors src/lib/market-display.ts actionBias().
 * Used by digest / signal-alert Node scripts (no TS runtime in CI).
 */

export function actionBias(q) {
  if (!q || q.price == null) {
    return { label: "—", cls: "idle", reason: "Waiting on quotes", score: 0 };
  }

  let score = 0;
  const bits = [];

  if (q.rsi14 != null && q.rsi14 <= 30) {
    score += 2;
    bits.push("RSI oversold");
  } else if (q.rsi14 != null && q.rsi14 <= 40) {
    score += 1;
    bits.push("RSI soft");
  } else if (q.rsi14 != null && q.rsi14 >= 70) {
    score -= 2;
    bits.push("RSI overbought");
  } else if (q.rsi14 != null && q.rsi14 >= 65) {
    score -= 1;
    bits.push("RSI elevated");
  }

  if (q.range52Pct != null && q.range52Pct <= 20) {
    score += 1;
    bits.push("near 52w low");
  } else if (q.range52Pct != null && q.range52Pct >= 85) {
    score -= 1;
    bits.push("near 52w high");
  }

  if (q.pctFromAth != null && q.pctFromAth >= -3) {
    score -= 1;
    bits.push("near ATH");
  }

  if (q.trend === "bullish") {
    score += 1;
    bits.push("bullish trend");
  } else if (q.trend === "bearish") {
    score -= 1;
    bits.push("bearish trend");
  }

  if (q.signals?.includes("deep-below-50")) {
    score += 1;
    bits.push("deep below SMA50");
  }
  if (q.signals?.includes("extended-above-50")) {
    score -= 1;
    bits.push("extended above SMA50");
  }

  const reason = bits.length ? bits.slice(0, 3).join(" · ") : "Neutral setup";
  if (score >= 2) return { label: "Lean buy", cls: "buy", reason, score };
  if (score <= -2) return { label: "Lean sell", cls: "sell", reason, score };
  return { label: "Watch", cls: "watch", reason, score };
}

/** Distance to target price (%). Null when missing. */
export function distanceToTarget(price, targetPrice) {
  if (price == null || targetPrice == null || targetPrice === 0) return null;
  return ((price - targetPrice) / targetPrice) * 100;
}

/**
 * Rank watchlist symbols by radar score using quotes map + optional targets from watchlist.
 * @returns {{ buy: object[], sell: object[], nearTarget: object[], missing: string[] }}
 */
export function scoreWatchlist(watchlistStocks, quotes) {
  const buy = [];
  const sell = [];
  const nearTarget = [];
  const missing = [];
  const seen = new Set();

  for (const stock of watchlistStocks) {
    if (seen.has(stock.symbol)) continue;
    seen.add(stock.symbol);
    const q = quotes[stock.symbol];
    if (!q) {
      missing.push(stock.symbol);
      continue;
    }
    const bias = actionBias(q);
    const row = {
      symbol: stock.symbol,
      name: stock.name || q.name || stock.symbol,
      score: bias.score,
      label: bias.label,
      reason: bias.reason,
      price: q.price,
      changePct: q.changePct,
      targetPrice: stock.targetPrice ?? null,
      distPct: distanceToTarget(q.price, stock.targetPrice),
    };
    if (bias.cls === "buy") buy.push(row);
    if (bias.cls === "sell") sell.push(row);

    if (row.distPct != null && Math.abs(row.distPct) <= 5) {
      nearTarget.push(row);
    }
  }

  buy.sort((a, b) => b.score - a.score || a.symbol.localeCompare(b.symbol));
  sell.sort((a, b) => a.score - b.score || a.symbol.localeCompare(b.symbol));
  nearTarget.sort(
    (a, b) => Math.abs(a.distPct) - Math.abs(b.distPct) || a.symbol.localeCompare(b.symbol)
  );

  return { buy, sell, nearTarget, missing };
}
