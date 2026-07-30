/**
 * Match personal alert rules against watchlist quotes.
 * Signal types: lean-buy, lean-sell, near-target, score-at-least, score-at-most,
 * price-below, price-above, rsi-below, rsi-above, pct-change-below, pct-change-above,
 * near-52w-low, near-ath, tag-signal (symbols with tag + lean-buy/sell).
 */

import { actionBias, distanceToTarget } from "./radar-score.mjs";

export const SIGNAL_TYPES = [
  "lean-buy",
  "lean-sell",
  "near-target",
  "score-at-least",
  "score-at-most",
  "price-below",
  "price-above",
  "rsi-below",
  "rsi-above",
  "pct-change-below",
  "pct-change-above",
  "near-52w-low",
  "near-ath",
];

function normSym(s) {
  return String(s || "")
    .toUpperCase()
    .replace(/^\$/, "")
    .trim();
}

function stockMatchesRule(stock, rule) {
  const symbols = (rule.symbols || []).map(normSym).filter(Boolean);
  const tags = (rule.tags || []).map((t) => String(t).toLowerCase());

  if (symbols.length && !symbols.includes(normSym(stock.symbol))) return false;
  if (tags.length) {
    const stockTags = (stock.tags || []).map((t) => String(t).toLowerCase());
    if (!tags.some((t) => stockTags.includes(t))) return false;
  }
  // If neither symbols nor tags, rule applies to entire watchlist
  return true;
}

function evaluateSignal(rule, stock, q, newsCheck = null, valuationBias = null) {
  const bias = actionBias(q, { newsCheck, valuationBias });
  const price = q?.price ?? null;
  const signal = rule.signal;
  const minScore = rule.minScore ?? 2;
  const maxScore = rule.maxScore ?? -2;
  const nearPct = rule.nearTargetPct ?? 5;

  switch (signal) {
    case "lean-buy":
      if (bias.cls !== "buy" || bias.score < minScore) return null;
      return {
        summary: `${stock.symbol} lean buy (score ${bias.score})`,
        detail: bias.reason,
        score: bias.score,
        price,
        changePct: q.changePct ?? null,
      };
    case "lean-sell":
      if (bias.cls !== "sell" || bias.score > maxScore) return null;
      return {
        summary: `${stock.symbol} lean sell (score ${bias.score})`,
        detail: bias.reason,
        score: bias.score,
        price,
        changePct: q.changePct ?? null,
      };
    case "near-target": {
      const target = rule.targetPrice ?? stock.targetPrice;
      const dist = distanceToTarget(price, target);
      if (dist == null || Math.abs(dist) > nearPct) return null;
      return {
        summary: `${stock.symbol} near target ${dist >= 0 ? "+" : ""}${dist.toFixed(1)}%`,
        detail: `Price ${price} vs target ${target}`,
        score: bias.score,
        price,
        changePct: q.changePct ?? null,
        distPct: dist,
      };
    }
    case "score-at-least":
      if (bias.score < (rule.minScore ?? 2)) return null;
      return {
        summary: `${stock.symbol} score ${bias.score} ≥ ${rule.minScore ?? 2}`,
        detail: bias.reason,
        score: bias.score,
        price,
        changePct: q.changePct ?? null,
      };
    case "score-at-most":
      if (bias.score > (rule.maxScore ?? -2)) return null;
      return {
        summary: `${stock.symbol} score ${bias.score} ≤ ${rule.maxScore ?? -2}`,
        detail: bias.reason,
        score: bias.score,
        price,
        changePct: q.changePct ?? null,
      };
    case "price-below":
      if (price == null || rule.price == null || price >= rule.price) return null;
      return {
        summary: `${stock.symbol} $${price.toFixed(2)} below $${rule.price}`,
        detail: bias.reason,
        score: bias.score,
        price,
        changePct: q.changePct ?? null,
      };
    case "price-above":
      if (price == null || rule.price == null || price <= rule.price) return null;
      return {
        summary: `${stock.symbol} $${price.toFixed(2)} above $${rule.price}`,
        detail: bias.reason,
        score: bias.score,
        price,
        changePct: q.changePct ?? null,
      };
    case "rsi-below":
      if (q.rsi14 == null || rule.rsi == null || q.rsi14 >= rule.rsi) return null;
      return {
        summary: `${stock.symbol} RSI ${q.rsi14.toFixed(0)} < ${rule.rsi}`,
        detail: bias.reason,
        score: bias.score,
        price,
        changePct: q.changePct ?? null,
      };
    case "rsi-above":
      if (q.rsi14 == null || rule.rsi == null || q.rsi14 <= rule.rsi) return null;
      return {
        summary: `${stock.symbol} RSI ${q.rsi14.toFixed(0)} > ${rule.rsi}`,
        detail: bias.reason,
        score: bias.score,
        price,
        changePct: q.changePct ?? null,
      };
    case "pct-change-below":
      if (q.changePct == null || rule.changePct == null || q.changePct >= rule.changePct)
        return null;
      return {
        summary: `${stock.symbol} day ${q.changePct.toFixed(1)}% ≤ ${rule.changePct}%`,
        detail: bias.reason,
        score: bias.score,
        price,
        changePct: q.changePct,
      };
    case "pct-change-above":
      if (q.changePct == null || rule.changePct == null || q.changePct <= rule.changePct)
        return null;
      return {
        summary: `${stock.symbol} day +${q.changePct.toFixed(1)}% ≥ ${rule.changePct}%`,
        detail: bias.reason,
        score: bias.score,
        price,
        changePct: q.changePct,
      };
    case "near-52w-low": {
      const maxRange = rule.range52Pct ?? 20;
      if (q.range52Pct == null || q.range52Pct > maxRange) return null;
      return {
        summary: `${stock.symbol} near 52w low (${q.range52Pct.toFixed(0)}% of range)`,
        detail: bias.reason,
        score: bias.score,
        price,
        changePct: q.changePct ?? null,
      };
    }
    case "near-ath": {
      const within = rule.pctFromAth ?? -5;
      // pctFromAth is negative when below ATH; "within -5" means >= -5
      if (q.pctFromAth == null || q.pctFromAth < within) return null;
      return {
        summary: `${stock.symbol} near ATH (${q.pctFromAth.toFixed(1)}%)`,
        detail: bias.reason,
        score: bias.score,
        price,
        changePct: q.changePct ?? null,
      };
    }
    default:
      return null;
  }
}

/**
 * @returns {Array<{ rule, stock, hit, fireKey }>}
 */
export function matchAlertRules(rulesConfig, watchlistStocks, quotes, outlookBySymbol) {
  const rules = (rulesConfig.rules || []).filter((r) => r && r.enabled !== false);
  const hits = [];

  for (const rule of rules) {
    if (!rule.id || !rule.subscriberId || !rule.signal) continue;
    if (!SIGNAL_TYPES.includes(rule.signal)) {
      console.warn(`Unknown signal type on rule ${rule.id}: ${rule.signal}`);
      continue;
    }

    for (const stock of watchlistStocks) {
      if (!stockMatchesRule(stock, rule)) continue;
      const q = quotes[stock.symbol];
      if (!q) continue;
      const outlook = outlookBySymbol?.[stock.symbol];
      const newsCheck = outlook?.newsCheck ?? null;
      const valuationBias = stock.valuation?.bias || outlook?.fundamentals?.bias || null;
      const hit = evaluateSignal(rule, stock, q, newsCheck, valuationBias);
      if (!hit) continue;

      // Cooldown key: rule + symbol so multi-symbol rules re-fire per name
      const fireKey = `${rule.id}::${stock.symbol}::${rule.signal}`;
      hits.push({ rule, stock, hit, fireKey });
    }
  }

  return hits;
}

export function filterHitsByCooldown(hits, state, now = Date.now(), cooldownHours = 24) {
  const fired = state?.fired && typeof state.fired === "object" ? state.fired : {};
  const cooldownMs = cooldownHours * 60 * 60 * 1000;
  const fresh = [];
  const skipped = [];

  for (const row of hits) {
    const ruleCd = row.rule.cooldownHours;
    const ms = (ruleCd != null ? ruleCd : cooldownHours) * 60 * 60 * 1000;
    const last = fired[row.fireKey] ? Date.parse(fired[row.fireKey]) : 0;
    if (last && now - last < ms) {
      skipped.push({ ...row, lastFiredAt: fired[row.fireKey] });
    } else {
      fresh.push(row);
    }
  }

  return { fresh, skipped, cooldownMs };
}

export function updateFiredState(state, freshHits, nowIso) {
  const next = {
    updatedAt: nowIso,
    fired: { ...(state?.fired || {}) },
  };
  for (const row of freshHits) {
    next.fired[row.fireKey] = nowIso;
  }
  return next;
}

/** Public view of rules — no emails, safe to show on the site. */
export function publicRulesSummary(rulesConfig) {
  return (rulesConfig.rules || [])
    .filter((r) => r && r.enabled !== false)
    .map((r) => ({
      id: r.id,
      subscriberId: r.subscriberId,
      signal: r.signal,
      symbols: r.symbols || [],
      tags: r.tags || [],
      note: r.note || "",
    }));
}
