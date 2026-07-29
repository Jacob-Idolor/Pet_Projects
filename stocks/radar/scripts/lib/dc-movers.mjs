/**
 * Build compact home-page movers from screener.json layers.
 * Pure — used by write-dc-movers CLI and unit tests.
 */

/**
 * @param {object} data screener.json shape ({ layers: [{ id, holdings: [{ ticker, name, market }] }] })
 * @param {{ topN?: number }} [opts]
 * @returns {{ gainers: object[], losers: object[], pricedCount: number }}
 */
export function buildDcMovers(data, opts = {}) {
  const topN = opts.topN ?? 3;
  const seen = new Set();
  const rows = [];

  for (const layer of data?.layers || []) {
    for (const h of layer.holdings || []) {
      const ticker = String(h.ticker || "").toUpperCase();
      if (!ticker || seen.has(ticker)) continue;
      seen.add(ticker);
      const m = h.market || {};
      const chg = Number(m.change_pct);
      if (m.ok === false || !Number.isFinite(chg)) continue;
      rows.push({
        ticker,
        name: h.name || ticker,
        chg,
        layerId: layer.id,
      });
    }
  }

  rows.sort((a, b) => b.chg - a.chg);
  const gainers = rows.slice(0, topN);
  const losers = rows.slice(-topN).reverse();
  return { gainers, losers, pricedCount: rows.length };
}
