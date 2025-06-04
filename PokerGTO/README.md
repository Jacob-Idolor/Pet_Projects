# Poker GTO Trainer

A simple Flask web application providing introductory Game Theory Optimal (GTO) poker information and example opening ranges.

## Features

* **Home page** describing basic GTO concepts.
* **Range charts** for standard table positions loaded from `data/ranges.json`.
* **Lightweight** setup using Flask and Jinja2 templates.

## Requirements

* Python 3.10+
* `Flask` (see `requirements.txt`)

## Getting Started

```bash
cd PokerGTO
python -m venv venv
source venv/bin/activate  # Windows: venv\Scripts\activate
pip install -r requirements.txt
python app.py
```

Visit `http://127.0.0.1:5000/` in your browser.

## Simulating Hands

To deal random starting hands, visit the `/simulate` route. You can optionally
specify the number of players with the `players` query parameter:

```
http://127.0.0.1:5000/simulate?players=4
```

Each request shuffles a new deck and displays two cards for every player.
