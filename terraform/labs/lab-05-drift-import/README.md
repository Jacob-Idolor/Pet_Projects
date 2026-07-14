# Lab 05 — Drift detection and import

**Goal:** Detect infrastructure changed outside Terraform and adopt it into state.

**Time:** 30 min · **Difficulty:** Advanced

## Scenario A — Drift

1. Apply the minimal example
2. Manually edit `hello.txt` outside Terraform
3. Run `terraform plan` — see drift (`~` update)
4. Decide: update HCL to match, or `terraform apply` to revert file

## Scenario B — Import

Resource exists in AWS but not in state:

```bash
terraform import aws_s3_bucket.site your-bucket-name
```

Then run `terraform plan` to align config with imported attributes.

## Browser practice

Try the **drift scenario** at `/practice-drift.html` in the learning site.

## Runbook

See [runbooks/drift-and-import.md](../runbooks/drift-and-import.md)

## Next

[Lab 06 — CI pipeline](../lab-06-ci-pipeline/README.md)
