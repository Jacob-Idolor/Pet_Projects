import { readFileSync } from "node:fs";
import { validateNbisSnapshot } from "../lib/nbis-quality.mjs";

try {
  const data = JSON.parse(readFileSync(process.argv.includes("--stdin") ? 0 : new URL("../../public/nbis.json", import.meta.url), "utf8"));
  const errors = validateNbisSnapshot(data, { requireFresh: process.argv.includes("--fresh") });
  if (errors.length) throw new Error(errors.join("\n- "));
  console.log(`NBIS schema ok — ${data.status} — ${data.sec.filings.length} filings — ${data.priceHistory.length} price points`);
} catch (error) {
  console.error(`NBIS validation failed: ${error.message}`);
  process.exit(1);
}
