import { escapeHtml, yahooUrl } from "../lib/watchlist-helpers";

export type QuoteMap = Record<string, { price: number; changePct: number | null; prevClose?: number | null }>;

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
let sortKey = "distance";
let sortDir = 1;
let viewMode: "table" | "buckets" = "buckets";
let page = 1;
let pageSize = 50;
let expandedId: string | null = null;

interface Prefs {
  viewMode?: "table" | "buckets";
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
  for (const s of base) map.set(`${s.symbol}:${s.category}`, s);
  for (const s of custom) map.set(`${s.symbol}:${s.category}`, s);
  return [...map.values()];
}

function fmtPrice(v: number | null | undefined) {
  if (v == null || Number.isNaN(v)) return "—";
  return v.toLocaleString("en-US", { style: "currency", currency: "USD", minimumFractionDigits: 2 });
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
    case "owned":
    case "targets":
    case "watching":
      return stock.category === filter;
    case "has-target":
      return stock.targetPrice != null;
    case "at-target":
      return dist != null && Math.abs(dist) < 0.5;
    case "high-priority":
      return stock.priority === "high";
    default:
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
  return `<span class="priority priority-${stock.priority}">${stock.priority}</span>`;
}

function renderRow(stock: StockRow, compact = false) {
  const price = getPrice(stock);
  const chg = getChange(stock);
  const dist = getDistance(stock);
  const { text: distText, cls: distCls } = distanceLabel(dist);
  const chgHtml =
    chg != null
      ? `<span class="chg ${chg >= 0 ? "up" : "down"}">${chg >= 0 ? "+" : ""}${chg.toFixed(2)}%</span>`
      : `<span class="chg dim">—</span>`;
  const expanded = expandedId === stock.id;
  const atTarget = dist != null && Math.abs(dist) < 0.5;

  return `
    <tr data-id="${stock.id}" data-symbol="${stock.symbol}" class="data-row ${atTarget ? "row-at-target" : ""} ${expanded ? "expanded" : ""}">
      <td class="mono sym">
        <a href="${yahooUrl(stock.symbol)}" target="_blank" rel="noopener noreferrer" class="sym-link">${stock.symbol}</a>
        ${stock.custom ? '<span class="custom-tag" title="Browser import">★</span>' : ""}
      </td>
      <td class="name-cell">${escapeHtml(stock.name)}</td>
      <td><span class="cat-badge cat-${stock.category}">${CAT_LABEL[stock.category] ?? stock.category}</span></td>
      <td class="tags-cell">${renderTagsHtml(stock)}</td>
      <td class="num mono">${fmtPrice(price)}</td>
      <td class="num">${chgHtml}</td>
      <td class="num mono">${stock.targetPrice != null ? fmtPrice(stock.targetPrice) : "—"}</td>
      <td class="num dist-cell">
        <span class="dist ${distCls}">${distText}</span>
        ${distanceBar(dist)}
      </td>
      <td class="note-cell">${escapeHtml(stock.thesis ?? stock.targetNote ?? "—")}</td>
      <td>${renderPriority(stock)}</td>
      <td class="row-actions">
        <button type="button" class="btn-icon expand-btn" aria-label="Toggle details" data-expand="${stock.id}">${expanded ? "−" : "+"}</button>
      </td>
    </tr>
    ${
      expanded
        ? `<tr class="detail-row" data-detail-for="${stock.id}">
        <td colspan="11">
          <div class="detail-panel">
            ${stock.sector ? `<p><strong>Sector:</strong> ${escapeHtml(stock.sector)}</p>` : ""}
            ${stock.thesis ? `<p><strong>Thesis:</strong> ${escapeHtml(stock.thesis)}</p>` : ""}
            ${stock.targetNote ? `<p><strong>Target note:</strong> ${escapeHtml(stock.targetNote)}</p>` : ""}
            <p><strong>Holder:</strong> ${escapeHtml(stock.holder ?? stock.addedBy ?? "—")}</p>
            <a href="${yahooUrl(stock.symbol)}" target="_blank" rel="noopener noreferrer">View on Yahoo Finance →</a>
          </div>
        </td>
      </tr>`
        : ""
    }
  `;
}

function renderTableHtml(stocks: StockRow[]) {
  if (!stocks.length) {
    return `<tr><td colspan="11" class="empty-row">No tickers match your filters.</td></tr>`;
  }
  return stocks.map((s) => renderRow(s)).join("");
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

  el.innerHTML = `
    <div class="overview-card"><span class="ov-value">${allStocks.length}</span><span class="ov-label">Total</span></div>
    <div class="overview-card"><span class="ov-value">${allStocks.filter((s) => s.category === "owned").length}</span><span class="ov-label">Owned</span></div>
    <div class="overview-card"><span class="ov-value">${allStocks.filter((s) => s.category === "targets").length}</span><span class="ov-label">Targets</span></div>
    <div class="overview-card"><span class="ov-value">${allStocks.filter((s) => s.category === "watching").length}</span><span class="ov-label">Watching</span></div>
    <div class="overview-card highlight"><span class="ov-value">${atTarget}</span><span class="ov-label">At target</span></div>
    <div class="overview-card highlight"><span class="ov-value">${within5}</span><span class="ov-label">Within 5%</span></div>
    <div class="overview-card"><span class="ov-value">${within10}</span><span class="ov-label">Within 10%</span></div>
    <div class="overview-card"><span class="ov-value">${tags.size}</span><span class="ov-label">Themes</span></div>
  `;
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
      return `<button type="button" class="opp-chip ${cls}" data-jump="${stock.symbol}" title="${escapeHtml(stock.thesis ?? "")}">
        <strong>${stock.symbol}</strong>
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
      const chgCls = chg != null ? (chg >= 0 ? "up" : "down") : "dim";
      const chgTxt = chg != null ? `${chg >= 0 ? "+" : ""}${chg.toFixed(2)}%` : "—";
      return `<article class="held-card" data-symbol="${stock.symbol}">
        <div class="held-top">
          <a href="${yahooUrl(stock.symbol)}" target="_blank" rel="noopener noreferrer" class="held-sym">${stock.symbol}</a>
          ${stock.priority === "high" ? '<span class="held-conviction">High conviction</span>' : ""}
        </div>
        <div class="held-name">${escapeHtml(stock.name)}</div>
        <div class="held-price mono">${fmtPrice(price)} <span class="chg ${chgCls}">${chgTxt}</span></div>
        <p class="held-thesis">${escapeHtml(stock.thesis ?? "")}</p>
        <div class="held-tags">${renderTagsHtml(stock)}</div>
      </article>`;
    })
    .join("");
}

function renderPagination(total: number) {
  const el = document.getElementById("pagination");
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
  if (!wrap || !tableWrap) return;

  wrap.hidden = false;
  tableWrap.hidden = true;

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

function tableHead() {
  return `<tr>
    <th>Symbol</th><th>Name</th><th>Bucket</th><th>Tags</th>
    <th class="num">Price</th><th class="num">Chg</th><th class="num">Target</th>
    <th class="num">Distance</th><th>Thesis</th><th>Priority</th><th></th>
  </tr>`;
}

function renderTableView(list: StockRow[]) {
  const wrap = document.getElementById("bucket-view");
  const tableWrap = document.getElementById("table-view");
  const tbody = document.getElementById("watchlist-tbody");
  const countEl = document.getElementById("result-count");
  if (!tbody || !tableWrap) return;

  if (wrap) wrap.hidden = true;
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

function renderAll() {
  const list = filteredStocks();
  renderOverview();
  renderTagFilters();
  renderOpportunities();
  renderHeldStrip();

  if (viewMode === "buckets") {
    renderBucketView(list);
  } else {
    renderTableView(list);
  }
}

function parseImportCsv(text: string): StockRow[] {
  const lines = text.split(/\r?\n/).map((l) => l.trim()).filter(Boolean);
  if (!lines.length) return [];

  const first = lines[0].toLowerCase();
  const hasHeader = first.includes("symbol");
  const dataLines = hasHeader ? lines.slice(1) : lines;

  const split = (line: string) => {
    const out: string[] = [];
    let cur = "";
    let q = false;
    for (const ch of line) {
      if (ch === '"') { q = !q; continue; }
      if (ch === "," && !q) { out.push(cur); cur = ""; continue; }
      cur += ch;
    }
    out.push(cur);
    return out.map((s) => s.trim());
  };

  const rows = hasHeader
    ? (() => {
        const headers = lines[0].split(",").map((h) => h.trim().toLowerCase());
        return dataLines.map((line) => {
          const cols = split(line);
          const row: Record<string, string> = {};
          headers.forEach((h, i) => { row[h] = cols[i] ?? ""; });
          return row;
        });
      })()
    : dataLines.map((line) => {
        const cols = split(line);
        if (cols.length === 1) return { symbol: cols[0] };
        return {
          symbol: cols[0],
          name: cols[1],
          category: cols[2],
          targetprice: cols[3],
          thesis: cols[4],
          addedby: cols[5],
        };
      });

  const cats = new Set(["owned", "targets", "watching"]);
  return rows
    .map((row) => {
      const symbol = (row.symbol ?? "").toUpperCase();
      if (!symbol) return null;
      const category = (row.category ?? "watching").toLowerCase();
      const cat = cats.has(category) ? category : "watching";
      const tp = row.targetprice ?? row.target_price;
      const stock: StockRow = {
        id: `custom-${symbol.toLowerCase()}-${cat}`,
        symbol,
        name: row.name || symbol,
        category: cat,
        custom: true,
      };
      if (tp !== "" && tp != null) stock.targetPrice = Number(tp);
      if (row.thesis) stock.thesis = row.thesis;
      if (row.targetnote) stock.targetNote = row.targetnote;
      if (row.addedby) stock.addedBy = row.addedby;
      if (row.holder) stock.holder = row.holder;
      if (row.sector) stock.sector = row.sector;
      if (row.priority) stock.priority = row.priority;
      if (row.tags) {
        stock.tags = row.tags.split(/[;|]/).map((t) => t.trim()).filter(Boolean);
      }
      return stock;
    })
    .filter(Boolean) as StockRow[];
}

function exportCsv() {
  const header = "symbol,name,category,sector,tags,targetPrice,targetNote,thesis,priority,addedBy,holder";
  const rows = allStocks.map((s) =>
    [
      s.symbol,
      s.name,
      s.category,
      s.sector ?? "",
      (s.tags ?? []).join(";"),
      s.targetPrice ?? "",
      s.targetNote ?? "",
      s.thesis ?? "",
      s.priority ?? "",
      s.addedBy ?? "",
      s.holder ?? "",
    ]
      .map((v) => `"${String(v).replace(/"/g, '""')}"`)
      .join(",")
  );
  const blob = new Blob([[header, ...rows].join("\n")], { type: "text/csv" });
  const a = document.createElement("a");
  a.href = URL.createObjectURL(blob);
  a.download = "watchlist-export.csv";
  a.click();
}

function bindEvents() {
  document.getElementById("search-input")?.addEventListener("input", (e) => {
    search = (e.target as HTMLInputElement).value.trim();
    page = 1;
    renderAll();
  });

  document.getElementById("filter-chips")?.addEventListener("click", (e) => {
    const btn = (e.target as HTMLElement).closest("[data-filter]");
    if (!btn) return;
    filter = btn.getAttribute("data-filter") ?? "all";
    document.querySelectorAll(".filter-chips .chip[data-filter]").forEach((c) => c.classList.remove("active"));
    btn.classList.add("active");
    page = 1;
    savePrefs();
    renderAll();
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

  document.getElementById("view-table")?.addEventListener("click", () => {
    viewMode = "table";
    document.getElementById("view-table")?.classList.add("active");
    document.getElementById("view-buckets")?.classList.remove("active");
    savePrefs();
    renderAll();
  });

  document.getElementById("view-buckets")?.addEventListener("click", () => {
    viewMode = "buckets";
    document.getElementById("view-buckets")?.classList.add("active");
    document.getElementById("view-table")?.classList.remove("active");
    savePrefs();
    renderAll();
  });

  document.getElementById("toggle-import")?.addEventListener("click", () => {
    const panel = document.getElementById("import-panel");
    if (panel) panel.hidden = !panel.hidden;
  });

  document.getElementById("import-apply")?.addEventListener("click", async () => {
    const text = (document.getElementById("import-text") as HTMLTextAreaElement).value;
    const parsed = parseImportCsv(text).map((s) => ({ ...s, custom: true }));
    if (!parsed.length) {
      alert("Nothing to import — check your format.");
      return;
    }
    const existing = await getCustomStocks();
    const merged = mergeStocks(existing, parsed);
    await setCustomStocks(merged);
    allStocks = mergeStocks(baseStocks, merged);
    (document.getElementById("import-text") as HTMLTextAreaElement).value = "";
    renderAll();
  });

  document.getElementById("import-clear")?.addEventListener("click", async () => {
    if (!confirm("Remove all tickers you imported in this browser?")) return;
    await setCustomStocks([]);
    allStocks = mergeStocks(baseStocks, []);
    renderAll();
  });

  document.getElementById("export-csv")?.addEventListener("click", exportCsv);

  document.getElementById("opp-chips")?.addEventListener("click", (e) => {
    const btn = (e.target as HTMLElement).closest("[data-jump]");
    if (!btn) return;
    const sym = btn.getAttribute("data-jump")!;
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
    document.querySelector(`tr[data-symbol="${sym}"]`)?.scrollIntoView({ behavior: "smooth", block: "center" });
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

  document.addEventListener("keydown", (e) => {
    if (e.key === "/" && document.activeElement?.tagName !== "INPUT" && document.activeElement?.tagName !== "TEXTAREA") {
      e.preventDefault();
      (document.getElementById("search-input") as HTMLInputElement)?.focus();
    }
  });

  document.addEventListener("radar:quotes", ((e: CustomEvent) => {
    quotes = { ...quotes, ...e.detail };
    renderAll();
  }) as EventListener);
}

export async function initWatchlistBoard(stocksJson: string) {
  const prefs = loadPrefs();
  if (prefs.viewMode) viewMode = prefs.viewMode;
  if (prefs.pageSize) pageSize = prefs.pageSize;
  if (prefs.sortKey) sortKey = prefs.sortKey;
  if (prefs.filter) filter = prefs.filter;

  baseStocks = JSON.parse(stocksJson);
  const custom = await getCustomStocks();
  allStocks = mergeStocks(baseStocks, custom);

  if (viewMode === "buckets") {
    document.getElementById("view-buckets")?.classList.add("active");
    document.getElementById("view-table")?.classList.remove("active");
  } else {
    document.getElementById("view-table")?.classList.add("active");
    document.getElementById("view-buckets")?.classList.remove("active");
  }

  if (prefs.filter) {
    document.querySelectorAll(".filter-chips .chip[data-filter]").forEach((c) => {
      c.classList.toggle("active", c.getAttribute("data-filter") === prefs.filter);
    });
  }

  bindEvents();
  renderAll();
}

export function initBucketSections() {
  /* buckets rendered by initWatchlistBoard */
}
