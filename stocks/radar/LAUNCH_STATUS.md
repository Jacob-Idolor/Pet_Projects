# StocksWatch launch status — September 25, 2026

The business is in pre-launch development. No revenue or demand has been validated.
Local implementation is not proof of production deployment or working delivery.

| Workstream | Completed | Outstanding |
| --- | --- | --- |
| Product | Free kit, sample, preview, ten-file private pack and ZIP packaging | Owner review, private backup, final purchase/support/refund terms |
| Newsletter | NBIS Close / stockwatch native Buttondown form and privacy copy | Verify sender, confirmation and unsubscribe in the actual account with a consenting test subscriber |
| Payments | Live and sandbox $19 links inspected; sandbox Payment Link, Price and Product IDs saved | Owner reports successful sandbox purchase, redirect and ZIP download; refund/delayed-payment and recovery tests remain |
| Download | Disabled Worker checks Stripe and streams private ZIP; verified completion page | Private sandbox bucket and ZIP uploaded; local binding configured. Sandbox Worker deployed with R2 binding and workers.dev endpoint; test secret present; sandbox enabled and invalid-session checks passed. Owner reports successful checkout redirect and ZIP download. Remaining: rate limits and platform logging review |
| Reliable delivery | Access expiry and refund/dispute denial tested locally | Signed webhook and duplicate-session outbox implemented locally; not deployed. Remaining: D1 binding, Stripe endpoint secret, email sender/consumer and lost-link recovery |
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

Cost constraint: keep recurring costs extremely low; no paid email plan or upgrade authorized.

## October 2: resume the low-cost launch

AWS billing investigation and teardown are on hold at the owner's request; no resources were deleted.

The next launch milestone is reliable purchase delivery. `email.mjs` now provides a
locally tested Resend transport, disabled unless explicitly configured. It restricts
sandbox recipients, produces private expiring links, and distinguishes provider
acceptance from failures. It is not connected to the webhook or a scheduled consumer.

Remaining, in order:
1. Build the durable queue consumer with shared Stripe revalidation, bounded retries,
   concurrency control, and persistent sent state. Resend idempotency lasts only 24 hours;
   ambiguous sends beyond that window need reconciliation rather than blind retries.
2. Set up Resend Free and verify a sending domain and monitored reply address.
   Keep open/link tracking off for credential-bearing download links. Store the API key
   only in Worker secrets. Current Free allowance: 3,000 emails/month, 100/day.
3. Bind D1, configure Stripe webhook secrets, and enable sandbox delivery only after
   the consumer is ready. Test failed/delayed payments, refunds, expiry and recovery.
4. Verify Buttondown signup, support/refund terms and daily data refresh health.
5. Review and deploy production, then measure confirmed signups and sales.

No paid plan, email send, database creation or deployment was performed on October 2.
