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
  const fromImport = import.meta.env[name];
  if (typeof fromImport === "string" && fromImport.trim()) return fromImport.trim();
  // Build-time Node env (STOCKS_RADAR_ENV, etc. — not PUBLIC_*)
  if (typeof process !== "undefined" && process.env?.[name]) {
    return String(process.env[name]).trim();
  }
  return "";
}

function resolveEnvironment(fallback: SiteEnvironment): SiteEnvironment {
  const fromEnv = env("STOCKS_RADAR_ENV");
  if (fromEnv === "production" || fromEnv === "staging" || fromEnv === "development") {
    return fromEnv;
  }
  // Single live site: production builds never bake "development" into HTML
  if (
    import.meta.env.PROD ||
    env("DEPLOY_PROVIDER") === "github-actions" ||
    Boolean(env("GITHUB_ACTIONS"))
  ) {
    return "production";
  }
  return fallback;
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
    app: {
      ...base.app,
      environment: resolveEnvironment(base.app.environment),
    },
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
    app: {
      name: s.app.name,
      version: s.app.version,
      environment: s.app.environment,
    },
    features: {
      // Omit ops-only flags from the browser payload
      adsense: s.features.adsense !== false,
      personalAlerts: s.features.personalAlerts === true,
      groupSubmissions: s.features.groupSubmissions !== false,
      checkInPulse: s.features.checkInPulse !== false,
      technicalView: s.features.technicalView !== false,
      dayMood: s.features.dayMood !== false,
    },
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
