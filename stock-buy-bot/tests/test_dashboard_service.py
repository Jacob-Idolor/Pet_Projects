import json
from pathlib import Path
import uuid

from stock_buy_bot.config import Settings
from stock_buy_bot.services.dashboard import DashboardService


def make_workspace_path(filename: str) -> Path:
    base_dir = Path("tests_artifacts")
    base_dir.mkdir(exist_ok=True)
    return base_dir / f"{uuid.uuid4()}-{filename}"


def test_dashboard_summary_includes_portfolio_and_bot_actions() -> None:
    portfolio_path = make_workspace_path("portfolio.json")
    audit_path = make_workspace_path("audit.jsonl")

    portfolio_path.write_text(
        json.dumps(
            {
                "portfolio_name": "Integration Portfolio",
                "base_currency": "USD",
                "positions": [
                    {
                        "symbol": "AAPL",
                        "name": "Apple Inc.",
                        "asset_type": "stock",
                        "quantity": "10",
                        "current_price": "200.00",
                        "cost_basis": "180.00",
                    },
                    {
                        "symbol": "BND",
                        "name": "Bond ETF",
                        "asset_type": "bond",
                        "quantity": "20",
                        "current_price": "75.00",
                        "cost_basis": "70.00",
                    },
                    {
                        "symbol": "VTSAX",
                        "name": "Index Fund",
                        "asset_type": "mutual_fund",
                        "quantity": "5",
                        "current_price": "120.00",
                        "cost_basis": "100.00",
                    },
                ],
                "history": [
                    {"date": "2026-03-01", "total_value": "3800.00"},
                    {"date": "2026-03-15", "total_value": "4050.00"},
                ],
            }
        ),
        encoding="utf-8",
    )
    audit_path.write_text(
        "\n".join(
            [
                json.dumps(
                    {
                        "event_type": "trade_executed",
                        "symbol": "AAPL",
                        "side": "buy",
                        "status": "dry_run",
                        "idempotency_key": "buy-aapl-001",
                        "timestamp": "2026-03-17T17:00:00Z",
                    }
                ),
                json.dumps(
                    {
                        "event_type": "trade_failed",
                        "symbol": "BND",
                        "side": "sell",
                        "error": "Insufficient position",
                        "idempotency_key": "sell-bnd-001",
                        "timestamp": "2026-03-17T18:00:00Z",
                    }
                ),
            ]
        )
        + "\n",
        encoding="utf-8",
    )

    settings = Settings(
        portfolio_data_path=portfolio_path,
        audit_log_path=audit_path,
    )
    service = DashboardService(settings=settings)

    summary = service.build_dashboard_summary()

    assert summary["portfolio_name"] == "Integration Portfolio"
    assert summary["summary"]["position_count"] == 3
    assert summary["summary"]["total_value"] == 4100.0
    assert len(summary["allocation"]["by_type"]) == 3
    assert summary["bot_activity"]["counts"]["executed"] == 1
    assert summary["bot_activity"]["counts"]["failed"] == 1
    assert summary["bot_activity"]["recent_actions"][0]["symbol"] == "BND"
