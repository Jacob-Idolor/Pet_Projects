export type StockCategory = "owned" | "targets" | "watching";

export interface Stock {
  id: string;
  symbol: string;
  name: string;
  category: StockCategory;
  /** Manual baseline price — live quote overlays when available */
  lastPrice?: number;
  targetPrice?: number;
  /** Short note on why this target matters */
  targetNote?: string;
  /** One-liner thesis / projection */
  thesis?: string;
  /** Who flagged this ticker (initials or name) */
  addedBy?: string;
  /** For owned positions — whose bag is it */
  holder?: string;
}

export interface WatchlistMeta {
  groupName: string;
  tagline: string;
  lastUpdated: string;
}

export const meta: WatchlistMeta = {
  groupName: "The Radar",
  tagline: "What we own, what we're waiting on, and what we're watching long-term.",
  lastUpdated: "2026-06-29",
};

/** Edit this file (or swap in your own JSON) to update the shared watchlist. */
export const stocks: Stock[] = [
  {
    id: "nvda-owned",
    symbol: "NVDA",
    name: "NVIDIA",
    category: "owned",
    lastPrice: 135.5,
    targetPrice: 180,
    targetNote: "Trim 25% above $175",
    thesis: "AI infra leader — holding through next earnings, watching data-center guidance.",
    addedBy: "J",
    holder: "J",
  },
  {
    id: "aapl-owned",
    symbol: "AAPL",
    name: "Apple",
    category: "owned",
    lastPrice: 198.2,
    thesis: "Core compounder — services mix keeps improving.",
    addedBy: "M",
    holder: "M",
  },
  {
    id: "pltr-targets",
    symbol: "PLTR",
    name: "Palantir",
    category: "targets",
    lastPrice: 24.8,
    targetPrice: 18,
    targetNote: "Starter position if it pulls back to $18–19",
    thesis: "Like the gov + commercial story, want a better entry.",
    addedBy: "K",
  },
  {
    id: "cost-targets",
    symbol: "COST",
    name: "Costco",
    category: "targets",
    lastPrice: 892.0,
    targetPrice: 820,
    targetNote: "Buy zone on a 5–8% dip",
    thesis: "Quality compounder — patience for a sale.",
    addedBy: "J",
  },
  {
    id: "amd-watching",
    symbol: "AMD",
    name: "Advanced Micro Devices",
    category: "watching",
    lastPrice: 162.4,
    targetPrice: 200,
    targetNote: "Re-evaluate if MI300 share gains accelerate",
    thesis: "GPU/CPU competition with NVDA — watching data-center wins.",
    addedBy: "M",
  },
  {
    id: "v-watching",
    symbol: "V",
    name: "Visa",
    category: "watching",
    lastPrice: 278.6,
    thesis: "Payments toll road — long-term hold candidate, not urgent.",
    addedBy: "K",
  },
  {
    id: "tsla-watching",
    symbol: "TSLA",
    name: "Tesla",
    category: "watching",
    lastPrice: 248.5,
    targetPrice: 200,
    targetNote: "Interesting again sub-$200 on FSD progress",
    thesis: "Volatility play — only on a deep pullback.",
    addedBy: "J",
  },
];

export const categoryLabels: Record<
  StockCategory,
  { title: string; description: string; icon: string }
> = {
  owned: {
    title: "Currently Holding",
    description: "Positions we're in — the ones we talk about every week.",
    icon: "💼",
  },
  targets: {
    title: "Waiting on Price Targets",
    description: "On the radar with a specific entry or trim level in mind.",
    icon: "🎯",
  },
  watching: {
    title: "Long-Term Watchlist",
    description: "Keeping an eye on — no rush, just tracking the thesis.",
    icon: "👀",
  },
};

export function stocksByCategory(category: StockCategory): Stock[] {
  return stocks.filter((s) => s.category === category);
}

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
    return { pct, label: `${abs.toFixed(1)}% above target`, direction: "above" };
  }
  return { pct, label: `${abs.toFixed(1)}% below target`, direction: "below" };
}
