from contextlib import asynccontextmanager
from time import perf_counter
from pathlib import Path
from typing import AsyncIterator
from collections.abc import Awaitable, Callable

from fastapi import FastAPI
from fastapi.staticfiles import StaticFiles
from starlette.requests import Request
from starlette.responses import Response
from starlette.middleware.trustedhost import TrustedHostMiddleware

from stock_buy_bot.api.routes import router
from stock_buy_bot.config import Settings, get_settings
from stock_buy_bot.dashboard.routes import router as dashboard_router
from stock_buy_bot.logging import configure_logging
from stock_buy_bot.metrics import record_http_request
from stock_buy_bot.middleware import security_headers_middleware
from stock_buy_bot.services.dashboard import DashboardService
from stock_buy_bot.state import build_state_store


settings = get_settings()
configure_logging()


def validate_startup_settings(config: Settings) -> None:
    config.assert_runtime_settings()


@asynccontextmanager
async def app_lifespan(app_instance: FastAPI) -> AsyncIterator[None]:
    config = app_instance.state.settings
    validate_startup_settings(config)
    build_state_store(config).initialize()
    DashboardService(config).ensure_seed_data()
    yield


def create_app(config: Settings) -> FastAPI:
    docs_enabled = config.environment == "dev"

    app_instance = FastAPI(
        title=config.app_name,
        docs_url="/docs" if docs_enabled else None,
        redoc_url="/redoc" if docs_enabled else None,
        openapi_url="/openapi.json" if docs_enabled else None,
        lifespan=app_lifespan,
    )
    app_instance.state.settings = config
    app_instance.add_middleware(TrustedHostMiddleware, allowed_hosts=config.allowed_hosts)

    @app_instance.middleware("http")
    async def add_security_headers(
        request: Request,
        call_next: Callable[[Request], Awaitable[Response]],
    ) -> Response:
        started_at = perf_counter()
        response = await security_headers_middleware(request, call_next, config)
        if config.metrics_enabled:
            record_http_request(
                method=request.method,
                path=request.url.path,
                status_code=response.status_code,
                duration_seconds=perf_counter() - started_at,
            )
        return response

    app_instance.include_router(router)
    app_instance.include_router(dashboard_router)
    app_instance.mount(
        "/static",
        StaticFiles(directory=str(Path(__file__).resolve().parent / "static")),
        name="static",
    )

    return app_instance


app = create_app(settings)
