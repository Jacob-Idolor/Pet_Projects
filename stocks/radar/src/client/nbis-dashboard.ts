export {};

type AnyRecord = Record<string, any>;

const root = document.querySelector<HTMLElement>("#nbis-app");
const DATA_URL = root?.dataset.nbisUrl ?? "/nbis.json";

const esc = (value: unknown) => String(value ?? "").replace(/[&<>"']/g, (char) => ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#39;" })[char] ?? char);
const finite = (value: unknown): value is number => typeof value === "number" && Number.isFinite(value);
const money = (value: unknown, digits = 1) => finite(value) ? new Intl.NumberFormat("en-US", { maximumFractionDigits: digits }).format(value) : "—";
const usd = (value: unknown, digits = 1) => finite(value) ? `$${money(value, digits)}` : "—";
const compact = (value: unknown) => finite(value) ? new Intl.NumberFormat("en-US", { notation: "compact", maximumFractionDigits: 2 }).format(value) : "—";
const pct = (value: unknown, digits = 1) => finite(value) ? `${value > 0 ? "+" : ""}${value.toFixed(digits)}%` : "—";
const ratio = (value: unknown, digits = 2) => finite(value) ? `${value.toFixed(digits)}x` : "—";
const dateLabel = (value: unknown) => value ? new Intl.DateTimeFormat("en-US", { month: "short", day: "numeric", year: "numeric", timeZone: "UTC" }).format(new Date(String(value))) : "—";
const dateTime = (value: unknown) => value ? new Intl.DateTimeFormat("en-US", { dateStyle: "medium", timeStyle: "short", timeZone: "UTC" }).format(new Date(String(value))) + " UTC" : "—";
const safeUrl = (value: unknown) => { try { const url = new URL(String(value ?? ""), window.location.origin); return ["http:", "https:"].includes(url.protocol) ? url.href : "#"; } catch { return "#"; } };
const setText = (id: string, value: unknown) => { const element = document.getElementById(id); if (element) element.textContent = String(value ?? "—"); };
const tone = (value: unknown) => finite(value) ? value > 0 ? "tone-positive" : value < 0 ? "tone-negative" : "tone-neutral" : "tone-neutral";
const setStatus = (kind: "loading" | "ready" | "error", text: string) => { const element = document.getElementById("nbis-status"); if (element) { element.className = `nbis-status nbis-status--${kind}`; element.innerHTML = `<span class="nbis-status__dot" aria-hidden="true"></span>${esc(text)}`; } };

function metricRows(items: Array<[string, unknown, string?]>) {
  return items.map(([label, value, className]) => `<div class="nbis-metric-row"><span>${esc(label)}</span><strong class="${className ?? ""}">${esc(value)}</strong></div>`).join("");
}

function renderChart(history: AnyRecord[]) {
  const element = document.getElementById("nbis-chart");
  const points = history.filter((point) => finite(point.close));
  if (!element || points.length < 2) return;
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
  element.innerHTML = `<svg viewBox="0 0 ${width} ${height}" aria-hidden="true"><defs><linearGradient id="nbis-chart-fill" x1="0" x2="0" y1="0" y2="1"><stop offset="0" stop-color="#0f766e" stop-opacity=".18"/><stop offset="1" stop-color="#0f766e" stop-opacity="0"/></linearGradient></defs>${grid}<polygon class="nbis-chart__area" points="${area}"/><polyline class="nbis-chart__line" points="${line}"/>${labels}</svg>`;
  setText("nbis-chart-range", `${dateLabel(points[0].date)} → ${dateLabel(points.at(-1)?.date)}`);
}

function renderTable(id: string, rows: AnyRecord[], columns: Array<[string, string, (value: unknown) => string]>, firstLabel = "Period", firstKey = "period") {
  const element = document.getElementById(id);
  if (!element) return;
  if (!rows.length) { element.innerHTML = `<div class="nbis-empty">No statement data was available in this snapshot.</div>`; return; }
  element.innerHTML = `<table class="nbis-data-table"><thead><tr><th>${esc(firstLabel)}</th>${columns.map(([label]) => `<th>${esc(label)}</th>`).join("")}</tr></thead><tbody>${rows.map((row) => `<tr><td>${esc(row[firstKey] ?? row.end ?? "—")}</td>${columns.map(([, key, formatter]) => `<td>${esc(formatter(row[key]))}</td>`).join("")}</tr>`).join("")}</tbody></table>`;
}

function renderRiskList(id: string, items: AnyRecord[], catalyst = false) {
  const element = document.getElementById(id);
  if (!element) return;
  element.innerHTML = items.length ? `<div class="nbis-risk-list">${items.map((item) => `<article class="nbis-risk-item ${catalyst ? "nbis-risk-item--catalyst" : ""}"><strong>${esc(item.title)}</strong><p>${esc(item.detail)}</p></article>`).join("")}</div>` : `<div class="nbis-empty">No automated flags were produced.</div>`;
}

function render(data: AnyRecord) {
  const price = data.price ?? {};
  const technical = data.technical ?? {};
  const fundamentals = data.fundamentals ?? {};
  const quote = price.quote ?? price;
  const change = finite(price.change) ? price.change : finite(price.current) && finite(price.previousClose) ? price.current - price.previousClose : null;
  const changePercent = price.changePercent ?? price.changePct;
  const returns = technical.returns ?? {};
  setStatus(data.status === "ok" ? "ready" : "error", data.status === "ok" ? `Snapshot ${dateTime(data.fetchedAt)}` : "Snapshot unavailable — inspect source notes");
  setText("nbis-price", usd(price.current, 2));
  setText("nbis-change", `${usd(change, 2)} (${pct(changePercent)})`);
  document.getElementById("nbis-change")?.classList.add(tone(changePercent));
  setText("nbis-market-cap", compact(fundamentals.marketCap));
  setText("nbis-revenue-growth", pct(fundamentals.revenueGrowth));
  setText("nbis-fcf", usd(fundamentals.freeCashflow, 0));
  setText("nbis-price-meta", `As of ${dateTime(price.asOf ?? data.fetchedAt)} · ${esc(data.price?.provider ?? "market data provider")}`);

  const readouts = (data.research?.readouts ?? []) as AnyRecord[];
  const readoutElement = document.getElementById("nbis-readouts");
  if (readoutElement) readoutElement.innerHTML = readouts.length ? readouts.map((item) => `<article class="nbis-readout"><span class="nbis-readout__label">${esc(item.label)}</span><p>${esc(item.detail)}</p></article>`).join("") : `<div class="nbis-empty">No automated readouts were produced.</div>`;
  const quoteElement = document.getElementById("nbis-quote-table");
  if (quoteElement) quoteElement.innerHTML = metricRows([["Open", usd(quote.open, 2)], ["Day range", `${usd(quote.dayLow, 2)} – ${usd(quote.dayHigh, 2)}`], ["52-week range", `${usd(quote.fiftyTwoWeekLow, 2)} – ${usd(quote.fiftyTwoWeekHigh, 2)}`], ["Volume", compact(quote.volume)], ["Average volume", compact(quote.averageVolume)], ["Currency", quote.currency ?? "—"]]);
  const returnElement = document.getElementById("nbis-returns");
  if (returnElement) returnElement.innerHTML = Object.entries(returns).map(([label, value]) => `<div class="nbis-return"><span>${esc(label)}</span><strong class="${tone(value)}">${esc(pct(value))}</strong></div>`).join("");
  const technicalElement = document.getElementById("nbis-technicals");
  if (technicalElement) technicalElement.innerHTML = metricRows([["Trend", technical.trend ?? "—"], ["SMA 20", usd(technical.sma20, 2)], ["SMA 50", usd(technical.sma50, 2)], ["SMA 200", usd(technical.sma200, 2)], ["RSI 14", finite(technical.rsi14) ? technical.rsi14.toFixed(1) : "—"], ["Annualized volatility", pct(technical.annualizedVolatility)]]);
  renderChart(data.priceHistory ?? []);

  const statementColumns: Array<[string, string, (value: unknown) => string]> = [["Revenue", "revenue", (value) => usd(value, 0)], ["Operating income", "operatingIncome", (value) => usd(value, 0)], ["Net income", "netIncome", (value) => usd(value, 0)], ["Free cash flow", "freeCashFlow", (value) => usd(value, 0)]];
  renderTable("nbis-annual-table", data.statements?.annual ?? [], statementColumns);
  renderTable("nbis-quarterly-table", data.statements?.quarterly ?? [], statementColumns);
  const profitability = document.getElementById("nbis-profitability");
  if (profitability) profitability.innerHTML = metricRows([["Revenue growth", pct(fundamentals.revenueGrowth)], ["Gross margin", pct(fundamentals.grossMargin)], ["Operating margin", pct(fundamentals.operatingMargin)], ["Profit margin", pct(fundamentals.profitMargin)], ["EBITDA", usd(fundamentals.ebitda, 0)], ["Trailing EPS", usd(fundamentals.trailingEps, 2)]]);
  const balance = document.getElementById("nbis-balance-sheet");
  if (balance) balance.innerHTML = metricRows([["Cash", usd(fundamentals.cash, 0)], ["Debt", usd(fundamentals.totalDebt, 0)], ["Debt / equity", ratio(fundamentals.debtToEquity)], ["Operating cash flow", usd(fundamentals.operatingCashflow, 0)], ["Shares outstanding", compact(fundamentals.sharesOutstanding)], ["Float", compact(fundamentals.floatShares)]]);
  const valuation = document.getElementById("nbis-valuation-table");
  if (valuation) valuation.innerHTML = metricRows([["Enterprise value", compact(fundamentals.enterpriseValue)], ["Price / sales", ratio(fundamentals.priceToSales)], ["Forward P/E", ratio(fundamentals.forwardPe)], ["Trailing P/E", ratio(fundamentals.trailingPe)], ["Analyst target", usd(fundamentals.targetMeanPrice, 2)], ["Analyst count", money(fundamentals.numberOfAnalystOpinions, 0)]]);
  setText("nbis-scenario-note", data.scenarios?.assumptionNote ?? "Illustrative assumptions only.");
  renderTable("nbis-scenario-table", data.scenarios?.rows ?? [], [["Revenue CAGR", "revenueCagr3y", (value) => pct(value)], ["EV / revenue", "exitEvRevenue", (value) => ratio(value)], ["Illustrative EV", "enterpriseValue", (value) => compact(value)], ["Illustrative equity value", "equityValue", (value) => compact(value)], ["Implied price", "impliedPrice", (value) => usd(value, 2)]], "Scenario", "name");
  renderRiskList("nbis-risks", data.research?.risks ?? []);
  renderRiskList("nbis-catalysts", data.research?.catalysts ?? [], true);

  const filings = data.sec?.filings ?? [];
  setText("nbis-filing-count", `${filings.length} recent filings`);
  const filingElement = document.getElementById("nbis-filings-table");
  if (filingElement) filingElement.innerHTML = filings.length ? `<table class="nbis-data-table"><thead><tr><th>Filed</th><th>Form</th><th>Accession</th><th>Document</th></tr></thead><tbody>${filings.map((item: AnyRecord) => `<tr><td>${esc(dateLabel(item.filed))}</td><td>${esc(item.form)}</td><td class="nbis-mono">${esc(item.accession)}</td><td><a href="${esc(safeUrl(item.url))}" target="_blank" rel="noopener">Open ↗</a></td></tr>`).join("")}</tbody></table>` : `<div class="nbis-empty">No SEC filing data was available.</div>`;
  const facts = Object.entries(data.sec?.facts ?? {}).flatMap(([key, item]) => {
    const latest = (item as AnyRecord)?.annual?.[0];
    return latest ? [{ label: (item as AnyRecord).label ?? key, value: latest.value, period: latest.period, form: latest.form }] : [];
  });
  const factsElement = document.getElementById("nbis-sec-facts");
  if (factsElement) factsElement.innerHTML = facts.length ? `<table class="nbis-data-table"><thead><tr><th>Fact</th><th>Latest value</th><th>Period</th><th>Source</th></tr></thead><tbody>${facts.map((item: AnyRecord) => `<tr><td>${esc(item.label)}</td><td>${esc(item.value)}</td><td>${esc(item.period)}</td><td>${esc(item.form)}</td></tr>`).join("")}</tbody></table>` : `<div class="nbis-empty">No structured SEC facts were available.</div>`;
  const news = data.news ?? [];
  const newsElement = document.getElementById("nbis-news");
  if (newsElement) newsElement.innerHTML = news.length ? news.slice(0, 8).map((item: AnyRecord) => `<a class="nbis-news-item" href="${esc(safeUrl(item.link))}" target="_blank" rel="noopener"><strong>${esc(item.title)}</strong><span>${esc(item.publisher)} · ${esc(dateLabel(item.publishedAt))}</span></a>`).join("") : `<div class="nbis-empty">No provider headlines were available.</div>`;
}

async function loadSnapshot() {
  try {
    const response = await fetch(DATA_URL, { cache: "no-store" });
    if (!response.ok) throw new Error(`Snapshot request failed: ${response.status}`);
    render(await response.json());
  } catch (error) {
    console.error("NBIS snapshot failed", error);
    setStatus("error", "Snapshot unavailable — try again later");
    setText("nbis-price-meta", "The latest snapshot could not be loaded.");
  }
}

loadSnapshot();
