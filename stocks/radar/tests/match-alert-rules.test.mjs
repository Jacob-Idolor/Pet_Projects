import assert from "node:assert/strict";
import { describe, it } from "node:test";
import {
  matchAlertRules,
  filterHitsByCooldown,
  updateFiredState,
  publicRulesSummary,
} from "../scripts/alerts/match-alert-rules.mjs";

const buyQuote = {
  price: 12,
  changePct: 1.2,
  rsi14: 22,
  range52Pct: 8,
  vsSma: { 50: -12 },
  volRatio: 1.1,
};

const sellQuote = {
  price: 90,
  changePct: -0.5,
  rsi14: 78,
  range52Pct: 92,
  pctFromAth: -1,
  vsSma: { 50: 15 },
  volRatio: 1.4,
};

const watchlist = [
  { symbol: "AAA", name: "Alpha", tags: ["ai"], targetPrice: 12.5 },
  { symbol: "BBB", name: "Beta", tags: ["semi"], targetPrice: 50 },
  { symbol: "CCC", name: "Gamma", tags: [] },
];

const quotes = {
  AAA: buyQuote,
  BBB: sellQuote,
  CCC: { price: 20, changePct: 0.1, rsi14: 50, range52Pct: 50 },
};

describe("matchAlertRules", () => {
  it("fires lean-buy only for matching symbol + buy bias", () => {
    const hits = matchAlertRules(
      {
        rules: [
          {
            id: "r1",
            subscriberId: "jacob",
            signal: "lean-buy",
            symbols: ["AAA"],
            enabled: true,
            minScore: 3,
          },
        ],
      },
      watchlist,
      quotes
    );
    assert.equal(hits.length, 1);
    assert.equal(hits[0].stock.symbol, "AAA");
    assert.equal(hits[0].fireKey, "r1::AAA::lean-buy");
    assert.match(hits[0].hit.summary, /lean buy/i);
  });

  it("ignores disabled rules and unknown signals", () => {
    const hits = matchAlertRules(
      {
        rules: [
          { id: "off", subscriberId: "jacob", signal: "lean-buy", enabled: false },
          { id: "bad", subscriberId: "jacob", signal: "not-a-signal", enabled: true },
        ],
      },
      watchlist,
      quotes
    );
    assert.equal(hits.length, 0);
  });

  it("filters by tag when symbols omitted", () => {
    const hits = matchAlertRules(
      {
        rules: [
          {
            id: "tag-sell",
            subscriberId: "jacob",
            signal: "lean-sell",
            tags: ["semi"],
            enabled: true,
            maxScore: -3,
          },
        ],
      },
      watchlist,
      quotes
    );
    assert.equal(hits.length, 1);
    assert.equal(hits[0].stock.symbol, "BBB");
  });

  it("near-target uses stock target and nearTargetPct", () => {
    const hits = matchAlertRules(
      {
        rules: [
          {
            id: "pt",
            subscriberId: "jacob",
            signal: "near-target",
            symbols: ["AAA"],
            nearTargetPct: 5,
            enabled: true,
          },
        ],
      },
      watchlist,
      quotes
    );
    // AAA price 12 vs target 12.5 → ~-4% — within 5%
    assert.equal(hits.length, 1);
    assert.ok(Math.abs(hits[0].hit.distPct) <= 5);
  });

  it("price-below / rsi-below require threshold breach", () => {
    const hits = matchAlertRules(
      {
        rules: [
          {
            id: "px",
            subscriberId: "jacob",
            signal: "price-below",
            symbols: ["AAA"],
            price: 15,
            enabled: true,
          },
          {
            id: "rsi",
            subscriberId: "jacob",
            signal: "rsi-below",
            symbols: ["AAA"],
            rsi: 30,
            enabled: true,
          },
          {
            id: "nope",
            subscriberId: "jacob",
            signal: "price-below",
            symbols: ["AAA"],
            price: 10,
            enabled: true,
          },
        ],
      },
      watchlist,
      quotes
    );
    const ids = hits.map((h) => h.rule.id).sort();
    assert.deepEqual(ids, ["px", "rsi"]);
  });

  it("skips symbols with missing quotes", () => {
    const hits = matchAlertRules(
      {
        rules: [
          {
            id: "all-buy",
            subscriberId: "jacob",
            signal: "lean-buy",
            enabled: true,
            minScore: 3,
          },
        ],
      },
      [...watchlist, { symbol: "ZZZ", name: "Missing" }],
      quotes
    );
    assert.ok(hits.every((h) => h.stock.symbol !== "ZZZ"));
  });

  it("requires rule id, subscriberId, and signal", () => {
    const hits = matchAlertRules(
      {
        rules: [
          { subscriberId: "jacob", signal: "lean-buy", enabled: true },
          { id: "x", signal: "lean-buy", enabled: true },
          { id: "y", subscriberId: "jacob", enabled: true },
        ],
      },
      watchlist,
      quotes
    );
    assert.equal(hits.length, 0);
  });
});

describe("filterHitsByCooldown / updateFiredState", () => {
  const hit = {
    fireKey: "r1::AAA::lean-buy",
    rule: { id: "r1", cooldownHours: 24 },
    stock: { symbol: "AAA" },
    hit: { summary: "x" },
  };

  it("suppresses hits still inside cooldown window", () => {
    const now = Date.parse("2026-07-29T12:00:00Z");
    const state = { fired: { "r1::AAA::lean-buy": "2026-07-29T01:00:00Z" } };
    const { fresh, skipped } = filterHitsByCooldown([hit], state, now, 24);
    assert.equal(fresh.length, 0);
    assert.equal(skipped.length, 1);
  });

  it("allows re-fire after cooldown expires", () => {
    const now = Date.parse("2026-07-30T12:00:00Z");
    const state = { fired: { "r1::AAA::lean-buy": "2026-07-29T01:00:00Z" } };
    const { fresh, skipped } = filterHitsByCooldown([hit], state, now, 24);
    assert.equal(fresh.length, 1);
    assert.equal(skipped.length, 0);
  });

  it("honors per-rule cooldownHours override", () => {
    const now = Date.parse("2026-07-29T12:00:00Z");
    const short = {
      ...hit,
      rule: { id: "r1", cooldownHours: 1 },
    };
    const state = { fired: { "r1::AAA::lean-buy": "2026-07-29T01:00:00Z" } };
    const { fresh } = filterHitsByCooldown([short], state, now, 24);
    assert.equal(fresh.length, 1);
  });

  it("updateFiredState stamps fire keys without dropping prior entries", () => {
    const prev = { fired: { other: "2026-01-01T00:00:00Z" } };
    const next = updateFiredState(prev, [hit], "2026-07-29T12:00:00Z");
    assert.equal(next.fired.other, "2026-01-01T00:00:00Z");
    assert.equal(next.fired["r1::AAA::lean-buy"], "2026-07-29T12:00:00Z");
    assert.equal(next.updatedAt, "2026-07-29T12:00:00Z");
  });
});

describe("publicRulesSummary", () => {
  it("omits disabled rules and never invents emails", () => {
    const summary = publicRulesSummary({
      rules: [
        {
          id: "a",
          subscriberId: "jacob",
          signal: "lean-buy",
          symbols: ["AAA"],
          note: "hi",
          enabled: true,
          email: "secret@example.com",
        },
        { id: "b", subscriberId: "x", signal: "lean-sell", enabled: false },
      ],
    });
    assert.equal(summary.length, 1);
    assert.equal(summary[0].id, "a");
    assert.equal(summary[0].email, undefined);
    assert.deepEqual(summary[0].symbols, ["AAA"]);
  });
});
