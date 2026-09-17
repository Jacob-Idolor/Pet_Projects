/**
 * Build the NBIS snapshot without making ordinary local builds depend on a
 * live provider. Production/daily jobs set NBIS_STRICT=1 so a failed fetch
 * cannot be mistaken for a fresh research update.
 */
import { spawnSync } from "node:child_process";
import { existsSync, readFileSync, writeFileSync } from "node:fs";
import { resolve, dirname } from "node:path";
import { fileURLToPath } from "node:url";

const here = dirname(fileURLToPath(import.meta.url));
const root = resolve(here, "../..");
const script = resolve(root, "scripts/fetch/fetch-nbis.py");
const out = resolve(root, "public/nbis.json");
const strict = process.env.NBIS_STRICT === "1" || process.env.STOCKS_RADAR_ENV === "production";

if (process.env.NBIS_SKIP === "1") {
  console.log("NBIS_SKIP=1 — leaving existing public/nbis.json");
  process.exit(existsSync(out) ? 0 : 1);
}

if (strict && !process.env.SEC_CONTACT_EMAIL?.trim() && !process.env.SEC_USER_AGENT?.trim()) {
  console.error("Production NBIS refresh requires SEC_CONTACT_EMAIL or SEC_USER_AGENT for the SEC User-Agent header.");
  process.exit(1);
}

const python = process.env.PYTHON || (process.platform === "win32" ? "python" : "python3");
const result = spawnSync(python, [script], {
  cwd: root,
  encoding: "utf8",
  env: process.env,
  stdio: ["ignore", "pipe", "pipe"],
});

if (result.stdout) process.stdout.write(result.stdout);
if (result.stderr) process.stderr.write(result.stderr);

if (result.status === 0 && existsSync(out)) {
  console.log("NBIS snapshot fetch completed.");
  process.exit(0);
}

if (strict) {
  console.error("NBIS_STRICT / production — refusing to continue without a fresh NBIS snapshot.");
  if (result.error) console.error(String(result.error));
  process.exit(result.status || 1);
}

if (existsSync(out)) {
  try {
    const current = JSON.parse(readFileSync(out, "utf8"));
    console.warn(`Keeping existing NBIS snapshot from ${current.fetchedAt || "unknown time"}.`);
    process.exit(0);
  } catch (error) {
    console.warn(`Existing public/nbis.json is invalid: ${error.message || error}`);
  }
}

// A clean checkout can still build the shell locally. It is deliberately
// marked unavailable and contains no synthetic market numbers.
const fallback = {
  schemaVersion: 1,
  ticker: "NBIS",
  company: "Nebius Group N.V.",
  fetchedAt: null,
  status: "unavailable",
  profile: JSON.parse(readFileSync(resolve(root, "src/data/nbis-profile.json"), "utf8")),
  price: {},
  technical: { returns: {} },
  fundamentals: {},
  statements: { annual: [], quarterly: [] },
  sec: { filings: [], facts: [] },
  scenarios: { rows: [], assumptionNote: "No live snapshot is available." },
  research: {
    readouts: [],
    risks: [{ title: "Snapshot unavailable", severity: "High", detail: "Run npm run update-nbis with network access before treating this page as current." }],
    catalysts: [],
  },
  news: [],
  sources: [],
  priceHistory: [],
};
writeFileSync(out, JSON.stringify(fallback), "utf8");
console.warn("Wrote an unavailable NBIS shell snapshot for local build purposes.");
