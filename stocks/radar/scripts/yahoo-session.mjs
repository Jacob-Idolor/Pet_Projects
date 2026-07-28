/**
 * Shared Yahoo Finance session (cookie + crumb) for quoteSummary modules.
 * Chart endpoints often work without crumb; valuation modules need it.
 */
const UA =
  "Mozilla/5.0 (compatible; stocks-radar/1.2; +https://github.com/Jacob-Idolor/Pet_Projects)";

let cached = null;

async function collectCookies(res, jar) {
  const setCookie = res.headers.getSetCookie?.() || [];
  for (const c of setCookie) {
    const [pair] = c.split(";");
    const eq = pair.indexOf("=");
    if (eq > 0) jar.set(pair.slice(0, eq).trim(), pair.slice(eq + 1).trim());
  }
  const single = res.headers.get("set-cookie");
  if (single && !setCookie.length) {
    for (const part of single.split(/,(?=\s*[^;]+=)/)) {
      const [pair] = part.split(";");
      const eq = pair.indexOf("=");
      if (eq > 0) jar.set(pair.trim().slice(0, eq), pair.trim().slice(eq + 1));
    }
  }
}

export async function getYahooSession({ force = false } = {}) {
  if (!force && cached?.crumb && cached.expiresAt > Date.now()) return cached;

  const jar = new Map();
  const boot = await fetch("https://fc.yahoo.com", {
    headers: { "User-Agent": UA, Accept: "*/*" },
    redirect: "manual",
  });
  await collectCookies(boot, jar);

  const cookie = [...jar.entries()].map(([k, v]) => `${k}=${v}`).join("; ");
  const hosts = ["query1.finance.yahoo.com", "query2.finance.yahoo.com"];
  let lastErr = null;

  for (const host of hosts) {
    for (let attempt = 0; attempt < 3; attempt++) {
      try {
        const crumbRes = await fetch(`https://${host}/v1/test/getcrumb`, {
          headers: { "User-Agent": UA, Accept: "text/plain", Cookie: cookie },
        });
        if (crumbRes.status === 429) {
          lastErr = new Error(`Yahoo crumb HTTP 429`);
          await new Promise((r) => setTimeout(r, 800 * (attempt + 1)));
          continue;
        }
        if (!crumbRes.ok) {
          lastErr = new Error(`Yahoo crumb HTTP ${crumbRes.status}`);
          break;
        }
        const crumb = (await crumbRes.text()).trim();
        if (!crumb || crumb.includes("<")) {
          lastErr = new Error("Yahoo crumb unavailable");
          break;
        }
        cached = {
          crumb,
          cookie,
          host,
          headers: {
            "User-Agent": UA,
            Accept: "application/json",
            Cookie: cookie,
          },
          expiresAt: Date.now() + 45 * 60 * 1000,
        };
        return cached;
      } catch (e) {
        lastErr = e;
        await new Promise((r) => setTimeout(r, 500 * (attempt + 1)));
      }
    }
  }

  throw lastErr || new Error("Yahoo crumb unavailable");
}

export function yahooHeaders(session) {
  return session?.headers || { "User-Agent": UA, Accept: "application/json" };
}

export function yahooQuoteSummaryUrl(symbol, modules, session) {
  const host = session?.host || "query1.finance.yahoo.com";
  const mods = Array.isArray(modules) ? modules.join(",") : modules;
  return (
    `https://${host}/v10/finance/quoteSummary/${encodeURIComponent(symbol)}` +
    `?modules=${encodeURIComponent(mods)}&crumb=${encodeURIComponent(session.crumb)}`
  );
}

export function rawNum(node) {
  if (node == null) return null;
  if (typeof node === "number") return Number.isFinite(node) ? node : null;
  if (typeof node === "object" && node.raw != null) {
    const n = Number(node.raw);
    return Number.isFinite(n) ? n : null;
  }
  return null;
}
