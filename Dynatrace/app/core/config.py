"""Application configuration helpers without external dependencies."""

from __future__ import annotations

import os
from dataclasses import dataclass
from functools import lru_cache
from typing import Optional
from urllib.parse import urlparse

try:  # pragma: no cover - optional convenience
    from dotenv import load_dotenv
except ImportError:  # pragma: no cover - optional dependency
    def load_dotenv(*_args: object, **_kwargs: object) -> bool:
        return False


load_dotenv()


def _env(*names: str, default: Optional[str] = None) -> Optional[str]:
    """Return the first defined environment variable in ``names``."""

    for name in names:
        value = os.getenv(name)
        if value is not None:
            return value
    return default


@dataclass(frozen=True)
class Settings:
    """Runtime configuration loaded from environment variables."""

    dynatrace_api_url: str
    dynatrace_api_token: str
    request_timeout_seconds: float = 10.0
    problems_page_size: int = 100
    audit_logs_page_size: int = 1000

    def __post_init__(self) -> None:
        parsed = urlparse(self.dynatrace_api_url)
        if not parsed.scheme or not parsed.netloc:
            raise ValueError("dynatrace_api_url must be an absolute URL")

        if not self.dynatrace_api_token:
            raise ValueError("dynatrace_api_token must not be empty")

        if self.request_timeout_seconds <= 0:
            raise ValueError("request_timeout_seconds must be positive")

        if not 1 <= self.problems_page_size <= 1000:
            raise ValueError("problems_page_size must be between 1 and 1000")

        if not 1 <= self.audit_logs_page_size <= 1000:
            raise ValueError("audit_logs_page_size must be between 1 and 1000")

    @property
    def base_url(self) -> str:
        """Return the Dynatrace base URL without a trailing slash."""

        return self.dynatrace_api_url.rstrip("/")


def _build_settings() -> Settings:
    required_url = _env("DYNATRACE_API_URL", "dynatrace_api_url")
    required_token = _env("DYNATRACE_API_TOKEN", "dynatrace_api_token")

    if required_url is None or required_token is None:
        missing = [
            name
            for name, value in {
                "dynatrace_api_url": required_url,
                "dynatrace_api_token": required_token,
            }.items()
            if value is None
        ]
        raise RuntimeError(
            f"Missing required Dynatrace settings: {', '.join(sorted(missing))}"
        )

    timeout = float(_env("DYNATRACE_REQUEST_TIMEOUT", "request_timeout_seconds", default="10"))
    problem_size = int(
        _env("DYNATRACE_PROBLEMS_PAGE_SIZE", "problems_page_size", default="100")
    )
    audit_size = int(
        _env("DYNATRACE_AUDIT_LOGS_PAGE_SIZE", "audit_logs_page_size", default="1000")
    )

    return Settings(
        dynatrace_api_url=required_url,
        dynatrace_api_token=required_token,
        request_timeout_seconds=timeout,
        problems_page_size=problem_size,
        audit_logs_page_size=audit_size,
    )


@lru_cache
def get_settings() -> Settings:
    """Return a cached settings instance."""

    return _build_settings()


__all__ = ["Settings", "get_settings"]
