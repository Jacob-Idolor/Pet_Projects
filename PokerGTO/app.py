import os

from flask import Flask, redirect, render_template, request, url_for
import json
from pathlib import Path
from typing import Dict, List, Optional, Tuple

import simulator

app = Flask(__name__)

ADSENSE_CLIENT_ID = os.getenv("ADSENSE_CLIENT_ID")
ADSENSE_SLOT_ID = os.getenv("ADSENSE_SLOT_ID")

RANGES_PATH = Path(__file__).parent / "data" / "ranges.json"
METRICS_PATH = Path(__file__).parent / "data" / "practice_metrics.json"
DEFAULT_PLAYERS = 2
MIN_PLAYERS = 2
MAX_PLAYERS = 9
SUIT_META = {
    "Hearts": {"symbol": "♥", "asset": "cards/heart.svg", "label": "Hearts"},
    "Diamonds": {"symbol": "♦", "asset": "cards/diamond.svg", "label": "Diamonds"},
    "Clubs": {"symbol": "♣", "asset": "cards/club.svg", "label": "Clubs"},
    "Spades": {"symbol": "♠", "asset": "cards/spade.svg", "label": "Spades"},
}


def load_ranges() -> dict:
    """Load preflop ranges from disk.

    A helpful error message is provided when the file is missing or invalid so
    the UI can gracefully report problems instead of crashing.
    """

    if not RANGES_PATH.exists():
        raise FileNotFoundError(f"Missing ranges file at {RANGES_PATH}")

    with RANGES_PATH.open() as f:
        try:
            return json.load(f)
        except json.JSONDecodeError as exc:
            raise ValueError("Unable to read ranges data") from exc


def parse_players(raw_value: Optional[str]) -> Tuple[int, Optional[str]]:
    """Convert the player query parameter to an integer within bounds."""

    if raw_value is None:
        return DEFAULT_PLAYERS, None

    try:
        parsed = int(raw_value)
    except (TypeError, ValueError):
        return DEFAULT_PLAYERS, "Player count must be a whole number."

    if parsed < MIN_PLAYERS or parsed > MAX_PLAYERS:
        return DEFAULT_PLAYERS, (
            f"Player count must be between {MIN_PLAYERS} and {MAX_PLAYERS}."
        )

    return parsed, None


def ad_settings() -> dict:
    """Return ad configuration toggles for templates."""

    ads_enabled = bool(ADSENSE_CLIENT_ID and ADSENSE_SLOT_ID)
    return {
        "ads_enabled": ads_enabled,
        "ads_client": ADSENSE_CLIENT_ID,
        "ads_slot": ADSENSE_SLOT_ID,
    }


def ensure_metrics_store() -> None:
    """Create the practice metrics file if it does not exist."""

    METRICS_PATH.parent.mkdir(parents=True, exist_ok=True)
    if not METRICS_PATH.exists():
        METRICS_PATH.write_text("[]", encoding="utf-8")


def load_metrics() -> List[Dict]:
    """Load stored practice sessions, returning an empty list on failure."""

    ensure_metrics_store()

    try:
        with METRICS_PATH.open() as f:
            data = json.load(f)
            return data if isinstance(data, list) else []
    except (json.JSONDecodeError, OSError):
        return []


def save_metrics(entries: List[Dict]) -> None:
    """Persist the supplied practice entries."""

    METRICS_PATH.write_text(json.dumps(entries, indent=2), encoding="utf-8")


def summarize_metrics(entries: List[Dict]) -> Dict:
    """Aggregate metrics for display."""

    total_sessions = len(entries)
    total_decisions = sum(entry.get("decisions", 0) for entry in entries)
    total_correct = sum(entry.get("correct", 0) for entry in entries)
    average_accuracy = (
        round((total_correct / total_decisions) * 100, 1) if total_decisions else 0.0
    )

    leaderboard: Dict[str, Dict] = {}
    for entry in entries:
        alias = entry.get("alias") or "Anonymous"
        decisions = max(int(entry.get("decisions", 0)), 0)
        correct = min(max(int(entry.get("correct", 0)), 0), decisions)

        current = leaderboard.setdefault(
            alias,
            {"alias": alias, "sessions": 0, "decisions": 0, "correct": 0},
        )
        current["sessions"] += 1
        current["decisions"] += decisions
        current["correct"] += correct

    leaderboard_rows = []
    for data in leaderboard.values():
        decisions = data["decisions"]
        correct = data["correct"]
        data["accuracy"] = round((correct / decisions) * 100, 1) if decisions else 0.0
        leaderboard_rows.append(data)

    leaderboard_rows.sort(key=lambda item: (item["accuracy"], item["decisions"]), reverse=True)

    return {
        "total_sessions": total_sessions,
        "total_decisions": total_decisions,
        "total_correct": total_correct,
        "average_accuracy": average_accuracy,
        "leaderboard": leaderboard_rows,
        "recent_entries": entries[-10:][::-1],
    }


def build_simulation_context(num_players: int, error: Optional[str] = None) -> Dict:
    """Create the render context for the simulate page."""

    table = simulator.PokerTable(num_players)
    table.shuffle()
    players = table.deal_hands()

    return {
        "players": players,
        "num_players": num_players,
        "error": error,
        "min_players": MIN_PLAYERS,
        "max_players": MAX_PLAYERS,
        "suits": SUIT_META,
    }


@app.context_processor
def inject_ads():
    """Expose ad settings to every template."""

    return {"ad_settings": ad_settings()}


@app.route("/")
def index():
    return render_template("index.html", min_players=MIN_PLAYERS, max_players=MAX_PLAYERS)


@app.route("/ranges")
def ranges():
    try:
        ranges_data = load_ranges()
    except (FileNotFoundError, ValueError) as exc:
        return render_template("ranges.html", ranges=None, error=str(exc)), 500

    return render_template("ranges.html", ranges=ranges_data, error=None)


@app.route("/simulate")
def simulate():
    num_players, error = parse_players(request.args.get("players"))

    context = build_simulation_context(num_players, error)
    return render_template("simulate.html", **context)


@app.route("/metrics", methods=["GET"])
def metrics():
    entries = load_metrics()
    summary = summarize_metrics(entries)

    return render_template(
        "metrics.html",
        summary=summary,
        entries=entries,
        submitted=request.args.get("submitted") == "1",
    )


@app.route("/metrics/record", methods=["POST"])
def record_metrics():
    alias = (request.form.get("alias") or "Anonymous").strip() or "Anonymous"
    decisions_raw = request.form.get("decisions")
    correct_raw = request.form.get("correct")
    notes = (request.form.get("notes") or "").strip()

    errors = []
    decisions = None
    correct = None

    try:
        decisions = int(decisions_raw)
        if decisions <= 0:
            errors.append("Decisions studied must be greater than zero.")
    except (TypeError, ValueError):
        errors.append("Decisions studied must be a whole number.")

    try:
        correct = int(correct_raw)
        if correct is not None and correct < 0:
            errors.append("Correct decisions cannot be negative.")
    except (TypeError, ValueError):
        errors.append("Correct decisions must be a whole number.")

    if decisions is not None and correct is not None and correct > decisions:
        errors.append("Correct decisions cannot exceed total decisions studied.")

    players_arg = request.form.get("players")
    num_players, player_error = parse_players(players_arg)
    sim_context = build_simulation_context(num_players, player_error)

    if errors:
        return (
            render_template(
                "simulate.html",
                practice_error=" ".join(errors),
                practice_values={
                    "alias": alias,
                    "decisions": decisions_raw,
                    "correct": correct_raw,
                    "notes": notes,
                },
                **sim_context,
            ),
            400,
        )

    entries = load_metrics()
    entries.append(
        {
            "alias": alias,
            "decisions": decisions,
            "correct": correct,
            "notes": notes,
        }
    )
    save_metrics(entries)

    return redirect(url_for("metrics", submitted=1))


if __name__ == "__main__":
    app.run(debug=True)
