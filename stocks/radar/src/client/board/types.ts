declare global {
  interface Window {
    __DC_BRIDGE__?: {
      byTicker: Record<
        string,
        {
          ticker: string;
          primary: { id: string; label: string; name: string; exposure?: string };
          layers: { id: string; label: string; name: string; exposure?: string }[];
        }
      >;
    };
    __RADAR_SETTINGS__?: Record<string, unknown>;
  }
}

export interface StockRow {
  id: string;
  symbol: string;
  name: string;
  category: string;
  lastPrice?: number;
  targetPrice?: number;
  targetNote?: string;
  thesis?: string;
  addedBy?: string;
  holder?: string;
  tags?: string[];
  priority?: string;
  sector?: string;
  custom?: boolean;
  catalyst?: string;
  valuation?: {
    bias?: "cheap" | "fair" | "rich" | "unknown" | string;
    note?: string;
  };
}

export interface Prefs {
  viewMode?: "table" | "technical";
  pageSize?: number;
  sortKey?: string;
  filter?: string;
}
