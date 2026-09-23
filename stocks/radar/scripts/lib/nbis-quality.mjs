/** Snapshot contract shared by CI, the fetcher and the browser. */
export const NBIS_MAX_AGE_HOURS = 30;
const finite = (value) => typeof value === "number" && Number.isFinite(value);
const object = (value) => value !== null && typeof value === "object" && !Array.isArray(value);
const timestamp = (value) => typeof value === "string" && Number.isFinite(Date.parse(value));

export function snapshotState(data, now = Date.now()) {
  if (data?.status !== "ok" || !timestamp(data?.fetchedAt)) {
    return { kind: "error", label: "UNAVAILABLE", message: "Snapshot unavailable or incomplete — inspect source notes." };
  }
  const age = (now - Date.parse(data.fetchedAt)) / 3600000;
  const stamp = new Date(data.fetchedAt).toISOString().replace("T", " ").slice(0, 16) + " UTC";
  if (age < -5 / 60) return { kind: "error", label: "INVALID TIME", message: `Snapshot timestamp is in the future: ${stamp}` };
  if (age > NBIS_MAX_AGE_HOURS) return { kind: "stale", label: "STALE", message: `Stale snapshot from ${stamp} — data may be outdated.` };
  return { kind: "ready", label: "DAILY", message: `Snapshot ${stamp} · updated ${Math.max(0, Math.floor(age))}h ago` };
}

/** @param {any} data @param {{requireFresh?: boolean, now?: number}} options */
export function validateNbisSnapshot(data, { requireFresh = false, now = Date.now() } = {}) {
  const errors = [];
  if (!object(data)) return ["snapshot must be an object"];
  if (data.schemaVersion !== 1) errors.push("schemaVersion must be 1");
  if (data.ticker !== "NBIS") errors.push("ticker must be NBIS");
  if (typeof data.company !== "string" || !data.company.trim()) errors.push("company missing");
  if (!["ok", "unavailable", "degraded"].includes(data.status)) errors.push("invalid snapshot status");
  if (!object(data.profile) || !Array.isArray(data.profile.businessLines)) errors.push("profile.businessLines missing");
  for (const key of ["price", "technical", "fundamentals", "statements", "sec", "scenarios", "research"]) {
    if (!object(data[key])) errors.push(`${key} must be an object`);
  }
  for (const [name, value] of Object.entries({
    annual: data.statements?.annual, quarterly: data.statements?.quarterly,
    filings: data.sec?.filings, scenarios: data.scenarios?.rows,
    risks: data.research?.risks, catalysts: data.research?.catalysts,
    readouts: data.research?.readouts, news: data.news, sources: data.sources, priceHistory: data.priceHistory,
  })) {
    if (!Array.isArray(value) || value.some((row) => !object(row))) errors.push(`${name} must be an array of objects`);
  }
  if (!object(data.sec?.facts)) errors.push("sec.facts must be an object map");
  if (errors.length) return errors;
  if (data.status === "ok") {
    if (!timestamp(data.fetchedAt)) errors.push("ok snapshot requires a valid fetchedAt timestamp");
    else if (Date.parse(data.fetchedAt) > now + 300000) errors.push("fetchedAt is in the future");
    if (!finite(data.price.current) || data.price.current <= 0) errors.push("ok snapshot requires a positive current price");
    if (data.priceHistory.length < 20) errors.push("ok snapshot requires at least 20 price points");
    let previous = "";
    for (const point of data.priceHistory) {
      if (!timestamp(point.date) || !/^\d{4}-\d{2}-\d{2}$/.test(point.date) || point.date <= previous || !finite(point.close) || point.close <= 0) {
        errors.push("price history must contain ordered, unique dates and positive finite closes");
        break;
      }
      previous = point.date;
    }
    if (!data.sec.filings.length) errors.push("ok snapshot requires SEC filings");
    if (!data.statements.annual.length || !data.statements.quarterly.length) errors.push("ok snapshot requires annual and quarterly statements");
  }
  if (requireFresh) {
    const state = snapshotState(data, now);
    if (state.kind !== "ready") errors.push(state.message);
    const latest = Date.parse(data.priceHistory.at(-1)?.date);
    // Allow weekends and market holidays without accepting an old provider series.
    if (!Number.isFinite(latest) || latest > now + 86400000 || now - latest > 7 * 86400000) errors.push("latest market close must be within seven days");
  }
  return errors;
}
