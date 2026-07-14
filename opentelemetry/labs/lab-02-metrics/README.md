# Lab 02 — Metrics

**Level:** L2 · **Time:** 30–45 min · **Prerequisites:** [Lab 01](../lab-01-first-trace/) · **Curriculum:** [04 — Metrics](../../curriculum/04-metrics.md)

## Concepts

**RED metrics** (Rate, Errors, Duration) describe service health. The Go sample registers an HTTP request duration histogram via the OTel Go SDK.

## Goals

- Generate HTTP traffic and see metrics in Prometheus
- Run a PromQL query for request rate
- View metrics in Grafana

## Steps

### 1. Ensure stack + app are running

```bash
make stack-up
docker compose -f examples/stack/docker-compose.yml up -d go-http
make lab-sample-traffic
```

### 2. Query Prometheus

Open http://localhost:9090

Check targets: **Status → Targets** — `otel-collector` should be UP.

Try queries (metric names may vary slightly — use **Metrics** autocomplete):

```promql
# Request count rate
rate(http_server_request_duration_seconds_count[5m])

# Or search: http_server
```

### 3. Grafana dashboard

Open http://localhost:3000 (admin / practice)

Navigate to **Dashboards → OpenTelemetry Lab → HTTP RED Overview**

Generate more traffic and watch panels update:

```bash
for i in $(seq 1 20); do curl -s http://localhost:8080/work; done
curl http://localhost:8080/error   # triggers 500 for error metric
```

### 4. Cardinality exercise

Open [../../curriculum/04-metrics.md](../../curriculum/04-metrics.md) — explain why adding `user_id` as a label would be dangerous.

## Reflect

- How do metrics complement traces for alerting?
- What's the difference between a Counter and a Histogram?
- Where in the pipeline does OTLP become Prometheus format?

## Checklist

- [ ] Prometheus scrapes Collector metrics
- [ ] Ran at least one PromQL query
- [ ] Viewed Grafana RED dashboard
- [ ] Generated an error request and observed it in metrics
- [ ] Updated [PROGRESS.md](../../PROGRESS.md)

## Next

[Lab 03 — Logs](../lab-03-logs/)
