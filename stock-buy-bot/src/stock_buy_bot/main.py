from fastapi import FastAPI

from stock_buy_bot.api.routes import router
from stock_buy_bot.config import get_settings
from stock_buy_bot.logging import configure_logging


settings = get_settings()
configure_logging()

app = FastAPI(title=settings.app_name)
app.include_router(router)
