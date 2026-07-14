import { escapeHtml } from "./format";

export type Trend = "bullish" | "bearish" | "mixed" | "unknown";

export interface QuoteData {
  price: number;
  changePct: number | null;
  prevClose?: number | null;
  currency?: string;
  name?: string;
  high52?: number | null;
  low52?: number | null;
  range52Pct?: number | null;
  athHigh?: number | null;
  athDate?: string | null;
  pctFromAth?: number | null;
  sma?: { 20?: number | null; 50?: number | null; 200?: number | null };
  vsSma?: { 20?: number | null; 50?: number | null; 200?: number | null };
  trend?: Trend;
  rsi14?: number | null;
  volume?: number | null;
  avgVolume20?: number | null;
  volRatio?: number | null;
  signals?: string[];
}

export type QuoteMap = Record<string, QuoteData>;

export function fmtPrice(v: number | null | undefined) {
  if (v == null || Number.isNaN(v)) return "—";
  return v.toLocaleString("en-US", { style: "currency", currency: "USD", minimumFractionDigits: 2 });
}

export function fmtPct(v: number | null | undefined, signed = true) {
  if (v == null || Number.isNaN(v)) return "—";
  const sign = signed && v > 0 ? "+" : "";
  return `${sign}${v.toFixed(1)}%`;
}

export function fmtVolume(v: number | null | undefined) {
  if (v == null) return "—";
  if (v >= 1e9) return `${(v / 1e9).toFixed(1)}B`;
  if (v >= 1e6) return `${(v / 1e6).toFixed(1)}M`;
  if (v >= 1e3) return `${(v / 1e3).toFixed(1)}K`;
  return String(Math.round(v));
}

export function rsiLabel(rsi: number | null | undefined) {
  if (rsi == null) return { text: "—", cls: "neutral" };
  if (rsi >= 70) return { text: `${rsi.toFixed(0)} overbought`, cls: "hot" };
  if (rsi <= 30) return { text: `${rsi.toFixed(0)} oversold`, cls: "cold" };
  return { text: rsi.toFixed(0), cls: "neutral" };
}

export function trendBadge(trend: Trend | undefined) {
  const t = trend ?? "unknown";
  const labels: Record<Trend, string> = {
    bullish: "Bullish",
    bearish: "Bearish",
    mixed: "Mixed",
    unknown: "—",
  };
  return `<span class="trend-badge trend-${t}">${labels[t]}</span>`;
}

export function maCell(price: number | null, ma: number | null | undefined, vs: number | null | undefined) {
  if (ma == null) return `<span class="dim">—</span>`;
  const above = price != null && price >= ma;
  const cls = above ? "ma-above" : "ma-below";
  const vsTxt = vs != null ? `<span class="ma-vs ${cls}">${fmtPct(vs)}</span>` : "";
  return `<span class="mono ${cls}">${fmtPrice(ma)}</span>${vsTxt ? ` ${vsTxt}` : ""}`;
}

export function rangeBar(range52Pct: number | null | undefined, low?: number | null, high?: number | null) {
  if (range52Pct == null) return "";
  const pos = Math.max(0, Math.min(100, range52Pct));
  let zone = "mid";
  if (pos <= 15) zone = "low";
  else if (pos >= 85) zone = "high";
  const hint =
    low != null && high != null
      ? `${fmtPrice(low)} – ${fmtPrice(high)} · ${pos.toFixed(0)}% of range`
      : `${pos.toFixed(0)}% of 52w range`;
  return `<div class="range-bar" title="${escapeHtml(hint)}"><div class="range-bar-track"><div class="range-bar-marker zone-${zone}" style="left:${pos}%"></div></div><span class="range-bar-label">${pos.toFixed(0)}%</span></div>`;
}

export function athIndicator(q: QuoteData | undefined) {
  if (q?.athHigh == null || q?.pctFromAth == null) {
    return `<span class="dim">—</span>`;
  }

  const pct = q.pctFromAth;
  const athTitle = q.athDate
    ? `All-time high ${fmtPrice(q.athHigh)} (${q.athDate})`
    : `All-time high ${fmtPrice(q.athHigh)}`;

  if (pct >= -0.5) {
    return `<span class="ath-badge ath-at" title="${escapeHtml(athTitle)}">ATH</span>`;
  }
  if (pct >= -5) {
    return `<span class="ath-badge ath-near" title="${escapeHtml(athTitle)}">Near ATH</span>`;
  }
  return `<span class="ath-badge ath-below" title="${escapeHtml(athTitle)}">${fmtPct(pct)} from ATH</span>`;
}

export function renderMaStrip(q: QuoteData | undefined, price: number | null) {
  if (!q?.sma) return "";
  const items = ([20, 50, 200] as const)
    .map((p) => {
      const ma = q.sma?.[p];
      if (ma == null || price == null) return null;
      const above = price >= ma;
      return `<span class="ma-pill ${above ? "above" : "below"}" title="SMA ${p}: ${fmtPrice(ma)}">${p}${above ? "↑" : "↓"}</span>`;
    })
    .filter(Boolean);
  return items.length ? `<div class="ma-strip">${items.join("")}</div>` : "";
}

export function renderTechnicalDetail(q: QuoteData | undefined, price: number | null) {
  if (!q?.sma && q?.range52Pct == null && q?.rsi14 == null) {
    return `<p class="tech-unavailable">Technical data refreshes on deploy — run <code>npm run update-quotes</code> locally or wait for CI.</p>`;
  }

  const rsi = rsiLabel(q?.rsi14);
  const volNote =
    q?.volRatio != null
      ? `${fmtVolume(q.volume)} (${q.volRatio.toFixed(1)}× 20d avg)`
      : q?.volume != null
        ? fmtVolume(q.volume)
        : "—";

  const rows = ([20, 50, 200] as const)
    .map((p) => {
      const ma = q?.sma?.[p];
      const vs = q?.vsSma?.[p];
      if (ma == null) return "";
      const above = price != null && price >= ma;
      return `<tr><td>SMA ${p}</td><td class="mono">${fmtPrice(ma)}</td><td class="${above ? "ma-above" : "ma-below"}">${vs != null ? fmtPct(vs) : "—"}</td></tr>`;
    })
    .filter(Boolean)
    .join("");

  return `
    <div class="tech-detail">
      <h4>Technical snapshot</h4>
      <div class="tech-summary-row">
        ${trendBadge(q?.trend)}
        <span class="rsi-badge rsi-${rsi.cls}">RSI(14) ${escapeHtml(rsi.text)}</span>
        ${q?.signals?.length ? `<span class="signal-tags">${q.signals.slice(0, 4).map((s) => `<span class="signal-tag">${escapeHtml(s.replace(/-/g, " "))}</span>`).join("")}</span>` : ""}
      </div>
      <table class="tech-table"><tbody>${rows}</tbody></table>
      <div class="tech-range">
        <span class="tech-label">52-week range</span>
        ${rangeBar(q?.range52Pct, q?.low52, q?.high52)}
        <span class="tech-range-bounds">${fmtPrice(q?.low52)} – ${fmtPrice(q?.high52)}</span>
      </div>
      <div class="tech-ath">
        <span class="tech-label">All-time high</span>
        ${athIndicator(q)}
        ${q?.athHigh != null ? `<span class="tech-ath-level">${fmtPrice(q.athHigh)}${q.athDate ? ` · ${q.athDate}` : ""}</span>` : ""}
      </div>
      <p class="tech-vol"><strong>Volume:</strong> ${volNote}</p>
    </div>`;
}

export function hasTechnical(q: QuoteData | undefined) {
  return Boolean(q?.sma?.[50] != null || q?.range52Pct != null);
}

export function matchesTechnicalFilter(filter: string, q: QuoteData | undefined, price: number | null) {
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
