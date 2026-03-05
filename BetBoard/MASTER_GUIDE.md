# 🏀 Sports Betting Analytics — Master Guide
**Last updated: March 4, 2026**

> Everything you need to run, deploy, and monetize this tool — in one place.
> For detailed guides, see the companion docs listed below.

### Companion Guides (NEW)
| Guide | What It Covers |
|-------|---------------|
| [DEPLOYMENT_GUIDE.md](DEPLOYMENT_GUIDE.md) | Step-by-step hosting: Streamlit Cloud, Railway, Render, custom domain, Cloudflare, GitHub Actions, security checklist |
| [MONETIZATION_PLAYBOOK.md](MONETIZATION_PLAYBOOK.md) | Passive income strategy: affiliates, ads, premium tier, sponsorships, digital products, 90-day launch plan, revenue projections |
| [USER_GUIDE.md](USER_GUIDE.md) | How every tab works, how to read odds/edge/EV, March Madness game plan, NBA/NFL strategy, the pick algorithm explained |

---

## Table of Contents
1. [What You Have](#1-what-you-have)
2. [File Inventory](#2-file-inventory)
3. [Running Locally](#3-running-locally)
4. [Hosting Cost Breakdown](#4-hosting-cost-breakdown)
5. [Deploy to the Internet (Streamlit Cloud)](#5-deploy-to-the-internet-streamlit-cloud)
6. [Newsletter Setup (Resend.com)](#6-newsletter-setup-resendcom)
7. [Monetization Roadmap](#7-monetization-roadmap)
8. [Moving to a Personal Computer](#8-moving-to-a-personal-computer)
9. [API Keys & Credentials](#9-api-keys--credentials)
10. [Troubleshooting](#10-troubleshooting)

---

## 1. What You Have

A fully functional **sports betting companion app** built with Python + Streamlit. Current version: **v9.0**.

### App Tabs
| Tab | What It Does |
|-----|-------------|
| 📅 Today's Board | Live odds from 8+ books side-by-side. Pin any game to Watchlist. Inline arbitrage alerts. March Madness banner. |
| 📌 Watchlist | Your pinned games tracked at the top. |
| � Analysis | 5 sub-tabs: 💎 Value Bets, ⚖️ Arbitrage, 🧮 EV Calculator, 📐 Kelly Criterion, 📈 Odds Chart |
| 🎯 Player Props | Over/Under comparison across all books. Best price highlighted. |
| 🏆 Scores | Live scores, final results, upcoming games. |
| 📝 My Bets | Full ticket tracker — straight bets AND parlays. Sportsbook, ticket #, per-leg status, live P&L. |
| 📧 Newsletter | Auto-generated "Pick of the Day" emailer. Resend + Brevo providers. Subscriber management. |
| 💬 Feedback | Feature requests, bug reports, general feedback. Saved locally. Admin view + CSV export. |

### Key Features
- **NBA + NCAAB default** — March Madness ready
- **Dark mobile-responsive UI** — works on phone and laptop
- **Parlay tracker** — 2–12 legs, per-leg status (Won/Lost/Push/Active)
- **P&L dashboard** — net profit, ROI, win rate, record at a glance
- **Pick of the Day algorithm** — finds highest-edge bet from live odds, sends via email
- **Real-time odds** from The Odds API (FanDuel, DraftKings, BetMGM, Caesars, and more)

---

## 2. File Inventory

### Core Application Files (keep these)
```
MISC/
├── sports_analysis_dashboard.py   ← Main app (~3,000 lines). Run this.
├── newsletter.py                  ← Newsletter module (pick algo, email builder, Resend client)
├── send_daily_pick.py             ← Standalone script for automated daily emails (cron/GitHub Actions)
├── requirements_sports.txt        ← Python dependencies
├── run_sports_dashboard.bat       ← Double-click to run on Windows
├── .streamlit/                    ← Streamlit config folder
│   ├── config.toml                ← Theme / server settings
│   └── secrets.toml               ← API keys (gitignored — never commit!)
├── MASTER_GUIDE.md                ← This file
├── DEPLOYMENT_GUIDE.md            ← Hosting + deploy instructions
├── MONETIZATION_PLAYBOOK.md       ← Passive income strategies
└── USER_GUIDE.md                  ← How to use every feature
```

### Generated at Runtime (don't commit to git)
```
subscribers.csv       ← Your newsletter subscriber list — BACK THIS UP
picks_history.json    ← Log of every Pick of the Day sent
feedback.json         ← User feedback submissions
email_preview.html    ← Preview of last generated email (safe to delete)
email_subscribers.csv ← Legacy subscriber file from old version
__pycache__/          ← Python bytecode cache (auto-generated, ignore)
```

### Can Be Deleted
```
Sports_Betting_Platform_COMPLETE_2026-03-03.zip   ← Old backup
Sports_Betting_Platform_Package_2026-03-03.zip    ← Old backup
_fix_tabs.py          ← One-time utility, no longer needed
MarchMadness&NBA.py   ← Early prototype, superseded by main dashboard
cheap_data_fetcher.py ← Early prototype, superseded
```

### Root folder (MouseyJiggler/)
```
.github/
└── workflows/
    └── daily_pick.yml   ← GitHub Actions: sends email every morning at 9 AM ET
```

---

## 3. Running Locally

### Prerequisites
- Python 3.11+ installed
- Internet connection (for live odds API)

### One-Time Setup
```powershell
cd "C:\path\to\MouseyJiggler\MISC"
pip install streamlit requests pandas plotly
```

### Start the Dashboard
```powershell
cd "C:\path\to\MouseyJiggler\MISC"
python -m streamlit run sports_analysis_dashboard.py --server.port 8517
```
Then open: **http://localhost:8517**

Or just double-click **`run_sports_dashboard.bat`** on Windows.

### Enter Your API Key
1. Open the app in browser
2. Expand the sidebar (← arrow, top left)
3. Paste your Odds API key: `YOUR_ODDS_API_KEY_HERE`
4. Green checkmark = ready. NBA + NCAAB load automatically.

---

## 4. Hosting Cost Breakdown

### Realistic cost at every stage of growth

| Stage | Users/day | Best Platform | Monthly Cost | Notes |
|-------|-----------|---------------|-------------|-------|
| **Just you** | 1 | Your laptop | $0 | Run locally, no hosting needed |
| **Sharing with friends** | 1–50 | Streamlit Community Cloud | **$0** | Free forever for public apps |
| **Small audience** | 50–500 | Streamlit Community Cloud | **$0** | Still free, 1 GB RAM limit |
| **Growing** | 500–2,000 | Railway.app Starter | **$5/mo** | More RAM, private repos, custom domain |
| **Serious** | 2,000–10,000 | Railway.app or Render Pro | **$15–20/mo** | 2 GB RAM, always-on |
| **Large** | 10,000+ | DigitalOcean Droplet | **$24/mo** | Full control, scalable |

### Full Cost Stack (most likely path)

**Phase 1 — Launch (FREE)**
```
Streamlit Community Cloud hosting:  $0/mo
The Odds API (500 calls/mo free):   $0/mo
Resend newsletter (3,000 emails/mo): $0/mo
GitHub (public repo):               $0/mo
Domain (.streamlit.app subdomain):  $0/mo
─────────────────────────────────────────
TOTAL PHASE 1:                      $0/mo
```

**Phase 2 — When you have an audience (~100 subscribers)**
```
Streamlit Community Cloud:          $0/mo  (still free)
The Odds API (paid, ~5k calls/mo):  $0/mo  (still on free tier if careful)
Resend (up to 3,000 emails/mo):     $0/mo  (still free)
Custom domain (e.g. mypicks.com):   $1/mo  (~$12/year from Namecheap)
─────────────────────────────────────────
TOTAL PHASE 2:                      $1/mo
```

**Phase 3 — Scaling (500+ subscribers, real traffic)**
```
Railway.app Starter hosting:        $5/mo
The Odds API Developer tier:        $79/mo  (10,000 calls/mo)
Resend Pro (50,000 emails/mo):      $20/mo
Custom domain:                      $1/mo
─────────────────────────────────────────
TOTAL PHASE 3:                      ~$105/mo
```
At this stage you should be earning $500–2,000+/mo from affiliates + subscriptions,
so the $105/mo overhead is well covered.

**Phase 4 — Full production (1,000+ subscribers, real revenue)**
```
DigitalOcean $24 Droplet (2 CPU/4GB): $24/mo
The Odds API Professional:            $199/mo  (100,000 calls/mo)
Resend Business:                      $90/mo   (100,000 emails/mo)
Custom domain + SSL:                  $1/mo
Cloudflare (CDN + DDoS protection):   $0/mo    (free tier)
─────────────────────────────────────────────
TOTAL PHASE 4:                        ~$314/mo
```
Revenue at this scale: $3,000–15,000+/mo from affiliates/subscriptions/sponsorships.

### The Odds API Pricing (your primary cost driver)
| Tier | Price | Calls/Month | Best For |
|------|-------|------------|---------|
| Free | $0 | 500 | Development / personal use |
| Starter | $39/mo | 3,000 | Small audience |
| Developer | $79/mo | 10,000 | Growing newsletter |
| Professional | $199/mo | 100,000 | Production |

> **Key tip:** Cache aggressively. The app already caches for 10 minutes (`@st.cache_data(ttl=600)`).
> At 10-minute intervals with 5 sports: 5 calls × 144 intervals/day = 720 calls/day max.
> Stay on free tier by limiting refresh frequency and number of sports loaded.

---

## 5. Deploy to the Internet (Streamlit Cloud)

### Step 1 — Create a GitHub Repository

```powershell
# From the MISC folder
cd "C:\Users\jacob.idolor\OneDrive - Farmers Insurance Group\Documents\MouseyJiggler\MISC"

git init
git add sports_analysis_dashboard.py newsletter.py send_daily_pick.py requirements_sports.txt run_sports_dashboard.bat .streamlit/ .gitignore
git commit -m "Sports betting dashboard v9.0 - March Madness 2026"
```

Then on GitHub.com:
1. **github.com/new** → Name: `march-madness-picks` → Public → Create
2. Copy the repo URL (e.g. `https://github.com/yourusername/march-madness-picks.git`)

```powershell
git remote add origin https://github.com/yourusername/march-madness-picks.git
git branch -M main
git push -u origin main
```

### Step 2 — Deploy on Streamlit Community Cloud

1. Go to **[share.streamlit.io](https://share.streamlit.io)**
2. Sign in with your GitHub account
3. Click **"New app"**
4. Select your repo → Branch: `main` → Main file: `sports_analysis_dashboard.py`
5. Click **"Deploy"** (takes ~3 minutes)

Your app gets a permanent public URL:
`https://yourusername-march-madness-picks.streamlit.app`

### Step 3 — Add Secrets (API Keys)

In Streamlit Cloud dashboard → your app → **⚙️ Settings → Secrets**:

```toml
ODDS_API_KEY     = "YOUR_ODDS_API_KEY_HERE"
RESEND_API_KEY   = "re_your_key_here"
BREVO_API_KEY    = "xkeysib-your_key_here"
NEWSLETTER_FROM  = "picks@yourdomain.com"
```

The app reads these automatically via `st.secrets.get()` → `os.environ.get()` fallback.

### Step 4 — Set Up GitHub Actions (Daily Email Automation)

The file `.github/workflows/daily_pick.yml` is already created in the repo root.
Add these secrets to GitHub:
- **Repo → Settings → Secrets and variables → Actions → New secret**
- Add: `RESEND_API_KEY` and `ODDS_API_KEY`

The workflow runs every morning at 9 AM ET automatically.
You can also trigger it manually from **GitHub → Actions → "Send Daily Pick Email" → Run workflow**.

---

## 6. Newsletter Setup (Resend.com + Brevo)

### Email Provider Options

BetBoard supports **two** free email providers — switch between them in the sidebar:

| Provider | Free Tier | Best For |
|----------|----------|---------|
| **Brevo** (Sendinblue) | 9,000 emails/month (300/day) | Starting out (3× more free emails) |
| **Resend** | 3,000 emails/month | Scaling up (simpler API, better deliverability) |

### Get Your Resend API Key (2 minutes)
1. **[resend.com](https://resend.com)** → Sign up free
2. Dashboard → **API Keys** → **Create API Key**
3. Name it `betting-picks`, permissions: **Sending access**
4. Copy: looks like `re_aBcDeFgH...`
5. Paste it into the **Resend API Key** field in the dashboard sidebar

### Free Tier Limits
- **3,000 emails/month** — enough for ~100 subscribers at daily sends
- **100 emails/day** — no problem until you hit 100 subscribers
- **1 sending domain** — or use `onboarding@resend.dev` for free (test mode)

### Add a Custom Domain (optional, makes emails look professional)
1. Resend dashboard → **Domains** → **Add Domain**
2. Enter: `picks.yourdomain.com` (or any subdomain)
3. Add the 3 DNS TXT records Resend shows you (takes 5 min in your registrar)
4. Set `NEWSLETTER_FROM = "Daily Picks <picks@yourdomain.com>"` in Streamlit secrets

### Using the Newsletter Tab
1. Open the app → **📧 Newsletter** tab
2. Enter your Resend API key in the sidebar — watch for green checkmark
3. Load live odds (enter Odds API key) — the Pick of the Day auto-generates
4. **Preview** the email HTML before sending
5. Add subscribers manually in the tab OR share your app URL
6. Use **"Send test to [your email]"** first to verify it looks right
7. **"Send to ALL subscribers"** has a confirmation gate so you can't accident-blast

### How the Pick Algorithm Works
1. Pulls all loaded games across selected sports
2. For each game, collects every bookmaker's h2h (moneyline) odds
3. Calculates **edge** = difference between best available price and market average implied probability
4. Ranks all candidates by edge (highest = most value vs. market consensus)
5. Prioritizes **NCAAB > NBA > NHL > MLB** when edge scores are tied
6. The #1 result is the Pick of the Day

---

## 7. Monetization Roadmap

### Affiliate Links (Start Immediately — Zero Subscribers Needed)
Add referral links in the sidebar and every email. Sportsbooks pay per depositing user:

| Sportsbook | Affiliate Program | Payout per Signup |
|------------|------------------|-------------------|
| FanDuel | partners.fanduel.com | $50–100 |
| DraftKings | affiliates.draftkings.com | $50–100 |
| BetMGM | betmgm.com/affiliates | $100–200 |
| Caesars | caesars.com/affiliates | $100–150 |
| ESPN Bet | — | $50–75 |

Apply to 2–3 programs. Replace the placeholder links in the sidebar with your real affiliate URLs.

### Paid Newsletter Tier (At 100+ Subscribers)
- **Free tier:** 1 pick/day (what exists now)
- **Pro tier ($5–10/mo):** 3 picks/day + parlay suggestion + early AM delivery
- Use **Stripe** for payments: `stripe.com` → free to create, 2.9% + 30¢ per transaction
- Gate the extra picks behind a Stripe-verified email in the subscriber list

### Sponsorships (At 500+ Subscribers)
- Sports betting tools and services pay $100–500 per newsletter blast
- Post your stats publicly: "500 subscribers, 40% open rate, March Madness focus"
- Outreach template: "I run a daily picks newsletter for NBA/NCAAB bettors. Would you be interested in a sponsored placement?"

### Sell the Subscriber List / Course (At 1,000+ Subscribers)
- The list itself is worth $1–5 per subscriber per month to the right buyer
- A "How I Pick Winners" course on Gumroad: $29–99 one-time
- Both are passive once set up

---

## 8. Moving to a Personal Computer

> This is the key section for working from your work computer now and moving later.

### What to Transfer

**Everything you need lives in two folders:**
```
MouseyJiggler/
├── MISC/                          ← The entire app lives here
│   ├── sports_analysis_dashboard.py
│   ├── newsletter.py
│   ├── send_daily_pick.py
│   ├── requirements_sports.txt
│   ├── run_sports_dashboard.bat
│   ├── .streamlit/
│   ├── subscribers.csv            ← YOUR DATA — don't forget this
│   ├── picks_history.json         ← YOUR DATA — don't forget this
│   └── MASTER_GUIDE.md
└── .github/
    └── workflows/
        └── daily_pick.yml
```

### Option A — Transfer via GitHub (Recommended)
Once you push to GitHub (Step 5 above), on any new computer:
```bash
git clone https://github.com/yourusername/march-madness-picks.git
cd march-madness-picks
pip install -r requirements_sports.txt
python -m streamlit run sports_analysis_dashboard.py --server.port 8517
```
Done. The app is fully running on the new machine in under 5 minutes.

> **Important:** `subscribers.csv` and `picks_history.json` are in `.gitignore` (personal data).
> Copy these files manually via USB, email to yourself, or save in OneDrive/Google Drive separately.

### Option B — Copy via OneDrive / USB
Since you're on OneDrive now, the files are already syncing:
1. On your personal computer: open OneDrive → navigate to `Documents/MouseyJiggler/MISC`
2. Install Python 3.11+ from python.org
3. Run: `pip install streamlit requests pandas plotly`
4. Run: `python -m streamlit run sports_analysis_dashboard.py`

### Personal Computer Setup Checklist
- [ ] Python 3.11+ installed (python.org)
- [ ] VS Code installed (code.visualstudio.com) — optional but recommended
- [ ] Run `pip install streamlit requests pandas plotly` in terminal
- [ ] Copy `subscribers.csv` and `picks_history.json` if you have them
- [ ] Test: `python -m streamlit run sports_analysis_dashboard.py --server.port 8517`
- [ ] Open `http://localhost:8517` — enter API key — confirm data loads

### Work Computer Notes
- Your files are in OneDrive → they sync automatically across devices if OneDrive is installed
- The `.venv` folder does NOT need to transfer — just run `pip install` on the new machine
- The `__pycache__` folder does NOT need to transfer
- The two `.zip` backup files don't need to transfer (old versions)

---

## 9. API Keys & Credentials

### Keep These Safe
| Service | Key / Value | Where to Enter |
|---------|------------|----------------|
| The Odds API | `YOUR_ODDS_API_KEY_HERE` | Dashboard sidebar |
| Resend (get yours) | `re_xxxxxxxxxx` | Dashboard sidebar / Streamlit secrets |
| Brevo (get yours) | `xkeysib-xxxxxxxxxx` | Dashboard sidebar / Streamlit secrets |

### Remaining Free Credits
- **The Odds API:** Started with 500/month. ~36 used in testing. Check remaining in dashboard sidebar after loading odds.
- **Resend:** 3,000/month. 0 used (just set up).
- **Brevo:** 9,000/month (300/day). 0 used (just set up).

### Where Keys Live in Production
When deployed to Streamlit Cloud, keys go in **Secrets** (never in code):
```toml
# Streamlit Cloud Settings → Secrets
ODDS_API_KEY    = "YOUR_ODDS_API_KEY_HERE"
RESEND_API_KEY  = "re_your_key_here"
BREVO_API_KEY   = "xkeysib-your_key_here"
NEWSLETTER_FROM = "picks@yourdomain.com"
```

The app reads them with `st.secrets.get()` → `os.environ.get()` fallback — no hardcoding.

---

## 10. Troubleshooting

### Dashboard won't start
```powershell
# Kill any stuck Python processes first
Get-Process -Name "python" -ErrorAction SilentlyContinue | Stop-Process -Force

# Then restart
cd "path\to\MISC"
python -m streamlit run sports_analysis_dashboard.py --server.port 8517
```

### "No module named streamlit" error
```powershell
pip install streamlit requests pandas plotly
```

### "Invalid API Key" in the dashboard
- Make sure there are no spaces before/after the key
- Test it directly: open the browser and go to:
  `https://api.the-odds-api.com/v4/sports?apiKey=YOUR_ODDS_API_KEY_HERE`
  If you see JSON data, the key is valid.

### No games showing up
- The Odds API only shows games that have active odds (usually within 7 days)
- During off-season: fewer games. Check `https://api.the-odds-api.com/v4/sports?apiKey=YOUR_KEY` to see active sports.
- March Madness (NCAAB) odds typically appear ~1 week before tournament games.

### Newsletter not sending
- Verify Resend API key — sidebar shows green ✅ if valid
- Check that you have at least 1 subscriber in the list
- Send a test to yourself first before blasting the full list
- If `onboarding@resend.dev` domain: only sends to verified addresses on Resend free plan (add test emails in Resend dashboard)

### Port already in use
```powershell
# Try a different port
python -m streamlit run sports_analysis_dashboard.py --server.port 8520
```

### Moving to personal computer — app won't load data
- The `.streamlit/secrets.toml` file is gitignored — you need to re-enter the API key in the sidebar
- Or create `.streamlit/secrets.toml` manually with your keys (see Section 9)

---

## Quick Reference — Commands

```powershell
# Run the app
python -m streamlit run sports_analysis_dashboard.py --server.port 8517

# Test newsletter module
python newsletter.py   # generates email_preview.html

# Send today's pick manually (needs RESEND_API_KEY env var)
$env:RESEND_API_KEY = "re_your_key"
$env:ODDS_API_KEY   = "YOUR_ODDS_API_KEY_HERE"
python send_daily_pick.py

# Syntax check
python -c "import ast; ast.parse(open('sports_analysis_dashboard.py', encoding='utf-8').read()); print('OK')"

# Kill running instances
Get-Process -Name "python" | Stop-Process -Force
```

---

*Gambling involves risk. 21+ only. If you have a gambling problem, call 1-800-522-4700.*
