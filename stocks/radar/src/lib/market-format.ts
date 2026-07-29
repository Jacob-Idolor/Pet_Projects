import { escapeHtml } from "./format";
import { actionBias, isPreMomentum } from "../../scripts/lib/action-bias.mjs";
import { matchesTechnicalFilter } from "../../scripts/lib/technical-filters.mjs";

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

export interface NewsCheck {
  tilt?: "positive" | "negative" | "mixed" | "neutral" | string;
  positive?: number;
  negative?: number;
  neutral?: number;
  net?: number;
  scoreDelta?: number;
  label?: string;
  method?: string;
}

export { actionBias, isPreMomentum, matchesTechnicalFilter };

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

export function hasTechnical(q: QuoteData | undefined) {
  return Boolean(q?.sma || q?.range52Pct != null || q?.rsi14 != null);
}

export function actionBadge(q: QuoteData | undefined, opts?: { newsCheck?: NewsCheck | null }) {
  const a = actionBias(q, opts);
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

/** Short pulse row blurb: lean signal + setup flavor + SMA50. */
export function pulseExplain(
  q: QuoteData | undefined,
  opts?: { newsCheck?: NewsCheck | null }
): {
  bias: ReturnType<typeof actionBias>;
  sma: string;
  line: string;
} {
  const bias = actionBias(q, opts);
  const sma = sma50Plain(q);
  const lean =
    bias.cls === "buy"
      ? "Lean buy — weighted checklist tips constructive (not advice)"
      : bias.cls === "sell"
        ? "Lean sell — stretched or soft on the weighted checklist"
        : bias.cls === "watch"
          ? bias.setup === "pre-momentum"
            ? "Watch — quiet coil / pre-momentum (no run yet)"
            : "Watch — mixed / wait for a clearer setup"
          : "Waiting on quotes";
  const setupLabel =
    bias.setup === "pre-momentum"
      ? "pre-momentum"
      : bias.setup === "washed-out"
        ? "washed-out"
        : bias.setup === "extended"
          ? "extended"
          : null;
  const bits = [lean];
  if (setupLabel && bias.cls !== "idle") bits.push(setupLabel);
  if (bias.reason && bias.reason !== "Waiting on quotes") bits.push(bias.reason);
  bits.push(sma);
  return { bias, sma, line: bits.join(" · ") };
}

export const PULSE_SIGNAL_GUIDE = [
  {
    id: "buy",
    title: "Lean buy",
    blurb: "Weighted score ≥ +3. RSI washouts and year-lows count more than trend.",
  },
  {
    id: "watch",
    title: "Watch",
    blurb: "Score between −2 and +2. Includes quiet coils that haven’t caught momentum yet.",
  },
  {
    id: "sell",
    title: "Lean sell",
    blurb: "Weighted score ≤ −3. Overbought / year-highs / SMA50 stretch weigh heavier.",
  },
  {
    id: "sma50",
    title: "SMA50 + quiet",
    blurb: "50-day avg = recent typical price. Low volume near it can flag a coil before a move.",
  },
] as const;
