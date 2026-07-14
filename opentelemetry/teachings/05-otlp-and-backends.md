# OTLP and backends — the wire protocol

OTLP (OpenTelemetry Protocol) is why vendor neutrality works. Every backend that speaks OTLP accepts the same data.

---

## OTLP transports

| Transport | Default port | When to use |
|-----------|--------------|-------------|
| gRPC | 4317 | Lower overhead, default in many K8s setups |
| HTTP/protobuf | 4318 | Easier through firewalls, load balancers |
| HTTP/JSON | 4318 | Debugging with curl (limited) |

App configuration:

```bash
OTEL_EXPORTER_OTLP_ENDPOINT=http://collector:4318
OTEL_EXPORTER_OTLP_PROTOCOL=http/protobuf
```

Separate endpoints per signal (optional):

```bash
OTEL_EXPORTER_OTLP_TRACES_ENDPOINT=http://collector:4318/v1/traces
OTEL_EXPORTER_OTLP_METRICS_ENDPOINT=http://collector:4318/v1/metrics
```

---

## What OTLP carries

Protobuf messages defined in [opentelemetry-proto](https://github.com/open-telemetry/opentelemetry-proto):

| Message | Contains |
|---------|----------|
| `TracesData` | ResourceSpans → ScopeSpans → Spans |
| `MetricsData` | ResourceMetrics → ScopeMetrics → Metrics |
| `LogsData` | ResourceLogs → ScopeLogs → LogRecords |

Backends translate OTLP into their internal storage — you don't need to know their format.

---

## Collector as translation layer

The Collector can receive OTLP and export to **non-OTLP** systems:

| Exporter | Backend |
|----------|---------|
| `otlp/jaeger` | Jaeger (native OTLP) |
| `prometheus` | Prometheus scrape endpoint |
| `otlphttp` | Grafana Cloud, Dynatrace, Honeycomb |
| `file` | Debug / archive |
| `debug` | Collector logs (learning only) |

Example fan-out:

```yaml
exporters:
  otlp/jaeger:
    endpoint: jaeger:4317
    tls:
      insecure: true
  otlphttp/dynatrace:
    endpoint: https://xxx.live.dynatrace.com/api/v2/otlp
    headers:
      Authorization: "Api-Token ${DT_TOKEN}"

service:
  pipelines:
    traces:
      exporters: [otlp/jaeger, otlphttp/dynatrace]
```

---

## TLS and auth in production

```yaml
exporters:
  otlp:
    endpoint: collector.example.com:4317
    tls:
      cert_file: /certs/client.crt
      key_file: /certs/client.key
      ca_file: /certs/ca.crt
```

Never send production telemetry over plain HTTP across networks.

---

## Backend comparison (same OTLP, different UX)

| Backend | Strength | OTel ingest |
|---------|----------|-------------|
| **Jaeger** | Trace UI, open source | Native OTLP |
| **Tempo** | Trace storage at scale (Grafana stack) | OTLP |
| **Prometheus** | Metrics + alerting | Via Collector prometheus exporter |
| **Dynatrace** | Full platform, Davis AI | OTLP API |
| **Honeycomb** | High-cardinality trace analysis | OTLP |
| **Grafana Cloud** | Managed Mimir/Loki/Tempo | OTLP |

**Your instrumentation stays identical** — change exporter config to switch or duplicate.

---

## Metric name translation

OTLP uses dotted names (`http.server.duration`). Prometheus uses underscores and suffixes:

```
OTel:     http.server.request.duration
Prometheus: http_server_request_duration_seconds_bucket
```

The Collector's Prometheus exporter handles normalization — names in Grafana may differ from SDK names. Use Prometheus autocomplete to discover actual series.

---

## Troubleshooting OTLP

| Symptom | Check |
|---------|-------|
| Connection refused | Endpoint host/port; Docker network vs localhost |
| 404 on HTTP | Path should be `/v1/traces` or base endpoint without path (SDK adds it) |
| TLS handshake error | `tls.insecure: true` only for local dev |
| Partial data | Separate pipelines — traces work but metrics pipeline misconfigured |

```bash
# Verify Collector receives data
make stack-logs
```

---

## Check yourself

1. Default OTLP HTTP port?
2. Why use Collector instead of SDK exporting directly to three backends?
3. Does changing from Jaeger to Dynatrace require re-instrumenting code?

Answers: [concept-self-check.md](../drills/concept-self-check.md) § Block 5

---

## Next

[06 — Semantic conventions](06-semantic-conventions.md)
