from typing import Annotated

from fastapi import APIRouter, Depends, HTTPException, status

from stock_buy_bot.dependencies import get_trading_service
from stock_buy_bot.models import BuyRequest, OrderResult, SellRequest
from stock_buy_bot.security import AuthenticatedTradeContext, verify_trade_request
from stock_buy_bot.services.trading import TradingService

router = APIRouter()


@router.get("/health")
def health() -> dict[str, str]:
    return {"status": "ok"}


@router.post("/trade/buy", response_model=OrderResult, status_code=status.HTTP_201_CREATED)
def buy_stock(
    payload: BuyRequest,
    auth: Annotated[AuthenticatedTradeContext, Depends(verify_trade_request)],
    service: Annotated[TradingService, Depends(get_trading_service)],
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
    auth: Annotated[AuthenticatedTradeContext, Depends(verify_trade_request)],
    service: Annotated[TradingService, Depends(get_trading_service)],
) -> OrderResult:
    try:
        return service.execute_sell(
            payload,
            idempotency_key=auth.idempotency_key,
            principal=auth.principal,
        )
    except ValueError as exc:
        raise HTTPException(status_code=status.HTTP_400_BAD_REQUEST, detail=str(exc)) from exc
