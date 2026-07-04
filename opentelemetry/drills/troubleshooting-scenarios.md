# Troubleshooting scenarios

Work through each scenario without peeking at answers first. Requires `make stack-up`.

---

## S1 — No traces in Jaeger

**Symptoms:** App responds 200 but Jaeger service dropdown is empty.

<details>
<summary>Hints</summary>

1. `make stack-status` — is `otel-collector` running?
2. App env: `OTEL_EXPORTER_OTLP_ENDPOINT=http://otel-collector:4318` (in Docker) or `http://localhost:4318` (on host)
3. `OTEL_TRACES_EXPORTER=otlp` set?
4. Collector logs: `make stack-logs`

</details>

<details>
<summary>Answer</summary>

Most common: wrong OTLP endpoint (host vs Docker network name) or Collector down. Fix endpoint to match where the app runs, restart Collector, generate traffic again.

</details>

---

## S2 — Broken trace (orphan spans)

**Symptoms:** `/chain` shows disconnected spans or multiple trace IDs.

<details>
<summary>Hints</summary>

- Context must flow: pass `ctx` to child spans and outbound HTTP
- Check for missing `otelhttp.NewTransport` on clients
- Verify `TraceContext` propagator is registered

</details>

<details>
<summary>Answer</summary>

Broken propagation — child created without parent context or outbound call missing injection. In microservices, ensure all hops forward W3C headers.

</details>

---

## S3 — Metrics missing in Prometheus

**Symptoms:** Traces work; Prometheus has no app metrics.

<details>
<summary>Hints</summary>

1. Prometheus target `otel-collector:8889` UP?
2. Metrics pipeline exports to `prometheus` exporter?
3. `OTEL_METRICS_EXPORTER=otlp` on app?

</details>

<details>
<summary>Answer</summary>

Verify metrics pipeline in Collector config and Prometheus scrape config. Metric names may use underscores — search Prometheus autocomplete for `http_`.

</details>

---

## S4 — Too many traces (cost / noise)

**Symptoms:** Jaeger flooded; hard to find errors.

<details>
<summary>Hints</summary>

- Add head sampling (`probabilistic_sampler`)
- Or tail sampling keeping errors/slow traces
- See [Lab 07](../labs/lab-07-sampling/)

</details>

<details>
<summary>Answer</summary>

Implement sampling at SDK or Collector. Keep 100% of errors via tail sampling policies; head-sample successful fast paths.

</details>

---

## S5 — High cardinality metric crash

**Symptoms:** Prometheus OOM or "too many metrics" warning.

<details>
<summary>Hints</summary>

- Inspect metric labels — unbounded values?
- Remove user/session/request IDs from labels
- Use logs or traces for high-cardinality detail

</details>

<details>
<summary>Answer</summary>

Replace high-cardinality labels with bounded dimensions (`route`, `method`, `status_class`). See [runbooks/high-cardinality.md](../runbooks/high-cardinality.md).

</details>

---

## S6 — Logs without trace_id

**Symptoms:** Logs appear but can't correlate to Jaeger traces.

<details>
<summary>Hints</summary>

- Logger must use request `context`
- Enable log bridge / auto log instrumentation
- Same trace provider as HTTP middleware

</details>

<details>
<summary>Answer</summary>

Use context-aware logging (`slog.InfoContext`, Python logging with OTel handler). Ensure instrumentation runs before request handling.

</details>
