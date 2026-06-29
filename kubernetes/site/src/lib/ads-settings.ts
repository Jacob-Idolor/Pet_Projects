/** Google AdSense settings — stored in localStorage (personal site, no server) */

export const AD_SETTINGS_KEY = "k8s-lab-ad-settings";

export interface AdSettings {
  /** Master switch — ads hidden when false */
  enabled: boolean;
  /** e.g. ca-pub-1234567890123456 */
  clientId: string;
  /** Optional — one slot ID reused for all placements (simplest setup) */
  defaultSlotId: string;
  /** Show styled placeholders when enabled but no client ID (practice mode) */
  previewPlaceholders: boolean;
}

export function defaultAdSettings(): AdSettings {
  return {
    enabled: false,
    clientId: "",
    defaultSlotId: "",
    previewPlaceholders: true,
  };
}

export function loadAdSettings(): AdSettings {
  try {
    const raw = localStorage.getItem(AD_SETTINGS_KEY);
    if (!raw) return defaultAdSettings();
    return { ...defaultAdSettings(), ...JSON.parse(raw) };
  } catch {
    return defaultAdSettings();
  }
}

export function saveAdSettings(settings: AdSettings): void {
  localStorage.setItem(AD_SETTINGS_KEY, JSON.stringify(settings));
}

export function isValidClientId(id: string): boolean {
  return /^ca-pub-\d+$/.test(id.trim());
}

let scriptLoading: Promise<void> | null = null;

/** Load the AdSense script once per page when ads are enabled with a valid client ID */
export function loadAdSenseScript(clientId: string): Promise<void> {
  if (typeof window === "undefined") return Promise.resolve();
  const existing = document.querySelector(`script[data-adsense-client="${clientId}"]`);
  if (existing) return Promise.resolve();

  if (!scriptLoading) {
    scriptLoading = new Promise((resolve, reject) => {
      const s = document.createElement("script");
      s.async = true;
      s.src = `https://pagead2.googlesyndication.com/pagead/js/adsbygoogle.js?client=${clientId}`;
      s.crossOrigin = "anonymous";
      s.dataset.adsenseClient = clientId;
      s.onload = () => resolve();
      s.onerror = () => reject(new Error("AdSense script failed to load"));
      document.head.appendChild(s);
    });
  }
  return scriptLoading;
}

export function pushAdSlot(ins: HTMLElement): void {
  try {
    (window as unknown as { adsbygoogle: unknown[] }).adsbygoogle =
      (window as unknown as { adsbygoogle: unknown[] }).adsbygoogle || [];
    (window as unknown as { adsbygoogle: unknown[] }).adsbygoogle.push({});
  } catch {
    /* ad blockers or script not ready */
  }
}
