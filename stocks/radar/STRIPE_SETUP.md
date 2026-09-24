# Stripe setup for the Research Workflow Pack

The owner supplied a Payment Link on September 24, 2026:
https://buy.stripe.com/eVqcN65BLaBJ0ye00GgA800

Read-only checkout inspection showed **StocksWatch Research Workflow Pack**, **$19.00**,
and merchant display name **Jacob Proj**. Stripe's rendered payment frame identifies
live mode. Treat this as a live checkout, not a sandbox link. No payment was attempted.
The checkout also displays full-name and phone-number fields; review whether these
are needed for a digital download before launch.

The link is recorded here only, not exposed as a purchase button. Checkout stays
closed on the website until payment and protected file delivery are tested together.
The existing live link can be retained for launch; create a separate sandbox link
using the steps below for integration testing.

## Create the first link in a Stripe sandbox

1. Open the Stripe Dashboard and switch to a sandbox/test environment.
2. Open **Payment Links**, select **New**, then **Add a new product**.
3. Name: **StocksWatch Research Workflow Pack**.
4. Description: **Ten editable Markdown research templates and guides in one ZIP.
   Includes an evidence register, assumptions log, quarterly review, and fictional
   worked example. Educational resources; not investment advice.**
5. Price: **USD 19.00**, **one-time**, quantity **1**. Do not select recurring billing.
6. Create the test link and share its public URL for integration. Keep secret keys
   in the deployment secret store, never browser code or this repository.

This creates a hosted checkout, not automatic ZIP delivery. Keep the initial
confirmation on Stripe while delivery is being implemented; do not redirect to a
public product ZIP or promise that an email was sent.

## Delivery work before launch

Proposed implementation: verified Stripe payment events trigger protected access
to the versioned ZIP in private storage. A Cloudflare implementation can be built
separately from the static Astro site. It needs server-side signature verification,
paid-status and product/price validation, duplicate-event handling, expiring download
access, and a transactional delivery channel. Buttondown newsletter consent stays
separate from purchases.

Test successful, failed and delayed payments, event retries, download expiry and
refund handling. Finalize seller/support details and purchase terms, then create
the live price/link and deploy only after the complete flow passes. Account fees
and tax settings depend on the seller's setup; no settings are changed by this guide.

Sources: [Create a Payment Link](https://docs.stripe.com/payment-links/create),
[Post-payment fulfillment](https://docs.stripe.com/payment-links/post-payment).


## Local delivery implementation (not deployed)

`workers/product-delivery/worker.mjs` implements `/complete` (verified download instructions) and `/download` (private ZIP). Both routes verify payment and file availability. The completion page includes no scripts, analytics or customer details and works without JavaScript.
It retrieves the Checkout Session directly from Stripe with expanded line items
and payment/charge details, verifies the configured Payment Link and Price IDs,
and streams a fixed versioned object from a private R2 binding named `PRODUCTS`.
It permits only completed, paid, one-time purchases; refunded or disputed charges
are denied. The session ID acts as a bearer credential and access expires seven
days after session creation. Do not share or log these URLs. Responses are not cached
and send no referrer. No browser API keys, public ZIP URL, or subscriber records
are introduced.

This is download authorization, not a complete fulfillment system. There is no
webhook, email delivery, order database or lost-link recovery yet. A customer who
closes checkout before returning would need a recovery process. Implement that
before launch; a successful redirect alone is not reliable delivery.

Configuration remains disabled in `workers/product-delivery/wrangler.jsonc`.
The eventual setup needs:

- A private R2 bucket bound as `PRODUCTS`, with public access disabled, containing
  `research-workflow-pack/1.0.0/stockswatch-research-workflow-pack-1.0.0.zip`.
- `STRIPE_SECRET_KEY` in the Worker's secret store (never `PUBLIC_`), with permission
  to retrieve sessions and expanded payment details. Test and live keys stay separate.
- Matching `STRIPE_MODE`, `STRIPE_PAYMENT_LINK_ID` (`plink_...`) and `STRIPE_PRICE_ID`
  (`price_...`). The public `buy.stripe.com` slug is not the Payment Link API ID.
- A chosen download hostname/route, then a sandbox return URL using Stripe's
  `{CHECKOUT_SESSION_ID}` placeholder: `https://YOUR-DELIVERY-HOST/complete?session_id={CHECKOUT_SESSION_ID}`. The hostname must be configured first; this is not a live URL.
- Review rate limits and platform access logging so session credentials are not
  retained. The Worker has no application logging and observability is disabled.

Current pricing validation is deliberately limited to one USD 19 item, no discounts,
and USD checkout currency. Tax may increase the total. Adaptive currency conversion,
discounts and other quantities are unsupported and must be resolved in sandbox
before selling; otherwise a paid customer could be denied a download. Support and
expiry terms must be presented before checkout.

Local tests mock Stripe and storage. `npm test` includes rejection and failure cases;
`npx wrangler deploy --dry-run --config workers/product-delivery/wrangler.jsonc`
checks bundling without deployment. No bucket, route, key, webhook, or payment is
created by these checks.

## Verified sandbox link

The owner supplied https://buy.stripe.com/test_eVqcN65BLaBJ0ye00GgA800.
Read-only inspection confirmed the **Sandbox** label, **Test Link** product name
and **$19.00** price. No order was submitted. The public link is ready for testing;
its actual sandbox `plink_...` and `price_...` IDs and server-side secret still need
to be configured before the Worker can authorize its purchases.

Sandbox identifiers supplied by the owner and saved in the disabled Worker config:
- Price: `price_1UJJL9JRFkKy1u6Rknhry6i2`
- Product: `prod_VJxFLM6gR3Xv9s`

The Worker checks both IDs. They have not yet been verified against the Stripe API.
Payment Link: `plink_1UJJLDJRFkKy1u6RiEkOn4Du` is now saved in the sandbox config.
All three IDs were supplied by the owner; their relationship still needs API verification.

## Cloudflare storage progress

R2 activated by owner. Created `stockswatch-products-sandbox` with Standard storage
and verified Public Access Disabled. Uploaded the 19.01 KB versioned product ZIP
at the exact object key above. The local Worker config now binds `PRODUCTS` to
that bucket. The Worker is still undeployed and disabled; Stripe secrets and
the download route remain outstanding. No public bucket access was enabled.

## Sandbox Worker deployed

Deployed `stockswatch-product-delivery-sandbox` with the `PRODUCTS` R2 binding.
Endpoint: https://stockswatch-product-delivery-sandbox.jacobidolor.workers.dev
Verified `/download` returns HTTP 503 with `Downloads are not open yet.` and
`Cache-Control: private, no-store`. `DELIVERY_ENABLED=false` remains in force.
The dashboard secret form is prepared for the owner to enter `STRIPE_SECRET_KEY`
from the same Stripe sandbox. No secret value was collected or stored in Git.
