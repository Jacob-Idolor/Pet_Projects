# Testing & regression checks

Run these before deploying publicly or opening a PR.

## Quick commands

```bash
cd kubernetes

# Full local CI (matches GitHub Actions)
make ci

# Faster subset after you already built once
make test          # build + unit + links + security scan
make test-unit     # simulators + curriculum data only
make test-e2e      # Playwright browser smoke tests
```

From `kubernetes/site/` directly:

```bash
npm run test:ci    # build + unit + links + dist security + npm audit
npm run test:all   # test:ci + Playwright e2e
```

## What gets tested

| Layer | Tool | Catches |
|-------|------|---------|
| **Build** | `astro build` | Broken pages, import errors |
| **Unit** | Vitest | Docker/kubectl simulator bugs, bad quiz data, missing lesson metadata, certificate logic |
| **Links** | `scripts/check-links.mjs` | Broken internal links in static HTML |
| **Dist security** | `scripts/check-dist-security.mjs` | Accidental secrets in built output |
| **Dependencies** | `npm audit --audit-level=critical` | Known critical npm vulnerabilities (high dev-only advisories logged) |
| **E2E smoke** | Playwright | Key routes load, lesson UI, quiz, terminal responds |
| **Terraform** | `terraform validate` + `fmt -check` | Invalid infra config |

## CI (GitHub Actions)

**`.github/workflows/site-validate.yml`** runs on every PR/push touching `kubernetes/site` or `kubernetes/infra`:

1. `npm run test:ci`
2. Playwright smoke tests
3. Terraform validate

**Deploy workflows run tests first** — nothing goes live without passing the suite.

## Skipping tests (emergency only)

```bash
SKIP_TESTS=1 make aws-deploy
```

Not recommended for production deploys.

## Adding tests

- **Simulator behavior** → `kubernetes/site/tests/unit/`
- **New lesson routes** → add to `tests/e2e/smoke.spec.ts`
- **Data invariants** → extend `tests/unit/curriculum.test.ts`
