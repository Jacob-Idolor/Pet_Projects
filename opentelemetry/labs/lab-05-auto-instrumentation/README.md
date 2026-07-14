# Lab 05 — Auto-instrumentation

**Level:** L4 · **Time:** 30–45 min · **Prerequisites:** Lab 01 · **Curriculum:** [07 — Instrumentation](../../curriculum/07-instrumentation.md)

## Concepts

**Auto-instrumentation** wraps frameworks and clients without changing business code. Python's `opentelemetry-instrument` is the fastest way to see traces from Flask, requests, and common DB drivers.

## Goals

- Run the Python Flask sample with zero code changes to tracing
- Compare auto vs manual spans in Jaeger
- Complete the instrumentation checklist for the Flask app

## Steps

### 1. Stack running

```bash
make stack-up
```

### 2. Option A — Docker

```bash
docker compose -f examples/stack/docker-compose.yml up -d python-flask
curl http://localhost:8081/
curl http://localhost:8081/api/items
```

### 3. Option B — host with venv

```bash
cd examples/python-flask
python -m venv .venv && source .venv/bin/activate
pip install -r requirements.txt
export OTEL_EXPORTER_OTLP_ENDPOINT=http://localhost:4318
export OTEL_SERVICE_NAME=python-flask-lab
opentelemetry-instrument python app.py
```

Hit http://localhost:8081 in another terminal.

### 4. Compare in Jaeger

| Service | Instrumentation |
|---------|-----------------|
| `go-http-lab` | Manual + otelhttp middleware |
| `python-flask-lab` | Auto-instrumentation |

Notice Flask/Werkzeug spans vs your manual `processItems` span (if added).

### 5. Checklist drill

Work through [drills/instrumentation-checklist.md](../../drills/instrumentation-checklist.md) for the Flask app — mark what's covered by auto-inst vs what you'd add manually.

## Reflect

- What spans does auto-instrumentation miss for your domain logic?
- When would you choose Java agent vs manual Spring instrumentation?

## Checklist

- [ ] Python traces visible in Jaeger
- [ ] Compared auto vs Go manual traces
- [ ] Completed instrumentation checklist
- [ ] Updated [PROGRESS.md](../../PROGRESS.md)

## Clean up

```bash
docker compose -f examples/stack/docker-compose.yml stop python-flask
```

## Next

[Lab 06 — Kubernetes](../lab-06-kubernetes/)
