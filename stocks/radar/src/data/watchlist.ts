import raw from "./watchlist.json";

export type StockCategory = "tracking" | "owned" | "targets" | "watching";
export type StockPriority = "high" | "medium" | "low";

export interface Stock {
  id: string;
  symbol: string;
  name: string;
  category: StockCategory;
  lastPrice?: number;
  targetPrice?: number;
  targetNote?: string;
  thesis?: string;
  addedBy?: string;
  holder?: string;
  /** Theme labels — e.g. photonics, semi, mag7 */
  tags?: string[];
  /** Conviction / sizing signal */
  priority?: StockPriority;
  sector?: string;
}

export interface WatchlistMeta {
  groupName: string;
  tagline: string;
  lastUpdated: string;
}

export const categoryLabels: Record<
  StockCategory,
  { title: string; description: string; icon: string; short: string }
> = {
  tracking: {
    title: "Tracking list",
    description: "Every ticker on the radar — one unified list.",
    icon: "📈",
    short: "Tracking",
  },
  owned: {
    title: "Currently Holding",
    description: "Active positions — what you're in today.",
    icon: "💼",
    short: "Owned",
  },
  targets: {
    title: "Waiting on Price Targets",
    description: "Specific entry or trim levels — watch closely.",
    icon: "🎯",
    short: "Targets",
  },
  watching: {
    title: "Long-Term Watchlist",
    description: "On radar — track the thesis, wait for the setup.",
    icon: "👀",
    short: "Watching",
  },
};

export function formatPrice(value?: number): string {
  if (value == null || Number.isNaN(value)) return "—";
  return value.toLocaleString("en-US", {
    style: "currency",
    currency: "USD",
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  });
}

export function distanceToTarget(
  current?: number,
  target?: number
): { pct: number; label: string; direction: "above" | "below" | "at" } | null {
  if (current == null || target == null || target === 0) return null;
  const pct = ((current - target) / target) * 100;
  const abs = Math.abs(pct);
  if (abs < 0.5) {
    return { pct, label: "At target", direction: "at" };
  }
  if (pct > 0) {
    return { pct, label: `${abs.toFixed(1)}% above`, direction: "above" };
  }
  return { pct, label: `${abs.toFixed(1)}% below`, direction: "below" };
}

export const meta: WatchlistMeta = raw.meta;
export const stocks: Stock[] = raw.stocks;
