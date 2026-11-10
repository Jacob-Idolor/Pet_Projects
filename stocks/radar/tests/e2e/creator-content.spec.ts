// Prepared for coordinated Chrome QA; do not launch while another task owns Chrome.
import { test, expect } from '@playwright/test';

test('approved book cover and public video links render without embeds', async ({ page }) => {
  await page.goto('/');
  const feature = page.getByRole('region', { name: 'Pick My Next Book', exact: true });
  await expect(feature.getByRole('img')).toHaveAttribute('alt', /Pick My Next Book cover/);
  await expect(feature.getByRole('link', { name: 'Watch the vote video' })).toHaveAttribute('href', 'https://www.facebook.com/reel/1177645378281616');
  await expect(feature.getByRole('link')).toHaveCount(4);
  await expect(page.locator('#recent-videos article')).toHaveCount(3);
  await expect(page.locator('iframe, form, script[src]')).toHaveCount(0);
  await expect(page.locator('meta[property="og:image"]')).toHaveAttribute('content', 'https://stockswatch.cc/social/j-sol-share.png');
  for (const width of [390, 1440]) {
    await page.setViewportSize({ width, height: 900 });
    const image = feature.getByRole('img');
    await expect(image).toBeVisible();
    const geometry = await image.evaluate((element: HTMLImageElement) => ({
      complete: element.complete, naturalWidth: element.naturalWidth,
      naturalRatio: element.naturalWidth / element.naturalHeight,
      renderedRatio: element.getBoundingClientRect().width / element.getBoundingClientRect().height,
    }));
    expect(geometry.complete && geometry.naturalWidth > 0).toBe(true);
    expect(Math.abs(geometry.naturalRatio - geometry.renderedRatio)).toBeLessThan(0.005);
    await feature.screenshot({ path: `test-results/book-vote-chrome-${width}.png` });
  }
  await page.goto('/social/j-sol-share.png');
  await page.screenshot({ path: 'test-results/share-image-chrome.png' });
});

test('shared responsive navigation preserves Stories and Watch anchors', async ({ page }) => {
  await page.goto('/');
  for (const [label, href] of [['Stories', '/#stories'], ['Watch', '/#recent-videos']]) {
    await expect(page.locator('.primary-navigation').getByRole('link', { name: label, exact: true })).toHaveAttribute('href', href);
  }
});

test('creator About context precedes preserved engineering and consulting', async ({ page }) => {
  await page.goto('/about');
  await expect(page.locator('.about-intro')).toContainText('Books, personal reflections, gaming');
  await expect(page.getByRole('heading', { name: 'Engineering & consulting' })).toBeVisible();
  await expect(page.locator('#profiles a[href="https://www.facebook.com/profile.php?id=61596047859545"]')).toHaveCount(1);
  await expect(page.locator('.about-story a[href="/consulting"]')).toHaveCount(1);
});

for (const width of [320, 390, 768]) {
  test(`visible mobile anchors focus unobscured targets repeatedly at ${width}px`, async ({ page }) => {
    await page.setViewportSize({ width, height: 844 });
    await page.goto('/');
    const navigation = page.getByRole('navigation', { name: 'Primary' });
    await expect(page.locator('[popover], .menu-toggle')).toHaveCount(0);
    for (const [label, id] of [['Stories', 'stories'], ['Watch', 'recent-videos'], ['Stories', 'stories'], ['Watch', 'recent-videos']]) {
      const link = navigation.getByRole('link', { name: label, exact: true });
      await expect(link).toBeVisible();
      const size = await link.boundingBox();
      expect(size?.height).toBeGreaterThanOrEqual(44);
      await link.click();
      await expect(page).toHaveURL(new RegExp(`#${id}$`));
      const target = page.locator(`#${id}`);
      await expect(target).toBeFocused();
      await expect(target).toBeInViewport();
      const geometry = await target.boundingBox();
      expect(geometry?.y).toBeGreaterThanOrEqual(0);
      await page.screenshot({ path: `test-results/mobile-anchor-${id}-${width}.png` });
    }
  });
}
