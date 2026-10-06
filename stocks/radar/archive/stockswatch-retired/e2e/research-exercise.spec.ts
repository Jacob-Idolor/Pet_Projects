import { test, expect } from '@playwright/test';

test('exercise works without JavaScript and does not require submission', async ({ browser, baseURL }) => {
  const context = await browser.newContext({ baseURL, javaScriptEnabled: false, viewport: { width: 390, height: 844 } });
  const page = await context.newPage();
  await page.goto('/research-kit.html');
  await page.getByRole('link', { name: 'Try the guided exercise' }).click();
  await page.getByLabel('Your research note').fill('Revenue increased 50%; cause unknown.');
  await page.getByLabel('Your research note').press('Tab');
  await expect(page.locator('#practice summary')).toBeFocused();
  await page.locator('#practice summary').press('Enter');
  await expect(page.locator('#practice details')).toHaveAttribute('open', '');
  await expect(page.locator('#practice')).toContainText('USD 6 million');
  await expect(page.locator('#practice')).toContainText('not submitted or saved');
  await expect(page.locator('#practice form')).toHaveCount(0);
  expect(await page.evaluate(() => document.documentElement.scrollWidth <= innerWidth)).toBe(true);
  await page.goto('/');
  await expect(page.locator('#nbis-data-dates')).toContainText('Snapshot fetched:');
  await expect(page.locator('#nbis-data-dates')).toContainText('Latest daily price:');
  await context.close();
});
