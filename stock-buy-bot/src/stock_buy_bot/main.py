from pathlib import Path

from fastapi import FastAPI
from fastapi.staticfiles import StaticFiles
from starlette.middleware.trustedhost import TrustedHostMiddleware

from stock_buy_bot.api.routes import router
from stock_buy_bot.config import Settings, get_settings
from stock_buy_bot.dashboard.routes import router as dashboard_router
from stock_buy_bot.logging import configure_logging
from stock_buy_bot.middleware import security_headers_middleware
from stock_buy_bot.services.dashboard import DashboardService


settings = get_settings()
configure_logging()


def validate_startup_settings(config: Settings) -> None:
    config.validate_runtime_settings()


def create_app(config: Settings) -> FastAPI:
    docs_enabled = config.environment == "dev"

    app_instance = FastAPI(
        title=config.app_name,
        docs_url="/docs" if docs_enabled else None,
        redoc_url="/redoc" if docs_enabled else None,
        openapi_url="/openapi.json" if docs_enabled else None,
    )
    app_instance.add_middleware(TrustedHostMiddleware, allowed_hosts=config.allowed_hosts)

    @app_instance.middleware("http")
    async def add_security_headers(request, call_next):  # type: ignore[no-untyped-def]
        return await security_headers_middleware(request, call_next, config)

    app_instance.include_router(router)
    app_instance.include_router(dashboard_router)
    app_instance.mount(
        "/static",
        StaticFiles(directory=str(Path(__file__).resolve().parent / "static")),
        name="static",
    )

    @app_instance.on_event("startup")
    def startup() -> None:
        validate_startup_settings(config)
        DashboardService(config).ensure_seed_data()

    return app_instance


app = create_app(settings)
