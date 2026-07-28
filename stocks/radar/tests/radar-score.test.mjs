import assert from "node:assert/strict";
import { describe, it } from "node:test";
import { actionBias, isPreMomentum } from "../scripts/radar-score.mjs";

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
});
