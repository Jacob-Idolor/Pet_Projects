from datetime import UTC, datetime
from decimal import Decimal
from pathlib import Path
import uuid

import pytest
from fastapi import HTTPException

from stock_buy_bot.config import Settings
from stock_buy_bot.security import (
    authenticate_trade_request,
    build_trade_signature,
)
from stock_buy_bot.state import SQLiteStateStore


def make_state_path() -> Path:
    base_dir = Path("tests_artifacts")
    base_dir.mkdir(exist_ok=True)
    return base_dir / f"state-{uuid.uuid4()}.db"


def test_authenticate_trade_request_accepts_valid_signature() -> None:
    state_path = make_state_path()
    settings = Settings(
        default_order_usd=Decimal("100.00"),
        max_order_usd=Decimal("500.00"),
        state_db_path=state_path,
    )
    state_store = SQLiteStateStore(state_path)
    state_store.initialize()
    body = b'{"symbol":"AAPL","usd_amount":"100.00"}'
    timestamp = datetime.now(UTC).isoformat().replace("+00:00", "Z")
    signature = build_trade_signature(
        secret=settings.trade_signing_secret.get_secret_value(),
        timestamp=timestamp,
        body=body,
    )

    context = authenticate_trade_request(
        settings=settings,
        state_store=state_store,
        body=body,
        trade_key=settings.trade_api_key.get_secret_value(),
        timestamp=timestamp,
        signature=signature,
        idempotency_key="buy-aapl-001",
    )

    assert context.principal == "dev-trade-key"
    assert context.idempotency_key == "buy-aapl-001"


def test_authenticate_trade_request_rejects_invalid_signature() -> None:
    state_path = make_state_path()
    settings = Settings(
        default_order_usd=Decimal("100.00"),
        max_order_usd=Decimal("500.00"),
        state_db_path=state_path,
    )
    state_store = SQLiteStateStore(state_path)
    state_store.initialize()

    with pytest.raises(HTTPException) as exc_info:
        authenticate_trade_request(
            settings=settings,
            state_store=state_store,
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


def test_rejects_idempotency_key_reuse_with_different_body() -> None:
    state_path = make_state_path()
    settings = Settings(state_db_path=state_path)
    timestamp = datetime.now(UTC).isoformat().replace("+00:00", "Z")
    first_body = b'{"symbol":"AAPL","usd_amount":"100.00"}'
    second_body = b'{"symbol":"AAPL","usd_amount":"200.00"}'
    first_store = SQLiteStateStore(state_path)
    second_store = SQLiteStateStore(state_path)
    first_store.initialize()
    second_store.initialize()

    first_signature = build_trade_signature(
        secret=settings.trade_signing_secret.get_secret_value(),
        timestamp=timestamp,
        body=first_body,
    )
    authenticate_trade_request(
        settings=settings,
        state_store=first_store,
        body=first_body,
        trade_key=settings.trade_api_key.get_secret_value(),
        timestamp=timestamp,
        signature=first_signature,
        idempotency_key="buy-aapl-001",
    )

    second_signature = build_trade_signature(
        secret=settings.trade_signing_secret.get_secret_value(),
        timestamp=timestamp,
        body=second_body,
    )
    with pytest.raises(HTTPException) as exc_info:
        authenticate_trade_request(
            settings=settings,
            state_store=second_store,
            body=second_body,
            trade_key=settings.trade_api_key.get_secret_value(),
            timestamp=timestamp,
            signature=second_signature,
            idempotency_key="buy-aapl-001",
        )

    assert exc_info.value.status_code == 409


def test_rejects_when_trade_rate_limit_is_exceeded() -> None:
    state_path = make_state_path()
    settings = Settings(
        state_db_path=state_path,
        trade_rate_limit_requests=1,
        trade_rate_limit_window_seconds=60,
    )
    SQLiteStateStore(state_path).initialize()
    timestamp = datetime.now(UTC).isoformat().replace("+00:00", "Z")

    for idempotency_key in ("buy-aapl-001", "buy-aapl-002"):
        body = f'{{"symbol":"AAPL","usd_amount":"100.00","key":"{idempotency_key}"}}'.encode(
            "utf-8"
        )
        signature = build_trade_signature(
            secret=settings.trade_signing_secret.get_secret_value(),
            timestamp=timestamp,
            body=body,
        )

        if idempotency_key.endswith("001"):
            authenticate_trade_request(
                settings=settings,
                state_store=SQLiteStateStore(state_path),
                body=body,
                trade_key=settings.trade_api_key.get_secret_value(),
                timestamp=timestamp,
                signature=signature,
                idempotency_key=idempotency_key,
            )
            continue

        with pytest.raises(HTTPException) as exc_info:
            authenticate_trade_request(
                settings=settings,
                state_store=SQLiteStateStore(state_path),
                body=body,
                trade_key=settings.trade_api_key.get_secret_value(),
                timestamp=timestamp,
                signature=signature,
                idempotency_key=idempotency_key,
            )

        assert exc_info.value.status_code == 429
