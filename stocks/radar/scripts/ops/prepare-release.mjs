/** Keep historical screener artifacts in the checkout, out of production. */
import { rmSync } from "node:fs";
import { resolve, sep } from "node:path";
import { fileURLToPath } from "node:url";
const dist = fileURLToPath(new URL("../../dist/", import.meta.url));
for (const name of ["screener.json", "dc-movers.json", "datacenter"]) {
  const target = resolve(dist, name);
  if (!target.startsWith(resolve(dist) + sep)) throw new Error("Release target outside dist");
  rmSync(target, { recursive: true, force: true });
}
console.log("Historical screener artifacts excluded from production; sources retained.");
