# 📊 Dynatrace

Everything I learn and build around Dynatrace — dashboards, scripts, workflows, and notes.

## Structure

```
dynatrace/
  dashboards/        # exported dashboard JSON + screenshots
  scripts/           # API scripts, automation, DQL queries
  notes/             # things I learn, gotchas, patterns
```

## Conventions

- Dashboards: export the JSON and commit it alongside a screenshot and a short description of what it shows and why.
- Scripts: each script gets a header comment with purpose + required env vars. API tokens always come from `.env` (never committed — see root `.gitignore`).
- DQL queries worth keeping go in `scripts/dql/` as `.dql` files with a comment explaining the use case.

## Notes

The old Dynatrace Problem Viewer (FastAPI app) is preserved in git history (`pre-reset-archive` tag).
