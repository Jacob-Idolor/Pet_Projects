// Global AI data-center map. A Leaflet slippy map (dark CARTO basemap) plotting
// curated + user-added campuses from /api/datacenters — markers sized by capacity
// and coloured by either status or power source. Sites link to related tickers,
// can be refreshed, and new ones can be logged as they're announced.
// Exposed as window.GlobalMap (NOT window.Map — that would shadow the JS Map class).
(function () {
  const $ = (id) => document.getElementById(id);
  const STATUS = {
    operational:  { color: "#34d399", label: "Operational" },
    construction: { color: "#fbbf24", label: "Under construction" },
    planned:      { color: "#4da3ff", label: "Planned" },
  };
  const POWER_COLORS = {
    Grid: "#8a99ad", Gas: "#fb923c", Nuclear: "#a78bfa",
    Renewables: "#34d399", Hydro: "#22d3ee", Mixed: "#fbbf24",
  };
  const POWER_ORDER = ["Grid", "Gas", "Nuclear", "Renewables", "Hydro", "Mixed"];
  const STATUS_OPTS = ["planned", "construction", "operational"];

  let map = null, markersLayer = null, sites = [], minMw = 250, colorBy = "status";
  let byName = {}, wired = false;

  const fmtMw = (mw) => (mw >= 1000 ? (mw % 1000 ? (mw / 1000).toFixed(1) : mw / 1000) + " GW" : mw + " MW");
  const radius = (mw) => Math.max(7, Math.min(32, 6 + Math.sqrt(mw) / 3));
  const esc = (s) => (s == null ? "" : String(s)).replace(/[&<>"]/g, (c) => ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;" }[c]));
  const siteColor = (s) => (colorBy === "power" ? (POWER_COLORS[s.power] || "#8a99ad") : (STATUS[s.status] || STATUS.planned).color);

  // small line/solid glyph per power source (fill/stroke = currentColor)
  function powerGlyph(power, size) {
    const s = size || 13;
    const g = {
      Gas: '<path d="M8 1.5c0 3-3 3.8-3 7a3 3 0 0 0 6 0c0-1.8-1-2.8-1-2.8 0 .9-1 .9-1 0 0-2 0-3.2-1-4.2z"/>',
      Nuclear: '<circle cx="8" cy="8" r="1.7"/><g fill="none" stroke="currentColor" stroke-width="1.1"><ellipse cx="8" cy="8" rx="6" ry="2.3"/><ellipse cx="8" cy="8" rx="6" ry="2.3" transform="rotate(60 8 8)"/><ellipse cx="8" cy="8" rx="6" ry="2.3" transform="rotate(120 8 8)"/></g>',
      Renewables: '<circle cx="8" cy="8" r="2.5"/><g stroke="currentColor" stroke-width="1.1"><line x1="8" y1="1" x2="8" y2="3"/><line x1="8" y1="13" x2="8" y2="15"/><line x1="1" y1="8" x2="3" y2="8"/><line x1="13" y1="8" x2="15" y2="8"/><line x1="3.3" y1="3.3" x2="4.7" y2="4.7"/><line x1="11.3" y1="11.3" x2="12.7" y2="12.7"/><line x1="12.7" y1="3.3" x2="11.3" y2="4.7"/><line x1="4.7" y1="11.3" x2="3.3" y2="12.7"/></g>',
      Hydro: '<path d="M8 1.5C8 1.5 13 7.5 13 10.2A5 5 0 1 1 3 10.2C3 7.5 8 1.5 8 1.5Z"/>',
      Grid: '<path d="M8 2 L3.8 14 M8 2 L12.2 14 M5.2 7 H10.8 M4.4 10.5 H11.6" fill="none" stroke="currentColor" stroke-width="1.2"/>',
      Mixed: '<circle cx="5.6" cy="8" r="2.2"/><circle cx="10.4" cy="8" r="2.2" opacity="0.55"/>',
    }[power] || '<circle cx="8" cy="8" r="2"/>';
    return `<svg width="${s}" height="${s}" viewBox="0 0 16 16" fill="currentColor" aria-hidden="true">${g}</svg>`;
  }

  function markerIcon(s) {
    const col = siteColor(s), d = Math.round(radius(s.mw) * 2);
    return L.divIcon({
      className: "dc-mkr",
      html: `<span class="dc-mk" style="width:${d}px;height:${d}px;background:${col}26;border-color:${col}">${powerGlyph(s.power, Math.round(d * 0.55))}</span>`,
      iconSize: [d, d], iconAnchor: [d / 2, d / 2], popupAnchor: [0, -Math.round(d / 2)],
    });
  }

  function ensureMap() {
    if (map || typeof L === "undefined") return;
    map = L.map("mapCanvas", { worldCopyJump: true, minZoom: 2, maxZoom: 11, scrollWheelZoom: true })
      .setView([28, 8], 2.3);
    L.tileLayer("https://{s}.basemaps.cartocdn.com/dark_all/{z}/{x}/{y}{r}.png", {
      subdomains: "abcd", maxZoom: 19,
      attribution: '&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> &copy; <a href="https://carto.com/attributions">CARTO</a>',
    }).addTo(map);
    // cluster dense regions when the plugin is present; otherwise a plain group
    markersLayer = (L.markerClusterGroup
      ? L.markerClusterGroup({ maxClusterRadius: 44, showCoverageOnHover: false, spiderfyOnMaxZoom: true, chunkedLoading: true })
      : L.layerGroup()).addTo(map);
    map.on("popupopen", (e) => {
      const root = e.popup.getElement();
      if (!root) return;
      root.querySelectorAll(".dc-tk").forEach((b) =>
        b.addEventListener("click", () => window.searchScreener && window.searchScreener(b.dataset.t)));
      const rm = root.querySelector(".dc-remove");
      if (rm) rm.addEventListener("click", () => removeSite(rm.dataset.name));
    });
  }

  function popupHtml(s) {
    const st = STATUS[s.status] || STATUS.planned;
    const tks = (s.tickers || []).map((t) => `<button class="dc-tk" data-t="${esc(t)}">${esc(t)}</button>`).join("")
      || '<span class="muted">no listed names</span>';
    return `<div class="dc-pop">
      <div class="dc-pop-h">${esc(s.name)}${s.user_added ? ' <span class="dc-userbadge">added</span>' : ""}</div>
      <div class="dc-pop-cap" style="color:${st.color}">${fmtMw(s.mw)} · ${st.label}</div>
      <div class="dc-pop-meta"><span class="dc-dot" style="background:${POWER_COLORS[s.power] || "#8a99ad"}"></span>${esc(s.power)} power</div>
      ${s.operator ? `<div class="dc-pop-op">${esc(s.operator)}</div>` : ""}
      <div class="dc-pop-loc">${[esc(s.region), esc(s.country)].filter(Boolean).join(" · ")}</div>
      ${s.note ? `<div class="dc-pop-note">${esc(s.note)}</div>` : ""}
      <div class="dc-pop-tks">${tks}</div>
      ${s.user_added ? `<button class="dc-remove" data-name="${esc(s.name)}">Remove this site</button>` : ""}
    </div>`;
  }

  function draw() {
    if (!map) return;
    markersLayer.clearLayers();
    byName = {};
    sites.forEach((s) => {
      const m = L.marker([s.lat, s.lng], { icon: markerIcon(s) })
        .bindPopup(popupHtml(s), { className: "dc-popup", maxWidth: 280 })
        .bindTooltip(`${esc(s.name)} · ${fmtMw(s.mw)} · ${esc(s.power)}`, { direction: "top" });
      m.addTo(markersLayer);
      byName[s.name] = m;
    });
  }

  function renderPanel() {
    const el = $("mapPanel");
    if (!el) return;
    const rows = sites.map((s) => {
      return `<button class="dc-row" data-name="${encodeURIComponent(s.name)}">
        <span class="dc-dot" style="background:${siteColor(s)}"></span>
        <span class="dc-row-main"><span class="dc-row-name">${esc(s.name)}${s.user_added ? " ＋" : ""}</span>
          <span class="dc-row-op">${[esc(s.region), esc(s.country)].filter(Boolean).join(", ")} · ${esc(s.power)}</span></span>
        <span class="dc-row-mw">${fmtMw(s.mw)}</span></button>`;
    }).join("");
    el.innerHTML = `<div class="dc-panel-h"><b>${sites.length}</b> campuses · ${minMw >= 1000 ? minMw / 1000 + " GW" : minMw + " MW"}+</div>
      <div class="dc-rows">${rows || '<span class="muted">No sites at this threshold.</span>'}</div>`;
    el.querySelectorAll(".dc-row").forEach((b) => b.addEventListener("click", () => {
      const m = byName[decodeURIComponent(b.dataset.name)];
      if (m) { map.flyTo(m.getLatLng(), 6, { duration: 0.8 }); m.openPopup(); }
    }));
  }

  function buildLegend() {
    const el = $("mapLegend");
    if (!el) return;
    let html;
    if (colorBy === "power") {
      html = POWER_ORDER.map((p) => `<span class="dc-lg"><span class="dc-lgi" style="color:${POWER_COLORS[p]}">${powerGlyph(p, 13)}</span>${p}</span>`).join("");
    } else {
      html = Object.values(STATUS).map((s) => `<span class="dc-lg"><span class="dc-dot" style="background:${s.color}"></span>${s.label}</span>`).join("");
      html += `<span class="dc-lg dc-lg-key">icons =</span>` +
        POWER_ORDER.map((p) => `<span class="dc-lg dc-lg-glyph" title="${p}"><span class="dc-lgi">${powerGlyph(p, 12)}</span>${p}</span>`).join("");
    }
    html += `<span class="dc-lg muted">◯ size = capacity</span>`;
    el.innerHTML = html;
  }

  async function load() {
    try {
      const r = await fetch("/api/datacenters?min_mw=" + minMw);
      const d = await r.json();
      sites = d.sites || [];
      const disc = $("gmapDisc");
      if (disc) disc.textContent = d.disclaimer || "";
    } catch { sites = []; }
    draw();
    renderPanel();
    buildLegend();
  }

  async function removeSite(name) {
    try {
      await fetch("/api/remove-datacenter", { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ name }) });
      await load();
    } catch { /* ignore */ }
  }

  // ---- add-site form -----------------------------------------------------
  function buildAddForm() {
    const el = $("mapAddForm");
    if (!el) return;
    const opt = (v) => `<option value="${v}">${v}</option>`;
    el.innerHTML = `
      <div class="af-head">Log a newly-announced campus</div>
      <div class="af-grid">
        <label>Name*<input id="afName" type="text" placeholder="e.g. Stargate Michigan" /></label>
        <label>Operator / partners<input id="afOperator" type="text" placeholder="OpenAI · Oracle · …" /></label>
        <label>Latitude*<input id="afLat" type="number" step="any" placeholder="42.33" /></label>
        <label>Longitude*<input id="afLng" type="number" step="any" placeholder="-83.05" /></label>
        <label>Capacity MW*<input id="afMw" type="number" step="any" placeholder="500" /></label>
        <label>Status<select id="afStatus">${STATUS_OPTS.map(opt).join("")}</select></label>
        <label>Power<select id="afPower">${POWER_ORDER.map(opt).join("")}</select></label>
        <label>Country<input id="afCountry" type="text" placeholder="USA" /></label>
        <label>Region<input id="afRegion" type="text" placeholder="Michigan" /></label>
        <label>Tickers<input id="afTickers" type="text" placeholder="MSFT, NVDA" /></label>
        <label class="af-wide">Note<input id="afNote" type="text" placeholder="one-line context" /></label>
      </div>
      <div class="af-foot">
        <span id="afMsg" class="muted"></span>
        <button id="afCancel">Cancel</button>
        <button id="afSave">Save site</button>
      </div>`;
    $("afSave").addEventListener("click", saveSite);
    $("afCancel").addEventListener("click", () => el.classList.add("hidden"));
  }

  async function saveSite() {
    const v = (id) => $(id).value.trim();
    const body = {
      name: v("afName"), operator: v("afOperator"), country: v("afCountry"), region: v("afRegion"),
      lat: v("afLat"), lng: v("afLng"), mw: v("afMw"),
      status: $("afStatus").value, power: $("afPower").value, tickers: v("afTickers"), note: v("afNote"),
    };
    const msg = $("afMsg");
    if (!body.name || !body.lat || !body.lng || !body.mw) { msg.innerHTML = '<span class="af-err">Name, lat, lng and MW are required.</span>'; return; }
    msg.textContent = "Saving…";
    try {
      const r = await fetch("/api/add-datacenter", { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify(body) });
      const d = await r.json();
      if (!d.ok) { msg.innerHTML = `<span class="af-err">${esc(d.error || "Save failed.")}</span>`; return; }
      $("mapAddForm").classList.add("hidden");
      if (+body.mw < minMw) { minMw = 250; syncThresholdButtons(); }   // make sure the new site is visible
      await load();
      const m = byName[d.item.name];
      if (m) { map.flyTo(m.getLatLng(), 6, { duration: 0.8 }); m.openPopup(); }
    } catch { msg.innerHTML = '<span class="af-err">Request failed.</span>'; }
  }

  function syncThresholdButtons() {
    document.querySelectorAll("#mapThreshold button").forEach((b) => b.classList.toggle("active", +b.dataset.mw === minMw));
  }

  function wireControls() {
    if (wired) return;
    wired = true;
    document.querySelectorAll("#mapThreshold button").forEach((b) =>
      b.addEventListener("click", () => { minMw = +b.dataset.mw; syncThresholdButtons(); load(); }));
    document.querySelectorAll("#mapColorBy button").forEach((b) =>
      b.addEventListener("click", () => {
        colorBy = b.dataset.by;
        document.querySelectorAll("#mapColorBy button").forEach((x) => x.classList.toggle("active", x === b));
        draw(); renderPanel(); buildLegend();
      }));
    const ref = $("mapRefresh");
    if (ref) ref.addEventListener("click", () => { ref.classList.add("spin"); load().finally(() => setTimeout(() => ref.classList.remove("spin"), 400)); });
    const add = $("mapAddToggle");
    if (add) add.addEventListener("click", () => {
      const f = $("mapAddForm");
      if (f.classList.contains("hidden")) { buildAddForm(); f.classList.remove("hidden"); }
      else f.classList.add("hidden");
    });
  }

  function render() {
    if (typeof L === "undefined") {
      const el = $("mapPanel");
      if (el) el.innerHTML = '<div class="muted" style="padding:20px">Map library couldn\'t load — check your internet connection.</div>';
      return;
    }
    ensureMap();
    wireControls();
    setTimeout(() => { if (map) map.invalidateSize(); }, 80);   // canvas was hidden until now
    load();
  }

  window.GlobalMap = { render };
})();
