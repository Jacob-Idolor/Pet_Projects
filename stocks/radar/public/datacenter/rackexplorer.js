// Rack Explorer — semantic zoom through the real build hierarchy of an AI rack,
// from a data-hall row down to the GPU package and HBM stack. Each level is drawn
// to scale (relative proportions), names the manufacturing/assembly step, and
// lists the suppliers that matter — clicking a ticker jumps to the screener.
//
// Modeled on NVIDIA's GB200 NVL72: 72 Blackwell GPUs + 36 Grace CPUs per rack,
// 18 compute trays + 9 NVLink switch trays, liquid-cooled, ~120 kW, ~1.36 t.
(function () {
  const $ = (id) => document.getElementById(id);

  // ---- tiny SVG helpers --------------------------------------------------
  // callout: dot at (x,y) with a leader line to a label at (lx,ly)
  function call(x, y, lx, ly, text, color, anchor) {
    color = color || "#7c8aa0";
    return `<line x1="${x}" y1="${y}" x2="${lx}" y2="${ly}" stroke="${color}" stroke-width="1" opacity="0.8"/>` +
      `<circle cx="${x}" cy="${y}" r="2.4" fill="${color}"/>` +
      `<text x="${lx + (anchor === "end" ? -5 : 5)}" y="${ly + 3.5}" text-anchor="${anchor || "start"}" class="rx-call">${text}</text>`;
  }
  function human(x, footY, h) {
    const hd = h * 0.12, bodyTop = footY - h, hipY = footY - h * 0.46;
    return `<g fill="#334155" opacity="0.9"><circle cx="${x}" cy="${bodyTop + hd}" r="${hd}"/>` +
      `<rect x="${x - h * 0.06}" y="${bodyTop + hd * 1.8}" width="${h * 0.12}" height="${h * 0.34}" rx="${h * 0.05}"/>` +
      `<rect x="${x - h * 0.05}" y="${hipY}" width="${h * 0.045}" height="${h * 0.46}"/>` +
      `<rect x="${x + h * 0.005}" y="${hipY}" width="${h * 0.045}" height="${h * 0.46}"/></g>`;
  }

  // ---- isometric CAD toolkit --------------------------------------------
  // 2:1 dimetric projection, single upper-left light source. iso() maps a 3D
  // point (px,py on the ground plane, pz height) to screen, anchored at (ox,oy).
  const ISO = 0.5;
  const iso = (ox, oy, px, py, pz) => [
    +(ox + (px - py)).toFixed(2),
    +(oy + (px + py) * ISO - pz).toFixed(2),
  ];
  // isoBox: extruded solid; returns shaded top/left/right faces + key verts.
  function isoBox(ox, oy, w, d, h, c) {
    const P = (px, py, pz) => iso(ox, oy, px, py, pz);
    const b000 = P(0, 0, 0), b100 = P(w, 0, 0), b110 = P(w, d, 0), b010 = P(0, d, 0);
    const t000 = P(0, 0, h), t100 = P(w, 0, h), t110 = P(w, d, h), t010 = P(0, d, h);
    const fc = (pts, fill) => `<polygon points="${pts.map((p) => p.join(",")).join(" ")}" fill="${fill}" stroke="${c.edge}" stroke-width="1" stroke-linejoin="round"/>`;
    const left  = fc([b000, b100, t100, t000], c.left);
    const right = fc([b100, b110, t110, t100], c.right);
    const top   = fc([t000, t100, t110, t010], c.top);
    return { left, right, top, html: left + right + top, t000, t100, t110, t010, b000, b100, b110, b010 };
  }
  const RPAL = {
    pcb:    { top: "#1d573c", left: "#143d2a", right: "#0d2c1d", edge: "#08160e" },
    gpu:    { top: "#3fae7e", left: "#2c7d5a", right: "#1d543c", edge: "#0c2418" },
    cpu:    { top: "#caa84a", left: "#967b30", right: "#63521f", edge: "#241c08" },
    hbm:    { top: "#4d86c4", left: "#356095", right: "#234468", edge: "#0c1d30" },
    inter:  { top: "#5a86b8", left: "#3f6189", right: "#2a4360", edge: "#0e1f30" },
    sub:    { top: "#b08a3a", left: "#84662a", right: "#5a451c", edge: "#221a08" },
    steel:  { top: "#5a6f88", left: "#414f63", right: "#2c3645", edge: "#10161d" },
    cool:   { top: "#8fa3b8", left: "#6a7d92", right: "#48586a", edge: "#1a232c" },
    rack:   { top: "#37485e", left: "#283546", right: "#1a2532", edge: "#0a121b" },
    nvlink: { top: "#5a4a92", left: "#3f3468", right: "#281f44", edge: "#0e0a1c" },
  };
  // dimension line with double arrowheads + measurement label
  function dimLine(x1, y1, x2, y2, label, anchor) {
    const mx = (x1 + x2) / 2, my = (y1 + y2) / 2;
    return `<g class="rx-dim"><line x1="${x1}" y1="${y1}" x2="${x2}" y2="${y2}" marker-start="url(#rxDimA)" marker-end="url(#rxDimA)"/>` +
      `<rect x="${(mx - label.length * 3 - 4).toFixed(1)}" y="${(my - 8).toFixed(1)}" width="${label.length * 6 + 8}" height="13" rx="2" fill="#0a0e16" opacity="0.85"/>` +
      `<text x="${mx.toFixed(1)}" y="${(my + 2).toFixed(1)}" text-anchor="${anchor || "middle"}" class="rx-dim-t">${label}</text></g>`;
  }

  // ---- level drawings (shared viewBox 0 0 1000 600) ----------------------
  // Every scene is an isometric CAD model: extruded solids with shaded faces,
  // crisp edge lines, dimension lines and leader callouts.

  function drawRow() {
    // 6 GB200 cabinets in an isometric lineup sharing a contained hot aisle.
    const rw = 38, rd = 70, rh = 150, gap = 10, ox0 = 250, oy0 = 360;
    let racks = "";
    for (let i = 0; i < 6; i++) {
      const ox = ox0 + i * (rw + gap), oy = oy0;     // ground origin per cabinet
      const box = isoBox(ox, oy, rw, rd, rh, RPAL.rack);
      racks += `<g>${box.html}`;
      // tray bands painted on the front (left) face
      for (let u = 0; u < 11; u++) {
        const z0 = rh - 8 - u * 12, z1 = z0 - 9, sw = u >= 4 && u < 7;
        const a = iso(ox, oy, 3, 0, z0), b = iso(ox, oy, rw - 3, 0, z0),
              c = iso(ox, oy, rw - 3, 0, z1), e = iso(ox, oy, 3, 0, z1);
        racks += `<polygon points="${a.join(",")} ${b.join(",")} ${c.join(",")} ${e.join(",")}" fill="${sw ? "#241b38" : "#13241c"}" stroke="#0a120d" stroke-width="0.5"/>`;
        const led = iso(ox, oy, 6, 0, (z0 + z1) / 2);
        racks += `<circle cx="${led[0]}" cy="${led[1]}" r="1.3" fill="${sw ? "#a78bfa" : "#3ddc97"}"/>`;
      }
      racks += `</g>`;
    }
    // contained hot-aisle canopy spanning the top of the row
    const c1 = iso(ox0, oy0, 0, 0, rh + 10), c2 = iso(ox0 + 5 * (rw + gap) + rw, oy0, 0, 0, rh + 10);
    const c3 = iso(ox0 + 5 * (rw + gap) + rw, oy0, 0, rd, rh + 10), c4 = iso(ox0, oy0, 0, rd, rh + 10);
    const canopy = `<polygon points="${c1.join(",")} ${c2.join(",")} ${c3.join(",")} ${c4.join(",")}" fill="#4da3ff" opacity="0.07" stroke="#33445c" stroke-width="0.8"/>`;
    return `<g>
      <rect x="34" y="28" width="500" height="58" rx="9" fill="#0a1019" opacity="0.85" stroke="#1b3a55"/>
      <text x="56" y="55" style="font:700 17px system-ui;fill:#eaf0f7">Liquid-cooled GB200 NVL72 row</text>
      <text x="56" y="75" class="rx-call" style="fill:#c4d2e4">contained hot aisle · each rack ≈ 600 mm wide · 2.24 m tall · ~120 kW</text>
      ${canopy}${racks}
      ${human(120, 540, 150)}
      ${dimLine(170, 410, 170, 535, "≈ 2.24 m")}
      ${call(ox0 + 70, oy0 - rh - 6, ox0 + 70, 150, "Contained hot aisle", "#4da3ff")}
      ${dimLine(250, 562, 250 + 6 * (rw + gap) - gap, 562, "row of 6 cabinets")}
    </g>`;
  }

  function drawRack() {
    // Single GB200 NVL72 cabinet as a tall isometric 42U solid + U-ruler.
    const ox = 440, oy = 540, w = 150, d = 140, h = 440, slots = 27;
    const sh = (h - 24) / slots;
    const box = isoBox(ox, oy, w, d, h, RPAL.rack);
    let rows = "";
    for (let u = 0; u < slots; u++) {
      const z0 = h - 12 - u * sh, z1 = z0 - (sh - 2.5), sw = u >= 12 && u < 21;
      const a = iso(ox, oy, 8, 0, z0), b = iso(ox, oy, w - 8, 0, z0),
            c = iso(ox, oy, w - 8, 0, z1), e = iso(ox, oy, 8, 0, z1);
      rows += `<polygon points="${a.join(",")} ${b.join(",")} ${c.join(",")} ${e.join(",")}" fill="${sw ? "#2c2348" : "#1a3329"}" stroke="${sw ? "#6a58a8" : "#2c5340"}" stroke-width="0.6"/>`;
      for (let k = 0; k < 7; k++) { const led = iso(ox, oy, 18 + k * 13, 0, (z0 + z1) / 2); rows += `<circle cx="${led[0]}" cy="${led[1]}" r="1.3" fill="${sw ? "#a78bfa" : "#3ddc97"}" opacity="${0.5 + (k % 2) * 0.4}"/>`; }
    }
    // power shelves (top & bottom of the front face)
    const shelf = (z) => { const a = iso(ox, oy, 8, 0, z), b = iso(ox, oy, w - 8, 0, z), c = iso(ox, oy, w - 8, 0, z - 9), e = iso(ox, oy, 8, 0, z - 9); return `<polygon points="${a.join(",")} ${b.join(",")} ${c.join(",")} ${e.join(",")}" fill="#3a2f12" stroke="#fbbf24" stroke-width="0.7"/>`; };
    // U-ruler up the visible front-left edge
    let ruler = "";
    for (let u = 0; u <= 42; u += 6) { const p = iso(ox, oy, 0, 0, 12 + (u / 42) * (h - 24)); ruler += `<text x="${(p[0] - 10).toFixed(1)}" y="${(p[1] + 3).toFixed(1)}" text-anchor="end" class="rx-call" style="fill:#5b6b82">${u}U</text>`; }
    // liquid manifold risers up the right (+x) face
    const mtop = iso(ox, oy, w, d * 0.5, h - 6), mbot = iso(ox, oy, w, d * 0.5, 8);
    const mtop2 = iso(ox, oy, w, d * 0.5 + 10, h - 6), mbot2 = iso(ox, oy, w, d * 0.5 + 10, 8);
    const manifold = `<line x1="${mbot[0]}" y1="${mbot[1]}" x2="${mtop[0]}" y2="${mtop[1]}" stroke="#3b82f6" stroke-width="5"/>` +
      `<line x1="${mbot2[0]}" y1="${mbot2[1]}" x2="${mtop2[0]}" y2="${mtop2[1]}" stroke="#ef4444" stroke-width="5"/>`;
    const cTray = iso(ox, oy, w - 20, 0, h - 12 - 4 * sh);
    const cSw = iso(ox, oy, w - 20, 0, h - 12 - 16 * sh);
    return `<g>
      ${box.html}${rows}${shelf(h - 12)}${shelf(20)}${manifold}${ruler}
      ${call(cTray[0], cTray[1], ox + 200, 150, "Compute tray ×18", "#34d399")}
      ${call(cSw[0], cSw[1], ox + 200, 250, "NVLink switch ×9", "#a78bfa")}
      ${call(mtop[0], mtop[1] + 30, ox + 200, 350, "Liquid manifold (supply/return)", "#3b82f6")}
      ${call(box.t000[0], box.t000[1], ox - 110, 120, "Power shelves", "#fbbf24", "end")}
      ${dimLine(iso(ox, oy, 0, 0, 0)[0], 560, iso(ox, oy, w, 0, 0)[0], 560, "≈ 0.6 m wide")}
      <text x="200" y="585" class="rx-call">42U · 600 × 1200 × 2236 mm · ~1.36 t · ~120 kW</text>
    </g>`;
  }

  function drawTray() {
    // 1U compute tray as a shallow isometric solid: PCB base + 2 Grace CPU +
    // 4 Blackwell GPU under cold plates, DIMM banks, coolant fittings.
    // Footprint kept shallow so the iso projection fits the 1000×600 viewBox.
    const ox = 330, oy = 250, w = 380, d = 150, h = 14;
    const base = isoBox(ox, oy, w, d, h, RPAL.pcb);
    // place a component sitting ON the tray top using tray-local coords
    // (px along w, py along d), returning shaded faces + key points.
    const place = (px, py, cw, cd, ch, pal) => {
      const P = (qx, qy, qz) => iso(ox, oy, px + qx, py + qy, h + qz);
      const v = {
        b000: P(0,0,0), b100: P(cw,0,0), b110: P(cw,cd,0), b010: P(0,cd,0),
        t000: P(0,0,ch), t100: P(cw,0,ch), t110: P(cw,cd,ch), t010: P(0,cd,ch),
      };
      const fc = (pts, fill) => `<polygon points="${pts.map((p) => p.join(",")).join(" ")}" fill="${fill}" stroke="${pal.edge}" stroke-width="0.8" stroke-linejoin="round"/>`;
      return { html: fc([v.b000,v.b100,v.t100,v.t000], pal.left) + fc([v.b100,v.b110,v.t110,v.t100], pal.right) + fc([v.t000,v.t100,v.t110,v.t010], pal.top), top: v.t000, topc: P(cw/2, cd/2, ch) };
    };
    // 4 GPUs under brushed cold plates + 2 Grace CPUs (2 boards). Drawn back-to-
    // front (ascending px+py) so nearer parts overlap farther ones correctly.
    const layout = [
      { px: 40,  py: 30, pal: RPAL.gpu },  { px: 40,  py: 86, pal: RPAL.gpu },
      { px: 150, py: 58, pal: RPAL.cpu },                                   // Grace
      { px: 235, py: 30, pal: RPAL.gpu },  { px: 235, py: 86, pal: RPAL.gpu },
      { px: 310, py: 58, pal: RPAL.cpu },                                   // Grace
    ].sort((a, b) => (a.px + a.py) - (b.px + b.py));
    let parts = "";
    layout.forEach((c) => {
      const isCPU = c.pal === RPAL.cpu;
      const cw = isCPU ? 52 : 50, cd = isCPU ? 52 : 50, ch = isCPU ? 16 : 13;
      parts += place(c.px, c.py, cw, cd, ch, c.pal).html;
      if (!isCPU) { // brushed cold plate cap with fin lines on its top
        parts += place(c.px + 5, c.py + 5, cw - 10, cd - 10, ch + 8, RPAL.cool).html;
        for (let f = 0; f < 4; f++) { const a = iso(ox, oy, c.px + 10, c.py + 9 + f * 9, h + ch + 8), b = iso(ox, oy, c.px + cw - 10, c.py + 9 + f * 9, h + ch + 8); parts += `<line x1="${a[0]}" y1="${a[1]}" x2="${b[0]}" y2="${b[1]}" stroke="#2e3845" stroke-width="1"/>`; }
      }
    });
    // DIMM banks (thin tall slabs) along the back edge
    let dimms = "";
    for (let i = 0; i < 9; i++) dimms += place(40 + i * 36, 4, 7, 24, 22, RPAL.hbm).html;
    // quick-disconnect coolant fittings on the front edge
    let fittings = "";
    [[150, "#3b82f6"], [185, "#ef4444"]].forEach(([px, col]) => { const c = iso(ox, oy, px, d - 3, h + 6); fittings += `<circle cx="${c[0]}" cy="${c[1]}" r="7" fill="#0c1320" stroke="${col}" stroke-width="2.5"/>`; });
    const gpuTop = iso(ox, oy, 40 + 25, 30 + 25, h + 26);
    const cpuTop = iso(ox, oy, 150 + 26, 58 + 26, h + 30);
    const capR = iso(ox, oy, 235 + 25, 86 + 25, h + 24);
    const dimmTop = iso(ox, oy, 90, 16, h + 22);
    const fitPt = iso(ox, oy, 168, d - 3, h + 6);
    return `<g>
      ${base.html}${dimms}${parts}${fittings}
      ${call(capR[0], capR[1], ox + w - 30, 130, "Cold plate (liquid)", "#9fb6c9")}
      ${call(cpuTop[0], cpuTop[1], ox + w / 2 + 80, 90, "Grace CPU ×2", "#caa84a")}
      ${call(gpuTop[0], gpuTop[1], ox - 40, 130, "Blackwell GPU ×4", "#3ddc97", "end")}
      ${call(dimmTop[0], dimmTop[1], ox + 40, 90, "DDR5 / LPDDR5X", "#5d77a8")}
      ${call(fitPt[0], fitPt[1], ox + w - 40, 520, "Quick-disconnect coolant fittings", "#3b82f6")}
      ${dimLine(250, 560, 720, 560, "≈ 0.44 m (1U) tall · 1.2 m deep")}
    </g>`;
  }

  function drawBoard() {
    // Bianca superchip board as an isometric assembly: PCB + 1 Grace CPU
    // (center) + 2 Blackwell CoWoS packages, dense NVLink-C2C traces, VRMs.
    const ox = 290, oy = 210, w = 480, d = 210, h = 16;
    const base = isoBox(ox, oy, w, d, h, RPAL.pcb);
    const place = (px, py, cw, cd, ch, pal) => {
      const P = (qx, qy, qz) => iso(ox, oy, px + qx, py + qy, h + qz);
      const v = { b000:P(0,0,0), b100:P(cw,0,0), b110:P(cw,cd,0), t000:P(0,0,ch), t100:P(cw,0,ch), t110:P(cw,cd,ch), t010:P(0,cd,ch) };
      const fc = (pts, fill) => `<polygon points="${pts.map((p) => p.join(",")).join(" ")}" fill="${fill}" stroke="${pal.edge}" stroke-width="0.9" stroke-linejoin="round"/>`;
      return { html: fc([v.b000,v.b100,v.t100,v.t000], pal.left) + fc([v.b100,v.b110,v.t110,v.t100], pal.right) + fc([v.t000,v.t100,v.t110,v.t010], pal.top), topc: P(cw/2, cd/2, ch) };
    };
    // VRMs first (farthest back), then traces on the PCB, then the chips.
    let vrm = "";
    for (let i = 0; i < 9; i++) vrm += place(60 + i * 15, 12, 10, 22, 16, RPAL.steel).html;
    for (let i = 0; i < 9; i++) vrm += place(335 + i * 15, 12, 10, 22, 16, RPAL.steel).html;
    // NVLink-C2C dense traces (on the PCB top between dies)
    const traces = (x1, x2, y0) => [...Array(8)].map((_, i) => { const a = iso(ox, oy, x1, y0 + i * 10, h + 1), b = iso(ox, oy, x2, y0 + i * 10, h + 1); return `<line x1="${a[0]}" y1="${a[1]}" x2="${b[0]}" y2="${b[1]}" stroke="#4da3ff" stroke-width="1.2" opacity="0.75"/>`; }).join("");
    const pkgL  = place(45, 55, 115, 115, 22, RPAL.gpu);
    const grace = place(195, 65, 90, 90, 26, RPAL.cpu);
    const pkgR  = place(320, 55, 115, 115, 22, RPAL.gpu);
    const tracePt = iso(ox, oy, 175, 95, h + 2);
    const vrmPt = iso(ox, oy, 100, 22, h + 16);
    return `<g>
      ${base.html}${vrm}
      ${traces(160, 195, 70)}${traces(285, 320, 70)}
      ${pkgL.html}${grace.html}${pkgR.html}
      <text x="${grace.topc[0]}" y="${grace.topc[1]}" text-anchor="middle" class="rx-call" style="fill:#e0c875">Grace CPU</text>
      <text x="${pkgL.topc[0]}" y="${pkgL.topc[1]}" text-anchor="middle" class="rx-call" style="fill:#7fe0ad">Blackwell GPU</text>
      ${call(tracePt[0], tracePt[1], ox + 60, 110, "NVLink-C2C · 900 GB/s", "#4da3ff")}
      ${call(vrmPt[0], vrmPt[1], ox - 40, 110, "Voltage regulators (VRM)", "#6b7686", "end")}
      ${dimLine(250, 558, 720, 558, "board ≈ 0.7 m wide")}
    </g>`;
  }

  function drawPackage() {
    // CoWoS-L package as an EXPLODED isometric assembly: organic substrate →
    // silicon interposer → 2 GPU dies + 8 HBM stacks, each layer lifted apart.
    const ox = 380, oy = 270, w = 260, d = 170;
    // a flat slab at a given exploded "lift" height (z), local size cw×cd
    const slab = (px, py, z, cw, cd, ch, pal) => {
      const P = (qx, qy, qz) => iso(ox, oy, px + qx, py + qy, z + qz);
      const v = { b000:P(0,0,0), b100:P(cw,0,0), b110:P(cw,cd,0), t000:P(0,0,ch), t100:P(cw,0,ch), t110:P(cw,cd,ch), t010:P(0,cd,ch) };
      const fc = (pts, fill) => `<polygon points="${pts.map((p) => p.join(",")).join(" ")}" fill="${fill}" stroke="${pal.edge}" stroke-width="0.9" stroke-linejoin="round"/>`;
      return { html: fc([v.b000,v.b100,v.t100,v.t000], pal.left) + fc([v.b100,v.b110,v.t110,v.t100], pal.right) + fc([v.t000,v.t100,v.t110,v.t010], pal.top), topc: P(cw/2, cd/2, ch), tl: v.t000, tr: v.t110 };
    };
    // exploded stack, bottom→top (each layer lifted further in z)
    const sub   = slab(-24, -24, 0,   w + 48, d + 48, 16, RPAL.sub);    // organic substrate
    const inter = slab(0,   0,   62,  w, d, 12, RPAL.inter);            // silicon interposer
    // 2 GPU dies sit on the interposer (lifted to 140)
    const dieL = slab(55,  45, 140, 70, 90, 20, RPAL.gpu);
    const dieR = slab(140, 45, 140, 70, 90, 20, RPAL.gpu);
    // 8 HBM stacks flanking the dies (same lift)
    let hbm = "";
    const hbmPos = [[8,20],[8,70],[8,120],[100,140],[155,140],[225,20],[225,70],[225,120]];
    hbmPos.forEach(([px, py]) => { hbm += slab(px, py, 140, 28, 32, 26, RPAL.hbm).html; });
    const hbmCue = slab(8, 20, 140, 28, 32, 26, RPAL.hbm);
    // dashed assembly guide lines connecting the exploded layers
    const guide = (a, b) => `<line x1="${a[0]}" y1="${a[1]}" x2="${b[0]}" y2="${b[1]}" stroke="#5b6b82" stroke-width="0.8" stroke-dasharray="3 3" opacity="0.7"/>`;
    const guides = guide(sub.tl, inter.tl) + guide(sub.tr, inter.tr) + guide(inter.tl, dieL.tl) + guide(inter.tr, dieR.tr);
    return `<g>
      ${sub.html}${guides}${inter.html}${hbm}${dieL.html}${dieR.html}
      ${call(dieR.topc[0], dieR.topc[1] - 12, ox + 200, 100, "2 reticle-sized GPU dies — 208B transistors", "#3ddc97")}
      ${call(hbmCue.topc[0], hbmCue.topc[1], ox - 200, 180, "HBM3e ×8 = 192 GB", "#5d8fd0", "end")}
      ${call(inter.topc[0], inter.topc[1], ox + 220, 360, "Silicon interposer — TSMC CoWoS-L", "#4a6a9c")}
      ${call(sub.topc[0], sub.topc[1], ox + 220, 470, "Organic substrate", "#caa84a")}
      ${dimLine(320, 575, 640, 575, "package ≈ 80 mm")}
      <text x="60" y="56" class="rx-call" style="fill:#9fb1c6">EXPLODED ASSEMBLY — CoWoS-L stack-up</text>
    </g>`;
  }

  function drawHBM() {
    // HBM3e stack as an EXPLODED isometric column: base logic die + stacked
    // DRAM dies pulled apart, vertical TSV columns, on the interposer slab.
    const ox = 320, oy = 300, layerH = 13, gapZ = 14, cw = 140, cd = 92;
    const slab = (px, py, z, sw, sd, sh, pal) => {
      const P = (qx, qy, qz) => iso(ox, oy, px + qx, py + qy, z + qz);
      const v = { b000:P(0,0,0), b100:P(sw,0,0), b110:P(sw,sd,0), t000:P(0,0,sh), t100:P(sw,0,sh), t110:P(sw,sd,sh), t010:P(0,sd,sh) };
      const fc = (pts, fill) => `<polygon points="${pts.map((p) => p.join(",")).join(" ")}" fill="${fill}" stroke="${pal.edge}" stroke-width="0.9" stroke-linejoin="round"/>`;
      return { html: fc([v.b000,v.b100,v.t100,v.t000], pal.left) + fc([v.b100,v.b110,v.t110,v.t100], pal.right) + fc([v.t000,v.t100,v.t110,v.t010], pal.top), topc: P(sw/2, sd/2, sh), tl: v.t000, tr: v.t110, br: v.b110 };
    };
    // interposer + substrate base (wide enough to carry stack + GPU die)
    const sub   = slab(-30, -24, 0,  cw + 210, cd + 48, 16, RPAL.sub);
    const inter = slab(-30, -24, 16, cw + 210, cd + 48, 11, RPAL.inter);
    // base logic die then 8 DRAM dies, each lifted with a gap (exploded)
    let stack = "", guides = "";
    const baseZ = 40;
    const logic = slab(0, 0, baseZ, cw, cd, layerH, { top:"#2e4a66", left:"#22384e", right:"#172838", edge:"#0a1420" });
    stack += logic.html;
    let prev = logic;
    for (let dD = 0; dD < 8; dD++) {
      const z = baseZ + layerH + (dD + 1) * (layerH + gapZ);
      const dram = slab(0, 0, z, cw, cd, layerH, RPAL.hbm);
      stack += dram.html;
      guides += `<line x1="${prev.tr[0]}" y1="${prev.tr[1]}" x2="${dram.br[0]}" y2="${dram.br[1]}" stroke="#5b6b82" stroke-width="0.7" stroke-dasharray="2 3" opacity="0.6"/>`;
      prev = dram;
    }
    // TSV columns running up through the whole stack (front face)
    const topZ = baseZ + layerH + 8 * (layerH + gapZ) + layerH;
    let tsv = "";
    for (let t = 0; t < 6; t++) { const a = iso(ox, oy, 18 + t * 22, 4, baseZ), b = iso(ox, oy, 18 + t * 22, 4, topZ); tsv += `<line x1="${a[0]}" y1="${a[1]}" x2="${b[0]}" y2="${b[1]}" stroke="#7fd0ff" stroke-width="1.4" opacity="0.85"/>`; }
    // GPU compute die slab beside the HBM, on the interposer
    const gpu = slab(cw + 50, 8, 38, 110, cd - 8, 24, RPAL.gpu);
    const stackCx = iso(ox, oy, cw / 2, cd / 2, baseZ + 80)[0];
    return `<g>
      <ellipse cx="${stackCx}" cy="320" rx="180" ry="220" fill="#2b6fb0" opacity="0.16" filter="url(#rxBlur)"/>
      ${sub.html}${inter.html}${stack}${tsv}${gpu.html}
      <text x="${gpu.topc[0]}" y="${gpu.topc[1]}" text-anchor="middle" class="rx-call" style="fill:#7fe0ad">GPU die</text>
      <text x="${logic.topc[0]}" y="${logic.topc[1]}" text-anchor="middle" class="rx-call">base logic die</text>
      ${call(prev.topc[0], prev.topc[1] - 6, ox - 120, 150, "8–12 stacked DRAM dies — 192 GB", "#5d8fd0", "end")}
      ${call(iso(ox, oy, 18 + 3 * 22, 4, baseZ + 90)[0], iso(ox, oy, 18 + 3 * 22, 4, baseZ + 90)[1], ox + 300, 220, "through-silicon vias (TSV)", "#7fd0ff")}
      ${call(gpu.topc[0], gpu.topc[1] - 8, ox + 300, 120, "reticle-limited compute die", "#3ddc97")}
      ${call(inter.topc[0], inter.topc[1], ox + 230, 470, "interposer + substrate · microbumps", "#9fb6c9")}
      ${dimLine(iso(ox, oy, 0, cd, baseZ)[0], 575, iso(ox, oy, cw, 0, baseZ)[0], 575, "HBM stack ≈ 11 mm")}
      <text x="60" y="56" class="rx-call" style="fill:#9fb1c6">EXPLODED ASSEMBLY — HBM3e die stack</text>
    </g>`;
  }

  // ---- levels ------------------------------------------------------------
  const LEVELS = [
    { id: "row", crumb: "Hall", title: "Data hall — a row of racks",
      scale: "Each rack 600 × 1200 mm · ~2.24 m tall · racks share a contained hot aisle",
      build: "Integrated & burned-in by an ODM, racks are craned into a row, then bolted to busway power and liquid coolant manifolds (CDU).",
      tickers: ["SMCI", "DELL", "HPE", "VRT", "NVT", "MOD", "2317.TW", "6669.TW"], draw: drawRow },
    { id: "rack", crumb: "Rack", title: "GB200 NVL72 rack",
      scale: "42U · 600 × 1200 × 2236 mm · ~1.36 t · ~120 kW · fully liquid-cooled",
      build: "18 compute trays + 9 NVLink switch trays are wired by a copper NVLink spine so all 72 GPUs act as one accelerator.",
      tickers: ["NVDA", "VRT", "APH", "TEL", "NVT", "ETN"], draw: drawRack },
    { id: "tray", crumb: "Tray", title: "Compute tray (1U)",
      scale: "2 Grace CPU + 4 Blackwell GPU · cold plates · quick-disconnect coolant fittings",
      build: "Two ‘Bianca’ boards per tray; a cold plate clamps each GPU & CPU, and the tray slots into the rack’s liquid loop.",
      tickers: ["NVDA", "SMCI", "CRDO", "ALAB", "MPWR", "APH"], draw: drawTray },
    { id: "board", crumb: "Board", title: "Bianca superchip board",
      scale: "1 Grace CPU + 2 Blackwell GPU · NVLink-C2C at 900 GB/s",
      build: "CPU and two GPUs are mounted on a PCB with dense NVLink-C2C traces and voltage regulators. Each GPU is itself a CoWoS package →",
      tickers: ["NVDA", "ARM", "MRVL", "MPWR", "CRDO", "AVGO"], draw: drawBoard },
    { id: "package", crumb: "Package", title: "Blackwell GPU package — CoWoS-L",
      scale: "2 GPU dies + 8 HBM3e stacks on a silicon interposer over an organic substrate · ~80 mm",
      build: "TSMC’s CoWoS bonds the dies and HBM onto a silicon interposer. This step — not the GPU die — is the AI buildout’s capacity bottleneck.",
      tickers: ["TSM", "NVDA", "AMKR", "ASX", "CAMT", "ONTO", "BESIY", "AMAT", "4062.T"], also: ["Shinko (private)"], draw: drawPackage },
    { id: "hbm", crumb: "Die & HBM", title: "HBM3e stack & compute die",
      scale: "8–12 DRAM dies + a base logic die, linked by through-silicon vias · 192 GB per GPU",
      build: "Memory makers thin and stack DRAM dies with TSVs and microbumps. HBM supply is allocated years out — the other hard constraint.",
      tickers: ["MU", "000660.KS", "005930.KS", "ASML", "LRCX", "KLAC", "AMAT"], draw: drawHBM },
  ];

  let level = 0, lock = false;

  // friendly labels for foreign-listed tickers (the symbols are ugly)
  const DISPLAY = { "000660.KS": "SK Hynix", "005930.KS": "Samsung", "4062.T": "Ibiden", "2317.TW": "Hon Hai", "6669.TW": "Wiwynn" };
  function tickerChip(t) {
    const h = (window.STATE && window.STATE.layers || []).flatMap((l) => l.holdings).find((x) => x.ticker === t);
    const label = DISPLAY[t] || t;
    if (!h) return `<span class="rx-tk muted" title="not in the screener universe">${label}</span>`;
    const px = h.market && h.market.price != null ? " · $" + h.market.price.toFixed(0) : "";
    return `<button class="rx-tk" data-t="${t}">${label}${px}</button>`;
  }
  // foreign / private players worth naming but not US-screenable
  function infoChip(label) { return `<span class="rx-tk muted" title="not US-listed / not in the universe">${label}</span>`; }

  function renderInfo() {
    const L = LEVELS[level];
    $("rxInfo").innerHTML = `
      <div class="rx-step">Build stage ${level + 1} / ${LEVELS.length}</div>
      <h3>${L.title}</h3>
      <div class="rx-scaleline">${L.scale}</div>
      <p class="rx-build">${L.build}</p>
      <div class="rx-supl">Key suppliers in the trade</div>
      <div class="rx-tks">${L.tickers.map(tickerChip).join("")}${(L.also || []).map(infoChip).join("")}</div>
      <div class="rx-nav">
        <button id="rxOut" ${level === 0 ? "disabled" : ""}>↤ Pull back</button>
        <button id="rxIn" ${level === LEVELS.length - 1 ? "disabled" : ""}>Zoom in ↦</button>
      </div>`;
    $("rxInfo").querySelectorAll("button.rx-tk").forEach((b) =>
      b.addEventListener("click", () => window.searchScreener && window.searchScreener(b.dataset.t)));
    $("rxInfo").querySelector("#rxOut").addEventListener("click", () => go(level - 1));
    $("rxInfo").querySelector("#rxIn").addEventListener("click", () => go(level + 1));
  }

  // Photo backdrops are retired for the CAD look (a blueprint grid suits the
  // engineering aesthetic better). The images remain on disk in static/assets/.

  function renderStage(dir) {
    const L = LEVELS[level];
    $("rxStage").innerHTML =
      `<svg viewBox="0 0 1000 600" class="rx-svg ${dir > 0 ? "in" : dir < 0 ? "out" : ""}" xmlns="http://www.w3.org/2000/svg">
        <defs>
          <linearGradient id="rxSky" x1="0" y1="0" x2="0" y2="1"><stop offset="0" stop-color="#081019"/><stop offset="1" stop-color="#0a1320"/></linearGradient>
          <radialGradient id="rxAmb" cx="0.5" cy="0.5" r="0.6"><stop offset="0" stop-color="#1d3f63" stop-opacity="0.45"/><stop offset="1" stop-color="#1d3f63" stop-opacity="0"/></radialGradient>
          <radialGradient id="rxVig" cx="0.5" cy="0.5" r="0.75"><stop offset="0.52" stop-color="#000" stop-opacity="0"/><stop offset="1" stop-color="#05080d" stop-opacity="0.55"/></radialGradient>
          <filter id="rxBlur" x="-80%" y="-80%" width="260%" height="260%"><feGaussianBlur stdDeviation="42"/></filter>
          <filter id="rxShadow" x="-20%" y="-20%" width="140%" height="150%"><feDropShadow dx="0" dy="3" stdDeviation="3" flood-color="#000" flood-opacity="0.45"/></filter>
          <marker id="rxDimA" markerWidth="10" markerHeight="8" refX="5" refY="4" orient="auto"><path d="M2 4 L9 1 L7 4 L9 7 Z" fill="#7c8aa0"/></marker>
          <pattern id="rxFine" width="22" height="22" patternUnits="userSpaceOnUse"><path d="M22 0 L0 0 L0 22" fill="none" stroke="#1b3a55" stroke-width="0.5" opacity="0.5"/></pattern>
          <pattern id="rxMajor" width="110" height="110" patternUnits="userSpaceOnUse"><path d="M110 0 L0 0 L0 110" fill="none" stroke="#23527a" stroke-width="0.9" opacity="0.55"/></pattern>
        </defs>
        <rect width="1000" height="600" fill="url(#rxSky)"/>
        <rect width="1000" height="600" fill="url(#rxFine)"/>
        <rect width="1000" height="600" fill="url(#rxMajor)"/>
        <ellipse cx="500" cy="300" rx="430" ry="250" fill="url(#rxAmb)" filter="url(#rxBlur)"/>
        ${L.draw()}
        <rect width="1000" height="600" fill="url(#rxVig)" pointer-events="none"/>
      </svg>`;
  }

  function renderRail() {
    $("rxRail").innerHTML = LEVELS.map((L, i) =>
      `<button class="rx-railitem ${i === level ? "active" : ""}" data-i="${i}"><span class="rx-railnum">${i + 1}</span>${L.crumb}</button>` +
      (i < LEVELS.length - 1 ? `<span class="rx-railarrow">▸</span>` : "")).join("");
    $("rxRail").querySelectorAll(".rx-railitem").forEach((b) =>
      b.addEventListener("click", () => go(+b.dataset.i)));
  }

  function go(next) {
    if (next < 0 || next >= LEVELS.length || next === level) return;
    const dir = next > level ? 1 : -1;
    level = next;
    renderStage(dir); renderInfo(); renderRail();
  }

  let wheelAccum = 0;
  function onWheel(e) {
    e.preventDefault();
    if (lock) return;
    wheelAccum += e.deltaY;
    if (Math.abs(wheelAccum) < 60) return;
    const dir = wheelAccum > 0 ? 1 : -1;   // scroll down = zoom in (deeper)
    wheelAccum = 0; lock = true;
    go(level + dir);
    setTimeout(() => { lock = false; }, 380);
  }

  function render() {
    const stage = $("rxStage");
    if (!stage) return;
    if (!stage.dataset.wired) { stage.addEventListener("wheel", onWheel, { passive: false }); stage.dataset.wired = "1"; }
    renderStage(0); renderInfo(); renderRail();
  }

  window.RackExplorer = { render, reset: () => { level = 0; } };
})();
