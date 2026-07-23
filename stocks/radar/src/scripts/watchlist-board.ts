import { escapeHtml, sanitizeId, sanitizePriority, sanitizeSymbol, yahooUrl } from "../lib/format";
import {
  type QuoteData,
  type QuoteMap,
  fmtPrice,
  trendBadge,
  maCell,
  rangeBar,
  renderMaStrip,
  renderTechnicalDetail,
  hasTechnical,
  matchesTechnicalFilter,
  rsiLabel,
  athIndicator,
  actionBadge,
  actionBias,
  pulseExplain,
} from "../lib/market-display";

export interface StockRow {
  id: string;
  symbol: string;
  name: string;
  category: string;
  lastPrice?: number;
  targetPrice?: number;
  targetNote?: string;
  thesis?: string;
  addedBy?: string;
  holder?: string;
  tags?: string[];
  priority?: string;
  sector?: string;
  custom?: boolean;
}

const CUSTOM_STORE = "stocks-radar-custom";
const CUSTOM_KEY = "entries";
const PREFS_KEY = "stocks-radar-prefs";

const CAT_LABEL: Record<string, string> = {
  tracking: "Tracking",
  owned: "Owned",
  targets: "Targets",
  watching: "Watching",
};

let baseStocks: StockRow[] = [];
let allStocks: StockRow[] = [];
let quotes: QuoteMap = {};
let filter = "all";
let tagFilter: string | null = null;
let search = "";
let sortKey = "symbol";
let sortDir = 1;
let viewMode: "table" | "technical" = "table";
let page = 1;
let pageSize = 50;
let expandedId: string | null = null;

function radarSettings() {
  return (
    (typeof window !== "undefined" &&
      (window as unknown as { __RADAR_SETTINGS__?: {
        board?: { defaultPageSize?: number; defaultSort?: string; defaultView?: string };
        quotes?: { pollIntervalMs?: number; browserFallback?: boolean };
      } }).__RADAR_SETTINGS__) ||
    {}
  );
}

interface Prefs {
  viewMode?: "table" | "technical";
  pageSize?: number;
  sortKey?: string;
  filter?: string;
}

function loadPrefs(): Prefs {
  try {
    return JSON.parse(localStorage.getItem(PREFS_KEY) ?? "{}");
  } catch {
    return {};
  }
}

function savePrefs() {
  localStorage.setItem(
    PREFS_KEY,
    JSON.stringify({ viewMode, pageSize, sortKey, filter })
  );
}

function openCustomDb(): Promise<IDBDatabase> {
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

async function getCustomStocks(): Promise<StockRow[]> {
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

async function setCustomStocks(entries: StockRow[]) {
  const db = await openCustomDb();
  return new Promise<void>((resolve, reject) => {
    const tx = db.transaction("kv", "readwrite");
    tx.objectStore("kv").put(entries, CUSTOM_KEY);
    tx.oncomplete = () => resolve();
    tx.onerror = () => reject(tx.error);
  });
}

function mergeStocks(base: StockRow[], custom: StockRow[]) {
  const map = new Map<string, StockRow>();
  for (const s of base) map.set(s.symbol, s);
  for (const s of custom) map.set(s.symbol, s);
  return [...map.values()];
}

async function savePriceTarget(
  symbol: string,
  targetPrice: number,
  opts?: { note?: string; addedBy?: string; name?: string }
) {
  const sym = symbol.toUpperCase().replace(/^\$/, "");
  if (!sym || !targetPrice || targetPrice <= 0) return false;

  const existing = allStocks.find((s) => s.symbol === sym);
  const q = quotes[sym];
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
  allStocks = mergeStocks(baseStocks, merged);
  return true;
}

function getQuote(stock: StockRow): QuoteData | undefined {
  return quotes[stock.symbol];
}

function getPrice(stock: StockRow) {
  return quotes[stock.symbol]?.price ?? stock.lastPrice ?? null;
}

function getChange(stock: StockRow) {
  const q = quotes[stock.symbol];
  if (q?.changePct != null) return q.changePct;
  const price = getPrice(stock);
  const prev = q?.prevClose;
  if (price != null && prev != null && prev !== 0) {
    return ((price - prev) / prev) * 100;
  }
  return null;
}

function getDistance(stock: StockRow) {
  const price = getPrice(stock);
  if (price == null || stock.targetPrice == null || stock.targetPrice === 0) return null;
  return ((price - stock.targetPrice) / stock.targetPrice) * 100;
}

function distanceLabel(pct: number | null) {
  if (pct == null) return { text: "—", cls: "" };
  const abs = Math.abs(pct);
  if (abs < 0.5) return { text: "At target", cls: "at" };
  if (pct > 0) return { text: `+${abs.toFixed(1)}%`, cls: "above" };
  return { text: `-${abs.toFixed(1)}%`, cls: "below" };
}

function distanceBar(pct: number | null) {
  if (pct == null) return "";
  const width = Math.min(100, Math.abs(pct));
  const cls = Math.abs(pct) < 0.5 ? "at" : pct > 0 ? "above" : "below";
  return `<div class="dist-bar" title="${escapeHtml(distanceLabel(pct).text)}"><div class="dist-bar-fill ${cls}" style="width:${width}%"></div></div>`;
}

function matchesFilter(stock: StockRow) {
  const dist = getDistance(stock);
  if (tagFilter && !(stock.tags ?? []).includes(tagFilter)) return false;
  switch (filter) {
    case "has-target":
      return stock.targetPrice != null;
    case "at-target":
      return dist != null && Math.abs(dist) < 0.5;
    case "high-priority":
      return stock.priority === "high";
    case "lean-buy":
      return actionBias(getQuote(stock)).cls === "buy";
    case "lean-sell":
      return actionBias(getQuote(stock)).cls === "sell";
    default:
      if (filter.startsWith("tech-")) {
        return matchesTechnicalFilter(filter, getQuote(stock), getPrice(stock));
      }
      return true;
  }
}

function matchesSearch(stock: StockRow) {
  if (!search) return true;
  const q = search.toLowerCase();
  return (
    stock.symbol.toLowerCase().includes(q) ||
    (stock.name ?? "").toLowerCase().includes(q) ||
    (stock.thesis ?? "").toLowerCase().includes(q) ||
    (stock.targetNote ?? "").toLowerCase().includes(q) ||
    (stock.sector ?? "").toLowerCase().includes(q) ||
    (stock.tags ?? []).some((t) => t.toLowerCase().includes(q))
  );
}

function sortStocks(list: StockRow[]) {
  const sorted = [...list];
  sorted.sort((a, b) => {
    let av: string | number;
    let bv: string | number;
    switch (sortKey) {
      case "symbol":
        return sortDir * a.symbol.localeCompare(b.symbol);
      case "name":
        return sortDir * (a.name ?? "").localeCompare(b.name ?? "");
      case "category":
        return sortDir * a.category.localeCompare(b.category);
      case "sector":
        return sortDir * (a.sector ?? "").localeCompare(b.sector ?? "");
      case "price":
        av = getPrice(a) ?? -Infinity;
        bv = getPrice(b) ?? -Infinity;
        return sortDir * ((av as number) - (bv as number));
      case "target":
        av = a.targetPrice ?? -Infinity;
        bv = b.targetPrice ?? -Infinity;
        return sortDir * ((av as number) - (bv as number));
      case "distance": {
        const da = getDistance(a);
        const db = getDistance(b);
        if (da == null && db == null) return a.symbol.localeCompare(b.symbol);
        if (da == null) return 1;
        if (db == null) return -1;
        return sortDir * (Math.abs(da) - Math.abs(db));
      }
      case "priority": {
        const order: Record<string, number> = { high: 0, medium: 1, low: 2 };
        av = order[a.priority ?? ""] ?? 3;
        bv = order[b.priority ?? ""] ?? 3;
        return sortDir * ((av as number) - (bv as number));
      }
      case "by":
        return sortDir * (a.holder ?? a.addedBy ?? "").localeCompare(b.holder ?? b.addedBy ?? "");
      case "vs50":
        av = getQuote(a)?.vsSma?.[50] ?? -Infinity;
        bv = getQuote(b)?.vsSma?.[50] ?? -Infinity;
        return sortDir * ((av as number) - (bv as number));
      case "vs20":
        av = getQuote(a)?.vsSma?.[20] ?? -Infinity;
        bv = getQuote(b)?.vsSma?.[20] ?? -Infinity;
        return sortDir * ((av as number) - (bv as number));
      case "vs200":
        av = getQuote(a)?.vsSma?.[200] ?? -Infinity;
        bv = getQuote(b)?.vsSma?.[200] ?? -Infinity;
        return sortDir * ((av as number) - (bv as number));
      case "range52":
        av = getQuote(a)?.range52Pct ?? -Infinity;
        bv = getQuote(b)?.range52Pct ?? -Infinity;
        return sortDir * ((av as number) - (bv as number));
      case "ath":
        av = getQuote(a)?.pctFromAth ?? -Infinity;
        bv = getQuote(b)?.pctFromAth ?? -Infinity;
        return sortDir * ((av as number) - (bv as number));
      case "rsi":
        av = getQuote(a)?.rsi14 ?? -Infinity;
        bv = getQuote(b)?.rsi14 ?? -Infinity;
        return sortDir * ((av as number) - (bv as number));
      case "trend": {
        const order: Record<string, number> = { bullish: 0, mixed: 1, bearish: 2, unknown: 3 };
        av = order[getQuote(a)?.trend ?? "unknown"] ?? 4;
        bv = order[getQuote(b)?.trend ?? "unknown"] ?? 4;
        return sortDir * ((av as number) - (bv as number));
      }
      case "action": {
        const order: Record<string, number> = { buy: 0, watch: 1, sell: 2, idle: 3 };
        av = order[actionBias(getQuote(a)).cls] ?? 4;
        bv = order[actionBias(getQuote(b)).cls] ?? 4;
        return sortDir * ((av as number) - (bv as number));
      }
      default:
        return 0;
      }
  });
  return sorted;
}

function filteredStocks() {
  return sortStocks(allStocks.filter((s) => matchesFilter(s) && matchesSearch(s)));
}

function renderTagsHtml(stock: StockRow) {
  if (!stock.tags?.length) return `<span class="dim">—</span>`;
  return stock.tags
    .map((t) => `<span class="tag-pill">${escapeHtml(t)}</span>`)
    .join("");
}

function renderPriority(stock: StockRow) {
  if (!stock.priority) return "—";
  const p = sanitizePriority(stock.priority);
  return `<span class="priority priority-${p}">${escapeHtml(p)}</span>`;
}

function renderRow(stock: StockRow, compact = false, mode: "default" | "technical" = "default") {
  const sym = sanitizeSymbol(stock.symbol) || escapeHtml(String(stock.symbol ?? ""));
  const sid = sanitizeId(stock.id) || escapeHtml(String(stock.id ?? ""));
  const price = getPrice(stock);
  const q = getQuote(stock);
  const chg = getChange(stock);
  const dist = getDistance(stock);
  const { text: distText, cls: distCls } = distanceLabel(dist);
  const chgHtml =
    chg != null
      ? `<span class="chg ${chg >= 0 ? "up" : "down"}">${chg >= 0 ? "+" : ""}${chg.toFixed(2)}%</span>`
      : `<span class="chg dim">—</span>`;
  const expanded = expandedId === stock.id;
  const atTarget = dist != null && Math.abs(dist) < 0.5;

  if (mode === "technical") {
    const rsi = rsiLabel(q?.rsi14);
    return `
    <tr data-id="${sid}" data-symbol="${sym}" class="data-row ${expanded ? "expanded" : ""}">
      <td class="mono sym sticky-col">
        <a href="${yahooUrl(sym)}" target="_blank" rel="noopener noreferrer" class="sym-link">${sym}</a>
      </td>
      <td class="name-cell">${escapeHtml(stock.name)}</td>
      <td class="num mono price-cell" data-price-for="${sym}">${fmtPrice(price)}</td>
      <td class="num">${chgHtml}</td>
      <td>${actionBadge(q)}</td>
      <td>${trendBadge(q?.trend)}</td>
      <td class="num">${maCell(price, q?.sma?.[50], q?.vsSma?.[50])}</td>
      <td class="range-cell">${rangeBar(q?.range52Pct, q?.low52, q?.high52)}</td>
      <td class="num"><span class="rsi-badge rsi-${rsi.cls}">${rsi.text}</span></td>
      <td class="row-actions">
        <button type="button" class="btn-icon expand-btn" aria-label="Toggle details" data-expand="${sid}">${expanded ? "−" : "+"}</button>
      </td>
    </tr>
    ${expanded ? renderDetailRow(stock, price, q, 10) : ""}`;
  }

  const pri = sanitizePriority(stock.priority);
  return `
    <tr data-id="${sid}" data-symbol="${sym}" class="data-row ${atTarget ? "row-at-target" : ""} ${pri === "high" ? "row-high" : ""} ${expanded ? "expanded" : ""}">
      <td class="mono sym sticky-col">
        <a href="${yahooUrl(sym)}" target="_blank" rel="noopener noreferrer" class="sym-link">${sym}</a>
        ${pri === "high" ? '<span class="conviction-dot" title="High conviction">●</span>' : ""}
        ${stock.custom ? '<span class="custom-tag" title="From group notes">★</span>' : ""}
      </td>
      <td class="name-cell">${escapeHtml(stock.name)}</td>
      <td class="num mono price-cell" data-price-for="${sym}">${fmtPrice(price)}</td>
      <td class="num">${chgHtml}</td>
      <td>${actionBadge(q)}</td>
      <td class="ath-cell">${athIndicator(q)}</td>
      <td class="num mono">${stock.targetPrice != null ? fmtPrice(stock.targetPrice) : "—"}</td>
      <td class="note-cell">${escapeHtml(stock.thesis ?? stock.targetNote ?? "—")}</td>
      <td>${renderPriority(stock)}</td>
      <td class="row-actions">
        <button type="button" class="btn-icon expand-btn" aria-label="Toggle details" data-expand="${sid}">${expanded ? "−" : "+"}</button>
      </td>
    </tr>
    ${expanded ? renderDetailRow(stock, price, getQuote(stock), 10) : ""}
  `;
}

function renderDetailRow(stock: StockRow, price: number | null, q: QuoteData | undefined, colspan: number) {
  const sym = sanitizeSymbol(stock.symbol) || escapeHtml(String(stock.symbol ?? ""));
  const sid = sanitizeId(stock.id) || escapeHtml(String(stock.id ?? ""));
  const ptVal = stock.targetPrice != null ? String(stock.targetPrice) : "";
  return `<tr class="detail-row" data-detail-for="${sid}">
        <td colspan="${colspan}">
          <div class="detail-panel">
            ${renderTechnicalDetail(q, price)}
            ${stock.sector ? `<p><strong>Sector:</strong> ${escapeHtml(stock.sector)}</p>` : ""}
            ${stock.thesis ? `<p><strong>Thesis:</strong> ${escapeHtml(stock.thesis)}</p>` : ""}
            ${stock.targetNote ? `<p><strong>Target note:</strong> ${escapeHtml(stock.targetNote)}</p>` : ""}
            <div class="pt-inline" data-pt-inline="${sym}">
              <strong>Price target:</strong>
              <input type="number" class="pt-inline-price" step="0.01" min="0.01" placeholder="e.g. 18" value="${ptVal}" aria-label="Target price for ${sym}" />
              <button type="button" class="btn btn-ghost btn-sm" data-pt-save="${sym}">Save to PT list</button>
              ${stock.targetPrice != null ? `<span class="pt-current">Target ${fmtPrice(stock.targetPrice)}</span>` : ""}
            </div>
            <p><strong>Holder:</strong> ${escapeHtml(stock.holder ?? stock.addedBy ?? "—")}</p>
            <a href="${yahooUrl(sym)}" target="_blank" rel="noopener noreferrer">View on Yahoo Finance →</a>
          </div>
        </td>
      </tr>`;
}

function renderTableHtml(stocks: StockRow[], mode: "default" | "technical" = "default") {
  if (!stocks.length) {
    const cols = mode === "technical" ? 10 : 10;
    return `<tr><td colspan="${cols}" class="empty-row">No tickers match your filters.</td></tr>`;
  }
  return stocks.map((s) => renderRow(s, false, mode)).join("");
}

function renderOverview() {
  const el = document.getElementById("overview-grid");
  if (!el) return;

  const withTarget = allStocks.filter((s) => s.targetPrice != null);
  let atTarget = 0;
  let within5 = 0;
  let within10 = 0;

  for (const s of withTarget) {
    const d = getDistance(s);
    if (d == null) continue;
    const abs = Math.abs(d);
    if (abs < 0.5) atTarget++;
    if (abs <= 5) within5++;
    if (abs <= 10) within10++;
  }

  const tags = new Set<string>();
  allStocks.forEach((s) => (s.tags ?? []).forEach((t) => tags.add(t)));

  let techHtml = "";
  const withTech = allStocks.filter((s) => hasTechnical(getQuote(s)));
  if (withTech.length) {
    let above50 = 0;
    let above200 = 0;
    let bullish = 0;
    let nearLow = 0;
    let nearAth = 0;
    for (const s of withTech) {
      const q = getQuote(s);
      const p = getPrice(s);
      if (q?.sma?.[50] != null && p != null && p > q.sma[50]) above50++;
      if (q?.sma?.[200] != null && p != null && p > q.sma[200]) above200++;
      if (q?.trend === "bullish") bullish++;
      if (q?.range52Pct != null && q.range52Pct <= 20) nearLow++;
      if (q?.pctFromAth != null && q.pctFromAth >= -5) nearAth++;
    }
    techHtml = `
    <div class="overview-metric tech"><span class="ov-value">${above50}</span><span class="ov-label">Above 50 MA</span></div>
    <div class="overview-metric tech"><span class="ov-value">${above200}</span><span class="ov-label">Above 200 MA</span></div>
    <div class="overview-metric tech highlight"><span class="ov-value">${bullish}</span><span class="ov-label">Bullish trend</span></div>
    <div class="overview-metric tech"><span class="ov-value">${nearLow}</span><span class="ov-label">Near 52w low</span></div>
    <div class="overview-metric tech"><span class="ov-value">${nearAth}</span><span class="ov-label">Near ATH</span></div>`;
  }

  const leanBuy = allStocks.filter((s) => actionBias(getQuote(s)).cls === "buy").length;

  el.innerHTML = `
    <div class="overview-metric"><span class="ov-value">${allStocks.length}</span><span class="ov-label">On master list</span></div>
    <div class="overview-metric highlight"><span class="ov-value">${allStocks.filter((s) => s.priority === "high").length}</span><span class="ov-label">High conviction</span></div>
    <div class="overview-metric highlight"><span class="ov-value">${leanBuy}</span><span class="ov-label">Lean buy now</span></div>
    ${techHtml}
  `;
}

function renderCheckIn() {
  const gainersEl = document.getElementById("checkin-gainers");
  const losersEl = document.getElementById("checkin-losers");
  const setupsEl = document.getElementById("checkin-setups");
  const watchEl = document.getElementById("checkin-watch");
  const cautionEl = document.getElementById("checkin-caution");
  const tallyEl = document.getElementById("checkin-tally");
  // Legacy id from older builds
  const moversEl = document.getElementById("checkin-movers");
  if (!gainersEl && !losersEl && !setupsEl && !watchEl && !cautionEl && !moversEl) return;

  const priced = allStocks
    .map((s) => {
      const q = getQuote(s);
      const price = getPrice(s);
      const chg = q?.changePct ?? null;
      const explain = pulseExplain(q);
      return { stock: s, q, price, chg, bias: explain.bias, explain };
    })
    .filter((x) => x.price != null);

  const emptyAll = (msg: string) => {
    const empty = `<li class="checkin-rank__empty">${msg}</li>`;
    for (const el of [gainersEl, losersEl, setupsEl, watchEl, cautionEl, moversEl]) {
      if (el) el.innerHTML = empty;
    }
    if (tallyEl) tallyEl.innerHTML = `<span class="checkin-tally__loading">${msg}</span>`;
  };

  if (!priced.length) {
    emptyAll("Waiting on quotes for the master list…");
    return;
  }

  const buyN = priced.filter((x) => x.bias.cls === "buy").length;
  const sellN = priced.filter((x) => x.bias.cls === "sell").length;
  const watchN = priced.filter((x) => x.bias.cls === "watch").length;
  const upN = priced.filter((x) => (x.chg ?? 0) > 0).length;
  const downN = priced.filter((x) => (x.chg ?? 0) < 0).length;

  if (tallyEl) {
    tallyEl.innerHTML = `
      <span class="checkin-tally__stat checkin-tally__stat--buy"><strong>${buyN}</strong> buy</span>
      <span class="checkin-tally__stat checkin-tally__stat--watch"><strong>${watchN}</strong> watch</span>
      <span class="checkin-tally__stat checkin-tally__stat--sell"><strong>${sellN}</strong> sell</span>
      <span class="checkin-tally__sep" aria-hidden="true"></span>
      <span class="checkin-tally__stat"><strong class="up">${upN}</strong> up</span>
      <span class="checkin-tally__stat"><strong class="down">${downN}</strong> down</span>
    `;
  }

  const moveRow = (x: (typeof priced)[0], i: number) => {
    const up = (x.chg ?? 0) >= 0;
    const sym = sanitizeSymbol(x.stock.symbol) || escapeHtml(String(x.stock.symbol ?? ""));
    return `<li class="checkin-rank__row">
      <span class="checkin-rank__n">${i + 1}</span>
      <button type="button" class="checkin-rank__sym" data-jump="${sym}">${sym}</button>
      <span class="checkin-rank__name">${escapeHtml(x.stock.name)}</span>
      <span class="checkin-rank__val mono ${up ? "up" : "down"}">${up ? "+" : ""}${(x.chg ?? 0).toFixed(1)}%</span>
    </li>`;
  };

  const signalRow = (x: (typeof priced)[0], i: number) => {
    const sym = sanitizeSymbol(x.stock.symbol) || escapeHtml(String(x.stock.symbol ?? ""));
    const chg = x.chg;
    const chgHtml =
      chg == null
        ? `<span class="checkin-rank__val dim">—</span>`
        : `<span class="checkin-rank__val mono ${chg >= 0 ? "up" : "down"}">${chg >= 0 ? "+" : ""}${chg.toFixed(1)}%</span>`;
    return `<li class="checkin-rank__row">
      <span class="checkin-rank__n">${i + 1}</span>
      <button type="button" class="checkin-rank__sym" data-jump="${sym}">${sym}</button>
      <span class="checkin-rank__name">${escapeHtml(x.stock.name)}</span>
      ${chgHtml}
    </li>`;
  };

  const gainers = [...priced]
    .filter((x) => x.chg != null && x.chg > 0)
    .sort((a, b) => (b.chg ?? 0) - (a.chg ?? 0))
    .slice(0, 8);

  const losers = [...priced]
    .filter((x) => x.chg != null && x.chg < 0)
    .sort((a, b) => (a.chg ?? 0) - (b.chg ?? 0))
    .slice(0, 8);

  // Absolute movers fallback for legacy #checkin-movers
  const absMovers = [...priced]
    .filter((x) => x.chg != null)
    .sort((a, b) => Math.abs(b.chg!) - Math.abs(a.chg!))
    .slice(0, 8);

  if (gainersEl) {
    gainersEl.innerHTML = gainers.length
      ? gainers.map(moveRow).join("")
      : `<li class="checkin-rank__empty">No gainers today.</li>`;
  }
  if (losersEl) {
    losersEl.innerHTML = losers.length
      ? losers.map(moveRow).join("")
      : `<li class="checkin-rank__empty">No losers today.</li>`;
  }
  if (moversEl) {
    moversEl.innerHTML = absMovers.length
      ? absMovers.map(moveRow).join("")
      : `<li class="checkin-rank__empty">No moves yet.</li>`;
  }

  const setups = [...priced]
    .filter((x) => x.bias.cls === "buy")
    .sort((a, b) => b.bias.score - a.bias.score || (b.chg ?? 0) - (a.chg ?? 0))
    .slice(0, 8);

  if (setupsEl) {
    setupsEl.innerHTML = setups.length
      ? setups.map(signalRow).join("")
      : `<li class="checkin-rank__empty">None right now.</li>`;
  }

  const watch = [...priced]
    .filter((x) => x.bias.cls === "watch")
    .sort((a, b) => Math.abs(b.bias.score) - Math.abs(a.bias.score) || Math.abs(b.chg ?? 0) - Math.abs(a.chg ?? 0))
    .slice(0, 8);

  if (watchEl) {
    watchEl.innerHTML = watch.length
      ? watch.map(signalRow).join("")
      : `<li class="checkin-rank__empty">None right now.</li>`;
  }

  const caution = [...priced]
    .filter((x) => x.bias.cls === "sell")
    .sort((a, b) => a.bias.score - b.bias.score)
    .slice(0, 8);

  if (cautionEl) {
    cautionEl.innerHTML = caution.length
      ? caution.map(signalRow).join("")
      : `<li class="checkin-rank__empty">None right now.</li>`;
  }
}

function renderTagFilters() {
  const el = document.getElementById("tag-filters");
  if (!el) return;

  const tags = new Set<string>();
  allStocks.forEach((s) => (s.tags ?? []).forEach((t) => tags.add(t)));
  if (!tags.size) {
    el.innerHTML = "";
    return;
  }

  el.innerHTML = `<span class="tag-filter-label">Themes:</span>` +
    [...tags]
      .sort()
      .map(
        (t) =>
          `<button type="button" class="chip tag-chip ${tagFilter === t ? "active" : ""}" data-tag="${escapeHtml(t)}">${escapeHtml(t)}</button>`
      )
      .join("") +
    (tagFilter ? `<button type="button" class="chip tag-clear" data-tag="">Clear</button>` : "");
}

function renderOpportunities() {
  const chips = document.getElementById("opp-chips");
  if (!chips) return;

  const candidates = allStocks
    .filter((s) => s.targetPrice != null)
    .map((s) => ({ stock: s, dist: getDistance(s) }))
    .filter((x) => x.dist != null)
    .sort((a, b) => Math.abs(a.dist!) - Math.abs(b.dist!))
    .slice(0, 15);

  if (!candidates.length) {
    chips.innerHTML = `<span class="opp-empty">Add target prices to track entries.</span>`;
    return;
  }

  chips.innerHTML = candidates
    .map(({ stock, dist }) => {
      const { text, cls } = distanceLabel(dist);
      const price = getPrice(stock);
      return `<button type="button" class="opp-chip ${cls}" data-jump="${sanitizeSymbol(stock.symbol)}" title="${escapeHtml(stock.thesis ?? "")}">
        <strong>${sanitizeSymbol(stock.symbol) || escapeHtml(stock.symbol)}</strong>
        <span>${fmtPrice(price)} → ${fmtPrice(stock.targetPrice!)}</span>
        <em>${text}</em>
      </button>`;
    })
    .join("");
}

function renderHeldStrip() {
  const el = document.getElementById("held-strip");
  if (!el) return;

  const owned = sortStocks(allStocks.filter((s) => s.category === "owned"));
  if (!owned.length) {
    el.hidden = true;
    return;
  }
  el.hidden = false;

  el.innerHTML = owned
    .map((stock) => {
      const price = getPrice(stock);
      const chg = getChange(stock);
      const q = getQuote(stock);
      const chgCls = chg != null ? (chg >= 0 ? "up" : "down") : "dim";
      const chgTxt = chg != null ? `${chg >= 0 ? "+" : ""}${chg.toFixed(2)}%` : "—";
      const sym = sanitizeSymbol(stock.symbol) || escapeHtml(String(stock.symbol ?? ""));
      return `<article class="held-card" data-symbol="${sym}">
        <div class="held-top">
          <a href="${yahooUrl(sym)}" target="_blank" rel="noopener noreferrer" class="held-sym">${sym}</a>
          ${q?.trend ? trendBadge(q.trend) : ""}
          ${sanitizePriority(stock.priority) === "high" ? '<span class="held-conviction">High conviction</span>' : ""}
        </div>
        <div class="held-name">${escapeHtml(stock.name)}</div>
        <div class="held-price mono">${fmtPrice(price)} <span class="chg ${chgCls}">${chgTxt}</span></div>
        ${renderMaStrip(q, price)}
        <p class="held-thesis">${escapeHtml(stock.thesis ?? "")}</p>
        <div class="held-tags">${renderTagsHtml(stock)}</div>
      </article>`;
    })
    .join("");
}

function renderPagination(total: number) {
  const el = document.getElementById(viewMode === "technical" ? "technical-pagination" : "pagination");
  if (!el) return;

  const pages = Math.max(1, Math.ceil(total / pageSize));
  if (page > pages) page = pages;

  el.innerHTML = `
    <div class="page-size">
      <label>Per page
        <select id="page-size-select">
          ${[25, 50, 100, 200].map((n) => `<option value="${n}" ${n === pageSize ? "selected" : ""}>${n}</option>`).join("")}
        </select>
      </label>
    </div>
    <div class="page-nav">
      <button type="button" class="btn btn-ghost" id="page-prev" ${page <= 1 ? "disabled" : ""}>Prev</button>
      <span>Page ${page} of ${pages}</span>
      <button type="button" class="btn btn-ghost" id="page-next" ${page >= pages ? "disabled" : ""}>Next</button>
    </div>
  `;
}

function renderBucketView(list: StockRow[]) {
  const wrap = document.getElementById("bucket-view");
  const tableWrap = document.getElementById("table-view");
  const techWrap = document.getElementById("technical-view");
  if (!wrap || !tableWrap) return;

  wrap.hidden = false;
  tableWrap.hidden = true;
  if (techWrap) techWrap.hidden = true;

  for (const cat of ["owned", "targets", "watching"]) {
    const body = document.querySelector(`[data-bucket-body="${cat}"]`);
    const countEl = document.querySelector(`[data-bucket-count="${cat}"]`);
    const subset = list.filter((s) => s.category === cat);
    if (countEl) countEl.textContent = String(subset.length);
    if (body) {
      body.innerHTML =
        subset.length > 0
          ? `<div class="table-wrap compact"><table class="watchlist-table"><thead>${tableHead()}</thead><tbody>${renderTableHtml(subset)}</tbody></table></div>`
          : `<p class="bucket-empty">No tickers in this bucket.</p>`;
    }
  }
}

function tableHead(mode: "default" | "technical" = "default") {
  if (mode === "technical") {
    return `<tr>
      <th>Symbol</th><th>Name</th><th>Bucket</th>
      <th class="num">Price</th><th class="num">Chg</th><th>Trend</th>
      <th class="num">SMA 20</th><th class="num">SMA 50</th><th class="num">SMA 200</th>
      <th>52W range</th><th data-sort="ath" class="sortable">ATH</th><th class="num">RSI</th><th class="num">Target</th><th></th>
    </tr>`;
  }
  return `<tr>
    <th>Symbol</th><th>Name</th><th>Bucket</th><th>Tags</th>
    <th class="num">Price</th><th class="num">Chg</th><th class="num">Target</th>
    <th class="num">Distance</th><th>Thesis</th><th>Priority</th><th></th>
  </tr>`;
}

function renderTechnicalView(list: StockRow[]) {
  const tableWrap = document.getElementById("table-view");
  const techWrap = document.getElementById("technical-view");
  const tbody = document.getElementById("technical-tbody");
  const countEl = document.getElementById("result-count");
  if (!tbody || !techWrap) return;

  if (tableWrap) tableWrap.hidden = true;
  techWrap.hidden = false;

  const total = list.length;
  const start = (page - 1) * pageSize;
  const pageItems = list.slice(start, start + pageSize);

  if (countEl) {
    countEl.textContent =
      total === allStocks.length
        ? `Technical view · ${start + 1}–${Math.min(start + pageSize, total)} of ${total}`
        : `Technical view · ${start + 1}–${Math.min(start + pageSize, total)} of ${total} (filtered from ${allStocks.length})`;
  }

  tbody.innerHTML = renderTableHtml(pageItems, "technical");
  renderPagination(total);

  document.querySelectorAll("#technical-view th.sortable").forEach((th) => {
    th.classList.toggle("sorted-asc", th.getAttribute("data-sort") === sortKey && sortDir === 1);
    th.classList.toggle("sorted-desc", th.getAttribute("data-sort") === sortKey && sortDir === -1);
  });
}

function renderTableView(list: StockRow[]) {
  const tableWrap = document.getElementById("table-view");
  const techWrap = document.getElementById("technical-view");
  const tbody = document.getElementById("watchlist-tbody");
  const countEl = document.getElementById("result-count");
  if (!tbody || !tableWrap) return;

  if (techWrap) techWrap.hidden = true;
  tableWrap.hidden = false;

  const total = list.length;
  const start = (page - 1) * pageSize;
  const pageItems = list.slice(start, start + pageSize);

  if (countEl) {
    countEl.textContent =
      total === allStocks.length
        ? `Showing ${start + 1}–${Math.min(start + pageSize, total)} of ${total}`
        : `Showing ${start + 1}–${Math.min(start + pageSize, total)} of ${total} (filtered from ${allStocks.length})`;
  }

  tbody.innerHTML = renderTableHtml(pageItems);
  renderPagination(total);

  document.querySelectorAll("th.sortable").forEach((th) => {
    th.classList.toggle("sorted-asc", th.getAttribute("data-sort") === sortKey && sortDir === 1);
    th.classList.toggle("sorted-desc", th.getAttribute("data-sort") === sortKey && sortDir === -1);
  });
}

function isMobileLayout() {
  return window.matchMedia("(max-width: 640px)").matches;
}

function syncLayoutClass() {
  document.body.classList.toggle("layout-mobile", isMobileLayout());
}

function renderMobileCard(stock: StockRow) {
  const price = getPrice(stock);
  const chg = getChange(stock);
  const q = getQuote(stock);
  const chgCls = chg != null ? (chg >= 0 ? "up" : "down") : "dim";
  const chgTxt = chg != null ? `${chg >= 0 ? "+" : ""}${chg.toFixed(2)}%` : "—";

  const high = sanitizePriority(stock.priority) === "high";
  const action = actionBias(q);
  const sym = sanitizeSymbol(stock.symbol) || escapeHtml(String(stock.symbol ?? ""));
  return `<article class="stock-card-m ${high ? "scm-high" : ""} action-card-${escapeHtml(action.cls)}" data-symbol="${sym}">
    <a href="${yahooUrl(sym)}" target="_blank" rel="noopener noreferrer" class="scm-main">
      <div class="scm-top">
        <div class="scm-identity">
          <span class="scm-sym">${sym}</span>
          ${high ? '<span class="scm-conviction">High</span>' : ""}
          ${actionBadge(q)}
        </div>
        <div class="scm-quote">
          <span class="scm-price mono" data-price-for="${sym}">${fmtPrice(price)}</span>
          <span class="scm-chg chg ${chgCls}">${chgTxt}</span>
        </div>
      </div>
      <div class="scm-mid">
        <span class="scm-name">${escapeHtml(stock.name)}</span>
        <span class="scm-ath">${athIndicator(q)}</span>
      </div>
      ${stock.thesis ? `<p class="scm-thesis">${escapeHtml(stock.thesis)}</p>` : ""}
      <p class="scm-signal-reason">${escapeHtml(action.reason)}</p>
    </a>
  </article>`;
}

function renderMobileView(list: StockRow[]) {
  const mobileEl = document.getElementById("mobile-stock-list");
  const tableWrap = document.getElementById("table-view");
  const techWrap = document.getElementById("technical-view");
  const countEl = document.getElementById("result-count");

  if (!mobileEl) return false;

  if (!isMobileLayout()) {
    mobileEl.hidden = true;
    return false;
  }

  if (tableWrap) tableWrap.hidden = true;
  if (techWrap) techWrap.hidden = true;
  mobileEl.hidden = false;

  const sorted = sortStocks(list);
  mobileEl.innerHTML =
    sorted.length > 0
      ? `<div class="mobile-bucket-cards">${sorted.map(renderMobileCard).join("")}</div>`
      : `<p class="mobile-empty">No tickers match. Try clearing search.</p>`;

  if (countEl) {
    countEl.textContent = `${list.length} tracking`;
  }

  return true;
}

function renderAll() {
  syncLayoutClass();
  const list = filteredStocks();

  renderCheckIn();

  if (isMobileLayout()) {
    renderMobileView(list);
    return;
  }

  renderOverview();
  renderTagFilters();

  const mobileEl = document.getElementById("mobile-stock-list");
  if (mobileEl) mobileEl.hidden = true;

  if (viewMode === "technical") {
    renderTechnicalView(list);
  } else {
    renderTableView(list);
  }
}

function setViewToggle(activeId: string) {
  ["view-table", "view-technical"].forEach((id) => {
    document.getElementById(id)?.classList.toggle("active", id === activeId);
  });
}

function bindEvents() {
  document.getElementById("search-input")?.addEventListener("input", (e) => {
    search = (e.target as HTMLInputElement).value.trim();
    page = 1;
    renderAll();
  });

  document.querySelectorAll(".filter-chips").forEach((container) => {
    container.addEventListener("click", (e) => {
      const btn = (e.target as HTMLElement).closest("[data-filter]");
      if (!btn) return;
      filter = btn.getAttribute("data-filter") ?? "all";
      document.querySelectorAll(".filter-chips .chip[data-filter]").forEach((c) => c.classList.remove("active"));
      btn.classList.add("active");
      page = 1;
      savePrefs();
      renderAll();
    });
  });

  document.getElementById("tag-filters")?.addEventListener("click", (e) => {
    const btn = (e.target as HTMLElement).closest("[data-tag]");
    if (!btn) return;
    const t = btn.getAttribute("data-tag");
    tagFilter = t || null;
    page = 1;
    renderAll();
  });

  document.querySelectorAll("th.sortable").forEach((th) => {
    th.addEventListener("click", () => {
      const key = th.getAttribute("data-sort")!;
      if (sortKey === key) sortDir *= -1;
      else {
        sortKey = key;
        sortDir = 1;
      }
      savePrefs();
      renderAll();
    });
  });

  document.getElementById("technical-view")?.addEventListener("click", (e) => {
    const th = (e.target as HTMLElement).closest("th.sortable");
    if (!th) return;
    const key = th.getAttribute("data-sort")!;
    if (sortKey === key) sortDir *= -1;
    else {
      sortKey = key;
      sortDir = 1;
    }
    savePrefs();
    renderAll();
  });

  document.getElementById("view-table")?.addEventListener("click", () => {
    viewMode = "table";
    setViewToggle("view-table");
    savePrefs();
    renderAll();
  });

  document.getElementById("view-technical")?.addEventListener("click", () => {
    viewMode = "technical";
    setViewToggle("view-technical");
    savePrefs();
    renderAll();
  });

  function jumpToSymbol(sym: string) {
    search = sym;
    const input = document.getElementById("search-input") as HTMLInputElement;
    if (input) input.value = sym;
    filter = "all";
    tagFilter = null;
    document.querySelectorAll(".filter-chips .chip[data-filter]").forEach((c) => {
      c.classList.toggle("active", c.getAttribute("data-filter") === "all");
    });
    viewMode = "table";
    page = 1;
    renderAll();
    document.getElementById("watchlist-board")?.scrollIntoView({ behavior: "smooth", block: "start" });
    requestAnimationFrame(() => {
      document.querySelector(`tr[data-symbol="${sym}"], .stock-card-m[data-symbol="${sym}"]`)
        ?.scrollIntoView({ behavior: "smooth", block: "center" });
    });
  }

  document.getElementById("opp-chips")?.addEventListener("click", (e) => {
    const btn = (e.target as HTMLElement).closest("[data-jump]");
    if (!btn) return;
    jumpToSymbol(btn.getAttribute("data-jump")!);
  });

  document.getElementById("checkin")?.addEventListener("click", (e) => {
    const btn = (e.target as HTMLElement).closest("[data-jump]");
    if (!btn) return;
    jumpToSymbol(btn.getAttribute("data-jump")!);
  });

  document.getElementById("watchlist-board")?.addEventListener("change", (e) => {
    if ((e.target as HTMLElement).id === "page-size-select") {
      pageSize = Number((e.target as HTMLSelectElement).value);
      page = 1;
      savePrefs();
      renderAll();
    }
  });

  document.getElementById("watchlist-board")?.addEventListener("click", (e) => {
    const ptSave = (e.target as HTMLElement).closest("[data-pt-save]");
    if (ptSave) {
      const sym = ptSave.getAttribute("data-pt-save")!;
      const row = ptSave.closest(".pt-inline");
      const input = row?.querySelector(".pt-inline-price") as HTMLInputElement | null;
      const price = Number(input?.value);
      if (!price || price <= 0) {
        alert("Enter a valid target price.");
        return;
      }
      savePriceTarget(sym, price).then((ok) => {
        if (!ok) return;
        renderAll();
      });
      return;
    }

    const expand = (e.target as HTMLElement).closest("[data-expand]");
    if (expand) {
      const id = expand.getAttribute("data-expand")!;
      expandedId = expandedId === id ? null : id;
      renderAll();
      return;
    }

    const pag = (e.target as HTMLElement).closest("#page-prev, #page-next, #page-size-select");
    if (pag) {
      if ((pag as HTMLElement).id === "page-prev" && page > 1) page--;
      else if ((pag as HTMLElement).id === "page-next") page++;
      else return;
      renderAll();
      return;
    }
  });

  document.getElementById("technical-view")?.addEventListener("click", (e) => {
    const expand = (e.target as HTMLElement).closest("[data-expand]");
    if (expand) {
      const id = expand.getAttribute("data-expand")!;
      expandedId = expandedId === id ? null : id;
      renderAll();
      return;
    }

    const pag = (e.target as HTMLElement).closest("#page-prev, #page-next, #page-size-select");
    if (pag) {
      if ((pag as HTMLElement).id === "page-prev" && page > 1) page--;
      else if ((pag as HTMLElement).id === "page-next") page++;
      renderAll();
    }
  });

  document.addEventListener("keydown", (e) => {
    if (e.key === "/" && document.activeElement?.tagName !== "INPUT" && document.activeElement?.tagName !== "TEXTAREA") {
      e.preventDefault();
      (document.getElementById("search-input") as HTMLInputElement)?.focus();
    }
  });

  document.addEventListener("radar:quotes", ((e: CustomEvent) => {
    const incoming = e.detail as QuoteMap;
    const changed = new Map<string, "up" | "down">();
    for (const [sym, q] of Object.entries(incoming || {})) {
      const prev = quotes[sym]?.price;
      if (prev != null && q?.price != null && prev !== q.price) {
        changed.set(sym, q.price > prev ? "up" : "down");
      }
    }
    quotes = { ...quotes, ...incoming };
    renderAll();
    requestAnimationFrame(() => {
      for (const [sym, dir] of changed) {
        document.querySelectorAll(`[data-price-for="${sym}"]`).forEach((el) => {
          el.classList.remove("price-flash", "up", "down");
          void (el as HTMLElement).offsetWidth;
          el.classList.add("price-flash", dir);
        });
      }
    });
  }) as EventListener);

  document.addEventListener("radar:submission-added", (async (e: Event) => {
    const detail = (e as CustomEvent).detail;
    const incoming = detail?.stocks as StockRow[] | undefined;
    if (!incoming?.length) return;
    const baseSymbols = new Set(baseStocks.map((s) => s.symbol));
    const novel = incoming.filter((s) => !baseSymbols.has(s.symbol));
    if (!novel.length) return;
    const existing = await getCustomStocks();
    const merged = mergeStocks(existing, novel);
    await setCustomStocks(merged);
    allStocks = mergeStocks(baseStocks, merged);
    renderAll();
  }) as EventListener);
}

export async function initWatchlistBoard(stocksJson: string) {
  const site = radarSettings();
  if (site.board?.defaultPageSize) pageSize = site.board.defaultPageSize;
  if (site.board?.defaultSort) sortKey = site.board.defaultSort;

  const prefs = loadPrefs();
  if (prefs.pageSize) pageSize = prefs.pageSize;
  if (prefs.sortKey) sortKey = prefs.sortKey;
  if (prefs.filter) filter = prefs.filter;

  baseStocks = JSON.parse(stocksJson);
  const custom = await getCustomStocks();
  allStocks = mergeStocks(baseStocks, custom);

  const defaultView = site.board?.defaultView === "technical" ? "technical" : "table";
  if (prefs.viewMode === "technical" || (!prefs.viewMode && defaultView === "technical")) {
    viewMode = "technical";
    setViewToggle("view-technical");
  } else {
    viewMode = "table";
    setViewToggle("view-table");
  }

  if (prefs.filter === "owned" || prefs.filter === "watching" || prefs.filter === "targets") {
    filter = "all";
  }

  if (prefs.filter) {
    document.querySelectorAll(".filter-chips .chip[data-filter]").forEach((c) => {
      c.classList.toggle("active", c.getAttribute("data-filter") === filter);
    });
  }

  bindEvents();

  syncLayoutClass();
  window.addEventListener("resize", () => {
    syncLayoutClass();
    renderAll();
  });

  renderAll();
  startQuoteLoader();
}

function isUsMarketOpen() {
  const et = new Date(new Date().toLocaleString("en-US", { timeZone: "America/New_York" }));
  const day = et.getDay();
  if (day === 0 || day === 6) return false;
  const mins = et.getHours() * 60 + et.getMinutes();
  return mins >= 570 && mins < 960;
}

async function fetchOneQuote(symbol: string, attempt = 0): Promise<QuoteData | null> {
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

async function fetchQuotesBatched(symbols: string[]) {
  const unique = [...new Set(symbols)];
  if (!unique.length) return;
  const out: QuoteMap = {};
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

function startQuoteLoader() {
  const base = document.querySelector<HTMLElement>("[data-radar-base]")?.dataset.radarBase ?? "/";
  let lastJsonOk = false;
  let browserFallbackInFlight = false;

  async function loadFromJson() {
    try {
      const res = await fetch(`${base}quotes.json?t=${Date.now()}`, { cache: "no-store" });
      if (!res.ok) throw new Error("no quotes file");
      const data = await res.json();
      if (data.quotes && Object.keys(data.quotes).length) {
        document.dispatchEvent(new CustomEvent("radar:quotes", { detail: data.quotes }));
        lastJsonOk = true;
        return true;
      }
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
      await fetchQuotesBatched([...new Set(allStocks.map((s) => s.symbol))]);
    } finally {
      browserFallbackInFlight = false;
    }
  }

  const symbols = [...new Set(allStocks.map((s) => s.symbol))];

  loadFromJson().then((ok) => {
    if (!ok) maybeBrowserFallback(true);
  });

  setInterval(() => {
    if (document.hidden) return;
    loadFromJson().then((ok) => {
      if (!ok && lastJsonOk === false) maybeBrowserFallback();
    });
  }, radarSettings().quotes?.pollIntervalMs ?? 60_000);

  document.addEventListener("radar:stale-quotes", () => {
    maybeBrowserFallback(true);
  });

  void symbols;
}

export function initBucketSections() {
  /* buckets rendered by initWatchlistBoard */
}

function autoInit() {
  const dataEl = document.getElementById("watchlist-data");
  const raw = dataEl?.textContent ?? window.__STOCKS_RADAR_DATA__;
  if (raw) initWatchlistBoard(raw);
}

if (document.readyState === "loading") {
  document.addEventListener("DOMContentLoaded", autoInit);
} else {
  autoInit();
}
