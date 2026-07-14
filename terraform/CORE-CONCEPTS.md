# Core Terraform concepts

A single map of everything you need to understand Terraform at a production-ready level.

## The mental model

```
┌─────────────┐     terraform plan      ┌──────────────┐
│  HCL config │ ──────────────────────► │  Plan file   │
│  (.tf files)│                         │  (preview)   │
└─────────────┘                         └──────┬───────┘
       ▲                                         │
       │                                         │ terraform apply
       │                                         ▼
┌─────────────┐     read/write           ┌──────────────┐
│    State    │ ◄──────────────────────► │   Provider   │
│ (terraform  │                          │  (AWS, etc.) │
│  .tfstate)  │                          └──────┬───────┘
└─────────────┘                                 │
                                                ▼
                                         Real infrastructure
```

## 1. Infrastructure as Code (IaC)

| Concept | Meaning |
|---------|---------|
| **Declarative** | You describe *desired* state, not step-by-step commands |
| **Immutable mindset** | Change config → plan → apply; don't hand-edit cloud consoles |
| **Version controlled** | `.tf` files live in git; every change is reviewable |
| **Reproducible** | Same config + variables = same infrastructure |

## 2. HCL (HashiCorp Configuration Language)

- **Resources** — things Terraform manages (`aws_s3_bucket`, `azurerm_resource_group`)
- **Data sources** — read-only lookups (`data.aws_caller_identity`)
- **Variables** — inputs (`var.environment`)
- **Outputs** — values exported after apply (`output.bucket_arn`)
- **Locals** — computed values used within a module
- **Providers** — plugins that talk to APIs (AWS, Azure, Kubernetes)

## 3. The workflow

| Command | Purpose |
|---------|---------|
| `terraform init` | Download providers, configure backend |
| `terraform fmt` | Format `.tf` files to canonical style |
| `terraform validate` | Check syntax and internal consistency |
| `terraform plan` | Preview changes (add/change/destroy) |
| `terraform apply` | Execute the plan |
| `terraform destroy` | Tear down all managed resources |

**Golden rule:** Always `plan` before `apply` in production. Never `-auto-approve` without review.

## 4. State

Terraform state (`terraform.tfstate`) records:

- Which real-world resources map to which config addresses
- Resource attributes Terraform needs for updates
- Metadata for dependencies between resources

| State type | When to use |
|------------|-------------|
| **Local** | Solo learning, never for teams |
| **Remote (S3 + DynamoDB)** | Production — locking, sharing, encryption |
| **Terraform Cloud** | Managed remote state + runs |

**Never commit state to git** unless using a remote backend and the local file is just a cache.

## 5. Modules

Modules are reusable packages of Terraform configuration.

```
root/
├── main.tf          # calls modules
├── variables.tf
└── modules/
    └── networking/
        ├── main.tf
        ├── variables.tf
        └── outputs.tf
```

Best practices:
- One concern per module (networking, compute, database)
- Pin module versions (`source = "...?ref=v1.2.0"`)
- Document required variables and outputs

## 6. Environments

| Approach | Pros | Cons |
|----------|------|------|
| **Workspaces** | Single config, quick switching | Easy to apply to wrong workspace |
| **Directory per env** | Clear separation (`envs/staging/`, `envs/prod/`) | More duplication |
| **Separate state per env** | Safest for production | Requires discipline |

Production recommendation: **separate state backends per environment**, not just workspaces.

## 7. Plan output symbols

| Symbol | Meaning |
|--------|---------|
| `+` | Create |
| `~` | Update in-place |
| `-/+` | Destroy and recreate |
| `-` | Destroy |

## 8. Production safeguards

- **Remote state** with locking (DynamoDB)
- **CI plan-only** on pull requests
- **Manual apply** from protected branches only
- **`prevent_destroy`** on critical resources
- **Least-privilege IAM** for Terraform runners
- **Budget alerts** on cost-sensitive stacks
- **`.tfvars` in `.gitignore`** — use `terraform.tfvars.example`
- **Secrets via env vars** — `TF_VAR_db_password`, never in HCL

## 9. Drift

**Drift** = real infrastructure differs from state/config.

Causes: manual console changes, autoscaling, external automation.

Fix path:
1. `terraform plan` — see what drifted
2. Update HCL to match intent, or `terraform import` to adopt existing resources
3. `terraform apply` to reconcile

## 10. Relationship to other tools

| Tool | Role |
|------|------|
| **Terraform** | Provision infrastructure |
| **Kubernetes** | Orchestrate containers on that infrastructure |
| **Helm** | Package K8s apps (not infra provisioning) |
| **Ansible** | Configuration management (complements Terraform) |
| **Pulumi** | IaC with general-purpose languages |

---

Next: [LEARNING-PATH.md](LEARNING-PATH.md) for the recommended study order.
