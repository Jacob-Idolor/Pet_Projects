import assert from "node:assert/strict";
import { describe, it } from "node:test";
import {
  ageHours,
  ageOk,
  coverageOk,
  coverageRatio,
  freshUntil,
  quotesFreshCount,
  quotesFreshRatio,
} from "../scripts/lib/freshness-utils.mjs";

describe("ageHours", () => {
  it("parses ISO and epoch seconds", () => {
    const now = Date.now();
    const isoAge = ageHours(new Date(now - 2 * 3600_000).toISOString());
    assert.ok(isoAge != null && isoAge > 1.9 && isoAge < 2.1);
    const secAge = ageHours(Math.floor((now - 3600_000) / 1000));
    assert.ok(secAge != null && secAge > 0.9 && secAge < 1.1);
  });
  it("returns null for bad input", () => {
    assert.equal(ageHours(null), null);
    assert.equal(ageHours("not-a-date"), null);
  });
});

describe("coverage", () => {
  it("computes ratio and threshold", () => {
    assert.equal(coverageRatio(80, 80), 1);
    assert.equal(coverageRatio(68, 80), 0.85);
    assert.equal(coverageOk(68, 80, 0.85), true);
    assert.equal(coverageOk(67, 80, 0.85), false);
    assert.equal(coverageRatio(1, 0), null);
  });
});

describe("quotesFreshCount / quotesFreshRatio", () => {
  it("prefers freshCount over merged rows", () => {
    const q = {
      total: 10,
      freshCount: 2,
      count: 10,
      carriedForward: ["A", "B", "C", "D", "E", "F", "G", "H"],
      quotes: Object.fromEntries([...Array(10)].map((_, i) => [`T${i}`, {}])),
    };
    assert.equal(quotesFreshCount(q), 2);
    assert.equal(quotesFreshRatio(q), 0.2);
  });
  it("treats fetchFailed as zero fresh", () => {
    assert.equal(quotesFreshCount({ fetchFailed: true, freshCount: 10, total: 10 }), 0);
    assert.equal(quotesFreshRatio({ fetchFailed: true, freshCount: 10, total: 10 }), 0);
  });
  it("falls back to count minus carried", () => {
    const q = {
      total: 5,
      count: 5,
      carriedForward: ["A", "B"],
      quotes: { A: {}, B: {}, C: {}, D: {}, E: {} },
    };
    assert.equal(quotesFreshCount(q), 3);
  });
});

describe("ageOk", () => {
  it("compares to max hours", () => {
    assert.equal(ageOk(11, 12), true);
    assert.equal(ageOk(13, 12), false);
    assert.equal(ageOk(null, 12), false);
  });
});

describe("freshUntil", () => {
  it("returns an explicit freshness deadline", () => {
    assert.equal(
      freshUntil("2026-08-14T12:00:00.000Z", 6),
      "2026-08-14T18:00:00.000Z"
    );
  });

  it("rejects invalid timestamps and thresholds", () => {
    assert.equal(freshUntil("not-a-date", 6), null);
    assert.equal(freshUntil("2026-08-14T12:00:00.000Z", -1), null);
  });
});
