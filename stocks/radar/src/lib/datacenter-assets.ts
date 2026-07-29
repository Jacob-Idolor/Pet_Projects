/**
 * Content-hashed datacenter asset filenames (written by scripts/hash-datacenter-assets.mjs).
 * Importing JSON keeps Vite/Astro on the correct path at build time.
 */
import manifestJson from "../data/datacenter-asset-manifest.json";

export type DatacenterAssetManifest = {
  generatedAt?: string;
  files: Record<string, string>;
};

const FALLBACK: Record<string, string> = {
  "static-api.js": "static-api.js",
  "app.js": "app.js",
  "datacenter.js": "datacenter.js",
  "rackexplorer.js": "rackexplorer.js",
  "style.css": "style.css",
};

const files = {
  ...FALLBACK,
  ...((manifestJson as DatacenterAssetManifest)?.files || {}),
};

export function datacenterAsset(name: string): string {
  return files[name] || name;
}

export function loadDatacenterAssetManifest(): DatacenterAssetManifest {
  return {
    generatedAt: (manifestJson as DatacenterAssetManifest)?.generatedAt,
    files: { ...files },
  };
}
