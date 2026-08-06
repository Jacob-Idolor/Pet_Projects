// AI Data Center Screener — frontend logic.
// Layered/flat views · exposure + VALUATION/MOMENTUM/QUALITY range filters ·
// composite SCORE · switchable column sets · market state · movers ·
// data-center map mode · everything persisted via localStorage.

const EXPOSURE_RANK = { pure: 0, high: 1, moderate: 2, diversified: 3 };
const EXPOSURE_SCORE = { pure: 1, high: 0.7, moderate: 0.4, diversified: 0.15 };
const LS_KEY = "ai-dc-screener.v1";

// ----- filter metrics, grouped. `scale` converts the user's typed value into
// the units the data uses (market cap in $B; margins/growth typed as % of a
// fraction). `kind` drives range-hint formatting. -------------------------
// Filter groups mirror the composite score's factors one-to-one, so filtering by
// a group uses the same indicators that factor's sub-score measures.
const FILTER_GROUPS = [
  { id: "valuation", label: "Valuation", metrics: [
    { key: "market_cap",     label: "Market cap", unit: "$B", scale: 1e9,  kind: "money" },
    { key: "trailing_pe",    label: "P/E ttm",    unit: "",   scale: 1,    kind: "num" },
    { key: "forward_pe",     label: "P/E fwd",    unit: "",   scale: 1,    kind: "num" },
    { key: "price_to_sales", label: "P/S",        unit: "",   scale: 1,    kind: "num" },
    { key: "ev_ebitda",      label: "EV/EBITDA",  unit: "",   scale: 1,    kind: "num" },
    { key: "price_to_book",  label: "P/B",        unit: "",   scale: 1,    kind: "num" },
    { key: "peg",            label: "PEG",        unit: "",   scale: 1,    kind: "num" },
  ]},
  { id: "moat", label: "Moat & quality", metrics: [
    { key: "gross_margin",     label: "Gross margin", unit: "%", scale: 0.01, kind: "pctfrac" },
    { key: "operating_margin", label: "Op margin",    unit: "%", scale: 0.01, kind: "pctfrac" },
    { key: "profit_margin",    label: "Net margin",   unit: "%", scale: 0.01, kind: "pctfrac" },
    { key: "roe",              label: "ROE",          unit: "%", scale: 0.01, kind: "pctfrac" },
    { key: "roa",              label: "ROA",          unit: "%", scale: 0.01, kind: "pctfrac" },
  ]},
  { id: "growth", label: "Growth", metrics: [
    { key: "revenue_growth",  label: "Rev growth", unit: "%", scale: 0.01, kind: "pctfrac" },
    { key: "earnings_growth", label: "EPS growth", unit: "%", scale: 0.01, kind: "pctfrac" },
  ]},
  { id: "technical", label: "Technical trend", metrics: [
    { key: "change_pct",   label: "Today",        unit: "%", scale: 1, kind: "pct" },
    { key: "pct_off_high", label: "% off 52w hi", unit: "%", scale: 1, kind: "pct" },
    { key: "pct_vs_ma50",  label: "% vs 50d MA",  unit: "%", scale: 1, kind: "pct" },
    { key: "pct_vs_ma200", label: "% vs 200d MA", unit: "%", scale: 1, kind: "pct" },
  ]},
  { id: "health", label: "Financial health", metrics: [
    { key: "debt_to_equity", label: "Debt / Equity", unit: "", scale: 1, kind: "num" },
    { key: "current_ratio",  label: "Current ratio", unit: "", scale: 1, kind: "num" },
  ]},
];
const ALL_METRICS = FILTER_GROUPS.flatMap((g) => g.metrics);

// ---- market-cap preset bands (values in $B, the market_cap filter's display unit)
const CAP_BANDS = {
  mega:  { min: 200,  max: null, label: "Mega (≥$200B)" },
  large: { min: 10,   max: 200,  label: "Large ($10–200B)" },
  mid:   { min: 2,    max: 10,   label: "Mid ($2–10B)" },
  small: { min: 0.3,  max: 2,    label: "Small ($300M–2B)" },
  micro: { min: null, max: 0.3,  label: "Micro (<$300M)" },
};
const _eq = (a, b) => (a == null ? null : a) === (b == null ? null : b);
function activeCapBand() {
  const v = STATE.valuation.market_cap;
  if (!v) return null;
  for (const [id, b] of Object.entries(CAP_BANDS)) {
    if (_eq(v.min, b.min) && _eq(v.max, b.max)) return id;
  }
  return null;       // a custom market-cap range that doesn't match a preset
}
function setCapBand(id) {
  if (activeCapBand() === id) {
    delete STATE.valuation.market_cap;          // toggle the active band off
  } else {
    const b = CAP_BANDS[id];
    STATE.valuation.market_cap = { min: b.min, max: b.max };
  }
  savePrefs(); buildFiltersPanel(); render();
}

// lazy-loaded per-ticker headlines: ticker -> "loading" | "error" | [items]
const NEWS_CACHE = {};
// lazy-loaded per-ticker price/score history: ticker -> "loading" | "error" | [pts]
const HIST_CACHE = {};
// lazy-loaded per-ticker insider/buzz signals: ticker -> "loading" | "error" | data
const SIGNAL_CACHE = {};

// ---- persisted UI state -------------------------------------------------
function loadPrefs() {
  try { return JSON.parse(localStorage.getItem(LS_KEY)) || {}; } catch { return {}; }
}
function savePrefs() {
  localStorage.setItem(LS_KEY, JSON.stringify({
    sort: STATE.sort, view: STATE.view, exposure: [...STATE.exposure],
    tags: [...STATE.tags],
    collapsed: [...STATE.collapsed], valuation: STATE.valuation,
    panelOpen: STATE.panelOpen, mode: STATE.mode, colset: STATE.colset,
    scoreMode: STATE.scoreMode,
  }));
}

const _p = loadPrefs();
let STATE = {
  layers: [], marketState: null,
  sort: _p.sort || { col: "market_cap", asc: false },
  view: _p.view || "layers",
  query: "",
  exposure: new Set(_p.exposure || []),
  tags: new Set(_p.tags || []),         // selected theme/sub-layer tags (OR filter)
  collapsed: new Set(_p.collapsed || []),
  valuation: _p.valuation || {},        // metric key -> { min, max } (display units)
  panelOpen: _p.panelOpen || false,
  // the building cutaway, unified explorer, and rack tab were replaced by the Global Map
  mode: (["datacenter", "explore", "factory", "rack"].includes(_p.mode) ? "map" : (_p.mode || "screener")),
  focusLayer: null,
  colset: _p.colset || "valuation",     // which numeric column group to show
  scoreMode: _p.scoreMode || "universe", // score basis: percentile vs whole universe or vs same-layer peers
  openNews: new Set(),                  // tickers whose detail row is expanded (transient)
  openTab: new Map(),                   // ticker -> "score"|"trend"|"news" active detail tab (transient)
  deltas: {},                           // ticker -> {price_1d, price_7d, score_1d, score_7d, days} (transient)
};
window.STATE = STATE;

const $ = (sel) => document.querySelector(sel);

// ---- formatting ---------------------------------------------------------
function fmtMoney(n) {
  if (n == null) return "—";
  const a = Math.abs(n);
  if (a >= 1e12) return "$" + (n / 1e12).toFixed(2) + "T";
  if (a >= 1e9)  return "$" + (n / 1e9).toFixed(2) + "B";
  if (a >= 1e6)  return "$" + (n / 1e6).toFixed(1) + "M";
  return "$" + n.toFixed(0);
}
const fmtPrice = (n) => (n == null ? "—" : n.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 }));
const fmtNum = (n, d = 1) => (n == null ? "—" : n.toFixed(d));
const fmtPct = (n) => (n == null ? "—" : (n > 0 ? "+" : "") + n.toFixed(2) + "%");
const fmtFrac = (n) => (n == null ? "—" : (n > 0 ? "+" : "") + (n * 100).toFixed(1) + "%"); // fraction -> %
const pctClass = (n) => (n == null ? "dim" : n > 0 ? "pos" : n < 0 ? "neg" : "");
const fmtYield = (n) => (n == null ? "—" : n.toFixed(2) + "%");   // value already in percent units
// analyst recommendationMean: 1 = strong buy … 5 = sell
const RATING_LABEL = { strong_buy: "Strong Buy", buy: "Buy", hold: "Hold", underperform: "Underperform", sell: "Sell" };
const ratingClass = (m) => (m == null ? "dim" : m <= 2.0 ? "pos" : m <= 3.0 ? "warn" : "neg");
function fmtEarnings(ts) {
  if (ts == null) return "—";
  const d = new Date(ts * 1000);
  if (isNaN(d)) return "—";
  const date = d.toLocaleDateString(undefined, { month: "short", day: "numeric" });
  const days = Math.round((d.getTime() - Date.now()) / 86400000);
  if (days < 0) return date;               // a past date = last reported quarter
  if (days === 0) return `${date} · today`;
  return `${date} · ${days}d`;
}
const escapeHtml = (s) => (s || "").replace(/[&<>"']/g, (c) => ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#39;" }[c]));
function timeAgo(iso) {
  if (!iso) return "";
  const d = new Date(iso);
  if (isNaN(d)) return "";
  const s = (Date.now() - d.getTime()) / 1000;
  if (s < 3600) return Math.max(1, Math.round(s / 60)) + "m ago";
  if (s < 86400) return Math.round(s / 3600) + "h ago";
  return Math.round(s / 86400) + "d ago";
}

// ---- per-stock news -----------------------------------------------------
async function fetchNews(ticker) {
  NEWS_CACHE[ticker] = "loading";
  try {
    const res = await fetch("/api/news/" + encodeURIComponent(ticker));
    const data = await res.json();
    NEWS_CACHE[ticker] = data.items || [];
  } catch {
    NEWS_CACHE[ticker] = "error";
  }
  render();
}
function toggleNews(ticker) {
  if (STATE.openNews.has(ticker)) STATE.openNews.delete(ticker);
  else STATE.openNews.add(ticker);   // panels (score/trend/news) lazy-load themselves
  render();
}
function newsHtml(ticker) {
  const c = NEWS_CACHE[ticker];
  if (c === undefined) { fetchNews(ticker); return `<div class="news-status">Loading news…</div>`; }
  if (c === "loading") return `<div class="news-status">Loading news…</div>`;
  if (c === "error") return `<div class="news-status">Couldn't load news right now.</div>`;
  if (!c.length) return `<div class="news-status">No recent news found for ${ticker}.</div>`;
  return `<div class="news-list">` + c.map((it) =>
    `<a class="news-item" href="${encodeURI(it.url)}" target="_blank" rel="noopener noreferrer">` +
    `<span class="news-title">${escapeHtml(it.title)}</span>` +
    `<span class="news-meta">${escapeHtml(it.publisher)}${it.published ? " · " + timeAgo(it.published) : ""}</span></a>`
  ).join("") + `</div><div class="news-src">Headlines via Yahoo Finance</div>`;
}

// ---- column registry ----------------------------------------------------
// The base "Score" column is contextual: in a factor-aligned column set it shows
// that factor's sub-score (e.g. Valuation → the Val sub-score) instead of the
// blended composite, so the headline number matches the lens you're looking at.
const COLSET_FACTOR = { valuation: "valuation", moat: "moat", growth: "growth", technical: "technical", health: "health", consensus: "consensus", exposure: "exposure" };
const FACTOR_SHORT = { valuation: "Val", moat: "Moat", growth: "Grow", technical: "Tech", health: "Health", consensus: "Cons", exposure: "Expo" };
const FACTOR_FULL = { valuation: "Valuation", moat: "Moat & quality", growth: "Growth", technical: "Technical trend", health: "Financial health", consensus: "Analyst consensus", exposure: "Thematic exposure" };
// How many of the 6 buildout layers a holding spans — flat view carries the full
// list in h.layers; the grouped view carries the others in h.also_in.
function layerCount(h) {
  if (h.layers) return h.layers.length;
  return 1 + (h.also_in ? h.also_in.length : 0);
}
function contextualScoreBadge(h) {
  const f = COLSET_FACTOR[STATE.colset];
  if (!f) return scoreBadge(h);                       // no factor analog → overall composite
  const v = h.scoreParts ? h.scoreParts[f] : null;
  if (v == null) return `<span class="score na">—</span>`;
  const tip = `${FACTOR_FULL[f]} sub-score ${v}/100 — the factor this column set focuses on (overall composite ${h.score ?? "–"}). Pick the “Scores” columns to see all six.`;
  return `<span class="score" style="--sc:${scoreColor(v)}" title="${tip}">${v}</span>`;
}

const td = (inner, cls) => `<td class="${cls || ""}">${inner}</td>`;
function nameInner(h, showLayers) {
  const cur = h.market && h.market.currency;
  const curChip = (cur && cur !== "USD") ? `<span class="chip cur" title="prices converted from ${cur} to USD at live FX">${cur}→USD</span>` : "";
  const mc = h.market && h.market.market_cap;
  const microChip = (mc != null && mc < 300e6) ? `<span class="chip micro" title="Micro-cap (under $300M) — quotes/fundamentals may be thin or illiquid">μcap</span>` : "";
  const chips = showLayers
    ? (h.layers || []).map((l) => `<span class="chip">${l}</span>`).join("")
    : (h.tags || []).filter((t) => t !== "foreign").map((t) => `<span class="chip">${t}</span>`).join("") +
      (h.also_in || []).map((l) => `<span class="chip also">also: ${l}</span>`).join("");
  return `<div class="name">${h.name}</div><div class="thesis">${h.thesis || ""}</div><div class="tags">${chips}${curChip}${microChip}</div>`;
}
const scoreColor = (s) => (s >= 66 ? "var(--green)" : s >= 40 ? "var(--amber)" : "var(--red)");
function scoreBadge(h) {
  if (h.score == null) return `<span class="score na">—</span>`;
  const p = h.scoreParts || {};
  const tip = SCORE_FACTORS.map((f) => `${f.label} ${p[f.key] ?? "–"}`).join(" · ") + " — click row for breakdown";
  return `<span class="score" style="--sc:${scoreColor(h.score)}" title="${tip}">${h.score}</span>`;
}
function actionSignal(setup, trigger) {
  if (setup >= 60 && trigger >= 60) return { label: "Buy zone",  cls: "pos",  note: "strong fundamentals + confirmed uptrend" };
  if (setup >= 60 && trigger <  40) return { label: "Watch",     cls: "warn", note: "solid setup, waiting for trend confirmation" };
  if (setup <  40 && trigger >= 60) return { label: "Momentum",  cls: "warn", note: "price moving but fundamentals are weak" };
  if (setup <  40 && trigger <  40) return { label: "Avoid",     cls: "neg",  note: "weak fundamentals and no trend" };
  return { label: "Neutral", cls: "dim", note: "mixed or moderate signals" };
}
// full derivation, shown in the expandable row detail
function scoreBreakdown(h) {
  if (h.score == null || !h.scoreParts) return `<div class="news-status">No score available.</div>`;
  const p = h.scoreParts, cov = h.scoreCov || {};
  const rows = SCORE_FACTORS.map((f) => {
    const raw = Number(p[f.key] ?? 0);
    const v = Number.isFinite(raw) ? Math.max(0, Math.min(100, raw)) : 0;
    const c = cov[f.key];
    // flag thin factors: fewer than half the metrics had data (exposure has none to count)
    const thin = c && (() => { const [a, b] = c.split("/").map(Number); return b > 0 && a < Math.ceil(b / 2); })();
    const covChip = c ? `<span class="sb-cov${thin ? " thin" : ""}" title="${escapeHtml(String(c))} of this factor's metrics had data">${escapeHtml(String(c))}</span>` : `<span class="sb-cov"></span>`;
    return `<div class="sb-row">
      <span class="sb-label">${escapeHtml(f.label)}</span>
      <span class="sb-bar"><span class="sb-fill" style="width:${v}%;background:${scoreColor(v)}"></span></span>
      <span class="sb-val">${escapeHtml(String(v))}</span>
      ${covChip}
      <span class="sb-wt">×${Math.round(f.weight * 100)}%</span></div>`;
  }).join("");
  const basis = STATE.scoreMode === "layer"
    ? "each factor = percentile rank vs same-layer peers, then weighted"
    : "each factor = percentile rank vs the whole universe, then weighted";
  const setupRaw = Number(p.setup), triggerRaw = Number(p.trigger);
  const setup = Number.isFinite(setupRaw) ? setupRaw : null;
  const trigger = Number.isFinite(triggerRaw) ? triggerRaw : null;
  let signalHtml = "";
  if (setup != null && trigger != null) {
    const sig = actionSignal(setup, trigger);
    signalHtml = `<div class="sb-signal">
      <span class="sb-st">Setup <b style="color:${scoreColor(setup)}">${escapeHtml(String(setup))}</b></span>
      <span class="sb-st-sep">·</span>
      <span class="sb-st">Trigger <b style="color:${scoreColor(trigger)}">${escapeHtml(String(trigger))}</b></span>
      <span class="sb-action ${sig.cls}">${escapeHtml(sig.label)}</span>
      <span class="sb-action-note">${escapeHtml(sig.note)}</span></div>`;
  }
  return `<div class="sb">
    <div class="sb-head">Score <b style="color:${scoreColor(h.score)}">${h.score}</b>/100
      <span class="sb-note">${basis} · the small chip is data coverage</span>
      <button class="sb-method" type="button">ⓘ how it's derived</button></div>
    ${signalHtml}${rows}</div>`;
}
// ---- insider activity + news-buzz (surfaced indicators, not in the score) ----
const fmtShares = (n) => {
  if (n == null) return "—";
  const a = Math.abs(n);
  if (a >= 1e6) return (n / 1e6).toFixed(1) + "M";
  if (a >= 1e3) return Math.round(n / 1e3) + "K";
  return "" + Math.round(n);
};
async function fetchSignals(ticker) {
  SIGNAL_CACHE[ticker] = "loading";
  try {
    const res = await fetch("/api/signals/" + encodeURIComponent(ticker));
    SIGNAL_CACHE[ticker] = await res.json();
  } catch { SIGNAL_CACHE[ticker] = "error"; }
  render();
}
function signalsHtml(ticker) {
  const c = SIGNAL_CACHE[ticker];
  if (c === undefined) { fetchSignals(ticker); return `<div class="news-status">Loading signals…</div>`; }
  if (c === "loading") return `<div class="news-status">Loading signals…</div>`;
  if (c === "error") return `<div class="news-status">Couldn't load signals.</div>`;
  const ins = c.insider, buzz = c.buzz || {};
  let insHtml;
  if (!ins) {
    insHtml = `<div class="sig-row"><span class="sig-k">Insider (6 mo)</span><span class="sig-v dim">no data</span></div>`;
  } else {
    const cls = ins.sentiment === "buying" ? "pos" : ins.sentiment === "selling" ? "neg" : "dim";
    const arrow = ins.sentiment === "buying" ? "▲ Net buying" : ins.sentiment === "selling" ? "▼ Net selling" : "— Flat";
    const pctTxt = ins.net_pct != null ? ` · ${(ins.net_pct * 100).toFixed(1)}% of held` : "";
    insHtml = `<div class="sig-row"><span class="sig-k">Insider (6 mo)</span>
        <span class="sig-v ${cls}">${arrow} ${ins.net_shares != null ? fmtShares(ins.net_shares) + " sh" : ""}${pctTxt}</span></div>
      <div class="sig-sub">Buys ${fmtShares(ins.buy_shares)} (${ins.buy_trans || 0} txns) · Sells ${fmtShares(ins.sell_shares)} (${ins.sell_trans || 0} txns)</div>`;
  }
  return `<div class="sig">
    ${insHtml}
    <div class="sig-row"><span class="sig-k">News buzz</span><span class="sig-v">${buzz.count_7d ?? 0} this week · ${buzz.count_30d ?? 0} this month</span></div>
    <div class="sig-note">Indicators only — <b>not</b> part of the composite score. Insider = Yahoo's 6-mo Form-4 summary (can be lagged/incomplete); buzz = recent-headline volume as an attention proxy.</div>
  </div>`;
}

const DETAIL_TABS = [
  { id: "score",   label: "Score breakdown" },
  { id: "trend",   label: "Price & score trend" },
  { id: "signals", label: "Insider & buzz" },
  { id: "news",    label: "Recent news" },
];
function detailHtml(h) {
  const tab = STATE.openTab.get(h.ticker) || "score";
  const panel = tab === "trend" ? histHtml(h.ticker)
    : tab === "news" ? newsHtml(h.ticker)
    : tab === "signals" ? signalsHtml(h.ticker)
    : scoreBreakdown(h);
  const tabs = DETAIL_TABS.map((t) =>
    `<button class="dtab${t.id === tab ? " active" : ""}" data-tk="${h.ticker}" data-tab="${t.id}">${t.label}</button>`).join("");
  return `<div class="detail">
    <div class="detail-tabs">${tabs}</div>
    <div class="detail-panel">${panel}</div>
  </div>`;
}
const COLUMNS = {
  ticker:         { label: "Ticker",  align: "left",   get: (h) => h.ticker, cell: (h) => td(`<span class="news-toggle">${STATE.openNews.has(h.ticker) ? "▾" : "▸"}</span><span class="tkr">${h.ticker}</span>`, "left") },
  name:           { label: "Company", align: "left",   get: (h) => h.name,   cell: (h, sl) => td(nameInner(h, sl), "left") },
  exposure:       { label: "Exposure", align: "center", get: (h) => EXPOSURE_RANK[h.exposure] ?? 9, cell: (h) => td(`<span class="exp ${h.exposure}">${h.exposure}</span>`, "center") },
  score: {
    align: "center",
    get label() { const f = COLSET_FACTOR[STATE.colset]; return f ? FACTOR_SHORT[f] : "Score"; },
    get title() {
      const f = COLSET_FACTOR[STATE.colset];
      return f ? `${FACTOR_FULL[f]} factor sub-score (0–100) — this column set's dimension of the composite. Switch to “Scores” for all six.`
               : "Overall composite score (0–100). Pick a Valuation / Momentum / Quality column set to see its matching factor sub-score here.";
    },
    get: (h) => { const f = COLSET_FACTOR[STATE.colset]; return f ? (h.scoreParts ? h.scoreParts[f] : null) : h.score; },
    cell: (h) => td(contextualScoreBadge(h), "center"),
  },
  price:          { label: "Price",    get: (h) => h.market.price,          cell: (h) => td(fmtPrice(h.market.price)) },
  change_pct:     { label: "Chg %",    get: (h) => h.market.change_pct,     cell: (h) => td(fmtPct(h.market.change_pct), pctClass(h.market.change_pct)) },
  market_cap:     { label: "Mkt Cap",  get: (h) => h.market.market_cap,     cell: (h) => td(fmtMoney(h.market.market_cap)) },
  trailing_pe:    { label: "P/E (ttm)", get: (h) => h.market.trailing_pe,   cell: (h) => td(fmtNum(h.market.trailing_pe)) },
  forward_pe:     { label: "P/E (fwd)", get: (h) => h.market.forward_pe,    cell: (h) => td(fmtNum(h.market.forward_pe)) },
  price_to_sales: { label: "P/S",      get: (h) => h.market.price_to_sales, cell: (h) => td(fmtNum(h.market.price_to_sales, 2)) },
  ev_ebitda:      { label: "EV/EBITDA", get: (h) => h.market.ev_ebitda,     cell: (h) => td(fmtNum(h.market.ev_ebitda)) },
  pct_off_high:   { label: "% off 52w hi", get: (h) => h.market.pct_off_high, cell: (h) => td(fmtPct(h.market.pct_off_high), pctClass(h.market.pct_off_high)) },
  pct_vs_ma50:    { label: "% vs 50d", get: (h) => h.market.pct_vs_ma50,    cell: (h) => td(fmtPct(h.market.pct_vs_ma50), pctClass(h.market.pct_vs_ma50)) },
  pct_vs_ma200:   { label: "% vs 200d", get: (h) => h.market.pct_vs_ma200,  cell: (h) => td(fmtPct(h.market.pct_vs_ma200), pctClass(h.market.pct_vs_ma200)) },
  revenue_growth: { label: "Rev growth", get: (h) => h.market.revenue_growth, cell: (h) => td(fmtFrac(h.market.revenue_growth), pctClass(h.market.revenue_growth)) },
  gross_margin:   { label: "Gross mgn", get: (h) => h.market.gross_margin,  cell: (h) => td(fmtFrac(h.market.gross_margin)) },
  profit_margin:  { label: "Net mgn",  get: (h) => h.market.profit_margin,  cell: (h) => td(fmtFrac(h.market.profit_margin), pctClass(h.market.profit_margin)) },
  roe:            { label: "ROE",      get: (h) => h.market.roe,            cell: (h) => td(fmtFrac(h.market.roe), pctClass(h.market.roe)) },
  // metrics the composite score uses, exposed as columns so each factor's column
  // set mirrors exactly what the score breakdown measures
  price_to_book:    { label: "P/B",      get: (h) => h.market.price_to_book,    cell: (h) => td(fmtNum(h.market.price_to_book, 2)) },
  peg:              { label: "PEG",      get: (h) => h.market.peg,              cell: (h) => td(fmtNum(h.market.peg, 2)) },
  operating_margin: { label: "Op mgn",   get: (h) => h.market.operating_margin, cell: (h) => td(fmtFrac(h.market.operating_margin), pctClass(h.market.operating_margin)) },
  roa:              { label: "ROA",      get: (h) => h.market.roa,              cell: (h) => td(fmtFrac(h.market.roa), pctClass(h.market.roa)) },
  earnings_growth:  { label: "EPS grow", get: (h) => h.market.earnings_growth,  cell: (h) => td(fmtFrac(h.market.earnings_growth), pctClass(h.market.earnings_growth)) },
  debt_to_equity:   { label: "D/E",      get: (h) => h.market.debt_to_equity,   cell: (h) => td(fmtNum(h.market.debt_to_equity, 1)) },
  current_ratio:    { label: "Curr",     get: (h) => h.market.current_ratio,    cell: (h) => td(fmtNum(h.market.current_ratio, 2)) },
  layers_count:     { label: "Layers",   align: "center", get: (h) => layerCount(h), cell: (h) => td(layerCount(h), "center"), title: "How many of the 6 buildout layers this name spans (breadth of thematic exposure)" },
  beta:             { label: "Beta",     get: (h) => h.market.beta,             cell: (h) => td(fmtNum(h.market.beta, 2)), title: "Market beta — pure thematic plays tend to swing more than the market" },
  target_price:   { label: "Target",  get: (h) => h.market.target_mean_price, cell: (h) => td(fmtPrice(h.market.target_mean_price)) },
  implied_upside: { label: "Upside",  get: (h) => h.market.implied_upside,  cell: (h) => td(fmtPct(h.market.implied_upside), pctClass(h.market.implied_upside)) },
  recommendation: { label: "Rating",  align: "center", get: (h) => h.market.recommendation_mean, cell: (h) => td(ratingCell(h), "center") },
  dividend_yield: { label: "Div yld", get: (h) => h.market.dividend_yield,  cell: (h) => td(fmtYield(h.market.dividend_yield)) },
  earnings:       { label: "Next ER", get: (h) => h.market.earnings_ts,     cell: (h) => td(fmtEarnings(h.market.earnings_ts)) },
  score_d1:       { label: "Δscore 1d", align: "center", get: (h) => (dl(h.ticker) || {}).score_1d, cell: (h) => { const v = (dl(h.ticker) || {}).score_1d; return td(fmtScoreDelta(v), "center " + pctClass(v)); } },
  score_d7:       { label: "Δscore 7d", align: "center", get: (h) => (dl(h.ticker) || {}).score_7d, cell: (h) => { const v = (dl(h.ticker) || {}).score_7d; return td(fmtScoreDelta(v), "center " + pctClass(v)); } },
  price_d7:       { label: "Price 7d",  get: (h) => (dl(h.ticker) || {}).price_7d, cell: (h) => { const v = (dl(h.ticker) || {}).price_7d; return td(v == null ? "—" : fmtPct(v), pctClass(v)); } },
};
function ratingCell(h) {
  const k = h.market.recommendation_key, mean = h.market.recommendation_mean, n = h.market.num_analysts;
  if (!k && mean == null) return `<span class="dim">—</span>`;
  const lbl = RATING_LABEL[k] || (k ? k.replace(/_/g, " ") : "—");
  const tip = `consensus ${mean != null ? mean.toFixed(2) + "/5" : "n/a"}${n != null ? " · " + n + " analysts" : ""} (1=strong buy, 5=sell)`;
  return `<span class="rt ${ratingClass(mean)}" title="${tip}">${lbl}</span>` +
    (n != null ? `<span class="rt-n">${n}</span>` : "");
}
// per-factor sub-score columns (the composite score, broken out). Each reads the
// holding's scoreParts under the active basis (Universe/Layer), so they stay in sync.
const SCORE_COLS = [
  { key: "valuation", label: "Val",     full: "Valuation",                                        w: 0.18 },
  { key: "moat",      label: "Moat",    full: "Moat & quality",                                   w: 0.20 },
  { key: "growth",    label: "Grow",    full: "Growth",                                           w: 0.14 },
  { key: "technical", label: "Tech",    full: "Technical trend",                                  w: 0.15 },
  { key: "health",    label: "Health",  full: "Financial health",                                 w: 0.10 },
  { key: "consensus", label: "Cons",    full: "Analyst consensus",                                w: 0.08 },
  { key: "exposure",  label: "Expo",    full: "Thematic exposure",                                w: 0.15 },
  { key: "setup",     label: "Setup",   full: "Fundamental setup (val + moat + growth + health)", w: null },
  { key: "trigger",   label: "Trigger", full: "Trend confirmation (technical + consensus)",        w: null },
];
function factorBadge(v) {
  if (v == null) return `<span class="fscore na">—</span>`;
  return `<span class="fscore" style="--sc:${scoreColor(v)}">${v}</span>`;
}
for (const f of SCORE_COLS) {
  COLUMNS["sf_" + f.key] = {
    label: f.label, align: "center",
    title: f.w != null
      ? `${f.full} sub-score (0–100), weight ${Math.round(f.w * 100)}% of the composite`
      : `${f.full} — derived aggregate, not a direct weighted factor`,
    get: (h) => (h.scoreParts ? h.scoreParts[f.key] : null),
    cell: (h) => td(factorBadge(h.scoreParts ? h.scoreParts[f.key] : null), "center"),
  };
}

const BASE_COLS = ["ticker", "name", "exposure", "score", "price", "change_pct", "market_cap"];
// The five metric-based score factors, as column sets — each shows exactly the
// indicators its score-breakdown factor measures (+ Consensus / Trends / Scores).
const COLSETS = {
  valuation: ["trailing_pe", "forward_pe", "price_to_sales", "ev_ebitda", "price_to_book", "peg"],
  moat:      ["gross_margin", "operating_margin", "profit_margin", "roe", "roa"],
  growth:    ["revenue_growth", "earnings_growth"],
  technical: ["pct_off_high", "pct_vs_ma50", "pct_vs_ma200"],
  health:    ["debt_to_equity", "current_ratio"],
  exposure:  ["layers_count", "beta", "revenue_growth"],
  consensus: ["target_price", "implied_upside", "recommendation", "dividend_yield", "earnings"],
  trends:    ["score_d1", "score_d7", "price_d7"],
  scores:    SCORE_COLS.map((f) => "sf_" + f.key),
};
if (!COLSETS[STATE.colset]) STATE.colset = "valuation";   // reset stale saved value (e.g. old "momentum")
const activeColKeys = () => [...BASE_COLS, ...(COLSETS[STATE.colset] || [])];

// ---- data load ----------------------------------------------------------
async function load(refresh = false) {
  const btn = $("#refresh");
  btn.disabled = true;
  btn.classList.add("is-busy");
  btn.setAttribute("aria-busy", "true");
  const label = btn.querySelector(".btn-refresh__label");
  if (label) label.textContent = refresh ? "Refreshing…" : "Loading…";
  const statusEl = $("#status");
  const statusDot = $("#statusDot");
  statusEl.textContent = refresh ? "Refreshing snapshot…" : "Loading universe…";
  if (statusDot) statusDot.dataset.health = "loading";
  try {
    const res = await fetch(refresh ? "/api/refresh" : "/api/screen");
    if (!res.ok) throw new Error("HTTP " + res.status);
    const data = await res.json();
    if (!data || !Array.isArray(data.layers)) throw new Error("Invalid screener payload");
    STATE.layers = data.layers;
    STATE.marketState = data.market_state;
    attachScores();
    const when = new Date(data.fetched_at * 1000).toLocaleTimeString();
    const names = uniqueHoldings().length;
    statusEl.innerHTML =
      `<b>${names}</b> names · ${data.layers.length} layers · ` +
      `${data.ok_count}/${data.ticker_count} with data ${marketPill()}`;
    $("#meta").textContent = `${data.cached ? "cached" : "fresh"} · updated ${when}`;
    const kpiOk = $("#kpiOk");
    if (kpiOk) kpiOk.textContent = `${data.ok_count}/${data.ticker_count}`;
    const kpiNames = $("#kpiNames");
    if (kpiNames) kpiNames.textContent = String(names);
    if (statusDot) {
      const ratio = data.ticker_count ? data.ok_count / data.ticker_count : 0;
      statusDot.dataset.health = ratio >= 0.85 ? "live" : ratio > 0 ? "stale" : "error";
    }
    buildFiltersPanel();
    buildThemeBar();
    renderTicker();
    render();
    syncHistory();
    if (STATE.mode === "map" && window.GlobalMap) window.GlobalMap.render();
    if (STATE.mode === "analyst") initAnalyst();
  } catch (e) {
    console.error(e);
    statusEl.textContent = "Couldn’t load the market snapshot.";
    if (statusDot) statusDot.dataset.health = "error";
    const root = $("#layers");
    if (root) {
      root.innerHTML = `<div class="error-state" role="alert">
        <h3>Snapshot unavailable</h3>
        <p>The screener couldn’t load data. Check your connection, then try again.</p>
        <button type="button" class="btn-refresh" id="retryLoad">Retry</button>
      </div>`;
      root.querySelector("#retryLoad")?.addEventListener("click", () => load(true));
    }
  } finally {
    btn.disabled = false;
    btn.classList.remove("is-busy");
    btn.removeAttribute("aria-busy");
    if (label) label.textContent = "Refresh";
  }
}

// ---- derived data -------------------------------------------------------
function uniqueHoldings() {
  const byTicker = new Map();
  for (const layer of STATE.layers) {
    for (const h of layer.holdings) {
      if (!byTicker.has(h.ticker)) {
        const e = { ...h, layers: [] };
        // the de-duplicated (flat) view spans all layers, so it always shows the
        // universe-basis score even when the grouped view is ranking within layers.
        if (h.scoreUniverse !== undefined) {
          e.score = h.scoreUniverse; e.scoreParts = h.scorePartsUniverse; e.scoreCov = h.scoreCovUniverse;
        }
        byTicker.set(h.ticker, e);
      }
      byTicker.get(h.ticker).layers.push(layer.id);
    }
  }
  return [...byTicker.values()];
}

// ---- composite score ----------------------------------------------------
// An all-encompassing 0–100 score: six weighted factors, each the average of
// its metrics' percentile ranks across the universe. Every input is relative
// (a name is "cheap"/"strong" only vs its peers here). `dir:1` = higher better,
// `dir:-1` = lower better; `pos` = ignore non-positive values (a negative
// multiple isn't cheap, it's unprofitable). Missing data → neutral (50).
const SCORE_FACTORS = [
  { key: "valuation", label: "Valuation", weight: 0.18, metrics: [
    { k: "forward_pe", dir: -1, pos: true }, { k: "trailing_pe", dir: -1, pos: true },
    { k: "price_to_sales", dir: -1, pos: true }, { k: "ev_ebitda", dir: -1, pos: true },
    { k: "price_to_book", dir: -1, pos: true }, { k: "peg", dir: -1, pos: true },
    { k: "fcf_yield", dir: 1 } ] },
  { key: "moat", label: "Moat & quality", weight: 0.20, metrics: [
    { k: "gross_margin", dir: 1 }, { k: "operating_margin", dir: 1 }, { k: "profit_margin", dir: 1 },
    { k: "roe", dir: 1 }, { k: "roa", dir: 1 } ] },
  { key: "growth", label: "Growth", weight: 0.14, metrics: [
    { k: "revenue_growth", dir: 1 }, { k: "earnings_growth", dir: 1 },
    { k: "rule_of_40", dir: 1 } ] },
  { key: "technical", label: "Technical trend", weight: 0.15, metrics: [
    { k: "pct_vs_ma50", dir: 1 }, { k: "pct_vs_ma200", dir: 1 },
    { k: "range_pos", dir: 1 }, { k: "pct_off_high", dir: 1 },
    { k: "week52_change", dir: 1 } ] },
  { key: "health", label: "Financial health", weight: 0.10, metrics: [
    { k: "debt_to_equity", dir: -1, pos: true }, { k: "current_ratio", dir: 1 },
    { k: "beta", dir: -1, pos: true } ] },
  { key: "consensus", label: "Analyst consensus", weight: 0.08, metrics: [
    { k: "implied_upside", dir: 1 }, { k: "recommendation_mean", dir: -1, pos: true } ] },
  { key: "exposure", label: "Thematic exposure", weight: 0.15, special: "exposure" },
];

function pctile(pool, v, higherBetter) {
  if (v == null || !pool.length) return null;
  const below = pool.filter((x) => x < v).length;
  const eq = pool.filter((x) => x === v).length;
  const p = (below + eq / 2) / pool.length;
  return higherBetter ? p : 1 - p;
}
// Score one pool of holdings: each factor = average percentile rank of its
// metrics *within this pool*, then weighted. Returns ticker -> {score, parts, cov}
// where cov[factor] = "have/total" metrics that had data (so a thin score shows).
// Pools are winsorized at 2nd/98th pct so one extreme outlier (e.g. a 4000× P/E)
// doesn't collapse everyone else's rank.
function computeScores(list) {
  const ok = list.filter((h) => h.market && h.market.ok);
  const pools = {}, wlo = {}, whi = {};
  for (const f of SCORE_FACTORS) for (const mt of (f.metrics || [])) {
    if (pools[mt.k]) continue;
    const raw = ok.map((h) => h.market[mt.k]).filter((v) => v != null && (!mt.pos || v > 0));
    if (raw.length >= 10) {
      const s = [...raw].sort((a, b) => a - b);
      const lo = s[Math.floor(0.02 * s.length)], hi = s[Math.floor(0.98 * s.length)];
      pools[mt.k] = raw.map((x) => Math.max(lo, Math.min(hi, x)));
      wlo[mt.k] = lo; whi[mt.k] = hi;
    } else {
      pools[mt.k] = raw; wlo[mt.k] = -Infinity; whi[mt.k] = Infinity;
    }
  }
  // Precompute factor lists for Setup (fundamentals) and Trigger (trend) aggregates.
  const setupFs = SCORE_FACTORS.filter((f) => ["valuation", "moat", "growth", "health"].includes(f.key));
  const trigFs  = SCORE_FACTORS.filter((f) => ["technical", "consensus"].includes(f.key));
  const setupW  = setupFs.reduce((s, f) => s + f.weight, 0);
  const trigW   = trigFs.reduce((s, f)  => s + f.weight, 0);
  const out = {};
  for (const h of ok) {
    const parts = {}, cov = {};
    for (const f of SCORE_FACTORS) {
      if (f.special === "exposure") { parts[f.key] = Math.round((EXPOSURE_SCORE[h.exposure] ?? 0.4) * 100); cov[f.key] = null; continue; }
      const vals = [];
      for (const mt of f.metrics) {
        const raw = h.market[mt.k];
        if (raw == null || (mt.pos && raw <= 0)) continue;
        const v = Math.max(wlo[mt.k], Math.min(whi[mt.k], raw));   // clamp to winsorized range
        const p = pctile(pools[mt.k], v, mt.dir === 1);
        if (p != null) vals.push(p);
      }
      parts[f.key] = vals.length ? Math.round(vals.reduce((a, b) => a + b, 0) / vals.length * 100) : 50;
      cov[f.key] = `${vals.length}/${f.metrics.length}`;
    }
    const composite = SCORE_FACTORS.reduce((s, f) => s + f.weight * (parts[f.key] / 100), 0);
    // Setup = fundamental quality; Trigger = trend confirmation (both re-normalized to 0–100).
    parts.setup   = Math.round(setupFs.reduce((s, f) => s + f.weight * (parts[f.key] / 100), 0) / setupW * 100);
    parts.trigger = Math.round(trigFs.reduce((s, f)  => s + f.weight * (parts[f.key] / 100), 0) / trigW  * 100);
    out[h.ticker] = { score: Math.round(composite * 100), parts, cov };
  }
  return out;
}

function attachScores() {
  const uniq = uniqueHoldings().filter((h) => h.market && h.market.ok);
  // derive two composite-only metrics onto each holding's market data (shared by
  // reference with the layer holdings, so both bases see them)
  for (const h of uniq) {
    const m = h.market;
    m.fcf_yield = (m.free_cashflow != null && m.market_cap) ? m.free_cashflow / m.market_cap : null;
    m.range_pos = (m.price != null && m.high_52w != null && m.low_52w != null && m.high_52w > m.low_52w)
      ? (m.price - m.low_52w) / (m.high_52w - m.low_52w) : null;
    m.rule_of_40 = (m.revenue_growth != null && m.operating_margin != null)
      ? m.revenue_growth * 100 + m.operating_margin * 100 : null;
  }
  // always compute the universe basis (the flat view + the fallback); compute the
  // per-layer basis lazily only when that mode is active.
  const universe = computeScores(uniq);
  const layerMaps = {};
  if (STATE.scoreMode === "layer") {
    for (const layer of STATE.layers) layerMaps[layer.id] = computeScores(layer.holdings);
  }
  for (const layer of STATE.layers) for (const h of layer.holdings) {
    const u = universe[h.ticker] || null;
    h.scoreUniverse = u ? u.score : null;
    h.scorePartsUniverse = u ? u.parts : null;
    h.scoreCovUniverse = u ? u.cov : null;
    if (STATE.scoreMode === "layer") {
      const lm = (layerMaps[layer.id] || {})[h.ticker] || u;
      h.score = lm ? lm.score : null;
      h.scoreParts = lm ? lm.parts : null;
      h.scoreCov = lm ? lm.cov : null;
    } else {
      h.score = h.scoreUniverse; h.scoreParts = h.scorePartsUniverse; h.scoreCov = h.scoreCovUniverse;
    }
  }
}

// ---- scoring methodology modal (built from SCORE_FACTORS so it always matches
// the real computation) --------------------------------------------------
const METRIC_LABEL = {
  forward_pe: "Forward P/E", trailing_pe: "Trailing P/E", price_to_sales: "P/S",
  ev_ebitda: "EV/EBITDA", price_to_book: "P/B", peg: "PEG", fcf_yield: "FCF yield",
  gross_margin: "Gross margin", operating_margin: "Operating margin", profit_margin: "Net margin",
  roe: "ROE", roa: "ROA", revenue_growth: "Revenue growth", earnings_growth: "Earnings growth",
  pct_vs_ma50: "% vs 50-day MA", pct_vs_ma200: "% vs 200-day MA",
  range_pos: "52-week range position", pct_off_high: "% off 52-week high",
  debt_to_equity: "Debt / equity", current_ratio: "Current ratio", beta: "Beta",
  implied_upside: "Implied upside vs target", recommendation_mean: "Analyst rating",
  week52_change: "52-week return (momentum)", rule_of_40: "Rule of 40 (rev growth % + op margin %)",
};
function scoreMethodologyHtml() {
  const rows = SCORE_FACTORS.map((f) => {
    const w = Math.round(f.weight * 100);
    let metrics;
    if (f.special === "exposure") {
      metrics = "From the thematic-exposure rating — pure 100 · high 70 · moderate 40 · diversified 15.";
    } else {
      metrics = f.metrics.map((mt) =>
        `${METRIC_LABEL[mt.k] || mt.k} <span class="mm-${mt.dir === 1 ? "up" : "down"}">${mt.dir === 1 ? "↑" : "↓"}</span>`).join(" · ");
    }
    return `<tr><td class="mm-f">${f.label}</td><td class="mm-w">${w}%</td><td class="mm-m">${metrics}</td></tr>`;
  }).join("");
  return `
    <p>The <b>Score</b> is a 0–100 composite of seven factors. For each factor we take its metrics,
    <b>winsorize</b> the universe distribution at the 2nd/98th percentile (so one extreme outlier
    doesn't collapse everyone else's rank), convert each to a <b>percentile rank</b> within the peer
    pool (0 = worst, 100 = best), average those percentiles, then weight and sum the factors.</p>
    <p>The breakdown also shows two derived aggregates — <b>Setup</b> (val + moat + growth + health:
    "is this a good business at a fair price?") and <b>Trigger</b> (technical + consensus: "is the
    market confirming it now?") — to separate fundamental quality from trend confirmation and avoid
    the value-trap failure mode where a high fundamental score sits while the stock bleeds.</p>
    <table class="mm-table">
      <thead><tr><th>Factor</th><th>Weight</th><th>Metrics &nbsp;(<span class="mm-up">↑</span> higher better · <span class="mm-down">↓</span> lower better)</th></tr></thead>
      <tbody>${rows}</tbody>
    </table>
    <ul class="mm-notes">
      <li><b>Peer pool</b> = the whole universe, or same-layer peers — set by the <b>Score vs: Universe / Layer</b> toggle.</li>
      <li><b>Negative or zero valuation multiples are ignored</b> (a negative P/E isn't "cheap").</li>
      <li><b>Missing data</b> for a metric is skipped; a factor with no usable data defaults to a neutral <b>50</b>. A row's <i>Score breakdown</i> shows a coverage chip (e.g. <code>2/7</code>) for how much data backed each factor.</li>
      <li><b>Setup ≥ 60 + Trigger ≥ 60</b> → Buy zone · <b>Setup ≥ 60 + Trigger &lt; 40</b> → Watch · <b>Setup &lt; 40 + Trigger ≥ 60</b> → Momentum · <b>both &lt; 40</b> → Avoid.</li>
      <li>Weights live in <code>SCORE_FACTORS</code> (<code>static/app.js</code>) — tweak them freely.</li>
      <li class="mm-warn">Inputs come from Yahoo Finance and can be delayed, incomplete, or wrong. Treat the score as a <b>relative screen, not a verdict</b>.</li>
    </ul>`;
}
let SCORE_MODAL_RETURN = null;
function scoreModalFocusables(root) {
  return [...root.querySelectorAll('button, [href], input, select, textarea, [tabindex]:not([tabindex="-1"])')]
    .filter((n) => !n.hasAttribute("disabled") && n.getAttribute("aria-hidden") !== "true");
}
function onScoreModalKeydown(e) {
  const el = $("#scoreModal");
  if (!el || el.classList.contains("hidden")) return;
  if (e.key === "Escape") { e.preventDefault(); closeScoreModal(); return; }
  if (e.key !== "Tab") return;
  const nodes = scoreModalFocusables(el);
  if (!nodes.length) return;
  const first = nodes[0], last = nodes[nodes.length - 1];
  if (e.shiftKey && document.activeElement === first) { e.preventDefault(); last.focus(); }
  else if (!e.shiftKey && document.activeElement === last) { e.preventDefault(); first.focus(); }
}
function openScoreModal() {
  const el = $("#scoreModal");
  if (!el) return;
  SCORE_MODAL_RETURN = document.activeElement;
  el.innerHTML = `<div class="modal-box">
    <div class="modal-head"><h3 id="scoreModalTitle">How the composite score is derived</h3><button type="button" class="modal-x" id="scoreModalX" aria-label="Close scoring help">✕</button></div>
    <div class="modal-body">${scoreMethodologyHtml()}</div></div>`;
  el.classList.remove("hidden");
  el.removeAttribute("hidden");
  el.querySelector("#scoreModalX").addEventListener("click", closeScoreModal);
  el.onclick = (e) => { if (e.target === el) closeScoreModal(); };
  document.addEventListener("keydown", onScoreModalKeydown);
  requestAnimationFrame(() => el.querySelector("#scoreModalX")?.focus());
}
function closeScoreModal() {
  const el = $("#scoreModal");
  if (!el) return;
  el.classList.add("hidden");
  el.setAttribute("hidden", "");
  el.innerHTML = "";
  el.onclick = null;
  document.removeEventListener("keydown", onScoreModalKeydown);
  const ret = SCORE_MODAL_RETURN;
  SCORE_MODAL_RETURN = null;
  if (ret && typeof ret.focus === "function") ret.focus();
}
function setFiltersDrawer(open) {
  STATE.panelOpen = open;
  const drawer = $("#filtersDrawer");
  if (drawer) {
    drawer.classList.toggle("hidden", !open);
    if (open) drawer.removeAttribute("hidden");
    else drawer.setAttribute("hidden", "");
  }
  $("#filtersPanel")?.classList.toggle("hidden", !open);
}

// ---- filtering / sorting ------------------------------------------------
function anyFilterActive() {
  if (STATE.query.trim()) return true;
  if (STATE.exposure.size) return true;
  if (STATE.tags.size) return true;
  return ALL_METRICS.some((m) => {
    const v = STATE.valuation[m.key];
    return v && (v.min != null || v.max != null);
  });
}
function activeFilterCount() {
  return ALL_METRICS.filter((m) => {
    const v = STATE.valuation[m.key];
    return v && (v.min != null || v.max != null);
  }).length;
}
function passesFilters(h) {
  if (STATE.exposure.size && !STATE.exposure.has(h.exposure)) return false;
  if (STATE.tags.size) {
    const ht = h.tags || [];
    if (![...STATE.tags].some((t) => ht.includes(t))) return false;   // OR across selected themes
  }
  for (const m of ALL_METRICS) {
    const v = STATE.valuation[m.key];
    if (!v) continue;
    const val = h.market ? h.market[m.key] : null;
    if (v.min != null) { if (val == null || val < v.min * m.scale) return false; }
    if (v.max != null) { if (val == null || val > v.max * m.scale) return false; }
  }
  const q = STATE.query.trim().toLowerCase();
  if (!q) return true;
  return [h.ticker, h.name, h.exposure, ...(h.tags || [])].join(" ").toLowerCase().includes(q);
}
function sortHoldings(holdings) {
  const { col, asc } = STATE.sort;
  const colDef = COLUMNS[col] || COLUMNS.market_cap;
  const dir = asc ? 1 : -1;
  return [...holdings].sort((a, b) => {
    let va = colDef.get(a), vb = colDef.get(b);
    if (typeof va === "string") return va.localeCompare(vb) * dir;
    if (va == null) return 1;
    if (vb == null) return -1;
    return (va - vb) * dir;
  });
}

// ---- market state / movers ---------------------------------------------
function marketPill() {
  const s = (STATE.marketState || "").toUpperCase();
  if (!s) return "";
  if (s === "REGULAR") return `<span class="mkt open">● Market open</span>`;
  if (s === "PRE") return `<span class="mkt extend">● Pre-market</span>`;
  if (s === "POST" || s === "POSTPOST") return `<span class="mkt extend">● After hours</span>`;
  return `<span class="mkt closed">● Market closed</span>`;
}
// ---- retro ticker tape (NYSE-style scrolling movers) -------------------
function renderTicker() {
  const track = $("#ttTrack");
  if (!track) return;
  // all names with a quote, ordered biggest move first → top movers lead the tape
  const names = uniqueHoldings()
    .filter((h) => h.market && h.market.change_pct != null)
    .sort((a, b) => Math.abs(b.market.change_pct) - Math.abs(a.market.change_pct));
  if (!names.length) { track.innerHTML = ""; return; }

  const item = (h) => {
    const c = h.market.change_pct;
    const cls = c > 0 ? "pos" : c < 0 ? "neg" : "flat";
    const arrow = c > 0 ? "▲" : c < 0 ? "▼" : "◆";
    return `<button type="button" class="tt-item" data-tk="${escapeHtml(h.ticker)}" aria-label="${escapeHtml(h.ticker)} ${escapeHtml(h.name || "")}">` +
      `<span class="tt-sym">${escapeHtml(h.ticker)}</span>` +
      `<span class="tt-px">${fmtPrice(h.market.price)}</span>` +
      `<span class="tt-chg ${cls}">${arrow}${fmtPct(c)}</span></button>`;
  };
  const seq = names.map(item).join("");
  // duplicate the sequence so the -50% loop is seamless; speed scales with length
  track.innerHTML = seq + seq;
  track.style.animationDuration = Math.max(28, names.length * 2.2) + "s";

  // market-state cap (left, non-scrolling)
  const cap = $("#ttCap");
  if (cap) {
    const s = (STATE.marketState || "").toUpperCase();
    const label = s === "REGULAR" ? "LIVE" : s === "PRE" ? "PRE-MKT" : (s === "POST" || s === "POSTPOST") ? "AFT-HRS" : s ? "CLOSED" : "MARKETS";
    cap.dataset.state = s === "REGULAR" ? "open" : (s === "PRE" || s === "POST" || s === "POSTPOST") ? "extend" : "closed";
    cap.innerHTML = `<span class="tt-dot"></span>${label}`;
  }

  track.querySelectorAll(".tt-item").forEach((el) =>
    el.addEventListener("click", () => window.searchScreener(el.dataset.tk)));
}

// ---- history / trends / alerts -----------------------------------------
// Record today's snapshot (price + the stable universe-basis score + a couple of
// trend metrics) then pull back day-over-day deltas. Builds up over time.
async function syncHistory() {
  const rows = uniqueHoldings()
    .filter((h) => h.market && h.market.ok)
    .map((h) => ({
      ticker: h.ticker,
      price: h.market.price,
      score: h.scoreUniverse != null ? h.scoreUniverse : h.score,
      market_cap: h.market.market_cap,
      pct_off_high: h.market.pct_off_high,
      pct_vs_ma200: h.market.pct_vs_ma200,
    }));
  try {
    await fetch("/api/snapshot", { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ rows }) });
    const res = await fetch("/api/deltas");
    STATE.deltas = (await res.json()).deltas || {};
  } catch { STATE.deltas = {}; }
  renderAlerts();
  render();
}

const dl = (tk) => STATE.deltas[tk] || null;       // delta record for a ticker
function fmtScoreDelta(n) {
  if (n == null) return "—";
  return (n > 0 ? "+" : "") + n;
}

// Alerts: meaningful, recent changes worth a glance. Each needs prior history,
// so they appear only once ≥2 snapshots exist. Kept conservative on purpose.
function deriveAlerts() {
  const out = [];
  for (const h of uniqueHoldings()) {
    const d = dl(h.ticker);
    if (!d) continue;
    const s = h.scoreUniverse != null ? h.scoreUniverse : h.score;
    if (d.score_1d != null) {
      const prev = s - d.score_1d;
      if (prev < 70 && s >= 70) out.push({ tk: h.ticker, kind: "up", msg: `score crossed 70 (now ${s})` });
      else if (prev >= 40 && s < 40) out.push({ tk: h.ticker, kind: "down", msg: `score fell below 40 (now ${s})` });
    }
    if (d.price_7d != null && Math.abs(d.price_7d) >= 10) {
      out.push({ tk: h.ticker, kind: d.price_7d > 0 ? "up" : "down", msg: `${d.price_7d > 0 ? "+" : ""}${d.price_7d.toFixed(1)}% over ~7d` });
    }
  }
  // strongest moves first
  return out.slice(0, 12);
}
function renderAlerts() {
  const el = $("#alerts");
  if (!el) return;
  if (STATE.mode !== "screener") { el.classList.add("hidden"); el.innerHTML = ""; return; }
  const alerts = deriveAlerts();
  if (!alerts.length) { el.classList.add("hidden"); el.innerHTML = ""; return; }
  el.classList.remove("hidden");
  el.innerHTML = `<span class="al-h">⚑ ${alerts.length} alert${alerts.length > 1 ? "s" : ""}</span>` +
    alerts.map((a) => `<button class="al-item ${a.kind}" data-tk="${a.tk}"><b>${a.tk}</b> ${escapeHtml(a.msg)}</button>`).join("");
  el.querySelectorAll(".al-item").forEach((b) =>
    b.addEventListener("click", () => { window.searchScreener(b.dataset.tk); }));
}

// tiny inline sparkline SVG from a numeric series
function sparkline(values, color) {
  const v = values.filter((x) => x != null);
  if (v.length < 2) return `<span class="spark-empty">collecting…</span>`;
  const min = Math.min(...v), max = Math.max(...v), span = max - min || 1;
  const W = 120, H = 28, n = v.length;
  const pts = v.map((x, i) => `${(i / (n - 1) * W).toFixed(1)},${(H - (x - min) / span * H).toFixed(1)}`).join(" ");
  const last = v[v.length - 1], first = v[0];
  const stroke = color || (last >= first ? "var(--green)" : "var(--red)");
  return `<svg class="spark" viewBox="0 0 ${W} ${H}" width="${W}" height="${H}" preserveAspectRatio="none">
    <polyline points="${pts}" fill="none" stroke="${stroke}" stroke-width="1.5" stroke-linejoin="round" stroke-linecap="round"/></svg>`;
}
async function fetchHistory(ticker) {
  HIST_CACHE[ticker] = "loading";
  try {
    const res = await fetch("/api/history/" + encodeURIComponent(ticker));
    HIST_CACHE[ticker] = (await res.json()).series || [];
  } catch { HIST_CACHE[ticker] = "error"; }
  render();
}
// ---- interactive price+score trend chart -------------------------------
const TC = { W: 660, H: 230, padL: 48, padR: 50, padT: 16, padB: 24 };
function tcScales(series) {
  const prices = series.map((s) => s.price), scores = series.map((s) => s.score);
  const minP = Math.min(...prices), maxP = Math.max(...prices);
  const minS = Math.min(...scores), maxS = Math.max(...scores);
  const plotW = TC.W - TC.padL - TC.padR, plotH = TC.H - TC.padT - TC.padB, n = series.length;
  return {
    n, minP, maxP, minS, maxS, plotW, plotH,
    x: (i) => TC.padL + (n <= 1 ? 0 : i / (n - 1)) * plotW,
    yP: (p) => TC.padT + (1 - (p - minP) / ((maxP - minP) || 1)) * plotH,
    yS: (s) => TC.padT + (1 - (s - minS) / ((maxS - minS) || 1)) * plotH,
  };
}
function trendChart(series) {
  const sc = tcScales(series), { padL, padR, padT, W, H } = TC, bottom = padT + sc.plotH;
  const ptsP = series.map((s, i) => `${sc.x(i).toFixed(1)},${sc.yP(s.price).toFixed(1)}`).join(" ");
  const ptsS = series.map((s, i) => `${sc.x(i).toFixed(1)},${sc.yS(s.score).toFixed(1)}`).join(" ");
  const grid = [0, 0.5, 1].map((t) => { const y = (padT + t * sc.plotH).toFixed(1); return `<line x1="${padL}" y1="${y}" x2="${W - padR}" y2="${y}" class="tc-grid"/>`; }).join("");
  const last = series[series.length - 1];
  // price (left) + score (right) axis min/max labels
  const axes =
    `<text x="${padL - 6}" y="${padT + 4}" text-anchor="end" class="tc-axp">${fmtPrice(sc.maxP)}</text>` +
    `<text x="${padL - 6}" y="${bottom}" text-anchor="end" class="tc-axp">${fmtPrice(sc.minP)}</text>` +
    `<text x="${W - padR + 6}" y="${padT + 4}" class="tc-axs">${sc.maxS}</text>` +
    `<text x="${W - padR + 6}" y="${bottom}" class="tc-axs">${sc.minS}</text>`;
  const dates = [0, Math.floor((sc.n - 1) / 2), sc.n - 1].map((i, k) =>
    `<text x="${sc.x(i).toFixed(1)}" y="${H - 6}" text-anchor="${k === 0 ? "start" : k === 2 ? "end" : "middle"}" class="tc-axd">${series[i].date.slice(5)}</text>`).join("");
  return `<div class="tc-wrap">
    <div class="tc-legend"><span class="tc-leg tc-leg-p">● Price</span><span class="tc-leg tc-leg-s">● Score</span>
      <span class="tc-readout" id="tcReadout">latest · ${last.date} · $${fmtPrice(last.price)} · score ${last.score}</span></div>
    <svg class="tchart" viewBox="0 0 ${W} ${H}" preserveAspectRatio="xMidYMid meet">
      ${grid}${axes}${dates}
      <polyline class="tc-price" points="${ptsP}"/>
      <polyline class="tc-score" points="${ptsS}"/>
      <g class="tc-cross" style="display:none">
        <line class="tc-vline" y1="${padT}" y2="${bottom.toFixed(1)}"/>
        <circle class="tc-dotP" r="4"/><circle class="tc-dotS" r="4"/>
      </g>
      <rect class="tc-overlay" x="${padL}" y="${padT}" width="${sc.plotW}" height="${sc.plotH}" fill="transparent"/>
    </svg></div>`;
}
function wireTrendChart(root, series) {
  const svg = root.querySelector(".tchart");
  if (!svg || series.length < 2) return;
  const overlay = svg.querySelector(".tc-overlay"), cross = svg.querySelector(".tc-cross");
  const vline = svg.querySelector(".tc-vline"), dotP = svg.querySelector(".tc-dotP"), dotS = svg.querySelector(".tc-dotS");
  const readout = root.querySelector("#tcReadout");
  const sc = tcScales(series), last = series[series.length - 1];
  const dflt = `latest · ${last.date} · $${fmtPrice(last.price)} · score ${last.score}`;
  const move = (e) => {
    const r = overlay.getBoundingClientRect();
    const f = Math.max(0, Math.min(1, (e.clientX - r.left) / r.width));
    const i = Math.max(0, Math.min(sc.n - 1, Math.round(f * (sc.n - 1))));
    const s = series[i], x = sc.x(i);
    vline.setAttribute("x1", x); vline.setAttribute("x2", x);
    dotP.setAttribute("cx", x); dotP.setAttribute("cy", sc.yP(s.price));
    dotS.setAttribute("cx", x); dotS.setAttribute("cy", sc.yS(s.score));
    cross.style.display = "";
    readout.innerHTML = `<b>${s.date}</b> · <span class="tc-leg-p">$${fmtPrice(s.price)}</span> · <span class="tc-leg-s">score ${s.score}</span>`;
  };
  overlay.addEventListener("mousemove", move);
  overlay.addEventListener("mouseleave", () => { cross.style.display = "none"; readout.textContent = dflt; });
}

function backfillControls(thin) {
  return `<div class="hist-bf">
    <span class="muted">${thin ? "Load close-of-day price &amp; score history:" : "Extend history:"}</span>
    <button class="hbf" data-m="1">1 mo</button>
    <button class="hbf" data-m="3">3 mo</button>
    <button class="hbf" data-m="6">6 mo</button></div>`;
}
function histHtml(ticker) {
  const c = HIST_CACHE[ticker];
  if (c === undefined) { fetchHistory(ticker); return `<div class="news-status">Loading trend…</div>`; }
  if (c === "loading") return `<div class="news-status">Loading trend…</div>`;
  if (c === "error") return `<div class="news-status">Couldn't load history.</div>`;
  if (c.length < 2) {
    return `<div class="news-status">No stored history yet — backfill it from past closes, then it accrues daily.</div>${backfillControls(true)}`;
  }
  const days = c.length;
  return `<div class="hist">
    ${trendChart(c)}
    <div class="hist-note">${days} daily points · ${c[0].date} → ${c[c.length - 1].date}</div>
    ${backfillControls(false)}</div>`;
}
let BACKFILL_BUSY = false;
async function backfillHistory(months) {
  if (BACKFILL_BUSY) return;
  BACKFILL_BUSY = true;
  document.querySelectorAll(".hist-bf").forEach((el) =>
    el.innerHTML = `<span class="muted">Reconstructing ${months} month${months > 1 ? "s" : ""} of price &amp; score across the universe… (~20–40s)</span>`);
  try {
    const r = await fetch("/api/backfill?months=" + months);
    await r.json();
  } catch { /* ignore */ }
  for (const k in HIST_CACHE) delete HIST_CACHE[k];   // force every trend to re-fetch
  BACKFILL_BUSY = false;
  render();
}

// ---- theme / sub-layer tag chips ---------------------------------------
function topTags(n = 30) {
  const freq = {};
  for (const h of uniqueHoldings()) for (const t of (h.tags || [])) {
    if (t === "foreign") continue;
    freq[t] = (freq[t] || 0) + 1;
  }
  return Object.entries(freq).sort((a, b) => b[1] - a[1] || a[0].localeCompare(b[0])).slice(0, n);
}
function buildThemeBar() {
  const bar = $("#themeBar");
  if (!bar) return;
  const tags = topTags(30);
  if (!tags.length) { bar.innerHTML = ""; return; }
  bar.innerHTML = `<span class="flabel">Themes:</span>` +
    tags.map(([t, c]) =>
      `<button class="theme-chip${STATE.tags.has(t) ? " active" : ""}" data-tag="${t}" title="${c} names tagged “${t}”">${t}<span class="tc-n">${c}</span></button>`).join("") +
    (STATE.tags.size ? `<button class="theme-clear" id="themeClear">✕ clear themes</button>` : "");
  bar.querySelectorAll(".theme-chip").forEach((b) =>
    b.addEventListener("click", () => {
      const t = b.dataset.tag;
      if (STATE.tags.has(t)) STATE.tags.delete(t); else STATE.tags.add(t);
      savePrefs(); buildThemeBar(); render();
    }));
  const tc = $("#themeClear");
  if (tc) tc.addEventListener("click", () => { STATE.tags.clear(); savePrefs(); buildThemeBar(); render(); });
}

// ---- filter panel -------------------------------------------------------
function metricRange(key) {
  const vals = uniqueHoldings().map((h) => h.market && h.market[key]).filter((v) => v != null);
  if (!vals.length) return null;
  return { min: Math.min(...vals), max: Math.max(...vals) };
}
function rangeHint(m) {
  const r = metricRange(m.key);
  if (!r) return "no data";
  if (m.kind === "money") return `range ${fmtMoney(r.min)}–${fmtMoney(r.max)}`;
  if (m.kind === "pctfrac") return `range ${(r.min * 100).toFixed(0)}–${(r.max * 100).toFixed(0)}%`;
  if (m.kind === "pct") return `range ${r.min.toFixed(0)}–${r.max.toFixed(0)}%`;
  return `range ${fmtNum(r.min)}–${fmtNum(r.max)}`;
}
function buildFiltersPanel() {
  const panel = $("#filtersPanel");
  if (!panel) return;
  const groups = FILTER_GROUPS.map((g) => {
    const rows = g.metrics.map((m) => {
      const v = STATE.valuation[m.key] || {};
      const val = (b) => (v[b] != null ? `value="${v[b]}"` : "");
      const idMin = `f-${m.key}-min`, idMax = `f-${m.key}-max`;
      return `
        <div class="vrow">
          <label for="${idMin}">${m.label}${m.unit ? ` <span class="u">${m.unit}</span>` : ""}</label>
          <div class="inputs">
            <input id="${idMin}" type="number" step="any" placeholder="min" data-k="${m.key}" data-b="min" ${val("min")} aria-label="${m.label} minimum" />
            <span class="dash">–</span>
            <input id="${idMax}" type="number" step="any" placeholder="max" data-k="${m.key}" data-b="max" ${val("max")} aria-label="${m.label} maximum" />
          </div>
          <span class="range-hint">${rangeHint(m)}</span>
        </div>`;
    }).join("");
    return `<div class="vgroup"><h4>${g.label}</h4><div class="vgrid">${rows}</div></div>`;
  }).join("");
  panel.innerHTML = `
    <p class="filters-panel__lead">Metric bounds (optional)</p>
    ${groups}
    <div class="vfoot">
      <span class="match"><b id="filterMatchCount">—</b> of ${uniqueHoldings().length} names match</span>
      <button type="button" id="clearFilters">Clear metric filters</button>
      <span class="hint">A name missing a metric is excluded when that metric is bounded (e.g. P/E filters drop unprofitable names).</span>
    </div>`;
  panel.querySelectorAll('input[type="number"]').forEach((inp) => {
    inp.addEventListener("input", () => {
      const k = inp.dataset.k, b = inp.dataset.b, raw = inp.value.trim();
      STATE.valuation[k] = STATE.valuation[k] || { min: null, max: null };
      STATE.valuation[k][b] = raw === "" ? null : parseFloat(raw);
      savePrefs(); render();
    });
  });
  $("#clearFilters").addEventListener("click", () => {
    STATE.valuation = {}; savePrefs(); buildFiltersPanel(); render();
  });
  updateMatchCount();
}
function updateMatchCount() {
  const shown = uniqueHoldings().filter(passesFilters).length;
  const total = uniqueHoldings().length;
  const text = String(shown);
  const el = $("#matchCount");
  if (el) el.textContent = text;
  const fm = $("#filterMatchCount");
  if (fm) fm.textContent = text;
  const of = document.querySelector(".board-count__of");
  if (of) {
    of.textContent = total && shown !== total ? `of ${total}` : total ? "names" : "shown";
  }
}

// ---- table rendering ----------------------------------------------------
function headerRow() {
  const tr = document.createElement("tr");
  for (const key of activeColKeys()) {
    const c = COLUMNS[key];
    const th = document.createElement("th");
    th.scope = "col";
    if (c.title) th.title = c.title;
    if (c.align === "left") th.classList.add("left");
    if (c.align === "center") th.classList.add("center");
    const sorted = STATE.sort.col === key;
    if (sorted) {
      th.classList.add("sorted");
      if (STATE.sort.asc) th.classList.add("asc");
      th.setAttribute("aria-sort", STATE.sort.asc ? "ascending" : "descending");
    } else {
      th.setAttribute("aria-sort", "none");
    }
    const btn = document.createElement("button");
    btn.type = "button";
    btn.className = "th-sort";
    btn.textContent = c.label;
    btn.setAttribute("aria-label", sorted
      ? `Sort by ${c.label}, currently ${STATE.sort.asc ? "ascending" : "descending"}`
      : `Sort by ${c.label}`);
    btn.addEventListener("click", () => {
      if (STATE.sort.col === key) STATE.sort.asc = !STATE.sort.asc;
      else STATE.sort = { col: key, asc: c.align === "left" };
      savePrefs(); render();
    });
    th.appendChild(btn);
    tr.appendChild(th);
  }
  return tr;
}
function buildTable(holdings, showLayers) {
  const keys = activeColKeys();
  const wrap = document.createElement("div");
  wrap.className = "table-wrap";
  const table = document.createElement("table");
  const thead = document.createElement("thead");
  thead.appendChild(headerRow());
  table.appendChild(thead);
  const tbody = document.createElement("tbody");
  for (const h of sortHoldings(holdings)) {
    const tr = document.createElement("tr");
    tr.className = "stock-row";
    tr.tabIndex = 0;
    tr.setAttribute("role", "button");
    tr.setAttribute("aria-expanded", String(STATE.openNews.has(h.ticker)));
    tr.setAttribute("aria-label", `${h.ticker} ${h.name || ""} — expand details`);
    tr.title = "Enter or click for score breakdown and headlines";
    tr.innerHTML = keys.map((k) => COLUMNS[k].cell(h, showLayers)).join("");
    const openDetail = () => toggleNews(h.ticker);
    tr.addEventListener("click", openDetail);
    tr.addEventListener("keydown", (e) => {
      if (e.key === "Enter" || e.key === " ") {
        e.preventDefault();
        openDetail();
      }
    });
    tbody.appendChild(tr);
    if (STATE.openNews.has(h.ticker)) {
      const ntr = document.createElement("tr");
      ntr.className = "news-row";
      ntr.innerHTML = `<td colspan="${keys.length}">${detailHtml(h)}</td>`;
      ntr.querySelectorAll(".dtab").forEach((b) =>
        b.addEventListener("click", (e) => {
          e.stopPropagation();
          STATE.openTab.set(b.dataset.tk, b.dataset.tab);
          render();
        }));
      ntr.querySelectorAll(".sb-method").forEach((b) =>
        b.addEventListener("click", (e) => { e.stopPropagation(); openScoreModal(); }));
      ntr.querySelectorAll(".hbf").forEach((b) =>
        b.addEventListener("click", (e) => { e.stopPropagation(); backfillHistory(+b.dataset.m); }));
      if (ntr.querySelector(".tchart") && Array.isArray(HIST_CACHE[h.ticker])) wireTrendChart(ntr, HIST_CACHE[h.ticker]);
      tbody.appendChild(ntr);
    }
  }
  table.appendChild(tbody);
  wrap.appendChild(table);
  return wrap;
}

// ---- top-level render ---------------------------------------------------
function render() {
  syncToolbar();
  updateMatchCount();
  updateFocusBanner();
  const root = $("#layers");
  root.innerHTML = "";
  const filtersOn = anyFilterActive();

  if (STATE.view === "flat") {
    const holdings = uniqueHoldings().filter(passesFilters);
    if (!holdings.length) {
      root.innerHTML = emptyMsg();
      root.querySelector("#clearFiltersBtn")?.addEventListener("click", clearAllFilters);
      return;
    }
    const sec = document.createElement("section");
    sec.className = "layer";
    sec.innerHTML = `<div class="layer-head static"><h2>All names</h2><span class="count">${holdings.length} unique</span></div>`;
    sec.appendChild(buildTable(holdings, true));
    root.appendChild(sec);
    return;
  }

  let anyShown = false;
  for (const layer of STATE.layers) {
    if (STATE.focusLayer && layer.id !== STATE.focusLayer) continue;
    const visible = layer.holdings.filter(passesFilters);
    if (!visible.length && filtersOn) continue;
    anyShown = true;
    const collapsed = !STATE.focusLayer && STATE.collapsed.has(layer.id);
    const el = document.createElement("section");
    el.className = "layer" + (collapsed ? " collapsed" : "");
    const head = document.createElement("button");
    head.type = "button";
    head.className = "layer-head";
    head.setAttribute("aria-expanded", String(!collapsed));
    head.innerHTML = `<h2>${escapeHtml(layer.name)}</h2><span class="count">${visible.length} names</span><span class="caret" aria-hidden="true">▾</span>`;
    head.addEventListener("click", () => {
      if (STATE.collapsed.has(layer.id)) STATE.collapsed.delete(layer.id);
      else STATE.collapsed.add(layer.id);
      savePrefs(); render();
    });
    el.appendChild(head);
    const blurb = document.createElement("p");
    blurb.className = "blurb";
    blurb.textContent = layer.blurb;
    el.appendChild(blurb);
    el.appendChild(buildTable(visible, false));
    root.appendChild(el);
  }
  if (!anyShown) {
    root.innerHTML = emptyMsg();
    root.querySelector("#clearFiltersBtn")?.addEventListener("click", clearAllFilters);
  }
}
function emptyMsg() {
  const bits = [];
  if (STATE.query) bits.push(`search “${escapeHtml(STATE.query)}”`);
  if (STATE.exposure.size) bits.push(`exposure: ${[...STATE.exposure].map(escapeHtml).join(", ")}`);
  if (STATE.tags.size) bits.push(`themes: ${[...STATE.tags].map(escapeHtml).join(", ")}`);
  if (activeFilterCount()) bits.push(`${activeFilterCount()} metric filter(s)`);
  const detail = bits.length
    ? `<p>No names match <strong>${bits.join(" · ")}</strong>.</p>`
    : `<p>No holdings to show.</p>`;
  return `<div class="empty-state" role="status">
    <h3>No matching names</h3>
    ${detail}
    <button type="button" class="btn-refresh" id="clearFiltersBtn">Clear filters &amp; search</button>
  </div>`;
}

function clearAllFilters() {
  STATE.query = "";
  STATE.exposure.clear();
  STATE.tags.clear();
  STATE.valuation = {};
  STATE.focusLayer = null;
  const s = $("#search");
  if (s) s.value = "";
  savePrefs();
  buildFiltersPanel();
  buildThemeBar();
  render();
}

// ---- toolbar sync + wiring ---------------------------------------------
function syncToolbar() {
  document.querySelectorAll("#viewToggle button").forEach((b) => {
    const on = b.dataset.view === STATE.view;
    b.classList.toggle("active", on);
    b.setAttribute("aria-pressed", String(on));
  });
  document.querySelectorAll("#exposureFilter button").forEach((b) => {
    const on = STATE.exposure.has(b.dataset.exp);
    b.classList.toggle("active", on);
    b.setAttribute("aria-pressed", String(on));
  });
  const cb = activeCapBand();
  document.querySelectorAll("#capFilter button").forEach((b) => {
    const on = b.dataset.cap === cb;
    b.classList.toggle("active", on);
    b.setAttribute("aria-pressed", String(on));
  });
  document.querySelectorAll("#colset button").forEach((b) => {
    const on = b.dataset.cs === STATE.colset;
    b.classList.toggle("active", on);
    b.setAttribute("aria-pressed", String(on));
  });
  document.querySelectorAll("#scoreMode button").forEach((b) => {
    const on = b.dataset.sm === STATE.scoreMode;
    b.classList.toggle("active", on);
    b.setAttribute("aria-pressed", String(on));
  });
  const fb = $("#filtersBtn"), n = activeFilterCount();
  const badge = n + (STATE.tags.size ? STATE.tags.size : 0);
  if (fb) {
    fb.textContent = badge ? `More filters (${badge})` : "More filters";
    fb.classList.toggle("active", STATE.panelOpen || badge > 0);
    fb.setAttribute("aria-expanded", String(STATE.panelOpen));
    fb.setAttribute("aria-controls", "filtersDrawer");
  }
  const drawer = $("#filtersDrawer");
  if (drawer) {
    drawer.classList.toggle("hidden", !STATE.panelOpen);
    if (STATE.panelOpen) drawer.removeAttribute("hidden");
    else drawer.setAttribute("hidden", "");
  }
}

document.querySelectorAll("#viewToggle button").forEach((b) =>
  b.addEventListener("click", () => { STATE.view = b.dataset.view; savePrefs(); render(); }));
document.querySelectorAll("#exposureFilter button").forEach((b) =>
  b.addEventListener("click", () => {
    const e = b.dataset.exp;
    if (STATE.exposure.has(e)) STATE.exposure.delete(e); else STATE.exposure.add(e);
    savePrefs(); render();
  }));
document.querySelectorAll("#capFilter button").forEach((b) =>
  b.addEventListener("click", () => setCapBand(b.dataset.cap)));
document.querySelectorAll("#colset button").forEach((b) =>
  b.addEventListener("click", () => { STATE.colset = b.dataset.cs; savePrefs(); render(); }));
document.querySelectorAll("#scoreMode button").forEach((b) =>
  b.addEventListener("click", () => {
    if (STATE.scoreMode === b.dataset.sm) return;
    STATE.scoreMode = b.dataset.sm; savePrefs();
    attachScores();   // re-rank under the new basis, then redraw
    render();
  }));
$("#filtersBtn")?.addEventListener("click", () => {
  setFiltersDrawer(!STATE.panelOpen);
  savePrefs(); syncToolbar();
});

// ---- mode (screener vs data-center map) --------------------------------
function applyMode() {
  const m = STATE.mode, screener = m === "screener";
  document.querySelectorAll("#mainnav button").forEach((b) => {
    const on = b.dataset.mode === m;
    b.classList.toggle("active", on);
    b.setAttribute("aria-current", on ? "page" : "false");
  });
  const purpose = {
    screener: "Screener — rank holdings by valuation, moat, growth, and composite score",
    map: "Global Map — AI data-center campuses sized by capacity",
    analyst: "AI Analyst — copy a research prompt built from this snapshot",
    backtest: "Backtest — test whether higher scores preceded higher returns (local/CI)",
    lookup: "Lookup — find a ticker and pin it on this device",
  };
  const mp = $("#modePurpose");
  if (mp) mp.textContent = purpose[m] || purpose.screener;
  // screener chrome shows only in screener mode
  $(".filterbar")?.classList.toggle("hidden", !screener);
  const drawer = $("#filtersDrawer");
  if (drawer) {
    const show = screener && STATE.panelOpen;
    drawer.classList.toggle("hidden", !show);
    if (show) drawer.removeAttribute("hidden");
    else drawer.setAttribute("hidden", "");
  }
  $(".statusbar")?.classList.toggle("hidden", !screener);
  $("#layers")?.classList.toggle("hidden", !screener);
  $("#search")?.classList.toggle("hidden", !screener);
  renderAlerts();
  $("#map")?.classList.toggle("hidden", m !== "map");
  $("#backtest")?.classList.toggle("hidden", m !== "backtest");
  $("#analyst")?.classList.toggle("hidden", m !== "analyst");
  $("#lookup")?.classList.toggle("hidden", m !== "lookup");
  updateFocusBanner();
  if (m === "map" && window.GlobalMap) window.GlobalMap.render();
  if (m === "backtest" && window.Backtest) window.Backtest.render();
  if (m === "analyst") initAnalyst();
  if (m === "lookup") initLookup();
}

// called from the Rack Explorer's supplier chips
window.searchScreener = function (q) {
  STATE.mode = "screener"; STATE.focusLayer = null; STATE.query = q;
  const s = $("#search"); if (s) s.value = q;
  savePrefs(); applyMode(); render();
};
function updateFocusBanner() {
  const b = $("#focusBanner");
  if (STATE.mode === "screener" && STATE.view === "layers" && STATE.focusLayer) {
    const layer = STATE.layers.find((l) => l.id === STATE.focusLayer);
    b.classList.remove("hidden");
    b.innerHTML = `<span>Showing only <b>${layer ? layer.name : STATE.focusLayer}</b> — drilled in from the Data Center Map.</span>` +
      `<button id="clearFocus">Show all layers</button>`;
    b.querySelector("#clearFocus").addEventListener("click", () => { STATE.focusLayer = null; render(); });
  } else { b.classList.add("hidden"); b.innerHTML = ""; }
}
window.focusScreenerLayer = function (id) {
  STATE.mode = "screener"; STATE.view = "layers"; STATE.focusLayer = id;
  savePrefs(); applyMode(); render();
  setTimeout(() => $("#focusBanner").scrollIntoView({ behavior: "smooth", block: "start" }), 30);
};
document.querySelectorAll("#mainnav button").forEach((b) =>
  b.addEventListener("click", () => { STATE.mode = b.dataset.mode; savePrefs(); applyMode(); }));

// ---- AI Analyst ---------------------------------------------------------
const ANALYST = { reports: null, hasKey: false, wired: false, ticker: null };

// compact GitHub-flavored-markdown -> HTML (headings, bold/italic/code, links,
// lists, blockquotes, hr, and pipe tables). Input is escaped first.
function mdToHtml(md) {
  const esc = (s) => s.replace(/&/g, "&amp;").replace(/</g, "&lt;").replace(/>/g, "&gt;");
  const inline = (s) => esc(s)
    .replace(/`([^`]+)`/g, "<code>$1</code>")
    .replace(/\*\*([^*]+)\*\*/g, "<strong>$1</strong>")
    .replace(/\*([^*]+)\*/g, "<em>$1</em>")
    .replace(/\[([^\]]+)\]\((https?:\/\/[^\s)]+)\)/g, '<a href="$2" target="_blank" rel="noopener noreferrer">$1</a>');
  const lines = md.replace(/\r/g, "").split("\n");
  let html = "", i = 0;
  const isTableSep = (s) => /^\s*\|?[\s:|-]+\|[\s:|-]*$/.test(s) && s.includes("-");
  const cells = (row) => row.replace(/^\s*\|/, "").replace(/\|\s*$/, "").split("|").map((c) => c.trim());
  while (i < lines.length) {
    const line = lines[i];
    if (!line.trim()) { i++; continue; }
    // table: a header row followed by a separator row (strict GFM), OR — tolerant
    // fallback — a run of 2+ consecutive pipe rows even if the model omitted the
    // separator (some models do). Separator rows are skipped if present.
    const looksRow = (s) => s && s.trim().startsWith("|") && s.includes("|");
    if ((line.includes("|") && i + 1 < lines.length && isTableSep(lines[i + 1])) ||
        (looksRow(line) && looksRow(lines[i + 1]))) {
      const head = cells(line);
      i++;
      if (i < lines.length && isTableSep(lines[i])) i++;   // skip separator if there is one
      let body = "";
      while (i < lines.length && looksRow(lines[i])) {
        if (isTableSep(lines[i])) { i++; continue; }
        body += "<tr>" + cells(lines[i]).map((c) => `<td>${inline(c)}</td>`).join("") + "</tr>";
        i++;
      }
      html += `<table class="md-table"><thead><tr>${head.map((c) => `<th>${inline(c)}</th>`).join("")}</tr></thead><tbody>${body}</tbody></table>`;
      continue;
    }
    let m;
    if ((m = line.match(/^(#{1,6})\s+(.*)$/))) {
      const lvl = Math.min(6, m[1].length + 2); // shift so # -> h3
      html += `<h${lvl}>${inline(m[2])}</h${lvl}>`; i++; continue;
    }
    if (/^\s*([-*_])\1{2,}\s*$/.test(line)) { html += "<hr/>"; i++; continue; }
    if (/^\s*>/.test(line)) {
      let q = "";
      while (i < lines.length && /^\s*>/.test(lines[i])) { q += inline(lines[i].replace(/^\s*>\s?/, "")) + " "; i++; }
      html += `<blockquote>${q}</blockquote>`; continue;
    }
    if (/^\s*([-*+]|\d+\.)\s+/.test(line)) {
      const ordered = /^\s*\d+\.\s+/.test(line);
      let items = "";
      while (i < lines.length && /^\s*([-*+]|\d+\.)\s+/.test(lines[i])) {
        items += `<li>${inline(lines[i].replace(/^\s*([-*+]|\d+\.)\s+/, ""))}</li>`; i++;
      }
      html += ordered ? `<ol>${items}</ol>` : `<ul>${items}</ul>`; continue;
    }
    // paragraph (gather consecutive non-blank, non-special lines)
    let para = "";
    while (i < lines.length && lines[i].trim() && !/^(#{1,6}\s|\s*>|\s*([-*+]|\d+\.)\s|\s*([-*_])\3{2,}\s*$)/.test(lines[i]) && !(lines[i].includes("|") && i + 1 < lines.length && isTableSep(lines[i + 1]))) {
      para += inline(lines[i]) + " "; i++;
    }
    if (para) html += `<p>${para.trim()}</p>`;
  }
  return html;
}

async function initAnalyst() {
  // populate the company picker from the live universe
  const sel = $("#anTicker");
  const uniq = uniqueHoldings().sort((a, b) => a.name.localeCompare(b.name));
  if (uniq.length && sel.options.length !== uniq.length) {
    sel.innerHTML = uniq.map((h) => `<option value="${h.ticker}">${h.name} (${h.ticker})</option>`).join("");
    if (uniq.some((h) => h.ticker === "NVDA")) sel.value = "NVDA";
    ANALYST.ticker = sel.value;
  }
  if (ANALYST.reports) return;             // report buttons already built
  try {
    const res = await fetch("/api/report-types");
    const data = await res.json();
    ANALYST.reports = data.reports;
    ANALYST.hasKey = data.has_key;
    ANALYST.provider = data.provider;
    $("#anReports").innerHTML = data.reports.map((r) =>
      `<button class="an-report" data-type="${r.id}">${r.icon} ${r.label}</button>`).join("");
    $("#anReports").querySelectorAll(".an-report").forEach((b) =>
      b.addEventListener("click", () => runAnalysis(b.dataset.type)));
    $("#anKeyNote").innerHTML = data.has_key
      ? `<b style="color:var(--green)">Connected to ${data.provider}</b> — reports generate automatically.`
      : `No LLM key set, so reports give you a ready-to-paste prompt. Set <code>GEMINI_API_KEY</code> (free at <b>aistudio.google.com</b>) or <code>ANTHROPIC_API_KEY</code> and restart to auto-generate.`;
  } catch (e) {
    $("#anReports").innerHTML = `<span class="muted">Couldn't load report types.</span>`;
  }
  if (!ANALYST.wired) {
    sel.addEventListener("change", () => { ANALYST.ticker = sel.value; });
    ANALYST.wired = true;
  }
}

async function runAnalysis(type, force) {
  const ticker = $("#anTicker").value;
  const report = (ANALYST.reports || []).find((r) => r.id === type);
  const label = report ? report.label : type;
  const out = $("#anOutput");
  document.querySelectorAll(".an-report").forEach((b) => b.classList.toggle("active", b.dataset.type === type));
  out.innerHTML = `<div class="an-loading">⏳ Preparing <b>${label}</b> for <b>${ticker}</b>${ANALYST.hasKey ? " — generating with Claude (this can take 20–60s)…" : "…"}</div>`;

  // attach our computed score for context
  const h = (STATE.layers.flatMap((l) => l.holdings)).find((x) => x.ticker === ticker);
  const body = { ticker, type, force: !!force, score: h && h.score, score_parts: h && h.scoreParts };
  try {
    const res = await fetch("/api/analyze", { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify(body) });
    const data = await res.json();
    if (data.ok && data.generated) {
      out.innerHTML =
        `<div class="an-bar2"><span class="an-meta">${report.icon} ${label} · ${ticker}${data.model ? " · " + data.model : ""}${data.cached ? " · cached" : ""}</span>` +
        `<button class="an-regen" data-type="${type}">↻ Regenerate</button></div>` +
        `<article class="md">${mdToHtml(data.markdown)}</article>`;
      out.querySelector(".an-regen").addEventListener("click", () => runAnalysis(type, true));
    } else if (data.ok && data.need_key) {
      out.innerHTML =
        `<div class="an-note">No API key configured — here's the exact prompt to paste into Claude (it already includes ${ticker}'s live data):</div>` +
        promptBox(data.prompt);
    } else {
      out.innerHTML = `<div class="an-note err">Generation failed: ${escapeHtml(data.error || "unknown error")}.</div>` +
        (data.prompt ? `<div class="an-note">You can still run it manually:</div>` + promptBox(data.prompt) : "");
    }
  } catch (e) {
    out.innerHTML = `<div class="an-note err">Request failed — is the server running?</div>`;
  }
}

function promptBox(text) {
  const id = "pb" + Math.random().toString(36).slice(2, 8);
  setTimeout(() => {
    const btn = document.getElementById(id);
    if (btn) btn.addEventListener("click", () => {
      navigator.clipboard.writeText(text).then(() => { btn.textContent = "✓ Copied"; setTimeout(() => (btn.textContent = "Copy prompt"), 1500); });
    });
  }, 0);
  return `<div class="an-promptwrap"><button class="an-copy" id="${id}">Copy prompt</button><textarea class="an-prompt" readonly>${escapeHtml(text)}</textarea></div>`;
}

// ---- Stock Lookup -------------------------------------------------------
let LK_DATA = null;
const EXPOSURES = ["pure", "high", "moderate", "diversified"];

function initLookup() {
  renderAddedList();
  if (initLookup._wired) return;
  initLookup._wired = true;
  $("#lkGo").addEventListener("click", lookupStock);
  $("#lkTicker").addEventListener("keydown", (e) => { if (e.key === "Enter") lookupStock(); });
}

async function lookupStock() {
  const t = $("#lkTicker").value.trim().toUpperCase();
  if (!t) return;
  const out = $("#lkResult");
  out.innerHTML = `<div class="lk-loading">Looking up <b>${escapeHtml(t)}</b>…</div>`;
  try {
    const res = await fetch("/api/lookup/" + encodeURIComponent(t));
    LK_DATA = await res.json();
    renderLookupResult(LK_DATA);
  } catch (e) {
    out.innerHTML = `<div class="lk-note err">Lookup failed — is the server running?</div>`;
  }
}

function layerOptions(selectedId) {
  return STATE.layers.map((l) =>
    `<option value="${l.id}"${l.id === selectedId ? " selected" : ""}>${l.name}</option>`).join("");
}

function renderLookupResult(d) {
  const out = $("#lkResult");
  if (!d.ok) { out.innerHTML = `<div class="lk-note err">${escapeHtml(d.error || "No data for that ticker.")}</div>`; return; }
  const rec = d.recommend;
  const curTag = d.currency && d.currency !== "USD" ? ` <span class="chip cur">${d.currency}→USD</span>` : "";
  const existing = (d.existing_layers || []);
  const metricBits = [
    `P/E ${fmtNum(d.trailing_pe)}`, `fwd ${fmtNum(d.forward_pe)}`,
    `P/S ${fmtNum(d.price_to_sales)}`, `EV/EBITDA ${fmtNum(d.ev_ebitda)}`,
    `rev gr ${d.revenue_growth != null ? (d.revenue_growth * 100).toFixed(0) + "%" : "—"}`,
  ].join(" · ");
  const recBox = rec
    ? `<div class="lk-rec"><div class="lk-rec-h">📍 Suggested layer</div>
         <div class="lk-rec-main"><b>${escapeHtml(rec.name)}</b> <span class="lk-conf">${rec.confidence}% fit</span></div>
         <div class="lk-rec-why">matched: ${rec.matched.length ? rec.matched.map((m) => `<code>${escapeHtml(m)}</code>`).join(" ") : "—"}</div>
         <div class="lk-ranked">${(d.ranked || []).filter((r) => r.score > 0).map((r) =>
            `<button class="lk-rankchip" data-layer="${r.layer}">${escapeHtml(r.name.replace(/^Layer \d+ — /, ""))} · ${r.confidence}%</button>`).join("")}</div></div>`
    : `<div class="lk-rec"><div class="lk-rec-h">📍 Suggested layer</div><div class="lk-rec-why">Couldn't auto-classify from its profile — pick a layer below.</div></div>`;
  out.innerHTML = `
    <div class="lk-card">
      <div class="lk-top">
        <div><span class="lk-name">${escapeHtml(d.name)}</span> <span class="lk-tkr">${escapeHtml(d.ticker)}</span>${curTag}</div>
        <div class="lk-prices">${fmtMoney(d.market_cap)} · ${fmtPrice(d.price)}</div>
      </div>
      <div class="lk-sub">${escapeHtml(d.sector || "—")}${d.industry ? " · " + escapeHtml(d.industry) : ""} · ${metricBits}</div>
      ${existing.length ? `<div class="lk-exists">Already in the universe: <b>${existing.join(", ")}</b> — you can still add it to another layer.</div>` : ""}
      ${d.summary ? `<p class="lk-summary">${escapeHtml(d.summary)}</p>` : ""}
      ${recBox}
      <div class="lk-form">
        <label>Layer<select id="lkLayer">${layerOptions(rec ? rec.layer : (STATE.layers[0] && STATE.layers[0].id))}</select></label>
        <label>Exposure<select id="lkExposure">${EXPOSURES.map((e) => `<option value="${e}"${e === "moderate" ? " selected" : ""}>${e}</option>`).join("")}</select></label>
        <label>Tags<input id="lkTags" type="text" placeholder="comma,separated" value="${rec ? escapeHtml(rec.matched.slice(0, 3).join(", ")) : ""}"/></label>
        <label class="lk-thesis">Thesis (optional)<input id="lkThesis" type="text" placeholder="one line on why it fits"/></label>
        <button id="lkAdd">Add to layer</button>
      </div>
      <div id="lkAddMsg"></div>
    </div>`;
  out.querySelectorAll(".lk-rankchip").forEach((b) =>
    b.addEventListener("click", () => { $("#lkLayer").value = b.dataset.layer; }));
  $("#lkAdd").addEventListener("click", () => addStock(d));
}

async function addStock(d) {
  const body = {
    ticker: d.ticker, name: d.name,
    layer: $("#lkLayer").value, exposure: $("#lkExposure").value,
    tags: $("#lkTags").value, thesis: $("#lkThesis").value,
  };
  const msg = $("#lkAddMsg");
  msg.innerHTML = `<span class="muted">Adding ${d.ticker}…</span>`;
  try {
    const res = await fetch("/api/add-stock", { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify(body) });
    const r = await res.json();
    if (!r.ok) { msg.innerHTML = `<span class="lk-note err">${escapeHtml(r.error || "Add failed.")}</span>`; return; }
    msg.innerHTML = `<span class="lk-ok">✓ Added ${d.ticker} to ${body.layer}. Refreshing live data…</span>`;
    await load(true);             // refetch so the new ticker gets market data everywhere
    renderAddedList();
  } catch (e) {
    msg.innerHTML = `<span class="lk-note err">Add request failed.</span>`;
  }
}

async function renderAddedList() {
  const el = $("#lkAdded");
  try {
    const res = await fetch("/api/user-stocks");
    const items = (await res.json()).items || [];
    if (!items.length) { el.innerHTML = ""; return; }
    el.innerHTML = `<div class="lk-added-h">Your added stocks (${items.length})</div>` +
      items.map((it) => `<div class="lk-added-row"><span class="lk-tkr">${escapeHtml(it.ticker)}</span> ` +
        `<span class="lk-added-name">${escapeHtml(it.name || "")}</span> <span class="chip">${escapeHtml(it.layer)}</span> ` +
        `<span class="exp ${it.exposure}">${escapeHtml(it.exposure || "")}</span>` +
        `<button class="lk-remove" data-t="${escapeHtml(it.ticker)}" data-l="${escapeHtml(it.layer)}">Remove</button></div>`).join("");
    el.querySelectorAll(".lk-remove").forEach((b) =>
      b.addEventListener("click", () => removeStock(b.dataset.t, b.dataset.l)));
  } catch (e) { el.innerHTML = ""; }
}

async function removeStock(ticker, layer) {
  try {
    await fetch("/api/remove-stock", { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ ticker, layer }) });
    await load(true);
    renderAddedList();
  } catch (e) { /* ignore */ }
}

$("#refresh").addEventListener("click", () => load(true));
$("#search").addEventListener("input", (e) => {
  STATE.query = e.target.value;
  const clear = $("#searchClear");
  if (clear) clear.classList.toggle("hidden", !STATE.query);
  render();
});
$("#searchClear")?.addEventListener("click", () => {
  STATE.query = "";
  const s = $("#search");
  if (s) s.value = "";
  $("#searchClear")?.classList.add("hidden");
  savePrefs();
  render();
  $("#search")?.focus();
});

$("#scoreInfo").addEventListener("click", openScoreModal);

// Deep-links from archived watchlist / shared URLs (?mode=&q=&layer=)
(function applyUrlParams() {
  try {
    const p = new URLSearchParams(location.search);
    const mode = p.get("mode");
    if (mode && ["screener", "map", "analyst", "backtest", "lookup"].includes(mode)) {
      STATE.mode = mode;
    }
    const q = p.get("q");
    if (q) {
      STATE.query = q;
      const s = $("#search");
      if (s) s.value = q;
      $("#searchClear")?.classList.toggle("hidden", !q);
    }
    const layer = p.get("layer");
    if (layer) {
      STATE.focusLayer = layer;
      STATE.view = "layers";
      STATE.mode = STATE.mode || "screener";
    }
  } catch {
    /* ignore */
  }
})();

// keyboard QoL: "/" focuses the screener search; Esc clears + blurs it.
document.addEventListener("keydown", (e) => {
  const modal = $("#scoreModal");
  if (e.key === "Escape" && modal && !modal.classList.contains("hidden")) return; // handled by focus trap
  const search = $("#search");
  const typing = /^(INPUT|TEXTAREA|SELECT)$/.test(document.activeElement.tagName);
  if (e.key === "/" && !typing && search && !search.classList.contains("hidden")) {
    e.preventDefault(); search.focus(); search.select();
  } else if (e.key === "Escape" && document.activeElement === search) {
    search.value = ""; STATE.query = ""; render(); search.blur();
  } else if (e.key === "Escape" && STATE.panelOpen && !typing) {
    setFiltersDrawer(false); savePrefs(); syncToolbar();
  }
});

applyMode();
load();
