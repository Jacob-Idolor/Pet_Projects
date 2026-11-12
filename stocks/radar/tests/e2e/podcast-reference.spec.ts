import { test, expect } from '@playwright/test';
import AxeBuilder from '@axe-core/playwright';
for (const width of [390, 1280]) {
  test(`podcast reference is readable at ${width}px without an embed`, async ({ page }) => {
    await page.setViewportSize({ width, height: 900 });
    await page.goto('/#podcast-reference');
    const section = page.locator('#podcast-reference');
    await expect(section.getByRole('heading', { name: 'Access the Sublime & Live Your Best Life | Robert Greene' })).toBeVisible();
    await expect(section.getByRole('link', { name: /^Watch on YouTube/ })).toHaveAttribute('href', 'https://www.youtube.com/watch?v=y-fRFiTrrg4');
    await expect(section.locator('img')).toHaveJSProperty('naturalWidth', 480);
    await expect(section.locator('iframe')).toHaveCount(0);
    expect(await page.evaluate(() => document.documentElement.scrollWidth <= window.innerWidth)).toBeTruthy();
    await page.goto('/references');
    await expect(page.locator('.book-reference')).toHaveCount(19);
    expect((await new AxeBuilder({ page }).withTags(['wcag2a', 'wcag2aa', 'wcag21aa']).analyze()).violations).toEqual([]);
    expect(await page.evaluate(() => document.documentElement.scrollWidth <= window.innerWidth)).toBeTruthy();
    await page.screenshot({ path: 'test-results/references-' + width + '.png', fullPage: true });
    await expect(page.getByRole('heading', { name: 'References & inspiration', exact: true })).toBeVisible();
    await page.goto('/links');
    await expect(page.getByRole('link', { name: /References & inspiration/ })).toHaveAttribute('href', '/references');
  });
}
