# Stock Buy Bot (Foundation)

Production-focused starter kit for an automated stock trading bot with buy and sell guardrails.

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
- `/dashboard` investment tracking dashboard with portfolio performance, allocation, growth, and bot activity
- `/api/dashboard/summary` live dashboard data endpoint
- `/trade/buy` endpoint for market buy requests
- `/trade/sell` endpoint for market sell requests
- Risk guardrails:
  - symbol allowlist
  - max order USD cap
- Signed request authentication on trade routes
- Shared SQLite-backed replay protection and request throttling
- SQLite-backed audit history with JSONL fallback logging
- Idempotency keys passed through as broker client order IDs
- Dry-run mode when API keys are not set
- Config driven via environment variables
- Stocks, bonds, and mutual fund tracking with responsive charts

## Quickstart
```bash
cd stock-buy-bot
python -m venv .venv
source .venv/bin/activate  # Windows: .venv\Scripts\activate
pip install -e ".[dev]"
copy .env.example .env  # macOS/Linux: cp .env.example .env
uvicorn --app-dir src stock_buy_bot.main:app --reload
python -m pytest tests
```

Open [http://localhost:8000/dashboard](http://localhost:8000/dashboard) to view the investment dashboard.

Deployment guide: [DEPLOYMENT.md](/E:/Pet_Projects/Pet_Projects/stock-buy-bot/DEPLOYMENT.md)

## API example
```bash
python - <<'PY'
import hashlib
import hmac
import json

body = json.dumps({"symbol": "AAPL", "usd_amount": "100.00"}, separators=(",", ":")).encode()
timestamp = "2026-03-17T17:00:00Z"
secret = "dev-signing-secret-change-me"
print(hmac.new(secret.encode(), timestamp.encode() + b"." + body, hashlib.sha256).hexdigest())
PY
```

```bash
curl -X POST http://localhost:8000/trade/buy \
  -H "Content-Type: application/json" \
  -H "X-Trade-Key: dev-trade-key" \
  -H "X-Trade-Timestamp: 2026-03-17T17:00:00Z" \
  -H "X-Trade-Signature: <signature>" \
  -H "Idempotency-Key: buy-aapl-001" \
  -d '{"symbol":"AAPL","usd_amount":"100.00"}'
```

```bash
curl -X POST http://localhost:8000/trade/sell \
  -H "Content-Type: application/json" \
  -H "X-Trade-Key: dev-trade-key" \
  -H "X-Trade-Timestamp: 2026-03-17T17:00:00Z" \
  -H "X-Trade-Signature: <signature>" \
  -H "Idempotency-Key: sell-aapl-001" \
  -d '{"symbol":"AAPL","usd_amount":"50.00"}'
```

## Production hardening next steps
- Add rate limiting and secret rotation.
- Add Redis or Postgres if you need shared state across multiple hosts instead of one persisted volume.
- Add Postgres-backed audit retention and reconciliation jobs.
- Add circuit-breakers and broker failover.
- Add strategy engine and paper-trading backtests before live use.
