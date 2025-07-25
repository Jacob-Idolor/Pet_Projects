import os
import sys
sys.path.insert(0, os.path.abspath(os.path.join(os.path.dirname(__file__), '..')))

from simple_prediction_service import compute_actual, aggregate_predictions


def test_compute_actual_pts():
    row = {"Stat Type": "PTS", "PTS": "25"}
    assert compute_actual(row) == 25


def test_compute_actual_combo():
    row = {"Stat Type": "Pts+Rebs+Asts", "PTS": "10", "REB": "5", "AST": "5"}
    assert compute_actual(row) == 20


def test_aggregate_predictions():
    rows = [
        {"Player Name": "John", "Stat Type": "PTS", "PTS": "15", "Line Score": "10"},
        {"Player Name": "John", "Stat Type": "PTS", "PTS": "8", "Line Score": "10"},
    ]
    agg = aggregate_predictions(rows)
    assert len(agg) == 1
    result = agg[0]
    assert result["games"] == 2
    assert result["over"] == 1
    assert result["under"] == 1
    assert result["over_pct"] == 0.5
