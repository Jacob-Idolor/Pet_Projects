import { expect, test } from "@playwright/test";

test.describe("StocksWatch smoke", () => {
  test("home shows the NBIS research product shell", async ({ page }) => {
    await page.goto("/");
    await expect(page.getByRole("heading", { name: /Nebius Group/i })).toBeVisible();
    await expect(page.locator(".logo").first()).toContainText("StocksWatch");
    await expect(page.locator("#nbis-app")).toBeVisible();
    await expect(page.locator("#nbis-chart")).toBeVisible();
    // AdSense script should only appear when build gates enable it — never assert present.
    await expect(page.locator('script[src*="adsbygoogle"]')).toHaveCount(0);
  });

  test("home exposes the theme control and readout values", async ({ page }) => {
    await page.goto("/");
    await expect(page.locator("#theme-toggle")).toBeVisible();
    await expect(page.locator("#theme-toggle-label")).toHaveText("Dark");
    await expect(page.locator("#nbis-readouts .nbis-readout__value").first()).toBeVisible();

    await page.locator("#theme-toggle").click();
    await expect(page.locator("html")).toHaveAttribute("data-theme", "light");
    await expect(page.locator("#theme-toggle-label")).toHaveText("Light");

    await page.locator("#theme-toggle").click();
    await expect(page.locator("html")).toHaveAttribute("data-theme", "dark");
  });

  test("404 has no AdSense and links home", async ({ page }) => {
    await page.goto("/404.html");
    await expect(page.getByRole("heading", { name: /page not found/i })).toBeVisible();
    await expect(page.locator('script[src*="adsbygoogle"]')).toHaveCount(0);
    await expect(page.getByRole("link", { name: /NBIS|back/i }).first()).toBeVisible();
  });

  test("legacy datacenter route redirects without AdSense", async ({ page }) => {
    await page.goto("/datacenter.html");
    await expect(page).toHaveURL(/\/$/);
    await expect(page.locator('script[src*="adsbygoogle"]')).toHaveCount(0);
    await expect(page.locator("#nbis-app")).toBeVisible();
  });
});
