import { defineConfig } from "astro/config";

const base = process.env.STOCKS_RADAR_BASE ?? "/";
const site = process.env.STOCKS_RADAR_SITE ?? "https://example.cloudfront.net";

export default defineConfig({
  site,
  base,
  output: "static",
  trailingSlash: "never",
  build: {
    format: "file",
  },
});
