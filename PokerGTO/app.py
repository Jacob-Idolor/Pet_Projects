from flask import Flask, render_template, request
import json
from pathlib import Path
from typing import Optional, Tuple

import simulator

app = Flask(__name__)

RANGES_PATH = Path(__file__).parent / "data" / "ranges.json"
DEFAULT_PLAYERS = 2
MIN_PLAYERS = 2
MAX_PLAYERS = 9


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

    table = simulator.PokerTable(num_players)
    table.shuffle()
    players = table.deal_hands()

    return render_template(
        "simulate.html",
        players=players,
        num_players=num_players,
        error=error,
        min_players=MIN_PLAYERS,
        max_players=MAX_PLAYERS,
    )


if __name__ == "__main__":
    app.run(debug=True)
