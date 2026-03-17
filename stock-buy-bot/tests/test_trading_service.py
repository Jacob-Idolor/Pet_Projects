import json
from decimal import Decimal
from pathlib import Path
import uuid

import pytest

from stock_buy_bot.audit import JsonLineAuditLogger
from stock_buy_bot.brokers.alpaca import DryRunBroker
from stock_buy_bot.config import Settings
from stock_buy_bot.models import BuyRequest, SellRequest
from stock_buy_bot.services.trading import TradingService


def make_audit_path() -> Path:
    base_dir = Path("tests_artifacts")
    base_dir.mkdir(exist_ok=True)
    return base_dir / f"audit-{uuid.uuid4()}.jsonl"


def build_service(**settings_kwargs: object) -> TradingService:
    audit_path = make_audit_path()
    settings_payload: dict[str, object] = {
        "default_order_usd": Decimal("50.00"),
        "max_order_usd": Decimal("500.00"),
        "allowed_symbols": ["AAPL"],
        "audit_log_path": audit_path,
    }
    settings_payload.update(settings_kwargs)
    settings = Settings(**settings_payload)
    return TradingService(
        broker=DryRunBroker(),
        settings=settings,
        audit_logger=JsonLineAuditLogger(audit_path),
    )


def test_execute_buy_dry_run() -> None:
    service = build_service()

    result = service.execute_buy(
        BuyRequest(symbol="AAPL"),
        idempotency_key="buy-aapl-001",
        principal="dev-trade-key",
    )

    assert result.symbol == "AAPL"
    assert result.usd_amount == Decimal("50.00")
    assert result.side == "buy"
    assert result.status == "dry_run"
    assert result.client_order_id == "buy-aapl-001"


def test_execute_sell_dry_run() -> None:
    service = build_service(default_order_usd=Decimal("25.00"))

    result = service.execute_sell(
        SellRequest(symbol="AAPL"),
        idempotency_key="sell-aapl-001",
        principal="dev-trade-key",
    )

    assert result.symbol == "AAPL"
    assert result.usd_amount == Decimal("25.00")
    assert result.side == "sell"
    assert result.status == "dry_run"
    assert result.client_order_id == "sell-aapl-001"


def test_rejects_disallowed_symbol() -> None:
    service = build_service()

    with pytest.raises(ValueError, match="not allowed"):
        service.execute_buy(
            BuyRequest(symbol="TSLA", usd_amount=Decimal("10.00")),
            idempotency_key="buy-tsla-001",
            principal="dev-trade-key",
        )


def test_rejects_oversized_order() -> None:
    service = build_service(max_order_usd=Decimal("100.00"))

    with pytest.raises(ValueError, match="exceeds"):
        service.execute_buy(
            BuyRequest(symbol="AAPL", usd_amount=Decimal("500.00")),
            idempotency_key="buy-aapl-001",
            principal="dev-trade-key",
        )


def test_persists_append_only_audit_log() -> None:
    service = build_service()

    service.execute_buy(
        BuyRequest(symbol="AAPL", usd_amount=Decimal("75.00")),
        idempotency_key="buy-aapl-002",
        principal="dev-trade-key",
    )

    audit_path = service._settings.audit_log_path
    lines = audit_path.read_text(encoding="utf-8").splitlines()
    assert len(lines) == 1

    entry = json.loads(lines[0])
    assert entry["event_type"] == "trade_executed"
    assert entry["idempotency_key"] == "buy-aapl-002"
    assert entry["principal"] == "dev-trade-key"
    assert entry["usd_amount"] == "75.00"
