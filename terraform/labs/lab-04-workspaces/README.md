# Lab 04 — Workspaces and environments

**Goal:** Use workspaces to manage staging vs production with one config.

**Time:** 20 min · **Difficulty:** Intermediate

## Steps

```bash
cd terraform/examples/minimal
terraform workspace list
terraform workspace new staging
terraform workspace new production
terraform workspace select staging
terraform plan
```

### Observe

- State file path changes per workspace
- Same HCL, different state namespaces

### When NOT to use workspaces alone

Workspaces share the same backend config. For production:
- Prefer **separate state buckets** or **separate directories** per environment
- Use workspaces for ephemeral dev sandboxes, not prod isolation

## Exercise

Add a `local.environment` value tied to `terraform.workspace` and pass it as a tag on resources.

## Next

[Lab 05 — Drift & import](../lab-05-drift-import/README.md)
