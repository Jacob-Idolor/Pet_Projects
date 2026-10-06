# Publish Jacob Builds

The existing production host is Cloudflare Pages project `stockswatch-nbis`, with
the custom domain `https://stockswatch.cc`. Content updates require no Terraform
apply or new resources. The previous AWS site is retired.

## Publishing route

1. Prepare a scoped release branch and draft PR. Keep unrelated local work out of it.
2. Require the validation workflow to pass: npm audit, Node/Python tests, legacy
   configuration/schema checks, typecheck, static build, release/security/policy
   scans, Playwright and the existing Cloudflare Terraform validation job.
3. Follow protected-main review and obtain confirmation for the specific PR merge
   when needed. Merging this revision runs validation but does not publish.
4. In GitHub Actions, open **Jacob Builds - publish manually**, select **Run
   workflow**, and choose the approved ref. The workflow file retains its existing
   name `stocks-radar-nbis-daily.yml` for continuity; it has no schedule or push trigger.
5. The manual workflow repeats npm audit, source checks, build, release/security/
   policy scans and browser tests before Wrangler uploads to the existing project.
6. Its post-deploy check requires all eight reader-facing pages, valid metadata
   and the workflow commit SHA. Verify the production URL and exact revision.

Existing GitHub Cloudflare credentials remain in the secret store; no credential
or account changes are required by this release. Do not print or commit them.

The site build performs no Yahoo Finance or SEC requests. Historical fetchers and
their tests remain in the repository; their preservation does not re-enable refresh.
Retiring website features does not cancel Stripe, Buttondown, Worker/R2 or billing.
