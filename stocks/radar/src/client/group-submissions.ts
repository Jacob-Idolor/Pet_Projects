/** Friend suggestion form — client logic for GroupSubmissions.astro */

const DB = "stocks-radar-submissions";
const KEY = "entries";
const WEB3FORMS_URL = "https://api.web3forms.com/submit";

type Submission = {
  id: string;
  author: string;
  submittedAt: string;
  content: string;
  symbols?: string[];
  status?: string;
};

function openDb(): Promise<IDBDatabase> {
  return new Promise((resolve, reject) => {
    const req = indexedDB.open(DB, 1);
    req.onupgradeneeded = () => {
      if (!req.result.objectStoreNames.contains("kv")) {
        req.result.createObjectStore("kv");
      }
    };
    req.onsuccess = () => resolve(req.result);
    req.onerror = () => reject(req.error);
  });
}

function getLocal(): Promise<Submission[]> {
  return openDb()
    .then(
      (db) =>
        new Promise<Submission[]>((resolve, reject) => {
          const tx = db.transaction("kv", "readonly");
          const req = tx.objectStore("kv").get(KEY);
          req.onsuccess = () => resolve((req.result as Submission[]) || []);
          req.onerror = () => reject(req.error);
        })
    )
    .catch(() => []);
}

function setLocal(entries: Submission[]) {
  return openDb().then(
    (db) =>
      new Promise<void>((resolve, reject) => {
        const tx = db.transaction("kv", "readwrite");
        tx.objectStore("kv").put(entries, KEY);
        tx.oncomplete = () => resolve();
        tx.onerror = () => reject(tx.error);
      })
  );
}

function parseSymbols(text: string) {
  const found = new Set<string>();
  const parts = text.split(/[\s,;|/]+/);
  for (const part of parts) {
    const p = part.trim().toUpperCase().replace(/^\$/, "");
    if (/^[A-Z]{1,5}(\.[A-Z])?$/.test(p)) found.add(p);
  }
  return Array.from(found);
}

function formatDate(iso: string) {
  try {
    return new Date(iso).toLocaleDateString(undefined, {
      month: "short",
      day: "numeric",
      year: "numeric",
    });
  } catch {
    return iso;
  }
}

function escapeHtml(t: string) {
  return String(t)
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;");
}

export function initGroupSubmissions(opts: { seedJson: string; web3formsKey: string }) {
  const seed = JSON.parse(opts.seedJson) as Submission[];
  const web3formsKey = opts.web3formsKey || "";

  const form = document.getElementById("submission-form");
  const authorInput = document.getElementById("submission-author") as HTMLInputElement | null;
  const contentInput = document.getElementById("submission-content") as HTMLTextAreaElement | null;
  const listEl = document.getElementById("submission-list");
  const countEl = document.getElementById("submission-count");
  const submitBtn = document.getElementById("submission-submit") as HTMLButtonElement | null;
  const statusEl = document.getElementById("submission-status");

  const savedAuthor = localStorage.getItem("radar-author");
  if (savedAuthor && authorInput) authorInput.value = savedAuthor;

  function setStatus(message: string, kind: string | null) {
    if (!statusEl) return;
    if (!message) {
      statusEl.hidden = true;
      statusEl.textContent = "";
      statusEl.className = "submission-status";
      return;
    }
    statusEl.hidden = false;
    statusEl.textContent = message;
    statusEl.className =
      "submission-status" +
      (kind === "ok"
        ? " submission-status--ok"
        : kind === "warn"
          ? " submission-status--warn"
          : kind === "err"
            ? " submission-status--err"
            : "");
  }

  function allSubmissions(local: Submission[]) {
    const map: Record<string, Submission> = {};
    seed.forEach((s) => {
      map[s.id] = Object.assign({ status: "noted" }, s);
    });
    local.forEach((s) => {
      map[s.id] = s;
    });
    return Object.keys(map)
      .map((k) => map[k])
      .sort((a, b) => String(b.submittedAt).localeCompare(String(a.submittedAt)));
  }

  function statusLabel(sub: Submission) {
    if (
      sub.status === "pending" ||
      (sub.id && String(sub.id).indexOf("local-") === 0 && sub.status !== "noted")
    ) {
      return '<span class="sub-status sub-status--pending">Pending master list</span>';
    }
    return '<span class="sub-status sub-status--noted">On the record</span>';
  }

  function render(local: Submission[]) {
    const all = allSubmissions(local);
    const pending = all.filter(
      (s) => s.status === "pending" || String(s.id).indexOf("local-") === 0
    ).length;
    if (countEl) {
      countEl.textContent =
        pending > 0 ? pending + " pending · " + all.length + " notes" : all.length + " notes";
    }

    if (!listEl) return;
    if (!all.length) {
      listEl.innerHTML =
        '<li class="submission-empty">No suggestions yet — be the first to drop a ticker for the group.</li>';
      return;
    }
    listEl.innerHTML = all
      .map((sub) => {
        const chips = (sub.symbols || [])
          .map((s) => '<span class="sub-symbol">' + escapeHtml(s) + "</span>")
          .join("");
        return (
          '<li class="submission-item" data-id="' +
          escapeHtml(sub.id) +
          '">' +
          '<div class="submission-meta">' +
          "<strong>" +
          escapeHtml(sub.author) +
          "</strong>" +
          "<time>" +
          formatDate(sub.submittedAt) +
          "</time>" +
          statusLabel(sub) +
          "</div>" +
          (chips ? '<div class="submission-symbols">' + chips + "</div>" : "") +
          '<p class="submission-text">' +
          escapeHtml(sub.content) +
          "</p>" +
          (String(sub.id).indexOf("local-") === 0
            ? '<button type="button" class="btn-text delete-sub" data-id="' +
              escapeHtml(sub.id) +
              '">Remove suggestion</button>'
            : "") +
          "</li>"
        );
      })
      .join("");

    listEl.querySelectorAll(".delete-sub").forEach((btn) => {
      btn.addEventListener("click", async () => {
        const id = btn.getAttribute("data-id");
        const entries = await getLocal();
        await setLocal(entries.filter((e) => e.id !== id));
        render(await getLocal());
      });
    });
  }

  function deliverToOwner(sub: Submission) {
    if (!web3formsKey) {
      return Promise.resolve({ ok: false, skipped: true });
    }
    return fetch(WEB3FORMS_URL, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Accept: "application/json",
      },
      body: JSON.stringify({
        access_key: web3formsKey,
        subject: "StocksWatch suggestion from " + sub.author,
        from_name: "StocksWatch",
        author: sub.author,
        content: sub.content,
        symbols: (sub.symbols || []).join(", ") || "(none detected)",
        submittedAt: sub.submittedAt,
        page: typeof location !== "undefined" ? location.href : "",
        submissionId: sub.id,
      }),
    })
      .then((res) =>
        res
          .json()
          .then((data) => ({ ok: Boolean(res.ok && data && data.success), skipped: false, data }))
          .catch(() => ({ ok: false, skipped: false }))
      )
      .catch(() => ({ ok: false, skipped: false }));
  }

  form?.addEventListener("submit", async (e) => {
    e.preventDefault();
    const author = (authorInput?.value || "").trim().toUpperCase();
    const content = (contentInput?.value || "").trim();
    if (!author || !content) return;
    if (submitBtn && submitBtn.disabled) return;

    localStorage.setItem("radar-author", author);

    const sub: Submission = {
      id: "local-" + crypto.randomUUID(),
      author,
      submittedAt: new Date().toISOString().slice(0, 10),
      content,
      symbols: parseSymbols(content),
      status: "pending",
    };

    if (submitBtn) {
      submitBtn.disabled = true;
      submitBtn.textContent = "Sending…";
    }
    setStatus("", null);

    const local = await getLocal();
    local.push(sub);
    await setLocal(local);

    if (contentInput) contentInput.value = "";
    render(local);

    const delivery = await deliverToOwner(sub);
    if (delivery.skipped) {
      setStatus(
        "Saved on this device only — email delivery isn’t configured on this build.",
        "warn"
      );
    } else if (delivery.ok) {
      setStatus("Sent — you’ll show as pending until it’s on the master list.", "ok");
    } else {
      setStatus(
        "Saved on this device, but email didn’t go through. Try again later or ping the list owner.",
        "err"
      );
    }

    if (submitBtn) {
      submitBtn.disabled = false;
      submitBtn.textContent = "Suggest for master list";
    }
  });

  void getLocal().then(render);
}
