#!/usr/bin/env node
/** Bundle watchlist UI with a direct esbuild dependency. */

import * as esbuild from "esbuild";
import { dirname, join } from "node:path";
import { fileURLToPath } from "node:url";

const root = join(dirname(fileURLToPath(import.meta.url)), "..");

await esbuild.build({
  entryPoints: [join(root, "src/scripts/watchlist-board.ts")],
  bundle: true,
  format: "esm",
  outfile: join(root, "public/watchlist-board.mjs"),
});

console.log("✓ public/watchlist-board.mjs");
