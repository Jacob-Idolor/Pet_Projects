# Semantic conventions

**Level:** L3 | **Teachings:** [06-semantic-conventions](../teachings/06-semantic-conventions.md) | **Drill:** [instrumentation-checklist](../drills/instrumentation-checklist.md)

## Learning objectives

- Use standard HTTP, DB, and resource attribute names
- Understand stability levels (stable vs experimental)
- Avoid high-cardinality attribute mistakes

## Why conventions exist

Shared names enable:

- Portable Grafana dashboards
- Vendor auto-discovery of dependencies
- Cross-team queries without translation tables

## HTTP (stable highlights)

| Attribute | Use |
|-----------|-----|
| `http.request.method` | GET, POST, … |
| `http.route` | `/users/{id}` template |
| `http.response.status_code` | 200, 500, … |

Span name: `{method} {route}` — not `/users/928374`.

## Database

| Attribute | Example |
|-----------|---------|
| `db.system` | `postgresql` |
| `db.operation` | `SELECT` |

Redact `db.statement` in production if it contains PII.

## Resource

Always set:

- `service.name` (required)
- `deployment.environment` (strongly recommended)
- `service.version` (recommended)

## Stability

Build alerts on **stable** conventions only. Experimental may change between spec versions.

## Hands-on

1. Inspect Go sample spans in Jaeger — find otelhttp attributes
2. Complete [instrumentation checklist](../drills/instrumentation-checklist.md)
3. Add one manual span with semconv constants

## Self-check

[concept-self-check.md](../drills/concept-self-check.md) § Block 6

## Next

[13 — Baggage and correlation](13-baggage-and-correlation.md)
