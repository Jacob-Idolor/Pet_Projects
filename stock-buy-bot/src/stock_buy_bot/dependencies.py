from typing import Annotated

from fastapi import Depends

from stock_buy_bot.audit import DatabaseAuditLogger, FallbackAuditLogger, JsonLineAuditLogger
from stock_buy_bot.brokers.alpaca import AlpacaBroker, DryRunBroker
from stock_buy_bot.brokers.base import BrokerClient
from stock_buy_bot.config import Settings, get_settings
from stock_buy_bot.services.dashboard import DashboardService
from stock_buy_bot.services.trading import TradingService
from stock_buy_bot.state import StateStore, build_state_store


def get_state_store(
    settings: Annotated[Settings, Depends(get_settings)],
) -> StateStore:
    return build_state_store(settings)


def get_broker(
    settings: Annotated[Settings, Depends(get_settings)],
) -> BrokerClient:
    if settings.api_key.get_secret_value() and settings.api_secret.get_secret_value():
        return AlpacaBroker(
            api_key=settings.api_key.get_secret_value(),
            api_secret=settings.api_secret.get_secret_value(),
            paper=not settings.use_live_trading,
        )
    return DryRunBroker()


def get_audit_logger(
    settings: Annotated[Settings, Depends(get_settings)],
    state_store: Annotated[StateStore, Depends(get_state_store)],
) -> FallbackAuditLogger:
    return FallbackAuditLogger(
        primary=DatabaseAuditLogger(state_store),
        fallback=JsonLineAuditLogger(settings.audit_log_path),
    )


def get_trading_service(
    settings: Annotated[Settings, Depends(get_settings)],
    broker: Annotated[BrokerClient, Depends(get_broker)],
    audit_logger: Annotated[FallbackAuditLogger, Depends(get_audit_logger)],
) -> TradingService:
    return TradingService(
        broker=broker,
        settings=settings,
        audit_logger=audit_logger,
    )


def get_dashboard_service(
    settings: Annotated[Settings, Depends(get_settings)],
    broker: Annotated[BrokerClient, Depends(get_broker)],
) -> DashboardService:
    return DashboardService(settings=settings, broker=broker)
