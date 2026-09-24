import { test, expect } from '@playwright/test';
import { handleDownload } from '../../workers/product-delivery/worker.mjs';

test('verified completion page supports keyboard download without JavaScript on mobile', async ({ browser }) => {
  const context = await browser.newContext({ javaScriptEnabled: false, viewport: { width: 375, height: 812 } });
  const id = 'cs_test_browserfixture';
  const env = { DELIVERY_ENABLED: 'true', STRIPE_MODE: 'test', STRIPE_SECRET_KEY: 'sk_test_fixture',
    STRIPE_PAYMENT_LINK_ID: 'plink_fixture', STRIPE_PRICE_ID: 'price_fixture', STRIPE_PRODUCT_ID: 'prod_fixture',
    PRODUCTS: { get: async () => ({ body: new ReadableStream({ start(c) { c.enqueue(new TextEncoder().encode('test zip')); c.close(); } }) }) } };
  const session = { id, livemode: false, mode: 'payment', status: 'complete', payment_status: 'paid',
    payment_link: 'plink_fixture', currency: 'usd', amount_subtotal: 1900, amount_total: 1900,
    total_details: { amount_discount: 0 }, created: Math.floor(Date.now() / 1000),
    line_items: { has_more: false, data: [{ quantity: 1, price: { product: 'prod_fixture', id: 'price_fixture', unit_amount: 1900, currency: 'usd', type: 'one_time' } }] },
    payment_intent: { status: 'succeeded', latest_charge: { paid: true, refunded: false, amount_refunded: 0, disputed: false } } };
  await context.route('https://delivery.example/**', async route => {
    const response = await handleDownload(new Request(route.request().url()), env, async () => Response.json(session));
    await route.fulfill({ status: response.status, headers: Object.fromEntries(response.headers), body: Buffer.from(await response.arrayBuffer()) });
  });
  const page = await context.newPage();
  await page.goto(`https://delivery.example/complete?session_id=${id}`);
  await expect(page.getByRole('heading', { level: 1 })).toHaveText('Your download is ready.');
  expect(await page.evaluate(() => document.documentElement.scrollWidth <= innerWidth)).toBe(true);
  await page.keyboard.press('Tab');
  await expect(page.getByRole('link', { name: 'Download the Research Workflow Pack (ZIP)' })).toBeFocused();
  const download = page.waitForEvent('download');
  await page.keyboard.press('Enter');
  expect((await download).suggestedFilename()).toBe('stockswatch-research-workflow-pack-1.0.0.zip');
  await context.close();
});
