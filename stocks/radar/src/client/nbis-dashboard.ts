import { renderSnapshot } from "../lib/nbis-render";
import { snapshotState, validateNbisSnapshot } from "../../scripts/lib/nbis-quality.mjs";

const root = document.querySelector<HTMLElement>("#nbis-app");
const DATA_URL = root?.dataset.nbisUrl ?? "/nbis.json";
let currentSnapshot: Record<string, any> | null = null;
let refreshing = false;
let refreshFailed = false;
const retry = document.querySelector<HTMLButtonElement>("#nbis-retry");
function updateStatus() {
  const state = snapshotState(currentSnapshot ?? { status: root?.dataset.snapshotStatus, fetchedAt: root?.dataset.fetchedAt });
  const status = document.getElementById("nbis-status");
  if (status) {
    status.className = `nbis-status nbis-status--${refreshFailed || state.kind !== "ready" ? "error" : "ready"}`;
    status.textContent = refreshFailed ? `Refresh failed. Showing the saved page snapshot. ${state.message}` : state.message;
  }
  const badge = document.getElementById("nbis-freshness");
  if (badge) badge.textContent = refreshFailed ? "REFRESH FAILED" : state.label;
}
const FOLLOW_STORAGE_KEY = "stockswatch-following";

function emitEngagement(name: string, payload: Record<string, unknown> = {}) {
  window.dispatchEvent(new CustomEvent("stockswatch:engagement", { detail: { name, ...payload } }));
}

function setupFollowControl() {
  const button = document.getElementById("nbis-follow");
  const label = document.getElementById("nbis-follow-label");
  const note = document.getElementById("nbis-follow-note");
  if (!(button instanceof HTMLButtonElement) || !label || !note) return;

  let following = false;
  try {
    following = localStorage.getItem(FOLLOW_STORAGE_KEY) === "1";
  } catch {}

  const sync = () => {
    button.setAttribute("aria-pressed", String(following));
    label.textContent = following ? "Following this desk" : "Follow this desk";
    note.textContent = following ? "Saved in this browser — return any time." : "Saved on this device — no account or email required.";
    const mark = button.querySelector(".nbis-follow__mark");
    if (mark) mark.textContent = following ? "✓" : "+";
  };

  button.addEventListener("click", () => {
    following = !following;
    try {
      if (following) localStorage.setItem(FOLLOW_STORAGE_KEY, "1");
      else localStorage.removeItem(FOLLOW_STORAGE_KEY);
    } catch {}
    sync();
    emitEngagement("follow_toggle", { following });
  });

  sync();
}

function setupEngagementHooks() {
  document.querySelectorAll<HTMLElement>("[data-analytics-event]").forEach((element) => {
    element.addEventListener("click", () => {
      emitEngagement(element.dataset.analyticsEvent ?? "click", { target: element.getAttribute("href") ?? element.id });
    });
  });
}


async function loadSnapshot() {
  if (refreshing) return;
  refreshing = true;
  if (retry) retry.disabled = true;
  try {
    const response = await fetch(DATA_URL, { cache: "no-store", signal: AbortSignal.timeout(10000) });
    if (!response.ok) throw new Error(`Snapshot request failed: ${response.status}`);
    const data = await response.json();
    const errors = validateNbisSnapshot(data);
    if (errors.length) throw new Error(errors.join("; "));
    const view = renderSnapshot(data);
    for (const [id, html] of Object.entries(view.html)) {
      const element = document.getElementById(id);
      if (element) element.innerHTML = html;
    }
    currentSnapshot = data;
    refreshFailed = false;
    emitEngagement("snapshot_loaded", { status: data.status });
  } catch (error) {
    console.error("NBIS snapshot failed", error);
    refreshFailed = true;
  } finally {
    refreshing = false;
    if (retry) { retry.hidden = !refreshFailed; retry.disabled = false; }
    updateStatus();
  }
}
setupFollowControl();
setupEngagementHooks();
retry?.addEventListener("click", loadSnapshot);
updateStatus();
setInterval(updateStatus, 60_000);
loadSnapshot();
