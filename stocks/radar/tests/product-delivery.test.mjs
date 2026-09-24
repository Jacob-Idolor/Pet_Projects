import { test } from 'node:test';
import assert from 'node:assert/strict';
import { handleDownload } from '../workers/product-delivery/worker.mjs';

const id = 'cs_test_abcdefgh12345678';
const now = 1800000000000;
function fixture() {
  return {
    id, livemode: false, mode: 'payment', status: 'complete', payment_status: 'paid',
    payment_link: 'plink_expected', currency: 'usd', amount_subtotal: 1900, amount_total: 1900,
    total_details: { amount_discount: 0 }, created: now / 1000 - 60,
    line_items: { has_more: false, data: [{ quantity: 1,
      price: { product: 'prod_expected', id: 'price_expected', unit_amount: 1900, currency: 'usd', type: 'one_time' } }] },
    payment_intent: { status: 'succeeded', latest_charge: {
      paid: true, refunded: false, amount_refunded: 0, disputed: false,
    } },
  };
}
async function run(session = fixture(), overrides = {}, request = new Request(`https://download.example/download?session_id=${id}`), upstream) {
  let reads = 0;
  const env = {
    DELIVERY_ENABLED: 'true', STRIPE_MODE: 'test', STRIPE_SECRET_KEY: 'sk_test_fixture',
    STRIPE_PAYMENT_LINK_ID: 'plink_expected', STRIPE_PRICE_ID: 'price_expected', STRIPE_PRODUCT_ID: 'prod_expected',
    PRODUCTS: { get: async key => { reads++; assert.match(key, /^research-workflow-pack\/1\.0\.0\//); return { body: 'private-zip' }; } },
    ...overrides,
  };
  const response = await handleDownload(request, env, upstream || (async (url, options) => {
    assert.equal(url.origin, 'https://api.stripe.com');
    assert.equal(url.pathname, `/v1/checkout/sessions/${id}`);
    assert.equal(options.headers.Authorization, 'Bearer sk_test_fixture');
    return Response.json(session);
  }), now);
  return { response, reads };
}

test('verified purchase streams only the fixed private ZIP without caching', async () => {
  const { response, reads } = await run();
  assert.equal(response.status, 200); assert.equal(reads, 1);
  assert.equal(await response.text(), 'private-zip');
  assert.equal(response.headers.get('Cache-Control'), 'private, no-store');
  assert.equal(response.headers.get('Referrer-Policy'), 'no-referrer');
  assert.equal(response.headers.get('Content-Type'), 'application/zip');
});

test('rejects unpaid, wrong-product, refunded, disputed, malformed and expired purchases before storage access', async () => {
  const changes = [
    s => s.payment_status = 'unpaid', s => s.status = 'open', s => s.mode = 'subscription',
    s => s.livemode = true, s => s.id = 'cs_test_other', s => s.payment_link = 'plink_other',
    s => s.line_items.data[0].price.product = 'prod_other',
    s => s.currency = 'eur', s => s.amount_subtotal = 1, s => s.amount_total = 0,
    s => s.total_details.amount_discount = 100, s => s.line_items.has_more = true,
    s => s.line_items.data.push(s.line_items.data[0]), s => s.line_items.data[0].quantity = 2,
    s => s.line_items.data[0].price.id = 'price_other', s => s.line_items.data[0].price.type = 'recurring',
    s => s.payment_intent = 'pi_notexpanded', s => s.payment_intent.latest_charge.refunded = true,
    s => s.payment_intent.latest_charge.amount_refunded = 1,
    s => s.payment_intent.latest_charge.disputed = true, s => delete s.payment_intent.latest_charge.paid,
    s => s.created = now / 1000 - 8 * 86400, s => s.created = now / 1000 + 60,
    s => delete s.created,
  ];
  for (const change of changes) {
    const session = fixture(); change(session);
    const { response, reads } = await run(session);
    assert.ok([403, 410].includes(response.status), String(change)); assert.equal(reads, 0);
  }
});

test('disabled and incomplete configuration cannot access Stripe or storage', async () => {
  for (const overrides of [{ DELIVERY_ENABLED: 'false' }, { STRIPE_SECRET_KEY: '' },
    { STRIPE_SECRET_KEY: 'sk_live_mismatch' }, { STRIPE_MODE: '' }, { STRIPE_PRICE_ID: '' }]) {
    const { response, reads } = await run(fixture(), overrides, undefined, () => { throw new Error('must not call'); });
    assert.equal(response.status, 503); assert.equal(reads, 0);
  }
});

test('rejects invalid routes, methods, session IDs and duplicate parameters', async () => {
  for (const [path, method, status] of [
    ['/file.zip', 'GET', 404], ['/download', 'POST', 405], ['/download', 'GET', 400],
    ['/download?session_id=../secret', 'GET', 400],
    [`/download?session_id=${id}&session_id=${id}`, 'GET', 400],
    ['/download?session_id=cs_live_abcdefgh1234', 'GET', 400],
  ]) {
    const { response, reads } = await run(fixture(), {}, new Request(`https://download.example${path}`, { method }));
    assert.equal(response.status, status); assert.equal(reads, 0);
  }
});

test('Stripe and storage failures return generic retry responses with no leaked details', async () => {
  for (const upstream of [async () => new Response('secret', { status: 500 }),
    async () => { throw new Error('secret'); }, async () => new Response('invalid JSON')]) {
    const { response, reads } = await run(fixture(), {}, undefined, upstream);
    assert.equal(response.status, 503); assert.equal(reads, 0); assert.doesNotMatch(await response.text(), /secret/);
  }
  const { response } = await run(fixture(), { PRODUCTS: { get: async () => null } });
  assert.equal(response.status, 503);
});

test('completion page verifies payment and file availability before offering a private download', async () => {
  const request = new Request(`https://download.example/complete?session_id=${id}`);
  const { response } = await run(fixture(), {}, request);
  assert.equal(response.status, 200);
  const html = await response.text();
  assert.match(html, /Your download is ready/);
  assert.ok(html.includes(`/download?session_id=${id}`));
  assert.doesNotMatch(html, /<script|<iframe|customer_email/);
  assert.match(response.headers.get('Content-Security-Policy'), /default-src 'none'/);
  const unpaid = fixture(); unpaid.payment_status = 'unpaid';
  const denied = await run(unpaid, {}, request);
  assert.equal(denied.response.status, 403); assert.equal(denied.reads, 0);
  const missing = await run(fixture(), { PRODUCTS: { get: async () => null } }, request);
  assert.equal(missing.response.status, 503);
});
