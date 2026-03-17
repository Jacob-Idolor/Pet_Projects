import uuid

from alpaca.trading.client import TradingClient
from alpaca.trading.requests import MarketOrderRequest
from alpaca.trading.enums import OrderSide, TimeInForce
from tenacity import retry, stop_after_attempt, wait_fixed

from stock_buy_bot.models import OrderResult


class AlpacaBroker:
    def __init__(self, api_key: str, api_secret: str, paper: bool = True):
        self._client = TradingClient(api_key=api_key, secret_key=api_secret, paper=paper)

    @retry(stop=stop_after_attempt(3), wait=wait_fixed(1))
    def buy_market_order(self, symbol: str, usd_amount: float) -> OrderResult:
        order = MarketOrderRequest(
            symbol=symbol.upper(),
            notional=round(usd_amount, 2),
            side=OrderSide.BUY,
            time_in_force=TimeInForce.DAY,
        )
        submitted = self._client.submit_order(order_data=order)
        return OrderResult(
            symbol=symbol.upper(),
            usd_amount=usd_amount,
            status=str(submitted.status),
            order_id=str(submitted.id),
            message="Order submitted to Alpaca",
        )


class DryRunBroker:
    def buy_market_order(self, symbol: str, usd_amount: float) -> OrderResult:
        return OrderResult(
            symbol=symbol.upper(),
            usd_amount=usd_amount,
            status="dry_run",
            order_id=f"dry-{uuid.uuid4()}",
            message="Dry run mode; no live order submitted",
        )
