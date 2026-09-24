const headers = {
  'Cache-Control': 'private, no-store',
  'Referrer-Policy': 'no-referrer',
  'X-Content-Type-Options': 'nosniff',
  'X-Robots-Tag': 'noindex, nofollow',
  'Content-Security-Policy': "default-src 'none'; frame-ancestors 'none'",
};
const reply = (message, status) => new Response(message, { status, headers });

// Kept separate from Astro and disabled by default. No customer information is logged.
export async function handleDownload(request, env, fetchStripe = fetch, now = Date.now()) {
  const url = new URL(request.url);
  if (!['/download', '/complete'].includes(url.pathname)) return reply('Not found.', 404);
  if (request.method !== 'GET') return reply('Use GET.', 405);
  if (env.DELIVERY_ENABLED !== 'true') return reply('Downloads are not open yet.', 503);
  const live = env.STRIPE_MODE === 'live';
  if (!['test', 'live'].includes(env.STRIPE_MODE) ||
      !new RegExp(`^(sk|rk)_${live ? 'live' : 'test'}_`).test(env.STRIPE_SECRET_KEY || '') ||
      !/^plink_[A-Za-z0-9]+$/.test(env.STRIPE_PAYMENT_LINK_ID || '') ||
      !/^price_[A-Za-z0-9]+$/.test(env.STRIPE_PRICE_ID || '') ||
      !/^prod_[A-Za-z0-9]+$/.test(env.STRIPE_PRODUCT_ID || '') ||
      !env.PRODUCTS?.get) return reply('Download service is not configured.', 503);
  const id = url.searchParams.get('session_id') || '';
  if (url.searchParams.getAll('session_id').length !== 1 ||
      !new RegExp(`^cs_${live ? 'live' : 'test'}_[A-Za-z0-9]{8,200}$`).test(id)) {
    return reply('A valid checkout confirmation is required.', 400);
  }
  try {
    const endpoint = new URL(`https://api.stripe.com/v1/checkout/sessions/${id}`);
    endpoint.searchParams.append('expand[]', 'line_items');
    endpoint.searchParams.append('expand[]', 'payment_intent.latest_charge');
    const response = await fetchStripe(endpoint, {
      headers: { Authorization: `Bearer ${env.STRIPE_SECRET_KEY}` },
      signal: AbortSignal.timeout(10000),
    });
    if (response.status === 404) return reply('Checkout confirmation not found.', 403);
    if (!response.ok) return reply('Payment verification is temporarily unavailable. Retry later.', 503);
    const session = await response.json();
    const items = session.line_items;
    const line = items?.data?.[0];
    const charge = session.payment_intent?.latest_charge;
    const age = now / 1000 - session.created;
    // Exact USD price policy: discounts, adaptive currency and extra items fail closed.
    if (session.id !== id || session.livemode !== live || session.mode !== 'payment' ||
        session.status !== 'complete' || session.payment_status !== 'paid' ||
        session.payment_link !== env.STRIPE_PAYMENT_LINK_ID || session.currency !== 'usd' ||
        session.amount_subtotal !== 1900 || session.amount_total < 1900 ||
        !Number.isSafeInteger(session.amount_total) || session.total_details?.amount_discount !== 0 ||
        items?.has_more !== false || items?.data?.length !== 1 || line?.quantity !== 1 ||
        line?.price?.product !== env.STRIPE_PRODUCT_ID ||
        line?.price?.id !== env.STRIPE_PRICE_ID || line?.price?.unit_amount !== 1900 ||
        line?.price?.currency !== 'usd' || line?.price?.type !== 'one_time' ||
        session.payment_intent?.status !== 'succeeded' || charge?.paid !== true ||
        charge?.refunded !== false || charge?.amount_refunded !== 0 || charge?.disputed !== false) {
      return reply('This checkout does not authorize a download. Payment may still be pending.', 403);
    }
    if (!Number.isFinite(age) || age < 0 || age > 7 * 86400) {
      return reply('This download link has expired. Contact the seller for help.', 410);
    }
    const file = await env.PRODUCTS.get('research-workflow-pack/1.0.0/stockswatch-research-workflow-pack-1.0.0.zip');
    if (!file) return reply('The file is temporarily unavailable. Retry later.', 503);
    if (url.pathname === '/complete') {
      // Never include customer details or third-party scripts on this credential-bearing page.
      await file.body?.cancel?.();
      const expires = new Date((session.created + 7 * 86400) * 1000).toISOString().slice(0, 10);
      return new Response(`<!doctype html><html lang="en"><head><meta charset="utf-8">
<meta name="viewport" content="width=device-width, initial-scale=1">
<title>Your Research Workflow Pack | StocksWatch</title></head><body><main>
<p>StocksWatch / Research Workflow Pack</p><h1>Your download is ready.</h1>
<p>Your payment has been verified. Download your ten editable Markdown documents in one ZIP.</p>
<p><a href="/download?session_id=${encodeURIComponent(id)}">Download the Research Workflow Pack (ZIP)</a></p>
<h2>Start with one question</h2><ol><li>Save and extract the ZIP.</li>
<li>Open <strong>00-start-here.md</strong> in any text editor.</li>
<li>Make a working copy of the templates for your research.</li></ol>
<p>Download access expires on ${expires} (UTC), seven days after checkout began.
Keep your downloaded files. Keep this page link private; it grants download access.</p>
<p>Downloading does not subscribe you to a newsletter. No delivery email has been sent by this page.</p>
<p>Educational research resources. Not financial advice.</p>
<p><a href="https://stockswatch.cc/">Return to StocksWatch</a></p>
</main></body></html>`, { headers: { ...headers, 'Content-Type': 'text/html; charset=utf-8' } });
    }
    return new Response(file.body, { headers: {
      ...headers,
      'Content-Type': 'application/zip',
      'Content-Disposition': 'attachment; filename="stockswatch-research-workflow-pack-1.0.0.zip"',
    } });
  } catch {
    return reply('Download service is temporarily unavailable. Retry later.', 503);
  }
}

export default { fetch: (request, env) => handleDownload(request, env) };
