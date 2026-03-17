from decimal import Decimal
import sys
import types

import pytest

from stock_buy_bot.brokers.alpaca import AlpacaBroker


class FakeSubmittedOrder:
    def __init__(self, *, order_id: str, symbol: str, notional: str, status: str) -> None:
        self.id = order_id
        self.symbol = symbol
        self.notional = notional
        self.status = status


class FakeTradingClient:
    raise_on_submit: bool = False
    existing_order: FakeSubmittedOrder | None = None
    last_order_data: "FakeMarketOrderRequest | None" = None

    def __init__(self, *, api_key: str, secret_key: str, paper: bool) -> None:
        self.api_key = api_key
        self.secret_key = secret_key
        self.paper = paper

    def submit_order(self, order_data: "FakeMarketOrderRequest") -> FakeSubmittedOrder:
        self.__class__.last_order_data = order_data
        if self.__class__.raise_on_submit:
            raise RuntimeError("submit failed after broker accepted request")
        return FakeSubmittedOrder(
            order_id="broker-123",
            symbol=order_data.symbol,
            notional=str(order_data.notional),
            status="accepted",
        )

    def get_order_by_client_order_id(self, client_order_id: str) -> FakeSubmittedOrder:
        del client_order_id
        if self.__class__.existing_order is None:
            raise RuntimeError("not found")
        return self.__class__.existing_order


class FakeMarketOrderRequest:
    def __init__(
        self,
        *,
        symbol: str,
        notional: float,
        side: str,
        time_in_force: str,
        client_order_id: str,
    ) -> None:
        self.symbol = symbol
        self.notional = notional
        self.side = side
        self.time_in_force = time_in_force
        self.client_order_id = client_order_id


def install_fake_alpaca_modules() -> None:
    alpaca_module = types.ModuleType("alpaca")
    trading_module = types.ModuleType("alpaca.trading")
    client_module = types.ModuleType("alpaca.trading.client")
    requests_module = types.ModuleType("alpaca.trading.requests")
    enums_module = types.ModuleType("alpaca.trading.enums")

    setattr(client_module, "TradingClient", FakeTradingClient)
    setattr(requests_module, "MarketOrderRequest", FakeMarketOrderRequest)
    setattr(enums_module, "OrderSide", types.SimpleNamespace(BUY="buy", SELL="sell"))
    setattr(enums_module, "TimeInForce", types.SimpleNamespace(DAY="day"))

    sys.modules["alpaca"] = alpaca_module
    sys.modules["alpaca.trading"] = trading_module
    sys.modules["alpaca.trading.client"] = client_module
    sys.modules["alpaca.trading.requests"] = requests_module
    sys.modules["alpaca.trading.enums"] = enums_module


def test_alpaca_broker_submits_client_order_id(monkeypatch: pytest.MonkeyPatch) -> None:
    install_fake_alpaca_modules()
    FakeTradingClient.raise_on_submit = False
    FakeTradingClient.existing_order = None
    FakeTradingClient.last_order_data = None

    broker = AlpacaBroker(api_key="key", api_secret="secret", paper=True)
    result = broker.buy_market_order(
        symbol="AAPL",
        usd_amount=Decimal("10.50"),
        client_order_id="buy-aapl-001",
    )

    assert FakeTradingClient.last_order_data is not None
    assert result.client_order_id == "buy-aapl-001"
    assert FakeTradingClient.last_order_data.client_order_id == "buy-aapl-001"
    assert FakeTradingClient.last_order_data.notional == 10.5
    monkeypatch.undo()


def test_alpaca_broker_reconciles_existing_order_after_submit_error(
    monkeypatch: pytest.MonkeyPatch,
) -> None:
    install_fake_alpaca_modules()
    FakeTradingClient.raise_on_submit = True
    FakeTradingClient.existing_order = FakeSubmittedOrder(
        order_id="broker-999",
        symbol="AAPL",
        notional="10.50",
        status="accepted",
    )

    broker = AlpacaBroker(api_key="key", api_secret="secret", paper=True)
    result = broker.buy_market_order(
        symbol="AAPL",
        usd_amount=Decimal("10.50"),
        client_order_id="buy-aapl-002",
    )

    assert result.order_id == "broker-999"
    assert result.client_order_id == "buy-aapl-002"
    assert "reconciled" in result.message.lower()
    monkeypatch.undo()
