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
