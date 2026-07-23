import raw from "../data/site-settings.json";

export type SiteEnvironment = "development" | "staging" | "production";

export interface SiteSettings {
  app: {
    name: string;
    version: string;
    environment: SiteEnvironment;
  };
  features: Record<string, boolean>;
  quotes: {
    staleAfterHours: number;
    pollIntervalMs: number;
    browserFallback: boolean;
    yahooChunkSize?: number;
    yahooMaxRetries?: number;
  };
  board: {
    defaultPageSize: number;
    defaultSort: string;
    defaultView: "table" | "technical";
    pageSizeOptions: number[];
  };
  alerts: {
    defaultCooldownHours: number;
    nearTargetPct: number;
    minBuyScore: number;
    onlyOnSignal: boolean;
  };
  seo?: {
    requireCustomDomainForAds?: boolean;
  };
  ops?: {
    healthPath?: string;
    settingsPath?: string;
    budgetUsd?: number;
  };
}

function env(name: string): string {
  const v = import.meta.env[name];
  return typeof v === "string" ? v.trim() : "";
}

/** Build-time site settings with env overlays for Astro pages. */
export function getSiteSettings(): SiteSettings {
  const base = raw as SiteSettings;
  const staleOverride = env("PUBLIC_QUOTES_STALE_AFTER_HOURS") || env("QUOTES_STALE_AFTER_HOURS");
  const staleAfterHours = staleOverride
    ? Number(staleOverride) || base.quotes.staleAfterHours
    : base.quotes.staleAfterHours;

  return {
    ...base,
    quotes: {
      ...base.quotes,
      staleAfterHours,
    },
  };
}

export function featureEnabled(name: keyof SiteSettings["features"] | string): boolean {
  const s = getSiteSettings();
  return s.features[name] !== false;
}

/** Safe payload for client scripts (injected as JSON). */
export function clientSettingsPayload() {
  const s = getSiteSettings();
  return {
    app: s.app,
    features: s.features,
    quotes: {
      staleAfterHours: s.quotes.staleAfterHours,
      pollIntervalMs: s.quotes.pollIntervalMs,
      browserFallback: s.quotes.browserFallback,
    },
    board: s.board,
    alerts: {
      defaultCooldownHours: s.alerts.defaultCooldownHours,
      nearTargetPct: s.alerts.nearTargetPct,
      minBuyScore: s.alerts.minBuyScore,
    },
  };
}
