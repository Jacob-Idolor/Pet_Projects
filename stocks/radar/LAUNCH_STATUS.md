# October 6, 2026: published baseline and local reader polish

Jacob Builds is live at stockswatch.cc. The latest verified release is main
`204f7f175f229fa7514e907c7cd74bb4e6f31db1`, published by workflow run
[37422469267](https://github.com/Jacob-Idolor/Pet_Projects/actions/runs/37422469267).
Its live checks passed for all eight reader pages and thirteen retired assets;
all twelve production browser tests passed.

The separate local branch `codex/jacob-builds-reader-polish` starts from that
release. It aligns canonical, sitemap and internal-link URLs with Cloudflare's
extensionless 200 routes, adds official documentation links and related guides,
and supplies per-guide dates, author links and article metadata. The homepage
links to a clearly illustrative filename dry-run/failure/recovery example.
Publication dates are October 5, the owner's Pacific publication day; the first
release build at 2026-10-06T05:19:58.674Z was October 5 at 22:19 Pacific. Each
modifiedAt is October 6 for the approved release: all three articles gain author,
metadata and related-guide changes, and the automation guide gains its example.
The illustrative exercise uses neutral language and claims no personal experience.

The owner explicitly approved publishing the prepared website improvements on
October 6. This authorizes the reviewed website changes plus the necessary two-file Sharp security repair; unrelated projects and notes are excluded. The original
publication date remains October 5; update dates use the owner's Pacific calendar.
Validate the exact release commit, integrate through required checks and linear
history, then manually publish and verify the actual production revision.

Local verification: source typecheck, sixty unit tests, static build and distribution
verification/security/policy checks passed; dependency audit reported zero
vulnerabilities. All sixteen browser tests passed against both Astro preview and
the Cloudflare Pages emulator, including mobile WCAG checks, direct 200 links,
sitemap/canonical agreement and article metadata. The local release probe passed
for eight reader pages and thirteen retired assets. Desktop/mobile screenshots
were reviewed; the no-JavaScript capture observed no external requests.

This approved release is being validated for publication. Its source notes do not
claim deployment has completed; the release evidence records actual PR, commit,
workflow and live verification results. The mandatory npm audit newly reported Sharp 0.35.4 via Miniflare/Wrangler. A narrow
override pins the official patched Sharp 0.35.5 without changing Astro, Wrangler or
Miniflare versions. Security gates remain enabled. No infrastructure, services or billing
changes are part of this release.

---

# October 5, 2026: direction changed to Jacob Builds

The owner authorized retiring StocksWatch and reusing stockswatch.cc for a small
personal site about AI, automation and systems. This supersedes the research-kit
and paid-product launch plan below. The historical plan remains for reference.

Local implementation: homepage, guides library, three substantive guides,
resources, About, privacy and retirement notices. Static Astro hosting retained.
No new recurring services or costs introduced. No deploy, message, account deletion,
resource deletion, subscription cancellation or newsletter repurposing performed.

October 6 update: the owner explicitly approved the workflow transition and
publication ("Okay, do that and then publish it"). This release prepares manual-only
publishing, retires scheduled NBIS fetching, retains all validation jobs and replaces
the obsolete AdSense/NBIS homepage checklist with static-site policy checks.
The earlier automatic-review blocker is resolved by that specific authorization.
Protected-main review/merge requirements remain; publishing must follow validation.

Copy review: the About page's experience and small-business-owner statements match
the user-supplied prompt. Project-history statements are supported by repository
and chat history. The new site makes no revenue, traffic or time-saving claims.

Next: validate the isolated release, push the scoped branch, follow protected-main
review requirements and perform the authorized manual deployment. Review billing separately;
retiring site pages does not cancel Stripe, Buttondown or Cloudflare services.

---

# StocksWatch launch status — October 5, 2026

## Current local release candidate

The free kit page now includes a keyboard-accessible five-minute exercise and
worked answer, and the downloadable kit includes the same offline practice.
The product preview contrasts blank and completed evidence records. The homepage
separates snapshot retrieval time from the latest daily price date and explains
missing values. These changes are local, not deployed; public paid-product
metadata remains edition 1.0.0 and checkout remains closed.

Site validation: 46 unit tests, 25 browser tests, typecheck, offline build,
release verification and distribution security checks passed. Browser coverage
includes mobile accessibility and the exercise without JavaScript. An offline
build does not establish current production data freshness.

Next actions:
1. Publish this release when deployment is explicitly requested, then verify
   the production revision, exercise, downloads and data timestamps.
2. Collect feedback from the owner's existing post; use the October 16 review
   in DEMAND_VALIDATION.md. No new analytics or paid acquisition is needed.
3. Before opening sales, verify an independent private product backup, a working
   support inbox, purchase/refund terms and reliable fulfillment/recovery.

The infrastructure-first lists later in this file are historical and paused.

## Current priority: validate demand before further spending

This priority supersedes the infrastructure-first next actions recorded below.
Use [DEMAND_VALIDATION.md](DEMAND_VALIDATION.md) for the sharing draft, manual tracker
and two-week review. Owner reports posting on October 2; review on October 16.
Post URL and feedback are pending. No outreach has been sent by the assistant.
Pause implementation of the delivery queue, database, email sender and recovery.
Preserve the existing work. Keep website checkout closed; existing Stripe payment
links have not been deactivated. Do not promote them while fulfillment is incomplete.

- Incremental spending budget: $0 for this validation phase. No new subscriptions,
  paid upgrades, advertising or infrastructure. This does not mean existing bills are zero.
- Keep the current site, free research kit and existing newsletter integration.
- Proposed experiment: two weeks after the owner begins sharing the free kit with
  relevant readers. No outreach or newsletter sends are authorized by this document.
- Track manually: relevant people reached, confirmed signups, substantive feedback,
  and explicit interest in the ten-template pack at $19. Do not add analytics services.
- Working decision rule: seek five substantive reader responses and at least three
  explicit expressions of interest at $19 before revisiting paid fulfillment. These
  are small experiment thresholds, not proof of sales or profitability.
- If interest is weak, revise the offer or pause the paid product. If reach is too low,
  record the result as inconclusive rather than treating silence as rejection.

Draft feedback prompt (not sent):
“Which part of researching NBIS takes you the most time? Here's our free research
kit: https://stockswatch.cc/research-kit.html. Would ten editable research templates
at $19 solve a specific problem for you? What would need to be included?”

Cost review still outstanding: identify the services behind September's $21.65 AWS
bill after account sign-in; check actual Cloudflare, Buttondown and domain charges.
No service cancellation or resource deletion has been performed.

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

No paid plan, email send or database creation was performed on October 2. The subsequent dependency fix was deployed, as recorded below.

## October 2: deployment dependency fix verified

Published commit ac74f75 updating only package.json/package-lock.json to Wrangler
4.146.0 (Miniflare's undici is now 7.29.1). npm audit reports zero vulnerabilities.
GitHub run 37067252629 passed every step, including strict NBIS refresh, Cloudflare
Pages deployment, and deployed revision/freshness verification.
Local unit tests (46), typecheck, offline build and release/security scans passed.
All 24 Playwright cases reported passing; its local preview teardown hung and was
interrupted afterward. The delivery queue/email work remains uncommitted and undeployed.
