# Lab 06 — CI plan-only pipeline

**Goal:** Run `terraform plan` on every pull request without applying.

**Time:** 25 min · **Difficulty:** Intermediate

## Steps

### 1. Review the workflow

```bash
cat .github/workflows/terraform-validate.yml
```

Note:
- `terraform init -backend=false` for validation (no state needed)
- `terraform fmt -check`
- `terraform validate`

### 2. Local simulation

```bash
cd terraform/examples/aws-static-site
terraform init -backend=false
terraform validate
terraform fmt -check -recursive
```

### 3. Production CI pattern

For real plan in CI you need:
- Remote state read access
- `TF_VAR_*` or workspace-specific vars
- Plan posted as PR comment (Terraform Cloud, Atlantis, or custom action)

**Never** store long-lived AWS keys in GitHub secrets without rotation policy.

## Checklist

- [ ] fmt check fails CI on unformatted code
- [ ] validate runs on every PR touching `.tf` files
- [ ] apply only from protected branch with manual approval

## Next

[Lab 07 — Production deploy](../lab-07-production/README.md)
