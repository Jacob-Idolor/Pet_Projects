# Metrics

**Level:** L2 | **Lab:** [Lab 02](../labs/lab-02-metrics/) | **Next:** [05 — Logs](05-logs.md)

## Metrics in OpenTelemetry

OTel metrics map to familiar types:

| Type | Use case | Example |
|------|----------|---------|
| **Counter** | Monotonically increasing | `http.server.request.count` |
| **UpDownCounter** | Goes up and down | Items in queue |
| **Histogram** | Distribution of values | Request duration buckets |
| **Gauge** | Point-in-time value | Memory usage |

## RED method (services)

For each service, instrument:

- **Rate** — requests per second (Counter)
- **Errors** — failed requests (Counter with `error=true` or status label)
- **Duration** — latency histogram

The Go sample exposes `http.server.duration` — query it in Prometheus or Grafana.

## Exemplars

Histograms can attach **exemplars** — sample trace IDs for a bucket. In Grafana, jump from a latency spike to the exact trace. Requires aligned trace + metrics pipelines through the Collector.

## OTLP → Prometheus

The Collector's **Prometheus exporter** exposes metrics on `:8889`. Prometheus scrapes that endpoint — see `examples/stack/prometheus.yml`.

PromQL example:

```promql
rate(http_server_duration_milliseconds_count[5m])
```

Metric names may be normalized (dots → underscores) depending on exporter settings.

## Cardinality warning

**Cardinality** = number of unique time series. Explodes when you use unbounded labels:

```text
# BAD — one series per user
http_requests_total{user_id="928374"}

# GOOD — bounded labels
http_requests_total{route="/checkout", method="POST", status="500"}
```

High cardinality crashes Prometheus and increases cost on vendor backends.

## USE method (resources)

For nodes, disks, pools:

- **Utilization** — % busy
- **Saturation** — queue length, throttling
- **Errors** — device errors, timeouts

Kubernetes cAdvisor and node exporters complement app-level RED metrics.

## Practice goals

- [ ] Hit the Go app and see request metrics in Prometheus
- [ ] Build a simple Grafana panel for request rate
- [ ] Explain why `user_id` is a bad metric label

## Read next

[05 — Logs](05-logs.md)
