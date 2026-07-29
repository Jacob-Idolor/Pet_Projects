import { type QuoteData, type OutlookStock } from "../../lib/market-display";
import { isUsMarketOpen } from "../../lib/day-mood";
import { state, radarSettings } from "./state";

export { isUsMarketOpen };

export async function loadOutlook() {
  const base = document.querySelector<HTMLElement>("[data-radar-base]")?.dataset.radarBase ?? "/";

  function apply(data: { stocks?: Record<string, OutlookStock> } | null | undefined) {
    const stocks = data?.stocks;
    if (!stocks || typeof stocks !== "object") return false;
    state.outlookBySymbol = stocks;
    return true;
  }

  const cached = (window as Window & { __OUTLOOK__?: { stocks?: Record<string, OutlookStock> } })
    .__OUTLOOK__;
  if (apply(cached)) return true;

  const shared = await new Promise<{ stocks?: Record<string, OutlookStock> } | null>((resolve) => {
    const timer = window.setTimeout(() => {
      document.removeEventListener("radar:outlook", onOutlook);
      resolve(
        (window as Window & { __OUTLOOK__?: { stocks?: Record<string, OutlookStock> } }).__OUTLOOK__ ||
          null
      );
    }, 1200);
    function onOutlook(ev: Event) {
      window.clearTimeout(timer);
      resolve((ev as CustomEvent).detail || null);
    }
    document.addEventListener("radar:outlook", onOutlook, { once: true });
  });
  if (apply(shared)) return true;

  try {
    const res = await fetch(`${base}outlook.json`);
    if (!res.ok) return false;
    const data = await res.json();
    (window as Window & { __OUTLOOK__?: unknown }).__OUTLOOK__ = data;
    return apply(data);
  } catch {
    return false;
  }
}

export async function fetchOneQuote(symbol: string, attempt = 0): Promise<QuoteData | null> {
  try {
    const res = await fetch(
      `https://query1.finance.yahoo.com/v8/finance/chart/${encodeURIComponent(symbol)}?interval=1d&range=1d`,
      { headers: { Accept: "application/json" } }
    );
    if (res.status === 429 && attempt < 2) {
      await new Promise((r) => setTimeout(r, 400 * 2 ** attempt));
      return fetchOneQuote(symbol, attempt + 1);
    }
    if (!res.ok) return null;
    const data = await res.json();
    const m = data?.chart?.result?.[0]?.meta;
    if (!m?.regularMarketPrice) return null;
    return {
      price: m.regularMarketPrice,
      changePct: m.regularMarketChangePercent ?? null,
      prevClose: m.chartPreviousClose ?? null,
    };
  } catch {
    if (attempt < 1) {
      await new Promise((r) => setTimeout(r, 300));
      return fetchOneQuote(symbol, attempt + 1);
    }
    return null;
  }
}

export async function fetchQuotesBatched(symbols: string[]) {
  const unique = [...new Set(symbols)];
  if (!unique.length) return;
  const out: Record<string, QuoteData> = {};
  for (let i = 0; i < unique.length; i += 8) {
    const chunk = unique.slice(i, i + 8);
    const results = await Promise.all(
      chunk.map(async (s) => {
        const q = await fetchOneQuote(s);
        return q ? ([s, q] as const) : null;
      })
    );
    for (const row of results) if (row) out[row[0]] = row[1];
    if (i + 8 < unique.length) await new Promise((r) => setTimeout(r, 300));
  }
  if (Object.keys(out).length) {
    document.dispatchEvent(new CustomEvent("radar:quotes", { detail: out }));
  }
}

export function startQuoteLoader() {
  const base = document.querySelector<HTMLElement>("[data-radar-base]")?.dataset.radarBase ?? "/";
  let lastJsonOk = false;
  let browserFallbackInFlight = false;

  async function loadFromJson() {
    try {
      const res = await fetch(`${base}quotes.json`);
      if (!res.ok) throw new Error("no quotes file");
      const data = await res.json();
      if (data.quotes && Object.keys(data.quotes).length) {
        document.dispatchEvent(new CustomEvent("radar:quotes", { detail: data.quotes }));
        lastJsonOk = true;
        return true;
      }
      lastJsonOk = false;
    } catch {
      lastJsonOk = false;
    }
    return false;
  }

  async function maybeBrowserFallback(force = false) {
    if (browserFallbackInFlight) return;
    if (radarSettings().quotes?.browserFallback === false) return;
    if (!force && !isUsMarketOpen()) return;
    browserFallbackInFlight = true;
    try {
      await fetchQuotesBatched([...new Set(state.allStocks.map((s) => s.symbol))]);
    } finally {
      browserFallbackInFlight = false;
    }
  }

  // LiveStatus owns fetch+poll on the home page (dispatches radar:quotes). Avoid double GETs.
  const liveStatusOwnsPoll = Boolean(document.querySelector("[data-live-status]"));

  if (liveStatusOwnsPoll) {
    // Wait briefly for LiveStatus's first dispatch; only fetch if it never arrives.
    const waitMs = 2500;
    const onQuotes = () => {
      lastJsonOk = true;
      window.clearTimeout(fallbackTimer);
      document.removeEventListener("radar:quotes", onQuotes);
    };
    const fallbackTimer = window.setTimeout(() => {
      document.removeEventListener("radar:quotes", onQuotes);
      loadFromJson().then((ok) => {
        if (!ok) maybeBrowserFallback(true);
      });
    }, waitMs);
    document.addEventListener("radar:quotes", onQuotes);
  } else {
    loadFromJson().then((ok) => {
      if (!ok) maybeBrowserFallback(true);
    });
    setInterval(() => {
      if (document.hidden) return;
      loadFromJson().then((ok) => {
        if (!ok && lastJsonOk === false) maybeBrowserFallback();
      });
    }, radarSettings().quotes?.pollIntervalMs ?? 300_000);
  }

  document.addEventListener("radar:stale-quotes", () => {
    maybeBrowserFallback(true);
  });
}
