from decimal import Decimal
from typing import Literal

from pydantic import BaseModel, Field


class TradeRequest(BaseModel):
    symbol: str = Field(min_length=1, max_length=8)
    usd_amount: Decimal | None = Field(default=None, gt=0, max_digits=12, decimal_places=2)


class BuyRequest(TradeRequest):
    pass


class SellRequest(TradeRequest):
    pass


class OrderResult(BaseModel):
    side: Literal["buy", "sell"]
    symbol: str
    usd_amount: Decimal
    status: str
    order_id: str
    client_order_id: str
    message: str
