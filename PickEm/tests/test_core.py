import os
import sys
sys.path.insert(0, os.path.abspath(os.path.join(os.path.dirname(__file__), '..')))
import types
sys.modules.setdefault("pandas", types.ModuleType("pandas"))
sys.modules.setdefault("tabulate", types.ModuleType("tabulate"))
sys.modules.setdefault("requests", types.ModuleType("requests"))
sys.modules["tabulate"].tabulate = lambda *a, **k: ""
sys.modules["requests"].get = lambda *a, **k: types.SimpleNamespace(json=lambda: {"data": []})

from GetStats import is_triple_double
from CleanupLines import get_projection_info, filter_included_data


def test_is_triple_double_true():
    game = {"pts": 10, "reb": 10, "ast": 10, "stl": 0, "blk": 0}
    assert is_triple_double(game) is True


def test_is_triple_double_false():
    game = {"pts": 10, "reb": 9, "ast": 10, "stl": 0, "blk": 0}
    assert is_triple_double(game) is False


def test_get_projection_info():
    projection = {
        "attributes": {
            "rank": 1,
            "description": "foo",
            "line_score": 20,
            "stat_type": "PTS",
        },
        "relationships": {"new_player": {"data": {"id": "42"}}},
    }
    players = {
        "42": {
            "attributes": {
                "market": "NBA",
                "name": "John Doe",
                "position": "G",
                "team_name": "LAL",
                "team_logo": "logo",
                "player_headshot": "head",
            }
        }
    }
    expected = {
        "rank": 1,
        "description": "foo",
        "line_score": 20,
        "stat_type": "PTS",
        "new_player_id": "42",
        "market": "NBA",
        "name": "John Doe",
        "position": "G",
        "team_name": "LAL",
        "team_logo": "logo",
        "player_headshot": "head",
    }
    assert get_projection_info(projection, players) == expected


def test_filter_included_data():
    data = {
        "included": [
            {"type": "new_player", "id": "1"},
            {"type": "other", "id": "x"},
        ]
    }
    result = filter_included_data(data, "new_player")
    assert result == [{"type": "new_player", "id": "1"}]
