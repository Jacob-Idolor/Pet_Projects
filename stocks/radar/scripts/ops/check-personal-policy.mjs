/** Enforce the no-ads/no-signup policy and retirement indexing of Jacob Builds. */
import { existsSync, readFileSync, readdirSync } from "node:fs";
import { resolve, relative } from "node:path";
import { fileURLToPath } from "node:url";

const retirementPages = [
  "404.html", "datacenter.html", "research-kit.html", "workflow-pack.html",
  "guides/nbis-research-guide.html", "guides/nbis-sec-filings.html",
];

export function checkPersonalPolicy(dist) {
  if (!existsSync(dist)) return ["Missing distribution; build the site first"];
  const findings = [];
  function inspect(directory) {
    for (const entry of readdirSync(directory, { withFileTypes: true })) {
      const path = resolve(directory, entry.name);
      if (entry.isDirectory()) inspect(path);
      else if (entry.name.endsWith(".html")) {
        const html = readFileSync(path, "utf8");
        const file = relative(dist, path);
        if (/pagead2\.googlesyndication\.com|adsbygoogle|google-analytics\.com|googletagmanager\.com/i.test(html)) {
          findings.push(`${file}: advertising or analytics integration`);
        }
        if (/<(?:form|iframe)\b/i.test(html)) findings.push(`${file}: form or iframe`);
        if (/<script\b[^>]*\bsrc\s*=\s*["'](?:https?:)?\/\//i.test(html)) {
          findings.push(`${file}: third-party script`);
        }
      }
    }
  }
  inspect(dist);
  for (const file of retirementPages) {
    const path = resolve(dist, file);
    if (!existsSync(path)) findings.push(`${file}: missing retirement/error page`);
    else if (!/<meta\b[^>]*name=["']robots["'][^>]*content=["'][^"']*\bnoindex\b/i.test(readFileSync(path, "utf8"))) {
      findings.push(`${file}: must be noindex`);
    }
  }
  return findings;
}

if (process.argv[1] && resolve(process.argv[1]) === fileURLToPath(import.meta.url)) {
  const dist = fileURLToPath(new URL("../../dist/", import.meta.url));
  const findings = checkPersonalPolicy(dist);
  if (findings.length) {
    for (const finding of findings) console.error(finding);
    process.exitCode = 1;
  } else console.log("Static publishing policy verified: no ads, analytics, forms, iframes or third-party scripts; retired/error pages are noindex.");
}
