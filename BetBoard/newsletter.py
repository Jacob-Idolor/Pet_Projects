"""
Pick of the Day Newsletter System
====================================
Uses Resend.com (free tier: 3,000 emails/month) to deliver a daily
"Pick of the Day" email to subscribers.

Setup (5 minutes):
  1. Sign up free at https://resend.com
  2. Get your API key from https://resend.com/api-keys
  3. Add a sending domain OR use the free sandbox (onboarding@resend.dev)
  4. Set env var: RESEND_API_KEY=
  5. Set env var: NEWSLETTER_FROM=picks@yourdomain.com  (or leave default)

Subscriber list is stored locally in subscribers.csv
(replace with Resend Audiences API call when you want cloud storage)
"""

import os
import csv
import json
import requests
from datetime import datetime, date
from typing import List, Dict, Optional, Tuple
import math


# ── Config ────────────────────────────────────────────────────────────────────
RESEND_API_URL   = "https://api.resend.com/emails"
RESEND_BATCH_URL = "https://api.resend.com/emails/batch"
SUBSCRIBERS_FILE = "subscribers.csv"
PICKS_LOG_FILE   = "picks_history.json"

DEFAULT_FROM     = os.environ.get("NEWSLETTER_FROM", "BettingPicks <onboarding@resend.dev>")
DEFAULT_SUBJECT  = f"🏀 Pick of the Day — {date.today().strftime('%B %d, %Y')}"


# ── Subscriber management ─────────────────────────────────────────────────────

def load_subscribers() -> List[Dict]:
    """Load subscriber list from CSV."""
    subs = []
    if not os.path.isfile(SUBSCRIBERS_FILE):
        return subs
    with open(SUBSCRIBERS_FILE, "r", newline="", encoding="utf-8") as f:
        reader = csv.DictReader(f)
        for row in reader:
            if row.get("active", "true").lower() == "true":
                subs.append(row)
    return subs


def save_subscriber(email: str, name: str = "") -> Tuple[bool, str]:
    """Add a new subscriber. Returns (success, message)."""
    email = email.strip().lower()
    if "@" not in email or "." not in email.split("@")[-1]:
        return False, "Invalid email address."

    existing = load_subscribers()
    all_emails = [s.get("email", "").lower() for s in existing]
    if email in all_emails:
        return False, "Already subscribed!"

    file_exists = os.path.isfile(SUBSCRIBERS_FILE)
    with open(SUBSCRIBERS_FILE, "a", newline="", encoding="utf-8") as f:
        writer = csv.DictWriter(f, fieldnames=["email", "name", "subscribed_at", "active"])
        if not file_exists:
            writer.writeheader()
        writer.writerow({
            "email": email,
            "name": name,
            "subscribed_at": datetime.now().isoformat(),
            "active": "true"
        })
    return True, f"✅ Subscribed! {email} added to the list."


def unsubscribe(email: str) -> Tuple[bool, str]:
    """Mark subscriber as inactive."""
    email = email.strip().lower()
    subs = []
    found = False
    if not os.path.isfile(SUBSCRIBERS_FILE):
        return False, "Email not found."

    with open(SUBSCRIBERS_FILE, "r", newline="", encoding="utf-8") as f:
        reader = csv.DictReader(f)
        for row in reader:
            if row.get("email", "").lower() == email:
                row["active"] = "false"
                found = True
            subs.append(row)

    if not found:
        return False, "Email not found in subscriber list."

    with open(SUBSCRIBERS_FILE, "w", newline="", encoding="utf-8") as f:
        writer = csv.DictWriter(f, fieldnames=["email", "name", "subscribed_at", "active"])
        writer.writeheader()
        writer.writerows(subs)

    return True, f"Unsubscribed {email}."


def subscriber_count() -> int:
    return len(load_subscribers())


# ── Pick algorithm ────────────────────────────────────────────────────────────

def implied_probability(american_odds: int) -> float:
    """Convert American odds to implied probability."""
    if american_odds >= 0:
        return 100 / (american_odds + 100)
    else:
        return abs(american_odds) / (abs(american_odds) + 100)


def calculate_edge(best_odds: int, book_count: int, all_odds: List[int]) -> float:
    """
    Edge = difference between best available price and market average.
    Higher = more value relative to the market consensus.
    """
    if not all_odds:
        return 0.0
    avg_implied = sum(implied_probability(o) for o in all_odds) / len(all_odds)
    best_implied = implied_probability(best_odds)
    return round((avg_implied - best_implied) * 100, 2)  # % edge


def pick_of_the_day(games_by_sport: Dict) -> Optional[Dict]:
    """
    Scan all loaded games and return the single best-value pick.
    Algorithm:
      1. For every game's h2h market, find the team with the highest edge
         (i.e., best odds vs. market average = most value)
      2. Prefer NBA / NCAAB when scores are equal (March Madness priority)
      3. Prefer favorites with positive edge (lower risk, still value)
    Returns a dict with pick details, or None if no games.
    """
    candidates = []
    sport_priority = {
        "basketball_ncaab": 3,
        "basketball_nba": 2,
        "icehockey_nhl": 1,
        "baseball_mlb": 0,
        "americanfootball_nfl": 0,
    }

    for sport_key, games in games_by_sport.items():
        for game in games:
            away = game.get("away_team", "")
            home = game.get("home_team", "")
            bookmakers = game.get("bookmakers", [])
            if len(bookmakers) < 3:
                continue  # skip games with sparse coverage

            # Collect all h2h moneyline odds for both teams
            away_odds_list, home_odds_list = [], []
            for bm in bookmakers:
                for mkt in bm.get("markets", []):
                    if mkt["key"] == "h2h":
                        for o in mkt.get("outcomes", []):
                            if o.get("name") == away:
                                away_odds_list.append(o["price"])
                            elif o.get("name") == home:
                                home_odds_list.append(o["price"])

            if not away_odds_list or not home_odds_list:
                continue

            # Best available odds for each team
            best_away = max(away_odds_list)
            best_home = max(home_odds_list)

            # Edge calculation
            away_edge = calculate_edge(best_away, len(bookmakers), away_odds_list)
            home_edge = calculate_edge(best_home, len(bookmakers), home_odds_list)

            # Best edge team
            if away_edge >= home_edge:
                pick_team, pick_odds, pick_edge, pick_role = away, best_away, away_edge, "Away"
            else:
                pick_team, pick_odds, pick_edge, pick_role = home, best_home, home_edge, "Home"

            # Find which book has the best price
            best_book = "—"
            for bm in bookmakers:
                for mkt in bm.get("markets", []):
                    if mkt["key"] == "h2h":
                        for o in mkt.get("outcomes", []):
                            if o.get("name") == pick_team and o.get("price") == pick_odds:
                                best_book = bm.get("title", bm.get("key", "—"))

            # Book count (consensus strength)
            book_count = len(bookmakers)

            candidates.append({
                "sport":       sport_key,
                "game":        f"{away} @ {home}",
                "away":        away,
                "home":        home,
                "pick":        pick_team,
                "pick_role":   pick_role,
                "odds":        pick_odds,
                "edge":        pick_edge,
                "book":        best_book,
                "book_count":  book_count,
                "commence":    game.get("commence_time", ""),
                "priority":    sport_priority.get(sport_key, 0),
                "implied_prob": round(implied_probability(pick_odds) * 100, 1),
                "event_id":    game.get("id", ""),
            })

    if not candidates:
        return None

    # Sort: highest edge first, then by sport priority, then by book coverage
    candidates.sort(key=lambda x: (x["edge"], x["priority"], x["book_count"]), reverse=True)
    return candidates[0]


def format_american_odds(price: int) -> str:
    return f"+{price}" if price > 0 else str(price)


# ── Email HTML builder ─────────────────────────────────────────────────────────

def build_email_html(pick: Dict, extra_picks: List[Dict] = None,
                     unsubscribe_url: str = "#") -> str:
    """
    Generate a polished dark-theme HTML email for the pick of the day.
    Compatible with Gmail, Apple Mail, Outlook.
    """
    today = date.today().strftime("%B %d, %Y")
    sport_icons = {
        "basketball_nba": "🏀",
        "basketball_ncaab": "🎓",
        "icehockey_nhl": "🏒",
        "baseball_mlb": "⚾",
        "americanfootball_nfl": "🏈",
    }
    sport_names = {
        "basketball_nba": "NBA",
        "basketball_ncaab": "NCAA Basketball",
        "icehockey_nhl": "NHL",
        "baseball_mlb": "MLB",
        "americanfootball_nfl": "NFL",
    }
    sport_icon = sport_icons.get(pick["sport"], "🏆")
    sport_name = sport_names.get(pick["sport"], pick["sport"])
    odds_str   = format_american_odds(pick["odds"])
    edge_str   = f"+{pick['edge']:.1f}%" if pick["edge"] > 0 else f"{pick['edge']:.1f}%"

    # Build bonus picks rows
    bonus_rows = ""
    if extra_picks:
        for ep in extra_picks[:3]:  # max 3 bonus picks
            eicon = sport_icons.get(ep["sport"], "🏆")
            eodds = format_american_odds(ep["odds"])
            bonus_rows += f"""
            <tr>
              <td style="padding:10px 16px;border-bottom:1px solid #262730;font-size:14px;color:#fafafa;">
                {eicon} {ep['game']}
              </td>
              <td style="padding:10px 16px;border-bottom:1px solid #262730;font-size:14px;color:#fafafa;">
                <strong>{ep['pick']}</strong>
              </td>
              <td style="padding:10px 16px;border-bottom:1px solid #262730;font-size:14px;color:#09ab3b;font-weight:700;">
                {eodds}
              </td>
              <td style="padding:10px 16px;border-bottom:1px solid #262730;font-size:14px;color:#a0a0a0;">
                {ep['book']}
              </td>
            </tr>"""

    bonus_section = ""
    if bonus_rows:
        bonus_section = f"""
        <div style="margin:0 auto 24px;max-width:600px;">
          <h2 style="color:#fafafa;font-size:16px;margin:0 0 12px;padding:0 8px;">
            📋 Also Worth Watching
          </h2>
          <table width="100%" cellpadding="0" cellspacing="0" style="background:#1a1d24;border-radius:10px;overflow:hidden;">
            <thead>
              <tr style="background:#262730;">
                <th style="padding:10px 16px;text-align:left;color:#a0a0a0;font-size:12px;letter-spacing:1px;">GAME</th>
                <th style="padding:10px 16px;text-align:left;color:#a0a0a0;font-size:12px;letter-spacing:1px;">PICK</th>
                <th style="padding:10px 16px;text-align:left;color:#a0a0a0;font-size:12px;letter-spacing:1px;">ODDS</th>
                <th style="padding:10px 16px;text-align:left;color:#a0a0a0;font-size:12px;letter-spacing:1px;">BEST AT</th>
              </tr>
            </thead>
            <tbody>{bonus_rows}</tbody>
          </table>
        </div>"""

    html = f"""<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width,initial-scale=1.0">
  <title>Pick of the Day — {today}</title>
</head>
<body style="margin:0;padding:0;background-color:#0e1117;font-family:-apple-system,BlinkMacSystemFont,'Segoe UI',Roboto,Arial,sans-serif;">

  <!-- Wrapper -->
  <table width="100%" cellpadding="0" cellspacing="0" style="background:#0e1117;padding:24px 0;">
    <tr><td align="center">

      <!-- Container -->
      <table width="600" cellpadding="0" cellspacing="0" style="max-width:600px;width:100%;">

        <!-- Header -->
        <tr>
          <td style="background:linear-gradient(135deg,#1a0a3d 0%,#2d0d5c 100%);
                     border-radius:12px 12px 0 0;padding:28px 32px;text-align:center;">
            <p style="margin:0;font-size:12px;letter-spacing:2px;color:#c084fc;font-weight:700;">
              DAILY SPORTS PICKS
            </p>
            <h1 style="margin:8px 0 4px;font-size:26px;color:#ffffff;font-weight:800;">
              🏆 Pick of the Day
            </h1>
            <p style="margin:0;font-size:14px;color:#a0a0a0;">{today}</p>
          </td>
        </tr>

        <!-- Main Pick Card -->
        <tr>
          <td style="background:#1a1d24;padding:28px 32px;">

            <p style="margin:0 0 6px;font-size:11px;letter-spacing:2px;color:#a0a0a0;font-weight:700;">
              TODAY'S TOP PICK
            </p>

            <!-- Pick box -->
            <div style="background:linear-gradient(135deg,#0d3d2d 0%,#1a1d24 100%);
                        border-left:5px solid #09ab3b;border-radius:10px;
                        padding:20px 24px;margin:12px 0 20px;">
              <p style="margin:0 0 4px;font-size:13px;color:#a0a0a0;">
                {sport_icon} {sport_name} &nbsp;·&nbsp; {pick['game']}
              </p>
              <h2 style="margin:4px 0;font-size:28px;color:#ffffff;font-weight:800;">
                {pick['pick']}
              </h2>
              <p style="margin:4px 0 0;font-size:22px;color:#09ab3b;font-weight:700;">
                {odds_str}
                <span style="font-size:14px;color:#a0a0a0;font-weight:400;margin-left:12px;">
                  Best price @ {pick['book']}
                </span>
              </p>
            </div>

            <!-- Stats row -->
            <table width="100%" cellpadding="0" cellspacing="0">
              <tr>
                <td style="width:33%;text-align:center;padding:12px;
                           background:#262730;border-radius:8px;margin:4px;">
                  <p style="margin:0;font-size:11px;color:#a0a0a0;letter-spacing:1px;">EDGE vs MARKET</p>
                  <p style="margin:4px 0 0;font-size:22px;color:#09ab3b;font-weight:700;">{edge_str}</p>
                </td>
                <td style="width:4px;"></td>
                <td style="width:33%;text-align:center;padding:12px;
                           background:#262730;border-radius:8px;">
                  <p style="margin:0;font-size:11px;color:#a0a0a0;letter-spacing:1px;">IMPLIED PROB</p>
                  <p style="margin:4px 0 0;font-size:22px;color:#fafafa;font-weight:700;">{pick['implied_prob']}%</p>
                </td>
                <td style="width:4px;"></td>
                <td style="width:33%;text-align:center;padding:12px;
                           background:#262730;border-radius:8px;">
                  <p style="margin:0;font-size:11px;color:#a0a0a0;letter-spacing:1px;">BOOKS TRACKING</p>
                  <p style="margin:4px 0 0;font-size:22px;color:#fafafa;font-weight:700;">{pick['book_count']}</p>
                </td>
              </tr>
            </table>

            <!-- Disclaimer -->
            <p style="margin:20px 0 0;font-size:12px;color:#555;line-height:1.6;">
              ⚠️ This pick is generated algorithmically from live odds data. 
              It represents the best <em>value</em> relative to market consensus — not a guarantee.
              Always bet responsibly. 21+ only. If you have a gambling problem, call 1-800-522-4700.
            </p>
          </td>
        </tr>

        <!-- Bonus picks -->
        {f'<tr><td style="background:#0e1117;padding:0 32px 8px;">{bonus_section}</td></tr>' if bonus_section else ''}

        <!-- CTA -->
        <tr>
          <td style="background:#1a1d24;border-top:1px solid #262730;padding:24px 32px;text-align:center;">
            <p style="margin:0 0 12px;font-size:14px;color:#a0a0a0;">
              Want to track this pick live? Open the dashboard:
            </p>
            <a href="https://your-app.streamlit.app"
               style="display:inline-block;background:#ff4b4b;color:#ffffff;font-weight:700;
                      font-size:15px;padding:12px 28px;border-radius:8px;text-decoration:none;">
              📊 View Live Odds Dashboard →
            </a>
          </td>
        </tr>

        <!-- Footer -->
        <tr>
          <td style="background:#0e1117;border-radius:0 0 12px 12px;
                     padding:20px 32px;text-align:center;">
            <p style="margin:0;font-size:12px;color:#555;line-height:1.8;">
              You're receiving this because you subscribed to Daily Picks.<br>
              <a href="{unsubscribe_url}" style="color:#555;">Unsubscribe</a>
              &nbsp;·&nbsp;
              <a href="https://your-app.streamlit.app" style="color:#555;">View Dashboard</a>
            </p>
          </td>
        </tr>

      </table>
    </td></tr>
  </table>
</body>
</html>"""
    return html


def build_email_text(pick: Dict) -> str:
    """Plain-text fallback for the email."""
    today = date.today().strftime("%B %d, %Y")
    odds_str = format_american_odds(pick["odds"])
    return f"""PICK OF THE DAY — {today}
=====================================

TODAY'S TOP PICK:
  {pick['game']}
  ➡  {pick['pick']}  {odds_str}  (best at {pick['book']})

Edge vs market: +{pick['edge']:.1f}%
Implied probability: {pick['implied_prob']}%
Books tracked: {pick['book_count']}

⚠ Algorithmic pick based on live odds data. Bet responsibly. 21+ only.
Gambling problem? Call 1-800-522-4700.

--
Unsubscribe: reply STOP
Dashboard: https://your-app.streamlit.app
"""


# ── Resend sender ─────────────────────────────────────────────────────────────

class ResendClient:
    """Thin wrapper around the Resend email API."""

    def __init__(self, api_key: str):
        self.api_key = api_key
        self.headers = {
            "Authorization": f"Bearer {api_key}",
            "Content-Type":  "application/json",
        }

    def send_single(self, to: str, subject: str,
                    html: str, text: str,
                    from_addr: str = DEFAULT_FROM) -> Tuple[bool, str]:
        """Send a single email. Returns (success, message_id_or_error)."""
        payload = {
            "from":    from_addr,
            "to":      [to],
            "subject": subject,
            "html":    html,
            "text":    text,
        }
        try:
            r = requests.post(RESEND_API_URL, headers=self.headers,
                              json=payload, timeout=15)
            if r.status_code in (200, 201):
                return True, r.json().get("id", "sent")
            else:
                return False, f"HTTP {r.status_code}: {r.text[:200]}"
        except Exception as e:
            return False, str(e)

    def send_blast(self, recipients: List[str], subject: str,
                   html: str, text: str,
                   from_addr: str = DEFAULT_FROM) -> Dict:
        """
        Send to a list of recipients.
        Resend free tier: 100 emails/day in batch, 3,000/month.
        We chunk into batches of 50 to stay safe.
        Returns {sent: int, failed: int, errors: list}
        """
        results = {"sent": 0, "failed": 0, "errors": []}
        chunk_size = 50

        for i in range(0, len(recipients), chunk_size):
            chunk = recipients[i:i + chunk_size]
            # Build batch payload — one object per recipient
            batch = [
                {
                    "from":    from_addr,
                    "to":      [email],
                    "subject": subject,
                    "html":    html,
                    "text":    text,
                }
                for email in chunk
            ]
            try:
                r = requests.post(RESEND_BATCH_URL, headers=self.headers,
                                  json=batch, timeout=30)
                if r.status_code in (200, 201):
                    results["sent"] += len(chunk)
                else:
                    results["failed"] += len(chunk)
                    results["errors"].append(f"Chunk {i}: HTTP {r.status_code} {r.text[:100]}")
            except Exception as e:
                results["failed"] += len(chunk)
                results["errors"].append(str(e))

        return results

    def test_connection(self) -> Tuple[bool, str]:
        """Verify the API key works by checking domains."""
        try:
            r = requests.get("https://api.resend.com/domains",
                             headers=self.headers, timeout=10)
            ok = False
            msg = ""
            if r.status_code == 200:
                ok, msg = True, "API key valid ✅"
            elif r.status_code == 401:
                ok, msg = False, "Invalid API key ❌"
            else:
                ok, msg = False, f"HTTP {r.status_code}"
            return ok, msg
        except Exception as e:
            return False, str(e)


# ── Picks history logger ───────────────────────────────────────────────────────

def log_pick(pick: Dict, sent_count: int = 0):
    """Append today's pick to the picks history log."""
    history = []
    if os.path.isfile(PICKS_LOG_FILE):
        try:
            with open(PICKS_LOG_FILE, "r", encoding="utf-8") as f:
                history = json.load(f)
        except Exception:
            history = []

    history.append({
        "date":       date.today().isoformat(),
        "pick":       pick,
        "sent_to":    sent_count,
        "logged_at":  datetime.now().isoformat(),
    })

    with open(PICKS_LOG_FILE, "w", encoding="utf-8") as f:
        json.dump(history, f, indent=2)


def load_picks_history() -> List[Dict]:
    """Load all past picks."""
    if not os.path.isfile(PICKS_LOG_FILE):
        return []
    try:
        with open(PICKS_LOG_FILE, "r", encoding="utf-8") as f:
            return json.load(f)
    except Exception:
        return []


# ── Standalone test ────────────────────────────────────────────────────────────
if __name__ == "__main__":
    # Quick smoke test with a fake pick
    fake_pick = {
        "sport": "basketball_nba",
        "game": "Los Angeles Lakers @ Golden State Warriors",
        "away": "Los Angeles Lakers",
        "home": "Golden State Warriors",
        "pick": "Golden State Warriors",
        "pick_role": "Home",
        "odds": -115,
        "edge": 3.4,
        "book": "FanDuel",
        "book_count": 8,
        "commence": "2026-03-04T23:10:00Z",
        "priority": 2,
        "implied_prob": 53.5,
        "event_id": "test-123",
    }
    html = build_email_html(fake_pick)
    with open("email_preview.html", "w", encoding="utf-8") as f:
        f.write(html)
    print("✅ Email preview saved to email_preview.html")
    print("Open it in a browser to see how it looks!")
