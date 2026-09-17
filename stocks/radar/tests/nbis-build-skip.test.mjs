import assert from "node:assert/strict";
import { createHash } from "node:crypto";
import { readFileSync } from "node:fs";
import { spawnSync } from "node:child_process";
import { describe, it } from "node:test";
import { resolve } from "node:path";
import { fileURLToPath } from "node:url";

const root = resolve(fileURLToPath(new URL("..", import.meta.url)));
const snapshot = resolve(root, "public/nbis.json");
const fetcher = resolve(root, "scripts/fetch/fetch-nbis-soft.mjs");

function sha256(path) {
  return createHash("sha256").update(readFileSync(path)).digest("hex");
}

describe("NBIS build skip", () => {
  it("does not require SEC credentials when reusing the fetched snapshot", () => {
    const before = sha256(snapshot);
    const env = { ...process.env };
    delete env.SEC_CONTACT_EMAIL;
    delete env.SEC_USER_AGENT;
    env.NBIS_SKIP = "1";
    env.STOCKS_RADAR_ENV = "production";

    const result = spawnSync(process.execPath, [fetcher], {
      cwd: root,
      env,
      encoding: "utf8",
    });

    assert.equal(result.status, 0, result.stderr);
    assert.match(result.stdout, /NBIS_SKIP=1/);
    assert.doesNotMatch(result.stderr, /requires SEC_CONTACT_EMAIL/i);
    assert.equal(sha256(snapshot), before);
  });
});
