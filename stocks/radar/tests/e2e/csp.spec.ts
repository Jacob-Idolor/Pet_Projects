import { test, expect } from '@playwright/test';
import { readFileSync, readdirSync, writeFileSync } from 'node:fs';
import { join } from 'node:path';
import { execFileSync } from 'node:child_process';

const routes = ['/', '/about', '/consulting', '/guides', '/resources', '/privacy', '/guides/before-you-automate', '/guides/ai-output-you-can-check', '/guides/starting-smaller'];
const csp = readFileSync('dist/_headers', 'utf8').match(/Content-Security-Policy:\s*([^\r\n]+)/i)![1];
const sourceTree = execFileSync('git', ['rev-parse', 'HEAD^{tree}'], { encoding: 'utf8' }).trim();
const reviewedHead = process.env.REVIEWED_HEAD_SHA || 'HEAD';
const reviewedTree = execFileSync('git', ['rev-parse', `${reviewedHead}^{tree}`], { encoding: 'utf8' }).trim();
const inventory = readdirSync('dist', { recursive: true }).filter(file => String(file).endsWith('.html')).map(file => {
  const html = readFileSync(join('dist', String(file)), 'utf8');
  return { file, inlineStyles: (html.match(/<style\b/gi) || []).length,
    styleAttributes: (html.match(/\sstyle\s*=/gi) || []).length,
    stylesheets: [...html.matchAll(/<link\b[^>]*>/gi)].filter(match => /rel=["']stylesheet["']/.test(match[0])).map(match => match[0]) };
});

for (const width of [1440, 390]) {
  test(`all active pages render without CSP violations at ${width}px`, async ({ page }, testInfo) => {
    expect(sourceTree, 'Tested integration tree must match the reviewed head tree').toBe(reviewedTree);
    expect(inventory.every(file => file.inlineStyles === 0 && file.styleAttributes === 0)).toBe(true);
    await page.setViewportSize({ width, height: 900 });
    await page.addInitScript(() => {
      (window as any).__cspViolations = [];
      document.addEventListener('securitypolicyviolation', event => {
        (window as any).__cspViolations.push({ directive: event.effectiveDirective, blockedURI: event.blockedURI });
      });
    });
    // Astro preview does not apply Cloudflare _headers. Apply the exact built
    // header to HTML responses so Chromium enforces the release policy in CI.
    await page.route('**/*', async route => {
      const response = await route.fetch();
      const headers = response.headers();
      await route.fulfill({ response, headers: headers['content-type']?.includes('text/html')
        ? { ...headers, 'content-security-policy': csp } : headers });
    });
    const pages = [];
    for (const route of routes) {
      const response = await page.goto(route);
      expect(response?.headers()['content-security-policy']).toBe(csp);
      await page.evaluate(async () => { await document.fonts.ready; await new Promise(requestAnimationFrame); });
      await expect(page.locator('style, [style]')).toHaveCount(0);
      await expect(page.locator('body')).toHaveCSS('font-family', /Segoe UI/);
      if (route === '/about') await expect(page.locator('.connect-heading')).toHaveCSS('display', 'grid');
      if (route === '/guides') await expect(page.locator('.guide-title').first()).toHaveCSS('font-size', '24px');
      if (route.startsWith('/guides/')) {
        await expect(page.locator('.callout-title')).toHaveCSS('margin-top', '0px');
        await expect(page.locator('.callout-title')).toHaveCSS('font-size', '20.8px');
      }
      const violations = await page.evaluate(() => (window as any).__cspViolations);
      pages.push({ route, violations });
      expect(violations, route).toEqual([]);
      const name = route === '/' ? 'home' : route.slice(1).replaceAll('/', '-');
      await page.screenshot({ path: testInfo.outputPath(`csp-${width}-${name}.png`), fullPage: true });
    }
    writeFileSync(testInfo.outputPath(`csp-${width}-evidence.json`), JSON.stringify({ reviewedHead, sourceTree, reviewedTree, csp, inventory, pages }, null, 2));
  });
}
