// Transport only: the future queue consumer must reauthorize the Stripe purchase
// before calling this function. This module is not wired to a live trigger.
const mailbox = value => typeof value === 'string' && value.length <= 254 &&
  /^[^\s<>@]+@[^\s<>@]+\.[^\s<>@]+$/.test(value);

export async function sendDeliveryEmail(purchase, env, send = fetch, now = Date.now()) {
  if (env.EMAIL_ENABLED !== 'true') return { status: 'disabled' };
  if (!env.RESEND_API_KEY?.startsWith('re_') || !mailbox(env.EMAIL_FROM) ||
      !mailbox(env.EMAIL_REPLY_TO)) return { status: 'configuration_error' };
  let origin;
  try {
    origin = new URL(env.DELIVERY_ORIGIN);
    if (origin.protocol !== 'https:' || origin.username || origin.password ||
        origin.pathname !== '/' || origin.search || origin.hash) throw new Error();
  } catch { return { status: 'configuration_error' }; }
  const mode = env.STRIPE_MODE;
  if (!['test', 'live'].includes(mode) ||
      !new RegExp(`^cs_${mode}_[A-Za-z0-9]{8,200}$`).test(purchase?.sessionId || '') ||
      !mailbox(purchase?.email) || !Number.isSafeInteger(purchase?.created) ||
      purchase.created > now / 1000 || purchase.created + 7 * 86400 <= now / 1000) {
    return { status: 'invalid_purchase' };
  }
  // Sandbox delivery can reach only one explicitly configured consenting tester.
  if (mode === 'test' && purchase.email !== env.EMAIL_TEST_RECIPIENT) {
    return { status: 'test_recipient_blocked' };
  }
  const link = new URL('/complete', origin);
  link.searchParams.set('session_id', purchase.sessionId);
  const expires = new Date((purchase.created + 7 * 86400) * 1000).toISOString();
  const body = {
    from: env.EMAIL_FROM, to: [purchase.email], reply_to: env.EMAIL_REPLY_TO,
    subject: 'Your StocksWatch Research Workflow Pack',
    text: `Your Research Workflow Pack is ready.\n\nDownload your ten editable Markdown documents:\n${link.href}\n\nAccess expires ${expires}. Save and extract the ZIP, then open 00-start-here.md. Keep this link private and keep your downloaded files.\n\nFor help, reply to this email. This purchase does not subscribe you to the newsletter.\n\nEducational resources; not financial advice.`,
  };
  // Hash the bearer reference rather than putting it in provider request metadata.
  const digest = await crypto.subtle.digest('SHA-256', new TextEncoder().encode(purchase.sessionId));
  const key = Array.from(new Uint8Array(digest), byte => byte.toString(16).padStart(2, '0')).join('');
  try {
    const result = await send('https://api.resend.com/emails', {
      method: 'POST', headers: { Authorization: `Bearer ${env.RESEND_API_KEY}`,
        'Content-Type': 'application/json', 'Idempotency-Key': `workflow-pack-v1-${key}` },
      body: JSON.stringify(body), signal: AbortSignal.timeout(10000),
    });
    if (result.ok) {
      const data = await result.json();
      return typeof data.id === 'string' && data.id ? { status: 'accepted' } : { status: 'retry' };
    }
    return { status: result.status === 429 || result.status >= 500 ? 'retry' : 'rejected' };
  } catch { return { status: 'retry' }; }
}
