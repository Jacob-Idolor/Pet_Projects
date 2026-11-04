import { test, expect } from '@playwright/test';
import AxeBuilder from '@axe-core/playwright';

test('referral journey works by keyboard without JavaScript and discloses the benefit before leaving', async ({ browser, baseURL }) => {
  const context = await browser.newContext({ baseURL, javaScriptEnabled: false });
  const page = await context.newPage();
  await page.goto('/');
  await page.getByRole('navigation', { name: 'Primary' }).getByRole('link', { name: 'Links', exact: true }).focus();
  await page.keyboard.press('Enter');
  await expect(page).toHaveURL(/\/links$/);
  const referral = page.getByRole('article', { name: 'HSA Store' });
  await expect(referral).toContainText('Personal referral');
  await expect(referral).toContainText('I may receive HSA Store loyalty points from qualifying purchases');
  const link = referral.getByRole('link', { name: 'Visit HSA Store' });
  await expect(link).toHaveAttribute('href', 'https://bit.ly/4fbaglj');
  await expect(link).toHaveAttribute('rel', 'sponsored noopener noreferrer');
  await expect(link).toHaveAttribute('target', '_blank');
  await expect(link).toHaveAccessibleDescription(/loyalty points/);
  await expect(page.locator('form, iframe, script[src]')).toHaveCount(0);
  await expect(page.locator('a[href*="snapchat"]')).toHaveCount(0);
  await context.close();
});

for (const width of [320, 390, 1440]) {
  test(`referral hub is accessible and usable at ${width}px`, async ({ page }) => {
    await page.setViewportSize({ width, height: 900 });
    await page.goto('/links');
    await expect(page.locator('.desktop-navigation a[href="/links"]')).toHaveAttribute('aria-current', 'page');
    expect(await page.evaluate(() => document.documentElement.scrollWidth <= innerWidth)).toBe(true);
    const result = await new AxeBuilder({ page }).withTags(['wcag2a', 'wcag2aa', 'wcag21aa']).analyze();
    expect(result.violations).toEqual([]);
    await page.screenshot({ path: `test-results/links-${width}.png`, fullPage: true });
  });
}
