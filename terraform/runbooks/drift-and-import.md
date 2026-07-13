# Drift and import runbook

## Detect drift

```bash
terraform plan -detailed-exitcode
# Exit 0 = no changes, 2 = changes pending
```

## Decide: adopt or revert

| Situation | Action |
|-----------|--------|
| Console change was mistake | `terraform apply` to revert |
| Console change is desired | Update HCL, then apply |
| Resource exists, not in state | `terraform import` |

## Import procedure

```bash
# 1. Write resource block in HCL (minimal required args)
# 2. Import
terraform import aws_s3_bucket.site my-bucket-name

# 3. Plan until no unexpected destroys
terraform plan
```

## Prevent drift

- IAM deny policies for console edits on managed resources
- Regular scheduled `terraform plan` in CI (drift detection only)
- Tag resources with `managed-by=terraform`
