# Jacob Builds Codex workflow

Codex is the coding agent for the small personal site in `stocks/radar/`.
Do not edit the same worktree concurrently with another agent or editor.

## Scope and current direction

- Follow `stocks/AGENTS.md`, `radar/ARCHITECTURE.md` and the latest section of
  `radar/LAUNCH_STATUS.md`. The earlier StocksWatch business plan is historical.
- Keep changes inside `stocks/` and the site's specific parent `.github/` files
  unless the user expands the scope. Preserve unrelated monorepo and drive-audit work.
- The reader-facing site uses Astro, TypeScript and Cloudflare Pages. Terraform
  defines Cloudflare Pages/domain/DNS resources; the old AWS site was retired.

## Local change flow

1. Read the latest task, check its activity, and inspect the dirty worktree.
2. Use a focused `codex/<short-task-name>` branch. Preserve existing local work;
   do not reset, stash, pull over changes or switch away from an active editor.
3. Inspect source, tests, architecture and workflows before making focused edits.
4. Run the relevant tests, `npm test` and `npm run typecheck`.
5. For UI, routing, dependencies or release checks, run the static build,
   `verify:dist`, `security:dist`, `security:deps` and Playwright suite.
6. Review the diff for credentials, private products, generated-data changes,
   unintended monorepo changes and stale guidance. Summarize files and checks.
7. Commit or push only when requested. Any requested PR must be draft until reviewed.

## Production transition and recovery

- The owner explicitly approved the static workflow transition and publication
  on October 6, 2026, after an earlier approval review rejected the transition.
  This revision removes the scheduled NBIS refresh and publishing on code pushes.
  Publishing is manual; PR and main-push validation and Terraform checks remain.
- Protected main still requires the established review/merge process. Present
  the specific validated draft PR for merge confirmation if a merge is necessary.
- Retain npm audit, source tests, bundle checks, browser checks and Terraform
  validation when preparing the replacement publishing flow.
- No deployment, Terraform apply/destroy, account change, alert, email or billing
  change without explicit authorization. Do not infer account cancellation from
  removing a feature on the site.
- When deployment is requested and the transition is ready, verify all active
  pages and the expected Git revision with `freshness:live`. This checks the new
  site's content, not the freshness of retired market data.
- If a release fails, diagnose it and prepare a reviewed revert through the same
  validation path. Do not use manual infrastructure changes as a shortcut.
