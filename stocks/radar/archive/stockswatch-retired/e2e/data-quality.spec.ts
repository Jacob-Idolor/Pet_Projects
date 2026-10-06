import { expect, test } from "@playwright/test";
import AxeBuilder from "@axe-core/playwright";

test("percentages have correct units and all SEC company links agree", async ({ page, request }) => {
  const snapshot = await (await request.get("/nbis.json")).json();
  snapshot.fundamentals.revenueGrowth = 4.54;
  snapshot.fundamentals.grossMargin = .7426;
  snapshot.fetchedAt = new Date().toISOString();
  await page.route("**/nbis.json", route => route.fulfill({ json: snapshot }));
  await page.goto("/");
  await expect(page.locator("#nbis-revenue-growth")).toHaveText("+454.0%");
  await expect(page.locator("#nbis-profitability")).toContainText("+74.3%");
  await expect(page.locator("#nbis-scenario-table")).toContainText("+50.0%");
  const links = await page.locator('a[href*="edgar/browse"]').evaluateAll(nodes => nodes.map(n => (n as HTMLAnchorElement).href));
  expect(links.length).toBeGreaterThan(1);
  for (const link of links) expect(Number(new URL(link).searchParams.get("CIK"))).toBe(1513845);
});

test("stale data is explicit and failed refresh preserves the saved content with retry", async ({ page, request }) => {
  const snapshot = await (await request.get("/nbis.json")).json();
  snapshot.fetchedAt = "2020-01-01T00:00:00Z";
  await page.route("**/nbis.json", route => route.fulfill({ json: snapshot }));
  await page.goto("/");
  await expect(page.locator("#nbis-freshness")).toHaveText("STALE");
  await expect(page.locator("#nbis-status")).toContainText("2020-01-01");
  await page.unroute("**/nbis.json");
  await page.route("**/nbis.json", route => route.fulfill({ status: 503, body: "unavailable" }));
  await page.reload();
  await expect(page.locator("#nbis-freshness")).toHaveText("REFRESH FAILED");
  await expect(page.locator("#nbis-status")).toContainText("saved page snapshot");
  await expect(page.locator("#nbis-price")).not.toHaveText("—");
  await expect(page.getByText(/Loading/)).toHaveCount(0);
  await page.unroute("**/nbis.json");
  snapshot.fetchedAt = new Date().toISOString();
  await page.route("**/nbis.json", route => route.fulfill({ json: snapshot }));
  await page.getByRole("button", { name: "Retry snapshot" }).click();
  await expect(page.locator("#nbis-freshness")).toHaveText("DAILY");
  await expect(page.locator("#nbis-retry")).toBeHidden();
});

test("research is readable without JavaScript", async ({ browser }) => {
  const context = await browser.newContext({ javaScriptEnabled: false });
  const page = await context.newPage();
  await page.goto(test.info().project.use.baseURL || "http://127.0.0.1:4321");
  await expect(page.locator("#nbis-price")).not.toHaveText("—");
  await expect(page.locator("#nbis-scenario-table")).toContainText("+50.0%");
  await expect(page.locator("#nbis-filings-table tbody tr").first()).toBeVisible();
  await expect(page.getByText(/Loading/)).toHaveCount(0);
  await context.close();
});

test("mobile layout and keyboard accessibility", async ({ page }) => {
  await page.setViewportSize({ width: 390, height: 844 });
  await page.goto("/");
  expect(await page.evaluate(() => document.documentElement.scrollWidth <= innerWidth)).toBeTruthy();
  await page.keyboard.press("Tab");
  await expect(page.getByRole("link", { name: "Skip to content" })).toBeFocused();
  await page.keyboard.press("Enter");
  await expect(page.locator("#main-content")).toBeFocused();
  expect(await page.locator("main").count()).toBe(1);
  for (const theme of ["dark", "light"]) {
    await page.locator("html").evaluate((element, value) => element.setAttribute("data-theme", value), theme);
    const results = await new AxeBuilder({ page }).withTags(["wcag2a", "wcag2aa", "wcag21aa"]).analyze();
    expect(results.violations).toEqual([]);
  }
});
