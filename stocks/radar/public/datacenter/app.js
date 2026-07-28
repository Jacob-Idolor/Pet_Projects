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
const FILTER_GROUPS = [
  { id: "valuation", label: "Valuation", metrics: [
    { key: "market_cap",     label: "Market cap", unit: "$B", scale: 1e9,  kind: "money" },
    { key: "trailing_pe",    label: "P/E ttm",    unit: "",   scale: 1,    kind: "num" },
    { key: "forward_pe",     label: "P/E fwd",    unit: "",   scale: 1,    kind: "num" },
    { key: "price_to_sales", label: "P/S",        unit: "",   scale: 1,    kind: "num" },
    { key: "ev_ebitda",      label: "EV/EBITDA",  unit: "",   scale: 1,    kind: "num" },
  ]},
  { id: "momentum", label: "Momentum / Trend", metrics: [
    { key: "change_pct",   label: "Today",        unit: "%", scale: 1, kind: "pct" },
    { key: "pct_off_high", label: "% off 52w hi", unit: "%", scale: 1, kind: "pct" },
    { key: "pct_vs_ma50",  label: "% vs 50d MA",  unit: "%", scale: 1, kind: "pct" },
    { key: "pct_vs_ma200", label: "% vs 200d MA", unit: "%", scale: 1, kind: "pct" },
  ]},
  { id: "quality", label: "Quality / Growth", metrics: [
    { key: "revenue_growth", label: "Rev growth",   unit: "%", scale: 0.01, kind: "pctfrac" },
    { key: "gross_margin",   label: "Gross margin",  unit: "%", scale: 0.01, kind: "pctfrac" },
    { key: "profit_margin",  label: "Net margin",    unit: "%", scale: 0.01, kind: "pctfrac" },
    { key: "roe",            label: "ROE",           unit: "%", scale: 0.01, kind: "pctfrac" },
  ]},
];
const ALL_METRICS = FILTER_GROUPS.flatMap((g) => g.metrics);

// lazy-loaded per-ticker headlines: ticker -> "loading" | "error" | [items]
const NEWS_CACHE = {};
// lazy-loaded per-ticker price/score history: ticker -> "loading" | "error" | [pts]
const HIST_CACHE = {};

// ---- persisted UI state -------------------------------------------------
function loadPrefs() {
  try { return JSON.parse(localStorage.getItem(LS_KEY)) || {}; } catch { return {}; }
}
function savePrefs() {
  localStorage.setItem(LS_KEY, JSON.stringify({
    sort: STATE.sort, view: STATE.view, exposure: [...STATE.exposure],
    collapsed: [...STATE.collapsed], valuation: STATE.valuation,
    panelOpen: STATE.panelOpen, mode: STATE.mode, colset: STATE.colset,
    scoreMode: STATE.scoreMode,
  }));
}

const _p = loadPrefs();
const _params = new URLSearchParams(typeof location !== "undefined" ? location.search : "");
const _qParam = (_params.get("q") || _params.get("ticker") || "").trim();
const _layerParam = (_params.get("layer") || "").trim();
const _modeParam = (_params.get("mode") || "").trim();
const _allowedModes = new Set(["screener", "datacenter", "rack", "analyst", "lookup"]);

let STATE = {
  layers: [], marketState: null,
  sort: _p.sort || { col: "market_cap", asc: false },
  view: _p.view || "layers",
  query: _qParam || "",
  exposure: new Set(_p.exposure || []),
  collapsed: new Set(_p.collapsed || []),
  valuation: _p.valuation || {},        // metric key -> { min, max } (display units)
  panelOpen: _p.panelOpen || false,
  mode: _allowedModes.has(_modeParam)
    ? _modeParam
    : (_layerParam || _qParam ? "screener" : (_p.mode || "screener")),
  focusLayer: _layerParam || null,
  colset: _p.colset || "valuation",     // which numeric column group to show
  scoreMode: _p.scoreMode || "universe", // score basis: percentile vs whole universe or vs same-layer peers
  openNews: new Set(),                  // tickers whose news row is expanded (transient)
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
  else { STATE.openNews.add(ticker); if (NEWS_CACHE[ticker] === undefined) fetchNews(ticker); }
  render();
}
function newsHtml(ticker) {
  const c = NEWS_CACHE[ticker];
  if (c === undefined || c === "loading") return `<div class="news-status">Loading news…</div>`;
  if (c === "error") return `<div class="news-status">Couldn't load news right now.</div>`;
  if (!c.length) {
    return `<div class="news-status">No headlines in the latest snapshot for ${ticker}. Re-run <code>npm run update-screener</code> to refresh news.json.</div>`;
  }
  return `<div class="news-list">` + c.map((it) =>
    `<a class="news-item" href="${encodeURI(it.url)}" target="_blank" rel="noopener noreferrer">` +
    `<span class="news-title">${escapeHtml(it.title)}</span>` +
    `<span class="news-meta">${escapeHtml(it.publisher)}${it.published ? " · " + timeAgo(it.published) : ""}</span></a>`
  ).join("") + `</div><div class="news-src">Headlines via Yahoo Finance</div>`;
}

// ---- column registry ----------------------------------------------------
const td = (inner, cls) => `<td class="${cls || ""}">${inner}</td>`;
function nameInner(h, showLayers) {
  const cur = h.market && h.market.currency;
  const curChip = (cur && cur !== "USD") ? `<span class="chip cur" title="prices converted from ${cur} to USD at live FX">${cur}→USD</span>` : "";
  const tagList = Array.isArray(h.tags) ? h.tags : String(h.tags || "").split(",").map((t) => t.trim()).filter(Boolean);
  const chips = showLayers
    ? (h.layers || []).map((l) => `<span class="chip">${l}</span>`).join("")
    : tagList.filter((t) => t !== "foreign").map((t) => `<span class="chip">${t}</span>`).join("") +
      (h.also_in || []).map((l) => `<span class="chip also">also: ${l}</span>`).join("");
  return `<div class="name">${h.name}</div><div class="thesis">${h.thesis || ""}</div><div class="tags">${chips}${curChip}</div>`;
}
const scoreColor = (s) => (s >= 66 ? "var(--green)" : s >= 40 ? "var(--amber)" : "var(--red)");
function scoreBadge(h) {
  if (h.score == null) return `<span class="score na">—</span>`;
  const p = h.scoreParts || {};
  const tip = SCORE_FACTORS.map((f) => `${f.label} ${p[f.key] ?? "–"}`).join(" · ") + " — click row for breakdown";
  return `<span class="score" style="--sc:${scoreColor(h.score)}" title="${tip}">${h.score}</span>`;
}
// full derivation, shown in the expandable row detail
function scoreBreakdown(h) {
  if (h.score == null || !h.scoreParts) return `<div class="news-status">No score available.</div>`;
  const cov = h.scoreCov || {};
  const rows = SCORE_FACTORS.map((f) => {
    const v = h.scoreParts[f.key] ?? 0;
    const c = cov[f.key];
    // flag thin factors: fewer than half the metrics had data (exposure has none to count)
    const thin = c && (() => { const [a, b] = c.split("/").map(Number); return b > 0 && a < Math.ceil(b / 2); })();
    const covChip = c ? `<span class="sb-cov${thin ? " thin" : ""}" title="${c} of this factor's metrics had data">${c}</span>` : `<span class="sb-cov"></span>`;
    return `<div class="sb-row">
      <span class="sb-label">${f.label}</span>
      <span class="sb-bar"><span class="sb-fill" style="width:${v}%;background:${scoreColor(v)}"></span></span>
      <span class="sb-val">${v}</span>
      ${covChip}
      <span class="sb-wt">×${Math.round(f.weight * 100)}%</span></div>`;
  }).join("");
  const basis = STATE.scoreMode === "layer"
    ? "each factor = percentile rank vs same-layer peers, then weighted"
    : "each factor = percentile rank vs the whole universe, then weighted";
  return `<div class="sb">
    <div class="sb-head">Score <b style="color:${scoreColor(h.score)}">${h.score}</b>/100
      <span class="sb-note">${basis} · the small chip is data coverage (metrics with data)</span></div>
    ${rows}</div>`;
}
function detailHtml(h) {
  return `<div class="detail">
    <div class="detail-col"><div class="detail-h">Score breakdown</div>${scoreBreakdown(h)}</div>
    <div class="detail-col"><div class="detail-h">Price &amp; score trend</div>${histHtml(h.ticker)}</div>
    <div class="detail-col"><div class="detail-h">Recent news</div>${newsHtml(h.ticker)}</div>
  </div>`;
}
const COLUMNS = {
  ticker:         { label: "Ticker",  align: "left",   get: (h) => h.ticker, cell: (h) => td(`<span class="news-toggle">${STATE.openNews.has(h.ticker) ? "▾" : "▸"}</span><span class="tkr">${h.ticker}</span>`, "left") },
  name:           { label: "Company", align: "left",   get: (h) => h.name,   cell: (h, sl) => td(nameInner(h, sl), "left") },
  exposure:       { label: "Exposure", align: "center", get: (h) => EXPOSURE_RANK[h.exposure] ?? 9, cell: (h) => td(`<span class="exp ${h.exposure}">${h.exposure}</span>`, "center") },
  score:          { label: "Score",   align: "center", get: (h) => h.score, cell: (h) => td(scoreBadge(h), "center") },
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
const BASE_COLS = ["ticker", "name", "exposure", "score", "price", "change_pct", "market_cap"];
const COLSETS = {
  valuation: ["trailing_pe", "forward_pe", "price_to_sales", "ev_ebitda", "pct_off_high"],
  momentum:  ["pct_off_high", "pct_vs_ma50", "pct_vs_ma200"],
  quality:   ["revenue_growth", "gross_margin", "profit_margin", "roe"],
  consensus: ["target_price", "implied_upside", "recommendation", "dividend_yield", "earnings"],
  trends:    ["score_d1", "score_d7", "price_d7"],
};
const activeColKeys = () => [...BASE_COLS, ...(COLSETS[STATE.colset] || [])];

function formatSnapshotAge(fetchedAtSec) {
  if (fetchedAtSec == null || !Number.isFinite(Number(fetchedAtSec))) return null;
  const ms = Date.now() - Number(fetchedAtSec) * 1000;
  if (ms < 0) return "just now";
  const mins = Math.round(ms / 60000);
  if (mins < 1) return "just now";
  if (mins < 60) return mins + "m ago";
  const hrs = Math.round(mins / 60);
  if (hrs < 48) return hrs + "h ago";
  return Math.round(hrs / 24) + "d ago";
}

/** Soft stale threshold for UI (hours). Matches weekday refresh cadence. */
const SNAPSHOT_STALE_HOURS = 24;

// ---- data load ----------------------------------------------------------
async function load(refresh = false) {
  const btn = $("#refresh");
  btn.disabled = true;
  $("#status").textContent = refresh ? "Reloading Yahoo snapshot…" : "Loading universe…";
  try {
    const res = await fetch(refresh ? "/api/refresh" : "/api/screen");
    const data = await res.json();
    STATE.layers = data.layers;
    STATE.marketState = data.market_state;
    attachScores();
    const fetchedSec = Number(data.fetched_at);
    const whenLocal = Number.isFinite(fetchedSec)
      ? new Date(fetchedSec * 1000).toLocaleString(undefined, {
          month: "short",
          day: "numeric",
          hour: "numeric",
          minute: "2-digit",
        })
      : "—";
    const ageLabel = formatSnapshotAge(fetchedSec);
    const ageHours = Number.isFinite(fetchedSec)
      ? (Date.now() - fetchedSec * 1000) / 3_600_000
      : null;
    const stale = ageHours != null && ageHours > SNAPSHOT_STALE_HOURS;
    const uniq = uniqueHoldings().length;
    $("#status").innerHTML =
      `<b>${uniq}</b> names · ${data.layers.length} layers · ` +
      `${data.ok_count}/${data.ticker_count} with data ${marketPill()}`;
    $("#meta").textContent = ageLabel
      ? `snapshot ${ageLabel}${stale ? " · stale" : ""} · ${whenLocal}`
      : `${data.cached ? "cached" : "fresh"} · ${whenLocal}`;
    const kpiNames = $("#kpiNames");
    const kpiOk = $("#kpiOk");
    if (kpiNames) kpiNames.textContent = String(uniq);
    if (kpiOk) kpiOk.textContent = `${data.ok_count}/${data.ticker_count}`;
    const dot = $("#statusDot");
    if (dot) {
      const ratio = data.ticker_count ? data.ok_count / data.ticker_count : 0;
      let color = "var(--green)";
      if (stale || ratio < 0.5) color = "var(--red)";
      else if (ratio < 0.9 || (ageHours != null && ageHours > 12)) color = "var(--amber)";
      dot.style.background = color;
      dot.style.boxShadow = `0 0 6px ${color}`;
      dot.title = ageLabel ? `Snapshot ${ageLabel}` : "Snapshot age unknown";
    }
    buildFiltersPanel();
    renderMovers();
    render();
    syncHistory();            // record today's snapshot, then pull deltas (async)
    if (STATE.mode === "datacenter" && window.DataCenter) window.DataCenter.render();
    if (STATE.mode === "rack" && window.RackExplorer) window.RackExplorer.render();
    if (STATE.mode === "analyst") initAnalyst();
  } catch (e) {
    $("#status").textContent =
      "Couldn’t load the screener snapshot. Try Refresh, or rebuild with npm run update-screener.";
    console.error(e);
  } finally {
    btn.disabled = false;
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
  { key: "valuation", label: "Valuation", weight: 0.20, metrics: [
    { k: "forward_pe", dir: -1, pos: true }, { k: "trailing_pe", dir: -1, pos: true },
    { k: "price_to_sales", dir: -1, pos: true }, { k: "ev_ebitda", dir: -1, pos: true },
    { k: "price_to_book", dir: -1, pos: true }, { k: "peg", dir: -1, pos: true },
    { k: "fcf_yield", dir: 1 } ] },
  { key: "moat", label: "Moat & quality", weight: 0.22, metrics: [
    { k: "gross_margin", dir: 1 }, { k: "operating_margin", dir: 1 }, { k: "profit_margin", dir: 1 },
    { k: "roe", dir: 1 }, { k: "roa", dir: 1 } ] },
  { key: "growth", label: "Growth", weight: 0.15, metrics: [
    { k: "revenue_growth", dir: 1 }, { k: "earnings_growth", dir: 1 } ] },
  { key: "technical", label: "Technical trend", weight: 0.18, metrics: [
    { k: "pct_vs_ma50", dir: 1 }, { k: "pct_vs_ma200", dir: 1 },
    { k: "range_pos", dir: 1 }, { k: "pct_off_high", dir: 1 } ] },
  { key: "health", label: "Financial health", weight: 0.10, metrics: [
    { k: "debt_to_equity", dir: -1, pos: true }, { k: "current_ratio", dir: 1 } ] },
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
function computeScores(list) {
  const ok = list.filter((h) => h.market && h.market.ok);
  const pools = {};
  for (const f of SCORE_FACTORS) for (const mt of (f.metrics || [])) {
    if (pools[mt.k]) continue;
    pools[mt.k] = ok.map((h) => h.market[mt.k]).filter((v) => v != null && (!mt.pos || v > 0));
  }
  const out = {};
  for (const h of ok) {
    const parts = {}, cov = {};
    for (const f of SCORE_FACTORS) {
      if (f.special === "exposure") { parts[f.key] = Math.round((EXPOSURE_SCORE[h.exposure] ?? 0.4) * 100); cov[f.key] = null; continue; }
      const vals = [];
      for (const mt of f.metrics) {
        const v = h.market[mt.k];
        if (v == null || (mt.pos && v <= 0)) continue;
        const p = pctile(pools[mt.k], v, mt.dir === 1);
        if (p != null) vals.push(p);
      }
      parts[f.key] = vals.length ? Math.round(vals.reduce((a, b) => a + b, 0) / vals.length * 100) : 50;
      cov[f.key] = `${vals.length}/${f.metrics.length}`;
    }
    const composite = SCORE_FACTORS.reduce((s, f) => s + f.weight * (parts[f.key] / 100), 0);
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

// ---- filtering / sorting ------------------------------------------------
function anyFilterActive() {
  if (STATE.query.trim()) return true;
  if (STATE.exposure.size) return true;
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
function renderMovers() {
  const named = uniqueHoldings().filter((h) => h.market && h.market.change_pct != null);
  if (!named.length) { $("#movers").innerHTML = ""; return; }
  const s = [...named].sort((a, b) => b.market.change_pct - a.market.change_pct);
  const top = s[0], bot = s[s.length - 1];
  $("#movers").innerHTML =
    `<span class="mv">▲ <b>${top.ticker}</b> <span class="pos">${fmtPct(top.market.change_pct)}</span></span>` +
    `<span class="mv">▼ <b>${bot.ticker}</b> <span class="neg">${fmtPct(bot.market.change_pct)}</span></span>`;
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
function histHtml(ticker) {
  const c = HIST_CACHE[ticker];
  if (c === undefined) { fetchHistory(ticker); return `<div class="news-status">Loading trend…</div>`; }
  if (c === "loading") return `<div class="news-status">Loading trend…</div>`;
  if (c === "error") return `<div class="news-status">Couldn't load history.</div>`;
  if (!c.length) return `<div class="news-status">No history yet — snapshots accrue daily.</div>`;
  const prices = c.map((p) => p.price), scores = c.map((p) => p.score);
  const days = c.length;
  if (days < 2) return `<div class="news-status">First snapshot saved. Trends appear from the 2nd day — ${days} day so far.</div>`;
  return `<div class="hist">
    <div class="hist-row"><span class="hist-lbl">Price</span>${sparkline(prices)}<span class="hist-end">${fmtPrice(prices[prices.length - 1])}</span></div>
    <div class="hist-row"><span class="hist-lbl">Score</span>${sparkline(scores, "var(--accent)")}<span class="hist-end">${scores[scores.length - 1] ?? "—"}</span></div>
    <div class="hist-note">${days} daily snapshot${days > 1 ? "s" : ""}</div></div>`;
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
  panel.classList.toggle("hidden", !STATE.panelOpen);
  const groups = FILTER_GROUPS.map((g) => {
    const rows = g.metrics.map((m) => {
      const v = STATE.valuation[m.key] || {};
      const val = (b) => (v[b] != null ? `value="${v[b]}"` : "");
      return `
        <div class="vrow">
          <label>${m.label}${m.unit ? ` <span class="u">${m.unit}</span>` : ""}</label>
          <div class="inputs">
            <input type="number" step="any" placeholder="min" data-k="${m.key}" data-b="min" ${val("min")} />
            <span class="dash">–</span>
            <input type="number" step="any" placeholder="max" data-k="${m.key}" data-b="max" ${val("max")} />
          </div>
          <span class="range-hint">${rangeHint(m)}</span>
        </div>`;
    }).join("");
    return `<div class="vgroup"><h4>${g.label}</h4><div class="vgrid">${rows}</div></div>`;
  }).join("");
  panel.innerHTML = `
    ${groups}
    <div class="vfoot">
      <span class="match"><b id="matchCount">—</b> of ${uniqueHoldings().length} names match</span>
      <button id="clearFilters">Clear all</button>
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
  const el = $("#matchCount");
  if (el) el.textContent = uniqueHoldings().filter(passesFilters).length;
}

// ---- table rendering ----------------------------------------------------
function headerRow() {
  const tr = document.createElement("tr");
  for (const key of activeColKeys()) {
    const c = COLUMNS[key];
    const th = document.createElement("th");
    th.textContent = c.label;
    if (c.align === "left") th.classList.add("left");
    if (c.align === "center") th.classList.add("center");
    if (STATE.sort.col === key) { th.classList.add("sorted"); if (STATE.sort.asc) th.classList.add("asc"); }
    th.addEventListener("click", () => {
      if (STATE.sort.col === key) STATE.sort.asc = !STATE.sort.asc;
      else STATE.sort = { col: key, asc: c.align === "left" };
      savePrefs(); render();
    });
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
    tr.title = "Click for recent news";
    tr.innerHTML = keys.map((k) => COLUMNS[k].cell(h, showLayers)).join("");
    tr.addEventListener("click", () => toggleNews(h.ticker));
    tbody.appendChild(tr);
    if (STATE.openNews.has(h.ticker)) {
      const ntr = document.createElement("tr");
      ntr.className = "news-row";
      ntr.innerHTML = `<td colspan="${keys.length}">${detailHtml(h)}</td>`;
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
    if (!holdings.length) { root.innerHTML = emptyMsg(); return; }
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
    const head = document.createElement("div");
    head.className = "layer-head";
    head.innerHTML = `<h2>${layer.name}</h2><span class="count">${visible.length} names</span><span class="caret">▾</span>`;
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
  if (!anyShown) root.innerHTML = emptyMsg();
}
function emptyMsg() {
  const bits = [];
  if (STATE.query) bits.push(`“${STATE.query}”`);
  if (STATE.exposure.size) bits.push(`exposure: ${[...STATE.exposure].join(", ")}`);
  if (activeFilterCount()) bits.push(`${activeFilterCount()} metric filter(s)`);
  return `<div class="loading">No names match ${bits.join(" · ") || "the current filters"}.</div>`;
}

// ---- toolbar sync + wiring ---------------------------------------------
function syncToolbar() {
  document.querySelectorAll("#viewToggle button").forEach((b) => b.classList.toggle("active", b.dataset.view === STATE.view));
  document.querySelectorAll("#exposureFilter button").forEach((b) => b.classList.toggle("active", STATE.exposure.has(b.dataset.exp)));
  document.querySelectorAll("#colset button").forEach((b) => b.classList.toggle("active", b.dataset.cs === STATE.colset));
  document.querySelectorAll("#scoreMode button").forEach((b) => b.classList.toggle("active", b.dataset.sm === STATE.scoreMode));
  const fb = $("#filtersBtn"), n = activeFilterCount();
  fb.textContent = n ? `Filters (${n})` : "Filters";
  fb.setAttribute("aria-expanded", STATE.panelOpen ? "true" : "false");
  fb.classList.toggle("active", STATE.panelOpen || n > 0);
  fb.setAttribute("aria-expanded", String(STATE.panelOpen));
}

document.querySelectorAll("#viewToggle button").forEach((b) =>
  b.addEventListener("click", () => { STATE.view = b.dataset.view; savePrefs(); render(); }));
document.querySelectorAll("#exposureFilter button").forEach((b) =>
  b.addEventListener("click", () => {
    const e = b.dataset.exp;
    if (STATE.exposure.has(e)) STATE.exposure.delete(e); else STATE.exposure.add(e);
    savePrefs(); render();
  }));
document.querySelectorAll("#colset button").forEach((b) =>
  b.addEventListener("click", () => { STATE.colset = b.dataset.cs; savePrefs(); render(); }));
document.querySelectorAll("#scoreMode button").forEach((b) =>
  b.addEventListener("click", () => {
    if (STATE.scoreMode === b.dataset.sm) return;
    STATE.scoreMode = b.dataset.sm; savePrefs();
    attachScores();   // re-rank under the new basis, then redraw
    render();
  }));
$("#filtersBtn").addEventListener("click", () => {
  STATE.panelOpen = !STATE.panelOpen;
  $("#filtersPanel").classList.toggle("hidden", !STATE.panelOpen);
  savePrefs(); syncToolbar();
});

// ---- mode (screener vs data-center map) --------------------------------
const MODE_PURPOSE = {
  screener: "Screener — rank holdings by valuation, momentum, quality, and composite score",
  datacenter: "Data Center Map — explore the six-layer buildout, then drill into a layer’s stocks",
  rack: "Rack Explorer — zoom from hall to rack to GPU die and see who builds each piece",
  analyst: "AI Analyst — copy a grounded research prompt for Claude, Gemini, or ChatGPT",
  lookup: "Stock Lookup — pin a universe ticker locally in this browser",
};

function applyMode() {
  const m = STATE.mode, screener = m === "screener";
  document.querySelectorAll("#mainnav button").forEach((b) => b.classList.toggle("active", b.dataset.mode === m));
  const purpose = $("#modePurpose");
  if (purpose) {
    purpose.style.opacity = "0";
    purpose.textContent = MODE_PURPOSE[m] || "";
    requestAnimationFrame(() => { purpose.style.opacity = "1"; });
  }
  // screener chrome shows only in screener mode
  const boardChrome = $(".board-chrome");
  if (boardChrome) boardChrome.classList.toggle("hidden", !screener);
  $("#filtersPanel").classList.toggle("hidden", !screener || !STATE.panelOpen);
  // statusbar is inside board-chrome; no separate hide needed when chrome hides
  const layersEl = $("#layers");
  layersEl.classList.toggle("hidden", !screener);
  layersEl.classList.toggle("view-pane", screener);
  renderAlerts();   // hides the alerts strip outside screener mode
  const panes = [
    ["#datacenter", "datacenter"],
    ["#rackexplorer", "rack"],
    ["#analyst", "analyst"],
    ["#lookup", "lookup"],
  ];
  for (const [sel, mode] of panes) {
    const el = $(sel);
    const on = m === mode;
    el.classList.toggle("hidden", !on);
    el.classList.toggle("view-pane", on);
  }
  updateFocusBanner();
  if (m === "datacenter" && window.DataCenter) window.DataCenter.render();
  if (m === "rack" && window.RackExplorer) window.RackExplorer.render();
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
      : `Copy-prompt mode — each report builds a ready-to-paste prompt with this page’s snapshot data. Paste into Claude or Gemini yourself.`;
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
    out.innerHTML = `<div class="an-note err">Request failed — could not build the prompt. Try Refresh, then run again.</div>`;
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
    out.innerHTML = `<div class="lk-note err">Lookup failed — reload the page and try a ticker already in the universe.</div>`;
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
$("#search").addEventListener("input", (e) => { STATE.query = e.target.value; render(); });

// Deep-links from StocksWatch home (?q=TICKER&layer=compute)
if (STATE.query && $("#search")) $("#search").value = STATE.query;
if (STATE.focusLayer) STATE.view = "layers";

applyMode();
load();
