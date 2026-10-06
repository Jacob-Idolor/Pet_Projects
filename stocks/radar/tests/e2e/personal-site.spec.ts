import { test, expect } from '@playwright/test';
import AxeBuilder from '@axe-core/playwright';

test('new reader journey works without JavaScript', async ({ browser, baseURL }) => {
  const context = await browser.newContext({ baseURL, javaScriptEnabled: false });
  const page = await context.newPage();
  await page.goto('/');
  await expect(page.getByRole('heading', { level: 1 })).toContainText('Make room for life.');
  await page.getByRole('link', { name: 'Explore the guides' }).click();
  await expect(page.locator('article.card')).toHaveCount(3);
  await page.getByRole('heading', { name: 'Before you automate, make the task smaller.' }).getByRole('link').click();
  await expect(page.getByRole('heading', { name: 'One small next step' })).toBeVisible();
  await expect(page.locator('form, iframe')).toHaveCount(0);
  await context.close();
});

for (const path of ['/', '/guides.html', '/resources.html', '/about.html', '/privacy.html', '/guides/before-you-automate.html', '/guides/ai-output-you-can-check.html', '/guides/starting-smaller.html']) {
  test(`mobile accessibility and metadata: ${path}`, async ({ page }) => {
    await page.setViewportSize({ width: 390, height: 844 });
    await page.goto(path);
    await expect(page.locator('h1')).toHaveCount(1);
    await expect(page.locator('link[rel="canonical"]')).toHaveAttribute('href', `https://stockswatch.cc${path}`);
    expect(await page.evaluate(() => document.documentElement.scrollWidth <= innerWidth)).toBe(true);
    const result = await new AxeBuilder({ page }).withTags(['wcag2a', 'wcag2aa', 'wcag21aa']).analyze();
    expect(result.violations).toEqual([]);
  });
}

test('keyboard navigation has a working skip link', async ({ page }) => {
  await page.goto('/');
  await page.keyboard.press('Tab');
  await expect(page.getByRole('link', { name: 'Skip to content' })).toBeFocused();
  await page.keyboard.press('Enter');
  await expect(page.locator('main')).toBeFocused();
});

test('retired routes explain the change and private/data files are absent', async ({ page, request }) => {
  for (const path of ['/research-kit.html', '/workflow-pack.html', '/datacenter.html', '/guides/nbis-sec-filings.html', '/guides/nbis-research-guide.html']) {
    await page.goto(path);
    await expect(page.getByRole('heading', { name: 'StocksWatch has retired.' })).toBeVisible();
    await expect(page.locator('meta[name="robots"]')).toHaveAttribute('content', 'noindex,follow');
  }
  for (const path of ['/nbis.json', '/screener.json', '/health.json', '/settings.json', '/downloads/ai-infrastructure-research-kit.md', '/downloads/stockswatch-research-workflow-pack.zip']) {
    expect((await request.get(path)).status()).toBe(404);
  }
});

test('all internal page links resolve and no third-party scripts are loaded', async ({ page, request }) => {
  const paths = ['/', '/guides.html', '/resources.html', '/about.html', '/privacy.html', '/guides/before-you-automate.html', '/guides/ai-output-you-can-check.html', '/guides/starting-smaller.html'];
  const links = new Set<string>();
  for (const path of paths) {
    await page.goto(path);
    await expect(page.locator('script[src], form')).toHaveCount(0);
    for (const href of await page.locator('a[href^="/"]').evaluateAll(nodes => nodes.map(node => node.getAttribute('href')!))) links.add(href);
  }
  for (const href of links) expect((await request.get(href)).status(), href).toBe(200);
});
