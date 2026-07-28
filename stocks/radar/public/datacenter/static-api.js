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

  let screenCache = null;
  let newsCache = null;
  let reportsCache = null;

  function jsonResponse(data, status = 200) {
    return new Response(JSON.stringify(data), {
      status,
      headers: { "Content-Type": "application/json" },
    });
  }

  async function loadScreen() {
    if (screenCache) return screenCache;
    const res = await origFetch(screenerUrl, { cache: "no-store" });
    if (!res.ok) throw new Error("Failed to load screener.json (" + res.status + ")");
    screenCache = await res.json();
    screenCache.cached = true;
    return screenCache;
  }

  async function loadNewsMap() {
    if (newsCache) return newsCache;
    try {
      const res = await origFetch(newsUrl, { cache: "no-store" });
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
    const res = await origFetch(reportsUrl);
    reportsCache = await res.json();
    return reportsCache;
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
    return new Date().toISOString().slice(0, 10);
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
      const cutoffDate = new Date(latest.date + "T00:00:00Z");
      cutoffDate.setUTCDate(cutoffDate.getUTCDate() - 7);
      const cutoff = cutoffDate.toISOString().slice(0, 10);
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
        "Live Yahoo lookup needs the desktop app. Add this ticker to src/data/datacenter-universe.json and re-run npm run update-screener — or pick a name already in the universe.",
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
      const payload = mergeUserIntoPayload(await loadScreen());
      if (path === "/api/refresh") payload.cached = false;
      return jsonResponse(payload);
    }

    if (path.startsWith("/api/news/")) {
      const ticker = decodeURIComponent(path.slice("/api/news/".length));
      const map = await loadNewsMap();
      return jsonResponse({ ticker, news: (map.news && map.news[ticker]) || [] });
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
      const items = loadUserStocks().filter(
        (x) => !(x.ticker === body.ticker && x.layer === body.layer)
      );
      items.push(body);
      saveUserStocks(items);
      screenCache = null;
      return jsonResponse({ ok: true });
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
      return jsonResponse({ stocks: loadUserStocks() });
    }

    return jsonResponse({ ok: false, error: "Unknown API route: " + path }, 404);
  }

  const origFetch = window.fetch.bind(window);
  window.fetch = function (input, init) {
    const url = typeof input === "string" ? input : input && input.url;
    if (typeof url === "string") {
      let path = url;
      try {
        if (url.startsWith("http")) path = new URL(url).pathname;
      } catch {
        /* keep path */
      }
      if (path.startsWith("/api/")) {
        return handleApi(path, init);
      }
    }
    return origFetch(input, init);
  };
})();
