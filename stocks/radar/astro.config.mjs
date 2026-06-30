import { defineConfig } from "astro/config";

const base = process.env.STOCKS_RADAR_BASE ?? "/";
const site =
  process.env.STOCKS_RADAR_SITE ??
  (base === "/"
    ? "https://example.cloudfront.net"
    : "https://jacob-idolor.github.io/Pet_Projects/stocks-radar");

export default defineConfig({
  site,
  base,
  output: "static",
  trailingSlash: "never",
  build: {
    format: "file",
  },
});
