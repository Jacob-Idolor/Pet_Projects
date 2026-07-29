import assert from "node:assert/strict";
import { describe, it } from "node:test";
import {
  actionBias,
  isPreMomentum,
  distanceToTarget,
  scoreWatchlist,
} from "../scripts/alerts/radar-score.mjs";

describe("actionBias", () => {
  it("returns idle without price", () => {
    const r = actionBias(undefined);
    assert.equal(r.cls, "idle");
    assert.equal(r.score, 0);
  });

  it("leans buy on oversold + near low", () => {
    const r = actionBias({
      price: 10,
      rsi14: 25,
      range52Pct: 10,
      vsSma: { 50: -5 },
      volRatio: 1.2,
    });
    assert.ok(r.score >= 3);
    assert.equal(r.cls, "buy");
  });

  it("leans sell on overbought + near high", () => {
    const r = actionBias({
      price: 100,
      rsi14: 75,
      range52Pct: 90,
      pctFromAth: -1,
      vsSma: { 50: 20 },
      volRatio: 1.5,
    });
    assert.ok(r.score <= -3);
    assert.equal(r.cls, "sell");
  });

  it("stays watch for neutral mid-range tape", () => {
    const r = actionBias({
      price: 50,
      rsi14: 50,
      range52Pct: 50,
      vsSma: { 50: 0 },
      volRatio: 1.0,
      trend: "mixed",
    });
    assert.equal(r.cls, "watch");
    assert.ok(r.score > -3 && r.score < 3);
  });

  it("applies news scoreDelta toward buy", () => {
    const quote = {
      price: 40,
      rsi14: 42,
      range52Pct: 30,
      vsSma: { 50: -2 },
      volRatio: 1.0,
    };
    const base = actionBias(quote);
    const withNews = actionBias(quote, { newsCheck: { tilt: "positive", scoreDelta: 2 } });
    assert.equal(withNews.score, base.score + 2);
    assert.match(withNews.reason, /news positive/);
  });

  it("marks quiet near highs as a drag, not pre-momentum", () => {
    const q = {
      price: 80,
      volRatio: 0.5,
      rsi14: 55,
      vsSma: { 50: 5 },
      range52Pct: 85,
      pctFromAth: -2,
    };
    assert.equal(isPreMomentum(q), false);
    const r = actionBias(q);
    assert.match(r.reason, /quiet near highs|near 52w high|near ATH|extended/i);
  });
});

describe("isPreMomentum", () => {
  it("detects quiet coil", () => {
    assert.equal(
      isPreMomentum({
        price: 50,
        volRatio: 0.5,
        rsi14: 45,
        vsSma: { 50: -2 },
        range52Pct: 40,
        pctFromAth: -20,
      }),
      true
    );
  });

  it("rejects when volume is hot", () => {
    assert.equal(
      isPreMomentum({
        price: 50,
        volRatio: 1.5,
        rsi14: 45,
        vsSma: { 50: -2 },
        range52Pct: 40,
        pctFromAth: -20,
      }),
      false
    );
  });
});

describe("distanceToTarget", () => {
  it("returns percent distance from target", () => {
    assert.ok(Math.abs(distanceToTarget(105, 100) - 5) < 1e-9);
    assert.ok(Math.abs(distanceToTarget(95, 100) - -5) < 1e-9);
  });
  it("returns null when price or target missing/zero", () => {
    assert.equal(distanceToTarget(null, 100), null);
    assert.equal(distanceToTarget(10, null), null);
    assert.equal(distanceToTarget(10, 0), null);
  });
});

describe("scoreWatchlist", () => {
  const stocks = [
    { symbol: "BUY", name: "Buy Co", targetPrice: 11 },
    { symbol: "SELL", name: "Sell Co", targetPrice: 100 },
    { symbol: "MISS", name: "No Quote" },
    { symbol: "BUY", name: "Dup ignored" },
  ];
  const quotes = {
    BUY: {
      price: 10.5,
      changePct: 2,
      rsi14: 25,
      range52Pct: 12,
      vsSma: { 50: -11 },
      volRatio: 1.2,
      name: "Buy Co Q",
    },
    SELL: {
      price: 110,
      changePct: -1,
      rsi14: 75,
      range52Pct: 90,
      pctFromAth: -1,
      vsSma: { 50: 12 },
      volRatio: 1.3,
    },
  };

  it("buckets buy/sell/nearTarget/missing and dedupes symbols", () => {
    const out = scoreWatchlist(stocks, quotes);
    assert.ok(out.buy.some((r) => r.symbol === "BUY"));
    assert.ok(out.sell.some((r) => r.symbol === "SELL"));
    assert.ok(out.missing.includes("MISS"));
    assert.equal(out.buy.filter((r) => r.symbol === "BUY").length, 1);
    assert.ok(out.nearTarget.some((r) => r.symbol === "BUY"));
  });

  it("sorts buys highest score first", () => {
    const out = scoreWatchlist(
      [{ symbol: "A" }, { symbol: "B" }],
      {
        A: { price: 10, rsi14: 28, range52Pct: 15, vsSma: { 50: -5 }, volRatio: 1 },
        B: {
          price: 10,
          rsi14: 20,
          range52Pct: 5,
          vsSma: { 50: -15 },
          signals: ["deep-below-50"],
          volRatio: 1,
        },
      }
    );
    assert.ok(out.buy.length >= 2);
    assert.ok(out.buy[0].score >= out.buy[1].score);
  });

  it("threads outlook newsCheck into row newsTilt for scored names", () => {
    const washed = {
      price: 10,
      rsi14: 25,
      range52Pct: 10,
      vsSma: { 50: -12 },
      volRatio: 1.2,
    };
    const out = scoreWatchlist([{ symbol: "N", name: "News" }], { N: washed }, {
      N: { newsCheck: { tilt: "negative", scoreDelta: -1 } },
    });
    const row = out.buy.find((r) => r.symbol === "N") || out.sell.find((r) => r.symbol === "N");
    assert.ok(row, "expected N in buy or sell bucket");
    assert.equal(row.newsTilt, "negative");
  });
});
