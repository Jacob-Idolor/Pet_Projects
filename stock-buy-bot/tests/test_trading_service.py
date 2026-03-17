import pytest

from stock_buy_bot.brokers.alpaca import DryRunBroker
from stock_buy_bot.config import Settings
from stock_buy_bot.models import BuyRequest
from stock_buy_bot.services.trading import TradingService


def test_execute_buy_dry_run() -> None:
    settings = Settings(
        default_order_usd=50,
        max_order_usd=500,
        allowed_symbols=["AAPL"],
    )
    service = TradingService(broker=DryRunBroker(), settings=settings)

    result = service.execute_buy(BuyRequest(symbol="AAPL"))

    assert result.symbol == "AAPL"
    assert result.usd_amount == 50
    assert result.status == "dry_run"


def test_rejects_disallowed_symbol() -> None:
    settings = Settings(allowed_symbols=["AAPL"])
    service = TradingService(broker=DryRunBroker(), settings=settings)

    with pytest.raises(ValueError, match="not allowed"):
        service.execute_buy(BuyRequest(symbol="TSLA", usd_amount=10))


def test_rejects_oversized_order() -> None:
    settings = Settings(max_order_usd=100, allowed_symbols=["AAPL"])
    service = TradingService(broker=DryRunBroker(), settings=settings)

    with pytest.raises(ValueError, match="exceeds"):
        service.execute_buy(BuyRequest(symbol="AAPL", usd_amount=500))
