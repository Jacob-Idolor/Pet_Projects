import { expect, test } from "@playwright/test";

test.describe("AI Data Center homepage critical paths", () => {
  test("screener.json loads and static API hydrates holdings", async ({ page, request }) => {
    const res = await request.get("/screener.json");
    expect(res.ok()).toBeTruthy();
    const body = await res.json();
    expect(Array.isArray(body.layers)).toBeTruthy();
    expect(body.layers.length).toBeGreaterThan(0);

    await page.goto("/");
    await expect(page.getByRole("heading", { name: /AI Data Center/i })).toBeVisible();

    await expect
      .poll(async () => {
        const rows = page.locator("table tbody tr, .holding-row, #board tr, .dc-table tr, main#layers tr");
        return rows.count();
      }, { timeout: 20_000 })
      .toBeGreaterThan(0);
  });

  test("campuses.json is available for the map", async ({ request }) => {
    const res = await request.get("/datacenter/campuses.json");
    expect(res.ok()).toBeTruthy();
    const body = await res.json();
    expect(Array.isArray(body.sites)).toBeTruthy();
    expect(body.sites.length).toBeGreaterThan(0);
  });

  test("legacy /datacenter.html redirects toward home", async ({ page }) => {
    await page.goto("/datacenter.html");
    await expect(page).toHaveURL(/\/($|\?)/);
  });
});

test.describe("Archived watchlist critical paths", () => {
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
    await page.goto("/watchlist.html");
    await expect(page.locator("#watchlist-board")).toBeVisible();

    const search = page.locator("#search-input");
    await expect(search).toBeVisible();

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
    await page.goto("/watchlist.html");
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

  test("dc-movers.json is compact for bridges", async ({ request }) => {
    const res = await request.get("/dc-movers.json");
    expect(res.ok()).toBeTruthy();
    const body = await res.json();
    expect(Array.isArray(body.gainers)).toBeTruthy();
    expect(Array.isArray(body.losers)).toBeTruthy();
    expect(body.gainers.length).toBeLessThanOrEqual(5);
    expect(body.losers.length).toBeLessThanOrEqual(5);
  });
});
