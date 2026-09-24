import { expect, test } from "@playwright/test";
import AxeBuilder from "@axe-core/playwright";

test("research journey delivers an actual kit without signup", async ({ page, request }) => {
  await page.goto("/");
  await page.getByRole("link", { name: "Get the free research kit ↗" }).click();
  await expect(page).toHaveURL(/\/research-kit\.html$/);
  await expect(page.getByRole("heading", { level: 1 })).toHaveText("Better research starts with a clearer process.");
  await expect(page.getByRole("navigation", { name: "Primary" }).getByRole("link", { name: "Research kit" })).toHaveAttribute("aria-current", "page");
  await expect(page.locator('input[type="email"]')).toHaveCount(0);
  await expect(page.locator('script[src*="adsbygoogle"]')).toHaveCount(0);
  await expect(page.locator('link[rel="canonical"]')).toHaveAttribute("href", /\/research-kit\.html$/);

  const downloadLink = page.getByRole("link", { name: /Download the free kit/ });
  const [download] = await Promise.all([page.waitForEvent("download"), downloadLink.click()]);
  expect(download.suggestedFilename()).toBe("stockswatch-research-kit.md");
  expect(await download.failure()).toBeNull();
  const file = await request.get("/downloads/ai-infrastructure-research-kit.md");
  expect(file.ok()).toBeTruthy();
  const content = await file.text();
  expect(content).toContain("## 4. Maintain an assumption register");
  expect(content).toContain("## 5. Record changes without rewriting history");
  expect(content).toContain("Not financial advice");
  expect(await (await request.get("/sitemap.xml")).text()).toContain("/research-kit.html");
});

test("kit remains usable without JavaScript", async ({ browser, baseURL }) => {
  const context = await browser.newContext({ javaScriptEnabled: false, baseURL });
  const page = await context.newPage();
  await page.goto("/research-kit.html");
  await expect(page.getByRole("link", { name: /Download the free kit/ })).toBeVisible();
  await page.getByText("What do I need to open it?", { exact: true }).click();
  await expect(page.locator("details[open]").getByText(/^Any text editor\./)).toBeVisible();
  await context.close();
});

for (const theme of ["dark", "light"]) {
  test(`kit is accessible and fits a narrow screen in ${theme} mode`, async ({ page }) => {
    await page.setViewportSize({ width: 375, height: 812 });
    await page.goto("/research-kit.html");
    if (theme === "light") await page.getByRole("button", { name: "Switch to light mode" }).click();
    await expect(page.locator("#theme-toggle-label")).toHaveText(theme === "light" ? "Light" : "Dark");
    expect(await page.evaluate(() => document.documentElement.scrollWidth <= window.innerWidth)).toBe(true);
    await expect(page.getByRole("link", { name: /Download the free kit/ })).toBeVisible();
    const audit = await new AxeBuilder({ page }).withTags(["wcag2a", "wcag2aa", "wcag21aa"]).analyze();
    expect(audit.violations).toEqual([]);
  });
}
