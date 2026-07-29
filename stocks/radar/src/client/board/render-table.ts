import { escapeHtml, sanitizeId, sanitizePriority, sanitizeSymbol, yahooUrl } from "../../lib/format";
import {
  type QuoteData,
  fmtPrice,
  trendBadge,
  maCell,
  rangeBar,
  renderMaStrip,
  renderTechnicalDetail,
  renderOutlookDetail,
  hasTechnical,
  rsiLabel,
  athIndicator,
  actionBadge,
} from "../../lib/market-display";
import {
  state,
  type StockRow,
  getPrice,
  getQuote,
  getChange,
  getDistance,
  distanceLabel,
  sortStocks,
  renderTagsHtml,
  renderDcLayerBadge,
  renderDcDetail,
  outlookFor,
  biasOpts,
  stockBias,
  renderPriority,
} from "./state";

export function renderRow(stock: StockRow, compact = false, mode: "default" | "technical" = "default") {
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
  const expanded = state.expandedId === stock.id;
  const atTarget = dist != null && Math.abs(dist) < 0.5;

  if (mode === "technical") {
    const rsi = rsiLabel(q?.rsi14);
    return `
    <tr data-id="${sid}" data-symbol="${sym}" class="data-row ${expanded ? "expanded" : ""}">
      <td class="mono sym sticky-col">
        <a href="${yahooUrl(sym)}" target="_blank" rel="noopener noreferrer" class="sym-link">${sym}</a>
        ${renderDcLayerBadge(stock)}
      </td>
      <td class="name-cell">${escapeHtml(stock.name)}</td>
      <td class="num mono price-cell" data-price-for="${sym}">${fmtPrice(price)}</td>
      <td class="num">${chgHtml}</td>
      <td>${actionBadge(q, biasOpts(stock))}</td>
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
        ${renderDcLayerBadge(stock)}
      </td>
      <td class="name-cell">${escapeHtml(stock.name)}</td>
      <td class="num mono price-cell" data-price-for="${sym}">${fmtPrice(price)}</td>
      <td class="num">${chgHtml}</td>
      <td>${actionBadge(q, biasOpts(stock))}</td>
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

export function renderDetailRow(stock: StockRow, price: number | null, q: QuoteData | undefined, colspan: number) {
  const sym = sanitizeSymbol(stock.symbol) || escapeHtml(String(stock.symbol ?? ""));
  const sid = sanitizeId(stock.id) || escapeHtml(String(stock.id ?? ""));
  const ptVal = stock.targetPrice != null ? String(stock.targetPrice) : "";
  return `<tr class="detail-row" data-detail-for="${sid}">
        <td colspan="${colspan}">
          <div class="detail-panel">
            ${renderOutlookDetail(outlookFor(stock))}
            ${renderDcDetail(stock)}
            ${stock.sector ? `<p><strong>Sector:</strong> ${escapeHtml(stock.sector)}</p>` : ""}
            ${stock.thesis ? `<p><strong>Thesis:</strong> ${escapeHtml(stock.thesis)}</p>` : ""}
            ${stock.targetNote ? `<p><strong>Target note:</strong> ${escapeHtml(stock.targetNote)}</p>` : ""}
            ${renderTechnicalDetail(q, price)}
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

export function renderTableHtml(stocks: StockRow[], mode: "default" | "technical" = "default") {
  if (!stocks.length) {
    const cols = mode === "technical" ? 10 : 10;
    return `<tr><td colspan="${cols}" class="empty-row">No tickers match your filters.</td></tr>`;
  }
  return stocks.map((s) => renderRow(s, false, mode)).join("");
}

export function tableHead(mode: "default" | "technical" = "default") {
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

export function renderOverview() {
  const el = document.getElementById("overview-grid");
  if (!el) return;

  const withTarget = state.allStocks.filter((s) => s.targetPrice != null);
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
  state.allStocks.forEach((s) => (s.tags ?? []).forEach((t) => tags.add(t)));

  let techHtml = "";
  const withTech = state.allStocks.filter((s) => hasTechnical(getQuote(s)));
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

  const leanBuy = state.allStocks.filter((s) => stockBias(s).cls === "buy").length;

  el.innerHTML = `
    <div class="overview-metric"><span class="ov-value">${state.allStocks.length}</span><span class="ov-label">On master list</span></div>
    <div class="overview-metric highlight"><span class="ov-value">${state.allStocks.filter((s) => s.priority === "high").length}</span><span class="ov-label">High conviction</span></div>
    <div class="overview-metric highlight"><span class="ov-value">${leanBuy}</span><span class="ov-label">Lean buy now</span></div>
    ${techHtml}
  `;
}

export function renderTagFilters() {
  const el = document.getElementById("tag-filters");
  if (!el) return;

  const tags = new Set<string>();
  state.allStocks.forEach((s) => (s.tags ?? []).forEach((t) => tags.add(t)));
  if (!tags.size) {
    el.innerHTML = "";
    return;
  }

  el.innerHTML = `<span class="tag-filter-label">Themes:</span>` +
    [...tags]
      .sort()
      .map(
        (t) =>
          `<button type="button" class="chip tag-chip ${state.tagFilter === t ? "active" : ""}" data-tag="${escapeHtml(t)}">${escapeHtml(t)}</button>`
      )
      .join("") +
    (state.tagFilter ? `<button type="button" class="chip tag-clear" data-tag="">Clear</button>` : "");
}

export function renderOpportunities() {
  const chips = document.getElementById("opp-chips");
  if (!chips) return;

  const candidates = state.allStocks
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
        <em>${escapeHtml(text)}</em>
      </button>`;
    })
    .join("");
}

export function renderHeldStrip() {
  const el = document.getElementById("held-strip");
  if (!el) return;

  const owned = sortStocks(state.allStocks.filter((s) => s.category === "owned"));
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

export function renderPagination(total: number) {
  const el = document.getElementById(state.viewMode === "technical" ? "technical-pagination" : "pagination");
  if (!el) return;

  const pages = Math.max(1, Math.ceil(total / state.pageSize));
  if (state.page > pages) state.page = pages;

  el.innerHTML = `
    <div class="page-size">
      <label>Per page
        <select id="page-size-select">
          ${[25, 50, 100, 200].map((n) => `<option value="${n}" ${n === state.pageSize ? "selected" : ""}>${n}</option>`).join("")}
        </select>
      </label>
    </div>
    <div class="page-nav">
      <button type="button" class="btn btn-ghost" id="page-prev" ${state.page <= 1 ? "disabled" : ""}>Prev</button>
      <span>Page ${state.page} of ${pages}</span>
      <button type="button" class="btn btn-ghost" id="page-next" ${state.page >= pages ? "disabled" : ""}>Next</button>
    </div>
  `;
}

export function renderBucketView(list: StockRow[]) {
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

export function renderTechnicalView(list: StockRow[]) {
  const tableWrap = document.getElementById("table-view");
  const techWrap = document.getElementById("technical-view");
  const tbody = document.getElementById("technical-tbody");
  const countEl = document.getElementById("result-count");
  if (!tbody || !techWrap) return;

  if (tableWrap) tableWrap.hidden = true;
  techWrap.hidden = false;

  const total = list.length;
  const start = (state.page - 1) * state.pageSize;
  const pageItems = list.slice(start, start + state.pageSize);

  if (countEl) {
    countEl.textContent =
      total === state.allStocks.length
        ? `Technical view · ${start + 1}–${Math.min(start + state.pageSize, total)} of ${total}`
        : `Technical view · ${start + 1}–${Math.min(start + state.pageSize, total)} of ${total} (filtered from ${state.allStocks.length})`;
  }

  tbody.innerHTML = renderTableHtml(pageItems, "technical");
  renderPagination(total);

  document.querySelectorAll("#technical-view th.sortable").forEach((th) => {
    th.classList.toggle("sorted-asc", th.getAttribute("data-sort") === state.sortKey && state.sortDir === 1);
    th.classList.toggle("sorted-desc", th.getAttribute("data-sort") === state.sortKey && state.sortDir === -1);
  });
}

export function renderTableView(list: StockRow[]) {
  const tableWrap = document.getElementById("table-view");
  const techWrap = document.getElementById("technical-view");
  const tbody = document.getElementById("watchlist-tbody");
  const countEl = document.getElementById("result-count");
  if (!tbody || !tableWrap) return;

  if (techWrap) techWrap.hidden = true;
  tableWrap.hidden = false;

  const total = list.length;
  const start = (state.page - 1) * state.pageSize;
  const pageItems = list.slice(start, start + state.pageSize);

  if (countEl) {
    countEl.textContent =
      total === state.allStocks.length
        ? `Showing ${start + 1}–${Math.min(start + state.pageSize, total)} of ${total}`
        : `Showing ${start + 1}–${Math.min(start + state.pageSize, total)} of ${total} (filtered from ${state.allStocks.length})`;
  }

  tbody.innerHTML = renderTableHtml(pageItems);
  renderPagination(total);

  document.querySelectorAll("th.sortable").forEach((th) => {
    th.classList.toggle("sorted-asc", th.getAttribute("data-sort") === state.sortKey && state.sortDir === 1);
    th.classList.toggle("sorted-desc", th.getAttribute("data-sort") === state.sortKey && state.sortDir === -1);
  });
}
