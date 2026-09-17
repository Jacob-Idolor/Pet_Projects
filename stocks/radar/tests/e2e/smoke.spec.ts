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
    await expect(page.locator("#nbis-follow-label")).toHaveText("Follow this desk");

    await page.locator("#nbis-follow").click();
    await expect(page.locator("#nbis-follow-label")).toHaveText("Following this desk");
    await page.reload();
    await expect(page.locator("#nbis-follow-label")).toHaveText("Following this desk");

    await page.locator("#theme-toggle").click();
    await expect(page.locator("html")).toHaveAttribute("data-theme", "light");
    await expect(page.locator("#theme-toggle-label")).toHaveText("Light");

    await page.locator("#theme-toggle").click();
    await expect(page.locator("html")).toHaveAttribute("data-theme", "dark");
  });

  test("SEC filings stay compact while retaining older filing links", async ({ page }) => {
    await page.goto("/");
    const filings = page.locator("#nbis-filings-table");
    await expect(filings.locator(".nbis-filings-table").first().locator("tbody tr")).toHaveCount(8);
    await expect(filings.locator(".nbis-filings-table").first().locator("tbody td").first()).not.toHaveText("—");
    await expect(filings.locator(".nbis-filings-table").first().locator("tbody td").nth(2)).not.toHaveText("—");
    await expect(filings.locator("summary")).toContainText(/older filings/);

    await filings.locator("summary").click();
    await expect(filings.locator("details .nbis-filings-table tbody tr").first()).toBeVisible();
  });

  test("discovery and transparency pages are linked and indexable", async ({ page }) => {
    await page.goto("/");
    await expect(page.locator('script[type="application/ld+json"]')).toHaveCount(1);
    await expect(page.getByRole("link", { name: /How to read this desk/i })).toBeVisible();
    await expect(page.getByRole("link", { name: /How to read SEC filings/i })).toBeVisible();

    const sitemap = await page.request.get("/sitemap.xml");
    const sitemapText = await sitemap.text();
    expect(sitemap.ok()).toBeTruthy();
    expect(sitemapText).toContain("/guides/nbis-research-guide.html");
    expect(sitemapText).toContain("/guides/nbis-sec-filings.html");
    expect(sitemapText).toContain("/privacy.html");

    await page.goto("/guides/nbis-research-guide.html");
    await expect(page.getByRole("heading", { name: /How to read the NBIS research desk/i })).toBeVisible();
    await expect(page.locator('script[type="application/ld+json"]')).toHaveCount(1);

    await page.goto("/guides/nbis-sec-filings.html");
    await expect(page.getByRole("heading", { name: /How to read NBIS SEC filings/i })).toBeVisible();
    await expect(page.getByRole("link", { name: /SEC EDGAR company filings/i })).toBeVisible();
    await expect(page.locator('script[type="application/ld+json"]')).toHaveCount(1);

    await page.goto("/privacy.html");
    await expect(page.getByRole("heading", { name: /Privacy & sponsorship/i })).toBeVisible();
    await expect(page.locator('script[src*="adsbygoogle"]')).toHaveCount(0);
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
