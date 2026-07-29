// scripts/lib/sanitize.mjs
function escapeHtml(text) {
  return String(text ?? "").replace(/&/g, "&amp;").replace(/</g, "&lt;").replace(/>/g, "&gt;").replace(/"/g, "&quot;").replace(/'/g, "&#39;");
}
function sanitizeSymbol(raw) {
  const s = String(raw ?? "").trim().toUpperCase();
  if (!/^[A-Z0-9.^_-]{1,15}$/.test(s)) return "";
  return s;
}
function sanitizeId(raw) {
  const s = String(raw ?? "").trim();
  if (!/^[a-zA-Z0-9_-]{1,64}$/.test(s)) return "";
  return s;
}
function safeHttpUrl(raw, fallback = "#") {
  const s = String(raw ?? "").trim();
  if (!s) return fallback;
  try {
    const u = new URL(s);
    if (u.protocol !== "http:" && u.protocol !== "https:") return fallback;
    if (u.username || u.password) return fallback;
    return u.href;
  } catch {
  }
  return fallback;
}

// src/lib/format.ts
function sanitizePriority(raw) {
  const s = String(raw ?? "").toLowerCase();
  if (s === "high" || s === "medium" || s === "low") return s;
  return "medium";
}
function yahooUrl(symbol) {
  const sym = sanitizeSymbol(symbol) || "INVALID";
  return `https://finance.yahoo.com/quote/${encodeURIComponent(sym)}`;
}

// scripts/lib/action-bias.mjs
function isPreMomentum(q) {
  if (!q || q.price == null) return false;
  const volQuiet = q.volRatio != null && q.volRatio < 0.75;
  const rsi = q.rsi14;
  const rsiMid = rsi != null && rsi >= 35 && rsi <= 55;
  const vs50 = q.vsSma?.[50];
  const nearOrUnder50 = vs50 != null && vs50 > -12 && vs50 <= 3;
  const range = q.range52Pct;
  const notHigh = range == null || range < 70;
  const notAth = q.pctFromAth == null || q.pctFromAth < -8;
  return Boolean(volQuiet && rsiMid && nearOrUnder50 && notHigh && notAth);
}
function actionBias(q, opts = {}) {
  if (!q || q.price == null) {
    return { label: "\u2014", cls: "idle", reason: "Waiting on quotes", score: 0, setup: "idle" };
  }
  let score = 0;
  const bits = [];
  if (q.rsi14 != null && q.rsi14 <= 30) {
    score += 3;
    bits.push("RSI oversold (+3)");
  } else if (q.rsi14 != null && q.rsi14 <= 40) {
    score += 1;
    bits.push("RSI soft (+1)");
  } else if (q.rsi14 != null && q.rsi14 >= 70) {
    score -= 3;
    bits.push("RSI overbought (\u22123)");
  } else if (q.rsi14 != null && q.rsi14 >= 65) {
    score -= 1;
    bits.push("RSI elevated (\u22121)");
  }
  if (q.range52Pct != null && q.range52Pct <= 20) {
    score += 2;
    bits.push("near 52w low (+2)");
  } else if (q.range52Pct != null && q.range52Pct >= 85) {
    score -= 2;
    bits.push("near 52w high (\u22122)");
  }
  if (q.pctFromAth != null && q.pctFromAth >= -3) {
    score -= 2;
    bits.push("near ATH (\u22122)");
  }
  if (q.signals?.includes("deep-below-50") || q.vsSma?.[50] != null && q.vsSma[50] < -10) {
    score += 2;
    bits.push("deep below SMA50 (+2)");
  }
  if (q.signals?.includes("extended-above-50") || q.vsSma?.[50] != null && q.vsSma[50] > 10) {
    score -= 2;
    bits.push("extended above SMA50 (\u22122)");
  }
  if (q.trend === "bullish") {
    score += 1;
    bits.push("bullish trend (+1)");
  } else if (q.trend === "bearish") {
    score -= 1;
    bits.push("bearish trend (\u22121)");
  }
  if (isPreMomentum(q)) {
    score += 2;
    bits.push("quiet coil / pre-momentum (+2)");
  } else if (q.volRatio != null && q.volRatio < 0.7 && q.range52Pct != null && q.range52Pct >= 80) {
    score -= 1;
    bits.push("quiet near highs (\u22121)");
  }
  const delta = opts?.newsCheck?.scoreDelta;
  if (typeof delta === "number" && delta !== 0) {
    score += delta;
    const sign = delta > 0 ? `+${delta}` : String(delta);
    const tilt = opts?.newsCheck?.tilt || (delta > 0 ? "positive" : "negative");
    bits.push(`news ${tilt} (${sign})`);
  }
  let setup = "mixed";
  if (isPreMomentum(q)) setup = "pre-momentum";
  else if (q.rsi14 != null && q.rsi14 <= 35 || q.vsSma?.[50] != null && q.vsSma[50] < -10 || q.range52Pct != null && q.range52Pct <= 20) {
    setup = "washed-out";
  } else if (q.rsi14 != null && q.rsi14 >= 65 || q.vsSma?.[50] != null && q.vsSma[50] > 10 || q.range52Pct != null && q.range52Pct >= 85 || q.pctFromAth != null && q.pctFromAth >= -5) {
    setup = "extended";
  } else if (q.trend === "bullish" || q.trend === "bearish") {
    setup = "trending";
  }
  const reason = bits.length ? bits.slice(0, 4).join(" \xB7 ") : "Neutral setup";
  if (score >= 3) return { label: "Lean buy", cls: "buy", reason, score, setup };
  if (score <= -3) return { label: "Lean sell", cls: "sell", reason, score, setup };
  return { label: "Watch", cls: "watch", reason, score, setup };
}

// scripts/lib/technical-filters.mjs
function matchesTechnicalFilter(filter, q, price) {
  if (!filter.startsWith("tech-")) return true;
  if (!q) return false;
  switch (filter) {
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

// src/lib/market-format.ts
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
  const allowed = ["bullish", "bearish", "mixed", "unknown"];
  const t = allowed.includes(trend) ? trend : "unknown";
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
function actionBadge(q, opts) {
  const a = actionBias(q, opts);
  return `<span class="action-badge action-${a.cls}" title="${escapeHtml(a.reason)}">${escapeHtml(a.label)}</span>`;
}
function sma50Plain(q) {
  const vs = q?.vsSma?.[50];
  if (vs == null || Number.isNaN(vs)) return "50-day avg n/a";
  const abs = Math.abs(vs).toFixed(1);
  if (Math.abs(vs) < 1) return "about even with its 50-day average price";
  if (vs > 0) return `${abs}% above its 50-day average (running hot vs recent weeks)`;
  return `${abs}% below its 50-day average (cheaper vs recent weeks)`;
}
function pulseExplain(q, opts) {
  const bias = actionBias(q, opts);
  const sma = sma50Plain(q);
  const lean = bias.cls === "buy" ? "Lean buy \u2014 weighted checklist tips constructive (not advice)" : bias.cls === "sell" ? "Lean sell \u2014 stretched or soft on the weighted checklist" : bias.cls === "watch" ? bias.setup === "pre-momentum" ? "Watch \u2014 quiet coil / pre-momentum (no run yet)" : "Watch \u2014 mixed / wait for a clearer setup" : "Waiting on quotes";
  const setupLabel = bias.setup === "pre-momentum" ? "pre-momentum" : bias.setup === "washed-out" ? "washed-out" : bias.setup === "extended" ? "extended" : null;
  const bits = [lean];
  if (setupLabel && bias.cls !== "idle") bits.push(setupLabel);
  if (bias.reason && bias.reason !== "Waiting on quotes") bits.push(bias.reason);
  bits.push(sma);
  return { bias, sma, line: bits.join(" \xB7 ") };
}

// src/lib/market-html.ts
function fmtMultiple(v) {
  if (v == null || Number.isNaN(v)) return "\u2014";
  return v.toFixed(1);
}
function fmtGrowth(v) {
  if (v == null || Number.isNaN(v)) return "\u2014";
  return `${(v * 100).toFixed(0)}%`;
}
function biasLabel(bias) {
  const b = (bias || "").toLowerCase();
  if (b === "cheap") return { text: "Group lean: cheap vs story", cls: "cheap" };
  if (b === "fair") return { text: "Group lean: fair", cls: "fair" };
  if (b === "rich") return { text: "Group lean: rich vs story", cls: "rich" };
  return null;
}
function sentimentBadge(sentiment) {
  const s = (sentiment || "neutral").toLowerCase();
  const cls = s === "positive" || s === "negative" || s === "neutral" ? s : "neutral";
  const text = cls === "positive" ? "+" : cls === "negative" ? "\u2212" : "~";
  const label = cls === "positive" ? "Positive" : cls === "negative" ? "Negative" : "Neutral";
  return `<span class="news-sent news-sent--${cls}" title="${escapeHtml(label)} headline">${text} ${escapeHtml(label)}</span>`;
}
function newsCheckHtml(check) {
  if (!check?.tilt) return "";
  const tilt = String(check.tilt);
  const cls = tilt === "positive" ? "positive" : tilt === "negative" ? "negative" : tilt === "mixed" ? "mixed" : "neutral";
  const label = check.label || `News check: ${tilt}`;
  return `<p class="outlook-news-check outlook-news-check--${cls}">${escapeHtml(label)}</p>
    <p class="outlook-disclaimer">Headline lexicon \u2014 quick tape check, not a thesis. Read the links.</p>`;
}
function renderOutlookDetail(row) {
  const f = row?.fundamentals;
  const news = Array.isArray(row?.news) ? row.news : [];
  const hasMetrics = f && (f.trailingPE != null || f.forwardPE != null || f.pegRatio != null || f.priceToBook != null || f.evToEbitda != null || f.bias || f.note || f.catalyst);
  if (!hasMetrics && !news.length && !row?.newsCheck) {
    return `<div class="outlook-detail">
      <h4>Valuation + news</h4>
      <p class="outlook-empty">Outlook refreshes with quotes \u2014 run <code>npm run update-quotes</code> or wait for CI.</p>
    </div>`;
  }
  const lean = biasLabel(f?.bias);
  const metrics = [
    ["Trailing PE", fmtMultiple(f?.trailingPE)],
    ["Forward PE", fmtMultiple(f?.forwardPE)],
    ["PEG", fmtMultiple(f?.pegRatio)],
    ["P/B", fmtMultiple(f?.priceToBook)],
    ["EV/EBITDA", fmtMultiple(f?.evToEbitda)],
    ["Rev growth", fmtGrowth(f?.revenueGrowth)]
  ].filter(([, v]) => v !== "\u2014").map(
    ([label, v]) => `<span class="outlook-metric"><span class="outlook-metric__label">${escapeHtml(label)}</span><span class="mono">${escapeHtml(v)}</span></span>`
  ).join("");
  const newsHtml = news.length ? `<ul class="outlook-news">${news.slice(0, 3).map((n) => {
    const title = escapeHtml(n.title || "Headline");
    const pub = escapeHtml(n.publisher || "");
    const href = escapeHtml(safeHttpUrl(n.link));
    return `<li>${sentimentBadge(n.sentiment)} <a href="${href}" target="_blank" rel="noopener noreferrer">${title}</a>${pub ? ` <span class="outlook-news__pub">${pub}</span>` : ""}</li>`;
  }).join("")}</ul>` : `<p class="outlook-empty">No recent headlines in the feed.</p>`;
  return `<div class="outlook-detail">
    <h4>Valuation + news <span class="tech-detail__sub">(primary)</span></h4>
    ${lean ? `<p class="outlook-bias outlook-bias--${lean.cls}">${escapeHtml(lean.text)}</p>` : ""}
    ${f?.note ? `<p class="outlook-note">${escapeHtml(f.note)}</p>` : ""}
    ${f?.catalyst ? `<p class="outlook-catalyst"><strong>Catalyst:</strong> ${escapeHtml(f.catalyst)}</p>` : ""}
    ${metrics ? `<div class="outlook-metrics">${metrics}</div>` : ""}
    <p class="outlook-disclaimer">Multiples without peer context are not a buy/sell \u2014 they\u2019re chat fuel next to the thesis.</p>
    <h5 class="outlook-news-title">News check</h5>
    ${newsCheckHtml(row?.newsCheck)}
    ${newsHtml}
  </div>`;
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
      <h4>Momentum <span class="tech-detail__sub">(secondary)</span></h4>
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

// src/client/board/state.ts
var CUSTOM_STORE = "stocks-radar-custom";
var CUSTOM_KEY = "entries";
var PREFS_KEY = "stocks-radar-prefs";
var state = {
  baseStocks: [],
  allStocks: [],
  quotes: {},
  outlookBySymbol: {},
  filter: "all",
  tagFilter: null,
  search: "",
  sortKey: "symbol",
  sortDir: 1,
  viewMode: "table",
  page: 1,
  pageSize: 50,
  expandedId: null
};
function radarSettings() {
  return typeof window !== "undefined" && window.__RADAR_SETTINGS__ || {};
}
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
    JSON.stringify({
      viewMode: state.viewMode,
      pageSize: state.pageSize,
      sortKey: state.sortKey,
      filter: state.filter
    })
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
  const existing = state.allStocks.find((s) => s.symbol === sym);
  const q = state.quotes[sym];
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
  state.allStocks = mergeStocks(state.baseStocks, merged);
  return true;
}
function asFiniteNumber(v) {
  if (v == null || v === "") return null;
  const n = typeof v === "number" ? v : Number(v);
  return Number.isFinite(n) ? n : null;
}
function getQuote(stock) {
  return state.quotes[stock.symbol];
}
function getPrice(stock) {
  return asFiniteNumber(state.quotes[stock.symbol]?.price) ?? asFiniteNumber(stock.lastPrice);
}
function getChange(stock) {
  const q = state.quotes[stock.symbol];
  const fromQuote = asFiniteNumber(q?.changePct);
  if (fromQuote != null) return fromQuote;
  const price = getPrice(stock);
  const prev = asFiniteNumber(q?.prevClose);
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
function matchesSearch(stock) {
  if (!state.search) return true;
  const q = state.search.toLowerCase();
  return stock.symbol.toLowerCase().includes(q) || (stock.name ?? "").toLowerCase().includes(q) || (stock.thesis ?? "").toLowerCase().includes(q) || (stock.targetNote ?? "").toLowerCase().includes(q) || (stock.sector ?? "").toLowerCase().includes(q) || (stock.tags ?? []).some((t) => t.toLowerCase().includes(q));
}
function sortStocks(list) {
  const sorted = [...list];
  sorted.sort((a, b) => {
    let av;
    let bv;
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
        return state.sortDir * (av - bv);
      case "target":
        av = a.targetPrice ?? -Infinity;
        bv = b.targetPrice ?? -Infinity;
        return state.sortDir * (av - bv);
      case "distance": {
        const da = getDistance(a);
        const db = getDistance(b);
        if (da == null && db == null) return a.symbol.localeCompare(b.symbol);
        if (da == null) return 1;
        if (db == null) return -1;
        return state.sortDir * (Math.abs(da) - Math.abs(db));
      }
      case "priority": {
        const order = { high: 0, medium: 1, low: 2 };
        av = order[a.priority ?? ""] ?? 3;
        bv = order[b.priority ?? ""] ?? 3;
        return state.sortDir * (av - bv);
      }
      case "by":
        return state.sortDir * (a.holder ?? a.addedBy ?? "").localeCompare(b.holder ?? b.addedBy ?? "");
      case "vs50":
        av = getQuote(a)?.vsSma?.[50] ?? -Infinity;
        bv = getQuote(b)?.vsSma?.[50] ?? -Infinity;
        return state.sortDir * (av - bv);
      case "vs20":
        av = getQuote(a)?.vsSma?.[20] ?? -Infinity;
        bv = getQuote(b)?.vsSma?.[20] ?? -Infinity;
        return state.sortDir * (av - bv);
      case "vs200":
        av = getQuote(a)?.vsSma?.[200] ?? -Infinity;
        bv = getQuote(b)?.vsSma?.[200] ?? -Infinity;
        return state.sortDir * (av - bv);
      case "range52":
        av = getQuote(a)?.range52Pct ?? -Infinity;
        bv = getQuote(b)?.range52Pct ?? -Infinity;
        return state.sortDir * (av - bv);
      case "ath":
        av = getQuote(a)?.pctFromAth ?? -Infinity;
        bv = getQuote(b)?.pctFromAth ?? -Infinity;
        return state.sortDir * (av - bv);
      case "rsi":
        av = getQuote(a)?.rsi14 ?? -Infinity;
        bv = getQuote(b)?.rsi14 ?? -Infinity;
        return state.sortDir * (av - bv);
      case "trend": {
        const order = { bullish: 0, mixed: 1, bearish: 2, unknown: 3 };
        av = order[getQuote(a)?.trend ?? "unknown"] ?? 4;
        bv = order[getQuote(b)?.trend ?? "unknown"] ?? 4;
        return state.sortDir * (av - bv);
      }
      case "action": {
        const order = { buy: 0, watch: 1, sell: 2, idle: 3 };
        av = order[stockBias(a).cls] ?? 4;
        bv = order[stockBias(b).cls] ?? 4;
        return state.sortDir * (av - bv);
      }
      default:
        return 0;
    }
  });
  return sorted;
}
function filteredStocks() {
  return sortStocks(state.allStocks.filter((s) => matchesFilter(s) && matchesSearch(s)));
}
function outlookFor(stock) {
  const sym = stock.symbol?.toUpperCase();
  const fetched = sym ? state.outlookBySymbol[sym] : void 0;
  const human = stock.valuation || {};
  const fundamentals = {
    ...fetched?.fundamentals || {},
    bias: human.bias || fetched?.fundamentals?.bias || null,
    note: human.note || fetched?.fundamentals?.note || null,
    catalyst: stock.catalyst || fetched?.fundamentals?.catalyst || null
  };
  return {
    symbol: sym,
    fundamentals,
    news: fetched?.news || [],
    newsCheck: fetched?.newsCheck || null
  };
}
function biasOpts(stock) {
  return { newsCheck: outlookFor(stock)?.newsCheck };
}
function stockBias(stock) {
  return actionBias(getQuote(stock), biasOpts(stock));
}
function dcBridgeEntry(symbol) {
  const map = typeof window !== "undefined" ? window.__DC_BRIDGE__?.byTicker : void 0;
  if (!map || !symbol) return void 0;
  return map[String(symbol).trim().toUpperCase()];
}
function radarBaseHref() {
  const el = document.getElementById("watchlist-board");
  let base = el?.getAttribute("data-radar-base") || "/";
  if (!base.endsWith("/")) base += "/";
  return base;
}
function renderDcLayerBadge(stock) {
  const entry = dcBridgeEntry(stock.symbol);
  if (!entry) return "";
  const primary = entry.primary;
  const more = entry.layers.length > 1 ? ` +${entry.layers.length - 1}` : "";
  const exp = primary.exposure ? ` \xB7 ${primary.exposure}` : "";
  const href = `${radarBaseHref()}datacenter.html?q=${encodeURIComponent(entry.ticker)}&layer=${encodeURIComponent(primary.id)}`;
  return `<a class="dc-badge dc-badge--${escapeHtml(primary.id)}" href="${href}" title="${escapeHtml(primary.name)}${escapeHtml(exp)}">DC \xB7 ${escapeHtml(primary.label)}${more}</a>`;
}
function renderDcDetail(stock) {
  const entry = dcBridgeEntry(stock.symbol);
  if (!entry) return "";
  const layers = entry.layers.map((l) => {
    const href = `${radarBaseHref()}datacenter.html?layer=${encodeURIComponent(l.id)}&q=${encodeURIComponent(entry.ticker)}`;
    const exp = l.exposure ? ` (${escapeHtml(l.exposure)})` : "";
    return `<a class="dc-badge dc-badge--${escapeHtml(l.id)}" href="${href}">${escapeHtml(l.label)}${exp}</a>`;
  }).join(" ");
  return `<div class="dc-detail">
      <strong>AI Data Center:</strong> ${layers}
      <a class="dc-detail__link" href="${radarBaseHref()}datacenter.html?q=${encodeURIComponent(entry.ticker)}">Open in screener \u2192</a>
    </div>`;
}
function renderPriority(stock) {
  if (!stock.priority) return "\u2014";
  const p = sanitizePriority(stock.priority);
  return `<span class="priority priority-${p}">${escapeHtml(p)}</span>`;
}

// src/client/board/render-table.ts
function renderRow(stock, compact = false, mode = "default") {
  const sym = sanitizeSymbol(stock.symbol) || escapeHtml(String(stock.symbol ?? ""));
  const sid = sanitizeId(stock.id) || escapeHtml(String(stock.id ?? ""));
  const price = getPrice(stock);
  const q = getQuote(stock);
  const chg = getChange(stock);
  const dist = getDistance(stock);
  const { text: distText, cls: distCls } = distanceLabel(dist);
  const chgHtml = chg != null ? `<span class="chg ${chg >= 0 ? "up" : "down"}">${chg >= 0 ? "+" : ""}${chg.toFixed(2)}%</span>` : `<span class="chg dim">\u2014</span>`;
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
        <button type="button" class="btn-icon expand-btn" aria-label="Toggle details" data-expand="${sid}">${expanded ? "\u2212" : "+"}</button>
      </td>
    </tr>
    ${expanded ? renderDetailRow(stock, price, q, 10) : ""}`;
  }
  const pri = sanitizePriority(stock.priority);
  return `
    <tr data-id="${sid}" data-symbol="${sym}" class="data-row ${atTarget ? "row-at-target" : ""} ${pri === "high" ? "row-high" : ""} ${expanded ? "expanded" : ""}">
      <td class="mono sym sticky-col">
        <a href="${yahooUrl(sym)}" target="_blank" rel="noopener noreferrer" class="sym-link">${sym}</a>
        ${pri === "high" ? '<span class="conviction-dot" title="High conviction">\u25CF</span>' : ""}
        ${stock.custom ? '<span class="custom-tag" title="From group notes">\u2605</span>' : ""}
        ${renderDcLayerBadge(stock)}
      </td>
      <td class="name-cell">${escapeHtml(stock.name)}</td>
      <td class="num mono price-cell" data-price-for="${sym}">${fmtPrice(price)}</td>
      <td class="num">${chgHtml}</td>
      <td>${actionBadge(q, biasOpts(stock))}</td>
      <td class="ath-cell">${athIndicator(q)}</td>
      <td class="num mono">${stock.targetPrice != null ? fmtPrice(stock.targetPrice) : "\u2014"}</td>
      <td class="note-cell">${escapeHtml(stock.thesis ?? stock.targetNote ?? "\u2014")}</td>
      <td>${renderPriority(stock)}</td>
      <td class="row-actions">
        <button type="button" class="btn-icon expand-btn" aria-label="Toggle details" data-expand="${sid}">${expanded ? "\u2212" : "+"}</button>
      </td>
    </tr>
    ${expanded ? renderDetailRow(stock, price, getQuote(stock), 10) : ""}
  `;
}
function renderDetailRow(stock, price, q, colspan) {
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
            <p><strong>Holder:</strong> ${escapeHtml(stock.holder ?? stock.addedBy ?? "\u2014")}</p>
            <a href="${yahooUrl(sym)}" target="_blank" rel="noopener noreferrer">View on Yahoo Finance \u2192</a>
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
  const tags = /* @__PURE__ */ new Set();
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
function renderTagFilters() {
  const el = document.getElementById("tag-filters");
  if (!el) return;
  const tags = /* @__PURE__ */ new Set();
  state.allStocks.forEach((s) => (s.tags ?? []).forEach((t) => tags.add(t)));
  if (!tags.size) {
    el.innerHTML = "";
    return;
  }
  el.innerHTML = `<span class="tag-filter-label">Themes:</span>` + [...tags].sort().map(
    (t) => `<button type="button" class="chip tag-chip ${state.tagFilter === t ? "active" : ""}" data-tag="${escapeHtml(t)}">${escapeHtml(t)}</button>`
  ).join("") + (state.tagFilter ? `<button type="button" class="chip tag-clear" data-tag="">Clear</button>` : "");
}
function renderPagination(total) {
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
function renderTechnicalView(list) {
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
    countEl.textContent = total === state.allStocks.length ? `Technical view \xB7 ${start + 1}\u2013${Math.min(start + state.pageSize, total)} of ${total}` : `Technical view \xB7 ${start + 1}\u2013${Math.min(start + state.pageSize, total)} of ${total} (filtered from ${state.allStocks.length})`;
  }
  tbody.innerHTML = renderTableHtml(pageItems, "technical");
  renderPagination(total);
  document.querySelectorAll("#technical-view th.sortable").forEach((th) => {
    th.classList.toggle("sorted-asc", th.getAttribute("data-sort") === state.sortKey && state.sortDir === 1);
    th.classList.toggle("sorted-desc", th.getAttribute("data-sort") === state.sortKey && state.sortDir === -1);
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
  const start = (state.page - 1) * state.pageSize;
  const pageItems = list.slice(start, start + state.pageSize);
  if (countEl) {
    countEl.textContent = total === state.allStocks.length ? `Showing ${start + 1}\u2013${Math.min(start + state.pageSize, total)} of ${total}` : `Showing ${start + 1}\u2013${Math.min(start + state.pageSize, total)} of ${total} (filtered from ${state.allStocks.length})`;
  }
  tbody.innerHTML = renderTableHtml(pageItems);
  renderPagination(total);
  document.querySelectorAll("th.sortable").forEach((th) => {
    th.classList.toggle("sorted-asc", th.getAttribute("data-sort") === state.sortKey && state.sortDir === 1);
    th.classList.toggle("sorted-desc", th.getAttribute("data-sort") === state.sortKey && state.sortDir === -1);
  });
}

// src/client/board/render-mobile.ts
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

// src/client/board/render-checkin.ts
function renderCheckIn() {
  const gainersEl = document.getElementById("checkin-gainers");
  const losersEl = document.getElementById("checkin-losers");
  const setupsEl = document.getElementById("checkin-setups");
  const watchEl = document.getElementById("checkin-watch");
  const cautionEl = document.getElementById("checkin-caution");
  const tallyEl = document.getElementById("checkin-tally");
  const moversEl = document.getElementById("checkin-movers");
  if (!gainersEl && !losersEl && !setupsEl && !watchEl && !cautionEl && !moversEl) return;
  const priced = state.allStocks.map((s) => {
    const q = getQuote(s);
    const price = getPrice(s);
    const chg = getChange(s);
    const explain = pulseExplain(q, biasOpts(s));
    return { stock: s, q, price, chg, bias: explain.bias, explain };
  }).filter((x) => x.price != null);
  const emptyAll = (msg) => {
    const safe = escapeHtml(msg);
    const empty = `<li class="checkin-rank__empty">${safe}</li>`;
    for (const el of [gainersEl, losersEl, setupsEl, watchEl, cautionEl, moversEl]) {
      if (el) el.innerHTML = empty;
    }
    if (tallyEl) tallyEl.innerHTML = `<span class="checkin-tally__loading">${safe}</span>`;
  };
  if (!priced.length) {
    emptyAll("Waiting on quotes for the master list\u2026");
    return;
  }
  const buyN = priced.filter((x) => x.bias.cls === "buy").length;
  const sellN = priced.filter((x) => x.bias.cls === "sell").length;
  const watchN = priced.filter((x) => x.bias.cls === "watch").length;
  const preN = priced.filter((x) => x.bias.setup === "pre-momentum").length;
  const upN = priced.filter((x) => (x.chg ?? 0) > 0).length;
  const downN = priced.filter((x) => (x.chg ?? 0) < 0).length;
  if (tallyEl) {
    tallyEl.innerHTML = `
      <span class="checkin-tally__stat checkin-tally__stat--buy"><strong>${buyN}</strong> buy</span>
      <span class="checkin-tally__stat checkin-tally__stat--watch"><strong>${watchN}</strong> watch</span>
      <span class="checkin-tally__stat checkin-tally__stat--coil"><strong>${preN}</strong> pre-mom</span>
      <span class="checkin-tally__stat checkin-tally__stat--sell"><strong>${sellN}</strong> sell</span>
      <span class="checkin-tally__sep" aria-hidden="true"></span>
      <span class="checkin-tally__stat"><strong class="up">${upN}</strong> up</span>
      <span class="checkin-tally__stat"><strong class="down">${downN}</strong> down</span>
    `;
  }
  const moveRow = (x, i) => {
    const up = (x.chg ?? 0) >= 0;
    const sym = sanitizeSymbol(x.stock.symbol) || escapeHtml(String(x.stock.symbol ?? ""));
    return `<li class="checkin-rank__row">
      <span class="checkin-rank__n">${i + 1}</span>
      <button type="button" class="checkin-rank__sym" data-jump="${sym}">${sym}</button>
      <span class="checkin-rank__name">${escapeHtml(x.stock.name)}</span>
      <span class="checkin-rank__val mono ${up ? "up" : "down"}">${up ? "+" : ""}${(x.chg ?? 0).toFixed(1)}%</span>
    </li>`;
  };
  const signalRow = (x, i) => {
    const sym = sanitizeSymbol(x.stock.symbol) || escapeHtml(String(x.stock.symbol ?? ""));
    const chg = x.chg;
    const chgHtml = chg == null ? `<span class="checkin-rank__val dim">\u2014</span>` : `<span class="checkin-rank__val mono ${chg >= 0 ? "up" : "down"}">${chg >= 0 ? "+" : ""}${chg.toFixed(1)}%</span>`;
    const setupTag = x.bias.setup === "pre-momentum" ? `<span class="checkin-setup-tag">pre-mom</span>` : x.bias.setup === "washed-out" ? `<span class="checkin-setup-tag checkin-setup-tag--wash">wash</span>` : x.bias.setup === "extended" ? `<span class="checkin-setup-tag checkin-setup-tag--ext">ext</span>` : "";
    return `<li class="checkin-rank__row checkin-rank__row--signal">
      <span class="checkin-rank__n">${i + 1}</span>
      <button type="button" class="checkin-rank__sym" data-jump="${sym}">${sym}</button>
      <span class="checkin-rank__meta">
        <span class="checkin-rank__name">${escapeHtml(x.stock.name)} ${setupTag}</span>
        <span class="checkin-rank__why">${escapeHtml(x.bias.reason)}</span>
      </span>
      ${chgHtml}
    </li>`;
  };
  const gainers = [...priced].filter((x) => x.chg != null && x.chg > 0).sort((a, b) => (b.chg ?? 0) - (a.chg ?? 0)).slice(0, 8);
  const losers = [...priced].filter((x) => x.chg != null && x.chg < 0).sort((a, b) => (a.chg ?? 0) - (b.chg ?? 0)).slice(0, 8);
  const absMovers = [...priced].filter((x) => x.chg != null).sort((a, b) => Math.abs(b.chg) - Math.abs(a.chg)).slice(0, 8);
  if (gainersEl) {
    gainersEl.innerHTML = gainers.length ? gainers.map(moveRow).join("") : `<li class="checkin-rank__empty">No gainers today.</li>`;
  }
  if (losersEl) {
    losersEl.innerHTML = losers.length ? losers.map(moveRow).join("") : `<li class="checkin-rank__empty">No losers today.</li>`;
  }
  if (moversEl) {
    moversEl.innerHTML = absMovers.length ? absMovers.map(moveRow).join("") : `<li class="checkin-rank__empty">No moves yet.</li>`;
  }
  const setups = [...priced].filter((x) => x.bias.cls === "buy").sort((a, b) => b.bias.score - a.bias.score || (b.chg ?? 0) - (a.chg ?? 0)).slice(0, 8);
  if (setupsEl) {
    setupsEl.innerHTML = setups.length ? setups.map(signalRow).join("") : `<li class="checkin-rank__empty">None right now.</li>`;
  }
  const watch = [...priced].filter((x) => x.bias.cls === "watch").sort((a, b) => {
    const ap = a.bias.setup === "pre-momentum" ? 1 : 0;
    const bp = b.bias.setup === "pre-momentum" ? 1 : 0;
    if (bp !== ap) return bp - ap;
    return Math.abs(b.bias.score) - Math.abs(a.bias.score) || Math.abs(b.chg ?? 0) - Math.abs(a.chg ?? 0);
  }).slice(0, 8);
  if (watchEl) {
    watchEl.innerHTML = watch.length ? watch.map(signalRow).join("") : `<li class="checkin-rank__empty">None right now.</li>`;
  }
  const caution = [...priced].filter((x) => x.bias.cls === "sell").sort((a, b) => a.bias.score - b.bias.score).slice(0, 8);
  if (cautionEl) {
    cautionEl.innerHTML = caution.length ? caution.map(signalRow).join("") : `<li class="checkin-rank__empty">None right now.</li>`;
  }
}

// src/client/board/render.ts
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
  if (state.viewMode === "technical") {
    renderTechnicalView(list);
  } else {
    renderTableView(list);
  }
}
var renderRaf = 0;
function scheduleRenderAll() {
  if (renderRaf) return;
  renderRaf = requestAnimationFrame(() => {
    renderRaf = 0;
    renderAll();
  });
}
var resizeTimer = 0;
function scheduleResizeRender() {
  window.clearTimeout(resizeTimer);
  resizeTimer = window.setTimeout(() => {
    syncLayoutClass();
    scheduleRenderAll();
  }, 120);
}
function setViewToggle(activeId) {
  ["view-table", "view-technical"].forEach((id) => {
    document.getElementById(id)?.classList.toggle("active", id === activeId);
  });
}

// src/client/board/events.ts
function bindEvents() {
  document.getElementById("search-input")?.addEventListener("input", (e) => {
    state.search = e.target.value.trim();
    state.page = 1;
    renderAll();
  });
  document.querySelectorAll(".filter-chips").forEach((container) => {
    container.addEventListener("click", (e) => {
      const btn = e.target.closest("[data-filter]");
      if (!btn) return;
      state.filter = btn.getAttribute("data-filter") ?? "all";
      document.querySelectorAll(".filter-chips .chip[data-filter]").forEach((c) => c.classList.remove("active"));
      btn.classList.add("active");
      state.page = 1;
      savePrefs();
      renderAll();
    });
  });
  document.getElementById("tag-filters")?.addEventListener("click", (e) => {
    const btn = e.target.closest("[data-tag]");
    if (!btn) return;
    const t = btn.getAttribute("data-tag");
    state.tagFilter = t || null;
    state.page = 1;
    renderAll();
  });
  document.querySelectorAll("th.sortable").forEach((th) => {
    th.addEventListener("click", () => {
      const key = th.getAttribute("data-sort");
      if (state.sortKey === key) state.sortDir *= -1;
      else {
        state.sortKey = key;
        state.sortDir = 1;
      }
      savePrefs();
      renderAll();
    });
  });
  document.getElementById("technical-view")?.addEventListener("click", (e) => {
    const th = e.target.closest("th.sortable");
    if (!th) return;
    const key = th.getAttribute("data-sort");
    if (state.sortKey === key) state.sortDir *= -1;
    else {
      state.sortKey = key;
      state.sortDir = 1;
    }
    savePrefs();
    renderAll();
  });
  document.getElementById("view-table")?.addEventListener("click", () => {
    state.viewMode = "table";
    setViewToggle("view-table");
    savePrefs();
    renderAll();
  });
  document.getElementById("view-technical")?.addEventListener("click", () => {
    state.viewMode = "technical";
    setViewToggle("view-technical");
    savePrefs();
    renderAll();
  });
  function jumpToSymbol(sym) {
    state.search = sym;
    const input = document.getElementById("search-input");
    if (input) input.value = sym;
    state.filter = "all";
    state.tagFilter = null;
    document.querySelectorAll(".filter-chips .chip[data-filter]").forEach((c) => {
      c.classList.toggle("active", c.getAttribute("data-filter") === "all");
    });
    state.viewMode = "table";
    state.page = 1;
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
      const raw = Number(e.target.value);
      state.pageSize = [25, 50, 100, 200].includes(raw) ? raw : 50;
      state.page = 1;
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
      state.expandedId = state.expandedId === id ? null : id;
      renderAll();
      return;
    }
    const pag = e.target.closest("#page-prev, #page-next, #page-size-select");
    if (pag) {
      if (pag.id === "page-prev" && state.page > 1) state.page--;
      else if (pag.id === "page-next") state.page++;
      else return;
      renderAll();
      return;
    }
  });
  document.getElementById("technical-view")?.addEventListener("click", (e) => {
    const expand = e.target.closest("[data-expand]");
    if (expand) {
      const id = expand.getAttribute("data-expand");
      state.expandedId = state.expandedId === id ? null : id;
      renderAll();
      return;
    }
    const pag = e.target.closest("#page-prev, #page-next, #page-size-select");
    if (pag) {
      if (pag.id === "page-prev" && state.page > 1) state.page--;
      else if (pag.id === "page-next") state.page++;
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
      const prev = state.quotes[sym]?.price;
      if (prev != null && q?.price != null && prev !== q.price) {
        changed.set(sym, q.price > prev ? "up" : "down");
      }
    }
    state.quotes = { ...state.quotes, ...incoming };
    scheduleRenderAll();
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
    const baseSymbols = new Set(state.baseStocks.map((s) => s.symbol));
    const novel = incoming.filter((s) => !baseSymbols.has(s.symbol));
    if (!novel.length) return;
    const existing = await getCustomStocks();
    const merged = mergeStocks(existing, novel);
    await setCustomStocks(merged);
    state.allStocks = mergeStocks(state.baseStocks, merged);
    renderAll();
  }));
}

// src/lib/day-mood.ts
function isUsMarketOpen(now = /* @__PURE__ */ new Date()) {
  const et = new Date(now.toLocaleString("en-US", { timeZone: "America/New_York" }));
  const day = et.getDay();
  if (day === 0 || day === 6) return false;
  const mins = et.getHours() * 60 + et.getMinutes();
  return mins >= 570 && mins < 960;
}

// src/client/board/quotes.ts
async function loadOutlook() {
  const base = document.querySelector("[data-radar-base]")?.dataset.radarBase ?? "/";
  function apply(data) {
    const stocks = data?.stocks;
    if (!stocks || typeof stocks !== "object") return false;
    state.outlookBySymbol = stocks;
    return true;
  }
  const cached = window.__OUTLOOK__;
  if (apply(cached)) return true;
  const shared = await new Promise((resolve) => {
    const timer = window.setTimeout(() => {
      document.removeEventListener("radar:outlook", onOutlook);
      resolve(
        window.__OUTLOOK__ || null
      );
    }, 1200);
    function onOutlook(ev) {
      window.clearTimeout(timer);
      resolve(ev.detail || null);
    }
    document.addEventListener("radar:outlook", onOutlook, { once: true });
  });
  if (apply(shared)) return true;
  try {
    const res = await fetch(`${base}outlook.json`);
    if (!res.ok) return false;
    const data = await res.json();
    window.__OUTLOOK__ = data;
    return apply(data);
  } catch {
    return false;
  }
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
  const liveStatusOwnsPoll = Boolean(document.querySelector("[data-live-status]"));
  if (liveStatusOwnsPoll) {
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
    }, radarSettings().quotes?.pollIntervalMs ?? 3e5);
  }
  document.addEventListener("radar:stale-quotes", () => {
    maybeBrowserFallback(true);
  });
}

// src/client/board/init.ts
var ALLOWED_PAGE_SIZES = /* @__PURE__ */ new Set([25, 50, 100, 200]);
function clampPageSize(n, fallback = 50) {
  const v = Number(n);
  if (!Number.isFinite(v) || !ALLOWED_PAGE_SIZES.has(v)) return fallback;
  return v;
}
async function initWatchlistBoard(stocksJson) {
  const site = radarSettings();
  if (site.board?.defaultPageSize) state.pageSize = clampPageSize(site.board.defaultPageSize);
  if (site.board?.defaultSort) state.sortKey = site.board.defaultSort;
  const prefs = loadPrefs();
  if (prefs.pageSize != null) state.pageSize = clampPageSize(prefs.pageSize, state.pageSize);
  if (prefs.sortKey) state.sortKey = prefs.sortKey;
  if (prefs.filter) state.filter = prefs.filter;
  state.baseStocks = JSON.parse(stocksJson);
  const custom = await getCustomStocks();
  state.allStocks = mergeStocks(state.baseStocks, custom);
  const defaultView = site.board?.defaultView === "technical" ? "technical" : "table";
  if (prefs.viewMode === "technical" || !prefs.viewMode && defaultView === "technical") {
    state.viewMode = "technical";
    setViewToggle("view-technical");
  } else {
    state.viewMode = "table";
    setViewToggle("view-table");
  }
  if (prefs.filter === "owned" || prefs.filter === "watching" || prefs.filter === "targets") {
    state.filter = "all";
  }
  if (prefs.filter) {
    document.querySelectorAll(".filter-chips .chip[data-filter]").forEach((c) => {
      c.classList.toggle("active", c.getAttribute("data-filter") === state.filter);
    });
  }
  bindEvents();
  syncLayoutClass();
  window.addEventListener("resize", scheduleResizeRender);
  renderAll();
  startQuoteLoader();
  loadOutlook().then((ok) => {
    if (ok) scheduleRenderAll();
  });
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
