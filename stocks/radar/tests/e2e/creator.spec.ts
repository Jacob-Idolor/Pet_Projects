import { test, expect } from '@playwright/test';
import AxeBuilder from '@axe-core/playwright';

for (const width of [320, 390, 768, 1024, 1440]) {
  for (const path of ['/', '/links', '/about']) {
    test(`creator layout and accessibility ${path} at ${width}px`, async ({ page }) => {
      await page.setViewportSize({ width, height: 900 });
      await page.goto(path);
      await page.evaluate(() => document.fonts.ready);
      expect(await page.evaluate(() => document.documentElement.scrollWidth <= innerWidth)).toBe(true);
      await expect(page.locator('h1')).toHaveCount(1);
      await expect(page.locator('a[href*="snapchat"]')).toHaveCount(0);
      const facebook = page.locator('a[href="https://www.facebook.com/profile.php?id=61596047859545"]');
      await expect(facebook).toHaveCount(1);
      await expect(facebook).toHaveAttribute('href', 'https://www.facebook.com/profile.php?id=61596047859545');
      await expect(facebook).toHaveAttribute('target', '_blank');
      await expect(facebook).toHaveAttribute('rel', 'noopener noreferrer');
      await expect(page.getByText('Profile link coming soon', { exact: true })).toHaveCount(0);
      expect((await new AxeBuilder({ page }).withTags(['wcag2a','wcag2aa','wcag21aa']).analyze()).violations).toEqual([]);
      await page.screenshot({ path: `test-results/creator-${path === '/' ? 'home' : path.slice(1)}-${width}.png`, fullPage: true });
    });
  }
}

test('visible mobile navigation works by keyboard without scripts', async ({ browser, baseURL }) => {
  const context = await browser.newContext({ baseURL, javaScriptEnabled: false, viewport: { width: 320, height: 844 } });
  const page = await context.newPage();
  await page.goto('/');
  const navigation = page.getByRole('navigation', { name: 'Primary' });
  const stories = navigation.getByRole('link', { name: 'Stories', exact: true });
  await expect(stories).toBeVisible();
  await stories.focus();
  await page.keyboard.press('Enter');
  await expect(page.locator('#stories')).toBeFocused();
  await page.keyboard.press('Tab');
  await expect(page.locator('#stories a').first()).toBeFocused();
  await navigation.getByRole('link', { name: 'Links', exact: true }).focus();
  await page.keyboard.press('Enter');
  await expect(page).toHaveURL(/\/links$/);
  await page.getByRole('navigation', { name: 'Primary' }).getByRole('link', { name: 'About', exact: true }).focus();
  await page.keyboard.press('Enter');
  await expect(page).toHaveURL(/\/about$/);
  await expect(page.locator('#profiles')).toBeVisible();
  await context.close();
});

test('approved topic and work destinations are real confirmed links', async ({ page }) => {
  await page.goto('/');
  for (const href of ['https://idolorthoughts.substack.com/', 'https://www.goodreads.com/user/show/109460896-jacob', 'https://www.twitch.tv/jakecuzzi']) {
    await expect(page.locator(`.topic-card[href="${href}"]`)).toBeVisible();
  }
  const image = page.locator('.creator-image');
  await expect(image).toHaveAttribute('alt', '');
  expect(await image.evaluate((element: HTMLImageElement) => element.complete && element.naturalWidth > 0)).toBe(true);
  await expect(image).toHaveAttribute('src', /\/_astro\/.+\.webp/);
  await expect(page.locator('.creator-page')).not.toContainText('Monitoring & Alert Health Check');
  await page.goto('/links');
  await expect(page.locator('#work').getByRole('link', { name: 'Upwork', exact: false })).toHaveAttribute('href', 'https://www.upwork.com/freelancers/~01970b1d2f8e96b33f');
  await expect(page.locator('#work').getByRole('link', { name: 'Guru', exact: false })).toHaveAttribute('href', 'https://www.guru.com/freelancers/jacob-idolor');
});

test('200 percent zoom reflow retains text, disclosures and usable navigation', async ({ page }) => {
  // A 1440px desktop viewport at 200% browser zoom has a 720 CSS-pixel layout viewport.
  await page.setViewportSize({ width: 720, height: 450 });
  for (const path of ['/', '/links', '/consulting']) {
    await page.goto(path);
    expect(await page.evaluate(() => document.documentElement.scrollWidth <= innerWidth)).toBe(true);
    await expect(page.getByRole('navigation', { name: 'Primary' })).toBeVisible();
    if (path === '/links') await expect(page.getByRole('article', { name: 'HSA Store' })).toContainText('loyalty points');
  }
});
