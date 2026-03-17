from decimal import Decimal
import uuid

from tenacity import retry, stop_after_attempt, wait_fixed

from stock_buy_bot.models import OrderResult


class AlpacaBroker:
    def __init__(self, api_key: str, api_secret: str, paper: bool = True):
        try:
            from alpaca.trading.client import TradingClient
        except ImportError as exc:
            raise RuntimeError(
                "alpaca-py is required for live broker usage. Install project dependencies first."
            ) from exc

        self._client = TradingClient(
            api_key=api_key,
            secret_key=api_secret,
            paper=paper,
        )

    @retry(stop=stop_after_attempt(3), wait=wait_fixed(1))
    def buy_market_order(
        self,
        symbol: str,
        usd_amount: Decimal,
        client_order_id: str,
    ) -> OrderResult:
        return self._submit_notional_order(
            symbol=symbol,
            usd_amount=usd_amount,
            client_order_id=client_order_id,
            side="buy",
        )

    @retry(stop=stop_after_attempt(3), wait=wait_fixed(1))
    def sell_market_order(
        self,
        symbol: str,
        usd_amount: Decimal,
        client_order_id: str,
    ) -> OrderResult:
        return self._submit_notional_order(
            symbol=symbol,
            usd_amount=usd_amount,
            client_order_id=client_order_id,
            side="sell",
        )

    def _submit_notional_order(
        self,
        symbol: str,
        usd_amount: Decimal,
        client_order_id: str,
        side: str,
    ) -> OrderResult:
        from alpaca.trading.enums import OrderSide, TimeInForce
        from alpaca.trading.requests import MarketOrderRequest

        existing = self._get_existing_order(client_order_id=client_order_id, side=side)
        if existing is not None:
            return existing

        side_value = OrderSide.BUY if side == "buy" else OrderSide.SELL
        order = MarketOrderRequest(
            symbol=symbol.upper(),
            notional=float(usd_amount),
            side=side_value,
            time_in_force=TimeInForce.DAY,
            client_order_id=client_order_id,
        )
        try:
            submitted = self._client.submit_order(order_data=order)
        except Exception:
            reconciled = self._get_existing_order(client_order_id=client_order_id, side=side)
            if reconciled is not None:
                return reconciled
            raise

        return OrderResult(
            side=side,
            symbol=symbol.upper(),
            usd_amount=usd_amount,
            status=str(submitted.status),
            order_id=str(submitted.id),
            client_order_id=client_order_id,
            message=f"{side.title()} order submitted to Alpaca",
        )

    def _get_existing_order(self, client_order_id: str, side: str) -> OrderResult | None:
        try:
            existing = self._client.get_order_by_client_order_id(client_order_id)
        except Exception:
            return None

        return OrderResult(
            side=side,
            symbol=str(existing.symbol).upper(),
            usd_amount=Decimal(str(existing.notional)),
            status=str(existing.status),
            order_id=str(existing.id),
            client_order_id=client_order_id,
            message="Order reconciled using existing client_order_id",
        )


class DryRunBroker:
    def buy_market_order(
        self,
        symbol: str,
        usd_amount: Decimal,
        client_order_id: str,
    ) -> OrderResult:
        return OrderResult(
            side="buy",
            symbol=symbol.upper(),
            usd_amount=usd_amount,
            status="dry_run",
            order_id=f"dry-{uuid.uuid4()}",
            client_order_id=client_order_id,
            message="Dry run mode; no live order submitted",
        )

    def sell_market_order(
        self,
        symbol: str,
        usd_amount: Decimal,
        client_order_id: str,
    ) -> OrderResult:
        return OrderResult(
            side="sell",
            symbol=symbol.upper(),
            usd_amount=usd_amount,
            status="dry_run",
            order_id=f"dry-{uuid.uuid4()}",
            client_order_id=client_order_id,
            message="Dry run mode; no live order submitted",
        )
