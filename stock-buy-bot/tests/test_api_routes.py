from decimal import Decimal
from pathlib import Path
import uuid

import pytest
from fastapi import HTTPException

from stock_buy_bot.api.routes import buy_stock, health, sell_stock
from stock_buy_bot.audit import FallbackAuditLogger, JsonLineAuditLogger, SQLiteAuditLogger
from stock_buy_bot.brokers.alpaca import DryRunBroker
from stock_buy_bot.config import Settings
from stock_buy_bot.models import BuyRequest, SellRequest
from stock_buy_bot.security import AuthenticatedTradeContext
from stock_buy_bot.state import SQLiteStateStore
from stock_buy_bot.services.trading import TradingService


def make_audit_path() -> Path:
    base_dir = Path("tests_artifacts")
    base_dir.mkdir(exist_ok=True)
    return base_dir / f"audit-{uuid.uuid4()}.jsonl"


def make_state_path() -> Path:
    base_dir = Path("tests_artifacts")
    base_dir.mkdir(exist_ok=True)
    return base_dir / f"state-{uuid.uuid4()}.db"


def build_trading_service() -> TradingService:
    audit_path = make_audit_path()
    state_path = make_state_path()
    settings = Settings(
        default_order_usd=Decimal("40.00"),
        max_order_usd=Decimal("100.00"),
        allowed_symbols=["AAPL"],
        audit_log_path=audit_path,
        state_db_path=state_path,
    )
    state_store = SQLiteStateStore(state_path)
    state_store.initialize()
    return TradingService(
        broker=DryRunBroker(),
        settings=settings,
        audit_logger=FallbackAuditLogger(
            primary=SQLiteAuditLogger(state_store),
            fallback=JsonLineAuditLogger(settings.audit_log_path),
        ),
    )


def build_auth_context() -> AuthenticatedTradeContext:
    return AuthenticatedTradeContext(
        principal="dev-trade-key",
        idempotency_key="buy-aapl-001",
        timestamp="2026-03-17T17:00:00Z",
        signature="signed",
    )


def test_health_endpoint() -> None:
    assert health() == {"status": "ok"}


def test_buy_endpoint_returns_created_order() -> None:
    result = buy_stock(
        BuyRequest(symbol="AAPL"),
        auth=build_auth_context(),
        service=build_trading_service(),
    )

    assert result.side == "buy"
    assert result.symbol == "AAPL"
    assert result.usd_amount == Decimal("40.00")
    assert result.client_order_id == "buy-aapl-001"


def test_sell_endpoint_rejects_oversized_order() -> None:
    with pytest.raises(HTTPException) as exc_info:
        sell_stock(
            SellRequest(symbol="AAPL", usd_amount=Decimal("500.00")),
            auth=build_auth_context(),
            service=build_trading_service(),
        )

    assert exc_info.value.status_code == 400
    assert "exceeds" in str(exc_info.value.detail)
