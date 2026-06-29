import raw from "./watchlist.json";

export type StockCategory = "owned" | "targets" | "watching";

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
}

export interface WatchlistMeta {
  groupName: string;
  tagline: string;
  lastUpdated: string;
}

export const meta: WatchlistMeta = raw.meta;
export const stocks: Stock[] = raw.stocks;

export const categoryLabels: Record<
  StockCategory,
  { title: string; description: string; icon: string; short: string }
> = {
  owned: {
    title: "Currently Holding",
    description: "Positions we're in.",
    icon: "💼",
    short: "Owned",
  },
  targets: {
    title: "Waiting on Price Targets",
    description: "Specific entry or trim levels.",
    icon: "🎯",
    short: "Targets",
  },
  watching: {
    title: "Long-Term Watchlist",
    description: "Keeping an eye on — no rush.",
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
