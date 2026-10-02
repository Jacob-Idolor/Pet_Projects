const encoder = new TextEncoder();
const response = (message, status) => new Response(message, { status, headers: { 'Cache-Control': 'no-store' } });

export async function verifyStripeSignature(body, header, secret, now = Date.now()) {
  if (!header || !secret?.startsWith('whsec_')) return false;
  const parts = header.split(',').map(part => part.trim().split('='));
  const timestamps = parts.filter(([name]) => name === 't');
  if (timestamps.length !== 1 || !/^\d+$/.test(timestamps[0][1])) return false;
  const timestamp = Number(timestamps[0][1]);
  if (!Number.isSafeInteger(timestamp) || Math.abs(now / 1000 - timestamp) > 300) return false;
  const signatures = parts.filter(([name, value]) => name === 'v1' && /^[a-f0-9]{64}$/i.test(value));
  const key = await crypto.subtle.importKey('raw', encoder.encode(secret), { name: 'HMAC', hash: 'SHA-256' }, false, ['verify']);
  for (const [, signature] of signatures) {
    const bytes = Uint8Array.from(signature.match(/../g), pair => parseInt(pair, 16));
    if (await crypto.subtle.verify('HMAC', key, bytes, encoder.encode(`${timestamp}.${body}`))) return true;
  }
  return false;
}

// Store only the session reference, never the webhook payload or customer email.
// The delivery consumer must re-fetch and authorize the purchase before sending.
export async function handleWebhook(request, env, now = Date.now()) {
  if (request.method !== 'POST') return response('Use POST.', 405);
  if (env.WEBHOOK_ENABLED !== 'true' || !env.ORDERS?.prepare ||
      !env.STRIPE_WEBHOOK_SECRET?.startsWith('whsec_') ||
      !['test', 'live'].includes(env.STRIPE_MODE) ||
      !/^plink_[A-Za-z0-9]+$/.test(env.STRIPE_PAYMENT_LINK_ID || '')) {
    return response('Webhook is not configured.', 503);
  }
  // Bound the actual streamed bytes, including chunked requests without Content-Length.
  const reader = request.body?.getReader();
  if (!reader) return response('Missing body.', 400);
  const chunks = []; let length = 0;
  try {
    while (true) {
      const { value, done } = await reader.read();
      if (done) break;
      length += value.byteLength;
      if (length > 262144) { await reader.cancel(); return response('Payload too large.', 413); }
      chunks.push(value);
    }
    const bytes = new Uint8Array(length); let offset = 0;
    for (const chunk of chunks) { bytes.set(chunk, offset); offset += chunk.byteLength; }
    const body = new TextDecoder('utf-8', { fatal: true }).decode(bytes);
    if (!await verifyStripeSignature(body, request.headers.get('Stripe-Signature'), env.STRIPE_WEBHOOK_SECRET, now)) {
      return response('Invalid signature.', 400);
    }
    let event;
    try { event = JSON.parse(body); } catch { return response('Invalid event.', 400); }
    if (!event || !/^evt_[A-Za-z0-9]+$/.test(event.id || '') || event.object !== 'event') return response('Invalid event.', 400);
    if (!['checkout.session.completed', 'checkout.session.async_payment_succeeded'].includes(event.type)) return response('Ignored.', 200);
    const session = event.data?.object;
    const live = env.STRIPE_MODE === 'live';
    if (event.livemode !== live || session?.livemode !== live || session?.object !== 'checkout.session' ||
        session?.payment_link !== env.STRIPE_PAYMENT_LINK_ID || session?.mode !== 'payment' ||
        session?.status !== 'complete' || session?.payment_status !== 'paid') return response('Ignored.', 200);
    if (!new RegExp(`^cs_${live ? 'live' : 'test'}_[A-Za-z0-9]{8,200}$`).test(session.id || '')) return response('Invalid session.', 400);
    const result = await env.ORDERS.prepare(`INSERT INTO delivery_jobs (session_id, first_event_id, created_at, status)
      VALUES (?1, ?2, ?3, 'pending') ON CONFLICT(session_id) DO NOTHING`)
      .bind(session.id, event.id, Math.floor(now / 1000)).run();
    if (!result.success) return response('Please retry.', 503);
    return response('Accepted.', 200);
  } catch {
    // Do not acknowledge storage failures: Stripe must retry rather than lose the order.
    return response('Please retry.', 503);
  }
}
