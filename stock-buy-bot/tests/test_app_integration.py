import json
from datetime import UTC, datetime
from decimal import Decimal
from pathlib import Path
import uuid

from fastapi.testclient import TestClient

from stock_buy_bot.brokers.alpaca import DryRunBroker
from stock_buy_bot.brokers.base import BrokerClient
from stock_buy_bot.config import Settings, get_settings
from stock_buy_bot.dashboard_models import BrokerPortfolioSnapshot, InvestmentPosition
from stock_buy_bot.dependencies import get_broker
from stock_buy_bot.main import create_app
from stock_buy_bot.security import build_trade_signature


class FakePortfolioBroker(DryRunBroker):
    def get_portfolio_snapshot(self) -> BrokerPortfolioSnapshot | None:
        return BrokerPortfolioSnapshot(
            portfolio_name="Broker Snapshot",
            base_currency="USD",
            positions=[
                InvestmentPosition(
                    symbol="AAPL",
                    name="Apple Inc.",
                    asset_type="stock",
                    quantity=Decimal("5"),
                    current_price=Decimal("210.00"),
                    cost_basis=Decimal("180.00"),
                ),
                InvestmentPosition(
                    symbol="BND",
                    name="Bond ETF",
                    asset_type="bond",
                    quantity=Decimal("10"),
                    current_price=Decimal("70.00"),
                    cost_basis=Decimal("68.00"),
                ),
            ],
            total_value=Decimal("1750.00"),
            cash_balance=Decimal("250.00"),
        )


def make_workspace_path(filename: str) -> Path:
    base_dir = Path("tests_artifacts")
    base_dir.mkdir(exist_ok=True)
    return base_dir / f"{uuid.uuid4()}-{filename}"


def build_settings(*, with_broker_credentials: bool = False) -> Settings:
    api_key = "paper-key" if with_broker_credentials else ""
    api_secret = "paper-secret" if with_broker_credentials else ""
    return Settings.model_validate(
        {
            "environment": "dev",
            "allowed_hosts": ["testserver"],
            "audit_log_path": make_workspace_path("audit.jsonl"),
            "state_db_path": make_workspace_path("state.db"),
            "portfolio_data_path": make_workspace_path("portfolio.json"),
            "TRADE_API_KEY": "dev-trade-key",
            "TRADE_SIGNING_SECRET": "dev-signing-secret-change-me",
            "allowed_symbols": ["AAPL", "BND"],
            "default_order_usd": Decimal("50.00"),
            "max_order_usd": Decimal("500.00"),
            "ALPACA_API_KEY": api_key,
            "ALPACA_API_SECRET": api_secret,
        }
    )


def build_client(
    settings: Settings,
    *,
    broker_override: BrokerClient | None = None,
) -> TestClient:
    app = create_app(settings)
    app.dependency_overrides[get_settings] = lambda: settings
    if broker_override is not None:
        app.dependency_overrides[get_broker] = lambda: broker_override
    return TestClient(app)


def build_signed_headers(settings: Settings, payload: dict[str, str], *, idempotency_key: str) -> dict[str, str]:
    body = json.dumps(payload, separators=(",", ":")).encode("utf-8")
    timestamp = datetime.now(UTC).isoformat().replace("+00:00", "Z")
    signature = build_trade_signature(
        secret=settings.trade_signing_secret.get_secret_value(),
        timestamp=timestamp,
        body=body,
    )
    return {
        "Content-Type": "application/json",
        "X-Trade-Key": settings.trade_api_key.get_secret_value(),
        "X-Trade-Timestamp": timestamp,
        "X-Trade-Signature": signature,
        "Idempotency-Key": idempotency_key,
    }


def test_trade_buy_endpoint_via_testclient() -> None:
    settings = build_settings()
    client = build_client(settings, broker_override=DryRunBroker())

    payload = {"symbol": "AAPL", "usd_amount": "75.00"}
    response = client.post(
        "/trade/buy",
        headers=build_signed_headers(settings, payload, idempotency_key="buy-aapl-900"),
        json=payload,
    )

    assert response.status_code == 201
    body = response.json()
    assert body["side"] == "buy"
    assert body["status"] == "dry_run"
    assert body["client_order_id"] == "buy-aapl-900"
    assert response.headers["x-content-type-options"] == "nosniff"


def test_dashboard_and_metrics_endpoints_via_testclient() -> None:
    settings = build_settings()
    client = build_client(settings, broker_override=DryRunBroker())

    dashboard_response = client.get("/api/dashboard/summary")
    metrics_response = client.get("/metrics")

    assert dashboard_response.status_code == 200
    dashboard_body = dashboard_response.json()
    assert dashboard_body["portfolio_source"] == "seed_file"
    assert dashboard_body["summary"]["position_count"] >= 1

    assert metrics_response.status_code == 200
    assert "stock_buy_bot_http_requests_total" in metrics_response.text


def test_dashboard_prefers_broker_snapshot_when_available() -> None:
    settings = build_settings(with_broker_credentials=True)
    client = build_client(settings, broker_override=FakePortfolioBroker())

    response = client.get("/api/dashboard/summary")

    assert response.status_code == 200
    body = response.json()
    assert body["portfolio_source"] == "broker"
    assert body["portfolio_name"] == "Broker Snapshot"
    assert body["positions"][0]["symbol"] == "AAPL"
