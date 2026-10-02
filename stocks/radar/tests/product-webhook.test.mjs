import { test } from 'node:test';
import assert from 'node:assert/strict';
import { createHmac } from 'node:crypto';
import { handleWebhook, verifyStripeSignature } from '../workers/product-delivery/webhook.mjs';
const now = 1800000000000, secret = 'whsec_unitTestOnly';
const sign = (body, time = now / 1000) => `t=${time},v1=${createHmac('sha256', secret).update(`${time}.${body}`).digest('hex')}`;
const event = () => ({ object: 'event', id: 'evt_fixture', livemode: false, type: 'checkout.session.completed', data: { object: {
  object: 'checkout.session', id: 'cs_test_fixture123456', livemode: false, payment_link: 'plink_fixture', mode: 'payment', status: 'complete', payment_status: 'paid',
} } });
const request = (body, signature = sign(body)) => new Request('https://delivery.example/stripe/webhook', { method: 'POST', body, headers: { 'Stripe-Signature': signature } });
function setup() {
  const jobs = new Map(); let writes = 0;
  const env = { WEBHOOK_ENABLED: 'true', STRIPE_MODE: 'test', STRIPE_WEBHOOK_SECRET: secret, STRIPE_PAYMENT_LINK_ID: 'plink_fixture',
    ORDERS: { prepare(sql) { assert.match(sql, /ON CONFLICT\(session_id\) DO NOTHING/); return { bind(id, eid, created) { return { async run() { writes++; if (!jobs.has(id)) jobs.set(id, { eid, created }); return { success: true }; } }; } }; } } };
  return { env, jobs, writes: () => writes };
}
test('signature verification rejects tampering, replay and invalid timestamps; supports rotation signatures', async () => {
  const body = JSON.stringify(event()), valid = sign(body);
  assert.equal(await verifyStripeSignature(body, valid, secret, now), true);
  for (const header of ['', sign(body, now / 1000 - 301), sign(body, now / 1000 + 301), `t=x,v1=${'0'.repeat(64)}`, `${valid},t=1`]) {
    assert.equal(await verifyStripeSignature(body, header, secret, now), false);
  }
  assert.equal(await verifyStripeSignature(body+' ', valid, secret, now), false);
  assert.equal(await verifyStripeSignature(body, valid, 'whsec_wrong', now), false);
  assert.equal(await verifyStripeSignature(body, `${valid},v1=${'0'.repeat(64)}`, secret, now), true);
});
test('paid events persist session reference without customer data; duplicate event types target one job', async () => {
  const { env, jobs } = setup(); const value = event();
  value.data.object.customer_details = { email: 'not-stored@example.com' };
  for (const type of ['checkout.session.completed','checkout.session.async_payment_succeeded']) {
    value.type = type;
    assert.equal((await handleWebhook(request(JSON.stringify(value)), env, now)).status, 200);
  }
  assert.equal(jobs.size, 1); assert.doesNotMatch(JSON.stringify([...jobs]), /not-stored/);
});
test('invalid signature, wrong mode, unrelated product and unpaid events never enter outbox', async () => {
  for (const mutate of [e => e.livemode = true, e => e.data.object.payment_link = 'plink_other', e => e.data.object.payment_status = 'unpaid', e => e.type = 'customer.created']) {
    const { env, writes } = setup(); const value = event(); mutate(value);
    assert.equal((await handleWebhook(request(JSON.stringify(value)), env, now)).status, 200); assert.equal(writes(), 0);
  }
  const { env, writes } = setup();
  assert.equal((await handleWebhook(request(JSON.stringify(event()), 'bad'), env, now)).status, 400); assert.equal(writes(), 0);
});
test('disabled webhook, malformed JSON, oversized payloads and storage errors fail safely', async () => {
  const { env } = setup();
  assert.equal((await handleWebhook(request('{}'), { ...env, WEBHOOK_ENABLED: 'false' }, now)).status, 503);
  assert.equal((await handleWebhook(request('{'), env, now)).status, 400);
  assert.equal((await handleWebhook(request('x'.repeat(262145)), env, now)).status, 413);
  env.ORDERS.prepare = () => { throw new Error('private details'); };
  const result = await handleWebhook(request(JSON.stringify(event())), env, now);
  assert.equal(result.status, 503); assert.doesNotMatch(await result.text(), /private details/);
});
