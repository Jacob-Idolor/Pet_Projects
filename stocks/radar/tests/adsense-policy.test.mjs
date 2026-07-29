import assert from "node:assert/strict";
import { describe, it } from "node:test";
import {
  canShowAdSlot,
  evaluateLiveAdsGate,
  hasPublisherContent,
  isCustomDomain,
} from "../scripts/lib/adsense-policy.mjs";

describe("isCustomDomain", () => {
  it("accepts stockswatch.cc", () => {
    assert.equal(isCustomDomain("https://stockswatch.cc"), true);
  });
  it("rejects CloudFront and localhost", () => {
    assert.equal(isCustomDomain("https://d123.cloudfront.net"), false);
    assert.equal(isCustomDomain("http://localhost:4321"), false);
    assert.equal(isCustomDomain(""), false);
  });
});

describe("hasPublisherContent", () => {
  it("requires min tickers", () => {
    assert.equal(hasPublisherContent(4, 5), false);
    assert.equal(hasPublisherContent(5, 5), true);
    assert.equal(hasPublisherContent(14, 5), true);
  });
});

describe("evaluateLiveAdsGate", () => {
  it("enables on custom domain with content", () => {
    const r = evaluateLiveAdsGate({
      client: "ca-pub-123",
      enabledFlag: "true",
      preview: false,
      siteUrl: "https://stockswatch.cc",
      requireCustomDomain: true,
      tickerCount: 14,
    });
    assert.equal(r.enabled, true);
    assert.equal(r.blockReason, null);
  });
  it("blocks CloudFront when domain required", () => {
    const r = evaluateLiveAdsGate({
      client: "ca-pub-123",
      enabledFlag: "true",
      preview: false,
      siteUrl: "https://d123.cloudfront.net",
      requireCustomDomain: true,
      tickerCount: 14,
    });
    assert.equal(r.enabled, false);
    assert.match(r.blockReason || "", /custom domain/i);
  });
  it("requires explicit ENABLED=true", () => {
    const r = evaluateLiveAdsGate({
      client: "ca-pub-123",
      enabledFlag: undefined,
      preview: false,
      siteUrl: "https://stockswatch.cc",
      requireCustomDomain: true,
      tickerCount: 14,
    });
    assert.equal(r.enabled, false);
    assert.match(r.blockReason || "", /ENABLED/i);
  });
});

describe("canShowAdSlot", () => {
  it("hides hero when placement disallowed", () => {
    assert.equal(
      canShowAdSlot(
        {
          allowedPlacements: { hero: false, board: true, footer: true },
          preview: true,
          enabled: false,
          client: "",
          slots: {},
        },
        "hero"
      ),
      false
    );
  });
  it("shows board in preview", () => {
    assert.equal(
      canShowAdSlot(
        {
          allowedPlacements: { hero: false, board: true, footer: true },
          preview: true,
          enabled: false,
          client: "",
          slots: {},
        },
        "board"
      ),
      true
    );
  });
  it("requires slot id when live", () => {
    assert.equal(
      canShowAdSlot(
        {
          allowedPlacements: { board: true },
          preview: false,
          enabled: true,
          client: "ca-pub-1",
          slots: { board: "" },
        },
        "board"
      ),
      false
    );
    assert.equal(
      canShowAdSlot(
        {
          allowedPlacements: { board: true },
          preview: false,
          enabled: true,
          client: "ca-pub-1",
          slots: { board: "111" },
        },
        "board"
      ),
      true
    );
  });
});
