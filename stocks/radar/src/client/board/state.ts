import { escapeHtml, sanitizePriority } from "../../lib/format";
import {
  type QuoteData,
  type QuoteMap,
  type OutlookStock,
  actionBias,
  matchesTechnicalFilter,
} from "../../lib/market-display";
import type { StockRow, Prefs } from "./types";

export type { StockRow, Prefs };
export type { QuoteData, QuoteMap, OutlookStock };

export const CUSTOM_STORE = "stocks-radar-custom";
export const CUSTOM_KEY = "entries";
export const PREFS_KEY = "stocks-radar-prefs";

export const CAT_LABEL: Record<string, string> = {
  tracking: "Tracking",
  owned: "Owned",
  targets: "Targets",
  watching: "Watching",
};

export const state = {
  baseStocks: [] as StockRow[],
  allStocks: [] as StockRow[],
  quotes: {} as QuoteMap,
  outlookBySymbol: {} as Record<string, OutlookStock>,
  filter: "all",
  tagFilter: null as string | null,
  search: "",
  sortKey: "symbol",
  sortDir: 1,
  viewMode: "table" as "table" | "technical",
  page: 1,
  pageSize: 50,
  expandedId: null as string | null,
};

export function radarSettings() {
  return (
    (typeof window !== "undefined" &&
      (window as unknown as {
        __RADAR_SETTINGS__?: {
          board?: { defaultPageSize?: number; defaultSort?: string; defaultView?: string };
          quotes?: { pollIntervalMs?: number; browserFallback?: boolean };
        };
      }).__RADAR_SETTINGS__) ||
    {}
  );
}

export function loadPrefs(): Prefs {
  try {
    return JSON.parse(localStorage.getItem(PREFS_KEY) ?? "{}");
  } catch {
    return {};
  }
}

export function savePrefs() {
  localStorage.setItem(
    PREFS_KEY,
    JSON.stringify({
      viewMode: state.viewMode,
      pageSize: state.pageSize,
      sortKey: state.sortKey,
      filter: state.filter,
    })
  );
}

export function openCustomDb(): Promise<IDBDatabase> {
  return new Promise((resolve, reject) => {
    const req = indexedDB.open(CUSTOM_STORE, 1);
    req.onupgradeneeded = () => {
      if (!req.result.objectStoreNames.contains("kv")) {
        req.result.createObjectStore("kv");
      }
    };
    req.onsuccess = () => resolve(req.result);
    req.onerror = () => reject(req.error);
  });
}

export async function getCustomStocks(): Promise<StockRow[]> {
  try {
    const db = await openCustomDb();
    return new Promise((resolve, reject) => {
      const tx = db.transaction("kv", "readonly");
      const req = tx.objectStore("kv").get(CUSTOM_KEY);
      req.onsuccess = () => resolve((req.result as StockRow[]) ?? []);
      req.onerror = () => reject(req.error);
    });
  } catch {
    return [];
  }
}

export async function setCustomStocks(entries: StockRow[]) {
  const db = await openCustomDb();
  return new Promise<void>((resolve, reject) => {
    const tx = db.transaction("kv", "readwrite");
    tx.objectStore("kv").put(entries, CUSTOM_KEY);
    tx.oncomplete = () => resolve();
    tx.onerror = () => reject(tx.error);
  });
}

export function mergeStocks(base: StockRow[], custom: StockRow[]) {
  const map = new Map<string, StockRow>();
  for (const s of base) map.set(s.symbol, s);
  for (const s of custom) map.set(s.symbol, s);
  return [...map.values()];
}

export async function savePriceTarget(
  symbol: string,
  targetPrice: number,
  opts?: { note?: string; addedBy?: string; name?: string }
) {
  const sym = symbol.toUpperCase().replace(/^\$/, "");
  if (!sym || !targetPrice || targetPrice <= 0) return false;

  const existing = state.allStocks.find((s) => s.symbol === sym);
  const q = state.quotes[sym];
  const stock: StockRow = {
    id: `custom-${sym.toLowerCase()}`,
    symbol: sym,
    name: opts?.name ?? q?.name ?? existing?.name ?? sym,
    category: "tracking",
    targetPrice,
    custom: true,
    sector: existing?.sector,
    tags: existing?.tags,
    priority: existing?.priority ?? "medium",
  };
  if (opts?.note) {
    stock.thesis = opts.note;
    stock.targetNote = opts.note;
  } else if (existing?.thesis) {
    stock.thesis = existing.thesis;
    stock.targetNote = existing.targetNote;
  }
  if (opts?.addedBy) stock.addedBy = opts.addedBy;
  else if (existing?.addedBy) stock.addedBy = existing.addedBy;

  const custom = await getCustomStocks();
  const merged = mergeStocks(custom, [stock]);
  await setCustomStocks(merged);
  state.allStocks = mergeStocks(state.baseStocks, merged);
  return true;
}

export function asFiniteNumber(v: unknown): number | null {
  if (v == null || v === "") return null;
  const n = typeof v === "number" ? v : Number(v);
  return Number.isFinite(n) ? n : null;
}

export function getQuote(stock: StockRow): QuoteData | undefined {
  return state.quotes[stock.symbol];
}

export function getPrice(stock: StockRow) {
  return asFiniteNumber(state.quotes[stock.symbol]?.price) ?? asFiniteNumber(stock.lastPrice);
}

export function getChange(stock: StockRow) {
  const q = state.quotes[stock.symbol];
  const fromQuote = asFiniteNumber(q?.changePct);
  if (fromQuote != null) return fromQuote;
  const price = getPrice(stock);
  const prev = asFiniteNumber(q?.prevClose);
  if (price != null && prev != null && prev !== 0) {
    return ((price - prev) / prev) * 100;
  }
  return null;
}

export function getDistance(stock: StockRow) {
  const price = getPrice(stock);
  if (price == null || stock.targetPrice == null || stock.targetPrice === 0) return null;
  return ((price - stock.targetPrice) / stock.targetPrice) * 100;
}

export function distanceLabel(pct: number | null) {
  if (pct == null) return { text: "—", cls: "" };
  const abs = Math.abs(pct);
  if (abs < 0.5) return { text: "At target", cls: "at" };
  if (pct > 0) return { text: `+${abs.toFixed(1)}%`, cls: "above" };
  return { text: `-${abs.toFixed(1)}%`, cls: "below" };
}

export function distanceBar(pct: number | null) {
  if (pct == null) return "";
  const width = Math.min(100, Math.abs(pct));
  const cls = Math.abs(pct) < 0.5 ? "at" : pct > 0 ? "above" : "below";
  return `<div class="dist-bar" title="${escapeHtml(distanceLabel(pct).text)}"><div class="dist-bar-fill ${cls}" style="width:${width}%"></div></div>`;
}

export function matchesFilter(stock: StockRow) {
  const dist = getDistance(stock);
  if (state.tagFilter && !(stock.tags ?? []).includes(state.tagFilter)) return false;
  switch (state.filter) {
    case "has-target":
      return stock.targetPrice != null;
    case "at-target":
      return dist != null && Math.abs(dist) < 0.5;
    case "high-priority":
      return stock.priority === "high";
    case "lean-buy":
      return stockBias(stock).cls === "buy";
    case "lean-sell":
      return stockBias(stock).cls === "sell";
    default:
      if (state.filter.startsWith("tech-")) {
        return matchesTechnicalFilter(state.filter, getQuote(stock), getPrice(stock));
      }
      return true;
  }
}

export function matchesSearch(stock: StockRow) {
  if (!state.search) return true;
  const q = state.search.toLowerCase();
  return (
    stock.symbol.toLowerCase().includes(q) ||
    (stock.name ?? "").toLowerCase().includes(q) ||
    (stock.thesis ?? "").toLowerCase().includes(q) ||
    (stock.targetNote ?? "").toLowerCase().includes(q) ||
    (stock.sector ?? "").toLowerCase().includes(q) ||
    (stock.tags ?? []).some((t) => t.toLowerCase().includes(q))
  );
}

export function sortStocks(list: StockRow[]) {
  const sorted = [...list];
  sorted.sort((a, b) => {
    let av: string | number;
    let bv: string | number;
    switch (state.sortKey) {
      case "symbol":
        return state.sortDir * a.symbol.localeCompare(b.symbol);
      case "name":
        return state.sortDir * (a.name ?? "").localeCompare(b.name ?? "");
      case "category":
        return state.sortDir * a.category.localeCompare(b.category);
      case "sector":
        return state.sortDir * (a.sector ?? "").localeCompare(b.sector ?? "");
      case "price":
        av = getPrice(a) ?? -Infinity;
        bv = getPrice(b) ?? -Infinity;
        return state.sortDir * ((av as number) - (bv as number));
      case "target":
        av = a.targetPrice ?? -Infinity;
        bv = b.targetPrice ?? -Infinity;
        return state.sortDir * ((av as number) - (bv as number));
      case "distance": {
        const da = getDistance(a);
        const db = getDistance(b);
        if (da == null && db == null) return a.symbol.localeCompare(b.symbol);
        if (da == null) return 1;
        if (db == null) return -1;
        return state.sortDir * (Math.abs(da) - Math.abs(db));
      }
      case "priority": {
        const order: Record<string, number> = { high: 0, medium: 1, low: 2 };
        av = order[a.priority ?? ""] ?? 3;
        bv = order[b.priority ?? ""] ?? 3;
        return state.sortDir * ((av as number) - (bv as number));
      }
      case "by":
        return state.sortDir * (a.holder ?? a.addedBy ?? "").localeCompare(b.holder ?? b.addedBy ?? "");
      case "vs50":
        av = getQuote(a)?.vsSma?.[50] ?? -Infinity;
        bv = getQuote(b)?.vsSma?.[50] ?? -Infinity;
        return state.sortDir * ((av as number) - (bv as number));
      case "vs20":
        av = getQuote(a)?.vsSma?.[20] ?? -Infinity;
        bv = getQuote(b)?.vsSma?.[20] ?? -Infinity;
        return state.sortDir * ((av as number) - (bv as number));
      case "vs200":
        av = getQuote(a)?.vsSma?.[200] ?? -Infinity;
        bv = getQuote(b)?.vsSma?.[200] ?? -Infinity;
        return state.sortDir * ((av as number) - (bv as number));
      case "range52":
        av = getQuote(a)?.range52Pct ?? -Infinity;
        bv = getQuote(b)?.range52Pct ?? -Infinity;
        return state.sortDir * ((av as number) - (bv as number));
      case "ath":
        av = getQuote(a)?.pctFromAth ?? -Infinity;
        bv = getQuote(b)?.pctFromAth ?? -Infinity;
        return state.sortDir * ((av as number) - (bv as number));
      case "rsi":
        av = getQuote(a)?.rsi14 ?? -Infinity;
        bv = getQuote(b)?.rsi14 ?? -Infinity;
        return state.sortDir * ((av as number) - (bv as number));
      case "trend": {
        const order: Record<string, number> = { bullish: 0, mixed: 1, bearish: 2, unknown: 3 };
        av = order[getQuote(a)?.trend ?? "unknown"] ?? 4;
        bv = order[getQuote(b)?.trend ?? "unknown"] ?? 4;
        return state.sortDir * ((av as number) - (bv as number));
      }
      case "action": {
        const order: Record<string, number> = { buy: 0, watch: 1, sell: 2, idle: 3 };
        av = order[stockBias(a).cls] ?? 4;
        bv = order[stockBias(b).cls] ?? 4;
        return state.sortDir * ((av as number) - (bv as number));
      }
      default:
        return 0;
    }
  });
  return sorted;
}

export function filteredStocks() {
  return sortStocks(state.allStocks.filter((s) => matchesFilter(s) && matchesSearch(s)));
}

export function outlookFor(stock: StockRow): OutlookStock | undefined {
  const sym = stock.symbol?.toUpperCase();
  const fetched = sym ? state.outlookBySymbol[sym] : undefined;
  const human = stock.valuation || {};
  const fundamentals = {
    ...(fetched?.fundamentals || {}),
    bias: human.bias || fetched?.fundamentals?.bias || null,
    note: human.note || fetched?.fundamentals?.note || null,
    catalyst: stock.catalyst || fetched?.fundamentals?.catalyst || null,
  };
  return {
    symbol: sym,
    fundamentals,
    news: fetched?.news || [],
    newsCheck: fetched?.newsCheck || null,
  };
}

export function biasOpts(stock: StockRow) {
  return { newsCheck: outlookFor(stock)?.newsCheck };
}

export function stockBias(stock: StockRow) {
  return actionBias(getQuote(stock), biasOpts(stock));
}

export function renderTagsHtml(stock: StockRow) {
  if (!stock.tags?.length) return `<span class="dim">—</span>`;
  return stock.tags
    .map((t) => `<span class="tag-pill">${escapeHtml(t)}</span>`)
    .join("");
}

export function dcBridgeEntry(symbol: string | undefined) {
  const map = typeof window !== "undefined" ? window.__DC_BRIDGE__?.byTicker : undefined;
  if (!map || !symbol) return undefined;
  return map[String(symbol).trim().toUpperCase()];
}

export function radarBaseHref() {
  const el = document.getElementById("watchlist-board");
  let base = el?.getAttribute("data-radar-base") || "/";
  if (!base.endsWith("/")) base += "/";
  return base;
}

/** Compact layer chip linking into AI Data Center (overlap tickers only). */
export function renderDcLayerBadge(stock: StockRow) {
  const entry = dcBridgeEntry(stock.symbol);
  if (!entry) return "";
  const primary = entry.primary;
  const more = entry.layers.length > 1 ? ` +${entry.layers.length - 1}` : "";
  const exp = primary.exposure ? ` · ${primary.exposure}` : "";
  const href = `${radarBaseHref()}?q=${encodeURIComponent(entry.ticker)}&layer=${encodeURIComponent(primary.id)}`;
  return `<a class="dc-badge dc-badge--${escapeHtml(primary.id)}" href="${href}" title="${escapeHtml(primary.name)}${escapeHtml(exp)}">DC · ${escapeHtml(primary.label)}${more}</a>`;
}

export function renderDcDetail(stock: StockRow) {
  const entry = dcBridgeEntry(stock.symbol);
  if (!entry) return "";
  const layers = entry.layers
    .map((l) => {
      const href = `${radarBaseHref()}?layer=${encodeURIComponent(l.id)}&q=${encodeURIComponent(entry.ticker)}`;
      const exp = l.exposure ? ` (${escapeHtml(l.exposure)})` : "";
      return `<a class="dc-badge dc-badge--${escapeHtml(l.id)}" href="${href}">${escapeHtml(l.label)}${exp}</a>`;
    })
    .join(" ");
  return `<div class="dc-detail">
      <strong>AI Data Center:</strong> ${layers}
      <a class="dc-detail__link" href="${radarBaseHref()}?q=${encodeURIComponent(entry.ticker)}">Open in screener →</a>
    </div>`;
}

export function renderPriority(stock: StockRow) {
  if (!stock.priority) return "—";
  const p = sanitizePriority(stock.priority);
  return `<span class="priority priority-${p}">${escapeHtml(p)}</span>`;
}

