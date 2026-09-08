import { existsSync, readFileSync } from "node:fs";
import { resolve } from "node:path";
import { fileURLToPath } from "node:url";

const root = resolve(fileURLToPath(new URL("../..", import.meta.url)));
const path = resolve(root, "public/nbis.json");
const errors = [];

if (!existsSync(path)) {
  errors.push("public/nbis.json is missing");
} else {
  let data;
  try {
    data = JSON.parse(readFileSync(path, "utf8"));
  } catch (error) {
    errors.push(`invalid JSON: ${error.message || error}`);
  }
  if (data) {
    if (data.schemaVersion !== 1) errors.push("schemaVersion must be 1");
    if (data.ticker !== "NBIS") errors.push("ticker must be NBIS");
    if (!data.company) errors.push("company missing");
    if (!data.profile || !Array.isArray(data.profile.businessLines)) errors.push("profile.businessLines missing");
    for (const key of ["price", "technical", "fundamentals", "statements", "sec", "scenarios", "research", "news", "sources"]) {
      if (!(key in data)) errors.push(`${key} missing`);
    }
    if (!Array.isArray(data.statements?.annual) || !Array.isArray(data.statements?.quarterly)) errors.push("statements annual/quarterly must be arrays");
    if (!Array.isArray(data.sec?.filings)) errors.push("sec.filings must be an array");
    if (!data.sec?.facts || typeof data.sec.facts !== "object" || Array.isArray(data.sec.facts)) errors.push("sec.facts must be an object map");
    if (!Array.isArray(data.research?.risks) || !Array.isArray(data.research?.catalysts)) errors.push("research risks/catalysts must be arrays");
    if (!Array.isArray(data.priceHistory)) errors.push("priceHistory must be an array");
    if (data.status === "ok" && !data.fetchedAt) errors.push("ok snapshot must include fetchedAt");
  }
}

if (errors.length) {
  console.error(`NBIS schema failed (${errors.length}):`);
  for (const error of errors) console.error(`- ${error}`);
  process.exit(1);
}

const data = JSON.parse(readFileSync(path, "utf8"));
console.log(`NBIS schema ok — ${data.status} — ${data.sec.filings.length} filings — ${data.priceHistory.length} price points`);
