# Python Flask — auto-instrumentation sample

Flask app run with `opentelemetry-instrument` — no tracing code in `app.py`.

## Run locally

```bash
make stack-up   # from opentelemetry/
cd examples/python-flask
python -m venv .venv && source .venv/bin/activate
pip install -r requirements.txt
export OTEL_EXPORTER_OTLP_ENDPOINT=http://localhost:4318
export OTEL_SERVICE_NAME=python-flask-lab
opentelemetry-instrument python app.py
```

Open http://localhost:8081 — view traces in Jaeger as `python-flask-lab`.

## Learn

- [Lab 05](../../labs/lab-05-auto-instrumentation/)
- [Curriculum: Instrumentation](../../curriculum/07-instrumentation.md)
