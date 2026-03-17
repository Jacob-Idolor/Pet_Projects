from functools import lru_cache
from decimal import Decimal
from pathlib import Path
from typing import Literal

from pydantic import Field, SecretStr, field_validator, model_validator
from pydantic_settings import BaseSettings, SettingsConfigDict


class Settings(BaseSettings):
    model_config = SettingsConfigDict(env_file=".env", env_file_encoding="utf-8", extra="ignore")

    app_name: str = "stock-buy-bot"
    environment: Literal["dev", "staging", "prod"] = "dev"
    api_key: SecretStr = Field(default=SecretStr(""), alias="ALPACA_API_KEY")
    api_secret: SecretStr = Field(default=SecretStr(""), alias="ALPACA_API_SECRET")
    default_order_usd: Decimal = Decimal("100.00")
    max_order_usd: Decimal = Decimal("1000.00")
    allowed_symbols: list[str] = Field(default_factory=lambda: ["AAPL", "MSFT", "SPY", "QQQ"])
    use_live_trading: bool = False
    trade_api_key: SecretStr = Field(default=SecretStr("dev-trade-key"), alias="TRADE_API_KEY")
    trade_signing_secret: SecretStr = Field(
        default=SecretStr("dev-signing-secret-change-me"),
        alias="TRADE_SIGNING_SECRET",
    )
    trade_signature_ttl_seconds: int = Field(default=300, ge=30, le=900)
    allowed_hosts: list[str] = Field(
        default_factory=lambda: ["localhost", "127.0.0.1", "testserver"]
    )
    audit_log_path: Path = Path("var/audit/trades.jsonl")
    portfolio_data_path: Path = Path("var/portfolio.json")

    @field_validator("allowed_hosts", mode="before")
    @classmethod
    def parse_allowed_hosts(cls, value: object) -> object:
        if isinstance(value, str):
            return [host.strip() for host in value.split(",") if host.strip()]
        return value

    @model_validator(mode="after")
    def validate_runtime_settings(self) -> "Settings":
        if self.default_order_usd > self.max_order_usd:
            raise ValueError("default_order_usd cannot exceed max_order_usd")

        if self.use_live_trading and (
            not self.api_key.get_secret_value() or not self.api_secret.get_secret_value()
        ):
            raise ValueError("Live trading requires both ALPACA_API_KEY and ALPACA_API_SECRET")

        using_dev_auth_defaults = (
            self.trade_api_key.get_secret_value() == "dev-trade-key"
            or self.trade_signing_secret.get_secret_value() == "dev-signing-secret-change-me"
        )
        if self.environment != "dev" and using_dev_auth_defaults:
            raise ValueError(
                "Non-dev environments must override TRADE_API_KEY and TRADE_SIGNING_SECRET"
            )

        if not self.allowed_hosts:
            raise ValueError("allowed_hosts cannot be empty")

        if self.environment != "dev" and any(host == "*" for host in self.allowed_hosts):
            raise ValueError("Wildcard allowed_hosts is not permitted outside dev")

        return self


@lru_cache
def get_settings() -> Settings:
    return Settings()
