import { escapeHtml, sanitizePriority, sanitizeSymbol, yahooUrl } from "../../lib/format";
import {
  fmtPrice,
  athIndicator,
  actionBadge,
} from "../../lib/market-display";
import {
  type StockRow,
  getPrice,
  getQuote,
  getChange,
  sortStocks,
  stockBias,
  biasOpts,
  renderDcLayerBadge,
} from "./state";

export function isMobileLayout() {
  return window.matchMedia("(max-width: 640px)").matches;
}

export function syncLayoutClass() {
  document.body.classList.toggle("layout-mobile", isMobileLayout());
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
  return `<article class="stock-card-m ${high ? "scm-high" : ""} action-card-${escapeHtml(action.cls)}" data-symbol="${sym}">
    <a href="${yahooUrl(sym)}" target="_blank" rel="noopener noreferrer" class="scm-main">
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
    </a>
  </article>`;
}

export function renderMobileView(list: StockRow[]) {
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
