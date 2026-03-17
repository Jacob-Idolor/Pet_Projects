import json
from decimal import Decimal
from pathlib import Path
import uuid

import pytest

from stock_buy_bot.audit import FallbackAuditLogger, JsonLineAuditLogger, SQLiteAuditLogger
from stock_buy_bot.brokers.alpaca import DryRunBroker
from stock_buy_bot.config import Settings
from stock_buy_bot.exceptions import AuditLogError
from stock_buy_bot.models import BuyRequest, SellRequest
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


def build_service(
    *,
    default_order_usd: Decimal = Decimal("50.00"),
    max_order_usd: Decimal = Decimal("500.00"),
    allowed_symbols: list[str] | None = None,
) -> TradingService:
    audit_path = make_audit_path()
    state_path = make_state_path()
    settings = Settings(
        default_order_usd=default_order_usd,
        max_order_usd=max_order_usd,
        allowed_symbols=allowed_symbols or ["AAPL"],
        audit_log_path=audit_path,
        state_db_path=state_path,
    )
    state_store = SQLiteStateStore(settings.state_db_path)
    state_store.initialize()
    return TradingService(
        broker=DryRunBroker(),
        settings=settings,
        audit_logger=FallbackAuditLogger(
            primary=SQLiteAuditLogger(state_store),
            fallback=JsonLineAuditLogger(audit_path),
        ),
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


def test_persists_audit_event_in_sqlite_store() -> None:
    service = build_service()

    service.execute_buy(
        BuyRequest(symbol="AAPL", usd_amount=Decimal("75.00")),
        idempotency_key="buy-aapl-002",
        principal="dev-trade-key",
    )

    entries = SQLiteStateStore(service._settings.state_db_path).list_recent_audit_events(limit=1)
    assert len(entries) == 1

    entry = entries[0]
    assert entry.event_type == "trade_executed"
    assert entry.payload["idempotency_key"] == "buy-aapl-002"
    assert entry.payload["principal"] == "dev-trade-key"
    assert entry.payload["usd_amount"] == "75.00"


def test_trade_succeeds_when_audit_logging_fails() -> None:
    class FailingAuditLogger:
        def log_event(self, event_type: str, payload: dict[str, object]) -> None:
            del event_type
            del payload
            raise AuditLogError("disk full")

    settings = Settings(
        default_order_usd=Decimal("50.00"),
        max_order_usd=Decimal("500.00"),
        allowed_symbols=["AAPL"],
        audit_log_path=make_audit_path(),
    )
    service = TradingService(
        broker=DryRunBroker(),
        settings=settings,
        audit_logger=FailingAuditLogger(),
    )

    result = service.execute_buy(
        BuyRequest(symbol="AAPL"),
        idempotency_key="buy-aapl-003",
        principal="dev-trade-key",
    )

    assert result.status == "dry_run"


def test_trade_writes_to_jsonl_fallback_when_primary_audit_sink_fails() -> None:
    class FailingAuditLogger:
        def log_event(self, event_type: str, payload: dict[str, object]) -> None:
            del event_type
            del payload
            raise AuditLogError("sqlite unavailable")

    audit_path = make_audit_path()
    settings = Settings(
        default_order_usd=Decimal("50.00"),
        max_order_usd=Decimal("500.00"),
        allowed_symbols=["AAPL"],
        audit_log_path=audit_path,
        state_db_path=make_state_path(),
    )
    service = TradingService(
        broker=DryRunBroker(),
        settings=settings,
        audit_logger=FallbackAuditLogger(
            primary=FailingAuditLogger(),
            fallback=JsonLineAuditLogger(audit_path),
        ),
    )

    result = service.execute_buy(
        BuyRequest(symbol="AAPL"),
        idempotency_key="buy-aapl-004",
        principal="dev-trade-key",
    )

    assert result.status == "dry_run"
    lines = audit_path.read_text(encoding="utf-8").splitlines()
    assert len(lines) == 1
    entry = json.loads(lines[0])
    assert entry["idempotency_key"] == "buy-aapl-004"
