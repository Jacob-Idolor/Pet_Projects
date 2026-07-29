#!/usr/bin/env node
/**
 * Outlook layer — valuations, news, and macro rates.
 * Friend feedback: these matter more than technical momentum for individual stocks;
 * for macro, rates / bonds / yields frame the tape.
 *
 * Writes public/outlook.json (merged into board UI). Safe to fail soft — quotes still work.
 *
 *   node scripts/fetch-outlook.mjs
 *   (also invoked at end of fetch-quotes.mjs)
 */

import { existsSync, readFileSync, writeFileSync } from "node:fs";
import { resolve, dirname } from "node:path";
import { fileURLToPath } from "node:url";
import { getYahooSession, yahooHeaders, yahooQuoteSummaryUrl, rawNum } from "./yahoo-session.mjs";
import { annotateNews } from "./news-sentiment.mjs";

const __dirname = dirname(fileURLToPath(import.meta.url));
const ROOT = resolve(__dirname, "..");
const WATCHLIST = resolve(ROOT, "src/data/watchlist.json");
const MACRO = resolve(ROOT, "src/data/macro.json");
const OUT = resolve(ROOT, "public/outlook.json");
const JSON_SPACE =
  process.env.QUOTES_PRETTY === "1" ||
  (!process.env.GITHUB_ACTIONS && process.env.STOCKS_RADAR_ENV !== "production")
    ? 2
    : undefined;

const delay = (ms) => new Promise((r) => setTimeout(r, ms));
const NEWS_PER_SYMBOL = 3;

function loadPrevious() {
  if (!existsSync(OUT)) return null;
  try {
    return JSON.parse(readFileSync(OUT, "utf8"));
  } catch {
    return null;
  }
}

async function fetchChartLite(symbol, headers) {
  const url = `https://query1.finance.yahoo.com/v8/finance/chart/${encodeURIComponent(symbol)}?interval=1d&range=5d`;
  const res = await fetch(url, { headers });
  if (!res.ok) throw new Error(`chart HTTP ${res.status}`);
  const data = await res.json();
  const result = data?.chart?.result?.[0];
  const meta = result?.meta;
  if (!meta?.regularMarketPrice) throw new Error("no price");
  const closes = (result?.indicators?.quote?.[0]?.close ?? []).filter((c) => c != null);
  const prev =
    closes.length >= 2 ? closes[closes.length - 2] : meta.chartPreviousClose ?? null;
  const price = meta.regularMarketPrice;
  const changePct =
    prev != null && prev !== 0 ? ((price - prev) / prev) * 100 : null;
  return {
    symbol,
    price,
    changePct,
    name: meta.longName ?? meta.shortName ?? symbol,
  };
}

async function fetchFundamentals(symbol, session) {
  const url = yahooQuoteSummaryUrl(
    symbol,
    ["defaultKeyStatistics", "summaryDetail", "financialData"],
    session
  );
  const res = await fetch(url, { headers: yahooHeaders(session) });
  if (!res.ok) throw new Error(`fundamentals HTTP ${res.status}`);
  const data = await res.json();
  const row = data?.quoteSummary?.result?.[0];
  if (!row) throw new Error("no quoteSummary");
  const sd = row.summaryDetail || {};
  const ks = row.defaultKeyStatistics || {};
  const fd = row.financialData || {};
  return {
    trailingPE: rawNum(sd.trailingPE),
    forwardPE: rawNum(sd.forwardPE),
    pegRatio: rawNum(ks.pegRatio),
    priceToBook: rawNum(ks.priceToBook),
    evToEbitda: rawNum(ks.enterpriseToEbitda),
    profitMargin: rawNum(fd.profitMargins),
    revenueGrowth: rawNum(fd.revenueGrowth),
    targetMeanPrice: rawNum(fd.targetMeanPrice),
    recommendationMean: rawNum(fd.recommendationMean),
  };
}

async function fetchNews(symbol, headers) {
  const url =
    `https://query1.finance.yahoo.com/v1/finance/search?q=${encodeURIComponent(symbol)}` +
    `&newsCount=${NEWS_PER_SYMBOL}&quotesCount=0`;
  const res = await fetch(url, { headers });
  if (!res.ok) throw new Error(`news HTTP ${res.status}`);
  const data = await res.json();
  const news = Array.isArray(data.news) ? data.news : [];
  return news.slice(0, NEWS_PER_SYMBOL).map((n) => ({
    title: n.title || "",
    publisher: n.publisher || "",
    link: n.link || "",
    publishedAt:
      n.providerPublishTime != null
        ? new Date(n.providerPublishTime * 1000).toISOString()
        : null,
  }));
}

/** Optional human valuation lean from watchlist beats raw PE alone. */
function mergeHumanValuation(stock, fundamentals) {
  const human = stock.valuation || {};
  return {
    ...fundamentals,
    bias: human.bias || null, // cheap | fair | rich | unknown
    note: human.note || null,
    catalyst: human.catalyst || stock.catalyst || null,
  };
}

export async function fetchOutlook() {
  const watchlist = JSON.parse(readFileSync(WATCHLIST, "utf8"));
  const macroDefs = JSON.parse(readFileSync(MACRO, "utf8"));
  const previous = loadPrevious();
  const stocks = watchlist.stocks || [];
  const symbols = [...new Set(stocks.map((s) => s.symbol))];

  let session = null;
  try {
    session = await getYahooSession();
    console.log("Yahoo session OK (crumb for valuations)");
  } catch (e) {
    console.warn(`⚠ Yahoo session failed — valuations skipped (${e.message})`);
  }

  const headers = yahooHeaders(session);

  // Macro rates / bonds / USD
  const macro = {};
  for (const m of macroDefs) {
    try {
      const q = await fetchChartLite(m.symbol, headers);
      macro[m.id] = {
        ...m,
        price: q.price,
        changePct: q.changePct,
        name: q.name,
      };
      console.log(`  macro ${m.label}: ${q.price} (${q.changePct?.toFixed?.(2) ?? "—"}%)`);
    } catch (e) {
      console.warn(`  ⚠ macro ${m.symbol}: ${e.message}`);
      if (previous?.macro?.[m.id]) macro[m.id] = previous.macro[m.id];
    }
    await delay(200);
  }

  const bySymbol = {};
  for (const stock of stocks) {
    const sym = stock.symbol;
    if (bySymbol[sym]) continue;
    let fundamentals = previous?.stocks?.[sym]?.fundamentals || null;
    let news = previous?.stocks?.[sym]?.news || [];

    if (session) {
      try {
        fundamentals = mergeHumanValuation(stock, await fetchFundamentals(sym, session));
      } catch (e) {
        console.warn(`  ⚠ fundamentals ${sym}: ${e.message}`);
        if (fundamentals) fundamentals = mergeHumanValuation(stock, fundamentals);
        else fundamentals = mergeHumanValuation(stock, {});
      }
      await delay(250);
    } else {
      fundamentals = mergeHumanValuation(stock, fundamentals || {});
    }

    try {
      news = await fetchNews(sym, headers);
    } catch (e) {
      console.warn(`  ⚠ news ${sym}: ${e.message}`);
    }
    await delay(200);

    const annotated = annotateNews(news);
    bySymbol[sym] = {
      symbol: sym,
      fundamentals,
      news: annotated.news,
      newsCheck: annotated.newsCheck,
    };
  }

  const now = new Date().toISOString();
  const payload = {
    updatedAt: now,
    fetchedAt: now,
    schemaVersion: 2,
    hierarchy:
      "Valuation + news (incl. headline sentiment check) drive stock outlook; rates/bonds/yields frame macro. Technicals are momentum that may or may not hold.",
    macro,
    stocks: bySymbol,
  };

  writeFileSync(OUT, JSON.stringify(payload, null, JSON_SPACE) + "\n");
  console.log(`✓ outlook.json — ${Object.keys(bySymbol).length} stocks, ${Object.keys(macro).length} macro`);
  return payload;
}

const isMain = process.argv[1] && resolve(process.argv[1]) === fileURLToPath(import.meta.url);
if (isMain) {
  fetchOutlook().catch((e) => {
    console.error(e);
    process.exitCode = 1;
  });
}
