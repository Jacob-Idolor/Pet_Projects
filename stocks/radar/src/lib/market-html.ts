import { escapeHtml, safeHttpUrl } from "./format";
import {
  type QuoteData,
  type NewsCheck,
  fmtPrice,
  fmtPct,
  fmtVolume,
  rsiLabel,
  trendBadge,
  rangeBar,
  athIndicator,
  hasTechnical,
  actionBadge,
  actionBias,
} from "./market-format";

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
