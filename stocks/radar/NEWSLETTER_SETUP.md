# Jacob Builds newsletter readiness — October 10, 2026

The published Jacob Builds site has no newsletter signup form or email funnel.
The NBIS Close setup below is historical, from the retired StocksWatch product.
Do not reconnect that form or reuse its consent copy for the new AI, automation
and systems content without deciding the newsletter's identity and audience.

The owner subsequently approved the personal newsletter identity Jsol’s Space.
Its public name and description were saved in the existing authenticated Buttondown
session and verified at https://buttondown.com/stockwatch. The public username
remains `stockwatch`. This newsletter covers gaming, writing, everyday life and
creative interests; it is separate from the website's consulting offer.
Sender verification, confirmation, welcome and unsubscribe behavior still need
account review and an approved consenting test recipient. No subscriber addresses,
credentials, contact imports or emails were accessed or sent.

Before adding an optional newsletter link or form:

1. Before adding a website link, confirm how Jsol’s Space relates to Jacob Builds
   and describe its personal topics accurately. No cadence has been promised.
2. Inspect sender mailbox/domain verification, confirmation settings, welcome copy
   and unsubscribe footer. DNS, credential, billing and access changes require
   separate authorization; do not create a replacement account.
3. Keep legacy NBIS subscribers' expectations intact. Do not silently repurpose
   their subscriptions for a different subject or import contacts.
4. Prefer a simple optional hosted-page link, or an accessible native HTML POST
   form using Buttondown's documented embed endpoint. State the publication/topics,
   provider and unsubscribe option beside signup; update Privacy accurately.
5. Update the current no-form policy checks deliberately if a form is approved.
   Test the POST with local interception first. A real signup/confirmation test
   needs approval for the exact recipient and action; it sends personal data/email.

Official integration reference:
https://docs.buttondown.com/building-your-subscriber-base

---

## Historical NBIS Close setup (not the current website)

# NBIS Close — Buttondown signup

The owner has selected Buttondown and reports the account/domain setup is complete.
Public newsletter: https://buttondown.com/stockwatch. Name: **NBIS Close**.
The site now includes an optional native HTML signup form on `/research-kit.html`.
No live subscription or email send was performed during implementation.

## Configuration and behavior

`scripts/lib/buttondown-config.mjs` defaults to the owner-provided public username
`stockwatch`. Both local and GitHub Actions builds use this tracked default;
no new CI variable or secret is required. `PUBLIC_BUTTONDOWN_USERNAME` can override
it at build time. An explicitly empty value disables the form. Invalid usernames
fail the build instead of targeting another domain.

The form posts `email` and `embed=1` directly to Buttondown's documented endpoint.
It navigates to Buttondown for validation, CAPTCHA, verification and success/error
handling; there is no fetch interception or invented local success state. Browser
email validation and submission work without JavaScript. The site does not retain
submitted addresses in localStorage or engagement events.

The free kit remains ungated. Consent names NBIS Close and occasional resource and
product updates. Privacy details identify Buttondown. Cadence is not promised as
an automated daily email; the daily website snapshot is a separate feature.

## Account checks before launch

Verify the actual sender mailbox in the existing Buttondown account, its confirmation
settings and unsubscribe footer. Keep the existing Cloudflare DNS setup unless
Buttondown reports a specific problem. The website integration does not verify or
change those account settings. A live end-to-end confirmation check still needs a
consenting test subscriber and explicit authorization to send the test email.

The automated browser test intercepts the POST locally; no address reaches Buttondown.
Purchases must not silently opt buyers into this newsletter. Stripe setup is documented
in [STRIPE_SETUP.md](STRIPE_SETUP.md).

Reference: [Buttondown embedded forms](https://docs.buttondown.com/building-your-subscriber-base).
