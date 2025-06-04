from flask import Flask, render_template, request
import json
from pathlib import Path

import simulator

app = Flask(__name__)

RANGES_PATH = Path(__file__).parent / 'data' / 'ranges.json'


def load_ranges():
    with RANGES_PATH.open() as f:
        return json.load(f)


@app.route('/')
def index():
    return render_template('index.html')


@app.route('/ranges')
def ranges():
    ranges = load_ranges()
    return render_template('ranges.html', ranges=ranges)


@app.route('/simulate')
def simulate():
    try:
        num_players = int(request.args.get('players', 2))
    except ValueError:
        num_players = 2

    table = simulator.PokerTable(num_players)
    table.shuffle()
    players = table.deal_hands()
    return render_template('simulate.html', players=players)


if __name__ == '__main__':
    app.run(debug=True)
