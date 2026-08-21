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

- There is **no production deploy** until a host is chosen ([radar/DEPLOY.md](radar/DEPLOY.md)).
- Codex must not create AWS/Terraform resources, upload to a public origin, send alerts, or publish emails unless the user explicitly requests that action.

## Recovery

- If validation fails, do not merge or deploy; fix the branch and rerun validation.
- If deployment fails before S3 synchronization, production should remain unchanged; diagnose the workflow before retrying.
- If deployment changes production but post-deploy checks fail, identify the last known-good commit and prepare a revert through the same branch, validation, and deployment path.
- Do not make an unreviewed manual S3 or Terraform change as a shortcut around a failed deployment.
