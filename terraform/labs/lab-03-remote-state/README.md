# Lab 03 — Remote state backend

**Goal:** Understand S3 + DynamoDB remote state for team collaboration.

**Time:** 30 min · **Difficulty:** Intermediate

## Concept

Local `terraform.tfstate` breaks down when:
- Multiple people run Terraform
- CI needs to plan/apply
- You need state locking

## Steps

### 1. Read the backend example

```bash
cat terraform/examples/aws-static-site/backend.tf.example
```

### 2. Bootstrap state infrastructure (one-time)

In a real project, create these **before** enabling the backend:

- S3 bucket (versioning + encryption)
- DynamoDB table (`LockID` string hash key)

See HashiCorp docs: [S3 backend](https://developer.hashicorp.com/terraform/language/settings/backends/s3)

### 3. Migrate state

```bash
# After copying backend.tf.example → backend.tf and editing names:
terraform init -migrate-state
```

### 4. Verify locking

Run `terraform plan` in two terminals simultaneously. The second should wait or fail with a lock error.

## Production checklist

- [ ] State bucket versioning enabled
- [ ] SSE encryption on state bucket
- [ ] DynamoDB table for locks
- [ ] IAM policy: least privilege for CI role
- [ ] Separate state per environment

## Next

[Lab 04 — Workspaces](../lab-04-workspaces/README.md)
