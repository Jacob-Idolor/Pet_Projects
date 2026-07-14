# Terraform Learning Lab

A **practice-first** path for learning Terraform — infrastructure as code with real workflows, production patterns, and an interactive browser simulator.

| Path | What | When |
|------|------|------|
| **Read** | Curriculum + learning path | Understand concepts before touching code |
| **Site** | Browser simulator + lessons | Safe reps with `terraform plan` / `apply` |
| **Labs** | 7 guided exercises | Local Terraform on your machine |
| **Drills** | Command sheets + troubleshooting | Build muscle memory |

Start here: `make site-dev` → http://localhost:4321 — or `make lab-00` for hands-on CLI.

Full learning guide: **[LEARNING-PATH.md](LEARNING-PATH.md)**

---

## Why Terraform?

Terraform is the **de facto standard** for declarative infrastructure:

- **Multi-cloud** — AWS, Azure, GCP, Kubernetes, and hundreds of providers
- **Plan before apply** — review every change before it hits production
- **State management** — track what exists, detect drift, collaborate with remote backends
- **Modules** — reusable, versioned building blocks for teams

If you already use the [Kubernetes lab](../kubernetes/) or [OpenTelemetry lab](../opentelemetry/), Terraform is how you provision the underlying cloud resources those stacks run on.

---

## Fast commands

```bash
cd terraform

make help           # all targets
make site-dev       # interactive learning site
make lab-00         # first init + validate lab
make check-tools    # verify terraform, aws cli, etc.
make validate-all   # fmt + validate every example
```

---

## Repository layout

```
terraform/
├── CORE-CONCEPTS.md     # Master concept map — start here for full understanding
├── curriculum/          # Concept deep-dives (reading)
├── labs/                # 7 guided hands-on labs
├── drills/              # CLI commands, checklists, troubleshooting
├── examples/            # Runnable Terraform stacks
│   ├── minimal/         # Local-only (no cloud account)
│   ├── aws-static-site/ # Production S3 + CloudFront pattern
│   └── modules/         # Reusable VPC-style module
├── runbooks/            # Production troubleshooting guides
├── scripts/             # Lab bootstrap helpers
├── site/                # Interactive Astro learning site
├── Makefile             # One entry point
├── SETUP.md             # Tool installation
├── LEARNING-PATH.md     # Recommended order + learning loop
└── PROGRESS.md          # Your checklist
```

---

## Learning loop

1. **Read** — Skim the curriculum module for the topic (15 min)
2. **Simulate** — Practice commands in the browser terminal
3. **Lab** — Run the matching local lab with real Terraform
4. **Drill** — Repeat commands from `drills/` without notes
5. **Reflect** — Log one takeaway in [PROGRESS.md](PROGRESS.md)

---

## Production best practices covered

- Remote state with S3 + DynamoDB locking
- Workspace / environment separation
- Module versioning and composition
- `terraform plan` in CI before apply
- Safeguards: `prevent_destroy`, budget alerts, least-privilege IAM
- Drift detection and `terraform import`
- Secrets via environment variables — never in `.tf` files

---

## Related tracks

| Track | Link |
|-------|------|
| Kubernetes lab | [kubernetes/](../kubernetes/) |
| OpenTelemetry lab | [opentelemetry/](../opentelemetry/) |
| Stocks Radar (Terraform deploy) | [stocks/radar/infra/](../stocks/radar/infra/) |
