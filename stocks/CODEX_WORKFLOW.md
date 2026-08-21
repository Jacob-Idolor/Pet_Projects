# StocksWatch Codex workflow

Codex is the coding agent for StocksWatch. Cursor may remain the editor, but Cursor Chat or Cursor Agent should not edit the same working tree while Codex is working.

## Scope

- StocksWatch lives in `stocks/radar/` inside the `Pet_Projects` monorepo.
- Keep StocksWatch changes inside `stocks/` and the StocksWatch-specific files under `.github/` unless the user explicitly expands the task.
- Follow `stocks/AGENTS.md` for validation, generated-file, security, and financial-data rules.

## Normal change flow

1. Start from an up-to-date `main` branch with a reviewed working tree.
2. Create a focused branch named `codex/<short-task-name>`.
3. Inspect the relevant architecture, source, tests, and workflow files before editing.
4. Make small, task-focused changes and preserve unrelated work.
5. Run the narrowest relevant checks during development.
6. Before handoff, run unit tests, typechecking, and any data-schema checks affected by the change.
7. For UI, routing, or release-sensitive changes, run an offline build and Playwright tests.
8. Review the final diff for secrets, generated market data, unintended monorepo changes, and stale documentation.
9. Commit and push only when requested, then open a pull request.
10. Merge only after the Stocks Radar validation workflow succeeds.

## Deployment flow

- GitHub Actions is the production deployment authority.
- A successful Stocks Radar validation run on a push to `main` may start the deployment workflow when `STOCKS_RADAR_DEPLOY_ENABLED=true`.
- Codex must not manually trigger a deployment, upload to S3, invalidate CloudFront, change live cache behavior, send alerts, or publish emails unless the user explicitly requests that action.
- After an authorized deployment, verify the workflow result, public health endpoint, and data freshness.

## Terraform flow

- Codex may edit Terraform and run `terraform fmt`, `terraform init -backend=false`, and `terraform validate` as part of normal verification.
- A Terraform plan may be prepared only after confirming the intended workspace, backend/state source, variables, AWS account, and region.
- Never run `terraform apply`, `terraform destroy`, import/move state, migrate a backend, or modify AWS resources without explicit user approval for that exact operation.
- Treat `terraform.tfvars`, state files, plan files, and provider caches as local sensitive artifacts. Never commit them.

## Recovery

- If validation fails, do not merge or deploy; fix the branch and rerun validation.
- If deployment fails before S3 synchronization, production should remain unchanged; diagnose the workflow before retrying.
- If deployment changes production but post-deploy checks fail, identify the last known-good commit and prepare a revert through the same branch, validation, and deployment path.
- Do not make an unreviewed manual S3 or Terraform change as a shortcut around a failed deployment.
