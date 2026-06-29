import type { Stock, StockCategory } from "../data/watchlist";
import { stocks } from "../data/watchlist";

export function stocksByCategory(category: StockCategory): Stock[] {
  return stocks.filter((s) => s.category === category);
}

export function allTags(list: Stock[]): string[] {
  const set = new Set<string>();
  for (const s of list) {
    for (const t of s.tags ?? []) set.add(t);
  }
  return [...set].sort();
}

export function escapeHtml(text: string): string {
  return text
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;");
}

export function yahooUrl(symbol: string): string {
  return `https://finance.yahoo.com/quote/${encodeURIComponent(symbol)}`;
}
