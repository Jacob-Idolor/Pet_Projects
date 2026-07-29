import { escapeHtml, sanitizeSymbol } from "../../lib/format";
import { pulseExplain } from "../../lib/market-display";
import {
  state,
  getQuote,
  getPrice,
  getChange,
  biasOpts,
} from "./state";

export function renderCheckIn() {
  const gainersEl = document.getElementById("checkin-gainers");
  const losersEl = document.getElementById("checkin-losers");
  const setupsEl = document.getElementById("checkin-setups");
  const watchEl = document.getElementById("checkin-watch");
  const cautionEl = document.getElementById("checkin-caution");
  const tallyEl = document.getElementById("checkin-tally");
  // Legacy id from older builds
  const moversEl = document.getElementById("checkin-movers");
  if (!gainersEl && !losersEl && !setupsEl && !watchEl && !cautionEl && !moversEl) return;

  const priced = state.allStocks
    .map((s) => {
      const q = getQuote(s);
      const price = getPrice(s);
      const chg = getChange(s);
      const explain = pulseExplain(q, biasOpts(s));
      return { stock: s, q, price, chg, bias: explain.bias, explain };
    })
    .filter((x) => x.price != null);

  const emptyAll = (msg: string) => {
    const safe = escapeHtml(msg);
    const empty = `<li class="checkin-rank__empty">${safe}</li>`;
    for (const el of [gainersEl, losersEl, setupsEl, watchEl, cautionEl, moversEl]) {
      if (el) el.innerHTML = empty;
    }
    if (tallyEl) tallyEl.innerHTML = `<span class="checkin-tally__loading">${safe}</span>`;
  };

  if (!priced.length) {
    emptyAll("Waiting on quotes for the master list…");
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

  const moveRow = (x: (typeof priced)[0], i: number) => {
    const up = (x.chg ?? 0) >= 0;
    const sym = sanitizeSymbol(x.stock.symbol) || escapeHtml(String(x.stock.symbol ?? ""));
    return `<li class="checkin-rank__row">
      <span class="checkin-rank__n">${i + 1}</span>
      <button type="button" class="checkin-rank__sym" data-jump="${sym}">${sym}</button>
      <span class="checkin-rank__name">${escapeHtml(x.stock.name)}</span>
      <span class="checkin-rank__val mono ${up ? "up" : "down"}">${up ? "+" : ""}${(x.chg ?? 0).toFixed(1)}%</span>
    </li>`;
  };

  const signalRow = (x: (typeof priced)[0], i: number) => {
    const sym = sanitizeSymbol(x.stock.symbol) || escapeHtml(String(x.stock.symbol ?? ""));
    const chg = x.chg;
    const chgHtml =
      chg == null
        ? `<span class="checkin-rank__val dim">—</span>`
        : `<span class="checkin-rank__val mono ${chg >= 0 ? "up" : "down"}">${chg >= 0 ? "+" : ""}${chg.toFixed(1)}%</span>`;
    const setupTag =
      x.bias.setup === "pre-momentum"
        ? `<span class="checkin-setup-tag">pre-mom</span>`
        : x.bias.setup === "washed-out"
          ? `<span class="checkin-setup-tag checkin-setup-tag--wash">wash</span>`
          : x.bias.setup === "extended"
            ? `<span class="checkin-setup-tag checkin-setup-tag--ext">ext</span>`
            : "";
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

  const gainers = [...priced]
    .filter((x) => x.chg != null && x.chg > 0)
    .sort((a, b) => (b.chg ?? 0) - (a.chg ?? 0))
    .slice(0, 8);

  const losers = [...priced]
    .filter((x) => x.chg != null && x.chg < 0)
    .sort((a, b) => (a.chg ?? 0) - (b.chg ?? 0))
    .slice(0, 8);

  // Absolute movers fallback for legacy #checkin-movers
  const absMovers = [...priced]
    .filter((x) => x.chg != null)
    .sort((a, b) => Math.abs(b.chg!) - Math.abs(a.chg!))
    .slice(0, 8);

  if (gainersEl) {
    gainersEl.innerHTML = gainers.length
      ? gainers.map(moveRow).join("")
      : `<li class="checkin-rank__empty">No gainers today.</li>`;
  }
  if (losersEl) {
    losersEl.innerHTML = losers.length
      ? losers.map(moveRow).join("")
      : `<li class="checkin-rank__empty">No losers today.</li>`;
  }
  if (moversEl) {
    moversEl.innerHTML = absMovers.length
      ? absMovers.map(moveRow).join("")
      : `<li class="checkin-rank__empty">No moves yet.</li>`;
  }

  const setups = [...priced]
    .filter((x) => x.bias.cls === "buy")
    .sort((a, b) => b.bias.score - a.bias.score || (b.chg ?? 0) - (a.chg ?? 0))
    .slice(0, 8);

  if (setupsEl) {
    setupsEl.innerHTML = setups.length
      ? setups.map(signalRow).join("")
      : `<li class="checkin-rank__empty">None right now.</li>`;
  }

  const watch = [...priced]
    .filter((x) => x.bias.cls === "watch")
    .sort((a, b) => {
      // Pre-momentum quiet coils first — answer "what hasn't run yet?"
      const ap = a.bias.setup === "pre-momentum" ? 1 : 0;
      const bp = b.bias.setup === "pre-momentum" ? 1 : 0;
      if (bp !== ap) return bp - ap;
      return Math.abs(b.bias.score) - Math.abs(a.bias.score) || Math.abs(b.chg ?? 0) - Math.abs(a.chg ?? 0);
    })
    .slice(0, 8);

  if (watchEl) {
    watchEl.innerHTML = watch.length
      ? watch.map(signalRow).join("")
      : `<li class="checkin-rank__empty">None right now.</li>`;
  }

  const caution = [...priced]
    .filter((x) => x.bias.cls === "sell")
    .sort((a, b) => a.bias.score - b.bias.score)
    .slice(0, 8);

  if (cautionEl) {
    cautionEl.innerHTML = caution.length
      ? caution.map(signalRow).join("")
      : `<li class="checkin-rank__empty">None right now.</li>`;
  }
}
