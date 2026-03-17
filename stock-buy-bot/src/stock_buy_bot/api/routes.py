from fastapi import APIRouter, Depends, HTTPException, status

from stock_buy_bot.audit import JsonLineAuditLogger
from stock_buy_bot.brokers.alpaca import AlpacaBroker, DryRunBroker
from stock_buy_bot.config import Settings, get_settings
from stock_buy_bot.models import BuyRequest, OrderResult, SellRequest
from stock_buy_bot.security import AuthenticatedTradeContext, verify_trade_request
from stock_buy_bot.services.trading import TradingService

router = APIRouter()


def get_audit_logger(settings: Settings = Depends(get_settings)) -> JsonLineAuditLogger:
    return JsonLineAuditLogger(settings.audit_log_path)


def get_trading_service(
    settings: Settings = Depends(get_settings),
    audit_logger: JsonLineAuditLogger = Depends(get_audit_logger),
) -> TradingService:
    broker = (
        AlpacaBroker(
            api_key=settings.api_key.get_secret_value(),
            api_secret=settings.api_secret.get_secret_value(),
            paper=not settings.use_live_trading,
        )
        if settings.api_key.get_secret_value() and settings.api_secret.get_secret_value()
        else DryRunBroker()
    )
    return TradingService(
        broker=broker,
        settings=settings,
        audit_logger=audit_logger,
    )


@router.get("/health")
def health() -> dict[str, str]:
    return {"status": "ok"}


@router.post("/trade/buy", response_model=OrderResult, status_code=status.HTTP_201_CREATED)
def buy_stock(
    payload: BuyRequest,
    auth: AuthenticatedTradeContext = Depends(verify_trade_request),
    service: TradingService = Depends(get_trading_service),
) -> OrderResult:
    try:
        return service.execute_buy(
            payload,
            idempotency_key=auth.idempotency_key,
            principal=auth.principal,
        )
    except ValueError as exc:
        raise HTTPException(status_code=status.HTTP_400_BAD_REQUEST, detail=str(exc)) from exc


@router.post("/trade/sell", response_model=OrderResult, status_code=status.HTTP_201_CREATED)
def sell_stock(
    payload: SellRequest,
    auth: AuthenticatedTradeContext = Depends(verify_trade_request),
    service: TradingService = Depends(get_trading_service),
) -> OrderResult:
    try:
        return service.execute_sell(
            payload,
            idempotency_key=auth.idempotency_key,
            principal=auth.principal,
        )
    except ValueError as exc:
        raise HTTPException(status_code=status.HTTP_400_BAD_REQUEST, detail=str(exc)) from exc
