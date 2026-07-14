# Troubleshooting scenarios

Browser simulators mirror these — practice both.

## Scenario 1 — Validation error

**Symptom:** `terraform validate` fails with syntax error.

**Fix path:**
1. Read the error line number
2. Check matching braces, quotes, argument names
3. `terraform fmt` then `terraform validate`

**Browser:** `/practice-validation.html`

---

## Scenario 2 — Drift detected

**Symptom:** `terraform plan` shows `~` update on resource you didn't change in HCL.

**Cause:** Someone edited resource in cloud console, or external process changed attributes.

**Fix path:**
1. `terraform plan` — read which attributes drifted
2. Update HCL to match intended state, OR apply to revert
3. Add policy: no manual console edits

**Browser:** `/practice-drift.html`

---

## Scenario 3 — State lock

**Symptom:** `Error acquiring the state lock`

**Cause:** Another apply/plan running, or crashed process left lock.

**Fix path:**
1. Confirm no other Terraform process is running
2. Check DynamoDB lock table (remote state)
3. `terraform force-unlock LOCK_ID` only if safe

**Browser:** `/practice-state-lock.html`

---

## Scenario 4 — Resource already exists

**Symptom:** Apply fails: `AlreadyExists` or `BucketAlreadyOwnedByYou`

**Fix path:**
1. Import: `terraform import ADDRESS ID`
2. Or rename resource in HCL
3. Or delete existing resource manually (careful in prod)

---

## Scenario 5 — Failed apply mid-run

**Symptom:** Partial resources created, apply errored.

**Fix path:**
1. `terraform plan` — see what's left to create/fix
2. Fix underlying error (IAM, quota, invalid config)
3. `terraform apply` again — Terraform resumes from state

**Never** delete state file to "start over" in production.

---

## Scenario 6 — Wrong workspace

**Symptom:** Plan wants to destroy production resources.

**Fix path:**
1. `terraform workspace show` — **always** before apply
2. Abort if wrong workspace
3. Use separate state backends for prod

---

## Scenario 7 — Timed production drill (30 min)

1. init + validate
2. plan and explain every change
3. identify one security issue in HCL
4. write import command for orphaned S3 bucket
5. document rollback plan

Target: complete under 30 min by attempt 2.
