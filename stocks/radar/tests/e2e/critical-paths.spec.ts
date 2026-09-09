import { expect, test } from "@playwright/test";

test.describe("NBIS research homepage critical paths", () => {
  test("nbis.json loads and the research shell hydrates", async ({ page, request }) => {
    const nbis = await request.get("/nbis.json");
    expect(nbis.ok()).toBeTruthy();
    const nbisBody = await nbis.json();
    expect(nbisBody.ticker).toBe("NBIS");
    expect(nbisBody).toHaveProperty("fetchedAt");
    expect(Array.isArray(nbisBody.priceHistory)).toBeTruthy();

    const res = await request.get("/screener.json");
    expect(res.ok()).toBeTruthy();
    const body = await res.json();
    expect(Array.isArray(body.layers)).toBeTruthy();
    expect(body.layers.length).toBeGreaterThan(0);

    await page.goto("/");
    await expect(page.getByRole("heading", { name: /Nebius Group/i })).toBeVisible();

    await expect
      .poll(async () => {
        return page.locator("#nbis-readouts .nbis-readout").count();
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

test.describe("AI data-center critical paths", () => {
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
