import {
  state,
  radarSettings,
  loadPrefs,
  getCustomStocks,
  mergeStocks,
} from "./state";
import { renderAll, scheduleRenderAll, scheduleResizeRender, setViewToggle } from "./render";
import { syncLayoutClass } from "./render-mobile";
import { bindEvents } from "./events";
import { startQuoteLoader, loadOutlook } from "./quotes";

const ALLOWED_PAGE_SIZES = new Set([25, 50, 100, 200]);

function clampPageSize(n: unknown, fallback = 50): number {
  const v = Number(n);
  if (!Number.isFinite(v) || !ALLOWED_PAGE_SIZES.has(v)) return fallback;
  return v;
}

export async function initWatchlistBoard(stocksJson: string) {
  const site = radarSettings();
  if (site.board?.defaultPageSize) state.pageSize = clampPageSize(site.board.defaultPageSize);
  if (site.board?.defaultSort) state.sortKey = site.board.defaultSort;

  const prefs = loadPrefs();
  if (prefs.pageSize != null) state.pageSize = clampPageSize(prefs.pageSize, state.pageSize);
  if (prefs.sortKey) state.sortKey = prefs.sortKey;
  if (prefs.filter) state.filter = prefs.filter;

  state.baseStocks = JSON.parse(stocksJson);
  const custom = await getCustomStocks();
  state.allStocks = mergeStocks(state.baseStocks, custom);

  const defaultView = site.board?.defaultView === "technical" ? "technical" : "table";
  if (prefs.viewMode === "technical" || (!prefs.viewMode && defaultView === "technical")) {
    state.viewMode = "technical";
    setViewToggle("view-technical");
  } else {
    state.viewMode = "table";
    setViewToggle("view-table");
  }

  if (prefs.filter === "owned" || prefs.filter === "watching" || prefs.filter === "targets") {
    state.filter = "all";
  }

  if (prefs.filter) {
    document.querySelectorAll(".filter-chips .chip[data-filter]").forEach((c) => {
      c.classList.toggle("active", c.getAttribute("data-filter") === state.filter);
    });
  }

  bindEvents();

  syncLayoutClass();
  window.addEventListener("resize", scheduleResizeRender);

  renderAll();
  startQuoteLoader();
  loadOutlook().then((ok) => {
    if (ok) scheduleRenderAll();
  });
}

export function initBucketSections() {
  /* buckets rendered by initWatchlistBoard */
}

function autoInit() {
  const dataEl = document.getElementById("watchlist-data");
  const raw =
    dataEl?.textContent ??
    (window as Window & { __STOCKS_RADAR_DATA__?: string }).__STOCKS_RADAR_DATA__;
  if (raw) initWatchlistBoard(raw);
}

if (document.readyState === "loading") {
  document.addEventListener("DOMContentLoaded", autoInit);
} else {
  autoInit();
}
