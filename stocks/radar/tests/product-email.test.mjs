import { test } from 'node:test';
import assert from 'node:assert/strict';
import { sendDeliveryEmail } from '../workers/product-delivery/email.mjs';
const now = 1800000000000;
const purchase = { sessionId: 'cs_test_abcdefgh12345678', email: 'tester@example.com', created: now / 1000 - 60 };
const env = { EMAIL_ENABLED: 'true', RESEND_API_KEY: 're_fixture', EMAIL_FROM: 'delivery@example.com',
  EMAIL_REPLY_TO: 'support@example.com', DELIVERY_ORIGIN: 'https://delivery.example.com',
  STRIPE_MODE: 'test', EMAIL_TEST_RECIPIENT: purchase.email };
test('email stays disabled or fails closed before making a provider request', async () => {
  const never = () => assert.fail('unexpected email request');
  for (const overrides of [{ EMAIL_ENABLED: 'false' }, { RESEND_API_KEY: '' },
    { DELIVERY_ORIGIN: 'http://example.com' }, { DELIVERY_ORIGIN: 'https://example.com/other' },
    { EMAIL_TEST_RECIPIENT: 'someoneelse@example.com' }, { EMAIL_FROM: 'bad\nheader@example.com' }]) {
    assert.notEqual((await sendDeliveryEmail(purchase, { ...env, ...overrides }, never, now)).status, 'accepted');
  }
  for (const overrides of [{ created: now / 1000 - 7 * 86400 }, { email: 'invalid' }, { sessionId: 'cs_live_abcdefgh12345678' }]) {
    assert.equal((await sendDeliveryEmail({ ...purchase, ...overrides }, env, never, now)).status, 'invalid_purchase');
  }
});
test('retries keep identical content and a stable non-bearer idempotency key', async () => {
  const calls = [];
  const send = async (url, options) => { calls.push({ url, ...options }); return Response.json({ id: 'email_fixture' }); };
  assert.equal((await sendDeliveryEmail(purchase, env, send, now)).status, 'accepted');
  await sendDeliveryEmail(purchase, env, send, now + 1000);
  assert.equal(calls[0].body, calls[1].body);
  assert.equal(calls[0].headers['Idempotency-Key'], calls[1].headers['Idempotency-Key']);
  assert.ok(!calls[0].headers['Idempotency-Key'].includes(purchase.sessionId));
  assert.equal(calls[0].url, 'https://api.resend.com/emails');
  const body = JSON.parse(calls[0].body);
  assert.deepEqual(body.to, [purchase.email]);
  assert.match(body.text, /https:\/\/delivery.example.com\/complete\?session_id=cs_test_/);
});
test('provider acceptance is distinct from retryable and permanent errors', async () => {
  for (const [code, status] of [[429, 'retry'], [503, 'retry'], [401, 'rejected'], [422, 'rejected']]) {
    assert.equal((await sendDeliveryEmail(purchase, env, async () => new Response('', { status: code }), now)).status, status);
  }
  assert.equal((await sendDeliveryEmail(purchase, env, async () => { throw new Error('timeout'); }, now)).status, 'retry');
});
