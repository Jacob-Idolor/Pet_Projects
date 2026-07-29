import { expect, test } from "@playwright/test";

test.describe("StocksWatch smoke", () => {
  test("home shows brand, watchlist, and about content", async ({ page }) => {
    await page.goto("/");
    await expect(page.getByRole("heading", { level: 1 })).toBeVisible();
    await expect(page.locator(".hero-brand").first()).toContainText("StocksWatch");
    await expect(page.locator("#watchlist-board")).toBeVisible();
    await expect(page.locator("#about")).toContainText(/What StocksWatch publishes|About this page/i);
    // AdSense script should only appear when build gates enable it — never assert present.
    await expect(page.locator('script[src*="adsbygoogle"]')).toHaveCount(0);
  });

  test("404 has no AdSense and links home", async ({ page }) => {
    await page.goto("/404.html");
    await expect(page.getByRole("heading", { name: /page not found/i })).toBeVisible();
    await expect(page.locator('script[src*="adsbygoogle"]')).toHaveCount(0);
    await expect(page.getByRole("link", { name: /watchlist|back/i }).first()).toBeVisible();
  });

  test("datacenter loads screener shell without AdSense", async ({ page }) => {
    await page.goto("/datacenter.html");
    await expect(page.getByRole("heading", { name: /AI Data Center/i })).toBeVisible();
    await expect(page.locator('script[src*="adsbygoogle"]')).toHaveCount(0);
    // Hashed or unhashed app script referenced
    await expect(page.locator('script[src*="app."]')).toHaveCount(1);
    await expect(page.locator("#status, .dc-shell, #board").first()).toBeVisible({ timeout: 15_000 });
  });
});
