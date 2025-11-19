from pathlib import Path
import sys

import pytest

PROJECT_ROOT = Path(__file__).resolve().parent.parent
sys.modules.pop("app", None)
sys.path.insert(0, str(PROJECT_ROOT))
import app as poker_app


@pytest.fixture()
def client():
    poker_app.app.config.update({"TESTING": True})
    with poker_app.app.test_client() as client:
        yield client


@pytest.fixture(autouse=True)
def reset_metrics(tmp_path):
    """Ensure practice metrics start empty for each test."""

    metrics_file = getattr(
        poker_app, "METRICS_PATH", PROJECT_ROOT / "data" / "practice_metrics.json"
    )
    if metrics_file.exists():
        metrics_file.unlink()
    metrics_file.parent.mkdir(parents=True, exist_ok=True)
    metrics_file.write_text("[]", encoding="utf-8")
    poker_app.METRICS_PATH = metrics_file
    yield


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


def test_submit_practice_session_and_view_metrics(client):
    payload = {"alias": "Tester", "decisions": "10", "correct": "8", "notes": "BTN opens"}
    response = client.post("/metrics/record", data=payload, follow_redirects=True)
    assert response.status_code == 200
    body = response.data
    assert b"Thanks for sharing your session" in body
    assert b"Tester" in body
    assert b"10" in body
    assert b"80.0%" in body


def test_validation_errors_show_on_simulate_page(client):
    payload = {"alias": "", "decisions": "5", "correct": "9", "notes": "too high"}
    response = client.post("/metrics/record", data=payload)
    assert response.status_code == 400
    assert b"Correct decisions cannot exceed total decisions studied" in response.data
