from datetime import UTC, datetime
from decimal import Decimal

import pytest
from fastapi import HTTPException

from stock_buy_bot.config import Settings
from stock_buy_bot.security import authenticate_trade_request, build_trade_signature


def test_authenticate_trade_request_accepts_valid_signature() -> None:
    settings = Settings(
        default_order_usd=Decimal("100.00"),
        max_order_usd=Decimal("500.00"),
    )
    body = b'{"symbol":"AAPL","usd_amount":"100.00"}'
    timestamp = datetime.now(UTC).isoformat().replace("+00:00", "Z")
    signature = build_trade_signature(
        secret=settings.trade_signing_secret.get_secret_value(),
        timestamp=timestamp,
        body=body,
    )

    context = authenticate_trade_request(
        settings=settings,
        body=body,
        trade_key=settings.trade_api_key.get_secret_value(),
        timestamp=timestamp,
        signature=signature,
        idempotency_key="buy-aapl-001",
    )

    assert context.principal == "dev-trade-key"
    assert context.idempotency_key == "buy-aapl-001"


def test_authenticate_trade_request_rejects_invalid_signature() -> None:
    settings = Settings(
        default_order_usd=Decimal("100.00"),
        max_order_usd=Decimal("500.00"),
    )

    with pytest.raises(HTTPException) as exc_info:
        authenticate_trade_request(
            settings=settings,
            body=b'{"symbol":"AAPL"}',
            trade_key=settings.trade_api_key.get_secret_value(),
            timestamp=datetime.now(UTC).isoformat().replace("+00:00", "Z"),
            signature="bad-signature",
            idempotency_key="buy-aapl-001",
        )

    assert exc_info.value.status_code == 401
    assert "signature" in str(exc_info.value.detail).lower()


def test_settings_reject_live_trading_without_credentials() -> None:
    with pytest.raises(ValueError, match="Live trading requires"):
        Settings(use_live_trading=True)
