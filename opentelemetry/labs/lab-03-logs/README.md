# Lab 03 — Logs

**Level:** L2 · **Time:** 30 min · **Prerequisites:** Labs 01–02 · **Curriculum:** [05 — Logs](../../curriculum/05-logs.md)

## Concepts

Logs become most useful when they share **trace_id** with spans. The Go sample emits **structured JSON logs** to stdout with `trace_id` and `span_id` when a request is traced — the pattern used before full OTel log export to a backend.

## Goals

- Emit correlated logs from the sample app
- See log output in Collector debug exporter
- Practice the trace → log correlation workflow

## Steps

### 1. Run app with verbose logging

```bash
make stack-up
docker compose -f examples/stack/docker-compose.yml up -d go-http
make stack-logs   # in another terminal — watch Collector output
```

### 2. Generate requests

```bash
curl http://localhost:8080/work
curl http://localhost:8080/error
```

### 3. Correlate trace and logs

1. Find an error trace in Jaeger (`GET /error`, status ERROR)
2. Note the **Trace ID** from the trace detail panel
3. In Collector logs (`make stack-logs`), search for that trace ID or look for JSON log lines from the app container:

```bash
docker compose -f examples/stack/docker-compose.yml logs go-http
```

Log lines include `trace_id` when the request is traced.

### 4. Exercise — missing correlation

Remove `OTEL_SERVICE_NAME`, restart the app, hit an endpoint. What still works? What breaks in the UIs?

```bash
docker compose -f examples/stack/docker-compose.yml stop go-http
OTEL_SERVICE_NAME= docker compose -f examples/stack/docker-compose.yml up -d go-http
```

Restore:

```bash
docker compose -f examples/stack/docker-compose.yml up -d go-http
```

## Reflect

- When would you reach for logs instead of expanding span attributes?
- Why is JSON structured logging preferred over plain printf in production?

## Checklist

- [ ] Saw trace_id in application log output
- [ ] Matched one trace in Jaeger to its log lines
- [ ] Completed correlation exercise
- [ ] Updated [PROGRESS.md](../../PROGRESS.md)

## Next

[Lab 04 — Collector pipelines](../lab-04-collector/)
