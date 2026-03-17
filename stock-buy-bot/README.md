# Stock Buy Bot (Foundation)

Production-focused starter kit for an automated **stock buy** bot with guardrails.

## Tech stack
- Python 3.12
- FastAPI + Pydantic v2
- Alpaca broker integration (`alpaca-py`) with dry-run fallback
- Tenacity retries
- Structured JSON logging (`structlog`)
- Pytest + Ruff + MyPy
- Docker-ready

## Features included
- `/health` endpoint for service monitoring
- `/trade/buy` endpoint for market buy requests
- Risk guardrails:
  - symbol allowlist
  - max order USD cap
- Dry-run mode when API keys are not set
- Config driven via environment variables

## Quickstart
```bash
cd stock-buy-bot
python -m venv .venv
source .venv/bin/activate
pip install -e ".[dev]"
cp .env.example .env
uvicorn stock_buy_bot.main:app --reload
```

## API example
```bash
curl -X POST http://localhost:8000/trade/buy \
  -H "Content-Type: application/json" \
  -d '{"symbol":"AAPL","usd_amount":100}'
```

## Production hardening next steps
- Add webhook auth and request signing.
- Add persistent audit logs (Postgres + append-only events).
- Add circuit-breakers and broker failover.
- Add strategy engine and paper-trading backtests before live use.
