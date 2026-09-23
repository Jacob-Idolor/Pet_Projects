import { snapshotState } from "../../scripts/lib/nbis-quality.mjs";

type AnyRecord = Record<string, any>;

const esc = (value: unknown) => String(value ?? "").replace(/[&<>"']/g, (char) => ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#39;" })[char] ?? char);
const finite = (value: unknown): value is number => typeof value === "number" && Number.isFinite(value);
const money = (value: unknown, digits = 1) => finite(value) ? new Intl.NumberFormat("en-US", { maximumFractionDigits: digits }).format(value) : "—";
const usd = (value: unknown, digits = 1) => finite(value) ? `$${money(value, digits)}` : "—";
const compact = (value: unknown) => finite(value) ? new Intl.NumberFormat("en-US", { notation: "compact", maximumFractionDigits: 2 }).format(value) : "—";
export const pct = (value: unknown, digits = 1) => finite(value) ? `${value > 0 ? "+" : ""}${value.toFixed(digits)}%` : "—";
export const fractionPct = (value: unknown, digits = 1) => pct(finite(value) ? value * 100 : value, digits);
const ratio = (value: unknown, digits = 2) => finite(value) ? `${value.toFixed(digits)}x` : "—";
const dateLabel = (value: unknown) => value && Number.isFinite(Date.parse(String(value))) ? new Intl.DateTimeFormat("en-US", { month: "short", day: "numeric", year: "numeric", timeZone: "UTC" }).format(new Date(String(value))) : "—";
const dateTime = (value: unknown) => value && Number.isFinite(Date.parse(String(value))) ? new Intl.DateTimeFormat("en-US", { dateStyle: "medium", timeStyle: "short", timeZone: "UTC" }).format(new Date(String(value))) + " UTC" : "—";
const safeUrl = (value: unknown) => { try { const url = new URL(String(value ?? ""), "https://stockswatch.cc"); return ["http:", "https:"].includes(url.protocol) && !url.username && !url.password ? url.href : "#"; } catch { return "#"; } };
const tone = (value: unknown) => finite(value) ? value > 0 ? "tone-positive" : value < 0 ? "tone-negative" : "tone-neutral" : "tone-neutral";

/** Pure, escaped HTML shared by Astro build-time rendering and browser refresh. */
export function renderSnapshot(data: AnyRecord, now = Date.now()) {
  const html: Record<string, string> = {};
  const state = snapshotState(data, now);
  const setText = (id: string, value: unknown) => { html[id] = esc(value); };
  function metricRows(items: Array<[string, unknown, string?]>) {
    return items.map(([label, value, className]) => `<div class="nbis-metric-row"><span>${esc(label)}</span><strong class="${className ?? ""}">${esc(value)}</strong></div>`).join("");
  }

  function renderChart(history: AnyRecord[]) {
    const element = "nbis-chart";
    const points = history.filter((point) => finite(point.close));
    if (points.length < 2) { html[element] = `<div class="nbis-empty">No price history available.</div>`; return; }
    const width = 900;
    const height = 320;
    const pad = { top: 22, right: 20, bottom: 38, left: 54 };
    const values = points.map((point) => point.close as number);
    const min = Math.min(...values);
    const max = Math.max(...values);
    const span = max - min || 1;
    const x = (index: number) => pad.left + (index / (points.length - 1)) * (width - pad.left - pad.right);
    const y = (value: number) => pad.top + (1 - (value - min) / span) * (height - pad.top - pad.bottom);
    const line = points.map((point, index) => `${x(index).toFixed(1)},${y(point.close).toFixed(1)}`).join(" ");
    const area = `${pad.left},${height - pad.bottom} ${line} ${width - pad.right},${height - pad.bottom}`;
    const grid = [0, .5, 1].map((ratioValue) => { const value = max - ratioValue * span; const yValue = y(value); return `<line class="nbis-chart__grid" x1="${pad.left}" x2="${width - pad.right}" y1="${yValue}" y2="${yValue}"/><text class="nbis-chart__label" x="8" y="${yValue + 4}">${esc(usd(value))}</text>`; }).join("");
    const labels = [0, Math.floor(points.length / 2), points.length - 1].map((index) => `<text class="nbis-chart__label" x="${x(index)}" y="${height - 12}" text-anchor="middle">${esc(String(points[index].date ?? "").slice(0, 7))}</text>`).join("");
    html[element] = `<svg viewBox="0 0 ${width} ${height}" aria-hidden="true"><defs><linearGradient id="nbis-chart-fill" x1="0" x2="0" y1="0" y2="1"><stop offset="0" stop-color="#0f766e" stop-opacity=".18"/><stop offset="1" stop-color="#0f766e" stop-opacity="0"/></linearGradient></defs>${grid}<polygon class="nbis-chart__area" points="${area}"/><polyline class="nbis-chart__line" points="${line}"/>${labels}</svg>`;
    setText("nbis-chart-range", `${dateLabel(points[0].date)} → ${dateLabel(points.at(-1)?.date)}`);
  }

  function renderTable(id: string, rows: AnyRecord[], columns: Array<[string, string, (value: unknown) => string]>, firstLabel = "Period", firstKey = "period") {
    const element = id;
      if (!rows.length) { html[element] = `<div class="nbis-empty">No statement data was available in this snapshot.</div>`; return; }
    html[element] = `<table class="nbis-data-table"><thead><tr><th scope="col">${esc(firstLabel)}</th>${columns.map(([label]) => `<th scope="col">${esc(label)}</th>`).join("")}</tr></thead><tbody>${rows.map((row) => `<tr><td>${esc(row[firstKey] ?? row.end ?? "—")}</td>${columns.map(([, key, formatter]) => `<td>${esc(formatter(row[key]))}</td>`).join("")}</tr>`).join("")}</tbody></table>`;
  }

  function renderRiskList(id: string, items: AnyRecord[], catalyst = false) {
    const element = id;
      html[element] = items.length ? `<div class="nbis-risk-list">${items.map((item) => `<article class="nbis-risk-item ${catalyst ? "nbis-risk-item--catalyst" : ""}"><div class="nbis-risk-item__top"><span class="nbis-risk-item__tag">${esc(catalyst ? "Catalyst" : item.severity ?? "Watch")}</span><strong>${esc(item.title)}</strong></div><p>${esc(item.detail)}</p></article>`).join("")}</div>` : `<div class="nbis-empty">No automated flags were produced.</div>`;
  }

  function filingTable(rows: AnyRecord[]) {
    const body = rows.map((item) => {
      const filed = item.filingDate ?? item.filed;
      const accession = String(item.accessionNumber ?? item.accession ?? "—");
      const shortAccession = accession.split("-").at(-1) ?? accession;
      return `<tr><td>${esc(dateLabel(filed))}</td><td>${esc(item.form)}</td><td class="nbis-mono nbis-filing-accession" title="${esc(accession)}">${esc(shortAccession)}</td><td><a href="${esc(safeUrl(item.url))}" target="_blank" rel="noopener" aria-label="Open SEC filing ${esc(accession)}">Open ↗</a></td></tr>`;
    }).join("");
    return `<table class="nbis-data-table nbis-filings-table"><thead><tr><th scope="col">Filed</th><th scope="col">Form</th><th scope="col">ID</th><th scope="col">Document</th></tr></thead><tbody>${body}</tbody></table>`;
  }


  const price = data.price ?? {};
  const technical = data.technical ?? {};
  const fundamentals = data.fundamentals ?? {};
  const quote = price.quote ?? price;
  const change = finite(price.change) ? price.change : finite(price.current) && finite(price.previousClose) ? price.current - price.previousClose : null;
  const changePercent = price.changePercent ?? price.changePct;
  const returns = technical.returns ?? {};
  setText("nbis-status", state.message);
  setText("nbis-freshness", state.label);
  setText("nbis-price", usd(price.current, 2));
  setText("nbis-change", `${usd(change, 2)} (${pct(changePercent)})`);
  setText("nbis-market-cap", compact(fundamentals.marketCap));
  setText("nbis-revenue-growth", fractionPct(fundamentals.revenueGrowth));
  setText("nbis-fcf", usd(fundamentals.freeCashflow, 0));
  setText("nbis-price-meta", `As of ${dateTime(price.asOf ?? data.fetchedAt)} · ${data.price?.provider ?? "market data provider"}`);

  const readouts = (data.research?.readouts ?? []) as AnyRecord[];
  const readoutElement = "nbis-readouts";
  if (readoutElement) html[readoutElement] = readouts.length ? readouts.map((item, index) => `<article class="nbis-readout"><div class="nbis-readout__top"><span class="nbis-readout__index">${String(index + 1).padStart(2, "0")}</span><span class="nbis-readout__label">${esc(item.label)}</span></div><strong class="nbis-readout__value">${esc(item.value ?? "Context")}</strong><p class="nbis-readout__detail">${esc(item.detail)}</p></article>`).join("") : `<div class="nbis-empty">No automated readouts were produced.</div>`;
  const quoteElement = "nbis-quote-table";
  if (quoteElement) html[quoteElement] = metricRows([["Open", usd(quote.open, 2)], ["Day range", `${usd(quote.dayLow, 2)} – ${usd(quote.dayHigh, 2)}`], ["52-week range", `${usd(quote.fiftyTwoWeekLow, 2)} – ${usd(quote.fiftyTwoWeekHigh, 2)}`], ["Volume", compact(quote.volume)], ["Average volume", compact(quote.averageVolume)], ["Currency", quote.currency ?? "—"]]);
  const returnElement = "nbis-returns";
  if (returnElement) html[returnElement] = Object.entries(returns).map(([label, value]) => `<div class="nbis-return"><span>${esc(label)}</span><strong class="${tone(value)}">${esc(pct(value))}</strong></div>`).join("");
  const technicalElement = "nbis-technicals";
  if (technicalElement) html[technicalElement] = metricRows([["Trend", technical.trend ?? "—"], ["SMA 20", usd(technical.sma20, 2)], ["SMA 50", usd(technical.sma50, 2)], ["SMA 200", usd(technical.sma200, 2)], ["RSI 14", finite(technical.rsi14) ? technical.rsi14.toFixed(1) : "—"], ["Annualized volatility", pct(technical.annualizedVolatility)]]);
  renderChart(data.priceHistory ?? []);

  const statementColumns: Array<[string, string, (value: unknown) => string]> = [["Revenue", "revenue", (value) => usd(value, 0)], ["Operating income", "operatingIncome", (value) => usd(value, 0)], ["Net income", "netIncome", (value) => usd(value, 0)], ["Free cash flow", "freeCashFlow", (value) => usd(value, 0)]];
  renderTable("nbis-annual-table", data.statements?.annual ?? [], statementColumns);
  renderTable("nbis-quarterly-table", data.statements?.quarterly ?? [], statementColumns);
  const profitability = "nbis-profitability";
  if (profitability) html[profitability] = metricRows([["Revenue growth", fractionPct(fundamentals.revenueGrowth)], ["Gross margin", fractionPct(fundamentals.grossMargin)], ["Operating margin", fractionPct(fundamentals.operatingMargin)], ["Profit margin", fractionPct(fundamentals.profitMargin)], ["EBITDA", usd(fundamentals.ebitda, 0)], ["Trailing EPS", usd(fundamentals.trailingEps, 2)]]);
  const balance = "nbis-balance-sheet";
  if (balance) html[balance] = metricRows([["Cash", usd(fundamentals.cash, 0)], ["Debt", usd(fundamentals.totalDebt, 0)], ["Debt / equity", ratio(finite(fundamentals.debtToEquity) ? fundamentals.debtToEquity / 100 : null)], ["Operating cash flow", usd(fundamentals.operatingCashflow, 0)], ["Shares outstanding", compact(fundamentals.sharesOutstanding)], ["Float", compact(fundamentals.floatShares)]]);
  const valuation = "nbis-valuation-table";
  if (valuation) html[valuation] = metricRows([["Enterprise value", compact(fundamentals.enterpriseValue)], ["Price / sales", ratio(fundamentals.priceToSales)], ["Forward P/E", ratio(fundamentals.forwardPe)], ["Trailing P/E", ratio(fundamentals.trailingPe)], ["Analyst target", usd(fundamentals.targetMeanPrice, 2)], ["Analyst count", money(fundamentals.numberOfAnalystOpinions, 0)]]);
  setText("nbis-scenario-note", data.scenarios?.assumptionNote ?? "Illustrative assumptions only.");
  renderTable("nbis-scenario-table", data.scenarios?.rows ?? [], [["Revenue CAGR", "revenueCagr3y", (value) => fractionPct(value)], ["EV / revenue", "exitEvRevenue", (value) => ratio(value)], ["Illustrative EV", "enterpriseValue", (value) => compact(value)], ["Illustrative equity value", "equityValue", (value) => compact(value)], ["Implied price", "impliedPrice", (value) => usd(value, 2)]], "Scenario", "name");
  renderRiskList("nbis-risks", data.research?.risks ?? []);
  renderRiskList("nbis-catalysts", data.research?.catalysts ?? [], true);

  const filings = data.sec?.filings ?? [];
  setText("nbis-filing-count", `${filings.length} recent filings`);
  const filingElement = "nbis-filings-table";
  if (filingElement) {
    const preview = filings.slice(0, 8);
    const older = filings.slice(8);
    html[filingElement] = filings.length
      ? `${filingTable(preview)}${older.length ? `<details class="nbis-filings-more"><summary>Show ${older.length} older filings</summary>${filingTable(older)}</details>` : ""}`
      : `<div class="nbis-empty">No SEC filing data was available.</div>`;
  }
  const facts = Object.entries(data.sec?.facts ?? {}).flatMap(([key, item]) => {
    const latest = (item as AnyRecord)?.annual?.[0];
    return latest ? [{ label: (item as AnyRecord).label ?? key, value: latest.value, period: latest.period, form: latest.form }] : [];
  });
  const factsElement = "nbis-sec-facts";
  if (factsElement) html[factsElement] = facts.length ? `<table class="nbis-data-table"><thead><tr><th scope="col">Fact</th><th scope="col">Latest value</th><th scope="col">Period</th><th scope="col">Source</th></tr></thead><tbody>${facts.map((item: AnyRecord) => `<tr><td>${esc(item.label)}</td><td>${esc(item.value)}</td><td>${esc(item.period)}</td><td>${esc(item.form)}</td></tr>`).join("")}</tbody></table>` : `<div class="nbis-empty">No structured SEC facts were available.</div>`;
  const news = data.news ?? [];
  const newsElement = "nbis-news";
  if (newsElement) html[newsElement] = news.length ? news.slice(0, 8).map((item: AnyRecord) => `<a class="nbis-news-item" href="${esc(safeUrl(item.url ?? item.link))}" target="_blank" rel="noopener"><strong>${esc(item.title)}</strong><span>${esc(item.publisher)} · ${esc(dateLabel(item.published ?? item.publishedAt))}</span></a>`).join("") : `<div class="nbis-empty">No provider headlines were available.</div>`;


  return { html, state };
}
