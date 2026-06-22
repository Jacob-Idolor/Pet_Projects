import { defineConfig } from "astro/config";

export default defineConfig({
  site: "https://example.com",
  output: "static",
  trailingSlash: "never",
  build: {
    // "file" → /labs.html served as /labs (works on S3 + CloudFront)
    // "directory" → /labs/index.html breaks on S3 when linking to /labs/
    format: "file",
  },
});
