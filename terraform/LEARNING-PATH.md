# How to learn with this lab

This repo is designed for **concept → simulate → practice → reflect**. Follow this order for each topic.

## The learning loop

```
1. Read lesson (browser)     → interactive steps + quick quiz
2. Simulator practice        → safe terraform plan/apply reps
3. Local lab                 → real Terraform on your machine
4. Troubleshoot scenario     → drift, validation errors, state lock
5. Mark complete + notes     → Tracker (/progress.html)
```

## Recommended path

Start with **[Learn](/learn.html)** — 12 bite-sized lessons split into Part 1 (fundamentals) and Part 2 (production).

| Step | Browser | Local lab |
|------|---------|-----------|
| 1 | [Part 1 — Lessons 1–4](/learn.html#fundamentals) | `make lab-00` → [Lab 00](labs/lab-00-init/) |
| 2 | [Terraform simulator](/terraform.html) | Lab 00 |
| 3 | [Lessons 5–6 — State & modules](/learn.html#fundamentals) | [Lab 01](labs/lab-01-s3-bucket/) |
| 4 | [Part 2 — Lessons 7–9](/learn.html#production) | [Lab 02](labs/lab-02-modules/) |
| 5 | [Lesson 10 — Remote state](/modules/t7-remote-state.html) | [Lab 03](labs/lab-03-remote-state/) |
| 6 | [Lesson 11 — Workspaces](/modules/t8-workspaces.html) | [Lab 04](labs/lab-04-workspaces/) |
| 7 | [Lesson 12 — Production](/modules/t12-production.html) | [Labs 05–07](labs/lab-05-drift-import/) |
| 8 | [Troubleshoot hub](/troubleshoot.html) | Drift + import scenarios |

Run the site locally: `make site-dev` → http://localhost:4321

## Difficulty levels

- **Beginner** — IaC basics, init/validate/plan, variables and outputs
- **Intermediate** — Modules, remote state, workspaces, CI pipelines
- **Advanced** — Drift/import, production deploy, full stack with safeguards

## Tips for retention

1. **Don't skip the quiz** — it catches gaps before you touch real cloud APIs.
2. **Write one note per lab** in the Tracker — patterns you want to remember.
3. **Always read plan output** — understand every `+`, `~`, and `-` before applying.
4. **Repeat drills** — `drills/terraform-commands.md` until commands are automatic.
5. **Export your progress** — Tracker → Export backup so you don't lose checkmarks.

## When you're stuck

| Symptom | First command |
|---------|---------------|
| Provider not found | `terraform init` |
| Syntax error | `terraform validate` |
| Unexpected changes | `terraform plan` — read the diff |
| State locked | `terraform force-unlock LOCK_ID` (after confirming no other run) |
| Resource exists outside state | `terraform import ADDRESS ID` |

See [drills/troubleshooting-scenarios.md](drills/troubleshooting-scenarios.md) for full playbooks.
