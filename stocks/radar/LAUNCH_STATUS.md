# StocksWatch launch status — September 24, 2026

The business is in pre-launch development. No revenue or demand has been validated.
Local implementation is not proof of production deployment or working delivery.

| Workstream | Completed | Outstanding |
| --- | --- | --- |
| Product | Free kit, sample, preview, ten-file private pack and ZIP packaging | Owner review, private backup, final purchase/support/refund terms |
| Newsletter | NBIS Close / stockwatch native Buttondown form and privacy copy | Verify sender, confirmation and unsubscribe in the actual account with a consenting test subscriber |
| Payments | Live and sandbox $19 links inspected; sandbox Payment Link, Price and Product IDs saved | API verification, payment settings and complete sandbox purchase test |
| Download | Disabled Worker checks Stripe and streams private ZIP; verified completion page | Private sandbox bucket and ZIP uploaded; local binding configured. Sandbox Worker deployed with R2 binding and workers.dev endpoint; disabled response verified. Remaining: Stripe secret, verification, rate limits and platform logging review |
| Reliable delivery | Access expiry and refund/dispute denial tested locally | Webhook or equivalent reliable fulfillment, transactional email, duplicate-event handling, lost-link recovery |
| Release | Local tests and bundle checks | Resolve current daily-workflow status, verify fresh data, authorize and deploy, production smoke check |
| Growth | Research guides and product strategy exist | Validate demand with readers, publish useful content, measure confirmed signups and sales, improve from results |

## Next actions in order

1. All three sandbox IDs received; verify their relationship against the Stripe API. Store secrets directly in the deployment secret store.
2. Implement reliable delivery and recovery. Choose the transactional sender and
   verify its domain; Buttondown marketing signup remains separate.
3. Configure private Cloudflare storage and a sandbox delivery route with explicit
   authorization for account/infrastructure changes. Keep production sales disabled.
4. Test a full sandbox purchase, download, delayed/failed payment, retries, refund,
   expired link and recovery. Review currency/discount settings against validation.
5. Finalize customer terms and support details. Verify newsletter signup separately.
6. Review the release diff, confirm daily refresh is healthy, then deploy when requested.
7. Start with a small launch and measure demand. This product can reduce ongoing work;
   it does not guarantee passive income and still needs support and maintenance.

See [STRIPE_SETUP.md](STRIPE_SETUP.md), [NEWSLETTER_SETUP.md](NEWSLETTER_SETUP.md)
and [WORKFLOW_PACK.md](WORKFLOW_PACK.md) for implementation and setup details.
