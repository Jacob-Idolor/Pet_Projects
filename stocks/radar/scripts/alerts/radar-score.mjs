/**
 * Watchlist scoring for digests / alerts (Node).
 * Bias math lives in scripts/lib/action-bias.mjs (shared with the home board).
 */

import { actionBias, isPreMomentum } from "../lib/action-bias.mjs";

export { actionBias, isPreMomentum };

/** Distance to target price (%). Null when missing. */
export function distanceToTarget(price, targetPrice) {
  if (price == null || targetPrice == null || targetPrice === 0) return null;
  return ((price - targetPrice) / targetPrice) * 100;
}

/**
 * Rank watchlist symbols by radar score using quotes map + optional targets from watchlist.
 * @param {object[]} watchlistStocks
 * @param {Record<string, object>} quotes
 * @param {Record<string, { newsCheck?: object }>|undefined} [outlookBySymbol]
 */
export function scoreWatchlist(watchlistStocks, quotes, outlookBySymbol) {
  const buy = [];
  const sell = [];
  const nearTarget = [];
  const preMomentum = [];
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
    const newsCheck = outlookBySymbol?.[stock.symbol]?.newsCheck ?? null;
    const bias = actionBias(q, { newsCheck });
    const row = {
      symbol: stock.symbol,
      name: stock.name || q.name || stock.symbol,
      score: bias.score,
      label: bias.label,
      reason: bias.reason,
      setup: bias.setup,
      price: q.price,
      changePct: q.changePct,
      targetPrice: stock.targetPrice ?? null,
      distPct: distanceToTarget(q.price, stock.targetPrice),
      newsTilt: newsCheck?.tilt ?? null,
    };
    if (bias.cls === "buy") buy.push(row);
    if (bias.cls === "sell") sell.push(row);
    if (bias.setup === "pre-momentum") preMomentum.push(row);

    if (row.distPct != null && Math.abs(row.distPct) <= 5) {
      nearTarget.push(row);
    }
  }

  buy.sort((a, b) => b.score - a.score || a.symbol.localeCompare(b.symbol));
  sell.sort((a, b) => a.score - b.score || a.symbol.localeCompare(b.symbol));
  preMomentum.sort((a, b) => b.score - a.score || a.symbol.localeCompare(b.symbol));
  nearTarget.sort(
    (a, b) => Math.abs(a.distPct) - Math.abs(b.distPct) || a.symbol.localeCompare(b.symbol)
  );

  return { buy, sell, nearTarget, preMomentum, missing };
}
