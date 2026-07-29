import assert from "node:assert/strict";
import { describe, it } from "node:test";
import { prepareQuotesForAlerts } from "../scripts/lib/alert-quote-guard.mjs";

describe("prepareQuotesForAlerts", () => {
  it("rejects fetchFailed payloads", () => {
    const r = prepareQuotesForAlerts({
      fetchFailed: true,
      quotes: { AAPL: { price: 1, changePct: 1 } },
    });
    assert.equal(r.ok, false);
    assert.match(r.reason, /fetchFailed/);
  });

  it("skips carried-forward and failed rows", () => {
    const r = prepareQuotesForAlerts({
      quotes: {
        AAPL: { price: 100, changePct: 1 },
        MSFT: { price: 99, changePct: 0, _carriedForward: true },
        GOOG: { price: 50, fetchFailed: true },
      },
    });
    assert.equal(r.ok, true);
    assert.deepEqual(Object.keys(r.quotes), ["AAPL"]);
    assert.equal(r.skippedCarried, 2);
  });

  it("rejects when every row is stale", () => {
    const r = prepareQuotesForAlerts({
      quotes: {
        MSFT: { price: 99, _carriedForward: true },
      },
    });
    assert.equal(r.ok, false);
    assert.match(r.reason, /carried-forward/);
  });

  it("rejects empty payload", () => {
    assert.equal(prepareQuotesForAlerts(null).ok, false);
    assert.equal(prepareQuotesForAlerts({ quotes: {} }).ok, false);
  });
});
