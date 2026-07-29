# Enable GitHub OIDC for StocksWatch (one-time)

Your normal CLI user (`jacob-dev-cli`) **cannot** create IAM roles — that is intentional (deploy policy denies IAM privilege escalation). OIDC setup needs a **one-time** elevated step, then you go back to least privilege.

You do **not** need to click together a full role by hand. Prefer: temporary policy → `terraform apply` → GitHub secrets → remove temporary policy.

## Step 1 — Temporary IAM permission (AWS Console, ~2 minutes)

1. Sign in to [AWS Console](https://console.aws.amazon.com/) as a user/role that **can** edit IAM (account root or admin).
2. Go to **IAM → Users → `jacob-dev-cli` → Permissions → Add permissions → Create inline policy → JSON**.
3. Paste the contents of [`oidc-bootstrap-temp-policy.json`](iam/oidc-bootstrap-temp-policy.json).
4. Name it `stocks-radar-oidc-bootstrap-temp` → Create.

(Alternatively attach AWS managed `IAMFullAccess` temporarily — broader; remove immediately after Step 3.)

## Step 2 — Terraform apply (this PC)

Already set in `terraform.tfvars`:

```hcl
enable_github_oidc          = true
create_github_oidc_provider = true
github_repository           = "Jacob-Idolor/Pet_Projects"
```

```powershell
cd E:\Pet_Projects\Pet_Projects\stocks\radar\infra\terraform
terraform init
terraform plan
terraform apply
```

Confirm create of:

- OIDC provider `token.actions.githubusercontent.com` (if new)
- Role `stocks-radar-github-actions`
- Inline deploy policy (S3 + CloudFront invalidate + SNS + CloudWatch)

If `create_github_oidc_provider` fails because the provider already exists, set `create_github_oidc_provider = false` and re-apply.

## Step 3 — Point GitHub at the role

```powershell
cd E:\Pet_Projects\Pet_Projects\stocks\radar\infra\terraform
$arn = terraform output -raw github_actions_role_arn
gh secret set AWS_ROLE_ARN --repo Jacob-Idolor/Pet_Projects --body $arn
gh variable set STOCKS_RADAR_USE_OIDC --repo Jacob-Idolor/Pet_Projects --body "true"
```

Keep `AWS_REGION` secret set (e.g. `us-west-2`). You can leave old access-key secrets until a deploy succeeds.

## Step 4 — Prove it

1. GitHub → Actions → **Stocks Radar — deploy** → Run workflow.
2. Open the job log: auth should say **OIDC** (not access keys).
3. Confirm site still healthy: `https://stockswatch.cc/health.json`

## Step 5 — Lock down (important)

1. **IAM → Users → jacob-dev-cli** → delete the temporary `stocks-radar-oidc-bootstrap-temp` policy (or detach `IAMFullAccess`).
2. After a **green OIDC deploy**, delete GitHub secrets `AWS_ACCESS_KEY_ID` and `AWS_SECRET_ACCESS_KEY`.
3. IAM → that deploy user’s **Security credentials** → deactivate/delete the access keys used by GitHub (if separate from `jacob-dev-cli`).

## What you should see in Console after apply

| Where | What |
|-------|------|
| IAM → Identity providers | `token.actions.githubusercontent.com` |
| IAM → Roles | `stocks-radar-github-actions` |
| Role → Trust | GitHub repo `Jacob-Idolor/Pet_Projects` (main + environment `stockwatch`) |

**Required:** GitHub → Settings → Environments → `stockwatch` → **Deployment branches** = `main` only.
Otherwise the `environment:stockwatch` OIDC subject can be assumed from any branch that uses that environment.

## If something fails

| Error | Fix |
|-------|-----|
| `AccessDenied` on CreateRole / OIDC | Step 1 policy not attached, or wrong user |
| `explicit deny` from `JacobStaticSiteDevPolicy` | Temp allow **cannot** override Deny. Detach that managed policy from `jacob-dev-cli` for 2 minutes, finish apply, re-attach. |
| OIDC provider already exists | `create_github_oidc_provider = false` then apply |
| Deploy still uses access keys | `STOCKS_RADAR_USE_OIDC` not `true`, or `AWS_ROLE_ARN` empty |
| Digest metrics fail after cutting keys | Re-apply Terraform (OIDC role includes CloudWatch read) |
| Full `terraform apply` fails on `s3:GetBucketAcl` | Use targeted apply (`-refresh=false` + OIDC `-target`s) or temporarily grant broader S3/admin |
