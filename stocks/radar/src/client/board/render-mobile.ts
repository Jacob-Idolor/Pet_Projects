import { escapeHtml, sanitizeId, sanitizePriority, sanitizeSymbol, yahooUrl } from "../../lib/format";
import {
  fmtPrice,
  athIndicator,
  actionBadge,
  renderOutlookDetail,
  renderTechnicalDetail,
} from "../../lib/market-display";
import {
  type StockRow,
  state,
  getPrice,
  getQuote,
  getChange,
  sortStocks,
  stockBias,
  biasOpts,
  renderDcLayerBadge,
  renderDcDetail,
  outlookFor,
} from "./state";

export function isMobileLayout() {
  return window.matchMedia("(max-width: 640px)").matches;
}

export function syncLayoutClass() {
  document.body.classList.toggle("layout-mobile", isMobileLayout());
}

function mobileDetail(stock: StockRow) {
  const price = getPrice(stock);
  const q = getQuote(stock);
  const sym = sanitizeSymbol(stock.symbol) || escapeHtml(String(stock.symbol ?? ""));
  return `<div class="scm-detail">
    ${renderOutlookDetail(outlookFor(stock))}
    ${renderDcDetail(stock)}
    ${stock.sector ? `<p><strong>Sector:</strong> ${escapeHtml(stock.sector)}</p>` : ""}
    ${renderTechnicalDetail(q, price)}
    <a class="scm-yahoo" href="${yahooUrl(sym)}" target="_blank" rel="noopener noreferrer">Yahoo Finance →</a>
  </div>`;
}

export function renderMobileCard(stock: StockRow) {
  const price = getPrice(stock);
  const chg = getChange(stock);
  const q = getQuote(stock);
  const chgCls = chg != null ? (chg >= 0 ? "up" : "down") : "dim";
  const chgTxt = chg != null ? `${chg >= 0 ? "+" : ""}${chg.toFixed(2)}%` : "—";

  const high = sanitizePriority(stock.priority) === "high";
  const action = stockBias(stock);
  const sym = sanitizeSymbol(stock.symbol) || escapeHtml(String(stock.symbol ?? ""));
  const sid = sanitizeId(stock.id) || escapeHtml(String(stock.id ?? ""));
  const expanded = state.expandedId === stock.id;

  return `<article class="stock-card-m ${high ? "scm-high" : ""} ${expanded ? "is-expanded" : ""} action-card-${escapeHtml(action.cls)}" data-symbol="${sym}">
    <button type="button" class="scm-main" data-expand="${sid}" aria-expanded="${expanded}" aria-label="${expanded ? "Collapse" : "Expand"} ${sym} details">
      <div class="scm-top">
        <div class="scm-identity">
          <span class="scm-sym">${sym}</span>
          ${high ? '<span class="scm-conviction">High</span>' : ""}
          ${actionBadge(q, biasOpts(stock))}
          ${renderDcLayerBadge(stock)}
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
      <span class="scm-expand-hint">${expanded ? "Hide details" : "Show PE, headlines & target"}</span>
    </button>
    ${expanded ? mobileDetail(stock) : ""}
  </article>`;
}

export function renderMobileView(list: StockRow[]) {
  const mobileEl = document.getElementById("mobile-stock-list");
  const tableWrap = document.getElementById("table-view");
  const techWrap = document.getElementById("technical-view");

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
      : `<p class="mobile-empty">No tickers match your filters.</p>`;
  return true;
}
