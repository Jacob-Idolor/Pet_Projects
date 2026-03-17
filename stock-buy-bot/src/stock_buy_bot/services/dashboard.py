import json
from collections import Counter, deque
from decimal import Decimal

from stock_buy_bot.config import Settings
from stock_buy_bot.dashboard_models import (
    AssetType,
    AllocationPoint,
    AllocationSummary,
    BotActionSummary,
    BotActivityCounts,
    BotActivitySummary,
    DashboardSummary,
    GrowthPoint,
    InvestmentPosition,
    PortfolioData,
    PortfolioHistoryPoint,
    PortfolioSummary,
    PositionSummary,
)
from stock_buy_bot.exceptions import StateStoreError
from stock_buy_bot.state import SQLiteStateStore


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
        self._state_store = SQLiteStateStore(settings.state_db_path)

    def ensure_seed_data(self) -> None:
        if self._portfolio_path.exists():
            return

        self._portfolio_path.parent.mkdir(parents=True, exist_ok=True)
        self._portfolio_path.write_text(
            json.dumps(DEFAULT_PORTFOLIO_DATA, indent=2),
            encoding="utf-8",
        )

    def build_dashboard_summary(self) -> DashboardSummary:
        portfolio = self._load_portfolio()
        positions = [self._build_position_summary(position) for position in portfolio.positions]

        total_value = sum(
            (Decimal(f"{position.current_value:.2f}") for position in positions),
            start=Decimal("0.00"),
        )
        total_cost = sum(
            (Decimal(f"{position.cost_value:.2f}") for position in positions),
            start=Decimal("0.00"),
        )
        total_gain = total_value - total_cost
        total_gain_pct = (
            (total_gain / total_cost) * Decimal("100") if total_cost else Decimal("0.00")
        )

        allocation = self._build_allocation(positions=positions, total_value=total_value)
        growth_history = self._build_growth_history(portfolio.history, total_value=total_value)
        recent_actions = self._load_recent_bot_actions(limit=8)
        action_counts = Counter(action.event_type for action in recent_actions)

        return DashboardSummary(
            portfolio_name=portfolio.portfolio_name,
            base_currency=portfolio.base_currency,
            summary=PortfolioSummary(
                total_value=_decimal_to_float(total_value),
                total_cost=_decimal_to_float(total_cost),
                total_gain=_decimal_to_float(total_gain),
                total_gain_pct=_decimal_to_float(total_gain_pct),
                position_count=len(positions),
            ),
            positions=positions,
            allocation=allocation,
            growth_history=growth_history,
            bot_activity=BotActivitySummary(
                recent_actions=recent_actions,
                counts=BotActivityCounts(
                    executed=action_counts.get("trade_executed", 0),
                    failed=action_counts.get("trade_failed", 0),
                ),
            ),
        )

    def _load_portfolio(self) -> PortfolioData:
        self.ensure_seed_data()
        raw_data = json.loads(self._portfolio_path.read_text(encoding="utf-8"))
        return PortfolioData.model_validate(raw_data)

    def _build_position_summary(self, position: InvestmentPosition) -> PositionSummary:
        current_value = position.quantity * position.current_price
        cost_value = position.quantity * position.cost_basis
        gain_value = current_value - cost_value
        gain_pct = (gain_value / cost_value) * Decimal("100") if cost_value else Decimal("0.00")

        return PositionSummary(
            symbol=position.symbol,
            name=position.name,
            asset_type=position.asset_type,
            asset_type_label=_asset_type_label(position.asset_type),
            quantity=_decimal_to_float(position.quantity),
            current_price=_decimal_to_float(position.current_price),
            cost_basis=_decimal_to_float(position.cost_basis),
            current_value=_decimal_to_float(current_value),
            cost_value=_decimal_to_float(cost_value),
            gain_value=_decimal_to_float(gain_value),
            gain_pct=_decimal_to_float(gain_pct),
        )

    def _build_allocation(
        self,
        *,
        positions: list[PositionSummary],
        total_value: Decimal,
    ) -> AllocationSummary:
        by_type: dict[str, Decimal] = {}
        by_asset: list[AllocationPoint] = []

        for position in positions:
            current_value = Decimal(f"{position.current_value:.2f}")
            asset_type_label = position.asset_type_label
            by_type[asset_type_label] = (
                by_type.get(asset_type_label, Decimal("0.00")) + current_value
            )
            by_asset.append(
                AllocationPoint(
                    label=position.symbol,
                    value=_decimal_to_float(current_value),
                    share_pct=_decimal_to_float(
                        (current_value / total_value) * Decimal("100")
                        if total_value
                        else Decimal("0.00")
                    ),
                )
            )

        by_type_payload = [
            AllocationPoint(
                label=label,
                value=_decimal_to_float(value),
                share_pct=_decimal_to_float(
                    (value / total_value) * Decimal("100") if total_value else Decimal("0.00")
                ),
            )
            for label, value in sorted(by_type.items())
        ]

        by_asset.sort(key=lambda item: item.value, reverse=True)
        return AllocationSummary(by_type=by_type_payload, by_asset=by_asset)

    def _build_growth_history(
        self,
        history: list[PortfolioHistoryPoint],
        *,
        total_value: Decimal,
    ) -> list[GrowthPoint]:
        points = [
            GrowthPoint(date=point.date, value=_decimal_to_float(point.total_value))
            for point in history
        ]
        if not points or points[-1].value != _decimal_to_float(total_value):
            points.append(GrowthPoint(date="Current", value=_decimal_to_float(total_value)))
        return points

    def _load_recent_bot_actions(self, *, limit: int) -> list[BotActionSummary]:
        try:
            self._state_store.initialize()
            records = self._state_store.list_recent_audit_events(limit=limit)
            if records:
                return [self._build_bot_action(record.event_type, record.payload, record.timestamp) for record in records]
        except StateStoreError:
            pass

        if not self._audit_path.exists():
            return []

        with self._audit_path.open("r", encoding="utf-8") as handle:
            recent_lines = deque(handle, maxlen=limit)

        actions: list[BotActionSummary] = []
        for raw_line in reversed(recent_lines):
            try:
                payload = json.loads(raw_line)
            except json.JSONDecodeError:
                continue
            if not isinstance(payload, dict):
                continue
            actions.append(
                self._build_bot_action(
                    str(payload.get("event_type", "unknown")),
                    payload,
                    str(payload.get("timestamp", "-")),
                )
            )
        return actions

    def _build_bot_action(
        self,
        event_type: str,
        payload: dict[str, object],
        timestamp: str,
    ) -> BotActionSummary:
        status_value = payload.get("status", payload.get("error", "pending"))
        return BotActionSummary(
            event_type=event_type,
            symbol=str(payload.get("symbol", "-")),
            side=str(payload.get("side", "-")),
            status=str(status_value),
            idempotency_key=str(payload.get("idempotency_key", "-")),
            timestamp=timestamp,
        )
