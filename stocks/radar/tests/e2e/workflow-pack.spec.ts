import { expect, test } from "@playwright/test";
import AxeBuilder from "@axe-core/playwright";

test("kit leads to an honest preview and a working sample download", async ({ page, request }) => {
  await page.goto("/research-kit.html");
  await page.getByRole("link", { name: "Preview the Workflow Pack ↗" }).click();
  await expect(page).toHaveURL(/\/workflow-pack\.html$/);
  await expect(page.getByRole("heading", { level: 1 })).toHaveText("Pick up your research.Not the pieces.");
  await expect(page.getByText("PREVIEW · SALES NOT OPEN", { exact: true })).toBeVisible();
  await expect(page.locator(".workflow-contents li")).toHaveCount(10);
  await expect(page.locator('form, input[type="email"]')).toHaveCount(0);
  await expect(page.locator('script[src*="adsbygoogle"]')).toHaveCount(0);
  await expect(page.getByRole("link", { name: /buy|checkout|purchase/i })).toHaveCount(0);
  const jsonLd = JSON.parse(await page.locator('script[type="application/ld+json"]').innerText());
  expect(jsonLd["@type"]).toBe("WebPage");
  expect(jsonLd.offers).toBeUndefined();
  const [download] = await Promise.all([
    page.waitForEvent("download"),
    page.getByRole("link", { name: /Download the free sample/ }).click(),
  ]);
  expect(download.suggestedFilename()).toBe("stockswatch-workflow-sample.md");
  expect(await download.failure()).toBeNull();
  const sample = await request.get("/downloads/research-workflow-sample.md");
  expect(sample.ok()).toBeTruthy();
  expect(await sample.text()).toContain("FICTIONAL TEACHING EXAMPLE");
  expect(await (await request.get("/sitemap.xml")).text()).toContain("/workflow-pack.html");
});

test("paid files and product archive are not public routes", async ({ request }) => {
  for (const path of [
    "/.private-products/research-workflow-pack/1.0.0/07-fictional-worked-example.md",
    "/.private-products/releases/stockswatch-research-workflow-pack-1.0.0.zip",
    "/downloads/stockswatch-research-workflow-pack-1.0.0.zip",
    "/downloads/07-fictional-worked-example.md",
  ]) expect((await request.get(path)).status()).toBe(404);
});

test("product preview and sample link work without JavaScript", async ({ browser, baseURL }) => {
  const context = await browser.newContext({ javaScriptEnabled: false, baseURL });
  try {
    const page = await context.newPage();
    await page.goto("/workflow-pack.html");
    await expect(page.getByRole("link", { name: /Download the free sample/ })).toBeVisible();
    await page.getByText("Can I buy the pack now?", { exact: true }).click();
    await expect(page.locator("details[open]")).toContainText("Sales are not open");
  } finally {
    await context.close();
  }
});

for (const theme of ["dark", "light"]) {
  test(`product preview fits mobile and passes accessibility checks in ${theme}`, async ({ page }) => {
    await page.setViewportSize({ width: 375, height: 812 });
    await page.goto("/workflow-pack.html");
    if (theme === "light") await page.getByRole("button", { name: "Switch to light mode" }).click();
    expect(await page.evaluate(() => document.documentElement.scrollWidth <= window.innerWidth)).toBe(true);
    const audit = await new AxeBuilder({ page }).withTags(["wcag2a", "wcag2aa", "wcag21aa"]).analyze();
    expect(audit.violations).toEqual([]);
  });
}
