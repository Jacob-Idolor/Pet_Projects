# ✅ BetBoard — Pre-Deploy Checklist

**Print this page. Check each box before going live.**

---

## 1. Security 🔒

- [ ] **API key is NOT in any `.md`, `.py`, or committed file** (only in `.streamlit/secrets.toml`)
- [ ] **`.gitignore` includes:** `secrets.toml`, `subscribers.csv`, `email_subscribers.csv`, `feedback.json`, `picks_history.json`, `*.zip`
- [ ] **No API keys in code:** Search repo for any literal key strings; keep keys only in `.streamlit/secrets.toml` or `.env`
- [ ] **Rotate Odds API key** if it was ever exposed. Go to [the-odds-api.com](https://the-odds-api.com) → regenerate → update secrets
- [ ] **Resend key starts with `re_`** — paste in secrets, NOT in code
- [ ] **Brevo key starts with `xkeysib-`** — paste in secrets, NOT in code
- [ ] Honeypot fields present on: Newsletter subscriber form ✅, Sidebar email form ✅, Feedback form ✅
- [ ] `sanitize_text()` and `is_valid_email()` used on ALL user input forms

---

## 2. Secrets Configuration 🔑

Your `.streamlit/secrets.toml` should have:

```toml
ODDS_API_KEY    = "your_new_rotated_key"
RESEND_API_KEY  = "re_your_key_here"
BREVO_API_KEY   = "xkeysib-your_key_here"
NEWSLETTER_FROM = "picks@yourdomain.com"
BREVO_SENDER_EMAIL = "picks@yourdomain.com"
```

For **Streamlit Cloud**: paste the same content in Settings → Secrets.
For **Railway/Render**: add as environment variables (no quotes needed).

---

## 3. Files to Deploy 📁

```
BetBoard/
├── sports_analysis_dashboard.py    ← Main app
├── newsletter.py                   ← Newsletter engine
├── send_daily_pick.py              ← GitHub Actions daily email
├── requirements_sports.txt         ← Dependencies
├── config.toml                     ← Theme settings
├── .streamlit/
│   └── secrets.toml                ← API keys (DO NOT commit; create from secrets.toml.example)
└── .github/workflows/daily_pick.yml  ← Optional: automated daily email
```

**Do NOT commit:** `.streamlit/secrets.toml`, `.env`, `*.csv`, `feedback.json`, `picks_history.json`

---

## 4. Dependency Check 📦

- [ ] `requirements_sports.txt` exists and contains:
  ```
  streamlit>=1.32.0
  requests>=2.31.0
  pandas>=2.2.0
  plotly>=5.19.0
  python-dotenv>=1.0.0
  ```
- [ ] Run locally first:
  ```powershell
  pip install -r requirements_sports.txt
  ```

---

## 5. Syntax Verification ✓

- [ ] Run compile check:
  ```powershell
  python -m py_compile sports_analysis_dashboard.py
  python -m py_compile newsletter.py
  python -m py_compile send_daily_pick.py
  ```
  **No output = no errors.**

---

## 6. Local Test Run 🧪

- [ ] Start the app:
  ```powershell
  python -m streamlit run sports_analysis_dashboard.py --server.port 8517
  ```
- [ ] Verify each tab loads:
  - [ ] 📅 Today — games appear with odds
  - [ ] 📌 Watchlist — add/remove works
  - [ ] 🔬 Analysis — all 5 sub-tabs render
  - [ ] 🎯 Props — player props display
  - [ ] 🏆 Scores — live/recent scores show
  - [ ] 📝 My Bets — add straight + parlay, check P&L chart
  - [ ] 📧 Newsletter — pick generates, test email sends
  - [ ] 💬 Feedback — submit form, verify it saves to `feedback.json`
- [ ] Sidebar email signup works with validation
- [ ] Invalid emails get rejected (test: `notanemail`, `a@b`)
- [ ] Honeypot blocks bot submissions
- [ ] Sidebar shows "Odds data: Connected" when API key is set

---

## 7. Platform Deploy 🚀

### Option A — Streamlit Cloud (Recommended for launch)
- [ ] Push to GitHub (private repo is fine)
- [ ] Go to [share.streamlit.io](https://share.streamlit.io)
- [ ] Select repo → your `betboard` repo; main file: `sports_analysis_dashboard.py`
- [ ] Add secrets in Settings
- [ ] Test the public URL

### Option B — Railway ($5/mo)
- [ ] Connect GitHub repo
- [ ] Set environment variables
- [ ] Add Procfile or use Railway's auto-detect
- [ ] Custom domain optional

### Option C — Render (free tier available)
- [ ] Connect GitHub repo
- [ ] Add `render.yaml` or configure via dashboard
- [ ] Set environment variables

---

## 8. Post-Deploy Verification 🔍

- [ ] App loads at public URL
- [ ] Odds API connects (green checkmark in sidebar)
- [ ] Newsletter test send works
- [ ] No API keys visible in page source (View Source → Ctrl+F → search for key)
- [ ] Mobile layout looks good (resize browser or use phone)
- [ ] Share URL with a friend — ask them to try each tab

---

## 9. Automation Setup ⚙️

- [ ] **GitHub Actions** — `.github/workflows/daily_pick.yml` is in repo
- [ ] **GitHub Secrets** set: `RESEND_API_KEY`, `ODDS_API_KEY`
- [ ] **Test trigger**: Actions tab → Daily Pick Email → Run workflow
- [ ] Verify email arrives in your inbox

---

## 10. Go-Live Day 🎉

- [ ] Post on Twitter/X with screenshot
- [ ] Share in sports betting subreddits (r/sportsbook, r/sportsbetting)
- [ ] Add to Product Hunt
- [ ] Send launch email to existing subscribers
- [ ] Monitor feedback tab for first 48 hours
- [ ] Check Streamlit Cloud logs for errors

---

**Estimated time to complete checklist: 30-45 minutes**

*When all boxes are checked, you're live. Congratulations! 🏆*
