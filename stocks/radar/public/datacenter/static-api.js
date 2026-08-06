/**
 * Static API shim for the AI Data Center screener on StockWatch.
 * Intercepts /api/* fetch calls so the original screener UI works without Flask.
 */
(function () {
  const root = document.documentElement;
  const base = (root.dataset.dcBase || "/datacenter/").replace(/\/?$/, "/");
  const screenerUrl = root.dataset.screenerUrl || "/screener.json";
  const newsUrl = root.dataset.newsUrl || base + "news.json";
  const reportsUrl = root.dataset.reportsUrl || base + "reports.json";
  const HISTORY_KEY = "sw-dc-history-v1";
  const USER_KEY = "sw-dc-user-stocks-v1";
  const USER_DC_KEY = "sw-dc-user-campuses-v1";

  let screenCache = null;
  let newsCache = null;
  let reportsCache = null;
  let campusesCache = null;

  function jsonResponse(data, status = 200) {
    return new Response(JSON.stringify(data), {
      status,
      headers: { "Content-Type": "application/json" },
    });
  }

  async function loadScreen() {
    const TTL_MS = Number(root.dataset.screenerCacheTtlMs || 10 * 60 * 1000);
    if (screenCache && screenCache._cachedAt && Date.now() - screenCache._cachedAt < TTL_MS) {
      return screenCache;
    }
    const res = await origFetch(screenerUrl);
    if (!res.ok) throw new Error("Failed to load screener.json (" + res.status + ")");
    screenCache = await res.json();
    screenCache.cached = true;
    screenCache._cachedAt = Date.now();
    return screenCache;
  }

  async function loadNewsMap() {
    if (newsCache) return newsCache;
    try {
      const res = await origFetch(newsUrl);
      if (!res.ok) {
        newsCache = { news: {} };
        return newsCache;
      }
      newsCache = await res.json();
    } catch {
      newsCache = { news: {} };
    }
    return newsCache;
  }

  async function loadReports() {
    if (reportsCache) return reportsCache;
    try {
      const res = await origFetch(reportsUrl);
      if (!res.ok) {
        reportsCache = { reports: [], has_key: false };
        return reportsCache;
      }
      reportsCache = await res.json();
      return reportsCache;
    } catch {
      reportsCache = { reports: [], has_key: false };
      return reportsCache;
    }
  }

  async function loadCampuses() {
    if (campusesCache) return campusesCache;
    const url = root.dataset.campusesUrl || base + "campuses.json";
    try {
      const res = await origFetch(url);
      if (!res.ok) {
        campusesCache = { sites: [], disclaimer: "", power_sources: [] };
        return campusesCache;
      }
      campusesCache = await res.json();
    } catch {
      campusesCache = { sites: [], disclaimer: "", power_sources: [] };
    }
    return campusesCache;
  }

  function loadUserCampuses() {
    try {
      const raw = JSON.parse(localStorage.getItem(USER_DC_KEY) || "[]");
      return Array.isArray(raw) ? raw : [];
    } catch {
      return [];
    }
  }

  function saveUserCampuses(items) {
    localStorage.setItem(USER_DC_KEY, JSON.stringify(items.slice(0, 200)));
  }

  function loadHistory() {
    try {
      return JSON.parse(localStorage.getItem(HISTORY_KEY) || "{}");
    } catch {
      return {};
    }
  }

  function saveHistory(db) {
    localStorage.setItem(HISTORY_KEY, JSON.stringify(db));
  }

  function today() {
    // Local calendar day (not UTC) so evening US sessions don't jump to "tomorrow"
    const d = new Date();
    const y = d.getFullYear();
    const m = String(d.getMonth() + 1).padStart(2, "0");
    const day = String(d.getDate()).padStart(2, "0");
    return `${y}-${m}-${day}`;
  }

  function recordSnapshots(rows) {
    const db = loadHistory();
    const day = today();
    const ts = Date.now() / 1000;
    for (const r of rows || []) {
      const tk = r.ticker;
      if (!tk) continue;
      if (!db[tk]) db[tk] = [];
      const entry = {
        date: day,
        ts,
        price: r.price ?? null,
        score: typeof r.score === "number" ? r.score : null,
        market_cap: r.market_cap ?? null,
        pct_off_high: r.pct_off_high ?? null,
        pct_vs_ma200: r.pct_vs_ma200 ?? null,
      };
      const idx = db[tk].findIndex((x) => x.date === day);
      if (idx >= 0) db[tk][idx] = entry;
      else db[tk].push(entry);
      db[tk].sort((a, b) => a.date.localeCompare(b.date));
      if (db[tk].length > 90) db[tk] = db[tk].slice(-90);
    }
    saveHistory(db);
    return (rows || []).length;
  }

  function pchg(a, b) {
    if (a == null || !b) return null;
    return ((a - b) / b) * 100;
  }

  function diff(a, b) {
    if (a == null || b == null) return null;
    return a - b;
  }

  function deltas() {
    const db = loadHistory();
    const out = {};
    for (const [tk, rows] of Object.entries(db)) {
      if (!rows.length) continue;
      const latest = rows[rows.length - 1];
      const prev1 = rows.length >= 2 ? rows[rows.length - 2] : null;
      const [y, mo, da] = latest.date.split("-").map(Number);
      const cutoffDate = new Date(y, mo - 1, da);
      cutoffDate.setDate(cutoffDate.getDate() - 7);
      const cutoff = `${cutoffDate.getFullYear()}-${String(cutoffDate.getMonth() + 1).padStart(2, "0")}-${String(cutoffDate.getDate()).padStart(2, "0")}`;
      let prev7 = null;
      for (let i = 0; i < rows.length - 1; i++) {
        if (rows[i].date <= cutoff) prev7 = rows[i];
      }
      out[tk] = {
        price_1d: prev1 ? pchg(latest.price, prev1.price) : null,
        price_7d: prev7 ? pchg(latest.price, prev7.price) : null,
        score_1d: prev1 ? diff(latest.score, prev1.score) : null,
        score_7d: prev7 ? diff(latest.score, prev7.score) : null,
        days: rows.length,
      };
    }
    return out;
  }

  function series(ticker, limit = 60) {
    const rows = (loadHistory()[ticker] || []).slice(-limit);
    return rows.map((r) => ({ date: r.date, price: r.price, score: r.score }));
  }

  function loadUserStocks() {
    try {
      const items = JSON.parse(localStorage.getItem(USER_KEY) || "[]");
      return Array.isArray(items) ? items : [];
    } catch {
      return [];
    }
  }

  function saveUserStocks(items) {
    localStorage.setItem(USER_KEY, JSON.stringify(items));
  }

  function mergeUserIntoPayload(payload) {
    const users = loadUserStocks();
    if (!users.length) return payload;
    const clone = structuredClone(payload);
    for (const item of users) {
      const layer = clone.layers.find((L) => L.id === item.layer);
      if (!layer) continue;
      if (layer.holdings.some((h) => h.ticker === item.ticker)) continue;
      layer.holdings.push({
        ticker: item.ticker,
        name: item.name || item.ticker,
        exposure: item.exposure || "moderate",
        tags: item.tags || [],
        thesis: item.thesis || "",
        user_added: true,
        also_in: [],
        market: item.market || { ticker: item.ticker, ok: false },
      });
    }
    return clone;
  }

  function fmt(v, kind) {
    if (v == null) return "n/a";
    if (kind === "money") {
      const a = Math.abs(v);
      if (a >= 1e12) return "$" + (v / 1e12).toFixed(2) + "T";
      if (a >= 1e9) return "$" + (v / 1e9).toFixed(2) + "B";
      if (a >= 1e6) return "$" + (v / 1e6).toFixed(1) + "M";
      return "$" + v.toFixed(0);
    }
    if (kind === "pct") return (v >= 0 ? "+" : "") + v.toFixed(1) + "%";
    if (kind === "frac") return (v * 100 >= 0 ? "+" : "") + (v * 100).toFixed(1) + "%";
    if (kind === "pctraw") return v.toFixed(2) + "%";
    return Number(v).toFixed(2);
  }

  function fmtDate(ts) {
    if (!ts) return "n/a";
    try {
      const d = new Date(Number(ts) * 1000);
      const iso = d.toISOString().slice(0, 10);
      const delta = Math.round((d - new Date()) / 86400000);
      const when =
        delta === 0 ? "today" : delta > 0 ? "in " + delta + " days" : -delta + " days ago";
      return iso + " (" + when + ")";
    } catch {
      return "n/a";
    }
  }

  function metricsLine(m) {
    return (
      "price " +
      fmt(m.price) +
      ", mkt cap " +
      fmt(m.market_cap, "money") +
      ", P/E ttm " +
      fmt(m.trailing_pe) +
      ", P/E fwd " +
      fmt(m.forward_pe) +
      ", P/S " +
      fmt(m.price_to_sales) +
      ", EV/EBITDA " +
      fmt(m.ev_ebitda) +
      ", P/B " +
      fmt(m.price_to_book) +
      ", PEG " +
      fmt(m.peg) +
      ", rev growth " +
      fmt(m.revenue_growth, "frac") +
      ", gross margin " +
      fmt(m.gross_margin, "frac") +
      ", op margin " +
      fmt(m.operating_margin, "frac") +
      ", net margin " +
      fmt(m.profit_margin, "frac") +
      ", ROE " +
      fmt(m.roe, "frac") +
      ", ROA " +
      fmt(m.roa, "frac") +
      ", debt/equity " +
      fmt(m.debt_to_equity) +
      ", current ratio " +
      fmt(m.current_ratio) +
      ", FCF " +
      fmt(m.free_cashflow, "money") +
      ", beta " +
      fmt(m.beta) +
      ", div yield " +
      fmt(m.dividend_yield, "pctraw") +
      ", analyst target " +
      fmt(m.target_mean_price) +
      " (upside " +
      fmt(m.implied_upside, "pct") +
      ", rating " +
      (m.recommendation_key || "n/a") +
      " " +
      fmt(m.recommendation_mean) +
      "/5 from " +
      fmt(m.num_analysts) +
      " analysts), % off 52w high " +
      fmt(m.pct_off_high, "pct") +
      ", vs 200d MA " +
      fmt(m.pct_vs_ma200, "pct")
    );
  }

  function findHolding(payload, ticker) {
    for (const layer of payload.layers || []) {
      const h = layer.holdings.find((x) => x.ticker === ticker);
      if (h) return h;
    }
    return null;
  }

  function peerHoldings(payload, ticker, limit = 6) {
    const home = findHolding(payload, ticker);
    if (!home) return [];
    const homeLayers = new Set([...(home.also_in || [])]);
    for (const layer of payload.layers || []) {
      if (layer.holdings.some((h) => h.ticker === ticker)) homeLayers.add(layer.id);
    }
    const seen = new Set([ticker]);
    const peers = [];
    for (const layer of payload.layers || []) {
      if (!homeLayers.has(layer.id)) continue;
      for (const h of layer.holdings) {
        if (seen.has(h.ticker)) continue;
        if (h.market?.market_cap == null) continue;
        seen.add(h.ticker);
        peers.push(h);
      }
    }
    peers.sort((a, b) => (b.market.market_cap || 0) - (a.market.market_cap || 0));
    return peers.slice(0, limit);
  }

  function buildContext(holding, peers, news, score, scoreParts) {
    const m = holding.market || {};
    const lines = [
      "Company: " + holding.name + " (" + holding.ticker + ")",
      "AI-data-center layer(s): " + ((holding.also_in || []).join(", ") || "see thesis"),
      "Thematic exposure rating: " + (holding.exposure || ""),
      "One-line thesis: " + (holding.thesis || ""),
      "Currency: " + (m.currency || "USD"),
      "Metrics: " + metricsLine(m),
      "Next scheduled earnings date: " + fmtDate(m.earnings_ts),
    ];
    if (score != null) {
      const parts = scoreParts || {};
      const pstr = Object.entries(parts)
        .map(([k, v]) => k + " " + v)
        .join(", ");
      lines.push("App composite score: " + score + "/100 (factor percentiles: " + pstr + ")");
    }
    if (peers.length) {
      lines.push("Peers (same layer):");
      for (const p of peers) lines.push("  - " + p.name + " (" + p.ticker + "): " + metricsLine(p.market || {}));
    }
    if (news.length) {
      lines.push("Recent headlines:");
      for (const n of news) {
        const when = (n.published || "").slice(0, 10);
        lines.push("  - " + n.title + " [" + (n.publisher || "") + ", " + when + "]");
      }
    }
    lines.push(
      "(Data via Yahoo Finance; may be delayed or incomplete. Assistant knowledge cutoff applies to anything not listed here.)"
    );
    return lines.join("\n");
  }

  const LAYER_NAME = {
    land: "Layer 1 — Land & Physical Shell",
    power: "Layer 2 — Power Infrastructure (the bottleneck)",
    cooling: "Layer 3 — Cooling Systems",
    compute: "Layer 4 — Compute Hardware (GPUs, HBM, packaging)",
    networking: "Layer 5 — Networking (making GPUs act as one)",
    software: "Layer 6 — Software, Operations & Demand",
  };

  const LAYER_KEYWORDS = {
    land: ["reit", "real estate", "construction", "building material", "aggregate", "property"],
    power: ["utilit", "electric", "power", "nuclear", "uranium", "transformer", "switchgear", "generator", "grid"],
    cooling: ["hvac", "cooling", "thermal", "heat", "climate", "refriger"],
    compute: ["semiconductor", "chip", "gpu", "memory", "foundry", "wafer", "processor", "server"],
    networking: ["network", "optical", "fiber", "fibre", "connector", "switching", "transceiver"],
    software: ["software", "cloud", "internet", "saas", "platform", "analytics"],
  };

  function recommendLayer(sector, industry, summary) {
    const sources = [
      [(industry || "").toLowerCase(), 3],
      [(sector || "").toLowerCase(), 2],
      [(summary || "").toLowerCase(), 1],
    ];
    const ranked = [];
    for (const [lid, kws] of Object.entries(LAYER_KEYWORDS)) {
      let score = 0;
      const matched = [];
      for (const [text, weight] of sources) {
        for (const kw of kws) {
          if (text.includes(kw) && !matched.includes(kw)) {
            score += weight;
            matched.push(kw);
          }
        }
      }
      ranked.push({ layer: lid, name: LAYER_NAME[lid] || lid, score, matched });
    }
    ranked.sort((a, b) => b.score - a.score);
    const total = ranked.reduce((s, r) => s + r.score, 0) || 1;
    for (const r of ranked) r.confidence = r.score ? Math.round((r.score / total) * 100) : 0;
    const best = ranked[0].score > 0 ? ranked[0] : null;
    return { best, ranked };
  }

  async function lookupTicker(ticker) {
    const t = String(ticker || "").trim().toUpperCase();
    if (!t) return { ticker: t, ok: false, error: "Enter a ticker." };
    // Prefer existing universe data (no CORS).
    try {
      const payload = await loadScreen();
      const h = findHolding(payload, t);
      if (h) {
        const m = h.market || {};
        const { best, ranked } = recommendLayer("", "", (h.tags || []).join(" ") + " " + (h.thesis || ""));
        const existing_layers = [];
        for (const layer of payload.layers || []) {
          if (layer.holdings.some((x) => x.ticker === t)) {
            existing_layers.push(layer.name || layer.id);
          }
        }
        return {
          ticker: t,
          ok: true,
          name: h.name,
          sector: "",
          industry: (h.tags || []).join(", "),
          summary: h.thesis || "",
          price: m.price,
          market_cap: m.market_cap,
          currency: m.currency || "USD",
          trailing_pe: m.trailing_pe ?? null,
          forward_pe: m.forward_pe ?? null,
          price_to_sales: m.price_to_sales ?? null,
          ev_ebitda: m.ev_ebitda ?? null,
          revenue_growth: m.revenue_growth ?? null,
          existing_layers,
          // app.js expects recommend / ranked (Flask contract)
          recommend: best,
          ranked: ranked,
          recommendation: best,
          rankings: ranked,
        };
      }
    } catch {
      /* fall through */
    }
    return {
      ticker: t,
      ok: false,
      error:
        "That ticker isn’t in the curated universe. Edit src/data/datacenter-universe.json, run npm run update-screener, and redeploy — or look up a name already on this page.",
    };
  }

  async function handleApi(path, init) {
    const method = (init?.method || "GET").toUpperCase();
    let body = {};
    if (init?.body) {
      try {
        body = JSON.parse(init.body);
      } catch {
        body = {};
      }
    }

    if (path === "/api/screen" || path === "/api/refresh") {
      screenCache = null;
      if (path === "/api/refresh") newsCache = null;
      const payload = mergeUserIntoPayload(await loadScreen());
      if (path === "/api/refresh") payload.cached = false;
      return jsonResponse(payload);
    }

    if (path.startsWith("/api/news/")) {
      const ticker = decodeURIComponent(path.slice("/api/news/".length));
      const map = await loadNewsMap();
      const items = (map.news && map.news[ticker]) || [];
      // app.js expects { items }; keep `news` as a back-compat alias
      return jsonResponse({ ticker, items, news: items });
    }

    if (path === "/api/snapshot" && method === "POST") {
      const n = recordSnapshots(body.rows || []);
      return jsonResponse({ ok: true, written: n });
    }

    if (path === "/api/deltas") {
      return jsonResponse({ deltas: deltas() });
    }

    if (path.startsWith("/api/history/")) {
      const ticker = decodeURIComponent(path.slice("/api/history/".length));
      return jsonResponse({ ticker, series: series(ticker) });
    }

    if (path === "/api/report-types") {
      const reports = await loadReports();
      return jsonResponse({
        reports: (reports.reports || []).map((r) => ({ id: r.id, label: r.label, icon: r.icon })),
        has_key: false,
        provider: "",
      });
    }

    if (path === "/api/analyze" && method === "POST") {
      const reports = await loadReports();
      const report = (reports.reports || []).find((r) => r.id === body.type);
      if (!report) return jsonResponse({ ok: false, error: "Provide a valid ticker and report type." }, 400);
      const payload = mergeUserIntoPayload(await loadScreen());
      const holding = findHolding(payload, body.ticker);
      if (!holding) return jsonResponse({ ok: false, error: body.ticker + " is not in the universe." }, 404);
      const peers = report.peers ? peerHoldings(payload, body.ticker) : [];
      const map = await loadNewsMap();
      const news = (map.news && map.news[body.ticker]) || [];
      const ctx = buildContext(holding, peers, news, body.score, body.score_parts);
      const peerStr = peers.map((p) => p.name + " (" + p.ticker + ")").join(", ");
      const task = report.task
        .split("{company}").join(holding.name)
        .split("{ticker}").join(holding.ticker)
        .split("{peers}").join(peerStr || "its closest peers");
      const user =
        task +
        "\n\n--- LIVE DATA (use for current figures; may be partial) ---\n" +
        ctx +
        "\n--- END LIVE DATA ---";
      const prompt = (reports.system || "") + "\n\n" + user;
      return jsonResponse({
        ok: true,
        generated: false,
        need_key: true,
        prompt,
      });
    }

    if (path === "/api/layers") {
      const payload = await loadScreen();
      return jsonResponse({
        layers: (payload.layers || []).map((L) => ({ id: L.id, name: L.name })),
      });
    }

    if (path.startsWith("/api/lookup/")) {
      const ticker = decodeURIComponent(path.slice("/api/lookup/".length));
      return jsonResponse(await lookupTicker(ticker));
    }

    if (path === "/api/add-stock" && method === "POST") {
      const ticker = String(body.ticker || "")
        .trim()
        .toUpperCase();
      if (!/^[A-Z0-9.^_-]{1,15}$/.test(ticker)) {
        return jsonResponse({ ok: false, error: "Invalid ticker." }, 400);
      }
      const layer = String(body.layer || "").trim();
      if (!/^[a-zA-Z0-9_-]{1,64}$/.test(layer)) {
        return jsonResponse({ ok: false, error: "Invalid layer." }, 400);
      }
      const allowedExp = new Set(["pure", "high", "moderate", "diversified"]);
      const exposure = allowedExp.has(String(body.exposure || ""))
        ? String(body.exposure)
        : "moderate";
      const tags = Array.isArray(body.tags)
        ? body.tags
        : String(body.tags || "")
            .split(",")
            .map((s) => s.trim())
            .filter(Boolean)
            .slice(0, 12)
            .map((t) => String(t).slice(0, 40));
      const item = {
        ticker,
        name: String(body.name || ticker).slice(0, 120),
        layer,
        exposure,
        tags,
        thesis: String(body.thesis || "").slice(0, 280),
        market: body.market && typeof body.market === "object" ? body.market : undefined,
      };
      const items = loadUserStocks().filter(
        (x) => !(x.ticker === item.ticker && x.layer === item.layer)
      );
      items.push(item);
      saveUserStocks(items);
      screenCache = null;
      return jsonResponse({ ok: true, item });
    }

    if (path === "/api/remove-stock" && method === "POST") {
      const items = loadUserStocks().filter(
        (x) => !(x.ticker === body.ticker && x.layer === body.layer)
      );
      saveUserStocks(items);
      screenCache = null;
      return jsonResponse({ ok: true });
    }

    if (path === "/api/user-stocks") {
      const items = loadUserStocks();
      // app.js expects { items }; keep `stocks` as a back-compat alias
      return jsonResponse({ items, stocks: items });
    }

    if (path === "/api/datacenters") {
      const curated = await loadCampuses();
      const params = new URLSearchParams(path.includes("?") ? "" : "");
      // path is pathname only — parse min_mw from full URL when available via lastUrl
      let minMw = 0;
      try {
        minMw = Number(lastApiSearchParams.get("min_mw") || 0) || 0;
      } catch {
        minMw = 0;
      }
      const merged = [...(curated.sites || []), ...loadUserCampuses()].filter(
        (s) => (s.mw || 0) >= minMw
      );
      merged.sort((a, b) => (b.mw || 0) - (a.mw || 0));
      return jsonResponse({
        sites: merged,
        count: merged.length,
        disclaimer: curated.disclaimer || "",
        power_sources: curated.power_sources || ["Grid", "Gas", "Nuclear", "Renewables", "Hydro", "Mixed"],
      });
    }

    if (path === "/api/add-datacenter" && method === "POST") {
      const name = String(body.name || "").trim().slice(0, 120);
      const lat = Number(body.lat);
      const lng = Number(body.lng);
      const mw = Number(body.mw);
      if (!name || !Number.isFinite(lat) || !Number.isFinite(lng) || !Number.isFinite(mw)) {
        return jsonResponse(
          { ok: false, error: "Need at least a name, latitude, longitude and MW." },
          400
        );
      }
      const statuses = new Set(["operational", "construction", "planned"]);
      const powers = new Set(["Grid", "Gas", "Nuclear", "Renewables", "Hydro", "Mixed"]);
      const item = {
        name,
        operator: String(body.operator || "").slice(0, 120),
        lat,
        lng,
        mw,
        status: statuses.has(body.status) ? body.status : "planned",
        power: powers.has(body.power) ? body.power : "Grid",
        country: String(body.country || "").slice(0, 80),
        region: String(body.region || "").slice(0, 80),
        note: String(body.note || "").slice(0, 280),
        tickers: Array.isArray(body.tickers)
          ? body.tickers.map((t) => String(t).toUpperCase().slice(0, 15)).slice(0, 12)
          : String(body.tickers || "")
              .split(",")
              .map((t) => t.trim().toUpperCase())
              .filter(Boolean)
              .slice(0, 12),
        user_added: true,
      };
      const items = loadUserCampuses().filter((x) => x.name !== item.name);
      items.push(item);
      saveUserCampuses(items);
      return jsonResponse({ ok: true, item });
    }

    if (path === "/api/remove-datacenter" && method === "POST") {
      const name = String(body.name || "");
      saveUserCampuses(loadUserCampuses().filter((x) => x.name !== name));
      return jsonResponse({ ok: true });
    }

    if (path.startsWith("/api/signals/")) {
      return jsonResponse({ insider: null, buzz: null, items: [] });
    }

    if (path === "/api/backfill") {
      return jsonResponse({
        ok: false,
        error:
          "Historical backfill runs only in the local Flask app (archive/ai-datacenter-screener).",
      });
    }

    if (path === "/api/backtest") {
      return jsonResponse({
        ok: false,
        error:
          "Full score backtest needs local Yahoo history. Run the Flask app in archive/ai-datacenter-screener, or wait for a future CI snapshot.",
        note: "static_site",
      });
    }

    if (path === "/api/health") {
      return jsonResponse({ ok: true, mode: "static" });
    }

    return jsonResponse({ ok: false, error: "Unknown API route: " + path }, 404);
  }

  let lastApiSearchParams = new URLSearchParams();

  const origFetch = window.fetch.bind(window);
  window.fetch = async function (input, init) {
    try {
      const url =
        typeof input === "string" ? input : input instanceof URL ? input.href : input.url;
      if (url.startsWith("/api/") || (url.includes("/api/") && url.startsWith(location.origin))) {
        let path = url;
        if (url.startsWith("http")) {
          const u = new URL(url);
          if (u.origin === location.origin && u.pathname.startsWith("/api/")) {
            path = u.pathname;
            lastApiSearchParams = u.searchParams;
          }
        } else if (url.startsWith("/api/")) {
          const q = url.indexOf("?");
          if (q >= 0) {
            path = url.slice(0, q);
            lastApiSearchParams = new URLSearchParams(url.slice(q + 1));
          } else {
            path = url;
            lastApiSearchParams = new URLSearchParams();
          }
        }
        if (path.startsWith("/api/")) {
          return handleApi(path, init);
        }
      }
    } catch {
      /* fall through */
    }
    return origFetch(input, init);
  };
})();
