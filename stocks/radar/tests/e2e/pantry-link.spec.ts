import { test, expect } from '@playwright/test';

test.use({ javaScriptEnabled: false });

test('Pantry Pilot stays visible and keyboard accessible in the shared navigation', async ({ page }) => {
  for (const width of [320, 390, 768, 1440]) {
    await page.setViewportSize({ width, height: 900 });
    for (const path of ['/', '/links']) {
      await page.goto(path);
      const nav = page.getByRole('navigation', { name: 'Primary' });
      const pantry = nav.getByRole('link', { name: 'Pantry Pilot', exact: true });
      await expect(pantry).toBeVisible();
      await expect(pantry).toHaveAttribute('href', 'https://j-sol-pantry-pilot.supplesorbet16.chatgpt.site/');
      await pantry.focus();
      await expect(pantry).toBeFocused();
      const box = await pantry.boundingBox();
      expect(box).not.toBeNull();
      expect(box!.height).toBeGreaterThanOrEqual(44);
      expect(box!.x).toBeGreaterThanOrEqual(0);
      expect(box!.x + box!.width).toBeLessThanOrEqual(width);
      expect(await page.evaluate(() => document.documentElement.scrollWidth)).toBeLessThanOrEqual(width);
    }
  }
});
