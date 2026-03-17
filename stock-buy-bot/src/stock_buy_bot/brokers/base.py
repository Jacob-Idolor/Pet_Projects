from typing import Protocol

from stock_buy_bot.models import OrderResult


class BrokerClient(Protocol):
    def buy_market_order(self, symbol: str, usd_amount: float) -> OrderResult:
        """Place a notional market buy order."""
