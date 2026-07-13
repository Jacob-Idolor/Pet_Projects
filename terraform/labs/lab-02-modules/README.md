# Lab 02 — Modules and composition

**Goal:** Use a reusable networking module from a root configuration.

**Time:** 25 min · **Difficulty:** Intermediate

## Steps

```bash
cd terraform/examples/modules/networking
terraform init
terraform validate
terraform plan
```

### Study the module

1. Open `modules/vpc/main.tf` — note `variable` and `output` blocks
2. Open root `main.tf` — see `module "vpc" { ... }`
3. Trace how `module.vpc.vpc_id` flows to outputs

### Experiment

Change `cidr_block` in `terraform.tfvars` and re-plan. Observe how only affected resources change.

### Module best practices checklist

- [ ] Inputs documented in `variables.tf` with `description`
- [ ] Outputs expose only what callers need
- [ ] No hardcoded environment names inside the module
- [ ] Version pin if sourced from registry/git

## Next

[Lab 03 — Remote state](../lab-03-remote-state/README.md)
