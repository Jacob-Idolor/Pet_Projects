import { type QuoteMap } from "../../lib/market-display";
import {
  state,
  savePrefs,
  savePriceTarget,
  getCustomStocks,
  setCustomStocks,
  mergeStocks,
} from "./state";
import { renderAll, scheduleRenderAll, setViewToggle } from "./render";

export function bindEvents() {
  document.getElementById("search-input")?.addEventListener("input", (e) => {
    state.search = (e.target as HTMLInputElement).value.trim();
    state.page = 1;
    renderAll();
  });

  document.querySelectorAll(".filter-chips").forEach((container) => {
    container.addEventListener("click", (e) => {
      const btn = (e.target as HTMLElement).closest("[data-filter]");
      if (!btn) return;
      state.filter = btn.getAttribute("data-filter") ?? "all";
      document.querySelectorAll(".filter-chips .chip[data-filter]").forEach((c) => c.classList.remove("active"));
      btn.classList.add("active");
      state.page = 1;
      savePrefs();
      renderAll();
    });
  });

  document.getElementById("tag-filters")?.addEventListener("click", (e) => {
    const btn = (e.target as HTMLElement).closest("[data-tag]");
    if (!btn) return;
    const t = btn.getAttribute("data-tag");
    state.tagFilter = t || null;
    state.page = 1;
    renderAll();
  });

  document.querySelectorAll("th.sortable").forEach((th) => {
    th.addEventListener("click", () => {
      const key = th.getAttribute("data-sort")!;
      if (state.sortKey === key) state.sortDir *= -1;
      else {
        state.sortKey = key;
        state.sortDir = 1;
      }
      savePrefs();
      renderAll();
    });
  });

  document.getElementById("technical-view")?.addEventListener("click", (e) => {
    const th = (e.target as HTMLElement).closest("th.sortable");
    if (!th) return;
    const key = th.getAttribute("data-sort")!;
    if (state.sortKey === key) state.sortDir *= -1;
    else {
      state.sortKey = key;
      state.sortDir = 1;
    }
    savePrefs();
    renderAll();
  });

  document.getElementById("view-table")?.addEventListener("click", () => {
    state.viewMode = "table";
    setViewToggle("view-table");
    savePrefs();
    renderAll();
  });

  document.getElementById("view-technical")?.addEventListener("click", () => {
    state.viewMode = "technical";
    setViewToggle("view-technical");
    savePrefs();
    renderAll();
  });

  function jumpToSymbol(sym: string) {
    state.search = sym;
    const input = document.getElementById("search-input") as HTMLInputElement;
    if (input) input.value = sym;
    state.filter = "all";
    state.tagFilter = null;
    document.querySelectorAll(".filter-chips .chip[data-filter]").forEach((c) => {
      c.classList.toggle("active", c.getAttribute("data-filter") === "all");
    });
    state.viewMode = "table";
    state.page = 1;
    renderAll();
    document.getElementById("watchlist-board")?.scrollIntoView({ behavior: "smooth", block: "start" });
    requestAnimationFrame(() => {
      document.querySelector(`tr[data-symbol="${sym}"], .stock-card-m[data-symbol="${sym}"]`)
        ?.scrollIntoView({ behavior: "smooth", block: "center" });
    });
  }

  document.getElementById("opp-chips")?.addEventListener("click", (e) => {
    const btn = (e.target as HTMLElement).closest("[data-jump]");
    if (!btn) return;
    jumpToSymbol(btn.getAttribute("data-jump")!);
  });

  document.getElementById("checkin")?.addEventListener("click", (e) => {
    const btn = (e.target as HTMLElement).closest("[data-jump]");
    if (!btn) return;
    jumpToSymbol(btn.getAttribute("data-jump")!);
  });

  document.getElementById("watchlist-board")?.addEventListener("change", (e) => {
    if ((e.target as HTMLElement).id === "page-size-select") {
      state.pageSize = Number((e.target as HTMLSelectElement).value);
      state.page = 1;
      savePrefs();
      renderAll();
    }
  });

  document.getElementById("watchlist-board")?.addEventListener("click", (e) => {
    const ptSave = (e.target as HTMLElement).closest("[data-pt-save]");
    if (ptSave) {
      const sym = ptSave.getAttribute("data-pt-save")!;
      const row = ptSave.closest(".pt-inline");
      const input = row?.querySelector(".pt-inline-price") as HTMLInputElement | null;
      const price = Number(input?.value);
      if (!price || price <= 0) {
        alert("Enter a valid target price.");
        return;
      }
      savePriceTarget(sym, price).then((ok) => {
        if (!ok) return;
        renderAll();
      });
      return;
    }

    const expand = (e.target as HTMLElement).closest("[data-expand]");
    if (expand) {
      const id = expand.getAttribute("data-expand")!;
      state.expandedId = state.expandedId === id ? null : id;
      renderAll();
      return;
    }

    const pag = (e.target as HTMLElement).closest("#page-prev, #page-next, #page-size-select");
    if (pag) {
      if ((pag as HTMLElement).id === "page-prev" && state.page > 1) state.page--;
      else if ((pag as HTMLElement).id === "page-next") state.page++;
      else return;
      renderAll();
      return;
    }
  });

  document.getElementById("technical-view")?.addEventListener("click", (e) => {
    const expand = (e.target as HTMLElement).closest("[data-expand]");
    if (expand) {
      const id = expand.getAttribute("data-expand")!;
      state.expandedId = state.expandedId === id ? null : id;
      renderAll();
      return;
    }

    const pag = (e.target as HTMLElement).closest("#page-prev, #page-next, #page-size-select");
    if (pag) {
      if ((pag as HTMLElement).id === "page-prev" && state.page > 1) state.page--;
      else if ((pag as HTMLElement).id === "page-next") state.page++;
      renderAll();
    }
  });

  document.addEventListener("keydown", (e) => {
    if (e.key === "/" && document.activeElement?.tagName !== "INPUT" && document.activeElement?.tagName !== "TEXTAREA") {
      e.preventDefault();
      (document.getElementById("search-input") as HTMLInputElement)?.focus();
    }
  });

  document.addEventListener("radar:quotes", ((e: CustomEvent) => {
    const incoming = e.detail as QuoteMap;
    const changed = new Map<string, "up" | "down">();
    for (const [sym, q] of Object.entries(incoming || {})) {
      const prev = state.quotes[sym]?.price;
      if (prev != null && q?.price != null && prev !== q.price) {
        changed.set(sym, q.price > prev ? "up" : "down");
      }
    }
    state.quotes = { ...state.quotes, ...incoming };
    scheduleRenderAll();
    requestAnimationFrame(() => {
      for (const [sym, dir] of changed) {
        document.querySelectorAll(`[data-price-for="${sym}"]`).forEach((el) => {
          el.classList.remove("price-flash", "up", "down");
          void (el as HTMLElement).offsetWidth;
          el.classList.add("price-flash", dir);
        });
      }
    });
  }) as EventListener);

  document.addEventListener("radar:submission-added", (async (e: Event) => {
    const detail = (e as CustomEvent).detail;
    const incoming = detail?.stocks as import("./types").StockRow[] | undefined;
    if (!incoming?.length) return;
    const baseSymbols = new Set(state.baseStocks.map((s) => s.symbol));
    const novel = incoming.filter((s) => !baseSymbols.has(s.symbol));
    if (!novel.length) return;
    const existing = await getCustomStocks();
    const merged = mergeStocks(existing, novel);
    await setCustomStocks(merged);
    state.allStocks = mergeStocks(state.baseStocks, merged);
    renderAll();
  }) as EventListener);
}
