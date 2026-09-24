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
