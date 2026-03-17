from pathlib import Path

from fastapi import FastAPI
from fastapi.staticfiles import StaticFiles

from stock_buy_bot.api.routes import router
from stock_buy_bot.config import Settings, get_settings
from stock_buy_bot.dashboard.routes import router as dashboard_router
from stock_buy_bot.logging import configure_logging
from stock_buy_bot.services.dashboard import DashboardService


settings = get_settings()
configure_logging()


def validate_startup_settings(config: Settings) -> None:
    config.validate_runtime_settings()


app = FastAPI(title=settings.app_name)
app.include_router(router)
app.include_router(dashboard_router)
app.mount(
    "/static",
    StaticFiles(directory=str(Path(__file__).resolve().parent / "static")),
    name="static",
)


@app.on_event("startup")
def startup() -> None:
    validate_startup_settings(settings)
    DashboardService(settings).ensure_seed_data()
