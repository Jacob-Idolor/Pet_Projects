import { state, filteredStocks } from "./state";
import {
  renderOverview,
  renderTagFilters,
  renderTableView,
  renderTechnicalView,
} from "./render-table";
import { isMobileLayout, syncLayoutClass, renderMobileView } from "./render-mobile";
import { renderCheckIn } from "./render-checkin";

export function renderAll() {
  syncLayoutClass();
  const list = filteredStocks();

  renderCheckIn();

  if (isMobileLayout()) {
    renderMobileView(list);
    return;
  }

  renderOverview();
  renderTagFilters();

  const mobileEl = document.getElementById("mobile-stock-list");
  if (mobileEl) mobileEl.hidden = true;

  if (state.viewMode === "technical") {
    renderTechnicalView(list);
  } else {
    renderTableView(list);
  }
}

/** Coalesce quote/resize thrash into one paint (100x: many tabs → many radar:quotes). */
let renderRaf = 0;
export function scheduleRenderAll() {
  if (renderRaf) return;
  renderRaf = requestAnimationFrame(() => {
    renderRaf = 0;
    renderAll();
  });
}

let resizeTimer = 0;
export function scheduleResizeRender() {
  window.clearTimeout(resizeTimer);
  resizeTimer = window.setTimeout(() => {
    syncLayoutClass();
    scheduleRenderAll();
  }, 120);
}

export function setViewToggle(activeId: string) {
  ["view-table", "view-technical"].forEach((id) => {
    const el = document.getElementById(id);
    if (!el) return;
    const on = id === activeId;
    el.classList.toggle("active", on);
    el.setAttribute("aria-pressed", String(on));
  });
}
