# 🚀 BetBoard — Production Deployment Guide

**Last updated: March 4, 2026**

> Step-by-step instructions to take BetBoard from your laptop to the public internet — securely, cheaply, and ready for passive income.

---

## Table of Contents

1. [Deployment Overview — Which Platform?](#1-deployment-overview)
2. [Pre-Flight Checklist](#2-pre-flight-checklist)
3. [Option A — Streamlit Community Cloud (FREE, Recommended)](#3-option-a--streamlit-community-cloud)
4. [Option B — Railway.app ($5/mo, For Scale)](#4-option-b--railwayapp)
5. [Option C — Render.com ($7/mo, Alternative)](#5-option-c--rendercom)
6. [Custom Domain Setup](#6-custom-domain-setup)
7. [Cloudflare CDN + DDoS Protection (FREE)](#7-cloudflare-cdn--ddos-protection)
8. [GitHub Actions — Automated Daily Email](#8-github-actions--automated-daily-email)
9. [Security Hardening Checklist](#9-security-hardening-checklist)
10. [Monitoring & Uptime](#10-monitoring--uptime)
11. [Scaling Decision Tree](#11-scaling-decision-tree)

---

## 1. Deployment Overview

| Platform | Cost | Best For | Limits | Custom Domain |
|----------|------|----------|--------|---------------|
| **Streamlit Community Cloud** | **$0** | Launch, 1–500 users/day | 1 GB RAM, sleeps after 7 days idle | ✅ (CNAME) |
| **Railway.app** | **$5/mo** | Growing, 500–5,000 users/day | 8 GB RAM, always-on | ✅ |
| **Render.com** | **$7/mo** | Alternative to Railway | 2 GB RAM, auto-deploy | ✅ |
| **DigitalOcean** | **$24/mo** | Full control, 5,000+ users | 4 GB RAM, root access | ✅ |

**Start with Streamlit Community Cloud.** It's free, takes 5 minutes, and handles everything until you have real traffic. Move to Railway only when you outgrow it.

---

## 2. Pre-Flight Checklist

Before deploying, make sure these are done:

### Files You NEED in Your GitHub Repo
```
sports_analysis_dashboard.py   ← Main app (3,002 lines)
newsletter.py                  ← Newsletter module (591 lines)
send_daily_pick.py             ← Standalone daily email script
requirements_sports.txt        ← Python dependencies
.streamlit/config.toml         ← Theme config
.gitignore                     ← Keeps secrets/data out of git
```

### Files You Do NOT Commit
```
.streamlit/secrets.toml        ← Your API keys (gitignored)
subscribers.csv                ← User data (gitignored)
picks_history.json             ← Pick history (gitignored)
feedback.json                  ← User feedback (gitignored)
__pycache__/                   ← Python cache (gitignored)
*.zip                          ← Old backups (gitignored)
```

### Clean Up `requirements_sports.txt`
Your production dependencies (update the file to exactly this):

```
streamlit>=1.32.0
requests>=2.31.0
pandas>=2.2.0
plotly>=5.19.0
```

> Remove `beautifulsoup4`, `lxml`, and `selenium` — the app doesn't use them. Fewer dependencies = faster deploys and smaller attack surface.

---

## 3. Option A — Streamlit Community Cloud

**Cost: $0 forever** | **Time: 10 minutes** | **Best for: 0–500 users/day**

### Step 1 — Push Code to GitHub

If you haven't already:

```powershell
# Open a NEW terminal, navigate to your MISC folder
cd "C:\Users\jacob.idolor\OneDrive - Farmers Insurance Group\Documents\MouseyJiggler\MISC"

# Initialize git (skip if already done)
git init

# Stage only the files you need
git add sports_analysis_dashboard.py
git add newsletter.py
git add send_daily_pick.py
git add requirements_sports.txt
git add .streamlit/config.toml
git add .gitignore
git add MASTER_GUIDE.md

# Commit
git commit -m "BetBoard v9.0 - Production deploy"
```

Now create the repo on GitHub:

1. Go to **[github.com/new](https://github.com/new)**
2. **Repository name:** `betboard` (or `march-madness-picks`)
3. **Visibility:** Public (required for free Streamlit Cloud)
4. **Do NOT** initialize with README (you already have files)
5. Click **Create repository**

Then push:

```powershell
git remote add origin https://github.com/YOUR_USERNAME/betboard.git
git branch -M main
git push -u origin main
```

### Step 2 — Deploy on Streamlit Cloud

1. Go to **[share.streamlit.io](https://share.streamlit.io)**
2. Click **"Sign in"** → authenticate with your GitHub account
3. Click **"New app"**
4. Fill in:
   - **Repository:** `YOUR_USERNAME/betboard`
   - **Branch:** `main`
   - **Main file path:** `sports_analysis_dashboard.py`
5. Click **"Advanced settings"** → Python version: **3.11**
6. Click **"Deploy!"**

☕ Wait 2–4 minutes. Your app is now live at:

```
https://YOUR_USERNAME-betboard.streamlit.app
```

### Step 3 — Add Secrets (API Keys)

**CRITICAL — do this immediately after deploy:**

1. In the Streamlit Cloud dashboard, click your app → **⚙️ Settings**
2. Click **Secrets** tab
3. Paste this (replace placeholder values with your real keys):

```toml
ODDS_API_KEY = "YOUR_ODDS_API_KEY_HERE"
RESEND_API_KEY = "re_YOUR_RESEND_KEY_HERE"
BREVO_API_KEY = "xkeysib-YOUR_BREVO_KEY_HERE"
NEWSLETTER_FROM = "picks@yourdomain.com"
```

4. Click **Save** → the app will restart with keys loaded

The app reads these via `st.secrets.get()` → `os.environ.get()` → session fallback. No keys are ever in the code.

### Step 4 — Verify Everything Works

Open your public URL and check:

- [ ] App loads (BetBoard header, hero screen, 8 tabs)
- [ ] Sidebar → API key auto-populated from secrets
- [ ] Sports load (NBA, NCAAB data appears)
- [ ] Newsletter tab → Resend/Brevo shows green checkmark
- [ ] Feedback tab → submit a test entry
- [ ] My Bets tab → add a test bet
- [ ] Share the URL with a friend — confirm they can access it

### Streamlit Cloud Limits (Know Them)

| Limit | Value | Impact |
|-------|-------|--------|
| RAM | 1 GB | Enough for ~500 concurrent users |
| CPU | Shared | May slow under heavy load |
| Sleep | After 7 days idle with no viewers | Wakes up in ~30 seconds when visited |
| Apps | 3 free apps per account | Use 1 for BetBoard |
| Secrets | ✅ Built-in | Encrypted, not in code |
| Custom domain | ✅ CNAME | Point `picks.yourdomain.com` → `*.streamlit.app` |
| HTTPS | ✅ Automatic | Free SSL certificate |

---

## 4. Option B — Railway.app

**Cost: $5/mo** | **When: 500+ daily users or need always-on** | **Time: 15 minutes**

### When to Switch from Streamlit Cloud

- App sleeps too often (visitors see loading spinner)
- Need more than 1 GB RAM
- Want to run background tasks (cron jobs for newsletter)
- Need a private repo (Streamlit Cloud free requires public)

### Step 1 — Create Railway Account

1. Go to **[railway.app](https://railway.app)**
2. Sign up with GitHub
3. Click **"New Project"** → **"Deploy from GitHub Repo"**
4. Select `YOUR_USERNAME/betboard`
5. Railway auto-detects Python + Streamlit

### Step 2 — Add Environment Variables

In Railway dashboard → **Variables** tab:

```
ODDS_API_KEY=YOUR_ODDS_API_KEY_HERE
RESEND_API_KEY=re_YOUR_KEY
BREVO_API_KEY=xkeysib-YOUR_KEY
PORT=8501
```

### Step 3 — Add Start Command

Railway → **Settings** → **Start Command**:

```bash
streamlit run sports_analysis_dashboard.py --server.port $PORT --server.headless true --server.address 0.0.0.0
```

### Step 4 — Add a `Procfile` (Optional, Alternative)

Create a `Procfile` in your repo root:

```
web: streamlit run sports_analysis_dashboard.py --server.port $PORT --server.headless true --server.address 0.0.0.0
```

### Step 5 — Deploy

Railway auto-deploys on every `git push`. Your URL:

```
https://betboard.up.railway.app
```

---

## 5. Option C — Render.com

**Cost: $7/mo (Starter)** | **Alternative to Railway**

### Quick Setup

1. **[render.com](https://render.com)** → sign up → **New Web Service**
2. Connect your GitHub repo
3. **Build command:** `pip install -r requirements_sports.txt`
4. **Start command:** `streamlit run sports_analysis_dashboard.py --server.port $PORT --server.headless true`
5. Add environment variables (same as Railway)
6. Deploy

---

## 6. Custom Domain Setup

### Buy a Domain ($1–12/year)

Best registrars for cheap domains:

| Registrar | Price | Notes |
|-----------|-------|-------|
| **Namecheap** | ~$8–12/yr for `.com` | Free WHOIS privacy |
| **Cloudflare Registrar** | At-cost (~$9/yr) | No markup, great for Cloudflare CDN |
| **Porkbun** | ~$8/yr for `.com` | Free SSL, cheap |
| **Google Domains** → Squarespace | ~$12/yr | Transferred to Squarespace |

**Suggested domain names:**
- `betboard.app`
- `mybetboard.com`
- `marchpicks.com`
- `dailypickshq.com`
- `piktheline.com`

### Connect to Streamlit Cloud

1. Buy domain (e.g., `betboard.app`)
2. In your DNS manager, add a **CNAME record**:
   ```
   Type:  CNAME
   Name:  @  (or www)
   Value: YOUR_USERNAME-betboard.streamlit.app
   ```
3. In Streamlit Cloud → **Settings → Custom subdomain**: enter `betboard.app`
4. Wait 5–30 minutes for DNS propagation
5. HTTPS is automatic (Streamlit Cloud handles SSL)

### Connect to Railway

1. Railway → **Settings → Custom Domain**
2. Enter `betboard.app`
3. Railway gives you a CNAME target → add it in your DNS
4. SSL is automatic

---

## 7. Cloudflare CDN + DDoS Protection

**Cost: $0** — Cloudflare's free tier is incredibly powerful.

### Why Use Cloudflare

- **DDoS protection** — blocks malicious traffic before it hits your app
- **SSL/HTTPS** — automatic, trusted certificates
- **CDN caching** — static assets load faster worldwide
- **Web Application Firewall** — blocks common attacks (SQL injection, XSS)
- **Analytics** — see real traffic, bot traffic, threats blocked

### Setup (10 minutes)

1. Sign up at **[cloudflare.com](https://cloudflare.com)** (free)
2. Click **"Add a site"** → enter your domain (e.g., `betboard.app`)
3. Select **Free plan**
4. Cloudflare scans your DNS records — verify they're correct
5. **Change your nameservers** at your registrar to the Cloudflare nameservers shown
6. Wait 24 hours for propagation

### Recommended Free Settings

- **SSL/TLS → Full (strict)** — enforces HTTPS everywhere
- **Speed → Auto Minify** → check HTML, CSS, JS
- **Security → Security Level** → Medium
- **Security → Bot Fight Mode** → ON
- **Caching → Browser Cache TTL** → 4 hours

---

## 8. GitHub Actions — Automated Daily Email

The daily "Pick of the Day" email is already set up via GitHub Actions. Here's how to activate it:

### Step 1 — Ensure `daily_pick.yml` Is in Your Repo

The file should be at:
```
.github/workflows/daily_pick.yml
```

If it's not in your MISC folder structure, create it at the ROOT of your GitHub repo.

### Step 2 — Add GitHub Secrets

1. Go to your repo on GitHub → **Settings → Secrets and variables → Actions**
2. Click **"New repository secret"** and add:

| Secret Name | Value |
|-------------|-------|
| `ODDS_API_KEY` | `YOUR_ODDS_API_KEY_HERE` |
| `RESEND_API_KEY` | `re_YOUR_KEY` |

### Step 3 — Test the Workflow

1. GitHub → **Actions** tab → **"Send Daily Pick Email"**
2. Click **"Run workflow"** → **"Run workflow"** (confirm)
3. Watch it execute — should take ~30 seconds
4. Check your email for the Pick of the Day

### Step 4 — Schedule Runs Automatically

The workflow file already has the cron schedule:
```yaml
on:
  schedule:
    - cron: '0 14 * * *'   # 9 AM ET (14:00 UTC)
```

This runs every day at 9 AM Eastern. No action needed — it's automatic once the workflow file and secrets are in GitHub.

---

## 9. Security Hardening Checklist

Your app already has most of these. Verify everything is green:

### ✅ Already Built Into BetBoard

- [x] **No API keys in source code** — loaded via `_get_secret()` fallback chain
- [x] **Input sanitization** — `sanitize_text()` strips HTML, control chars, limits length
- [x] **Email validation** — `is_valid_email()` blocks fake/malformed addresses
- [x] **Spam filter** — `is_spam()` blocks common spam keywords
- [x] **Honeypot fields** — invisible fields that bots fill, humans skip
- [x] **Rate limiting** — `check_form_rate_limit()` limits form submissions per session
- [x] **Session timeout** — 8-hour session expiry
- [x] **CSRF protection** — Streamlit forms have built-in CSRF tokens
- [x] **HTTPS** — automatic on Streamlit Cloud / Railway / Render
- [x] `.gitignore` excludes secrets, subscriber data, feedback data

### 🔒 Additional Steps for Production

- [ ] **Use a custom sending domain** for newsletters (not `onboarding@resend.dev`)
  - This prevents your emails from going to spam
  - Verify domain in Resend → add DNS records
- [ ] **Enable 2FA on GitHub** — protects your source code and Actions secrets
- [ ] **Enable 2FA on Streamlit Cloud** — protects your deployed app settings
- [ ] **Monitor API usage** — The Odds API shows remaining credits in the sidebar
- [ ] **Back up `subscribers.csv`** weekly — this is your revenue-generating asset
- [ ] **Review feedback.json** regularly for abuse/spam

### What NOT to Worry About

- **Database hacking** — there's no database, just local CSV/JSON files
- **SQL injection** — no SQL queries anywhere in the code
- **Password theft** — no user accounts or passwords
- **Payment fraud** — no payment processing (yet; add Stripe later)

---

## 10. Monitoring & Uptime

### Free Monitoring Tools

| Tool | What It Does | Cost |
|------|-------------|------|
| **UptimeRobot** | Pings your URL every 5 min, emails you if it's down | Free (50 monitors) |
| **Streamlit Cloud Dashboard** | Shows app status, logs, crash reports | Free (built-in) |
| **Cloudflare Analytics** | Traffic, threats blocked, performance | Free |
| **GitHub Actions** | Shows if daily email succeeded/failed | Free |

### Set Up UptimeRobot (2 minutes)

1. **[uptimerobot.com](https://uptimerobot.com)** → sign up free
2. **"Add New Monitor"**
   - Type: HTTP(s)
   - Friendly Name: `BetBoard`
   - URL: `https://YOUR_USERNAME-betboard.streamlit.app`
   - Monitoring interval: 5 minutes
3. Set your email for alerts
4. Done — you'll get emailed if the site goes down

---

## 11. Scaling Decision Tree

```
START: Deploy for free on Streamlit Cloud
  │
  ├─ < 500 users/day → STAY on Streamlit Cloud ($0)
  │
  ├─ App sleeps too often → Move to Railway ($5/mo)
  │
  ├─ 500–5,000 users/day → Railway Starter ($5/mo)
  │     └─ Add Cloudflare ($0)
  │     └─ Add custom domain ($1/mo)
  │
  ├─ 5,000+ users/day → Railway Pro ($20/mo) or DigitalOcean ($24/mo)
  │     └─ Upgrade Odds API to Developer ($79/mo)
  │     └─ Upgrade email to Resend Pro ($20/mo)
  │
  └─ 10,000+ users/day → Consider dedicated server
        └─ Odds API Professional ($199/mo)
        └─ Multiple worker processes
        └─ Redis caching layer
```

---

## Quick Deploy Cheat Sheet

```powershell
# 1. Push to GitHub
cd "C:\Users\jacob.idolor\OneDrive - Farmers Insurance Group\Documents\MouseyJiggler\MISC"
git add -A
git commit -m "Production deploy"
git push origin main

# 2. Deploy on Streamlit Cloud
# → share.streamlit.io → New app → Select repo → Deploy

# 3. Add secrets in Streamlit Cloud dashboard
# ODDS_API_KEY = "your_key"
# RESEND_API_KEY = "re_your_key"
# BREVO_API_KEY = "xkeysib-your_key"

# 4. Set up UptimeRobot for monitoring
# → uptimerobot.com → Add monitor → your streamlit URL

# 5. Set up Cloudflare (optional but recommended)
# → cloudflare.com → Add site → change nameservers

# Total time: ~15 minutes
# Total cost: $0/month
```

---

*Next: See [MONETIZATION_PLAYBOOK.md](MONETIZATION_PLAYBOOK.md) for passive income strategies and [USER_GUIDE.md](USER_GUIDE.md) to understand every feature.*
