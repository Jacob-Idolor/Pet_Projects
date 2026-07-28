/**
 * Lightweight headline sentiment for Stocks Radar.
 * Heuristic lexicon — not an LLM. Good enough for a group chat check.
 */

const POSITIVE_PHRASES = [
  "raises guidance",
  "raised guidance",
  "beats estimates",
  "beat estimates",
  "tops estimates",
  "price target raised",
  "upgraded to",
  "initiates buy",
  "initiates overweight",
  "strong demand",
  "record revenue",
  "record high",
  "all-time high",
  "better than expected",
  "above expectations",
];

const NEGATIVE_PHRASES = [
  "cuts guidance",
  "cut guidance",
  "lowers guidance",
  "lowered guidance",
  "misses estimates",
  "missed estimates",
  "below expectations",
  "worse than expected",
  "price target cut",
  "downgraded to",
  "initiates sell",
  "initiates underweight",
  "demand slowdown",
  "demand weak",
  "accounting probe",
  "sec probe",
  "class action",
];

const POSITIVE_WORDS = [
  "surge",
  "surges",
  "soar",
  "soars",
  "rally",
  "rallies",
  "jump",
  "jumps",
  "gain",
  "gains",
  "climb",
  "climbs",
  "rise",
  "rises",
  "upgrade",
  "upgrades",
  "upgraded",
  "outperform",
  "outperforms",
  "bullish",
  "breakout",
  "approval",
  "approved",
  "win",
  "wins",
  "won",
  "contract",
  "contracts",
  "partnership",
  "deal",
  "boost",
  "boosts",
  "growth",
  "strong",
  "beat",
  "beats",
  "record",
  "upside",
  "accelerate",
  "accelerates",
  "expand",
  "expands",
  "optimistic",
];

const NEGATIVE_WORDS = [
  "plunge",
  "plunges",
  "sink",
  "sinks",
  "slide",
  "slides",
  "slump",
  "slumps",
  "drop",
  "drops",
  "fall",
  "falls",
  "fell",
  "crash",
  "crashes",
  "selloff",
  "sell-off",
  "downgrade",
  "downgrades",
  "downgraded",
  "miss",
  "misses",
  "missed",
  "cut",
  "cuts",
  "weak",
  "weakness",
  "warning",
  "lawsuit",
  "probe",
  "investigation",
  "fraud",
  "bankruptcy",
  "layoff",
  "layoffs",
  "delay",
  "delays",
  "recall",
  "bearish",
  "pressure",
  "pressures",
  "concern",
  "concerns",
  "question",
  "questions",
  "slowdown",
  "decline",
  "declines",
  "tumble",
  "tumbles",
  "slash",
  "slashes",
  "risk",
  "risks",
];

function escapeRe(s) {
  return s.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
}

function hasPhrase(text, phrase) {
  return text.includes(phrase);
}

function hasWord(text, word) {
  const re = new RegExp(`\\b${escapeRe(word)}\\b`, "i");
  return re.test(text);
}

/**
 * @param {string} title
 * @returns {{ sentiment: 'positive'|'negative'|'neutral', score: number, hits: string[] }}
 */
export function classifyHeadline(title) {
  const text = String(title || "")
    .toLowerCase()
    .replace(/[%$,]/g, " ");
  if (!text.trim()) {
    return { sentiment: "neutral", score: 0, hits: [] };
  }

  let score = 0;
  const hits = [];

  for (const phrase of POSITIVE_PHRASES) {
    if (hasPhrase(text, phrase)) {
      score += 2;
      hits.push(phrase);
    }
  }
  for (const phrase of NEGATIVE_PHRASES) {
    if (hasPhrase(text, phrase)) {
      score -= 2;
      hits.push(phrase);
    }
  }
  for (const word of POSITIVE_WORDS) {
    if (hasWord(text, word)) {
      score += 1;
      hits.push(word);
    }
  }
  for (const word of NEGATIVE_WORDS) {
    if (hasWord(text, word)) {
      score -= 1;
      hits.push(word);
    }
  }

  let sentiment = "neutral";
  if (score > 0) sentiment = "positive";
  else if (score < 0) sentiment = "negative";

  return { sentiment, score, hits: [...new Set(hits)].slice(0, 6) };
}

/**
 * @param {Array<{ title?: string, sentiment?: string }>} news
 */
export function summarizeNews(news) {
  const items = Array.isArray(news) ? news : [];
  let positive = 0;
  let negative = 0;
  let neutral = 0;

  for (const n of items) {
    const s = n.sentiment || classifyHeadline(n.title || "").sentiment;
    if (s === "positive") positive += 1;
    else if (s === "negative") negative += 1;
    else neutral += 1;
  }

  const net = positive - negative;
  let tilt = "neutral";
  if (positive > 0 && negative > 0 && Math.abs(net) <= 1) tilt = "mixed";
  else if (net >= 1) tilt = "positive";
  else if (net <= -1) tilt = "negative";

  // Clear tape gets ±2; single-headline lean gets ±1; mixed/neutral = 0
  let scoreDelta = 0;
  if (tilt === "positive" && net >= 2) scoreDelta = 2;
  else if (tilt === "negative" && net <= -2) scoreDelta = -2;
  else if (tilt === "positive") scoreDelta = 1;
  else if (tilt === "negative") scoreDelta = -1;

  const sign = scoreDelta > 0 ? `+${scoreDelta}` : String(scoreDelta);
  const label =
    tilt === "mixed"
      ? `News check: mixed (${positive}+ / ${negative}−)`
      : tilt === "neutral"
        ? `News check: quiet / neutral (${items.length} headline${items.length === 1 ? "" : "s"})`
        : `News check: ${tilt} (${sign}) · ${positive}+ / ${negative}−`;

  return {
    tilt,
    positive,
    negative,
    neutral,
    net,
    scoreDelta,
    label,
    method: "headline-lexicon-v1",
  };
}

export function annotateNews(news) {
  const items = (Array.isArray(news) ? news : []).map((n) => {
    const c = classifyHeadline(n.title || "");
    return {
      ...n,
      sentiment: c.sentiment,
      sentimentScore: c.score,
      sentimentHits: c.hits,
    };
  });
  return {
    news: items,
    newsCheck: summarizeNews(items),
  };
}
