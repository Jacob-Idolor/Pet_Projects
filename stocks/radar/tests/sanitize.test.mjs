import assert from "node:assert/strict";
import { describe, it } from "node:test";
import {
  escapeHtml,
  safeHttpUrl,
  sanitizeId,
  sanitizeSymbol,
} from "../scripts/lib/sanitize.mjs";

describe("escapeHtml", () => {
  it("escapes markup characters", () => {
    assert.equal(escapeHtml(`<img src="x" onerror='alert(1)'>`), "&lt;img src=&quot;x&quot; onerror=&#39;alert(1)&#39;&gt;");
  });
});

describe("sanitizeSymbol", () => {
  it("accepts Yahoo-style tickers", () => {
    assert.equal(sanitizeSymbol("aapl"), "AAPL");
    assert.equal(sanitizeSymbol("BRK.B"), "BRK.B");
    assert.equal(sanitizeSymbol("6669.TW"), "6669.TW");
  });
  it("rejects injection", () => {
    assert.equal(sanitizeSymbol(`AAPL"><script>`), "");
    assert.equal(sanitizeSymbol(""), "");
  });
});

describe("sanitizeId", () => {
  it("allows safe ids only", () => {
    assert.equal(sanitizeId("nvda-1"), "nvda-1");
    assert.equal(sanitizeId("bad id"), "");
  });
});

describe("safeHttpUrl", () => {
  it("allows http(s) only", () => {
    assert.equal(safeHttpUrl("https://example.com/a?b=1"), "https://example.com/a?b=1");
    assert.equal(safeHttpUrl("javascript:alert(1)"), "#");
    assert.equal(safeHttpUrl("data:text/html,hi"), "#");
  });
});
