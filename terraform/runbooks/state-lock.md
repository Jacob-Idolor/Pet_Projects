# State lock runbook

## Symptoms

```
Error: Error acquiring the state lock
Lock Info:
  ID:        abc123-def456
  Path:      ...
  Operation: OperationTypeApply
  Who:       ci-runner@github
  Created:   2026-07-13 ...
```

## Steps

1. **Verify** no legitimate apply is running (CI dashboard, teammate)
2. **Wait** 15 min if a CI job might still be active
3. **Inspect** DynamoDB lock table if using S3 backend
4. **Force unlock** only when certain:

```bash
terraform force-unlock abc123-def456
```

## Prevention

- One apply at a time per state
- CI concurrency limits (`concurrency: terraform-prod`)
- Short-lived lock timeouts in automation
