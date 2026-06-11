from decimal import Decimal
from typing import Literal

from stock_buy_bot.audit import AuditLogger, NullAuditLogger
from stock_buy_bot.brokers.base import BrokerClient
from stock_buy_bot.config import Settings
from stock_buy_bot.exceptions import AuditLogError, BrokerExecutionError, BrokerLookupError
from stock_buy_bot.logging import BoundLogger, get_logger
from stock_buy_bot.metrics import record_trade_result
from stock_buy_bot.models import BuyRequest, OrderResult, SellRequest


class TradingService:
    def __init__(
        self,
        broker: BrokerClient,
        settings: Settings,
        audit_logger: AuditLogger | None = None,
    ):
        self._broker = broker
        self._settings = settings
        self._audit_logger = audit_logger or NullAuditLogger()
        self._logger: BoundLogger = get_logger(__name__)

    def execute_buy(
        self,
        req: BuyRequest,
        *,
        idempotency_key: str,
        principal: str,
    ) -> OrderResult:
        return self._execute_trade(
            symbol=req.symbol,
            usd_amount=req.usd_amount,
            side="buy",
            idempotency_key=idempotency_key,
            principal=principal,
        )

    def execute_sell(
        self,
        req: SellRequest,
        *,
        idempotency_key: str,
        principal: str,
    ) -> OrderResult:
        return self._execute_trade(
            symbol=req.symbol,
            usd_amount=req.usd_amount,
            side="sell",
            idempotency_key=idempotency_key,
            principal=principal,
        )

    def _execute_trade(
        self,
        symbol: str,
        usd_amount: Decimal | None,
        side: Literal["buy", "sell"],
        idempotency_key: str,
        principal: str,
    ) -> OrderResult:
        symbol = symbol.upper().strip()
        usd_amount = usd_amount or self._settings.default_order_usd

        self._validate_symbol(symbol)
        self._validate_amount(usd_amount)

        audit_context = {
            "environment": self._settings.environment,
            "idempotency_key": idempotency_key,
            "principal": principal,
            "side": side,
            "symbol": symbol,
            "usd_amount": str(usd_amount),
        }

        try:
            result = self._submit_order(
                side=side,
                symbol=symbol,
                usd_amount=usd_amount,
                client_order_id=idempotency_key,
            )
        except (BrokerExecutionError, BrokerLookupError) as exc:
            record_trade_result(side=side, result="failed")
            self._safe_log_event(
                "trade_failed",
                {
                    **audit_context,
                    "error": str(exc),
                },
            )
            raise

        self._logger.info(
            "trade_order_executed",
            client_order_id=result.client_order_id,
            side=result.side,
            symbol=result.symbol,
            usd_amount=result.usd_amount,
            status=result.status,
            order_id=result.order_id,
        )
        self._safe_log_event(
            "trade_executed",
            {
                **audit_context,
                "broker_order_id": result.order_id,
                "client_order_id": result.client_order_id,
                "status": result.status,
            },
        )
        record_trade_result(side=side, result=result.status)
        return result

    def _submit_order(
        self,
        *,
        side: Literal["buy", "sell"],
        symbol: str,
        usd_amount: Decimal,
        client_order_id: str,
    ) -> OrderResult:
        if side == "buy":
            return self._broker.buy_market_order(
                symbol=symbol,
                usd_amount=usd_amount,
                client_order_id=client_order_id,
            )
        return self._broker.sell_market_order(
            symbol=symbol,
            usd_amount=usd_amount,
            client_order_id=client_order_id,
        )

    def _validate_symbol(self, symbol: str) -> None:
        if symbol not in self._settings.allowed_symbols:
            raise ValueError(f"Symbol {symbol} is not allowed")

    def _validate_amount(self, usd_amount: Decimal) -> None:
        if usd_amount > self._settings.max_order_usd:
            raise ValueError(
                f"Order amount ${usd_amount:.2f} exceeds max allowed ${self._settings.max_order_usd:.2f}"
            )

    def _safe_log_event(self, event_type: str, payload: dict[str, object]) -> None:
        try:
            self._audit_logger.log_event(event_type, payload)
        except AuditLogError as exc:
            self._logger.warning(
                "audit_log_failed",
                event_type=event_type,
                error=str(exc),
            )
