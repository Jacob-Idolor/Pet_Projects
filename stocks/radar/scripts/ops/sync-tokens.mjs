#!/usr/bin/env node
/**
 * Keep public/tokens.css identical to src/styles/tokens.css.
 * Datacenter loads /tokens.css; home imports via Astro — avoid drift.
 */
import { copyFileSync, mkdirSync, readFileSync, writeFileSync } from "node:fs";
import { dirname, resolve } from "node:path";
import { fileURLToPath } from "node:url";

const ROOT = resolve(dirname(fileURLToPath(import.meta.url)), "../..");
const SRC = resolve(ROOT, "src/styles/tokens.css");
const DEST = resolve(ROOT, "public/tokens.css");

mkdirSync(dirname(DEST), { recursive: true });
const body = readFileSync(SRC, "utf8");
writeFileSync(DEST, body);
console.log("✓ public/tokens.css ← src/styles/tokens.css");
