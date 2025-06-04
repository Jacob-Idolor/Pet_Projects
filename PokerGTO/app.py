from flask import Flask, render_template
import json
from pathlib import Path

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


if __name__ == '__main__':
    app.run(debug=True)
