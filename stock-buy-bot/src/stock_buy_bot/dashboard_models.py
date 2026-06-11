from decimal import Decimal
from typing import Literal

from pydantic import BaseModel, Field


AssetType = Literal["stock", "bond", "mutual_fund"]


class InvestmentPosition(BaseModel):
    symbol: str = Field(min_length=1, max_length=12)
    name: str = Field(min_length=1, max_length=120)
    asset_type: AssetType
    quantity: Decimal = Field(gt=0, max_digits=18, decimal_places=4)
    current_price: Decimal = Field(gt=0, max_digits=18, decimal_places=4)
    cost_basis: Decimal = Field(gt=0, max_digits=18, decimal_places=4)


class PortfolioHistoryPoint(BaseModel):
    date: str = Field(min_length=8, max_length=32)
    total_value: Decimal = Field(gt=0, max_digits=18, decimal_places=2)


class PortfolioData(BaseModel):
    portfolio_name: str = Field(min_length=1, max_length=120)
    base_currency: str = Field(default="USD", min_length=3, max_length=3)
    positions: list[InvestmentPosition]
    history: list[PortfolioHistoryPoint]


class BrokerPortfolioSnapshot(BaseModel):
    portfolio_name: str = Field(min_length=1, max_length=120)
    base_currency: str = Field(default="USD", min_length=3, max_length=3)
    positions: list[InvestmentPosition]
    total_value: Decimal | None = None
    cash_balance: Decimal | None = None


class PortfolioSummary(BaseModel):
    total_value: float
    total_cost: float
    total_gain: float
    total_gain_pct: float
    position_count: int


class PositionSummary(BaseModel):
    symbol: str
    name: str
    asset_type: AssetType
    asset_type_label: str
    quantity: float
    current_price: float
    cost_basis: float
    current_value: float
    cost_value: float
    gain_value: float
    gain_pct: float


class AllocationPoint(BaseModel):
    label: str
    value: float
    share_pct: float


class AllocationSummary(BaseModel):
    by_type: list[AllocationPoint]
    by_asset: list[AllocationPoint]


class GrowthPoint(BaseModel):
    date: str
    value: float


class BotActionSummary(BaseModel):
    event_type: str
    symbol: str
    side: str
    status: str
    idempotency_key: str
    timestamp: str


class BotActivityCounts(BaseModel):
    executed: int
    failed: int


class BotActivitySummary(BaseModel):
    recent_actions: list[BotActionSummary]
    counts: BotActivityCounts


class DashboardSummary(BaseModel):
    portfolio_name: str
    base_currency: str
    portfolio_source: Literal["seed_file", "broker"]
    summary: PortfolioSummary
    positions: list[PositionSummary]
    allocation: AllocationSummary
    growth_history: list[GrowthPoint]
    bot_activity: BotActivitySummary
