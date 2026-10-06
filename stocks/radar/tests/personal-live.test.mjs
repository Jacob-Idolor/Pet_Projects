import assert from "node:assert/strict";
import { spawn } from "node:child_process";
import { createServer } from "node:http";
import { fileURLToPath } from "node:url";
import { test } from "node:test";

const checker = fileURLToPath(new URL("../scripts/ops/check-personal-live.mjs", import.meta.url));
const pages = {
  "/": "Make room for life.",
  "/guides.html": "Before you automate",
  "/resources.html": "A small toolkit.",
  "/about.html": "Good systems should give something back.",
  "/privacy.html": "A short privacy note.",
  "/guides/before-you-automate.html": "Before you automate, make the task smaller.",
  "/guides/ai-output-you-can-check.html": "Ask AI for an answer you can check.",
  "/guides/starting-smaller.html": "When the side project becomes the work.",
};

async function runCheck({ missingPage, fallbackPage, metadata } = {}) {
  const requests = [];
  const server = createServer((request, response) => {
    const path = new URL(request.url, "http://localhost").pathname;
    requests.push(path);
    if (path === missingPage) {
      response.writeHead(404).end("Missing page");
    } else if (path === "/build-meta.json") {
      response.setHeader("Content-Type", "application/json");
      response.end(JSON.stringify(metadata === undefined
        ? { gitSha: "expected-revision", builtAt: "2026-10-06T00:00:00Z" }
        : metadata));
    } else if (pages[path]) {
      const text = path === fallbackPage ? pages["/"] : pages[path];
      response.end(`<html><title>Jacob Builds</title><h1>${text}</h1></html>`);
    } else {
      response.writeHead(404).end("Not found");
    }
  });
  await new Promise(resolve => server.listen(0, "127.0.0.1", resolve));
  try {
    const child = spawn(process.execPath, [checker, `http://127.0.0.1:${server.address().port}`], {
      env: { ...process.env, EXPECTED_GIT_SHA: "expected-revision" },
      stdio: ["ignore", "pipe", "pipe"],
    });
    let output = "";
    child.stdout.on("data", chunk => { output += chunk; });
    child.stderr.on("data", chunk => { output += chunk; });
    const status = await new Promise((resolve, reject) => {
      child.once("error", reject);
      child.once("close", resolve);
    });
    return { status, output, requests };
  } finally {
    await new Promise(resolve => server.close(resolve));
  }
}

test("live check verifies the complete static reader journey and revision", async () => {
  const result = await runCheck();
  assert.equal(result.status, 0, result.output);
  assert.match(result.output, /8 pages/);
  assert.ok(result.requests.includes("/guides/starting-smaller.html"));
});

test("live check rejects a partial release with a missing guide", async () => {
  const result = await runCheck({ missingPage: "/guides/ai-output-you-can-check.html" });
  assert.notEqual(result.status, 0);
  assert.match(result.output, /Page unavailable.*ai-output-you-can-check/);
});

test("live check rejects a homepage fallback served as a guide", async () => {
  const result = await runCheck({ fallbackPage: "/guides/starting-smaller.html" });
  assert.notEqual(result.status, 0);
  assert.match(result.output, /Unexpected page content.*starting-smaller/);
});

test("live check rejects a stale deployed revision", async () => {
  const result = await runCheck({ metadata: { gitSha: "previous-revision", builtAt: "2026-10-06T00:00:00Z" } });
  assert.notEqual(result.status, 0);
  assert.match(result.output, /Deployed revision does not match/);
});

test("live check rejects malformed build metadata", async () => {
  for (const metadata of [null, {}, { gitSha: "expected-revision", builtAt: "invalid" }]) {
    const result = await runCheck({ metadata });
    assert.notEqual(result.status, 0);
    assert.match(result.output, /Build metadata is invalid/);
  }
});
