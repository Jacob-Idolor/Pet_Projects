/**
 * Bridge between StocksWatch home and the AI Data Center universe.
 * Build-time index only — no screener scoring (that stays on /datacenter.html).
 */
import universe from "../data/datacenter-universe.json";

export type DcLayerId =
  | "land"
  | "power"
  | "cooling"
  | "compute"
  | "networking"
  | "software"
  | string;

export interface DcLayerRef {
  id: DcLayerId;
  /** Short label for chips (e.g. "Compute") */
  label: string;
  /** Full layer name from universe */
  name: string;
  exposure?: string;
}

export interface DcTickerBridge {
  ticker: string;
  layers: DcLayerRef[];
  /** Primary (first) layer for compact badges */
  primary: DcLayerRef;
}

export interface DcBridgePayload {
  tickerCount: number;
  layerCount: number;
  layers: { id: string; label: string; name: string; count: number }[];
  byTicker: Record<string, DcTickerBridge>;
}

const LAYER_LABELS: Record<string, string> = {
  land: "Land & Shell",
  power: "Power",
  cooling: "Cooling",
  compute: "Compute",
  networking: "Networking",
  software: "Software",
};

function shortLabel(id: string, fullName: string): string {
  if (LAYER_LABELS[id]) return LAYER_LABELS[id];
  return fullName.replace(/^Layer\s+\d+\s*[—–-]\s*/i, "").trim() || id;
}

/** Build the shared bridge index from datacenter-universe.json. */
export function buildDatacenterBridge(): DcBridgePayload {
  const byTicker: Record<string, DcTickerBridge> = {};
  const layerSummaries: DcBridgePayload["layers"] = [];

  for (const layer of universe.layers ?? []) {
    const holdings = layer.holdings ?? [];
    layerSummaries.push({
      id: layer.id,
      label: shortLabel(layer.id, layer.name),
      name: layer.name,
      count: holdings.length,
    });

    for (const h of holdings) {
      const ticker = String(h.ticker || "")
        .trim()
        .toUpperCase();
      if (!ticker) continue;
      const ref: DcLayerRef = {
        id: layer.id,
        label: shortLabel(layer.id, layer.name),
        name: layer.name,
        exposure: h.exposure,
      };
      if (!byTicker[ticker]) {
        byTicker[ticker] = { ticker, layers: [ref], primary: ref };
      } else {
        byTicker[ticker].layers.push(ref);
      }
    }
  }

  return {
    tickerCount: Object.keys(byTicker).length,
    layerCount: layerSummaries.length,
    layers: layerSummaries,
    byTicker,
  };
}

export function dcEntryForSymbol(
  bridge: DcBridgePayload,
  symbol: string | undefined | null,
): DcTickerBridge | undefined {
  if (!symbol) return undefined;
  return bridge.byTicker[String(symbol).trim().toUpperCase()];
}

/** Deep-link into the Data Center screener for a ticker or layer. */
export function datacenterHref(
  base: string,
  opts: { ticker?: string; layer?: string } = {},
): string {
  const root = base.endsWith("/") ? base : `${base}/`;
  const url = new URL("datacenter.html", `https://stockswatch.local${root}`);
  if (opts.ticker) url.searchParams.set("q", opts.ticker.toUpperCase());
  if (opts.layer) url.searchParams.set("layer", opts.layer);
  return `${root}datacenter.html${url.search}`;
}
