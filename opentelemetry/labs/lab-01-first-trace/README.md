# Lab 01 — First trace

**Level:** L1 · **Time:** 30–45 min · **Prerequisites:** [Lab 00](../lab-00-stack/) · **Curriculum:** [02 — OTel concepts](../../curriculum/02-opentelemetry-concepts.md), [03 — Traces](../../curriculum/03-traces.md)

## Concepts

A **span** is one unit of work. Spans with the same `trace_id` form a **trace** — the story of one request through your system.

The Go sample app creates nested spans for `/work` and `/chain` endpoints.

## Goals

- Run an instrumented HTTP service
- Generate traffic and find traces in Jaeger
- Read a waterfall view and identify parent/child spans

## Steps

### 1. Start the stack

```bash
cd opentelemetry
make stack-up
```

### 2. Run the Go sample app

**Option A — Docker (recommended):**

```bash
docker compose -f examples/stack/docker-compose.yml up -d go-http
```

**Option B — on host:**

```bash
cd examples/go-http
export OTEL_EXPORTER_OTLP_ENDPOINT=http://localhost:4318
export OTEL_SERVICE_NAME=go-http-lab
go run .
```

App listens on http://localhost:8080

### 3. Generate traffic

```bash
make lab-sample-traffic
```

Or manually:

```bash
curl http://localhost:8080/
curl http://localhost:8080/work
curl http://localhost:8080/chain
```

### 4. Find traces in Jaeger

1. Open http://localhost:16686
2. Service: `go-http-lab`
3. Operation: try `GET /work` or `GET /chain`
4. Click **Find Traces** → open a trace

**Observe:**

- Root span for HTTP request
- Child spans for simulated work (`simulateWork`, `downstreamCall`)
- Span duration bars — which step took longest?

### 5. Break propagation (bonus)

Stop the Collector while the app runs:

```bash
docker compose -f examples/stack/docker-compose.yml stop otel-collector
curl http://localhost:8080/work
docker compose -f examples/stack/docker-compose.yml start otel-collector
```

App still responds — but traces may buffer or drop. Check app logs. Restart Collector and verify traces flow again.

## Reflect

- What `service.name` appears in Jaeger? Where is it set?
- For `/chain`, how many spans appear and why?
- What would happen without `defer span.End()`?

## Checklist

- [ ] Traces visible for `go-http-lab`
- [ ] Opened waterfall for `/work` and `/chain`
- [ ] Identified parent and child spans
- [ ] Bonus: observed Collector outage behavior
- [ ] Updated [PROGRESS.md](../../PROGRESS.md)

## Clean up

```bash
docker compose -f examples/stack/docker-compose.yml stop go-http
# keep stack running for Lab 02, or: make stack-down
```

## Next

[Lab 02 — Metrics](../lab-02-metrics/)
