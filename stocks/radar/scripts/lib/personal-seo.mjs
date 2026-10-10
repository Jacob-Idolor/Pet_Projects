import { SaxesParser } from "saxes";

const trimAscii = value => value.replace(/^[\t\n\v\f\r ]+|[\t\n\v\f\r ]+$/g, "");

// Site release policy: default crawlers, Googlebot and Bingbot must be able to
// crawl reader routes and discovery endpoints. Named groups replace '*'.
// Matching follows Google's documented prefix, wildcard, anchor and tie rules:
// https://developers.google.com/crawling/docs/robots-txt/robots-txt-spec
function normalizePath(path) {
  return encodeURI(path).replace(/%25([0-9a-f]{2})/gi, "%$1")
    .replace(/%([0-9a-f]{2})/gi, (match, hex) => {
      const character = String.fromCharCode(parseInt(hex, 16));
      return /[a-z0-9._~-]/i.test(character) ? character : match.toUpperCase();
    });
}

export function validateRobots(text, site, paths) {
  const groups = []; const sitemaps = []; let group;
  for (const raw of text.replace(/^\uFEFF/, "").split(/\r\n|\r|\n/)) {
    const line = trimAscii(raw.split("#", 1)[0]);
    const match = /^([a-z-]+)[\t\v\f ]*:[\t\v\f ]*(.*?)[\t\v\f ]*$/i.exec(line);
    if (!match) continue;
    const [, field, value] = match;
    const key = field.toLowerCase();
    if (key === "sitemap") sitemaps.push(value);
    if (key === "user-agent" && value) {
      if (!group || group.rules.length) { group = { agents: [], rules: [] }; groups.push(group); }
      group.agents.push(/^\*(?:[\t\v\f\r\n ]|$)/.test(value) ? "*" : value.match(/^[a-z_-]+/i)?.[0].toLowerCase());
    } else if ((key === "allow" || key === "disallow") && group) {
      // Empty rules still terminate the agent header of their group.
      group.rules.push({ allow: key === "allow", path: value });
    }
  }
  if (!groups.some(g => g.agents.includes("*")) || !sitemaps.includes(`${site}/sitemap.xml`)) {
    throw new Error("Unexpected robots directives or sitemap target");
  }
  for (const agent of ["*", "googlebot", "bingbot"]) {
    const specific = groups.filter(g => g.agents.includes(agent));
    const selected = specific.length ? specific : groups.filter(g => g.agents.includes("*"));
    const rules = selected.flatMap(g => g.rules);
    for (const path of paths) {
      let longest = -1; let allowed = true;
      for (const rule of rules) {
        if (!rule.path.startsWith("/")) continue;
        // Google's matcher ranks the original pattern, including trailing '*'.
        // https://github.com/google/robotstxt/blob/master/robots.cc#L642-L649
        const pattern = normalizePath(rule.path);
        const anchored = pattern.endsWith("$");
        const body = anchored ? pattern.slice(0, -1) : pattern;
        const expression = body.split("*").map(part => part.replace(/[.*+?^${}()|[\]\\]/g, "\\$&")).join(".*");
        if (!new RegExp(`^${expression}${anchored ? "$" : ""}`).test(normalizePath(path))) continue;
        const length = Buffer.byteLength(pattern);
        if (length > longest) { longest = length; allowed = rule.allow; }
        else if (length === longest && rule.allow) allowed = true;
      }
      if (!allowed) throw new Error(`Unexpected robots directives: ${agent} blocks ${path}`);
    }
  }
}

export function parseSitemap(text) {
  const namespace = "http://www.sitemaps.org/schemas/sitemap/0.9";
  const parser = new SaxesParser({ xmlns: true });
  const stack = []; const urls = []; let rootSeen = false; let locCount = 0; let loc = "";
  const invalid = () => { throw new Error("Sitemap is not a sitemap XML document: invalid urlset > url > loc structure"); };
  parser.on("error", error => { throw new Error(`Sitemap is not a sitemap XML document: ${error.message}`); });
  parser.on("doctype", invalid);
  parser.on("opentag", tag => {
    if (tag.uri !== namespace) invalid();
    const parent = stack.at(-1);
    if (!parent) {
      if (rootSeen || tag.local !== "urlset") invalid();
      rootSeen = true;
    } else if (parent === "urlset") {
      if (tag.local !== "url") invalid();
      locCount = 0;
    } else if (parent === "url") {
      if (!["loc", "lastmod", "changefreq", "priority"].includes(tag.local)) invalid();
      if (tag.local === "loc") { if (++locCount !== 1) invalid(); loc = ""; }
    } else invalid();
    stack.push(tag.local);
  });
  const content = value => {
    if (stack.at(-1) === "loc") loc += value;
    else if (["urlset", "url"].includes(stack.at(-1)) && value.trim()) invalid();
  };
  parser.on("text", content); parser.on("cdata", content);
  parser.on("closetag", tag => {
    if (tag.local === "loc") { if (!loc.trim()) invalid(); urls.push(loc.trim()); }
    if (tag.local === "url" && locCount !== 1) invalid();
    stack.pop();
  });
  parser.write(text).close();
  if (!rootSeen || stack.length) invalid();
  return urls;
}
