// src/lib/format.ts
function escapeHtml(text) {
  return text.replace(/&/g, "&amp;").replace(/</g, "&lt;").replace(/>/g, "&gt;").replace(/"/g, "&quot;");
}
function yahooUrl(symbol) {
  return `https://finance.yahoo.com/quote/${encodeURIComponent(symbol)}`;
}

// src/lib/market-display.ts
function fmtPrice(v) {
  if (v == null || Number.isNaN(v)) return "\u2014";
  return v.toLocaleString("en-US", { style: "currency", currency: "USD", minimumFractionDigits: 2 });
}
function fmtPct(v, signed = true) {
  if (v == null || Number.isNaN(v)) return "\u2014";
  const sign = signed && v > 0 ? "+" : "";
  return `${sign}${v.toFixed(1)}%`;
}
function fmtVolume(v) {
  if (v == null) return "\u2014";
  if (v >= 1e9) return `${(v / 1e9).toFixed(1)}B`;
  if (v >= 1e6) return `${(v / 1e6).toFixed(1)}M`;
  if (v >= 1e3) return `${(v / 1e3).toFixed(1)}K`;
  return String(Math.round(v));
}
function rsiLabel(rsi) {
  if (rsi == null) return { text: "\u2014", cls: "neutral" };
  if (rsi >= 70) return { text: `${rsi.toFixed(0)} overbought`, cls: "hot" };
  if (rsi <= 30) return { text: `${rsi.toFixed(0)} oversold`, cls: "cold" };
  return { text: rsi.toFixed(0), cls: "neutral" };
}
function trendBadge(trend) {
  const t = trend ?? "unknown";
  const labels = {
    bullish: "Bullish",
    bearish: "Bearish",
    mixed: "Mixed",
    unknown: "\u2014"
  };
  return `<span class="trend-badge trend-${t}">${labels[t]}</span>`;
}
function maCell(price, ma, vs) {
  if (ma == null) return `<span class="dim">\u2014</span>`;
  const above = price != null && price >= ma;
  const cls = above ? "ma-above" : "ma-below";
  const vsTxt = vs != null ? `<span class="ma-vs ${cls}">${fmtPct(vs)}</span>` : "";
  return `<span class="mono ${cls}">${fmtPrice(ma)}</span>${vsTxt ? ` ${vsTxt}` : ""}`;
}
function rangeBar(range52Pct, low, high) {
  if (range52Pct == null) return "";
  const pos = Math.max(0, Math.min(100, range52Pct));
  let zone = "mid";
  if (pos <= 15) zone = "low";
  else if (pos >= 85) zone = "high";
  const hint = low != null && high != null ? `${fmtPrice(low)} \u2013 ${fmtPrice(high)} \xB7 ${pos.toFixed(0)}% of range` : `${pos.toFixed(0)}% of 52w range`;
  return `<div class="range-bar" title="${escapeHtml(hint)}"><div class="range-bar-track"><div class="range-bar-marker zone-${zone}" style="left:${pos}%"></div></div><span class="range-bar-label">${pos.toFixed(0)}%</span></div>`;
}
function athIndicator(q) {
  if (q?.athHigh == null || q?.pctFromAth == null) {
    return `<span class="dim">\u2014</span>`;
  }
  const pct = q.pctFromAth;
  const athTitle = q.athDate ? `All-time high ${fmtPrice(q.athHigh)} (${q.athDate})` : `All-time high ${fmtPrice(q.athHigh)}`;
  if (pct >= -0.5) {
    return `<span class="ath-badge ath-at" title="${escapeHtml(athTitle)}">ATH</span>`;
  }
  if (pct >= -5) {
    return `<span class="ath-badge ath-near" title="${escapeHtml(athTitle)}">Near ATH</span>`;
  }
  return `<span class="ath-badge ath-below" title="${escapeHtml(athTitle)}">${fmtPct(pct)} from ATH</span>`;
}
function hasTechnical(q) {
  return Boolean(q?.sma || q?.range52Pct != null || q?.rsi14 != null);
}
function renderTechnicalDetail(q, price) {
  if (!hasTechnical(q)) {
    return `<p class="tech-unavailable">Technical data refreshes on deploy \u2014 run <code>npm run update-quotes</code> locally or wait for CI.</p>`;
  }
  const rsi = rsiLabel(q?.rsi14);
  const volNote = q?.volRatio != null ? `${fmtVolume(q.volume)} (${q.volRatio.toFixed(1)}\xD7 20d avg)` : q?.volume != null ? fmtVolume(q.volume) : "\u2014";
  const rows = [20, 50, 200].map((p) => {
    const ma = q?.sma?.[p];
    const vs = q?.vsSma?.[p];
    if (ma == null) return "";
    const above = price != null && price >= ma;
    return `<tr><td>SMA ${p}</td><td class="mono">${fmtPrice(ma)}</td><td class="${above ? "ma-above" : "ma-below"}">${vs != null ? fmtPct(vs) : "\u2014"}</td></tr>`;
  }).filter(Boolean).join("");
  const action = actionBias(q);
  return `
    <div class="tech-detail">
      <h4>Technical snapshot</h4>
      <div class="tech-summary-row">
        ${actionBadge(q)}
        ${trendBadge(q?.trend)}
        <span class="rsi-badge rsi-${rsi.cls}">RSI(14) ${escapeHtml(rsi.text)}</span>
        ${q?.signals?.length ? `<span class="signal-tags">${q.signals.slice(0, 4).map((s) => `<span class="signal-tag">${escapeHtml(s.replace(/-/g, " "))}</span>`).join("")}</span>` : ""}
      </div>
      <p class="action-reason">${escapeHtml(action.reason)}</p>
      <table class="tech-table"><tbody>${rows}</tbody></table>
      <div class="tech-range">
        <span class="tech-label">52-week range</span>
        ${rangeBar(q?.range52Pct, q?.low52, q?.high52)}
        <span class="tech-range-bounds">${fmtPrice(q?.low52)} \u2013 ${fmtPrice(q?.high52)}</span>
      </div>
      <div class="tech-ath">
        <span class="tech-label">All-time high</span>
        ${athIndicator(q)}
        ${q?.athHigh != null ? `<span class="tech-ath-level">${fmtPrice(q.athHigh)}${q.athDate ? ` \xB7 ${q.athDate}` : ""}</span>` : ""}
      </div>
      <p class="tech-vol"><strong>Volume:</strong> ${volNote}</p>
    </div>`;
}
function actionBias(q) {
  if (!q || q.price == null) {
    return { label: "\u2014", cls: "idle", reason: "Waiting on quotes", score: 0 };
  }
  let score = 0;
  const bits = [];
  if (q.rsi14 != null && q.rsi14 <= 30) {
    score += 2;
    bits.push("RSI oversold");
  } else if (q.rsi14 != null && q.rsi14 <= 40) {
    score += 1;
    bits.push("RSI soft");
  } else if (q.rsi14 != null && q.rsi14 >= 70) {
    score -= 2;
    bits.push("RSI overbought");
  } else if (q.rsi14 != null && q.rsi14 >= 65) {
    score -= 1;
    bits.push("RSI elevated");
  }
  if (q.range52Pct != null && q.range52Pct <= 20) {
    score += 1;
    bits.push("near 52w low");
  } else if (q.range52Pct != null && q.range52Pct >= 85) {
    score -= 1;
    bits.push("near 52w high");
  }
  if (q.pctFromAth != null && q.pctFromAth >= -3) {
    score -= 1;
    bits.push("near ATH");
  }
  if (q.trend === "bullish") {
    score += 1;
    bits.push("bullish trend");
  } else if (q.trend === "bearish") {
    score -= 1;
    bits.push("bearish trend");
  }
  if (q.signals?.includes("deep-below-50")) {
    score += 1;
    bits.push("deep below SMA50");
  }
  if (q.signals?.includes("extended-above-50")) {
    score -= 1;
    bits.push("extended above SMA50");
  }
  const reason = bits.length ? bits.slice(0, 3).join(" \xB7 ") : "Neutral setup";
  if (score >= 2) return { label: "Lean buy", cls: "buy", reason, score };
  if (score <= -2) return { label: "Lean sell", cls: "sell", reason, score };
  return { label: "Watch", cls: "watch", reason, score };
}
function actionBadge(q) {
  const a = actionBias(q);
  return `<span class="action-badge action-${a.cls}" title="${escapeHtml(a.reason)}">${escapeHtml(a.label)}</span>`;
}
function matchesTechnicalFilter(filter2, q, price) {
  if (!filter2.startsWith("tech-")) return true;
  if (!q) return false;
  switch (filter2) {
    case "tech-above-50":
      return q.sma?.[50] != null && price != null && price > q.sma[50];
    case "tech-below-50":
      return q.sma?.[50] != null && price != null && price < q.sma[50];
    case "tech-above-200":
      return q.sma?.[200] != null && price != null && price > q.sma[200];
    case "tech-below-200":
      return q.sma?.[200] != null && price != null && price < q.sma[200];
    case "tech-bullish":
      return q.trend === "bullish";
    case "tech-bearish":
      return q.trend === "bearish";
    case "tech-near-low":
      return q.range52Pct != null && q.range52Pct <= 20;
    case "tech-near-high":
      return q.range52Pct != null && q.range52Pct >= 80;
    case "tech-near-ath":
      return q.pctFromAth != null && q.pctFromAth >= -5;
    case "tech-at-ath":
      return q.pctFromAth != null && q.pctFromAth >= -0.5;
    case "tech-oversold":
      return q.rsi14 != null && q.rsi14 <= 35;
    case "tech-overbought":
      return q.rsi14 != null && q.rsi14 >= 65;
    default:
      return true;
  }
}

// src/scripts/watchlist-board.ts
var CUSTOM_STORE = "stocks-radar-custom";
var CUSTOM_KEY = "entries";
var PREFS_KEY = "stocks-radar-prefs";
var baseStocks = [];
var allStocks = [];
var quotes = {};
var filter = "all";
var tagFilter = null;
var search = "";
var sortKey = "symbol";
var sortDir = 1;
var viewMode = "table";
var page = 1;
var pageSize = 50;
var expandedId = null;
function loadPrefs() {
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
function openCustomDb() {
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
async function getCustomStocks() {
  try {
    const db = await openCustomDb();
    return new Promise((resolve, reject) => {
      const tx = db.transaction("kv", "readonly");
      const req = tx.objectStore("kv").get(CUSTOM_KEY);
      req.onsuccess = () => resolve(req.result ?? []);
      req.onerror = () => reject(req.error);
    });
  } catch {
    return [];
  }
}
async function setCustomStocks(entries) {
  const db = await openCustomDb();
  return new Promise((resolve, reject) => {
    const tx = db.transaction("kv", "readwrite");
    tx.objectStore("kv").put(entries, CUSTOM_KEY);
    tx.oncomplete = () => resolve();
    tx.onerror = () => reject(tx.error);
  });
}
function mergeStocks(base, custom) {
  const map = /* @__PURE__ */ new Map();
  for (const s of base) map.set(s.symbol, s);
  for (const s of custom) map.set(s.symbol, s);
  return [...map.values()];
}
async function savePriceTarget(symbol, targetPrice, opts) {
  const sym = symbol.toUpperCase().replace(/^\$/, "");
  if (!sym || !targetPrice || targetPrice <= 0) return false;
  const existing = allStocks.find((s) => s.symbol === sym);
  const q = quotes[sym];
  const stock = {
    id: `custom-${sym.toLowerCase()}`,
    symbol: sym,
    name: opts?.name ?? q?.name ?? existing?.name ?? sym,
    category: "tracking",
    targetPrice,
    custom: true,
    sector: existing?.sector,
    tags: existing?.tags,
    priority: existing?.priority ?? "medium"
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
function getQuote(stock) {
  return quotes[stock.symbol];
}
function getPrice(stock) {
  return quotes[stock.symbol]?.price ?? stock.lastPrice ?? null;
}
function getChange(stock) {
  const q = quotes[stock.symbol];
  if (q?.changePct != null) return q.changePct;
  const price = getPrice(stock);
  const prev = q?.prevClose;
  if (price != null && prev != null && prev !== 0) {
    return (price - prev) / prev * 100;
  }
  return null;
}
function getDistance(stock) {
  const price = getPrice(stock);
  if (price == null || stock.targetPrice == null || stock.targetPrice === 0) return null;
  return (price - stock.targetPrice) / stock.targetPrice * 100;
}
function distanceLabel(pct) {
  if (pct == null) return { text: "\u2014", cls: "" };
  const abs = Math.abs(pct);
  if (abs < 0.5) return { text: "At target", cls: "at" };
  if (pct > 0) return { text: `+${abs.toFixed(1)}%`, cls: "above" };
  return { text: `-${abs.toFixed(1)}%`, cls: "below" };
}
function matchesFilter(stock) {
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
function matchesSearch(stock) {
  if (!search) return true;
  const q = search.toLowerCase();
  return stock.symbol.toLowerCase().includes(q) || (stock.name ?? "").toLowerCase().includes(q) || (stock.thesis ?? "").toLowerCase().includes(q) || (stock.targetNote ?? "").toLowerCase().includes(q) || (stock.sector ?? "").toLowerCase().includes(q) || (stock.tags ?? []).some((t) => t.toLowerCase().includes(q));
}
function sortStocks(list) {
  const sorted = [...list];
  sorted.sort((a, b) => {
    let av;
    let bv;
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
        return sortDir * (av - bv);
      case "target":
        av = a.targetPrice ?? -Infinity;
        bv = b.targetPrice ?? -Infinity;
        return sortDir * (av - bv);
      case "distance": {
        const da = getDistance(a);
        const db = getDistance(b);
        if (da == null && db == null) return a.symbol.localeCompare(b.symbol);
        if (da == null) return 1;
        if (db == null) return -1;
        return sortDir * (Math.abs(da) - Math.abs(db));
      }
      case "priority": {
        const order = { high: 0, medium: 1, low: 2 };
        av = order[a.priority ?? ""] ?? 3;
        bv = order[b.priority ?? ""] ?? 3;
        return sortDir * (av - bv);
      }
      case "by":
        return sortDir * (a.holder ?? a.addedBy ?? "").localeCompare(b.holder ?? b.addedBy ?? "");
      case "vs50":
        av = getQuote(a)?.vsSma?.[50] ?? -Infinity;
        bv = getQuote(b)?.vsSma?.[50] ?? -Infinity;
        return sortDir * (av - bv);
      case "vs20":
        av = getQuote(a)?.vsSma?.[20] ?? -Infinity;
        bv = getQuote(b)?.vsSma?.[20] ?? -Infinity;
        return sortDir * (av - bv);
      case "vs200":
        av = getQuote(a)?.vsSma?.[200] ?? -Infinity;
        bv = getQuote(b)?.vsSma?.[200] ?? -Infinity;
        return sortDir * (av - bv);
      case "range52":
        av = getQuote(a)?.range52Pct ?? -Infinity;
        bv = getQuote(b)?.range52Pct ?? -Infinity;
        return sortDir * (av - bv);
      case "ath":
        av = getQuote(a)?.pctFromAth ?? -Infinity;
        bv = getQuote(b)?.pctFromAth ?? -Infinity;
        return sortDir * (av - bv);
      case "rsi":
        av = getQuote(a)?.rsi14 ?? -Infinity;
        bv = getQuote(b)?.rsi14 ?? -Infinity;
        return sortDir * (av - bv);
      case "trend": {
        const order = { bullish: 0, mixed: 1, bearish: 2, unknown: 3 };
        av = order[getQuote(a)?.trend ?? "unknown"] ?? 4;
        bv = order[getQuote(b)?.trend ?? "unknown"] ?? 4;
        return sortDir * (av - bv);
      }
      case "action": {
        const order = { buy: 0, watch: 1, sell: 2, idle: 3 };
        av = order[actionBias(getQuote(a)).cls] ?? 4;
        bv = order[actionBias(getQuote(b)).cls] ?? 4;
        return sortDir * (av - bv);
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
function renderPriority(stock) {
  if (!stock.priority) return "\u2014";
  return `<span class="priority priority-${stock.priority}">${stock.priority}</span>`;
}
function renderRow(stock, compact = false, mode = "default") {
  const price = getPrice(stock);
  const q = getQuote(stock);
  const chg = getChange(stock);
  const dist = getDistance(stock);
  const { text: distText, cls: distCls } = distanceLabel(dist);
  const chgHtml = chg != null ? `<span class="chg ${chg >= 0 ? "up" : "down"}">${chg >= 0 ? "+" : ""}${chg.toFixed(2)}%</span>` : `<span class="chg dim">\u2014</span>`;
  const expanded = expandedId === stock.id;
  const atTarget = dist != null && Math.abs(dist) < 0.5;
  if (mode === "technical") {
    const rsi = rsiLabel(q?.rsi14);
    return `
    <tr data-id="${stock.id}" data-symbol="${stock.symbol}" class="data-row ${expanded ? "expanded" : ""}">
      <td class="mono sym sticky-col">
        <a href="${yahooUrl(stock.symbol)}" target="_blank" rel="noopener noreferrer" class="sym-link">${stock.symbol}</a>
      </td>
      <td class="name-cell">${escapeHtml(stock.name)}</td>
      <td class="num mono price-cell" data-price-for="${stock.symbol}">${fmtPrice(price)}</td>
      <td class="num">${chgHtml}</td>
      <td>${actionBadge(q)}</td>
      <td>${trendBadge(q?.trend)}</td>
      <td class="num">${maCell(price, q?.sma?.[50], q?.vsSma?.[50])}</td>
      <td class="range-cell">${rangeBar(q?.range52Pct, q?.low52, q?.high52)}</td>
      <td class="num"><span class="rsi-badge rsi-${rsi.cls}">${rsi.text}</span></td>
      <td class="row-actions">
        <button type="button" class="btn-icon expand-btn" aria-label="Toggle details" data-expand="${stock.id}">${expanded ? "\u2212" : "+"}</button>
      </td>
    </tr>
    ${expanded ? renderDetailRow(stock, price, q, 10) : ""}`;
  }
  return `
    <tr data-id="${stock.id}" data-symbol="${stock.symbol}" class="data-row ${atTarget ? "row-at-target" : ""} ${stock.priority === "high" ? "row-high" : ""} ${expanded ? "expanded" : ""}">
      <td class="mono sym sticky-col">
        <a href="${yahooUrl(stock.symbol)}" target="_blank" rel="noopener noreferrer" class="sym-link">${stock.symbol}</a>
        ${stock.priority === "high" ? '<span class="conviction-dot" title="High conviction">\u25CF</span>' : ""}
        ${stock.custom ? '<span class="custom-tag" title="From group notes">\u2605</span>' : ""}
      </td>
      <td class="name-cell">${escapeHtml(stock.name)}</td>
      <td class="num mono price-cell" data-price-for="${stock.symbol}">${fmtPrice(price)}</td>
      <td class="num">${chgHtml}</td>
      <td>${actionBadge(q)}</td>
      <td class="ath-cell">${athIndicator(q)}</td>
      <td class="num mono">${stock.targetPrice != null ? fmtPrice(stock.targetPrice) : "\u2014"}</td>
      <td class="note-cell">${escapeHtml(stock.thesis ?? stock.targetNote ?? "\u2014")}</td>
      <td>${renderPriority(stock)}</td>
      <td class="row-actions">
        <button type="button" class="btn-icon expand-btn" aria-label="Toggle details" data-expand="${stock.id}">${expanded ? "\u2212" : "+"}</button>
      </td>
    </tr>
    ${expanded ? renderDetailRow(stock, price, getQuote(stock), 10) : ""}
  `;
}
function renderDetailRow(stock, price, q, colspan) {
  const ptVal = stock.targetPrice != null ? String(stock.targetPrice) : "";
  return `<tr class="detail-row" data-detail-for="${stock.id}">
        <td colspan="${colspan}">
          <div class="detail-panel">
            ${renderTechnicalDetail(q, price)}
            ${stock.sector ? `<p><strong>Sector:</strong> ${escapeHtml(stock.sector)}</p>` : ""}
            ${stock.thesis ? `<p><strong>Thesis:</strong> ${escapeHtml(stock.thesis)}</p>` : ""}
            ${stock.targetNote ? `<p><strong>Target note:</strong> ${escapeHtml(stock.targetNote)}</p>` : ""}
            <div class="pt-inline" data-pt-inline="${stock.symbol}">
              <strong>Price target:</strong>
              <input type="number" class="pt-inline-price" step="0.01" min="0.01" placeholder="e.g. 18" value="${ptVal}" aria-label="Target price for ${escapeHtml(stock.symbol)}" />
              <button type="button" class="btn btn-ghost btn-sm" data-pt-save="${stock.symbol}">Save to PT list</button>
              ${stock.targetPrice != null ? `<span class="pt-current">Target ${fmtPrice(stock.targetPrice)}</span>` : ""}
            </div>
            <p><strong>Holder:</strong> ${escapeHtml(stock.holder ?? stock.addedBy ?? "\u2014")}</p>
            <a href="${yahooUrl(stock.symbol)}" target="_blank" rel="noopener noreferrer">View on Yahoo Finance \u2192</a>
          </div>
        </td>
      </tr>`;
}
function renderTableHtml(stocks, mode = "default") {
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
  const tags = /* @__PURE__ */ new Set();
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
  const moversEl = document.getElementById("checkin-movers");
  const setupsEl = document.getElementById("checkin-setups");
  const cautionEl = document.getElementById("checkin-caution");
  if (!moversEl && !setupsEl && !cautionEl) return;
  const priced = allStocks.map((s) => {
    const q = getQuote(s);
    const price = getPrice(s);
    const chg = q?.changePct ?? null;
    const bias = actionBias(q);
    return { stock: s, q, price, chg, bias };
  }).filter((x) => x.price != null);
  if (!priced.length) {
    const empty = `<li class="checkin-rank__empty">Waiting on quotes for the master list\u2026</li>`;
    if (moversEl) moversEl.innerHTML = empty;
    if (setupsEl) setupsEl.innerHTML = empty;
    if (cautionEl) cautionEl.innerHTML = empty;
    return;
  }
  const movers = [...priced].filter((x) => x.chg != null).sort((a, b) => Math.abs(b.chg) - Math.abs(a.chg)).slice(0, 10);
  if (moversEl) {
    moversEl.innerHTML = movers.length ? movers.map((x, i) => {
      const up = (x.chg ?? 0) >= 0;
      return `<li class="checkin-rank__row">
              <span class="checkin-rank__n">${i + 1}</span>
              <button type="button" class="checkin-rank__sym" data-jump="${escapeHtml(x.stock.symbol)}">${escapeHtml(x.stock.symbol)}</button>
              <span class="checkin-rank__meta">${escapeHtml(x.stock.name)}</span>
              <span class="checkin-rank__val mono ${up ? "up" : "down"}">${up ? "+" : ""}${(x.chg ?? 0).toFixed(1)}%</span>
            </li>`;
    }).join("") : `<li class="checkin-rank__empty">No % moves yet \u2014 refresh quotes.</li>`;
  }
  const setups = [...priced].filter((x) => x.bias.cls === "buy" || x.bias.score > 0).sort((a, b) => b.bias.score - a.bias.score || (b.chg ?? 0) - (a.chg ?? 0)).slice(0, 10);
  if (setupsEl) {
    setupsEl.innerHTML = setups.length ? setups.map((x, i) => `<li class="checkin-rank__row">
            <span class="checkin-rank__n">${i + 1}</span>
            <button type="button" class="checkin-rank__sym" data-jump="${escapeHtml(x.stock.symbol)}">${escapeHtml(x.stock.symbol)}</button>
            <span class="checkin-rank__meta">${escapeHtml(x.bias.reason)}</span>
            <span class="checkin-rank__val">${actionBadge(x.q)} <span class="mono dim">score ${x.bias.score > 0 ? "+" : ""}${x.bias.score}</span></span>
          </li>`).join("") : `<li class="checkin-rank__empty">No lean-buy setups on the list right now \u2014 check Watch names below.</li>`;
  }
  const caution = [...priced].filter((x) => x.bias.cls === "sell" || x.bias.score < 0).sort((a, b) => a.bias.score - b.bias.score).slice(0, 10);
  if (cautionEl) {
    cautionEl.innerHTML = caution.length ? caution.map((x, i) => `<li class="checkin-rank__row">
            <span class="checkin-rank__n">${i + 1}</span>
            <button type="button" class="checkin-rank__sym" data-jump="${escapeHtml(x.stock.symbol)}">${escapeHtml(x.stock.symbol)}</button>
            <span class="checkin-rank__meta">${escapeHtml(x.bias.reason)}</span>
            <span class="checkin-rank__val">${actionBadge(x.q)} <span class="mono dim">score ${x.bias.score}</span></span>
          </li>`).join("") : `<li class="checkin-rank__empty">Nothing flagged lean-sell \u2014 list looks calm on stretch risk.</li>`;
  }
}
function renderTagFilters() {
  const el = document.getElementById("tag-filters");
  if (!el) return;
  const tags = /* @__PURE__ */ new Set();
  allStocks.forEach((s) => (s.tags ?? []).forEach((t) => tags.add(t)));
  if (!tags.size) {
    el.innerHTML = "";
    return;
  }
  el.innerHTML = `<span class="tag-filter-label">Themes:</span>` + [...tags].sort().map(
    (t) => `<button type="button" class="chip tag-chip ${tagFilter === t ? "active" : ""}" data-tag="${escapeHtml(t)}">${escapeHtml(t)}</button>`
  ).join("") + (tagFilter ? `<button type="button" class="chip tag-clear" data-tag="">Clear</button>` : "");
}
function renderPagination(total) {
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
function renderTechnicalView(list) {
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
    countEl.textContent = total === allStocks.length ? `Technical view \xB7 ${start + 1}\u2013${Math.min(start + pageSize, total)} of ${total}` : `Technical view \xB7 ${start + 1}\u2013${Math.min(start + pageSize, total)} of ${total} (filtered from ${allStocks.length})`;
  }
  tbody.innerHTML = renderTableHtml(pageItems, "technical");
  renderPagination(total);
  document.querySelectorAll("#technical-view th.sortable").forEach((th) => {
    th.classList.toggle("sorted-asc", th.getAttribute("data-sort") === sortKey && sortDir === 1);
    th.classList.toggle("sorted-desc", th.getAttribute("data-sort") === sortKey && sortDir === -1);
  });
}
function renderTableView(list) {
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
    countEl.textContent = total === allStocks.length ? `Showing ${start + 1}\u2013${Math.min(start + pageSize, total)} of ${total}` : `Showing ${start + 1}\u2013${Math.min(start + pageSize, total)} of ${total} (filtered from ${allStocks.length})`;
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
function renderMobileCard(stock) {
  const price = getPrice(stock);
  const chg = getChange(stock);
  const q = getQuote(stock);
  const chgCls = chg != null ? chg >= 0 ? "up" : "down" : "dim";
  const chgTxt = chg != null ? `${chg >= 0 ? "+" : ""}${chg.toFixed(2)}%` : "\u2014";
  const high = stock.priority === "high";
  const action = actionBias(q);
  return `<article class="stock-card-m ${high ? "scm-high" : ""} action-card-${action.cls}" data-symbol="${stock.symbol}">
    <a href="${yahooUrl(stock.symbol)}" target="_blank" rel="noopener noreferrer" class="scm-main">
      <div class="scm-top">
        <div class="scm-identity">
          <span class="scm-sym">${stock.symbol}</span>
          ${high ? '<span class="scm-conviction">High</span>' : ""}
          ${actionBadge(q)}
        </div>
        <div class="scm-quote">
          <span class="scm-price mono" data-price-for="${stock.symbol}">${fmtPrice(price)}</span>
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
function renderMobileView(list) {
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
  mobileEl.innerHTML = sorted.length > 0 ? `<div class="mobile-bucket-cards">${sorted.map(renderMobileCard).join("")}</div>` : `<p class="mobile-empty">No tickers match. Try clearing search.</p>`;
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
function setViewToggle(activeId) {
  ["view-table", "view-technical"].forEach((id) => {
    document.getElementById(id)?.classList.toggle("active", id === activeId);
  });
}
function bindEvents() {
  document.getElementById("search-input")?.addEventListener("input", (e) => {
    search = e.target.value.trim();
    page = 1;
    renderAll();
  });
  document.querySelectorAll(".filter-chips").forEach((container) => {
    container.addEventListener("click", (e) => {
      const btn = e.target.closest("[data-filter]");
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
    const btn = e.target.closest("[data-tag]");
    if (!btn) return;
    const t = btn.getAttribute("data-tag");
    tagFilter = t || null;
    page = 1;
    renderAll();
  });
  document.querySelectorAll("th.sortable").forEach((th) => {
    th.addEventListener("click", () => {
      const key = th.getAttribute("data-sort");
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
    const th = e.target.closest("th.sortable");
    if (!th) return;
    const key = th.getAttribute("data-sort");
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
  function jumpToSymbol(sym) {
    search = sym;
    const input = document.getElementById("search-input");
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
      document.querySelector(`tr[data-symbol="${sym}"], .stock-card-m[data-symbol="${sym}"]`)?.scrollIntoView({ behavior: "smooth", block: "center" });
    });
  }
  document.getElementById("opp-chips")?.addEventListener("click", (e) => {
    const btn = e.target.closest("[data-jump]");
    if (!btn) return;
    jumpToSymbol(btn.getAttribute("data-jump"));
  });
  document.getElementById("checkin")?.addEventListener("click", (e) => {
    const btn = e.target.closest("[data-jump]");
    if (!btn) return;
    jumpToSymbol(btn.getAttribute("data-jump"));
  });
  document.getElementById("watchlist-board")?.addEventListener("change", (e) => {
    if (e.target.id === "page-size-select") {
      pageSize = Number(e.target.value);
      page = 1;
      savePrefs();
      renderAll();
    }
  });
  document.getElementById("watchlist-board")?.addEventListener("click", (e) => {
    const ptSave = e.target.closest("[data-pt-save]");
    if (ptSave) {
      const sym = ptSave.getAttribute("data-pt-save");
      const row = ptSave.closest(".pt-inline");
      const input = row?.querySelector(".pt-inline-price");
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
    const expand = e.target.closest("[data-expand]");
    if (expand) {
      const id = expand.getAttribute("data-expand");
      expandedId = expandedId === id ? null : id;
      renderAll();
      return;
    }
    const pag = e.target.closest("#page-prev, #page-next, #page-size-select");
    if (pag) {
      if (pag.id === "page-prev" && page > 1) page--;
      else if (pag.id === "page-next") page++;
      else return;
      renderAll();
      return;
    }
  });
  document.getElementById("technical-view")?.addEventListener("click", (e) => {
    const expand = e.target.closest("[data-expand]");
    if (expand) {
      const id = expand.getAttribute("data-expand");
      expandedId = expandedId === id ? null : id;
      renderAll();
      return;
    }
    const pag = e.target.closest("#page-prev, #page-next, #page-size-select");
    if (pag) {
      if (pag.id === "page-prev" && page > 1) page--;
      else if (pag.id === "page-next") page++;
      renderAll();
    }
  });
  document.addEventListener("keydown", (e) => {
    if (e.key === "/" && document.activeElement?.tagName !== "INPUT" && document.activeElement?.tagName !== "TEXTAREA") {
      e.preventDefault();
      document.getElementById("search-input")?.focus();
    }
  });
  document.addEventListener("radar:quotes", ((e) => {
    const incoming = e.detail;
    const changed = /* @__PURE__ */ new Map();
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
          void el.offsetWidth;
          el.classList.add("price-flash", dir);
        });
      }
    });
  }));
  document.addEventListener("radar:submission-added", (async (e) => {
    const detail = e.detail;
    const incoming = detail?.stocks;
    if (!incoming?.length) return;
    const baseSymbols = new Set(baseStocks.map((s) => s.symbol));
    const novel = incoming.filter((s) => !baseSymbols.has(s.symbol));
    if (!novel.length) return;
    const existing = await getCustomStocks();
    const merged = mergeStocks(existing, novel);
    await setCustomStocks(merged);
    allStocks = mergeStocks(baseStocks, merged);
    renderAll();
  }));
}
async function initWatchlistBoard(stocksJson) {
  const prefs = loadPrefs();
  if (prefs.pageSize) pageSize = prefs.pageSize;
  if (prefs.sortKey) sortKey = prefs.sortKey;
  if (prefs.filter) filter = prefs.filter;
  baseStocks = JSON.parse(stocksJson);
  const custom = await getCustomStocks();
  allStocks = mergeStocks(baseStocks, custom);
  if (prefs.viewMode === "technical") {
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
  const et = new Date((/* @__PURE__ */ new Date()).toLocaleString("en-US", { timeZone: "America/New_York" }));
  const day = et.getDay();
  if (day === 0 || day === 6) return false;
  const mins = et.getHours() * 60 + et.getMinutes();
  return mins >= 570 && mins < 960;
}
async function fetchOneQuote(symbol, attempt = 0) {
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
      prevClose: m.chartPreviousClose ?? null
    };
  } catch {
    if (attempt < 1) {
      await new Promise((r) => setTimeout(r, 300));
      return fetchOneQuote(symbol, attempt + 1);
    }
    return null;
  }
}
async function fetchQuotesBatched(symbols) {
  const unique = [...new Set(symbols)];
  if (!unique.length) return;
  const out = {};
  for (let i = 0; i < unique.length; i += 8) {
    const chunk = unique.slice(i, i + 8);
    const results = await Promise.all(
      chunk.map(async (s) => {
        const q = await fetchOneQuote(s);
        return q ? [s, q] : null;
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
  const base = document.querySelector("[data-radar-base]")?.dataset.radarBase ?? "/";
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
  }, 6e4);
  document.addEventListener("radar:stale-quotes", () => {
    maybeBrowserFallback(true);
  });
  void symbols;
}
function initBucketSections() {
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
export {
  initBucketSections,
  initWatchlistBoard
};
