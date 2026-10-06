import assert from "node:assert/strict";
import { mkdtempSync, mkdirSync, rmSync, writeFileSync } from "node:fs";
import { tmpdir } from "node:os";
import { join, dirname, resolve } from "node:path";
import { test } from "node:test";
import { checkPersonalPolicy } from "../scripts/ops/check-personal-policy.mjs";

function fixture(html, check) {
  const tempRoot = resolve(tmpdir());
  const dist = mkdtempSync(join(tempRoot, "jacob-policy-"));
  try {
    mkdirSync(join(dist, "guides"));
    for (const file of ["404.html", "datacenter.html", "research-kit.html", "workflow-pack.html", "guides/nbis-research-guide.html", "guides/nbis-sec-filings.html"]) {
      writeFileSync(join(dist, file), '<meta name="robots" content="noindex,follow">');
    }
    writeFileSync(join(dist, "index.html"), html);
    check(dist);
  } finally {
    if (dirname(resolve(dist)) !== tempRoot) throw new Error("Policy fixture outside temporary directory");
    rmSync(dist, { recursive: true, force: true });
  }
}

test("static publishing policy accepts a plain guide site", () => {
  fixture('<html><h1>Jacob Builds</h1><a href="/guides.html">Guides</a></html>', dist => {
    assert.deepEqual(checkPersonalPolicy(dist), []);
  });
});

test("static publishing policy rejects advertising and analytics loaders", () => {
  for (const loader of ["adsbygoogle", "https://www.googletagmanager.com/gtag/js"]) {
    fixture(`<script>${loader}</script>`, dist => {
      assert.ok(checkPersonalPolicy(dist).some(finding => finding.includes("advertising or analytics")));
    });
  }
});

test("static publishing policy rejects signup forms and embedded frames", () => {
  for (const element of ['<form action="https://newsletter.example"></form>', '<iframe src="https://example.com"></iframe>']) {
    fixture(element, dist => {
      assert.ok(checkPersonalPolicy(dist).some(finding => finding.includes("form or iframe")));
    });
  }
});

test("static publishing policy rejects third-party script dependencies", () => {
  fixture('<script src="//example.com/widget.js"></script>', dist => {
    assert.ok(checkPersonalPolicy(dist).some(finding => finding.includes("third-party script")));
  });
});

test("static publishing policy requires noindex retirement and error pages", () => {
  fixture("<h1>Jacob Builds</h1>", dist => {
    writeFileSync(join(dist, "404.html"), '<meta name="robots" content="index,follow">');
    assert.ok(checkPersonalPolicy(dist).some(finding => finding.includes("404.html: must be noindex")));
  });
});
