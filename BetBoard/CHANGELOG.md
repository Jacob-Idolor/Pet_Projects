# 📋 BetBoard — Changelog

All notable changes to BetBoard are documented here.

Format: [Semantic Versioning](https://semver.org/) — `MAJOR.MINOR.PATCH`

---

## [9.0.1] — 2026-03-04

### Security
- Hardened sidebar email capture with `is_valid_email()` + `sanitize_text()`
- Fixed `feedback_attempts` counter not incrementing after submission
- Replaced hardcoded Brevo sender email with configurable value
- Removed hardcoded API key from in-app tutorial markdown
- Updated `User-Agent` header to generic `BetBoard/9.0`

### Added
- 💬 **Feedback tab** (Tab 8) — feature requests, bug reports, general feedback
- **Brevo email provider** — free 9,000 emails/month as alternative to Resend
- `_get_secret()` helper — secrets.toml → env var → session fallback chain
- Input sanitization: `sanitize_text()`, `is_valid_email()`, `is_spam()`
- Honeypot fields on subscriber + feedback forms
- Form rate limiting (`check_form_rate_limit()`)
- Session API cost tracker in sidebar
- `.streamlit/secrets.toml` template with all 3 keys

### Changed
- Page title: "Professional Betting Analytics" → "BetBoard"
- Page icon: 🏀 → 🎯
- Session timeout: 1 hour → 8 hours
- Tabs: 7 → 8 (added Feedback)
- Analysis tab emoji: corrupted FFFD → 🔬
- Requirements: removed unused `beautifulsoup4`, `lxml`, `selenium`

### Documentation
- Created `DEPLOYMENT_GUIDE.md` — Streamlit Cloud, Railway, Render, Cloudflare, custom domain
- Created `MONETIZATION_PLAYBOOK.md` — affiliate, newsletter, premium, sponsorship strategies
- Created `USER_GUIDE.md` — tab-by-tab walkthrough, odds explained, March Madness game plan
- Created `BUSINESS_PLAN.md` — market analysis, revenue model, quarterly roadmap, KPIs
- Created `ROADMAP.md` — prioritized improvement backlog
- Created `DEPLOY_CHECKLIST.md` — pre-deploy verification steps
- Updated `MASTER_GUIDE.md` — new tabs, Brevo, file inventory, secrets

---

## [9.0.0] — 2026-03-03

### Added
- 🏆 **BetBoard** branded header bar with live API status badge
- **Hero landing screen** with 6 feature cards (shown when no API key entered)
- **Analysis mega-tab** — merged Value Bets + Arbitrage + Analytics into 🔬 Analysis with 5 sub-tabs
- **P&L pie chart** + running ROI line chart in My Bets tab
- Dark-themed **AdSense-style ad placeholders** in sidebar
- Sidebar reordered: Sports picker first (most-used control)
- `v9.0` version badge throughout

### Changed
- Tabs reduced from 9 → 7 (merged Analysis sub-tabs)
- Fixed encoding bugs with 📌, 🏃, 📅 emojis
- Sportsbook bonuses moved to collapsed expander

---

## [8.0.0] — 2026-03-02

### Added
- 📧 **Newsletter system** — `newsletter.py` with `pick_of_the_day()` algorithm
- `ResendClient` — `.send_single()`, `.send_blast()`, `.test_connection()`
- `send_daily_pick.py` — standalone daily email sender for GitHub Actions
- `.github/workflows/daily_pick.yml` — automated 9 AM ET daily email
- Subscriber management: CSV storage, add/view/export
- Pick history logging: `picks_history.json`
- Email preview (HTML + plain text) in Newsletter tab
- `MASTER_GUIDE.md` — comprehensive 10-section guide

### Changed
- Mobile-responsive CSS improvements
- March Madness banner added to Today tab (NCAAB only)

---

## [7.0.0] — 2026-03-01

### Added
- Full **parlay tracker** — 2-12 legs, per-leg status
- **Player Props tab** — Over/Under comparison across all books
- **Scores tab** — live scores and upcoming games
- **My Bets tab** — straight bet + parlay tracker with P&L metrics
- Sportsbook selector, ticket number, stake/payout tracking
- Win rate, ROI, net profit, record metrics
- Dark theme CSS
- Rate limiting for API calls

---

## [6.0.0] — 2026-02-28

### Added
- Initial **Streamlit dashboard** with live odds from The Odds API
- Odds comparison across 8+ sportsbooks
- Value bet finder (edge % calculation)
- Arbitrage calculator with stake sizing
- EV Calculator
- Kelly Criterion calculator
- Odds comparison chart (Plotly)
- API key input + validation
- Basic sidebar layout

---

*For future improvements, see your local roadmap (if you keep one).*
