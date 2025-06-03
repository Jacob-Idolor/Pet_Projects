import os
import sys
import types

# Ensure the Dynatrace package is on the path
sys.path.insert(0, os.path.abspath(os.path.join(os.path.dirname(__file__), '..')))

# Stub external dependencies so dt_client can be imported without them installed
sys.modules.setdefault('requests', types.ModuleType('requests'))

# Stub settings object required by dt_client
dummy_settings = types.SimpleNamespace(dynatrace_api_url='', dynatrace_api_token='')
config_stub = types.ModuleType('app.core.config')
config_stub.settings = dummy_settings
sys.modules['app.core.config'] = config_stub

from app.core.dt_client import convert_epoch


def test_convert_epoch_zero():
    assert convert_epoch(0) == "1970-01-01 00:00:00"
