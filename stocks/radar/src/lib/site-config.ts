import raw from "../data/site-settings.json";

export type SiteEnvironment = "development" | "staging" | "production";

export interface SiteSettings {
  app: {
    name: string;
    version: string;
    environment: SiteEnvironment;
  };
  features: Record<string, boolean>;
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
  if (
    import.meta.env.PROD ||
    env("DEPLOY_PROVIDER") === "github-actions" ||
    Boolean(env("GITHUB_ACTIONS"))
  ) {
    return "production";
  }
  return fallback;
}

export function getSiteSettings(): SiteSettings {
  const base = raw as SiteSettings;
  return {
    ...base,
    app: {
      ...base.app,
      environment: resolveEnvironment(base.app.environment),
    },
  };
}

export function featureEnabled(name: keyof SiteSettings["features"] | string): boolean {
  return getSiteSettings().features[name] !== false;
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
      adsense: s.features.adsense !== false,
    },
  };
}
