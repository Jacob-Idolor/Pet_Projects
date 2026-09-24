# Research Workflow Pack — release and sales setup

## Current state

Version 1.0.0 has ten original Markdown documents in local, Git-ignored storage:
`.private-products/research-workflow-pack/1.0.0/`. The page `/workflow-pack.html`
offers a free sample and explains a proposed USD 19 one-time price. Checkout is not
connected and sales are not open. No actual purchase, email delivery or refund
flow has been tested.

The pack is a preparation-stage experiment. Reader demand is not yet validated;
finishing a local draft does not justify a launch, second product or subscription.

## Package and verify locally

```text
npm run product:test
npm run product:pack
```

The packaging script uses the Python standard library and the explicit file list
in `src/data/workflow-pack.json`. It normalizes line endings, creates stable ZIP
metadata, includes file checksums and atomically replaces the release archive only
after all listed files are read. Unlisted files are excluded.

Output: `.private-products/releases/stockswatch-research-workflow-pack-1.0.0.zip`.
This command does not upload or publish anything and is not part of the website
build. A fresh clone deliberately lacks the private source files; ordinary builds
and packaging unit tests do not need them.

## Keep the complete product out of public distribution

- `.private-products/` is ignored by Git and outside Astro's `public/` tree.
- The public sample is intentionally authored separately in `public/downloads/`.
- The ordinary static build needs only public metadata, the preview page and sample.
- Release verification rejects product archives, private product paths and full-pack
  filenames under `dist/`, except the intentionally public sample.
- Back up `.private-products/` to owner-controlled private storage before moving or
  cleaning this checkout. Git does not back it up. Do not commit the complete pack
  to a public repository as a way to preserve it.
- Ignoring files and checking a release are safeguards, not copy protection. Buyers
  will receive downloadable files and can copy them.

## Public product specification

- Product: Research Workflow Pack, version 1.0.0.
- Proposed price: USD 19 once; unvalidated, not an active checkout price.
- Format: ten editable Markdown files in a ZIP, plus integrity manifest.
- Includes: brief, evidence register, assumptions, quarterly review, revisions,
  optional AI verification, fictional example, operating routine and file help.
- Excludes: current market data, stock picks, spreadsheet models, automatic research,
  subscription, custom advice and lifetime updates.
- Full example: original fictional company and exhibits, clearly labeled in the file.
- Sample: one record template and a small fictional example, available without email.

## Checkout readiness

Use one selected hosted checkout and its digital-file delivery. Do not place the ZIP
at a permanent public URL and rely on an obscured link for access control.

Before enabling purchases, complete:

1. Owner confirms seller identity, support mailbox, price/currency and purchase terms.
2. Review the product, sample, use terms and final refund/support policy together.
3. Upload the verified versioned ZIP to the selected provider's protected delivery.
4. Confirm tax, supported countries and fees using that provider's current official
   documentation; this repository does not assume a provider or handle taxes.
5. Use test/sandbox mode where available to verify payment, receipt, correct file,
   failed/cancelled payment, duplicate events if any, and refund handling.
6. Keep optional marketing consent separate from transaction delivery.
7. Add the real checkout destination and accurate product metadata only when ready.
8. Make the sales state public only after a working purchase-to-download check and
   explicit authorization to publish/deploy.

Do not add fake checkout links, invented customer reviews, scarcity or sales counts.
No business accounts, billing, DNS, subscriber lists or delivery automations were
created by preparing this pack.

Newsletter copy and flow are in [NEWSLETTER_SETUP.md](NEWSLETTER_SETUP.md).
