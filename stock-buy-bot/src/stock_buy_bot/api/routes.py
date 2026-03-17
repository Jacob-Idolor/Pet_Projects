from fastapi import APIRouter, Depends, HTTPException, status

from stock_buy_bot.config import Settings, get_settings
from stock_buy_bot.models import BuyRequest, OrderResult
from stock_buy_bot.services.trading import TradingService
from stock_buy_bot.brokers.alpaca import AlpacaBroker, DryRunBroker

router = APIRouter()


def get_trading_service(settings: Settings = Depends(get_settings)) -> TradingService:
    broker = (
        AlpacaBroker(
            api_key=settings.api_key,
            api_secret=settings.api_secret,
            paper=not settings.use_live_trading,
        )
        if settings.api_key and settings.api_secret
        else DryRunBroker()
    )
    return TradingService(broker=broker, settings=settings)


@router.get("/health")
def health() -> dict[str, str]:
    return {"status": "ok"}


@router.post("/trade/buy", response_model=OrderResult, status_code=status.HTTP_201_CREATED)
def buy_stock(
    payload: BuyRequest,
    service: TradingService = Depends(get_trading_service),
) -> OrderResult:
    try:
        return service.execute_buy(payload)
    except ValueError as exc:
        raise HTTPException(status_code=status.HTTP_400_BAD_REQUEST, detail=str(exc)) from exc
