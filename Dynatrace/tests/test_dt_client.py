import os
import sys
import types

sys.path.insert(0, os.path.abspath(os.path.join(os.path.dirname(__file__), '..')))

# Stub external dependencies so dt_client can be imported without requests
sys.modules.setdefault('requests', types.ModuleType('requests'))

dummy_settings = types.SimpleNamespace(dynatrace_api_url='', dynatrace_api_token='')
config_stub = types.ModuleType('app.core.config')
config_stub.settings = dummy_settings
sys.modules['app.core.config'] = config_stub

from app.core.dt_client import convert_epoch, get_problems, get_audit_logs


def test_convert_epoch_zero():
    assert convert_epoch(0) == "1970-01-01 00:00:00"


def test_get_problems(monkeypatch):
    dummy_response = types.SimpleNamespace(
        json=lambda: {"problems": [{"id": "p1"}]},
        raise_for_status=lambda: None,
    )

    def fake_get(url, headers=None, params=None):
        return dummy_response

    monkeypatch.setattr('app.core.dt_client.requests.get', fake_get)
    monkeypatch.setattr('app.core.dt_client.settings', dummy_settings)

    assert get_problems() == [{"id": "p1"}]


def test_get_audit_logs(monkeypatch):
    dummy_response = types.SimpleNamespace(
        json=lambda: {"auditLogs": [{"id": "l1"}]},
        raise_for_status=lambda: None,
    )

    def fake_get(url, headers=None, params=None):
        return dummy_response

    monkeypatch.setattr('app.core.dt_client.requests.get', fake_get)
    monkeypatch.setattr('app.core.dt_client.settings', dummy_settings)

    logs = get_audit_logs(0, 1)
    assert logs == [{"id": "l1"}]

