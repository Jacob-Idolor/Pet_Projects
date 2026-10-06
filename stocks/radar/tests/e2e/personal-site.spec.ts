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

for (const path of ['/', '/guides', '/resources', '/about', '/privacy', '/guides/before-you-automate', '/guides/ai-output-you-can-check', '/guides/starting-smaller']) {
  test(`mobile accessibility and metadata: ${path}`, async ({ page }) => {
    await page.setViewportSize({ width: 390, height: 844 });
    await page.goto(path);
    await expect(page.locator('h1')).toHaveCount(1);
    await expect(page.locator('meta[property="og:type"]')).toHaveAttribute('content', path.startsWith('/guides/') ? 'article' : 'website');
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
  const paths = ['/', '/guides', '/resources', '/about', '/privacy', '/guides/before-you-automate', '/guides/ai-output-you-can-check', '/guides/starting-smaller'];
  const links = new Set<string>();
  for (const path of paths) {
    await page.goto(path);
    await expect(page.locator('script[src], form')).toHaveCount(0);
    for (const href of await page.locator('a[href^="/"]').evaluateAll(nodes => nodes.map(node => node.getAttribute('href')!))) links.add(href);
  }
  for (const href of links) {
    expect(href, 'Internal links should use the canonical reader route').not.toMatch(/\.html(?:[?#]|$)/);
    expect((await request.get(href, { maxRedirects: 0 })).status(), href).toBe(200);
  }
});

test('start-here example is usable without JavaScript', async ({ browser, baseURL }) => {
  const context = await browser.newContext({ baseURL, javaScriptEnabled: false });
  const page = await context.newPage();
  await page.goto('/');
  await page.getByRole('link', { name: 'Start here: before you automate' }).click();
  await expect(page.getByRole('heading', { name: '5. Try a dry run, a failure and a recovery' })).toBeVisible();
  await expect(page.getByText('This is an illustrative filename exercise', { exact: false })).toBeVisible();
  await expect(page.getByText('Dry run: show notes-a.txt', { exact: false })).toContainText('Change no files');
  await expect(page.getByText('Apply in the test folder:', { exact: false })).toContainText('record the partial result');
  await expect(page.getByText('Recover: release the lock', { exact: false })).toContainText('Retry only the failed original-to-target pair');
  await context.close();
});

test('resources link to the four official documentation sites', async ({ page }) => {
  await page.goto('/resources');
  for (const [name, href] of [
    ['Astro: getting started', 'https://docs.astro.build/en/getting-started/'],
    ['GitHub: make and review a first change', 'https://docs.github.com/en/get-started/using-github/hello-world'],
    ['Cloudflare Pages documentation', 'https://developers.cloudflare.com/pages/'],
    ['Playwright: getting started', 'https://playwright.dev/docs/intro'],
  ]) {
    await expect(page.getByRole('link', { name, exact: true })).toHaveAttribute('href', href);
  }
});

test('sitemap URLs are direct 200 pages with matching canonicals', async ({ page, request }) => {
  const sitemap = await request.get('/sitemap.xml', { maxRedirects: 0 });
  expect(sitemap.status()).toBe(200);
  const urls = [...(await sitemap.text()).matchAll(/<loc>([^<]+)<\/loc>/g)].map(match => match[1]);
  expect(urls).toHaveLength(8);
  expect(new Set(urls).size).toBe(8);
  for (const url of urls) {
    const parsed = new URL(url);
    expect(parsed.origin).toBe('https://stockswatch.cc');
    expect(parsed.pathname).not.toMatch(/\.html$/);
    expect((await request.get(parsed.pathname, { maxRedirects: 0 })).status(), parsed.pathname).toBe(200);
    await page.goto(parsed.pathname);
    await expect(page.locator('link[rel="canonical"]')).toHaveAttribute('href', url);
    await expect(page.locator('meta[property="og:url"]')).toHaveAttribute('content', url);
  }
});

test('each article connects its visible author, dates and related guides to its metadata', async ({ page }) => {
  const slugs = ['before-you-automate', 'ai-output-you-can-check', 'starting-smaller'];
  for (const slug of slugs) {
    await page.goto(`/guides/${slug}`);
    const article = page.locator('article.article');
    await expect(article.locator('a[rel="author"]')).toHaveAttribute('href', '/about');
    const published = await article.locator('time').first().getAttribute('datetime');
    expect(published).toBe('2026-10-05');
    await expect(article.locator('time').first()).toHaveText('October 5, 2026');
    await expect(article.locator('.meta')).toContainText('Updated October 6, 2026');
    await expect(article.locator('time').nth(1)).toHaveAttribute('datetime', '2026-10-06');
    await expect(page.locator('meta[property="og:type"]')).toHaveAttribute('content', 'article');
    await expect(page.locator('meta[property="article:published_time"]')).toHaveAttribute('content', published!);
    const data = JSON.parse((await page.locator('script[type="application/ld+json"]').textContent())!);
    expect(data['@type']).toBe('BlogPosting');
    expect(data.headline).toBe(await article.locator('h1').textContent());
    expect(data.description).toBe(await page.locator('meta[name="description"]').getAttribute('content'));
    expect(data.datePublished).toBe(published);
    expect(data.dateModified).toBe('2026-10-06');
    await expect(page.locator('meta[property="article:modified_time"]')).toHaveAttribute('content', data.dateModified);
    expect(data.author).toEqual({ '@type': 'Person', name: 'Jacob', url: 'https://stockswatch.cc/about' });
    expect(data.url).toBe(`https://stockswatch.cc/guides/${slug}`);
    expect(data.mainEntityOfPage['@id']).toBe(data.url);
    const related = article.getByRole('region', { name: 'Keep exploring' }).getByRole('link');
    await expect(related).toHaveCount(2);
    expect(await related.evaluateAll(nodes => nodes.map(node => node.getAttribute('href')))).toEqual(slugs.filter(other => other !== slug).map(other => `/guides/${other}`));
  }
});