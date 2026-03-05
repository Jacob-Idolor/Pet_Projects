"""
send_daily_pick.py
==================
Standalone script for automated daily pick emails.
Run manually OR via GitHub Actions cron (see NEWSLETTER_SETUP.md).

Usage:
  python send_daily_pick.py

Required env vars:
  RESEND_API_KEY  = re_xxxxxxxxxxxx
  ODDS_API_KEY    = your_odds_api_key

Optional:
  NEWSLETTER_FROM = picks@yourdomain.com
"""

import os
import sys
from datetime import date

from dotenv import load_dotenv
import requests

load_dotenv()

# Add MISC folder to path if running from repo root
sys.path.insert(0, os.path.dirname(__file__))

from newsletter import (
    pick_of_the_day, build_email_html, build_email_text,
    ResendClient, load_subscribers, log_pick, subscriber_count
)

ODDS_API_KEY = os.environ.get("ODDS_API_KEY", "")
RESEND_KEY   = os.environ.get("RESEND_API_KEY", "")

PRIORITY_SPORTS = [
    "basketball_ncaab",   # March Madness first
    "basketball_nba",
    "icehockey_nhl",
    "baseball_mlb",
]


def fetch_games(sport: str) -> list:
    """Pull h2h odds for a sport from The Odds API."""
    url = f"https://api.the-odds-api.com/v4/sports/{sport}/odds"
    params = {
        "apiKey": ODDS_API_KEY,
        "regions": "us",
        "markets": "h2h",
        "oddsFormat": "american",
    }
    try:
        r = requests.get(url, params=params, timeout=15)
        if r.status_code == 200:
            return r.json()
        else:
            print(f"  [{sport}] API error {r.status_code}: {r.text[:100]}")
            return []
    except Exception as e:
        print(f"  [{sport}] Request error: {e}")
        return []


def main():
    print(f"=== Daily Pick Emailer — {date.today()} ===")

    if not ODDS_API_KEY:
        print("ERROR: ODDS_API_KEY env var not set.")
        sys.exit(1)
    if not RESEND_KEY:
        print("ERROR: RESEND_API_KEY env var not set.")
        sys.exit(1)

    # 1. Load live odds
    print("Loading live odds...")
    games_by_sport = {}
    for sport in PRIORITY_SPORTS:
        games = fetch_games(sport)
        if games:
            games_by_sport[sport] = games
            print(f"  {sport}: {len(games)} games")

    if not games_by_sport:
        print("No games found. Exiting.")
        sys.exit(0)

    # 2. Find pick of the day
    pick = pick_of_the_day(games_by_sport)
    if not pick:
        print("No qualifying pick found (not enough bookmaker coverage). Exiting.")
        sys.exit(0)

    print(f"\nPick of the Day: {pick['pick']} ({pick['game']})")
    print(f"  Odds: {pick['odds']:+d} @ {pick['book']}")
    print(f"  Edge: +{pick['edge']:.1f}%  |  Implied: {pick['implied_prob']}%")

    # 3. Load subscribers
    subs = load_subscribers()
    print(f"\nSubscribers: {len(subs)}")
    if not subs:
        print("No subscribers. Logging pick anyway.")
        log_pick(pick, sent_count=0)
        sys.exit(0)

    # 4. Build email
    subject   = f"🏀 Pick of the Day — {date.today().strftime('%B %d, %Y')}"
    html_body = build_email_html(pick)
    text_body = build_email_text(pick)

    # 5. Send
    client  = ResendClient(RESEND_KEY)
    emails  = [s["email"] for s in subs]
    print(f"\nSending to {len(emails)} subscriber(s)...")

    results = client.send_blast(emails, subject, html_body, text_body)
    print(f"  Sent:   {results['sent']}")
    print(f"  Failed: {results['failed']}")
    if results["errors"]:
        for err in results["errors"]:
            print(f"  ERROR: {err}")

    # 6. Log
    log_pick(pick, sent_count=results["sent"])
    print(f"\nDone. Pick logged to picks_history.json")


if __name__ == "__main__":
    main()
