"""Dynatrace API client utilities."""

from __future__ import annotations

import logging
from dataclasses import dataclass, field
from datetime import datetime, timezone
from typing import Any, Dict, Iterable, List, Optional
from urllib.parse import urljoin

import requests
from requests import Response, Session
from requests.adapters import HTTPAdapter
from urllib3.util.retry import Retry

from app.core.config import Settings, get_settings

logger = logging.getLogger(__name__)


JsonCollection = List[Dict[str, Any]]


def convert_epoch(epoch_ms: int) -> str:
    """Convert an epoch timestamp in milliseconds to an ISO-like string."""

    return datetime.fromtimestamp(epoch_ms / 1000, timezone.utc).strftime("%Y-%m-%d %H:%M:%S")


def dynalink(problem_id: str, *, settings: Optional[Settings] = None) -> str:
    """Return the Dynatrace UI link for a given problem identifier."""

    cfg = settings or get_settings()
    return f"{cfg.base_url}/ui/problems/{problem_id}"


@dataclass
class DynatraceClient:
    """Small wrapper around ``requests.Session`` with sensible defaults."""

    settings: Settings
    session: Session = field(default_factory=requests.Session)

    def __post_init__(self) -> None:
        self._base_url = self.settings.base_url
        self._timeout = self.settings.request_timeout_seconds
        self.session.headers.update(
            {"Authorization": f"Api-Token {self.settings.dynatrace_api_token}"}
        )

        retry_strategy = Retry(
            total=3,
            status_forcelist=(429, 500, 502, 503, 504),
            allowed_methods=("GET", "POST", "PUT", "DELETE", "PATCH"),
            backoff_factor=0.5,
            raise_on_status=False,
        )
        adapter = HTTPAdapter(max_retries=retry_strategy)
        self.session.mount("https://", adapter)
        self.session.mount("http://", adapter)

    def close(self) -> None:
        """Close the underlying HTTP session."""

        self.session.close()

    def _request(self, method: str, path: str, **kwargs: Any) -> Response:
        url = urljoin(f"{self._base_url}/", path.lstrip("/"))
        try:
            response = self.session.request(method, url, timeout=self._timeout, **kwargs)
            response.raise_for_status()
            return response
        except requests.RequestException as exc:  # pragma: no cover - exercised in unit tests
            logger.exception("Dynatrace API request failed for %s %s", method, url)
            raise RuntimeError("Dynatrace API request failed") from exc

    def list_problems(self, *, page_size: Optional[int] = None) -> JsonCollection:
        """Fetch the recent problems list."""

        params = {"pageSize": page_size or self.settings.problems_page_size}
        response = self._request("GET", "/api/v2/problems", params=params)
        payload = response.json()
        problems: Iterable[Any] = payload.get("problems", [])
        if not isinstance(problems, list):
            logger.warning("Unexpected problems payload format: %s", type(problems))
            return []
        return [p for p in problems if isinstance(p, dict)]

    def list_audit_logs(
        self,
        start_ts: int,
        end_ts: int,
        *,
        page_size: Optional[int] = None,
    ) -> JsonCollection:
        """Fetch audit logs between the provided epoch millisecond timestamps."""

        params = {
            "from": start_ts,
            "to": end_ts,
            "pageSize": page_size or self.settings.audit_logs_page_size,
        }
        response = self._request("GET", "/api/v2/auditlogs", params=params)
        payload = response.json()
        logs = (
            payload.get("auditLogs")
            or payload.get("logs")
            or (payload if isinstance(payload, list) else [])
        )
        if not isinstance(logs, list):
            logger.warning("Unexpected audit log payload format: %s", type(logs))
            return []
        return [log for log in logs if isinstance(log, dict)]


def _cached_client() -> DynatraceClient:
    return DynatraceClient(get_settings())


def get_dynatrace_client() -> DynatraceClient:
    """Return a shared Dynatrace client instance."""

    # Use a module-level cache so the FastAPI dependency system reuses the same
    # underlying session. The attribute is replaced by tests when necessary.
    global _client_cache
    try:
        client = _client_cache
    except NameError:
        client = _client_cache = _cached_client()
    return client


def reset_cached_client() -> None:
    """Clear the cached client instance. Useful for tests."""

    global _client_cache
    if "_client_cache" in globals():
        _client_cache.close()
        del _client_cache


def get_problems(*, page_size: Optional[int] = None) -> JsonCollection:
    """Convenience wrapper that proxies to :class:`DynatraceClient`."""

    return get_dynatrace_client().list_problems(page_size=page_size)


def get_audit_logs(
    start_ts: int,
    end_ts: int,
    *,
    page_size: Optional[int] = None,
) -> JsonCollection:
    """Convenience wrapper for :meth:`DynatraceClient.list_audit_logs`."""

    return get_dynatrace_client().list_audit_logs(start_ts, end_ts, page_size=page_size)


__all__ = [
    "DynatraceClient",
    "convert_epoch",
    "dynalink",
    "get_audit_logs",
    "get_dynatrace_client",
    "get_problems",
    "reset_cached_client",
]
