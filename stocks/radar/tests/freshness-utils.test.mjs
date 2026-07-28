import assert from "node:assert/strict";
import { describe, it } from "node:test";
import {
  ageHours,
  ageOk,
  coverageOk,
  coverageRatio,
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

describe("ageOk", () => {
  it("compares to max hours", () => {
    assert.equal(ageOk(11, 12), true);
    assert.equal(ageOk(13, 12), false);
    assert.equal(ageOk(null, 12), false);
  });
});
