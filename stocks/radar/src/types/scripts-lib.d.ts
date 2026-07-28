declare module "../../scripts/lib/sanitize.mjs" {
  export function escapeHtml(text: string): string;
  export function sanitizeSymbol(raw: unknown): string;
  export function sanitizeId(raw: unknown): string;
  export function safeHttpUrl(raw: unknown, fallback?: string): string;
}

declare module "../../scripts/lib/adsense-policy.mjs" {
  export function isCustomDomain(url: string): boolean;
  export function hasPublisherContent(tickerCount: number, minTickers?: number): boolean;
  export function canShowAdSlot(
    config: {
      allowedPlacements?: Record<string, boolean>;
      preview?: boolean;
      enabled?: boolean;
      client?: string;
      slots?: Record<string, string>;
    },
    placement: string
  ): boolean;
  export function evaluateLiveAdsGate(opts: {
    client: string;
    enabledFlag: string;
    preview: boolean;
    siteUrl: string;
    requireCustomDomain: boolean;
    tickerCount: number;
    minTickers?: number;
  }): { enabled: boolean; blockReason: string | null };
}
