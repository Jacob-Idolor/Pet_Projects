/// <reference types="astro/client" />

interface ImportMetaEnv {
  readonly SITE?: string;
  readonly BASE_URL: string;
  readonly DEV: boolean;
  readonly PROD: boolean;
  readonly MODE: string;
  readonly PUBLIC_ADSENSE_CLIENT?: string;
  readonly PUBLIC_ADSENSE_ENABLED?: string;
  readonly PUBLIC_ADSENSE_PREVIEW?: string;
  readonly PUBLIC_ADSENSE_SLOT_HERO?: string;
  readonly PUBLIC_ADSENSE_SLOT_BOARD?: string;
  readonly PUBLIC_ADSENSE_SLOT_FOOTER?: string;
  readonly PUBLIC_ADSENSE_VERIFY_META?: string;
  readonly PUBLIC_ADSENSE_ALLOW_HERO?: string;
  readonly PUBLIC_WEB3FORMS_ACCESS_KEY?: string;
  readonly STOCKS_RADAR_SITE?: string;
  readonly STOCKS_RADAR_ENV?: string;
  /** Allow reading other PUBLIC_/STOCKS_ keys without casting at every call site */
  readonly [key: string]: string | boolean | undefined;
}

interface ImportMeta {
  readonly env: ImportMetaEnv;
}
