#!/usr/bin/env node
/** Bundle watchlist UI — uses esbuild from Astro's dependency tree (no duplicate install). */

import { createRequire } from "node:module";
import { dirname, join } from "node:path";
import { fileURLToPath } from "node:url";
import { existsSync } from "node:fs";

const root = join(dirname(fileURLToPath(import.meta.url)), "..");
const require = createRequire(join(root, "package.json"));

function loadEsbuild() {
  const candidates = [
    join(root, "node_modules", "esbuild"),
    join(root, "node_modules", "astro", "node_modules", "esbuild"),
  ];
  for (const dir of candidates) {
    if (existsSync(join(dir, "package.json"))) {
      return require(dir);
    }
  }
  throw new Error("esbuild not found — run npm install in stocks/radar first");
}

const esbuild = loadEsbuild();

await esbuild.build({
  entryPoints: [join(root, "src/scripts/watchlist-board.ts")],
  bundle: true,
  format: "esm",
  outfile: join(root, "public/watchlist-board.mjs"),
});

console.log("✓ public/watchlist-board.mjs");
