from pathlib import Path
import sys

import pytest

PROJECT_ROOT = Path(__file__).resolve().parent.parent
if str(PROJECT_ROOT) not in sys.path:
    sys.path.insert(0, str(PROJECT_ROOT))

import app as poker_app


@pytest.fixture()
def client():
    poker_app.app.config.update({"TESTING": True})
    with poker_app.app.test_client() as client:
        yield client


def test_home_page(client):
    response = client.get("/")
    assert response.status_code == 200
    assert b"Poker GTO Trainer" in response.data
    assert b"Quick Hand Simulator" in response.data


def test_simulate_with_invalid_player_input_resets_to_default(client):
    response = client.get("/simulate?players=abc")
    assert response.status_code == 200
    assert b"Player count must be a whole number" in response.data
    assert b"Player 1" in response.data


def test_ranges_page_loads_data(client):
    response = client.get("/ranges")
    assert response.status_code == 200
    assert b"UTG" in response.data
    assert b"BTN" in response.data
