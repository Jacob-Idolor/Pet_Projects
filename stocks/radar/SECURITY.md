# Security — Stocks Radar

Audit posture for this **static** S3 + CloudFront site (no app servers, no user auth).

## Verdict

**Safe to go live for a friend-scale public watchlist** after applying the IAM policy in this repo and completing [GO_LIVE.md](GO_LIVE.md). Residual risks are mostly operational (long-lived CI keys, no WAF) — acceptable at low traffic; tighten before serious AdSense/abuse exposure.

## Already strong

| Control | Notes |
|---------|--------|
| Private S3 + CloudFront OAC | Bucket not public; only CF can read |
| HTTPS redirect + managed security headers | Default on |
| `_private/*` denied to CloudFront | Alert cooldown state not world-readable |
| S3 `aws:SecureTransport` deny | No plaintext HTTP to bucket |
| Deploy gate | `STOCKS_RADAR_DEPLOY_ENABLED` — no PR → prod |
| GITHUB_TOKEN | `contents: read` on deploy/quotes/digest/alerts |
| Emails out of git | `terraform.tfvars` gitignored; `alert_subscribers` sensitive |
| Personal alerts fail-closed | Missing topic map → skip (no broadcast leak) |
| XSS hardening | Symbol/id/priority sanitized; text fields HTML-escaped |
| Scripts | `execFileSync` argv arrays (no shell injection); Yahoo host fixed |

## Fixes applied in this audit

1. Removed committed `tfplan` (contained email + account ID) and gitignored `*.tfplan`
2. Scrubbed real email from `FRIENDS_FEEDBACK.md`
3. Alert state → `s3://…/_private/alert-state.json` + CF deny on `_private/*`
4. IAM: dropped `s3:*` / `sns:*` on `*`; SNS limited to `stocks-radar-*`; Deny IAM privilege-escalation actions
5. Personal alert publish no longer falls back to shared SNS by default
6. Workflows: `permissions: contents: read` + `environment: stockwatch` on quotes/digest/alerts
7. Public alert panel no longer renders personal `note` text

## Residual risks (accepted or next)

| Risk | Severity | Mitigation |
|------|----------|------------|
| Long-lived AWS access keys in GitHub | Medium | Prefer **OIDC → IAM role** (recommended before high traffic) |
| CloudFront / ACM / Route53 still `Resource: *` | Medium | Separate AWS account or permission boundary for prod |
| No WAF / access logs | Low–Med | Cost choice; enable if scraped or AdSense fraud appears |
| Public `subscriberId` on alert rules panel | Low | Intentional for friends; omit panel via feature flag if needed |
| Poisoned `quotes.json` / malicious watchlist PR | Low | Review PRs; sanitizers reduce XSS impact |

## Operator checklist

```bash
# After terraform apply — confirm private path is blocked:
curl -sS -o /dev/null -w "%{http_code}\n" "$SITE/_private/alert-state.json"
# expect 403 or 404 (not 200 with JSON)

# Re-attach narrowed IAM from:
#   stocks/radar/infra/iam/deploy-policy.json
```

If an old `alert-state.json` exists at the **bucket root**, delete or move it:

```bash
aws s3 mv "s3://$BUCKET/alert-state.json" "s3://$BUCKET/_private/alert-state.json"
```

## Reporting

This is a personal pet project. Treat unexpected public exposure of `_private/` or SNS spam as a credential leak: rotate GitHub AWS secrets and review SNS topics.
