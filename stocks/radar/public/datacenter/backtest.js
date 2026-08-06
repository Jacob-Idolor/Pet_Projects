// Score backtest view. Calls /api/backtest (heavy — cached server-side) and shows
// whether higher composite scores preceded higher forward returns: an information
// coefficient, a quintile forward-return chart, and the top-vs-bottom spread.
(function () {
  const $ = (id) => document.getElementById(id);
  let horizon = 21, months = 6, wired = false, ranOnce = false, busy = false;

  function setActive(groupId, attr, val) {
    document.querySelectorAll(`#${groupId} button`).forEach((b) => b.classList.toggle("active", b.dataset[attr] === String(val)));
  }

  async function run() {
    if (busy) return;
    busy = true;
    const out = $("btResults");
    out.innerHTML = `<div class="bt-loading">⏳ Reconstructing daily scores & forward returns across the universe — this pulls 2 years of prices, ~20–40s the first time…</div>`;
    try {
      const r = await fetch(`/api/backtest?months=${months}&horizon=${horizon}`);
      const d = await r.json();
      if (!d.ok) { out.innerHTML = `<div class="bt-err">Backtest failed: ${escAttr(d.error || "unknown error")}.</div>`; busy = false; return; }
      renderResults(d);
      ranOnce = true;
    } catch (e) {
      out.innerHTML = `<div class="bt-err">Request failed — is the server running?</div>`;
    }
    busy = false;
  }

  const escAttr = (s) => (s || "").replace(/[<>&"]/g, (c) => ({ "<": "&lt;", ">": "&gt;", "&": "&amp;", '"': "&quot;" }[c]));
  const pct = (v) => (v == null ? "—" : (v > 0 ? "+" : "") + v.toFixed(2) + "%");
  const retColor = (v) => (v == null ? "var(--muted)" : v > 0 ? "var(--green)" : "var(--red)");

  function quintileChart(q) {
    const vals = q.filter((v) => v != null);
    if (!vals.length) return "";
    const max = Math.max(...vals, 0), min = Math.min(...vals, 0), span = (max - min) || 1;
    const W = 520, H = 210, pad = 28, bw = (W - pad * 2) / 5, zeroY = pad + (max / span) * (H - pad * 2);
    const labels = ["Q1\nlowest", "Q2", "Q3", "Q4", "Q5\nhighest"];
    let bars = "";
    q.forEach((v, i) => {
      if (v == null) return;
      const x = pad + i * bw + bw * 0.18, w = bw * 0.64;
      const y = v >= 0 ? zeroY - (v / span) * (H - pad * 2) : zeroY;
      const h = Math.abs(v / span) * (H - pad * 2);
      const col = i === 4 ? "var(--green)" : i === 0 ? "var(--red)" : "var(--accent)";
      bars += `<rect x="${x.toFixed(1)}" y="${y.toFixed(1)}" width="${w.toFixed(1)}" height="${Math.max(1, h).toFixed(1)}" rx="3" fill="${col}" opacity="${i === 0 || i === 4 ? 0.9 : 0.6}"/>`;
      bars += `<text x="${(x + w / 2).toFixed(1)}" y="${(v >= 0 ? y - 5 : y + h + 13).toFixed(1)}" text-anchor="middle" class="bt-barval">${pct(v)}</text>`;
      bars += `<text x="${(x + w / 2).toFixed(1)}" y="${H - 6}" text-anchor="middle" class="bt-barlbl">${labels[i].split("\n")[0]}</text>`;
    });
    return `<svg viewBox="0 0 ${W} ${H}" class="bt-chart" role="img" aria-label="Forward return by score quintile">
      <line x1="${pad}" y1="${zeroY.toFixed(1)}" x2="${W - pad}" y2="${zeroY.toFixed(1)}" stroke="var(--border)" stroke-width="1"/>
      ${bars}</svg>`;
  }

  function renderResults(d) {
    const ic = d.ic_mean, spread = d.top_bottom_spread;
    const verdict = ic == null ? "Inconclusive."
      : ic >= 0.05 ? "Higher scores preceded higher forward returns — the score shows positive predictive signal."
      : ic <= -0.05 ? "Higher scores preceded LOWER forward returns — the score is inverted over this window."
      : "Weak/negligible relationship over this window.";
    const verdictClass = ic == null ? "" : ic >= 0.05 ? "good" : ic <= -0.05 ? "bad" : "weak";
    const card = (label, val, sub) => `<div class="bt-card"><div class="bt-card-v">${val}</div><div class="bt-card-l">${label}</div>${sub ? `<div class="bt-card-s">${sub}</div>` : ""}</div>`;
    $("btResults").innerHTML = `
      <div class="bt-verdict ${verdictClass}">${verdict}</div>
      <div class="bt-cards">
        ${card("Information coefficient", ic == null ? "—" : ic.toFixed(3), `mean daily rank corr · positive on ${d.ic_positive_rate != null ? Math.round(d.ic_positive_rate * 100) + "%" : "—"} of days`)}
        ${card(`Top–bottom spread (${d.horizon_label})`, `<span style="color:${retColor(spread)}">${pct(spread)}</span>`, "Q5 minus Q1 avg forward return")}
        ${card("Top-beats-bottom hit rate", d.hit_rate != null ? Math.round(d.hit_rate * 100) + "%" : "—", "days Q5 outperformed Q1")}
        ${card("Sample", `${d.n_tickers} names`, `${d.days_tested} trading days · ${d.months}-mo lookback`)}
      </div>
      <div class="bt-chart-h">Average forward return (${d.horizon_label}) by score quintile${d.monotonic ? ' <span class="bt-mono">✓ monotonic</span>' : ""}</div>
      ${quintileChart(d.quintile_returns)}
      <div class="bt-foot muted">Lowest-scoring fifth (Q1) → highest-scoring fifth (Q5). A rising staircase means the score ranked winners ahead of losers.${d.cached ? " · cached" : ""}</div>`;
  }

  function render() {
    if (!$("backtest")) return;
    if (!wired) {
      wired = true;
      document.querySelectorAll("#btHorizon button").forEach((b) =>
        b.addEventListener("click", () => { horizon = +b.dataset.h; setActive("btHorizon", "h", horizon); run(); }));
      document.querySelectorAll("#btMonths button").forEach((b) =>
        b.addEventListener("click", () => { months = +b.dataset.m; setActive("btMonths", "m", months); run(); }));
      $("btRun").addEventListener("click", run);
    }
    if (!ranOnce && !busy) run();   // auto-run once on first open
  }

  window.Backtest = { render };
})();
