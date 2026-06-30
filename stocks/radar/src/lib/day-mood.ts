export type DayMood = "bullish" | "bearish" | "mixed" | "unknown";

export interface DayMoodQuote {
  changePct: number | null;
}

export interface DayMoodInput {
  symbol: string;
  category?: string;
}

export interface DayMoodResult {
  mood: DayMood;
  up: number;
  down: number;
  flat: number;
  total: number;
  avgChange: number | null;
  title: string;
  description: string;
  hint: string;
}

const FLAT_THRESHOLD = 0.05;

/** Weight owned names slightly more when judging the group's day. */
function weightFor(category?: string) {
  return category === "owned" ? 2 : 1;
}

export function computeDayMood(
  quotes: Record<string, DayMoodQuote>,
  stocks: DayMoodInput[]
): DayMoodResult {
  let up = 0;
  let down = 0;
  let flat = 0;
  let weightedUp = 0;
  let weightedDown = 0;
  let weightedSum = 0;
  let weightTotal = 0;
  let counted = 0;

  for (const { symbol, category } of stocks) {
    const chg = quotes[symbol]?.changePct;
    if (chg == null || Number.isNaN(chg)) continue;

    const w = weightFor(category);
    counted++;
    weightedSum += chg * w;
    weightTotal += w;

    if (chg > FLAT_THRESHOLD) {
      up++;
      weightedUp += w;
    } else if (chg < -FLAT_THRESHOLD) {
      down++;
      weightedDown += w;
    } else {
      flat++;
    }
  }

  if (counted === 0) {
    return {
      mood: "unknown",
      up: 0,
      down: 0,
      flat: 0,
      total: 0,
      avgChange: null,
      title: "Reading the tape…",
      description: "Waiting for live quotes",
      hint: "",
    };
  }

  const avgChange = weightTotal > 0 ? weightedSum / weightTotal : null;
  const upShare = up / counted;
  const downShare = down / counted;

  let mood: DayMood = "mixed";

  if (weightedUp > weightedDown * 1.35 && (avgChange ?? 0) >= 0.1) {
    mood = "bullish";
  } else if (weightedDown > weightedUp * 1.35 && (avgChange ?? 0) <= -0.1) {
    mood = "bearish";
  } else if (upShare >= 0.65 && (avgChange ?? 0) >= 0) {
    mood = "bullish";
  } else if (downShare >= 0.65 && (avgChange ?? 0) <= 0) {
    mood = "bearish";
  } else if ((avgChange ?? 0) > 0.35 && up > down) {
    mood = "bullish";
  } else if ((avgChange ?? 0) < -0.35 && down > up) {
    mood = "bearish";
  }

  const avgTxt =
    avgChange != null
      ? `avg ${avgChange >= 0 ? "+" : ""}${avgChange.toFixed(2)}%`
      : "";

  const titles: Record<DayMood, string> = {
    bullish: "Bullish day",
    bearish: "Bearish day",
    mixed: "Mixed day",
    unknown: "Reading the tape…",
  };

  const hints: Record<DayMood, string> = {
    bullish: "Watchlist leaning green — more names up than down today.",
    bearish: "Watchlist leaning red — more names down than up today.",
    mixed: "No clear edge — winners and losers balanced across the list.",
    unknown: "",
  };

  let description: string;
  if (mood === "bullish") {
    description = `${up} of ${counted} up · ${down} down${avgTxt ? ` · ${avgTxt}` : ""}`;
  } else if (mood === "bearish") {
    description = `${down} of ${counted} down · ${up} up${avgTxt ? ` · ${avgTxt}` : ""}`;
  } else {
    description = `${up} up · ${down} down · ${flat} flat${avgTxt ? ` · ${avgTxt}` : ""}`;
  }

  return {
    mood,
    up,
    down,
    flat,
    total: counted,
    avgChange,
    title: titles[mood],
    description,
    hint: hints[mood],
  };
}

export function isUsMarketOpen(now = new Date()) {
  const et = new Date(now.toLocaleString("en-US", { timeZone: "America/New_York" }));
  const day = et.getDay();
  if (day === 0 || day === 6) return false;
  const mins = et.getHours() * 60 + et.getMinutes();
  return mins >= 570 && mins < 960;
}
