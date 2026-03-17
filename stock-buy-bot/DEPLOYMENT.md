# Deployment Guide

This guide walks through running the investment dashboard and trading bot safely in local, Docker, and production-style setups.

## What You Get

- Responsive investment dashboard at `/dashboard`
- Protected trade endpoints at `/trade/buy` and `/trade/sell`
- Signed-request authentication
- Trusted-host enforcement
- Security headers enabled by default
- Audit logging for bot activity
- Dry-run mode unless live trading is explicitly configured

## 1. Local Deployment

### Prerequisites

- Python 3.12
- `pip`

### Steps

```bash
cd stock-buy-bot
python -m venv .venv
.venv\Scripts\activate
python -m pip install --upgrade pip
python -m pip install -e ".[dev]"
copy .env.example .env
python -m pytest tests -p no:cacheprovider
uvicorn --app-dir src stock_buy_bot.main:app --host 127.0.0.1 --port 8000
```

Open:

- Dashboard: [http://127.0.0.1:8000/dashboard](http://127.0.0.1:8000/dashboard)
- Health: [http://127.0.0.1:8000/health](http://127.0.0.1:8000/health)

## 2. Environment Variables

Minimum local `.env`:

```env
ENVIRONMENT=dev
TRADE_API_KEY=dev-trade-key
TRADE_SIGNING_SECRET=dev-signing-secret-change-me
ALLOWED_HOSTS=localhost,127.0.0.1,testserver
AUDIT_LOG_PATH=var/audit/trades.jsonl
PORTFOLIO_DATA_PATH=var/portfolio.json
```

For live trading, also set:

```env
USE_LIVE_TRADING=true
ALPACA_API_KEY=your-real-key
ALPACA_API_SECRET=your-real-secret
```

The app will refuse startup if live trading is enabled without Alpaca credentials.

## 3. Docker Deployment

Build:

```bash
cd stock-buy-bot
docker build -t stock-buy-bot-dashboard .
```

Run:

```bash
docker run --rm ^
  -p 8000:8000 ^
  -e ENVIRONMENT=staging ^
  -e TRADE_API_KEY=replace-me ^
  -e TRADE_SIGNING_SECRET=replace-me-too ^
  -e ALLOWED_HOSTS=localhost,127.0.0.1 ^
  -e AUDIT_LOG_PATH=var/audit/trades.jsonl ^
  -e PORTFOLIO_DATA_PATH=var/portfolio.json ^
  stock-buy-bot-dashboard
```

Mount a persistent volume if you want audit logs and portfolio seed data to survive container restarts.

## 4. Secure Production Checklist

Before exposing this service publicly:

1. Set `ENVIRONMENT=prod`.
2. Replace `TRADE_API_KEY` and `TRADE_SIGNING_SECRET` with strong secrets.
3. Set `ALLOWED_HOSTS` to your real hostname(s).
4. Keep the app behind HTTPS, ideally through a reverse proxy.
5. Store secrets in your deployment platform's secret manager, not in git.
6. Persist `AUDIT_LOG_PATH` to durable storage.
7. Keep `USE_LIVE_TRADING=false` until you verify dry-run behavior.
8. Restrict network access so only trusted callers can reach trade endpoints.
9. Review audit logs after every test trade.
10. Rotate the signing secret and API key on a schedule.

## 5. Trade Request Signing

Trade endpoints require these headers:

- `X-Trade-Key`
- `X-Trade-Timestamp`
- `X-Trade-Signature`
- `Idempotency-Key`

Signature payload format:

```text
<timestamp>.<raw_request_body>
```

Signature algorithm:

- HMAC-SHA256 using `TRADE_SIGNING_SECRET`

Example Python signer:

```python
import hashlib
import hmac
import json
from datetime import datetime, UTC

body = json.dumps(
    {"symbol": "AAPL", "usd_amount": "100.00"},
    separators=(",", ":"),
).encode("utf-8")
timestamp = datetime.now(UTC).isoformat().replace("+00:00", "Z")
secret = "replace-me"
signature = hmac.new(
    secret.encode("utf-8"),
    timestamp.encode("utf-8") + b"." + body,
    hashlib.sha256,
).hexdigest()
```

## 6. Reverse Proxy Notes

Recommended setup:

- Put Nginx, Caddy, or Traefik in front of the app
- Terminate TLS at the proxy
- Forward only the hostnames you expect
- Do not expose development docs in production

## 7. Operational Safety Notes

- The dashboard reads bot actions from the audit log, so bot activity becomes visible automatically.
- Idempotency keys are reused as broker client order IDs to reduce duplicate trades.
- The service is still best treated as a controlled deployment, not an internet-open retail trading product.

## 8. First Deployment Flow

1. Deploy in `dev` or `staging`.
2. Open `/dashboard` and confirm the seeded portfolio renders.
3. Send one dry-run buy request.
4. Confirm a new action appears in the Bot Actions panel.
5. Review the audit log file.
6. Only then consider enabling live trading.
