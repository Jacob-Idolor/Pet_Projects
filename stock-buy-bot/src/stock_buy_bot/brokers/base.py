from decimal import Decimal
from typing import Protocol

from stock_buy_bot.dashboard_models import BrokerPortfolioSnapshot
from stock_buy_bot.models import OrderResult


class BrokerClient(Protocol):
    def buy_market_order(
        self,
        symbol: str,
        usd_amount: Decimal,
        client_order_id: str,
    ) -> OrderResult:
        """Place a notional market buy order."""

    def sell_market_order(
        self,
        symbol: str,
        usd_amount: Decimal,
        client_order_id: str,
    ) -> OrderResult:
        """Place a notional market sell order."""

    def get_portfolio_snapshot(self) -> BrokerPortfolioSnapshot | None:
        """Return current portfolio data when supported."""
