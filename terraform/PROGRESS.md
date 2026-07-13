# Your progress checklist

Copy this into your notes or mark items in the [browser Tracker](http://localhost:4321/progress.html) when running locally.

## Part 1 — Fundamentals

- [ ] Lesson 1: What is IaC?
- [ ] Lesson 2: HCL basics
- [ ] Lesson 3: Init, plan, apply workflow
- [ ] Lesson 4: Variables & outputs
- [ ] Lesson 5: State fundamentals
- [ ] Lesson 6: Modules introduction
- [ ] Lab 00: First init & validate
- [ ] All 6 simulator missions (fundamentals page)

## Part 2 — Production

- [ ] Lesson 7: Providers & data sources
- [ ] Lesson 8: Remote state & locking
- [ ] Lesson 9: Workspaces & environments
- [ ] Lesson 10: CI/CD integration
- [ ] Lesson 11: Drift & import
- [ ] Lesson 12: Production patterns
- [ ] Lab 01: S3 bucket stack
- [ ] Lab 02: Modules
- [ ] Lab 03: Remote state
- [ ] Lab 04: Workspaces
- [ ] Lab 05: Drift & import
- [ ] Lab 06: CI pipeline
- [ ] Lab 07: Production deploy

## Troubleshooting scenarios

- [ ] Validation error scenario
- [ ] Drift detection scenario
- [ ] State lock scenario
- [ ] Failed apply scenario

## Drills (repeat until automatic)

- [ ] `drills/terraform-commands.md` × 3 clean runs
- [ ] `drills/troubleshooting-scenarios.md` — all 5 scenarios

## Portfolio milestone

When you can do all of the below without notes:

1. Write a module with inputs/outputs
2. Configure S3 remote state with DynamoDB lock
3. Run `terraform plan` in CI on every PR
4. Explain drift and fix it with import or config update
5. Deploy a static site with safeguards (encryption, OAC, budget)

Log completion date: _______________

## Reflection prompts

- What is the difference between `terraform plan` and `terraform apply`?
- Why should state never be committed to git in production?
- When would you use `terraform import` vs editing HCL?
- What does `prevent_destroy` protect against?
