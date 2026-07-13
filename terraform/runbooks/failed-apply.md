# Failed apply runbook

## During apply failure

1. **Do not panic-delete state**
2. Read the error — IAM, quota, dependency, timeout
3. `terraform show` — what was created?
4. `terraform plan` — what remains?

## Common errors

| Error | Fix |
|-------|-----|
| `AccessDenied` | Fix IAM policy on runner role |
| `LimitExceeded` | Request quota increase or reduce resources |
| `dependency violation` | Destroy order — remove `depends_on` issues |
| `timeout` | Retry apply; increase timeout in provider |

## Partial state

Terraform records successful resources in state even if apply fails mid-way.

Next apply will continue — **idempotent** by design.

## Rollback

- **Config rollback:** `git revert` + `terraform apply`
- **State rollback:** S3 versioning restore (remote state) — last resort
- **Never** edit state JSON by hand unless expert
