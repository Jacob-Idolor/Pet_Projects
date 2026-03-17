import json
from collections import Counter, deque
from decimal import Decimal
from typing import Any

from stock_buy_bot.config import Settings
from stock_buy_bot.dashboard_models import (
    AssetType,
    InvestmentPosition,
    PortfolioData,
    PortfolioHistoryPoint,
)


DEFAULT_PORTFOLIO_DATA = {
    "portfolio_name": "Bot-Aware Investment Dashboard",
    "base_currency": "USD",
    "positions": [
        {
            "symbol": "AAPL",
            "name": "Apple Inc.",
            "asset_type": "stock",
            "quantity": "14",
            "current_price": "214.35",
            "cost_basis": "186.15",
        },
        {
            "symbol": "BND",
            "name": "Vanguard Total Bond Market ETF",
            "asset_type": "bond",
            "quantity": "30",
            "current_price": "72.48",
            "cost_basis": "70.92",
        },
        {
            "symbol": "VTSAX",
            "name": "Vanguard Total Stock Market Index Fund",
            "asset_type": "mutual_fund",
            "quantity": "18",
            "current_price": "128.64",
            "cost_basis": "116.10",
        },
    ],
    "history": [
        {"date": "2026-01-01", "total_value": "6420.00"},
        {"date": "2026-01-15", "total_value": "6610.00"},
        {"date": "2026-02-01", "total_value": "6725.00"},
        {"date": "2026-02-15", "total_value": "6890.00"},
        {"date": "2026-03-01", "total_value": "7045.00"},
        {"date": "2026-03-15", "total_value": "7240.00"},
    ],
}


def _decimal_to_float(value: Decimal) -> float:
    return float(value.quantize(Decimal("0.01")))


def _asset_type_label(asset_type: AssetType) -> str:
    return asset_type.replace("_", " ").title()


class DashboardService:
    def __init__(self, settings: Settings):
        self._settings = settings
        self._portfolio_path = settings.portfolio_data_path
        self._audit_path = settings.audit_log_path

    def ensure_seed_data(self) -> None:
        if self._portfolio_path.exists():
            return

        self._portfolio_path.parent.mkdir(parents=True, exist_ok=True)
        self._portfolio_path.write_text(
            json.dumps(DEFAULT_PORTFOLIO_DATA, indent=2),
            encoding="utf-8",
        )

    def build_dashboard_summary(self) -> dict[str, Any]:
        portfolio = self._load_portfolio()
        positions = [self._build_position_summary(position) for position in portfolio.positions]

        total_value = sum(
            (Decimal(position["current_value"]) for position in positions),
            start=Decimal("0.00"),
        )
        total_cost = sum(
            (Decimal(position["cost_value"]) for position in positions),
            start=Decimal("0.00"),
        )
        total_gain = total_value - total_cost
        total_gain_pct = (
            (total_gain / total_cost) * Decimal("100") if total_cost else Decimal("0.00")
        )

        allocation = self._build_allocation(positions=positions, total_value=total_value)
        growth_history = self._build_growth_history(portfolio.history, total_value=total_value)
        recent_actions = self._load_recent_bot_actions(limit=8)
        action_counts = Counter(action["event_type"] for action in recent_actions)

        return {
            "portfolio_name": portfolio.portfolio_name,
            "base_currency": portfolio.base_currency,
            "summary": {
                "total_value": _decimal_to_float(total_value),
                "total_cost": _decimal_to_float(total_cost),
                "total_gain": _decimal_to_float(total_gain),
                "total_gain_pct": _decimal_to_float(total_gain_pct),
                "position_count": len(positions),
            },
            "positions": positions,
            "allocation": allocation,
            "growth_history": growth_history,
            "bot_activity": {
                "recent_actions": recent_actions,
                "counts": {
                    "executed": action_counts.get("trade_executed", 0),
                    "failed": action_counts.get("trade_failed", 0),
                },
            },
        }

    def _load_portfolio(self) -> PortfolioData:
        self.ensure_seed_data()
        raw_data = json.loads(self._portfolio_path.read_text(encoding="utf-8"))
        return PortfolioData.model_validate(raw_data)

    def _build_position_summary(self, position: InvestmentPosition) -> dict[str, Any]:
        current_value = position.quantity * position.current_price
        cost_value = position.quantity * position.cost_basis
        gain_value = current_value - cost_value
        gain_pct = (gain_value / cost_value) * Decimal("100") if cost_value else Decimal("0.00")

        return {
            "symbol": position.symbol,
            "name": position.name,
            "asset_type": position.asset_type,
            "asset_type_label": _asset_type_label(position.asset_type),
            "quantity": _decimal_to_float(position.quantity),
            "current_price": _decimal_to_float(position.current_price),
            "cost_basis": _decimal_to_float(position.cost_basis),
            "current_value": f"{current_value:.2f}",
            "cost_value": f"{cost_value:.2f}",
            "gain_value": _decimal_to_float(gain_value),
            "gain_pct": _decimal_to_float(gain_pct),
        }

    def _build_allocation(
        self,
        *,
        positions: list[dict[str, Any]],
        total_value: Decimal,
    ) -> dict[str, list[dict[str, Any]]]:
        by_type: dict[str, Decimal] = {}
        by_asset: list[dict[str, Any]] = []

        for position in positions:
            current_value = Decimal(position["current_value"])
            asset_type_label = position["asset_type_label"]
            by_type[asset_type_label] = (
                by_type.get(asset_type_label, Decimal("0.00")) + current_value
            )
            by_asset.append(
                {
                    "label": position["symbol"],
                    "value": _decimal_to_float(current_value),
                    "share_pct": _decimal_to_float(
                        (current_value / total_value) * Decimal("100")
                        if total_value
                        else Decimal("0.00")
                    ),
                }
            )

        by_type_payload = [
            {
                "label": label,
                "value": _decimal_to_float(value),
                "share_pct": _decimal_to_float(
                    (value / total_value) * Decimal("100") if total_value else Decimal("0.00")
                ),
            }
            for label, value in sorted(by_type.items())
        ]

        by_asset.sort(key=lambda item: item["value"], reverse=True)
        return {"by_type": by_type_payload, "by_asset": by_asset}

    def _build_growth_history(
        self,
        history: list[PortfolioHistoryPoint],
        *,
        total_value: Decimal,
    ) -> list[dict[str, Any]]:
        points = [
            {"date": point.date, "value": _decimal_to_float(point.total_value)} for point in history
        ]
        if not points or points[-1]["value"] != _decimal_to_float(total_value):
            points.append({"date": "Current", "value": _decimal_to_float(total_value)})
        return points

    def _load_recent_bot_actions(self, *, limit: int) -> list[dict[str, Any]]:
        if not self._audit_path.exists():
            return []

        with self._audit_path.open("r", encoding="utf-8") as handle:
            recent_lines = deque(handle, maxlen=limit)

        actions: list[dict[str, Any]] = []
        for raw_line in reversed(recent_lines):
            payload = json.loads(raw_line)
            actions.append(
                {
                    "event_type": payload.get("event_type", "unknown"),
                    "symbol": payload.get("symbol", "-"),
                    "side": payload.get("side", "-"),
                    "status": payload.get("status", payload.get("error", "pending")),
                    "idempotency_key": payload.get("idempotency_key", "-"),
                    "timestamp": payload.get("timestamp", "-"),
                }
            )
        return actions
