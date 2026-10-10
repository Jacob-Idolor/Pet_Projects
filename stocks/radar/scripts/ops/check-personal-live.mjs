/** Read-only post-deploy checks for the static personal site. */
const site = (process.argv[2] || "https://stockswatch.cc").replace(/\/$/, "");
const revision = Date.now();
const pages = [
  ["/", "Make room for life."],
  ["/guides", "Before you automate"],
  ["/resources", "A small toolkit."],
  ["/consulting", "Monitoring &amp; Alert Health Check"],
  ["/about", "Good systems should give something back."],
  ["/privacy", "A short privacy note."],
  ["/guides/before-you-automate", "Before you automate, make the task smaller."],
  ["/guides/ai-output-you-can-check", "Ask AI for an answer you can check."],
  ["/guides/starting-smaller", "When the side project becomes the work."],
];

for (const [path, marker] of pages) {
  const response = await fetch(`${site}${path}?revision=${revision}`, {
    signal: AbortSignal.timeout(15000),
  });
  if (!response.ok) throw new Error(`Page unavailable: ${path} (HTTP ${response.status})`);
  const html = await response.text();
  if (!html.includes(marker) || !html.includes("Jacob Builds")) {
    throw new Error(`Unexpected page content: ${path}`);
  }
  if (/<script\b[^>]*\bsrc\s*=|<form\b|<iframe\b/i.test(html)) {
    throw new Error(`Unexpected script or interactive embed: ${path}`);
  }
}

// Verify the exact public SEO URLs Google fetches, without masking edge failures.
const robotsResponse = await fetch(`${site}/robots.txt`, {
  redirect: "manual", signal: AbortSignal.timeout(15000),
});
if (robotsResponse.status !== 200) throw new Error(`Robots unavailable (HTTP ${robotsResponse.status})`);
const robots = await robotsResponse.text();
if (!/^User-agent:\s*\*\s*$/im.test(robots) || !/^Allow:\s*\/\s*$/im.test(robots) ||
    /^Disallow:\s*\/\s*$/im.test(robots) || !robots.includes(`Sitemap: ${site}/sitemap.xml`)) {
  throw new Error("Unexpected robots directives or sitemap target");
}
const sitemapResponse = await fetch(`${site}/sitemap.xml`, {
  redirect: "manual", signal: AbortSignal.timeout(15000),
});
if (sitemapResponse.status !== 200) throw new Error(`Sitemap unavailable (HTTP ${sitemapResponse.status})`);
const sitemap = await sitemapResponse.text();
if (!/<urlset\b[^>]*xmlns=["']http:\/\/www\.sitemaps\.org\/schemas\/sitemap\/0\.9["']/.test(sitemap)) {
  throw new Error("Sitemap is not a sitemap XML document");
}
const urls = [...sitemap.matchAll(/<loc>([^<]+)<\/loc>/g)].map(match => match[1]);
const expectedUrls = pages.map(([path]) => `${site}${path}`);
if (urls.length !== expectedUrls.length || new Set(urls).size !== urls.length ||
    expectedUrls.some(url => !urls.includes(url))) {
  throw new Error("Sitemap does not match the active reader routes");
}

// Do not cache-bust these requests: retained legacy assets can return 200 only
// at their original URL, while a query-string URL correctly returns 404.
const retiredAssets = [
  "/nbis.json", "/screener.json", "/dc-movers.json", "/health.json",
  "/settings.json", "/ads.txt", "/watchlist-board.mjs",
  "/downloads/ai-infrastructure-research-kit.md",
  "/downloads/research-workflow-sample.md",
  "/datacenter/app.js", "/datacenter/map.js", "/datacenter/style.css",
  "/downloads/stockswatch-research-workflow-pack.zip",
];
for (const path of retiredAssets) {
  const response = await fetch(`${site}${path}`, {
    signal: AbortSignal.timeout(15000),
  });
  if (response.status !== 404) {
    throw new Error(`Retired asset still available: ${path} (HTTP ${response.status})`);
  }
  const retiredHtml = await response.text();
  if (/<script\b[^>]*\bsrc\s*=|<form\b|<iframe\b/i.test(retiredHtml)) {
    throw new Error(`Unexpected script or interactive embed on retired response: ${path}`);
  }
}

const response = await fetch(`${site}/build-meta.json?revision=${revision}`, {
  signal: AbortSignal.timeout(15000),
});
if (!response.ok) throw new Error("Build metadata missing");
const meta = await response.json();
if (!meta || typeof meta.gitSha !== "string" || !meta.gitSha.trim() ||
    typeof meta.builtAt !== "string" || !Number.isFinite(Date.parse(meta.builtAt))) {
  throw new Error("Build metadata is invalid");
}
if (process.env.EXPECTED_GIT_SHA && meta.gitSha !== process.env.EXPECTED_GIT_SHA) {
  throw new Error("Deployed revision does not match");
}
console.log(`Personal site verified: ${pages.length} pages, robots and sitemap, ${retiredAssets.length} retired assets and build revision ${meta.gitSha}.`);
