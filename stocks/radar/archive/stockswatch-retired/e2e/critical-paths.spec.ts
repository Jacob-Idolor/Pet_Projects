import { expect, test } from "@playwright/test";

test.describe("NBIS research homepage critical paths", () => {
  test("nbis.json loads and the research shell hydrates", async ({ page, request }) => {
    const nbis = await request.get("/nbis.json");
    expect(nbis.ok()).toBeTruthy();
    const nbisBody = await nbis.json();
    expect(nbisBody.ticker).toBe("NBIS");
    expect(nbisBody).toHaveProperty("fetchedAt");
    expect(Array.isArray(nbisBody.priceHistory)).toBeTruthy();

    await page.goto("/");
    await expect(page.getByRole("heading", { name: /Nebius Group/i })).toBeVisible();

    await expect
      .poll(async () => {
        return page.locator("#nbis-readouts .nbis-readout").count();
      }, { timeout: 20_000 })
      .toBeGreaterThan(0);
  });

  test("historical screener feeds are not published", async ({ request }) => {
    for (const path of ["/screener.json", "/dc-movers.json", "/datacenter/campuses.json"]) {
      expect((await request.get(path)).status()).toBe(404);
    }
  });

  test("legacy /datacenter.html redirects toward home", async ({ page }) => {
    await page.goto("/datacenter.html");
    await expect(page).toHaveURL(/\/($|\?)/);
  });
});
