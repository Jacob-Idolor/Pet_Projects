import assert from "node:assert/strict";
import { describe, it } from "node:test";
import { buildDcMovers } from "../scripts/lib/dc-movers.mjs";
import { matchesTechnicalFilter } from "../scripts/lib/technical-filters.mjs";

describe("buildDcMovers", () => {
  const screener = {
    layers: [
      {
        id: "chips",
        holdings: [
          { ticker: "up1", name: "Up One", market: { ok: true, change_pct: 8 } },
          { ticker: "up2", name: "Up Two", market: { ok: true, change_pct: 5 } },
          { ticker: "flat", name: "Flat", market: { ok: true, change_pct: 0.1 } },
          { ticker: "down1", name: "Down One", market: { ok: true, change_pct: -4 } },
          { ticker: "down2", name: "Down Two", market: { ok: true, change_pct: -9 } },
          { ticker: "bad", name: "Broken", market: { ok: false, change_pct: 99 } },
          { ticker: "nan", name: "NaN", market: { ok: true, change_pct: "nope" } },
        ],
      },
      {
        id: "power",
        holdings: [
          // Duplicate ticker across layers — first wins
          { ticker: "up1", name: "Dup", market: { ok: true, change_pct: 100 } },
        ],
      },
    ],
  };

  it("returns top gainers and losers and skips bad rows", () => {
    const { gainers, losers, pricedCount } = buildDcMovers(screener, { topN: 2 });
    assert.equal(pricedCount, 5);
    assert.deepEqual(
      gainers.map((g) => g.ticker),
      ["UP1", "UP2"]
    );
    assert.equal(gainers[0].chg, 8);
    assert.equal(gainers[0].layerId, "chips");
    assert.deepEqual(
      losers.map((l) => l.ticker),
      ["DOWN2", "DOWN1"]
    );
  });

  it("handles empty screener safely", () => {
    const empty = buildDcMovers({}, { topN: 3 });
    assert.equal(empty.pricedCount, 0);
    assert.deepEqual(empty.gainers, []);
    assert.deepEqual(empty.losers, []);
  });
});

describe("matchesTechnicalFilter", () => {
  const q = {
    sma: { 50: 100, 200: 90 },
    trend: "bullish",
    range52Pct: 12,
    pctFromAth: -3,
    rsi14: 28,
  };

  it("passes through non-tech filters", () => {
    assert.equal(matchesTechnicalFilter("all", q, 110), true);
    assert.equal(matchesTechnicalFilter("lean-buy", null, null), true);
  });

  it("requires quote for tech filters", () => {
    assert.equal(matchesTechnicalFilter("tech-above-50", undefined, 110), false);
  });

  it("evaluates MA / trend / range / RSI / ATH predicates", () => {
    assert.equal(matchesTechnicalFilter("tech-above-50", q, 110), true);
    assert.equal(matchesTechnicalFilter("tech-below-50", q, 110), false);
    assert.equal(matchesTechnicalFilter("tech-above-200", q, 110), true);
    assert.equal(matchesTechnicalFilter("tech-bullish", q, 110), true);
    assert.equal(matchesTechnicalFilter("tech-bearish", q, 110), false);
    assert.equal(matchesTechnicalFilter("tech-near-low", q, 110), true);
    assert.equal(matchesTechnicalFilter("tech-near-high", q, 110), false);
    assert.equal(matchesTechnicalFilter("tech-near-ath", q, 110), true);
    assert.equal(matchesTechnicalFilter("tech-at-ath", q, 110), false);
    assert.equal(matchesTechnicalFilter("tech-oversold", q, 110), true);
    assert.equal(matchesTechnicalFilter("tech-overbought", q, 110), false);
  });
});
