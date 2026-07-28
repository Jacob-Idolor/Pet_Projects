// Interactive data-center cutaway. A detailed 2.5D side view of an AI "factory":
// grid power enters at the left through a substation, GPUs fill the halls under
// hot-aisle containment, cooling towers crown the roof, fiber stitches it all
// together, and intelligence flows out the top. Each of the six layers is a
// hoverable/clickable zone wired to live screener data (window.STATE) and to
// window.focusScreenerLayer.
(function () {
  const LAYER_META = {
    land:       { num: 1, color: "#94a3b8", label: "Land & Shell",
                  bottleneck: "Skilled construction & engineering labor; 18–36-month build timelines." },
    power:      { num: 2, color: "#fbbf24", label: "Power Infrastructure",
                  bottleneck: "THE constraint — transformers & substations on up-to-5-year lead times." },
    cooling:    { num: 3, color: "#22d3ee", label: "Cooling",
                  bottleneck: "Liquid cooling + water access as racks hit 120–600 kW each." },
    compute:    { num: 4, color: "#34d399", label: "Compute (GPUs)",
                  bottleneck: "CoWoS advanced packaging & HBM memory — not the GPU die itself." },
    networking: { num: 5, color: "#a78bfa", label: "Networking",
                  bottleneck: "Optics & fiber scaling as clusters push past 100,000 GPUs." },
    software:   { num: 6, color: "#4da3ff", label: "Software & Demand",
                  bottleneck: "Idle-capital risk; orchestration, monitoring & digital-twin design." },
  };
  const ORDER = ["land", "power", "cooling", "compute", "networking", "software"];
  const EXP_COLOR = { pure: "#34d399", high: "#4da3ff", moderate: "#fbbf24", diversified: "#8a99ad" };

  const $ = (id) => document.getElementById(id);
  const layerById = (id) => (window.STATE && window.STATE.layers || []).find((l) => l.id === id);
  const fmtP = (n) => (n == null ? "—" : "$" + n.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 }));

  let selected = null, lastShown = null;

  // ====================================================================
  //  ISOMETRIC CAD TOOLKIT
  //  Single light source (upper-left). A solid's top face is the brightest,
  //  the left/front face mid, the right/side face darkest. Iso projection
  //  uses a 2:1 dimetric ratio (cos≈0.5 vertical drop) so the maths stays
  //  readable and the parts read like an engineering model.
  // ====================================================================
  const ISO = 0.5;                              // vertical run per unit of x/y depth
  // project a 3D point (px,py = ground plane axes, pz = height) to screen,
  // anchored at screen origin (ox,oy).
  const iso = (ox, oy, px, py, pz) => [
    +(ox + (px - py)).toFixed(2),
    +(oy + (px + py) * ISO - pz).toFixed(2),
  ];
  const poly = (pts, fill, stroke, extra) =>
    `<polygon points="${pts.map((p) => p.join(",")).join(" ")}" fill="${fill}" stroke="${stroke || "#05080d"}" stroke-width="1" stroke-linejoin="round"${extra ? " " + extra : ""}/>`;

  // isoBox: an extruded solid at ground origin (ox,oy), footprint w(×)×d(depth),
  // height h. Returns top+left+right faces with per-face shading from a palette
  // {top, left, right, edge}. Drawn back-to-front so faces overlap correctly.
  function isoBox(ox, oy, w, d, h, c) {
    const b000 = iso(ox, oy, 0, 0, 0), b100 = iso(ox, oy, w, 0, 0),
          b110 = iso(ox, oy, w, d, 0), b010 = iso(ox, oy, 0, d, 0),
          t000 = iso(ox, oy, 0, 0, h), t100 = iso(ox, oy, w, 0, h),
          t110 = iso(ox, oy, w, d, h), t010 = iso(ox, oy, 0, d, h);
    const left  = poly([b000, b100, t100, t000], c.left, c.edge);    // front (−y) face
    const right = poly([b100, b110, t110, t100], c.right, c.edge);   // side (+x) face
    const top   = poly([t000, t100, t110, t010], c.top, c.edge);     // roof
    return { left, right, top, html: left + right + top, t000, t100, t110, t010, b100, b110 };
  }
  // common metallic palettes
  const PAL = {
    steel:   { top: "#39475c", left: "#28323f", right: "#1b232d", edge: "#10161d" },
    green:   { top: "#1d3327", left: "#142219", right: "#0c160f", edge: "#06100a" },
    copper:  { top: "#3a2f15", left: "#2a230f", right: "#1c1809", edge: "#100c05" },
    cyan:    { top: "#16323a", left: "#0f2329", right: "#0a191d", edge: "#06100f" },
    slate:   { top: "#2a3140", left: "#1d2330", right: "#141821", edge: "#0a0d12" },
    blue:    { top: "#1b2c44", left: "#142235", right: "#0d1726", edge: "#070d16" },
  };

  // dimension line with arrowheads at both ends + a measurement label
  function dim(x1, y1, x2, y2, label) {
    const mx = (x1 + x2) / 2, my = (y1 + y2) / 2;
    return `<g class="dc-dim"><line x1="${x1}" y1="${y1}" x2="${x2}" y2="${y2}" marker-start="url(#dimArrow)" marker-end="url(#dimArrow)"/>` +
      `<rect x="${(mx - label.length * 3 - 4).toFixed(1)}" y="${(my - 8).toFixed(1)}" width="${label.length * 6 + 8}" height="13" rx="2" fill="#0a1019" opacity="0.85"/>` +
      `<text x="${mx.toFixed(1)}" y="${(my + 2).toFixed(1)}" text-anchor="middle" class="dc-dim-t">${label}</text></g>`;
  }

  // A server rack as an isometric 42U cabinet: front face shows 1U server
  // units with status LEDs; top + right faces give it depth.
  function rack(x, y, w, h) {
    const d = 13, units = 7, uh = (h - 8) / units;
    const box = isoBox(x, y + h, w, d, h, PAL.green);
    // 1U server units painted on the front (left) face, perspective-skewed
    let servers = "";
    for (let i = 0; i < units; i++) {
      const z0 = h - 4 - i * uh, z1 = z0 - (uh - 2);
      const p0 = iso(x, y + h, 1, 0, z0), p1 = iso(x, y + h, w - 1, 0, z0),
            p2 = iso(x, y + h, w - 1, 0, z1), p3 = iso(x, y + h, 1, 0, z1);
      servers += `<polygon points="${p0.join(",")} ${p1.join(",")} ${p2.join(",")} ${p3.join(",")}" fill="#16241c" stroke="#0a120d" stroke-width="0.6"/>`;
      const led = iso(x, y + h, 5, 0, (z0 + z1) / 2);
      servers += `<circle cx="${led[0]}" cy="${led[1]}" r="1.4" fill="${i % 3 ? "#3ddc97" : "#fbbf24"}"/>`;
      const led2 = iso(x, y + h, 9, 0, (z0 + z1) / 2);
      servers += `<circle cx="${led2[0]}" cy="${led2[1]}" r="1.2" fill="#3ddc97" opacity="0.6"/>`;
    }
    return `<g filter="url(#dropShadow)">${box.left}${box.right}${box.top}${servers}</g>`;
  }

  // Oil-filled transformer: isometric tank + radiator fins on the side +
  // three HV bushings rising off the top face.
  function transformer(x, y) {
    const w = 42, d = 30, h = 50;
    const box = isoBox(x, y, w, d, h, PAL.copper);
    // radiator fins along the front (left) face
    let fins = "";
    for (let i = 0; i < 6; i++) {
      const fx = 5 + i * 6;
      const a = iso(x, y, fx, 0, h - 6), b = iso(x, y, fx, 0, 8),
            c = iso(x, y, fx, -7, 8), dd = iso(x, y, fx, -7, h - 6);
      fins += `<polygon points="${a.join(",")} ${b.join(",")} ${c.join(",")} ${dd.join(",")}" fill="#241d0c" stroke="#4a3d18" stroke-width="0.7"/>`;
    }
    // 3 HV bushings on the top face
    let bushings = "";
    [[10, 8], [21, 14], [32, 20]].forEach(([bx, by]) => {
      const base = iso(x, y, bx, by, h), tip = iso(x, y, bx, by, h + 18);
      bushings += `<line x1="${base[0]}" y1="${base[1]}" x2="${tip[0]}" y2="${tip[1]}" stroke="#7c8aa0" stroke-width="3"/>`;
      bushings += `<ellipse cx="${tip[0]}" cy="${tip[1]}" rx="5" ry="2.6" fill="#c9d4e0"/>`;
      bushings += `<ellipse cx="${tip[0]}" cy="${(tip[1] + 5).toFixed(1)}" rx="6" ry="3" fill="#aab6c4"/>`;
    });
    return `<g filter="url(#dropShadow)">${box.left}${box.right}${box.top}${fins}${bushings}</g>`;
  }

  // Switchgear / substation lineup: a short row of isometric cubicles with
  // breaker handles on the front faces.
  function switchgear(x, y) {
    let cells = "";
    for (let i = 0; i < 3; i++) {
      const ox = x + i * 22, box = isoBox(ox, y, 20, 26, 40, PAL.steel);
      cells += box.left + box.right + box.top;
      const h0 = iso(ox, y, 10, 0, 28), h1 = iso(ox, y, 10, 0, 22);
      cells += `<line x1="${h0[0]}" y1="${h0[1]}" x2="${h1[0]}" y2="${h1[1]}" stroke="#fbbf24" stroke-width="2"/>`;
      cells += `<circle cx="${h0[0]}" cy="${h0[1]}" r="1.6" fill="#fbbf24"/>`;
    }
    return `<g filter="url(#dropShadow)">${cells}</g>`;
  }

  // Cooling tower: isometric louvered body with a top fan (blades on the roof
  // face) and a rising vapor plume.
  function coolingTower(x, y) {
    const w = 44, d = 36, h = 40;
    const box = isoBox(x, y + h, w, d, h, PAL.cyan);
    // louver slats across the front face
    let louvers = "";
    for (let i = 0; i < 4; i++) {
      const z = 8 + i * 8;
      const a = iso(x, y + h, 4, 0, z), b = iso(x, y + h, w - 4, 0, z);
      louvers += `<line x1="${a[0]}" y1="${a[1]}" x2="${b[0]}" y2="${b[1]}" stroke="#1f6b78" stroke-width="2"/>`;
    }
    // fan hub + blades on the top face
    const hub = iso(x, y + h, w / 2, d / 2, h);
    let blades = "";
    for (let a = 0; a < 6; a++) {
      const ang = (a / 6) * Math.PI * 2;
      const tip = iso(x, y + h, w / 2 + Math.cos(ang) * (w * 0.38), d / 2 + Math.sin(ang) * (d * 0.38), h);
      blades += `<line x1="${hub[0]}" y1="${hub[1]}" x2="${tip[0]}" y2="${tip[1]}" stroke="#2b6e7b" stroke-width="2.4"/>`;
    }
    const plumeX = hub[0], plumeY = hub[1];
    return `<g>
      <g filter="url(#vapor)" opacity="0.45">
        <ellipse cx="${plumeX}" cy="${(plumeY - 22).toFixed(1)}" rx="16" ry="10" fill="#cfe8ee"/>
        <ellipse cx="${(plumeX + 8).toFixed(1)}" cy="${(plumeY - 40).toFixed(1)}" rx="22" ry="13" fill="#bfe0e8"/>
        <ellipse cx="${(plumeX - 6).toFixed(1)}" cy="${(plumeY - 58).toFixed(1)}" rx="26" ry="15" fill="#aed6e0"/>
      </g>
      <g filter="url(#dropShadow)">${box.left}${box.right}${box.top}${louvers}
        <ellipse cx="${hub[0]}" cy="${hub[1]}" rx="20" ry="10" fill="#0c1e23" stroke="#26808f"/>
        ${blades}<circle cx="${hub[0]}" cy="${hub[1]}" r="3.5" fill="#22d3ee"/>
      </g>
    </g>`;
  }

  // Backup diesel generator: isometric enclosure with louvers on the front
  // face and an exhaust stack rising off the top.
  function genset(x, y) {
    const w = 42, d = 28, h = 38;
    const box = isoBox(x, y + h, w, d, h, PAL.slate);
    let louvers = "";
    for (let i = 0; i < 4; i++) {
      const z = 8 + i * 7;
      const a = iso(x, y + h, 5, 0, z), b = iso(x, y + h, w - 5, 0, z);
      louvers += `<line x1="${a[0]}" y1="${a[1]}" x2="${b[0]}" y2="${b[1]}" stroke="#3a4150" stroke-width="2"/>`;
    }
    const ex0 = iso(x, y + h, w - 6, d - 6, h), ex1 = iso(x, y + h, w - 6, d - 6, h + 16);
    const stack = `<line x1="${ex0[0]}" y1="${ex0[1]}" x2="${ex1[0]}" y2="${ex1[1]}" stroke="#2b313c" stroke-width="5"/><ellipse cx="${ex1[0]}" cy="${ex1[1]}" rx="3.4" ry="1.8" fill="#1a1f27"/>`;
    return `<g filter="url(#dropShadow)">${box.left}${box.right}${box.top}${louvers}${stack}</g>`;
  }

  // Lattice transmission tower with crossarms, insulator strings and HV lines.
  function pylon(x, top, bot) {
    const w = 44, cx = x + w / 2;
    let lattice = `<line x1="${x}" y1="${bot}" x2="${cx}" y2="${top}"/><line x1="${x + w}" y1="${bot}" x2="${cx}" y2="${top}"/>`;
    for (let yy = top + 24; yy < bot; yy += 30) {
      const t = (yy - top) / (bot - top), lx = x + (w / 2) * t * 0.7, rx = x + w - (w / 2) * t * 0.7;
      lattice += `<line x1="${lx.toFixed(1)}" y1="${yy}" x2="${rx.toFixed(1)}" y2="${yy}"/>`;
      lattice += `<line x1="${lx.toFixed(1)}" y1="${yy}" x2="${rx.toFixed(1)}" y2="${yy + 30}"/>`;
    }
    return `<g stroke="#46546b" stroke-width="2" fill="none">${lattice}
      <line x1="${x - 16}" y1="${top + 14}" x2="${x + w + 16}" y2="${top + 14}"/>
      <line x1="${x - 6}" y1="${top + 36}" x2="${x + w + 6}" y2="${top + 36}"/>
    </g>
    <g fill="#9aa7b8">
      <circle cx="${x - 14}" cy="${top + 18}" r="2"/><circle cx="${x + w + 14}" cy="${top + 18}" r="2"/>
    </g>`;
  }

  function badge(x, y, n, color) {
    return `<circle cx="${x}" cy="${y}" r="13" fill="${color}" filter="url(#dropShadow)"/><text x="${x}" y="${y + 4}" text-anchor="middle" class="zone-tag-num">${n}</text>`;
  }
  function zoneG(id, hit) {
    const m = LAYER_META[id];
    return `<g class="zone" data-layer="${id}" style="--zc:${m.color}" tabindex="0" role="button" aria-label="Layer ${m.num}: ${m.label}">
      <rect class="zone-outline" x="${hit.x}" y="${hit.y}" width="${hit.w}" height="${hit.h}" rx="${hit.rx ?? 10}"/>
      ${badge(hit.bx, hit.by, m.num, m.color)}
      <rect x="${hit.x}" y="${hit.y}" width="${hit.w}" height="${hit.h}" fill="transparent"/>
    </g>`;
  }

  function svgMarkup() {
    const D = 30;                          // building extrusion depth
    const bx = 380, bw = 600, roofY = 220, floorY = 565;  // building front face
    const brx = bx + bw;

    // server hall: one deep row of racks under hot-aisle containment
    const rackY = 408, rackH = 132, rackW = 40, gap = 12;
    let rackRow = "";
    for (let i = 0; i < 11; i++) rackRow += rack(bx + 34 + i * (rackW + gap), rackY, rackW, rackH);

    // cooling towers along the roof + chilled-water risers
    const towers = [700, 772, 844, 916].map((tx) => coolingTower(tx, 168)).join("");
    const risers = [726, 870].map((px) =>
      `<line x1="${px}" y1="220" x2="${px}" y2="405" stroke="url(#pipe)" stroke-width="6"/>` +
      `<line x1="${px + 9}" y1="220" x2="${px + 9}" y2="405" stroke="#3b82f6" stroke-width="3" opacity="0.7"/>`).join("");

    // overhead cable tray with fiber bundles + spine switches + drops
    let fiberDrops = "";
    for (let i = 0; i < 11; i++) { const fx = bx + 54 + i * (rackW + gap); fiberDrops += `<line x1="${fx}" y1="296" x2="${fx}" y2="${rackY - 6}" stroke="#a78bfa" stroke-width="1.4" opacity="0.65"/>`; }

    // raised-floor perforated tiles
    let tiles = "";
    for (let i = 0; i < 17; i++) tiles += `<rect x="${bx + 12 + i * 34}" y="546" width="30" height="13" fill="#0c1019" stroke="#1b2839"/><line x1="${bx + 18 + i * 34}" y1="549" x2="${bx + 18 + i * 34}" y2="556" stroke="#243349"/><line x1="${bx + 24 + i * 34}" y1="549" x2="${bx + 24 + i * 34}" y2="556" stroke="#243349"/>`;

    return `<svg viewBox="0 0 1100 680" xmlns="http://www.w3.org/2000/svg" role="img" aria-label="AI data center cross-section">
      <defs>
        <linearGradient id="sky" x1="0" y1="0" x2="0" y2="1">
          <stop offset="0" stop-color="#0a1018"/><stop offset="0.7" stop-color="#0c1422"/><stop offset="1" stop-color="#0e1828"/>
        </linearGradient>
        <radialGradient id="horizon" cx="0.62" cy="0.92" r="0.7">
          <stop offset="0" stop-color="#16304d" stop-opacity="0.55"/><stop offset="1" stop-color="#16304d" stop-opacity="0"/>
        </radialGradient>
        <linearGradient id="bldgFace" x1="0" y1="0" x2="0" y2="1">
          <stop offset="0" stop-color="#172234"/><stop offset="1" stop-color="#0d1521"/>
        </linearGradient>
        <linearGradient id="hall" x1="0" y1="0" x2="0" y2="1">
          <stop offset="0" stop-color="#0a111c"/><stop offset="1" stop-color="#070c14"/>
        </linearGradient>
        <linearGradient id="rackFace" x1="0" y1="0" x2="1" y2="0">
          <stop offset="0" stop-color="#101b13"/><stop offset="0.5" stop-color="#0c160f"/><stop offset="1" stop-color="#0a120c"/>
        </linearGradient>
        <linearGradient id="pipe" x1="0" y1="0" x2="0" y2="1">
          <stop offset="0" stop-color="#22d3ee"/><stop offset="1" stop-color="#0ea5e9"/>
        </linearGradient>
        <radialGradient id="serverGlow" cx="0.5" cy="0.5" r="0.5">
          <stop offset="0" stop-color="#34d399" stop-opacity="0.18"/><stop offset="1" stop-color="#34d399" stop-opacity="0"/>
        </radialGradient>
        <filter id="dropShadow" x="-20%" y="-20%" width="140%" height="150%">
          <feDropShadow dx="0" dy="3" stdDeviation="3" flood-color="#000" flood-opacity="0.5"/>
        </filter>
        <filter id="vapor" x="-80%" y="-80%" width="260%" height="260%"><feGaussianBlur stdDeviation="7"/></filter>
        <filter id="softGlow" x="-60%" y="-60%" width="220%" height="220%"><feGaussianBlur stdDeviation="5"/></filter>
        <filter id="bigBlur" x="-120%" y="-120%" width="340%" height="340%"><feGaussianBlur stdDeviation="28"/></filter>
        <radialGradient id="ambGreen" cx="0.5" cy="0.5" r="0.5"><stop offset="0" stop-color="#34d399" stop-opacity="0.5"/><stop offset="1" stop-color="#34d399" stop-opacity="0"/></radialGradient>
        <radialGradient id="ambWarm" cx="0.5" cy="0.5" r="0.5"><stop offset="0" stop-color="#f5a524" stop-opacity="0.45"/><stop offset="1" stop-color="#f5a524" stop-opacity="0"/></radialGradient>
        <radialGradient id="ambCyan" cx="0.5" cy="0.5" r="0.5"><stop offset="0" stop-color="#22d3ee" stop-opacity="0.42"/><stop offset="1" stop-color="#22d3ee" stop-opacity="0"/></radialGradient>
        <radialGradient id="ambCool" cx="0.5" cy="0.5" r="0.5"><stop offset="0" stop-color="#4d8fe0" stop-opacity="0.4"/><stop offset="1" stop-color="#4d8fe0" stop-opacity="0"/></radialGradient>
        <radialGradient id="vignette" cx="0.5" cy="0.42" r="0.78"><stop offset="0.5" stop-color="#000" stop-opacity="0"/><stop offset="1" stop-color="#05080d" stop-opacity="0.6"/></radialGradient>
        <marker id="arrow" markerWidth="9" markerHeight="9" refX="6" refY="3" orient="auto"><path d="M0 0 L6 3 L0 6 Z" fill="#8a99ad"/></marker>
        <!-- CAD dimension arrowhead (slim, both ends) -->
        <marker id="dimArrow" markerWidth="10" markerHeight="8" refX="5" refY="4" orient="auto"><path d="M2 4 L9 1 L7 4 L9 7 Z" fill="#7c8aa0"/></marker>
        <!-- blueprint grid: fine + major lines -->
        <pattern id="bpFine" width="22" height="22" patternUnits="userSpaceOnUse">
          <path d="M22 0 L0 0 L0 22" fill="none" stroke="#1b3a55" stroke-width="0.5" opacity="0.5"/>
        </pattern>
        <pattern id="bpMajor" width="110" height="110" patternUnits="userSpaceOnUse">
          <path d="M110 0 L0 0 L0 110" fill="none" stroke="#23527a" stroke-width="0.9" opacity="0.55"/>
        </pattern>
      </defs>

      <!-- blueprint / engineering grid backdrop (photo backdrop retired for the
           CAD look; static/assets/hall.jpg kept on disk) -->
      <rect x="0" y="0" width="1100" height="680" fill="#081019"/>
      <rect x="0" y="0" width="1100" height="680" fill="url(#bpFine)"/>
      <rect x="0" y="0" width="1100" height="680" fill="url(#bpMajor)"/>
      <rect x="0" y="0" width="1100" height="680" fill="url(#sky)" opacity="0.35"/>
      <rect x="0" y="0" width="1100" height="680" fill="url(#horizon)"/>

      <!-- atmospheric ambient lighting (equipment casts coloured light) -->
      <g filter="url(#bigBlur)">
        <ellipse cx="615" cy="430" rx="320" ry="150" fill="url(#ambGreen)"/>
        <ellipse cx="165" cy="500" rx="150" ry="120" fill="url(#ambWarm)"/>
        <ellipse cx="800" cy="180" rx="200" ry="100" fill="url(#ambCyan)"/>
        <ellipse cx="500" cy="95" rx="170" ry="80" fill="url(#ambCool)"/>
      </g>

      <!-- ground plane + glossy floor reflections (light pools below sources) -->
      <path d="M0 600 L1100 600 L1100 680 L0 680 Z" fill="#0a0f17"/>
      <g filter="url(#bigBlur)" opacity="0.55">
        <ellipse cx="645" cy="612" rx="280" ry="30" fill="url(#ambGreen)"/>
        <ellipse cx="205" cy="616" rx="120" ry="22" fill="url(#ambWarm)"/>
        <ellipse cx="800" cy="610" rx="150" ry="20" fill="url(#ambCyan)"/>
      </g>
      <path d="M0 600 L1100 600 L1100 606 L0 606 Z" fill="#16243a" opacity="0.6"/>

      <!-- flow labels -->
      <text x="30" y="44" class="dc-flow-label">⚡ GRID POWER</text>
      <text x="150" y="44" class="dc-flow-label">📡 DATA →</text>
      <line x1="232" y1="40" x2="404" y2="74" stroke="#8a99ad" stroke-width="1.5" marker-end="url(#arrow)"/>
      <text x="612" y="34" class="dc-flow-label" style="fill:#9fc4ff">INTELLIGENCE →</text>
      <line x1="600" y1="52" x2="788" y2="30" stroke="#4da3ff" stroke-width="1.6" marker-end="url(#arrow)"/>
      <circle cx="630" cy="46" r="2.5" fill="#4da3ff"/><circle cx="678" cy="40" r="2.5" fill="#4da3ff"/><circle cx="726" cy="35" r="2.5" fill="#4da3ff"/>

      <!-- ===== POWER YARD (substation lineup) ===== -->
      ${pylon(70, 250, 600)}
      <path d="M58 264 Q150 360 192 452" stroke="#fbbf24" stroke-width="1.4" fill="none" opacity="0.55"/>
      <path d="M126 264 Q190 360 262 452" stroke="#fbbf24" stroke-width="1.4" fill="none" opacity="0.55"/>
      ${switchgear(108, 506)}
      ${transformer(176, 466)}
      ${transformer(252, 470)}
      ${genset(304, 506)}
      <line x1="356" y1="486" x2="386" y2="486" stroke="#fbbf24" stroke-width="3" marker-end="url(#arrow)"/>
      <text x="120" y="556" class="dc-flow-label" style="fill:#7a6a3a;font-size:10px">SUBSTATION · GENSET</text>
      ${dim(108, 575, 350, 575, "MV switchyard")}

      <!-- ===== BUILDING (isometric shell) ===== -->
      <!-- roof (top face) -->
      <path d="M${bx} ${roofY} L${brx} ${roofY} L${brx + D} ${roofY - D} L${bx + D} ${roofY - D} Z" fill="#22303f" stroke="#34465c" stroke-width="1.2"/>
      <!-- right (depth) face -->
      <path d="M${brx} ${roofY} L${brx + D} ${roofY - D} L${brx + D} ${floorY - D} L${brx} ${floorY} Z" fill="#0c1320" stroke="#1d2a3a" stroke-width="1"/>
      <!-- front face: the cutaway hall -->
      <rect x="${bx}" y="${roofY}" width="${bw}" height="${floorY - roofY}" fill="url(#bldgFace)" stroke="#34465c" stroke-width="1.6"/>
      <rect x="${bx + 18}" y="290" width="${bw - 36}" height="272" fill="url(#hall)"/>
      <!-- structural roof beams on the top face (engineering detail) -->
      ${[0.25, 0.5, 0.75].map((t) => `<line x1="${bx + bw * t}" y1="${roofY}" x2="${bx + bw * t + D}" y2="${roofY - D}" stroke="#34465c" stroke-width="0.8" opacity="0.7"/>`).join("")}
      <ellipse cx="${bx + bw / 2}" cy="500" rx="${bw / 2 - 30}" ry="70" fill="url(#serverGlow)"/>
      <!-- building dimension lines -->
      ${dim(bx, floorY + 22, brx, floorY + 22, "≈ 120 m hall")}
      ${dim(bx - 18, roofY, bx - 18, floorY, "≈ 14 m")}

      <!-- cooling towers + risers -->
      ${towers}
      ${risers}

      <!-- overhead cable tray / busway (isometric channel) + spine switches -->
      ${(() => {
        const tx = bx + 30, tw = bw - 60, ty = 304, td = 9;
        // tray as a shallow iso channel: bottom + back-right lip + ladder rungs
        let rungs = "";
        for (let i = 0; i <= tw; i += 16) rungs += `<line x1="${tx + i}" y1="${ty}" x2="${tx + i + td}" y2="${ty - td}" stroke="#46566c" stroke-width="0.9" opacity="0.8"/>`;
        return `<polygon points="${tx},${ty} ${tx + tw},${ty} ${tx + tw + td},${ty - td} ${tx + td},${ty - td}" fill="#1a2230" stroke="#3a4658" stroke-width="1"/>` +
          `<polygon points="${tx + tw},${ty} ${tx + tw + td},${ty - td} ${tx + tw + td},${ty - td + 8} ${tx + tw},${ty + 8}" fill="#10161f" stroke="#2a3646" stroke-width="0.8"/>` +
          `<rect x="${tx}" y="${ty}" width="${tw}" height="8" fill="#141b27"/>${rungs}`;
      })()}
      ${[0, 1, 2].map((i) => {
        const sx = bx + 90 + i * 170, sb = isoBox(sx, 322, 58, 16, 18, PAL.blue);
        return `<g filter="url(#dropShadow)">${sb.left}${sb.right}${sb.top}` +
          `<circle cx="${sx + 12}" cy="316" r="2" fill="#a78bfa"/><circle cx="${sx + 22}" cy="316" r="2" fill="#4da3ff"/></g>`;
      }).join("")}
      ${fiberDrops}

      <!-- hot-aisle containment canopy -->
      <rect x="${bx + 28}" y="${rackY - 26}" width="${bw - 56}" height="20" rx="3" fill="#1a2433" stroke="#33445c" opacity="0.85"/>
      <rect x="${bx + 28}" y="${rackY - 26}" width="${bw - 56}" height="20" fill="#4da3ff" opacity="0.05"/>

      <!-- server racks (with an LED glow behind the row) -->
      <rect x="${bx + 28}" y="${rackY}" width="${bw - 56}" height="${rackH}" rx="8" fill="url(#ambGreen)" filter="url(#softGlow)" opacity="0.55"/>
      ${rackRow}

      <!-- raised floor -->
      <rect x="${bx}" y="543" width="${bw}" height="22" fill="#0a0f18"/>
      ${tiles}
      <rect x="${bx}" y="${floorY}" width="${bw + D}" height="6" fill="#070b12"/>

      <!-- ===== SOFTWARE: NOC console + cloud ===== -->
      <g filter="url(#dropShadow)">
        <rect x="408" y="96" width="92" height="40" rx="4" fill="#101a2c" stroke="#2f4566"/>
        <rect x="416" y="103" width="34" height="20" rx="1" fill="#0c2233" stroke="#2f4566"/><rect x="458" y="103" width="34" height="20" rx="1" fill="#0c2233" stroke="#2f4566"/>
        <line x1="454" y1="136" x2="454" y2="150" stroke="#2f4566" stroke-width="3"/><line x1="438" y1="150" x2="470" y2="150" stroke="#2f4566" stroke-width="3"/>
      </g>
      <g fill="#16273f" filter="url(#softGlow)">
        <circle cx="452" cy="92" r="26"/><circle cx="492" cy="76" r="34"/><circle cx="540" cy="82" r="28"/><circle cx="578" cy="96" r="24"/>
        <rect x="448" y="88" width="138" height="28" rx="14"/>
      </g>
      <g fill="#16273f">
        <circle cx="452" cy="92" r="26"/><circle cx="492" cy="76" r="34"/><circle cx="540" cy="82" r="28"/><circle cx="578" cy="96" r="24"/>
        <rect x="448" y="88" width="138" height="28" rx="14"/>
      </g>
      <text x="515" y="96" text-anchor="middle" style="font:700 12px system-ui;fill:#9fc4ff">CUDA · orchestration</text>
      <line x1="515" y1="118" x2="515" y2="158" stroke="#4da3ff" stroke-width="1.4" stroke-dasharray="3 3" opacity="0.55"/>

      <!-- cinematic vignette (non-interactive, sits above the art) -->
      <rect x="0" y="0" width="1100" height="680" fill="url(#vignette)" pointer-events="none"/>

      <!-- ===== interactive zones ===== -->
      ${zoneG("power",      { x: 40,  y: 430, w: 320, h: 170, bx: 60,  by: 448 })}
      ${zoneG("cooling",    { x: 686, y: 150, w: 300, h: 96,  bx: 703, by: 166 })}
      ${zoneG("networking", { x: 404, y: 292, w: 552, h: 40,  bx: 420, by: 311 })}
      ${zoneG("compute",    { x: 404, y: 360, w: 552, h: 205, bx: 420, by: 378 })}
      ${zoneG("software",   { x: 420, y: 56,  w: 184, h: 86,  rx: 40, bx: 438, by: 80 })}
      <g class="zone shell" data-layer="land" style="--zc:${LAYER_META.land.color}" tabindex="0" role="button" aria-label="Layer 1: Land & Shell">
        <rect class="zone-outline" x="${bx}" y="${roofY}" width="${bw}" height="${floorY - roofY}" rx="4"/>
        ${badge(bx + 20, roofY + 20, 1, LAYER_META.land.color)}
        <rect x="${bx}" y="${roofY}" width="${bw}" height="${floorY - roofY}" rx="4" fill="none" stroke="transparent" stroke-width="20" pointer-events="stroke"/>
      </g>
    </svg>`;
  }

  // ---- panel + interaction ----------------------------------------------
  function renderPanel(id) {
    const m = LAYER_META[id], layer = layerById(id);
    const holds = ((layer && layer.holdings) || [])
      .filter((h) => h.market && h.market.market_cap != null)
      .sort((a, b) => b.market.market_cap - a.market.market_cap).slice(0, 5);
    const total = (layer && layer.holdings.length) || 0;
    const tk = holds.map((h) => {
      const sc = h.score == null ? "" :
        `<span class="tk-score" style="background:${h.score >= 66 ? "#34d399" : h.score >= 40 ? "#fbbf24" : "#f87171"}" title="composite score">${h.score}</span>`;
      return `<div class="tk"><span class="tk-exp" style="background:${EXP_COLOR[h.exposure] || "#8a99ad"}" title="${h.exposure} exposure"></span>` +
        `<span class="tk-t">${h.ticker}</span><span class="tk-n">${h.name}</span>` +
        `${sc}<span class="tk-p">${fmtP(h.market.price)}</span></div>`;
    }).join("");
    $("dcPanel").innerHTML = `
      <h3><span class="dot" style="background:${m.color}"></span>${m.label}</h3>
      <div class="muted" style="font-size:11.5px">Layer ${m.num} · ${total} names</div>
      <div class="layer-blurb">${layer ? layer.blurb : ""}</div>
      <div class="bottleneck"><b>Bottleneck:</b> ${m.bottleneck}</div>
      <div class="tk-list">${tk || '<span class="muted">No data.</span>'}</div>
      <button class="view-stocks" data-go="${id}">View these stocks →</button>
      ${total > 5 ? `<div class="more">+ ${total - 5} more in the screener</div>` : ""}`;
    $("dcPanel").querySelector(".view-stocks").addEventListener("click", () => window.focusScreenerLayer && window.focusScreenerLayer(id));
  }

  function renderDefaultPanel() {
    $("dcPanel").innerHTML = `
      <div class="ph">
        <p><b style="color:var(--text)">The AI factory.</b> Six layers turn electricity and data into intelligence.</p>
        <p style="margin-top:12px">Hover any zone in the cutaway to preview that layer; click to pin its details and jump to its stocks.</p>
        <p style="margin-top:12px">Power enters at the substation (left), GPUs fill the halls under hot-aisle containment, cooling towers crown the roof, fiber stitches the racks together, and the cloud on top is the software + the hyperscalers paying for it all.</p>
      </div>`;
  }

  const zoneEls = () => $("dcSvgWrap").querySelectorAll(".zone");
  const mark = (id, cls) => zoneEls().forEach((z) => z.classList.toggle(cls, z.dataset.layer === id));
  const unmark = (cls) => zoneEls().forEach((z) => z.classList.remove(cls));

  function setHover(id) { unmark("hover"); mark(id, "hover"); renderPanel(id); syncLegend(id); lastShown = id; }
  function clearHover() {
    unmark("hover");
    // keep showing the last-hovered (or pinned) layer instead of snapping back
    // to the default panel — that snap-back is what made the screen jump.
    const id = selected || lastShown;
    if (id) { renderPanel(id); syncLegend(id); }
  }
  function setSelected(id) { selected = id; lastShown = id; unmark("selected"); mark(id, "selected"); renderPanel(id); syncLegend(id); }

  function buildLegend() {
    $("dcLegend").innerHTML = ORDER.map((id) => {
      const m = LAYER_META[id];
      return `<span class="lg" data-layer="${id}" style="--zc:${m.color}"><span class="sw"></span>${m.num}. ${m.label}</span>`;
    }).join("");
    $("dcLegend").querySelectorAll(".lg").forEach((c) => {
      const id = c.dataset.layer;
      c.addEventListener("mouseenter", () => setHover(id));
      c.addEventListener("mouseleave", clearHover);
      c.addEventListener("click", () => setSelected(id));
    });
  }
  function syncLegend(id) {
    $("dcLegend").querySelectorAll(".lg").forEach((c) => c.classList.toggle("active", c.dataset.layer === id));
  }

  function wireZones() {
    zoneEls().forEach((z) => {
      const id = z.dataset.layer;
      z.addEventListener("mouseenter", () => setHover(id));
      z.addEventListener("mouseleave", clearHover);
      z.addEventListener("click", () => setSelected(id));
      z.addEventListener("focus", () => setHover(id));
      z.addEventListener("blur", clearHover);
      z.addEventListener("keydown", (e) => { if (e.key === "Enter" || e.key === " ") { e.preventDefault(); setSelected(id); } });
    });
  }

  function render() {
    const wrap = $("dcSvgWrap");
    if (!wrap) return;
    if (!window.STATE || !(window.STATE.layers && window.STATE.layers.length)) {
      wrap.innerHTML = '<div class="loading" style="padding:60px">Loading live data…</div>';
      return;
    }
    wrap.innerHTML = svgMarkup();
    buildLegend();
    wireZones();
    if (selected) setSelected(selected); else renderDefaultPanel();
  }

  window.DataCenter = { render };
})();
