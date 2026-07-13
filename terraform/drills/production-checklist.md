# Production checklist

Before every `terraform apply` in production:

## Pre-apply

- [ ] `terraform plan` reviewed by second person (or PR)
- [ ] Correct workspace / environment confirmed
- [ ] No secrets in `.tf` or `.tfvars` in git
- [ ] `terraform fmt -check` passes in CI
- [ ] `terraform validate` passes
- [ ] Security scan (tfsec/checkov) reviewed

## State & backend

- [ ] Remote state with encryption
- [ ] State locking enabled
- [ ] Separate state per environment
- [ ] State bucket versioning on

## Safeguards

- [ ] `prevent_destroy` on databases, state buckets
- [ ] `lifecycle { ignore_changes }` only where justified
- [ ] Budget alerts configured
- [ ] Least-privilege IAM for runner

## Post-apply

- [ ] `terraform output` captured in run log
- [ ] Smoke test critical endpoints
- [ ] Plan again — should show "No changes"
