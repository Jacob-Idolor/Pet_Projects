# Poker GTO Trainer

A simple Flask web application providing introductory Game Theory Optimal (GTO) poker information, example opening ranges, and a lightweight hand simulator.

## Features

* **Home page** describing basic GTO concepts with a quick hand simulator.
* **Range charts** for standard table positions loaded from `data/ranges.json`.
* **Hand simulation** for 2-9 players with friendly validation messaging.
* **Public metrics** page to log anonymous practice runs and view community accuracy.
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
flask --app app run --debug
```

Visit `http://127.0.0.1:5000/` in your browser.

### Local development tips

* Use a virtual environment and pin dependencies with `requirements.txt` to keep your system Python clean.
* Create a `.env` file (or export variables in your shell) for optional AdSense IDs:

  ```bash
  export ADSENSE_CLIENT_ID="ca-pub-xxxxxxxxxxxxxxxx"
  export ADSENSE_SLOT_ID="1234567890"
  ```

* Run the lightweight unit tests before pushing changes:

  ```bash
  pytest
  ```

* Static assets for the simulated cards live in `static/cards/`; swap in branded artwork without touching Python code.
* When changing templates, keep `static/style.css` in sync so the UI stays cohesive across pages.

## Logging Practice Sessions

No login or account creation is required. From the Simulate page, record how many decisions you studied and how many were
correct. Submissions update the public metrics dashboard instantly so high-volume users can benchmark their accuracy.

The app stores entries in `data/practice_metrics.json`. The file is created automatically if it does not exist.

## Enabling Monetization

Responsive ad slots are available across the site. To enable Google AdSense:

1. Configure environment variables before starting the app:

   ```bash
   export ADSENSE_CLIENT_ID="ca-pub-xxxxxxxxxxxxxxxx"
   export ADSENSE_SLOT_ID="1234567890"
   python app.py
   ```

2. Replace the placeholder values with your AdSense client and slot IDs.
3. When the variables are missing, the app shows a friendly placeholder so you can swap in affiliate links, newsletters, or premium coaching offers instead.

## Simulating Hands

To deal random starting hands, visit the `/simulate` route. You can optionally
specify the number of players with the `players` query parameter:

```
http://127.0.0.1:5000/simulate?players=4
```

Each request shuffles a new deck and displays two cards for every player.
