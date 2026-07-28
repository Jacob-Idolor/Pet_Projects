import { escapeHtml, safeHttpUrl } from "./format";

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

export interface OutlookFundamentals {
  trailingPE?: number | null;
  forwardPE?: number | null;
  pegRatio?: number | null;
  priceToBook?: number | null;
  evToEbitda?: number | null;
  profitMargin?: number | null;
  revenueGrowth?: number | null;
  targetMeanPrice?: number | null;
  recommendationMean?: number | null;
  bias?: string | null;
  note?: string | null;
  catalyst?: string | null;
}

export interface OutlookNewsItem {
  title?: string;
  publisher?: string;
  link?: string;
  publishedAt?: string | null;
  sentiment?: "positive" | "negative" | "neutral" | string;
  sentimentScore?: number;
  sentimentHits?: string[];
}

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

export interface OutlookStock {
  symbol?: string;
  fundamentals?: OutlookFundamentals | null;
  news?: OutlookNewsItem[];
  newsCheck?: NewsCheck | null;
}

function fmtMultiple(v: number | null | undefined) {
  if (v == null || Number.isNaN(v)) return "—";
  return v.toFixed(1);
}

function fmtGrowth(v: number | null | undefined) {
  if (v == null || Number.isNaN(v)) return "—";
  return `${(v * 100).toFixed(0)}%`;
}

function biasLabel(bias: string | null | undefined) {
  const b = (bias || "").toLowerCase();
  if (b === "cheap") return { text: "Group lean: cheap vs story", cls: "cheap" };
  if (b === "fair") return { text: "Group lean: fair", cls: "fair" };
  if (b === "rich") return { text: "Group lean: rich vs story", cls: "rich" };
  return null;
}

function sentimentBadge(sentiment: string | undefined) {
  const s = (sentiment || "neutral").toLowerCase();
  const cls = s === "positive" || s === "negative" || s === "neutral" ? s : "neutral";
  const text = cls === "positive" ? "+" : cls === "negative" ? "−" : "~";
  const label = cls === "positive" ? "Positive" : cls === "negative" ? "Negative" : "Neutral";
  return `<span class="news-sent news-sent--${cls}" title="${escapeHtml(label)} headline">${text} ${escapeHtml(label)}</span>`;
}

function newsCheckHtml(check: NewsCheck | null | undefined) {
  if (!check?.tilt) return "";
  const tilt = String(check.tilt);
  const cls =
    tilt === "positive" ? "positive" : tilt === "negative" ? "negative" : tilt === "mixed" ? "mixed" : "neutral";
  const label = check.label || `News check: ${tilt}`;
  return `<p class="outlook-news-check outlook-news-check--${cls}">${escapeHtml(label)}</p>
    <p class="outlook-disclaimer">Headline lexicon — quick tape check, not a thesis. Read the links.</p>`;
}

/** Valuation + news first — friend feedback: more important than technical momentum. */
export function renderOutlookDetail(row: OutlookStock | null | undefined) {
  const f = row?.fundamentals;
  const news = Array.isArray(row?.news) ? row!.news! : [];
  const hasMetrics =
    f &&
    (f.trailingPE != null ||
      f.forwardPE != null ||
      f.pegRatio != null ||
      f.priceToBook != null ||
      f.evToEbitda != null ||
      f.bias ||
      f.note ||
      f.catalyst);

  if (!hasMetrics && !news.length && !row?.newsCheck) {
    return `<div class="outlook-detail">
      <h4>Valuation + news</h4>
      <p class="outlook-empty">Outlook refreshes with quotes — run <code>npm run update-quotes</code> or wait for CI.</p>
    </div>`;
  }

  const lean = biasLabel(f?.bias);
  const metrics = [
    ["Trailing PE", fmtMultiple(f?.trailingPE)],
    ["Forward PE", fmtMultiple(f?.forwardPE)],
    ["PEG", fmtMultiple(f?.pegRatio)],
    ["P/B", fmtMultiple(f?.priceToBook)],
    ["EV/EBITDA", fmtMultiple(f?.evToEbitda)],
    ["Rev growth", fmtGrowth(f?.revenueGrowth)],
  ]
    .filter(([, v]) => v !== "—")
    .map(
      ([label, v]) =>
        `<span class="outlook-metric"><span class="outlook-metric__label">${escapeHtml(label)}</span><span class="mono">${escapeHtml(v)}</span></span>`
    )
    .join("");

  const newsHtml = news.length
    ? `<ul class="outlook-news">${news
        .slice(0, 3)
        .map((n) => {
          const title = escapeHtml(n.title || "Headline");
          const pub = escapeHtml(n.publisher || "");
          const href = escapeHtml(safeHttpUrl(n.link));
          return `<li>${sentimentBadge(n.sentiment)} <a href="${href}" target="_blank" rel="noopener noreferrer">${title}</a>${pub ? ` <span class="outlook-news__pub">${pub}</span>` : ""}</li>`;
        })
        .join("")}</ul>`
    : `<p class="outlook-empty">No recent headlines in the feed.</p>`;

  return `<div class="outlook-detail">
    <h4>Valuation + news <span class="tech-detail__sub">(primary)</span></h4>
    ${lean ? `<p class="outlook-bias outlook-bias--${lean.cls}">${escapeHtml(lean.text)}</p>` : ""}
    ${f?.note ? `<p class="outlook-note">${escapeHtml(f.note)}</p>` : ""}
    ${f?.catalyst ? `<p class="outlook-catalyst"><strong>Catalyst:</strong> ${escapeHtml(f.catalyst)}</p>` : ""}
    ${metrics ? `<div class="outlook-metrics">${metrics}</div>` : ""}
    <p class="outlook-disclaimer">Multiples without peer context are not a buy/sell — they’re chat fuel next to the thesis.</p>
    <h5 class="outlook-news-title">News check</h5>
    ${newsCheckHtml(row?.newsCheck)}
    ${newsHtml}
  </div>`;
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
      <h4>Momentum <span class="tech-detail__sub">(secondary)</span></h4>
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

export function actionBias(
  q: QuoteData | undefined,
  opts?: { newsCheck?: NewsCheck | null }
): {
  label: string;
  cls: "buy" | "sell" | "watch" | "idle";
  reason: string;
  score: number;
  setup: "washed-out" | "pre-momentum" | "trending" | "extended" | "mixed" | "idle";
} {
  if (!q || q.price == null) {
    return { label: "—", cls: "idle", reason: "Waiting on quotes", score: 0, setup: "idle" };
  }

  let score = 0;
  const bits: string[] = [];

  // Heavy: RSI extremes
  if (q.rsi14 != null && q.rsi14 <= 30) {
    score += 3;
    bits.push("RSI oversold (+3)");
  } else if (q.rsi14 != null && q.rsi14 <= 40) {
    score += 1;
    bits.push("RSI soft (+1)");
  } else if (q.rsi14 != null && q.rsi14 >= 70) {
    score -= 3;
    bits.push("RSI overbought (−3)");
  } else if (q.rsi14 != null && q.rsi14 >= 65) {
    score -= 1;
    bits.push("RSI elevated (−1)");
  }

  // Heavy: year range
  if (q.range52Pct != null && q.range52Pct <= 20) {
    score += 2;
    bits.push("near 52w low (+2)");
  } else if (q.range52Pct != null && q.range52Pct >= 85) {
    score -= 2;
    bits.push("near 52w high (−2)");
  }

  // Medium-heavy: ATH stretch
  if (q.pctFromAth != null && q.pctFromAth >= -3) {
    score -= 2;
    bits.push("near ATH (−2)");
  }

  // Heavy: SMA50 stretch
  if (q.signals?.includes("deep-below-50") || (q.vsSma?.[50] != null && q.vsSma[50] < -10)) {
    score += 2;
    bits.push("deep below SMA50 (+2)");
  }
  if (q.signals?.includes("extended-above-50") || (q.vsSma?.[50] != null && q.vsSma[50] > 10)) {
    score -= 2;
    bits.push("extended above SMA50 (−2)");
  }

  // Light: trend is context
  if (q.trend === "bullish") {
    score += 1;
    bits.push("bullish trend (+1)");
  } else if (q.trend === "bearish") {
    score -= 1;
    bits.push("bearish trend (−1)");
  }

  // Pre-momentum: quiet / coiling names that haven't run
  if (isPreMomentum(q)) {
    score += 2;
    bits.push("quiet coil / pre-momentum (+2)");
  } else if (
    q.volRatio != null &&
    q.volRatio < 0.7 &&
    q.range52Pct != null &&
    q.range52Pct >= 80
  ) {
    score -= 1;
    bits.push("quiet near highs (−1)");
  }

  // News tape check (primary outlook layer — lexicon tilt from outlook.json)
  const delta = opts?.newsCheck?.scoreDelta;
  if (typeof delta === "number" && delta !== 0) {
    score += delta;
    const sign = delta > 0 ? `+${delta}` : String(delta);
    const tilt = opts?.newsCheck?.tilt || (delta > 0 ? "positive" : "negative");
    bits.push(`news ${tilt} (${sign})`);
  }

  let setup: "washed-out" | "pre-momentum" | "trending" | "extended" | "mixed" | "idle" = "mixed";
  if (isPreMomentum(q)) setup = "pre-momentum";
  else if (
    (q.rsi14 != null && q.rsi14 <= 35) ||
    (q.vsSma?.[50] != null && q.vsSma[50] < -10) ||
    (q.range52Pct != null && q.range52Pct <= 20)
  ) {
    setup = "washed-out";
  } else if (
    (q.rsi14 != null && q.rsi14 >= 65) ||
    (q.vsSma?.[50] != null && q.vsSma[50] > 10) ||
    (q.range52Pct != null && q.range52Pct >= 85) ||
    (q.pctFromAth != null && q.pctFromAth >= -5)
  ) {
    setup = "extended";
  } else if (q.trend === "bullish" || q.trend === "bearish") {
    setup = "trending";
  }

  const reason = bits.length ? bits.slice(0, 4).join(" · ") : "Neutral setup";
  if (score >= 3) return { label: "Lean buy", cls: "buy", reason, score, setup };
  if (score <= -3) return { label: "Lean sell", cls: "sell", reason, score, setup };
  return { label: "Watch", cls: "watch", reason, score, setup };
}

/** Quiet volume + mid RSI + near/under SMA50 + not at highs → coil before momentum. */
export function isPreMomentum(q: QuoteData | undefined): boolean {
  if (!q || q.price == null) return false;
  const volQuiet = q.volRatio != null && q.volRatio < 0.75;
  const rsi = q.rsi14;
  const rsiMid = rsi != null && rsi >= 35 && rsi <= 55;
  const vs50 = q.vsSma?.[50];
  const nearOrUnder50 = vs50 != null && vs50 > -12 && vs50 <= 3;
  const range = q.range52Pct;
  const notHigh = range == null || range < 70;
  const notAth = q.pctFromAth == null || q.pctFromAth < -8;
  return Boolean(volQuiet && rsiMid && nearOrUnder50 && notHigh && notAth);
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
