/** Read-only post-deploy checks for the static personal site. */
const site = (process.argv[2] || "https://stockswatch.cc").replace(/\/$/, "");
const revision = Date.now();
const pages = [
  ["/", "Make room for life."],
  ["/guides.html", "Before you automate"],
  ["/resources.html", "A small toolkit."],
  ["/about.html", "Good systems should give something back."],
  ["/privacy.html", "A short privacy note."],
  ["/guides/before-you-automate.html", "Before you automate, make the task smaller."],
  ["/guides/ai-output-you-can-check.html", "Ask AI for an answer you can check."],
  ["/guides/starting-smaller.html", "When the side project becomes the work."],
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

// Do not cache-bust these requests: retained legacy assets can return 200 only
// at their original URL, while a query-string URL correctly returns 404.
const retiredAssets = [
  "/nbis.json", "/screener.json", "/dc-movers.json", "/health.json",
  "/settings.json", "/ads.txt", "/watchlist-board.mjs",
  "/downloads/ai-infrastructure-research-kit.md",
  "/downloads/stockswatch-research-workflow-pack.zip",
];
for (const path of retiredAssets) {
  const response = await fetch(`${site}${path}`, {
    signal: AbortSignal.timeout(15000),
  });
  if (response.status !== 404) {
    throw new Error(`Retired asset still available: ${path} (HTTP ${response.status})`);
  }
  await response.body?.cancel();
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
console.log(`Personal site verified: ${pages.length} pages, ${retiredAssets.length} retired assets and build revision ${meta.gitSha}.`);
