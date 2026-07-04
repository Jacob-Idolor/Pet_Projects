# Runbook — high cardinality metrics

## Symptoms

- Prometheus memory growth / crash
- Vendor billing spike for custom metrics
- "Too many time series" alerts

## Root cause

Metric **labels** (attributes) with unbounded values:

- `user_id`, `session_id`, `trace_id`, `order_id` as labels
- Raw URL paths (`/users/928374/profile`) instead of route templates

## Fix

1. **Audit labels** — list all metric attribute keys in dashboards
2. **Replace** unbounded labels with bounded ones:

   | Bad | Good |
   |-----|------|
   | `user_id=928374` | remove — put in logs/traces |
   | `path=/users/928374` | `http.route=/users/{id}` |

3. **Drop** offending attributes in Collector:

```yaml
processors:
  attributes/drop:
    actions:
      - key: user_id
        action: delete
```

4. **Restart** Prometheus or wait for retention to drop old series

## Prevention

- Code review checklist: [instrumentation-checklist.md](../drills/instrumentation-checklist.md)
- Lint rules in CI for forbidden attribute names (advanced)
- Prefer histograms without per-request labels

## Related

- [Curriculum: Metrics](../curriculum/04-metrics.md)
- [Troubleshooting S5](../drills/troubleshooting-scenarios.md)
