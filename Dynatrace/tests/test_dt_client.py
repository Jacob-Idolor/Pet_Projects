import types

import os
import sys

import pytest

sys.path.insert(0, os.path.abspath(os.path.join(os.path.dirname(__file__), "..")))

from app.core import dt_client
from app.core.config import Settings
from app.core.dt_client import DynatraceClient, convert_epoch, get_audit_logs, get_problems


@pytest.fixture()
def dummy_settings() -> Settings:
    return Settings(
        dynatrace_api_url="https://example.com",
        dynatrace_api_token="token",
        request_timeout_seconds=1.0,
        problems_page_size=25,
        audit_logs_page_size=50,
    )


class DummyResponse:
    def __init__(self, payload: dict):
        self._payload = payload

    def json(self) -> dict:
        return self._payload


def test_convert_epoch_zero():
    assert convert_epoch(0) == "1970-01-01 00:00:00"


def test_list_problems(monkeypatch: pytest.MonkeyPatch, dummy_settings: Settings) -> None:
    client = DynatraceClient(dummy_settings)
    monkeypatch.setattr(client, "_request", lambda *_, **__: DummyResponse({"problems": [{"id": "p1"}]}))

    assert client.list_problems() == [{"id": "p1"}]
    client.close()


def test_list_audit_logs(monkeypatch: pytest.MonkeyPatch, dummy_settings: Settings) -> None:
    client = DynatraceClient(dummy_settings)
    monkeypatch.setattr(client, "_request", lambda *_, **__: DummyResponse({"auditLogs": [{"id": "l1"}]}))

    assert client.list_audit_logs(0, 1) == [{"id": "l1"}]
    client.close()


def test_get_problems_wrapper(monkeypatch: pytest.MonkeyPatch, dummy_settings: Settings) -> None:
    client = DynatraceClient(dummy_settings)
    monkeypatch.setattr(client, "list_problems", lambda **__: [{"id": "p42"}])
    monkeypatch.setattr(dt_client, "get_dynatrace_client", lambda: client)

    assert get_problems() == [{"id": "p42"}]
    client.close()


def test_get_audit_logs_wrapper(monkeypatch: pytest.MonkeyPatch, dummy_settings: Settings) -> None:
    client = DynatraceClient(dummy_settings)
    monkeypatch.setattr(client, "list_audit_logs", lambda *_, **__: [{"id": "log"}])
    monkeypatch.setattr(dt_client, "get_dynatrace_client", lambda: client)

    assert get_audit_logs(0, 1) == [{"id": "log"}]
    client.close()
