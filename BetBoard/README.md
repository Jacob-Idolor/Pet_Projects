# 🏆 BetBoard

**Real-time sports betting analytics dashboard** — compare odds from 8+ sportsbooks, find value bets, track your picks, and build a newsletter audience.

Built with [Streamlit](https://streamlit.io) + [The Odds API](https://the-odds-api.com).

![Python](https://img.shields.io/badge/Python-3.10+-blue?logo=python)
![Streamlit](https://img.shields.io/badge/Streamlit-1.32+-red?logo=streamlit)
![License](https://img.shields.io/badge/License-MIT-green)

---

## Features

| Tab | What it does |
|-----|-------------|
| 📅 **Today** | Live odds comparison across 8+ books with edge indicators |
| 📌 **Watchlist** | Save games you're tracking |
| 🔬 **Analysis** | Value bets, arbitrage scanner, EV calculator, Kelly criterion, odds charts |
| 🎯 **Props** | Player prop comparisons |
| 🏆 **Scores** | Live & recent scores |
| 📝 **My Bets** | Full ticket tracker with straight bets, parlays, P&L charts |
| 📧 **Newsletter** | Pick-of-the-day generator + subscriber management + email blasts |
| 💬 **Feedback** | Built-in feedback form with admin view |

**Supported sports:** NBA, NCAAB (March Madness), NFL, MLB, NHL, MLS, UFC, and more.

---

## Quick Start

### 1. Clone & install

```bash
git clone https://github.com/YOUR_USERNAME/betboard.git
cd betboard
pip install -r requirements_sports.txt
```

### 2. Configure the server (one-time)

Visitors use the site with **no API key input** — you set one key on the server and everyone gets access.

Create `.streamlit/secrets.toml` (or use `.env` in the project root) and set your Odds API key:

```toml
ODDS_API_KEY = "your_key_here"
```

Get a free key at [the-odds-api.com](https://the-odds-api.com). Access is server-configured (one key for all visitors); no user key input.

### 3. Run

```bash
streamlit run sports_analysis_dashboard.py
```

Open [http://localhost:8517](http://localhost:8517) in your browser.

---

## Newsletter Setup (Optional)

BetBoard can send daily pick emails to subscribers via **Resend** or **Brevo** (both have free tiers).

1. Sign up at [resend.com](https://resend.com) or [brevo.com](https://www.brevo.com)
2. Add the API key to `.streamlit/secrets.toml`
3. Use the **📧 Newsletter** tab to compose and send

**Automate daily emails** with GitHub Actions — see the included `.github/workflows/daily_pick.yml` workflow.

---

## Project Structure

```
├── sports_analysis_dashboard.py   # Main app
├── newsletter.py                  # Newsletter engine + Resend client
├── send_daily_pick.py             # Standalone daily email script
├── requirements_sports.txt        # Python dependencies
├── config.toml                    # Theme & server config
├── secrets.toml.example          # Template for secrets (copy to .streamlit/secrets.toml)
├── .env.example                  # Template for .env (optional; copy to .env)
├── .streamlit/
│   └── secrets.toml              # API keys (gitignored; create from secrets.toml.example)
├── .gitignore
├── CHANGELOG.md
└── (guides and business docs live in `private/` — gitignored, not pushed)
```

---

## Deploy

**Streamlit Cloud (free):**
1. Push this repo to GitHub
2. Go to [share.streamlit.io](https://share.streamlit.io)
3. Select this repo → `sports_analysis_dashboard.py`
4. Add `ODDS_API_KEY` (and optional `RESEND_API_KEY`, `BREVO_API_KEY`) in Settings → Secrets so visitors get full access with no key input
5. Done — you get a public URL

For detailed deploy steps (Railway, Render, custom domain), see your local `private/` folder (DEPLOYMENT_GUIDE.md, DEPLOY_CHECKLIST.md).

---

## Tech Stack

- **Frontend:** Streamlit + Plotly charts + custom CSS
- **Data:** The Odds API v4 (real-time odds from 8+ sportsbooks)
- **Email:** Resend and/or Brevo (dual provider support)
- **Automation:** GitHub Actions (daily pick emails)

---

## License

MIT — do whatever you want with it.
