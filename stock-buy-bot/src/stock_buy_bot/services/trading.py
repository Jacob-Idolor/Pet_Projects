import structlog

from stock_buy_bot.brokers.base import BrokerClient
from stock_buy_bot.config import Settings
from stock_buy_bot.models import BuyRequest, OrderResult


class TradingService:
    def __init__(self, broker: BrokerClient, settings: Settings):
        self._broker = broker
        self._settings = settings
        self._logger = structlog.get_logger(__name__)

    def execute_buy(self, req: BuyRequest) -> OrderResult:
        symbol = req.symbol.upper().strip()
        usd_amount = req.usd_amount or self._settings.default_order_usd

        self._validate_symbol(symbol)
        self._validate_amount(usd_amount)

        result = self._broker.buy_market_order(symbol=symbol, usd_amount=usd_amount)
        self._logger.info(
            "buy_order_executed",
            symbol=result.symbol,
            usd_amount=result.usd_amount,
            status=result.status,
            order_id=result.order_id,
        )
        return result

    def _validate_symbol(self, symbol: str) -> None:
        if symbol not in self._settings.allowed_symbols:
            raise ValueError(f"Symbol {symbol} is not allowed")

    def _validate_amount(self, usd_amount: float) -> None:
        if usd_amount > self._settings.max_order_usd:
            raise ValueError(
                f"Order amount ${usd_amount:.2f} exceeds max allowed ${self._settings.max_order_usd:.2f}"
            )
