import { test } from "node:test";
import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import { validateNbisSnapshot, snapshotState } from "../scripts/lib/nbis-quality.mjs";
import { fractionPct, pct, renderSnapshot } from "../src/lib/nbis-render.ts";
const source = JSON.parse(readFileSync(new URL("../public/nbis.json", import.meta.url)));
const now = Date.parse("2026-09-23T16:00:00Z");
function fixture() {
  const data = structuredClone(source);
  data.fetchedAt = new Date(now).toISOString();
  data.priceHistory = Array.from({ length: 30 }, (_, i) => ({ date: new Date(now - (30 - i) * 86400000).toISOString().slice(0, 10), close: 100 + i }));
  return data;
}
test("fraction percentages differ from percentage-point returns", () => {
  assert.equal(fractionPct(.2), "+20.0%");
  assert.equal(fractionPct(.5), "+50.0%");
  assert.equal(fractionPct(.85), "+85.0%");
  assert.equal(fractionPct(4.54), "+454.0%");
  assert.equal(fractionPct(-.00223), "-0.2%");
  assert.equal(pct(4.14), "+4.1%");
  assert.equal(fractionPct(null), "—");
});
test("rendering preserves units, escapes provider text and uses source URLs", () => {
  const data = fixture();
  data.fundamentals.revenueGrowth = 4.54;
  data.fundamentals.debtToEquity = 125;
  data.news = [{ title: '<img src=x onerror=alert(1)>', url: 'javascript:alert(1)', published: 'invalid' }];
  const { html } = renderSnapshot(data, now);
  assert.equal(html['nbis-revenue-growth'], '+454.0%');
  assert.match(html['nbis-balance-sheet'], /1\.25x/);
  assert.match(html['nbis-scenario-table'], /\+50\.0%/);
  assert.match(html['nbis-news'], /&lt;img/);
  assert.doesNotMatch(html['nbis-news'], /href="javascript:/);
});
test("freshness expires, rejects future dates and never calls old data live", () => {
  const data = fixture();
  assert.equal(snapshotState(data, now).label, 'DAILY');
  assert.equal(snapshotState(data, now + 31 * 3600000).label, 'STALE');
  assert.equal(snapshotState(data, now - 3600000).label, 'INVALID TIME');
  assert.equal(snapshotState({ status: 'unavailable' }, now).label, 'UNAVAILABLE');
});
test("deployment requires fresh complete data, offline schema permits age", () => {
  const data = fixture();
  assert.deepEqual(validateNbisSnapshot(data, { requireFresh: true, now }), []);
  data.fetchedAt = '2020-01-01T00:00:00Z';
  assert.deepEqual(validateNbisSnapshot(data, { now }), []);
  assert.ok(validateNbisSnapshot(data, { requireFresh: true, now }).length);
});
test("invalid prices, missing coverage and malformed shapes fail the quality gate", () => {
  for (const mutate of [
    d => { d.price.current = null; },
    d => { d.priceHistory = []; },
    d => { d.priceHistory[1].date = d.priceHistory[0].date; },
    d => { d.sec.filings = []; },
    d => { d.statements.quarterly = []; },
    d => { d.research.readouts = [null]; },
    d => { d.fetchedAt = 'not a date'; },
  ]) {
    const data = fixture(); mutate(data);
    assert.ok(validateNbisSnapshot(data, { requireFresh: true, now }).length);
  }
  assert.ok(validateNbisSnapshot(null).length);
});
