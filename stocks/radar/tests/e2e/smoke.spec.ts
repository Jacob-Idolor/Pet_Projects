import { expect, test } from "@playwright/test";

test.describe("StocksWatch smoke", () => {
  test("home shows the NBIS research product shell", async ({ page }) => {
    await page.goto("/");
    await expect(page.getByRole("heading", { name: /Nebius Group/i })).toBeVisible();
    await expect(page.locator(".logo").first()).toContainText("StocksWatch");
    await expect(page.locator("#nbis-app")).toBeVisible();
    await expect(page.locator("#nbis-chart")).toBeVisible();
    // Content-rich home may load AdSense when the production gate is enabled.
  });

  test("404 has no AdSense and links home", async ({ page }) => {
    await page.goto("/404.html");
    await expect(page.getByRole("heading", { name: /page not found/i })).toBeVisible();
    await expect(page.locator('script[src*="adsbygoogle"]')).toHaveCount(0);
    await expect(page.getByRole("link", { name: /watchlist|back/i }).first()).toBeVisible();
  });

  test("legacy datacenter route redirects to the research desk", async ({ page }) => {
    await page.goto("/datacenter.html");
    await expect(page).toHaveURL(/\/$/);
    await expect(page.locator("#nbis-app")).toBeVisible();
  });
});
