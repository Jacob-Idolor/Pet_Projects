from decimal import Decimal
import sys
import types

from stock_buy_bot.brokers.alpaca import AlpacaBroker


class FakeSubmittedOrder:
    def __init__(self, *, order_id: str, symbol: str, notional: str, status: str):
        self.id = order_id
        self.symbol = symbol
        self.notional = notional
        self.status = status


class FakeTradingClient:
    raise_on_submit = False
    existing_order = None
    last_order_data = None

    def __init__(self, *, api_key: str, secret_key: str, paper: bool):
        self.api_key = api_key
        self.secret_key = secret_key
        self.paper = paper

    def submit_order(self, order_data):
        self.__class__.last_order_data = order_data
        if self.__class__.raise_on_submit:
            raise RuntimeError("submit failed after broker accepted request")
        return FakeSubmittedOrder(
            order_id="broker-123",
            symbol=order_data.symbol,
            notional=str(order_data.notional),
            status="accepted",
        )

    def get_order_by_client_order_id(self, client_order_id: str):
        del client_order_id
        if self.__class__.existing_order is None:
            raise RuntimeError("not found")
        return self.__class__.existing_order


class FakeMarketOrderRequest:
    def __init__(self, **kwargs):
        self.symbol = kwargs["symbol"]
        self.notional = kwargs["notional"]
        self.side = kwargs["side"]
        self.time_in_force = kwargs["time_in_force"]
        self.client_order_id = kwargs["client_order_id"]


def install_fake_alpaca_modules() -> None:
    alpaca_module = types.ModuleType("alpaca")
    trading_module = types.ModuleType("alpaca.trading")
    client_module = types.ModuleType("alpaca.trading.client")
    requests_module = types.ModuleType("alpaca.trading.requests")
    enums_module = types.ModuleType("alpaca.trading.enums")

    client_module.TradingClient = FakeTradingClient
    requests_module.MarketOrderRequest = FakeMarketOrderRequest
    enums_module.OrderSide = types.SimpleNamespace(BUY="buy", SELL="sell")
    enums_module.TimeInForce = types.SimpleNamespace(DAY="day")

    sys.modules["alpaca"] = alpaca_module
    sys.modules["alpaca.trading"] = trading_module
    sys.modules["alpaca.trading.client"] = client_module
    sys.modules["alpaca.trading.requests"] = requests_module
    sys.modules["alpaca.trading.enums"] = enums_module


def test_alpaca_broker_submits_client_order_id(monkeypatch) -> None:
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

    assert result.client_order_id == "buy-aapl-001"
    assert FakeTradingClient.last_order_data.client_order_id == "buy-aapl-001"
    assert FakeTradingClient.last_order_data.notional == 10.5
    monkeypatch.undo()


def test_alpaca_broker_reconciles_existing_order_after_submit_error(monkeypatch) -> None:
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
