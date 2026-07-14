# Setup

Install tools once, then reuse across all labs.

## Required

| Tool | Version | Install |
|------|---------|---------|
| **Terraform** | ≥ 1.5 | [Install guide](https://developer.hashicorp.com/terraform/install) |
| **Git** | any recent | https://git-scm.com/ |

Verify:

```bash
terraform version
# Terraform v1.9.x or newer recommended
```

## Recommended

| Tool | Why |
|------|-----|
| **AWS CLI v2** | Labs 01+ use AWS provider (optional for minimal lab) |
| **tfsec** or **checkov** | Static security scanning |
| **direnv** | Auto-load `TF_VAR_*` from `.envrc` |
| **VS Code + HashiCorp Terraform extension** | Syntax, fmt, docs on hover |

### AWS CLI (for cloud labs)

```bash
aws --version
aws configure   # or use AWS_PROFILE / SSO
```

Use a **dedicated IAM user or role** for learning — not your root account.

## Editor setup

### VS Code

1. Install **HashiCorp Terraform** extension
2. Enable format on save: `"[terraform]": { "editor.formatOnSave": true }`
3. Optional: **tfsec** extension for inline security hints

### Shell aliases (optional)

```bash
alias tf='terraform'
alias tfp='terraform plan'
alias tfa='terraform apply'
```

## Project conventions

- `terraform.tfvars` — **gitignored**, copy from `terraform.tfvars.example`
- State files — **never commit** (use remote backend in production)
- Run `terraform fmt -recursive` before every commit
- Run `make validate-all` from repo root to check all examples

## Troubleshooting install

| Issue | Fix |
|-------|-----|
| `terraform: command not found` | Add install dir to PATH |
| Provider download fails | Check network; try `terraform init -upgrade` |
| AWS credentials error | `aws sts get-caller-identity` to verify |
