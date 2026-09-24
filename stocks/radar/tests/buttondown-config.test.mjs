import assert from "node:assert/strict";
import { test } from "node:test";
import { buttondownConfig } from "../scripts/lib/buttondown-config.mjs";

test("signup stays absent when explicitly disabled", () => {
  for (const value of ["", "   "]) assert.equal(buttondownConfig(value), null);
});

test("only a username can target the fixed Buttondown endpoint", () => {
  assert.equal(buttondownConfig("  stocks-notes  ").subscribeUrl, "https://buttondown.com/api/emails/embed-subscribe/stocks-notes");
  for (const value of ["https://buttondown.com/name", "../name", "name?email=x", "name/other", "<script>", "a".repeat(65)]) {
    assert.throws(() => buttondownConfig(value), /PUBLIC_BUTTONDOWN_USERNAME/);
  }
});

test("default identity matches the owner-provided newsletter", () => {
  assert.equal(buttondownConfig().archiveUrl, "https://buttondown.com/stockwatch");
});
