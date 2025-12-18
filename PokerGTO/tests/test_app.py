import json
import sys
from pathlib import Path

import pytest

ROOT = Path(__file__).resolve().parents[1]
if str(ROOT) not in sys.path:
    sys.path.insert(0, str(ROOT))

import app


@pytest.fixture(autouse=True)
def clean_metrics_file():
    if app.METRICS_PATH.exists():
        app.METRICS_PATH.unlink()
    yield
    if app.METRICS_PATH.exists():
        app.METRICS_PATH.unlink()


@pytest.fixture
def client():
    app.app.testing = True
    with app.app.test_client() as client:
        yield client


def test_index_page_loads(client):
    response = client.get("/")
    assert response.status_code == 200
    assert b"Preflop shortcuts" in response.data


def test_ranges_page_loads_with_data(client):
    response = client.get("/ranges")
    assert response.status_code == 200
    assert b"Preflop ranges" in response.data


def test_simulate_deals_default_players(client):
    response = client.get("/simulate")
    assert response.status_code == 200
    assert b"Simulated Hands" in response.data
    assert b"Player 1" in response.data


def test_record_metrics_creates_entry(client):
    payload = {
        "alias": "Tester",
        "decisions": "10",
        "correct": "8",
        "notes": "Good run",
        "players": "2",
    }
    response = client.post("/metrics/record", data=payload, follow_redirects=False)
    assert response.status_code == 302

    assert app.METRICS_PATH.exists()
    stored = json.loads(Path(app.METRICS_PATH).read_text())
    assert stored == [
        {"alias": "Tester", "decisions": 10, "correct": 8, "notes": "Good run"}
    ]
