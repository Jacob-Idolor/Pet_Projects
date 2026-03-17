from functools import lru_cache

from pydantic import Field
from pydantic_settings import BaseSettings, SettingsConfigDict


class Settings(BaseSettings):
    model_config = SettingsConfigDict(env_file=".env", env_file_encoding="utf-8", extra="ignore")

    app_name: str = "stock-buy-bot"
    environment: str = Field(default="dev", pattern="^(dev|staging|prod)$")
    api_key: str = Field(default="", alias="ALPACA_API_KEY")
    api_secret: str = Field(default="", alias="ALPACA_API_SECRET")
    base_url: str = Field(default="https://paper-api.alpaca.markets", alias="ALPACA_BASE_URL")
    default_order_usd: float = 100.0
    max_order_usd: float = 1000.0
    allowed_symbols: list[str] = ["AAPL", "MSFT", "SPY", "QQQ"]
    use_live_trading: bool = False


@lru_cache
def get_settings() -> Settings:
    return Settings()
