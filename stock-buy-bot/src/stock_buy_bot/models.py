from pydantic import BaseModel, Field


class BuyRequest(BaseModel):
    symbol: str = Field(min_length=1, max_length=8)
    usd_amount: float | None = Field(default=None, gt=0)


class OrderResult(BaseModel):
    symbol: str
    usd_amount: float
    status: str
    order_id: str
    message: str
