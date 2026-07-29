import { expect, test } from "@playwright/test";

test.describe("Watchlist board critical paths", () => {
  test("quotes.json is reachable and shaped for the board", async ({ request }) => {
    const res = await request.get("/quotes.json");
    expect(res.ok()).toBeTruthy();
    const body = await res.json();
    expect(body).toHaveProperty("quotes");
    expect(typeof body.quotes).toBe("object");
    expect(Object.keys(body.quotes).length).toBeGreaterThan(0);
    expect(body.fetchedAt || body.updatedAt).toBeTruthy();
  });

  test("search narrows the master list", async ({ page }) => {
    await page.goto("/");
    await expect(page.locator("#watchlist-board")).toBeVisible();

    const search = page.locator("#search-input");
    await expect(search).toBeVisible();

    // Prefer a real symbol from the embedded watchlist data when present
    const sample = await page.evaluate(() => {
      const raw = document.getElementById("watchlist-data")?.textContent;
      if (!raw) return null;
      try {
        const stocks = JSON.parse(raw);
        return stocks?.[0]?.symbol || null;
      } catch {
        return null;
      }
    });

    const query = sample || "A";
    await search.fill(query);
    await expect
      .poll(async () => {
        const rows = page.locator("#watchlist-tbody tr.data-row, .stock-card-m");
        return rows.count();
      })
      .toBeGreaterThan(0);

    // Nonsense query should empty the list (or show empty state)
    await search.fill("ZZZZNOPE999");
    await expect
      .poll(async () => {
        const empty = page.locator(".empty-row, .mobile-empty");
        const rows = page.locator("#watchlist-tbody tr.data-row, .stock-card-m");
        return (await empty.count()) > 0 || (await rows.count()) === 0;
      })
      .toBeTruthy();
  });

  test("filter chips switch without leaving the board", async ({ page }) => {
    await page.goto("/");
    const board = page.locator("#watchlist-board");
    await expect(board).toBeVisible();

    const high = page.locator('.filter-chips .chip[data-filter="high-priority"]').first();
    if ((await high.count()) === 0) test.skip();

    await high.click();
    await expect(high).toHaveClass(/active/);
    await expect(board).toBeVisible();

    const all = page.locator('.filter-chips .chip[data-filter="all"]').first();
    await all.click();
    await expect(all).toHaveClass(/active/);
  });
});

test.describe("Datacenter screener critical paths", () => {
  test("screener.json loads and static API hydrates holdings", async ({ page, request }) => {
    const res = await request.get("/screener.json");
    expect(res.ok()).toBeTruthy();
    const body = await res.json();
    expect(Array.isArray(body.layers)).toBeTruthy();
    expect(body.layers.length).toBeGreaterThan(0);

    await page.goto("/datacenter.html");
    await expect(page.getByRole("heading", { name: /AI Data Center/i })).toBeVisible();

    // Table / board should populate from static-api after fetch
    await expect
      .poll(async () => {
        const rows = page.locator("table tbody tr, .holding-row, #board tr, .dc-table tr");
        return rows.count();
      }, { timeout: 20_000 })
      .toBeGreaterThan(0);
  });

  test("dc-movers.json is compact for the home bridge", async ({ request }) => {
    const res = await request.get("/dc-movers.json");
    expect(res.ok()).toBeTruthy();
    const body = await res.json();
    expect(Array.isArray(body.gainers)).toBeTruthy();
    expect(Array.isArray(body.losers)).toBeTruthy();
    expect(body.gainers.length).toBeLessThanOrEqual(5);
    expect(body.losers.length).toBeLessThanOrEqual(5);
  });
});
