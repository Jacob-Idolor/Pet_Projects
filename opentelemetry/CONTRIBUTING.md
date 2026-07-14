# Contributing

Thanks for helping improve the OpenTelemetry Learning Lab. This project is meant to be **forked, shared, and extended**.

## Ways to contribute

- Fix typos or unclear lab steps
- Add troubleshooting scenarios or drill questions
- Improve sample apps (more languages, clearer instrumentation)
- Share runbooks from production experience (anonymized)
- Add integration notes for vendors (Grafana Cloud, Honeycomb, etc.)

## Ground rules

### Local-only practice

- Labs must run with **Docker locally** — no cloud accounts required for core path
- Do not commit secrets, API keys, or vendor tokens
- Example `.env` files use placeholders only

### Sample apps

- Pin dependencies (`go.mod`, `requirements.txt`)
- Keep instrumentation minimal and educational — comment *why*, not just *what*
- Prefer official OTel SDKs and semantic conventions

### Pull requests

1. One logical change per PR when possible
2. Test locally: `make stack-up`, run affected lab end-to-end
3. Describe what you tested

## Vendor backends

Integration docs in `integrations/` should explain OTLP endpoint setup without requiring paid accounts where possible. Note free-tier limits when relevant.

## Code of conduct

Be respectful. This is a learning space for beginners and platform engineers alike.

## Questions

Open a GitHub issue with the `question` label.
