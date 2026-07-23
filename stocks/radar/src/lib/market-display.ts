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
  const allowed: Trend[] = ["bullish", "bearish", "mixed", "unknown"];
  const t: Trend = allowed.includes(trend as Trend) ? (trend as Trend) : "unknown";
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

export function hasTechnical(q: QuoteData | undefined) {
  return Boolean(q?.sma || q?.range52Pct != null || q?.rsi14 != null);
}

export function renderTechnicalDetail(q: QuoteData | undefined, price: number | null) {
  if (!hasTechnical(q)) {
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

  const action = actionBias(q);
  return `
    <div class="tech-detail">
      <h4>Technical snapshot</h4>
      <div class="tech-summary-row">
        ${actionBadge(q)}
        ${trendBadge(q?.trend)}
        <span class="rsi-badge rsi-${rsi.cls}">RSI(14) ${escapeHtml(rsi.text)}</span>
        ${q?.signals?.length ? `<span class="signal-tags">${q.signals.slice(0, 4).map((s) => `<span class="signal-tag">${escapeHtml(s.replace(/-/g, " "))}</span>`).join("")}</span>` : ""}
      </div>
      <p class="action-reason">${escapeHtml(action.reason)}</p>
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

export function actionBias(q: QuoteData | undefined): {
  label: string;
  cls: "buy" | "sell" | "watch" | "idle";
  reason: string;
  score: number;
} {
  if (!q || q.price == null) {
    return { label: "—", cls: "idle", reason: "Waiting on quotes", score: 0 };
  }

  let score = 0;
  const bits: string[] = [];

  if (q.rsi14 != null && q.rsi14 <= 30) {
    score += 2;
    bits.push("RSI oversold");
  } else if (q.rsi14 != null && q.rsi14 <= 40) {
    score += 1;
    bits.push("RSI soft");
  } else if (q.rsi14 != null && q.rsi14 >= 70) {
    score -= 2;
    bits.push("RSI overbought");
  } else if (q.rsi14 != null && q.rsi14 >= 65) {
    score -= 1;
    bits.push("RSI elevated");
  }

  if (q.range52Pct != null && q.range52Pct <= 20) {
    score += 1;
    bits.push("near 52w low");
  } else if (q.range52Pct != null && q.range52Pct >= 85) {
    score -= 1;
    bits.push("near 52w high");
  }

  if (q.pctFromAth != null && q.pctFromAth >= -3) {
    score -= 1;
    bits.push("near ATH");
  }

  if (q.trend === "bullish") {
    score += 1;
    bits.push("bullish trend");
  } else if (q.trend === "bearish") {
    score -= 1;
    bits.push("bearish trend");
  }

  if (q.signals?.includes("deep-below-50")) {
    score += 1;
    bits.push("deep below SMA50");
  }
  if (q.signals?.includes("extended-above-50")) {
    score -= 1;
    bits.push("extended above SMA50");
  }

  const reason = bits.length ? bits.slice(0, 3).join(" · ") : "Neutral setup";
  if (score >= 2) return { label: "Lean buy", cls: "buy", reason, score };
  if (score <= -2) return { label: "Lean sell", cls: "sell", reason, score };
  return { label: "Watch", cls: "watch", reason, score };
}

export function actionBadge(q: QuoteData | undefined) {
  const a = actionBias(q);
  return `<span class="action-badge action-${a.cls}" title="${escapeHtml(a.reason)}">${escapeHtml(a.label)}</span>`;
}

/** Plain-English SMA50 for friends who are not chart-fluent. */
export function sma50Plain(q: QuoteData | undefined): string {
  const vs = q?.vsSma?.[50];
  if (vs == null || Number.isNaN(vs)) return "50-day avg n/a";
  const abs = Math.abs(vs).toFixed(1);
  if (Math.abs(vs) < 1) return "about even with its 50-day average price";
  if (vs > 0) return `${abs}% above its 50-day average (running hot vs recent weeks)`;
  return `${abs}% below its 50-day average (cheaper vs recent weeks)`;
}

/** Short pulse row blurb: lean signal + SMA50 in normal language. */
export function pulseExplain(q: QuoteData | undefined): {
  bias: ReturnType<typeof actionBias>;
  sma: string;
  line: string;
} {
  const bias = actionBias(q);
  const sma = sma50Plain(q);
  const lean =
    bias.cls === "buy"
      ? "Lean buy — checklist tips constructive (not advice)"
      : bias.cls === "sell"
        ? "Lean sell — stretched or soft on our checklist"
        : bias.cls === "watch"
          ? "Watch — mixed / wait for a clearer setup"
          : "Waiting on quotes";
  const bits = [lean];
  if (bias.reason && bias.reason !== "Waiting on quotes") bits.push(bias.reason);
  bits.push(sma);
  return { bias, sma, line: bits.join(" · ") };
}

export const PULSE_SIGNAL_GUIDE = [
  {
    id: "buy",
    title: "Lean buy",
    blurb: "Our checklist is constructive (RSI soft, near lows, or cool vs averages). Discussion only — not a buy order.",
  },
  {
    id: "watch",
    title: "Watch",
    blurb: "Mixed tape. Fine to hold the conversation; nothing screaming buy or trim on our simple score.",
  },
  {
    id: "sell",
    title: "Lean sell",
    blurb: "Extended or soft (hot RSI, near highs, stretched above averages). A caution flag for the group chat.",
  },
  {
    id: "sma50",
    title: "SMA50",
    blurb: "50-day average ≈ typical price over ~2.5 months. Above it = running hot lately; below = cooler vs recent weeks.",
  },
] as const;

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
