# Semantic conventions — the shared vocabulary

Semantic conventions (semconv) are **standard attribute and metric names** so dashboards, alerts, and vendor tools work across languages and teams without custom mapping.

Spec: [opentelemetry.io/docs/specs/semconv](https://opentelemetry.io/docs/specs/semconv/)

---

## Stability levels

| Level | Meaning | Example |
|-------|---------|---------|
| **Stable** | Won't break without major version | `http.request.method` |
| **Experimental** | May change | Some messaging attributes |
| **Deprecated** | Use replacement | Old names documented in spec |

Check stability before building executive dashboards on experimental conventions.

---

## HTTP conventions

| Attribute | Example | Use |
|-----------|---------|-----|
| `http.request.method` | `GET` | Method |
| `http.route` | `/users/{id}` | Low-cardinality route template |
| `http.response.status_code` | `500` | Status |
| `url.scheme` | `https` | Scheme |
| `server.address` | `api.example.com` | Host |

**Span name recommendation:** `GET /users/{id}` or `{method} {route}` — not full URL with query string.

Our Go sample uses `otelhttp` middleware which sets these automatically.

---

## Database conventions

| Attribute | Example |
|-----------|---------|
| `db.system` | `postgresql`, `redis` |
| `db.name` | `orders_db` |
| `db.operation` | `SELECT`, `INSERT` |
| `db.statement` | SQL (careful — may contain PII) |

**Production:** often redact or hash `db.statement` in Collector.

---

## Messaging conventions

| Attribute | Example |
|-----------|---------|
| `messaging.system` | `kafka`, `rabbitmq` |
| `messaging.destination.name` | `orders.topic` |
| `messaging.operation` | `publish`, `receive` |

Critical for traces across async boundaries — propagate context in message headers.

---

## Resource conventions

Beyond `service.name`:

| Attribute | When |
|-----------|------|
| `service.namespace` | Multi-team org |
| `service.instance.id` | Distinguish replicas |
| `deployment.environment` | dev/staging/prod |
| `cloud.provider` | `aws`, `gcp`, `azure` |
| `k8s.*` | Kubernetes metadata |

---

## Metric naming

Pattern: `{namespace}.{entity}.{metric}`

Examples:

```
http.server.request.duration
http.server.active_requests
db.client.connections.usage
jvm.memory.used
```

Units in separate field: `ms`, `s`, `By`, `{request}`.

---

## Why conventions matter

Without conventions:

- Team A uses `http.method`, Team B uses `http_verb` — dashboards break
- Vendor APM can't auto-detect dependencies

With conventions:

- Import standard Grafana dashboards
- Cross-service queries work in any backend
- Interview answer: "We follow OTel semconv for HTTP and DB"

---

## Applying in code

Prefer instrumentation libraries — they set conventions automatically.

Manual spans — use spec constants:

```go
import semconv "go.opentelemetry.io/otel/semconv/v1.24.0"

span.SetAttributes(
    semconv.HTTPMethodKey.String("GET"),
    semconv.HTTPRouteKey.String("/checkout"),
)
```

---

## Collector enrichment

Add org-wide attributes without code changes:

```yaml
processors:
  resource:
    attributes:
      - key: deployment.environment
        value: production
        action: upsert
      - key: org.name
        value: acme
        action: upsert
```

---

## Check yourself

1. Why use `http.route` instead of full URL path?
2. What stability level should production alerts rely on?
3. Name three HTTP semantic attributes.

Answers: [concept-self-check.md](../drills/concept-self-check.md) § Block 6

---

## Next

[07 — Sampling strategies](07-sampling-strategies.md)
