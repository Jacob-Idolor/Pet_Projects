import assert from "node:assert/strict";
import { spawn } from "node:child_process";
import { createServer } from "node:http";
import { fileURLToPath } from "node:url";
import { test } from "node:test";

const checker = fileURLToPath(new URL("../scripts/ops/check-personal-live.mjs", import.meta.url));
const pages = {
  "/": "Make room for life.",
  "/guides": "Before you automate",
  "/resources": "A small toolkit.",
  "/consulting": "Monitoring &amp; Alert Health Check",
  "/about": "Good systems should give something back.",
  "/privacy": "A short privacy note.",
  "/guides/before-you-automate": "Before you automate, make the task smaller.",
  "/guides/ai-output-you-can-check": "Ask AI for an answer you can check.",
  "/guides/starting-smaller": "When the side project becomes the work.",
};

async function runCheck({ missingPage, fallbackPage, metadata, injectedScript, retainedAsset, redirectAsset, injected404, brokenRobots, brokenSitemap, missingSitemapPage, redirectSitemap, robotsBody, sitemapTransform } = {}) {
  const requests = [];
  const server = createServer((request, response) => {
    const path = new URL(request.url, "http://localhost").pathname;
    requests.push(path);
    if (path === "/robots.txt") {
      response.end(robotsBody ? robotsBody(`http://127.0.0.1:${server.address().port}`) : brokenRobots ? "User-agent: *\nDisallow: /\n" : `User-agent: *\nAllow: /\nSitemap: http://127.0.0.1:${server.address().port}/sitemap.xml\n`);
    } else if (path === "/sitemap.xml") {
      if (redirectSitemap) return response.writeHead(302, { Location: "/" }).end();
      const urls = Object.keys(pages).filter(path => path !== missingSitemapPage).map(path => `<url><loc>http://127.0.0.1:${server.address().port}${path}</loc></url>`).join("");
      const xml = `<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">${urls}</urlset>`;
      response.end(sitemapTransform ? sitemapTransform(xml) : brokenSitemap ? "<html>Homepage fallback</html>" : xml);
    } else if (path === retainedAsset && !new URL(request.url, "http://localhost").search) {
      response.end("Retained legacy asset");
    } else if (path === redirectAsset) {
      response.writeHead(302, { Location: "/retired-files/missing" }).end();
    } else if (path === missingPage) {
      response.writeHead(404).end("Missing page");
    } else if (path === "/build-meta.json") {
      response.setHeader("Content-Type", "application/json");
      response.end(JSON.stringify(metadata === undefined
        ? { gitSha: "expected-revision", builtAt: "2026-10-06T00:00:00Z" }
        : metadata));
    } else if (pages[path]) {
      const text = path === fallbackPage ? pages["/"] : pages[path];
      const script = injectedScript && path === "/" ? '<script src="https://static.cloudflareinsights.com/beacon.min.js"></script>' : "";
      response.end(`<html><title>Jacob Builds</title><h1>${text}</h1>${script}</html>`);
    } else {
      response.writeHead(404).end(injected404 ? '<html><script src="https://static.cloudflareinsights.com/beacon.min.js"></script></html>' : "Not found");
    }
  });
  await new Promise(resolve => server.listen(0, "127.0.0.1", resolve));
  try {
    const child = spawn(process.execPath, [checker, `http://127.0.0.1:${server.address().port}`], {
      env: { ...process.env, EXPECTED_GIT_SHA: "expected-revision" },
      stdio: ["ignore", "pipe", "pipe"],
    });
    let output = "";
    child.stdout.on("data", chunk => { output += chunk; });
    child.stderr.on("data", chunk => { output += chunk; });
    const status = await new Promise((resolve, reject) => {
      child.once("error", reject);
      child.once("close", resolve);
    });
    return { status, output, requests };
  } finally {
    await new Promise(resolve => server.close(resolve));
  }
}

test("live check verifies the complete static reader journey and revision", async () => {
  const result = await runCheck();
  assert.equal(result.status, 0, result.output);
  assert.match(result.output, /9 pages/);
  assert.ok(result.requests.includes("/consulting"));
  assert.ok(result.requests.includes("/guides/starting-smaller"));
  for (const path of ["/nbis.json", "/downloads/research-workflow-sample.md", "/datacenter/app.js", "/datacenter/map.js", "/datacenter/style.css"]) assert.ok(result.requests.includes(path), path);
});

test("live check rejects an edge-injected analytics script", async () => {
  const result = await runCheck({ injectedScript: true });
  assert.notEqual(result.status, 0);
  assert.match(result.output, /Unexpected script or interactive embed/);
});

test("live check rejects retained assets without masking them with query strings", async () => {
  for (const retainedAsset of ["/nbis.json", "/downloads/research-workflow-sample.md", "/datacenter/app.js"]) {
    const result = await runCheck({ retainedAsset });
    assert.notEqual(result.status, 0);
    assert.ok(result.output.includes(`Retired asset still available: ${retainedAsset} (HTTP 200)`));
  }
});

test("live check follows a retired-asset redirect to a missing route", async () => {
  const result = await runCheck({ redirectAsset: "/nbis.json" });
  assert.equal(result.status, 0, result.output);
  assert.ok(result.requests.includes("/retired-files/missing"));
});

test("live check rejects a partial release with a missing guide", async () => {
  const result = await runCheck({ missingPage: "/guides/ai-output-you-can-check" });
  assert.notEqual(result.status, 0);
  assert.match(result.output, /Page unavailable.*ai-output-you-can-check/);
});

test("live check rejects a partial release with a missing consulting page", async () => {
  const result = await runCheck({ missingPage: "/consulting" });
  assert.notEqual(result.status, 0);
  assert.match(result.output, /Page unavailable.*consulting/);
});

test("live check rejects a homepage fallback served as a guide", async () => {
  const result = await runCheck({ fallbackPage: "/guides/starting-smaller" });
  assert.notEqual(result.status, 0);
  assert.match(result.output, /Unexpected page content.*starting-smaller/);
});

test("live check rejects a stale deployed revision", async () => {
  const result = await runCheck({ metadata: { gitSha: "previous-revision", builtAt: "2026-10-06T00:00:00Z" } });
  assert.notEqual(result.status, 0);
  assert.match(result.output, /Deployed revision does not match/);
});

test("live check rejects malformed build metadata", async () => {
  for (const metadata of [null, {}, { gitSha: "expected-revision", builtAt: "invalid" }]) {
    const result = await runCheck({ metadata });
    assert.notEqual(result.status, 0);
    assert.match(result.output, /Build metadata is invalid/);
  }
});

test("live check rejects an injected script on a final 404 response", async () => {
  const result = await runCheck({ injected404: true });
  assert.notEqual(result.status, 0);
  assert.match(result.output, /Unexpected script or interactive embed on retired response/);
});

test("live check rejects robots that block indexing", async () => {
  const result = await runCheck({ brokenRobots: true });
  assert.notEqual(result.status, 0);
  assert.match(result.output, /Unexpected robots directives/);
});

test("live check rejects a sitemap homepage fallback", async () => {
  const result = await runCheck({ brokenSitemap: true });
  assert.notEqual(result.status, 0);
  assert.match(result.output, /Sitemap is not a sitemap XML document/);
});

test("live check rejects a sitemap missing an active route", async () => {
  const result = await runCheck({ missingSitemapPage: "/consulting" });
  assert.notEqual(result.status, 0);
  assert.match(result.output, /Sitemap does not match the active reader routes/);
});

test("live check rejects a redirect at the submitted sitemap URL", async () => {
  const result = await runCheck({ redirectSitemap: true });
  assert.notEqual(result.status, 0);
  assert.match(result.output, /Sitemap unavailable \(HTTP 302\)/);
});

for (const [name, directives] of [
  ["narrow guide prefix", "User-agent: *\nAllow: /\nDisallow: /guides"],
  ["wildcard blocks reader routes", "User-agent: *\nDisallow: /*"],
  ["anchored wildcard", "User-agent: *\nAllow: /\nDisallow: /*smaller$"],
  ["percent-encoded guide prefix", "User-agent: *\nAllow: /\nDisallow: /%67uides"],
  ["Googlebot-specific block", "User-agent: *\nAllow: /\nUser-agent: Googlebot\nDisallow: /consulting"],
  ["merged Googlebot groups", "User-agent: *\nAllow: /\nUser-agent: Googlebot\nAllow: /\nUser-agent: Googlebot\nDisallow: /guides"],
  ["Googlebot does not inherit wildcard Allow", "User-agent: *\nAllow: /guides\nUser-agent: Googlebot*\nDisallow: /guides"],
  ["Bingbot-specific block", "User-agent: *\nAllow: /\nUser-agent: Bingbot\nDisallow: /about"],
  ["consecutive agents share rules", "User-agent: *\nAllow: /\nUser-agent: Otherbot\nSitemap: https://example.com/other.xml\nUser-agent: Googlebot\nDisallow: /about"],
  ["sitemap is crawlable", "User-agent: *\nAllow: /\nDisallow: /sitemap.xml$"],
]) {
  test(`live check rejects robots: ${name}`, async () => {
    const result = await runCheck({ robotsBody: site => `${directives}\nSitemap: ${site}/sitemap.xml\n` });
    assert.notEqual(result.status, 0, result.output);
    assert.match(result.output, /Unexpected robots directives/);
  });
}

for (const [name, directives] of [
  ["comments, case and empty restrictions", "\uFEFFuSeR-aGeNt: * # all\r\nDisallow:\r\nAllow: / # readers"],
  ["unrelated path restrictions", "User-agent: *\nDisallow: /private\nDisallow: /GUIDES"],
  ["specific allow beats broad block", "User-agent: *\nDisallow: /guides\nAllow: /guides$\nAllow: /guides/"],
  ["allow wins equal-length conflicts", "User-agent: *\nAllow: /guides\nDisallow: /guides\nAllow: /\nDisallow: /*"],
  ["wildcard does not combine with named group", "User-agent: *\nAllow: /guides\nDisallow: /guides\nUser-agent: Googlebot\nDisallow: /private"],
  ["nonmatching end anchor", "User-agent: *\nAllow: /\nDisallow: /guide$"],
  ["unrelated crawler restrictions", "User-agent: *\nAllow: /\nUser-agent: Otherbot\nDisallow: /"],
]) {
  test(`live check accepts robots: ${name}`, async () => {
    const result = await runCheck({ robotsBody: site => `${directives}\nSitemap: ${site}/sitemap.xml\n` });
    assert.equal(result.status, 0, result.output);
  });
}

for (const [name, transform] of [
  ["truncated after all locations", xml => xml.slice(0, -15)],
  ["locations outside url entries", xml => xml.replaceAll("<url>", "").replaceAll("</url>", "")],
  ["mismatched closing tag", xml => xml.replace("</url>", "</wrong>")],
  ["undeclared entity", xml => xml.replace("<loc>", "<loc>&unknown;")],
  ["duplicate root attribute", xml => xml.replace("<urlset ", '<urlset test="1" test="2" ')],
  ["wrong child namespace", xml => xml.replace("<url>", '<url xmlns="https://example.com/not-sitemap">')],
  ["multiple locations per entry", xml => xml.replace("</loc>", "</loc><loc>https://example.com/extra</loc>")],
  ["entry without location", xml => xml.replace("</urlset>", "<url><lastmod>2026-10-10</lastmod></url></urlset>")],
  ["extra root", xml => xml + '<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9"/>'],
  ["DTD", xml => '<!DOCTYPE urlset [<!ENTITY x "https://example.com/">]>' + xml],
]) {
  test(`live check rejects sitemap XML: ${name}`, async () => {
    const result = await runCheck({ sitemapTransform: transform });
    assert.notEqual(result.status, 0, result.output);
    assert.match(result.output, /Sitemap is not a sitemap XML document/);
  });
}

test("live check accepts complete namespace-prefixed XML with metadata, comments and decoded location text", async () => {
  const result = await runCheck({ sitemapTransform: xml => '<?xml version="1.0"?>\n<!-- generated -->' + xml
    .replace('xmlns=', 'xmlns:s=')
    .replace(/<(\/?)(urlset|url|loc)(?=[ >])/g, '<$1s:$2')
    .replaceAll('<s:loc>', '<s:loc> \n')
    .replaceAll('</s:loc>', '\n </s:loc><s:lastmod>2026-10-10</s:lastmod>')
    .replaceAll('http://', 'http:&#47;&#47;') });
  assert.equal(result.status, 0, result.output);
});
