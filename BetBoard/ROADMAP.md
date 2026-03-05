# 🗺️ BetBoard — Product Roadmap

**Last updated: March 4, 2026** | **Current version: 9.0.1**

> Prioritized backlog of improvements. Updated weekly from feedback tab submissions and audit findings.

---

## Priority Legend

| Icon | Priority | Meaning |
|------|----------|---------|
| 🔴 | Critical | Security issue or blocker — do before deploy |
| 🟡 | High | Strong impact on revenue or user experience |
| 🟢 | Medium | Nice to have, good ROI on effort |
| ⚪ | Low | Backlog — do when time allows |

---

## Pre-Deploy (Before Going Public)

| # | Priority | Task | Status | Effort |
|---|----------|------|--------|--------|
| 1 | 🔴 | Rotate Odds API key (current one is exposed in docs) | ❌ TODO | 5 min |
| 2 | 🔴 | Replace real API key with placeholder in all `.md` files | ❌ TODO | 15 min |
| 3 | 🔴 | Remove hardcoded key from tutorial markdown in `sports_analysis_dashboard.py` line ~2839 | ✅ DONE (9.0.1) | 5 min |
| 4 | 🔴 | Verify `.gitignore` excludes `secrets.toml`, `subscribers.csv`, `feedback.json`, `picks_history.json` | ✅ DONE | 2 min |
| 5 | 🟡 | Test full deploy on Streamlit Cloud (verify secrets work) | ❌ TODO | 15 min |
| 6 | 🟡 | Add responsible gambling disclaimer to sidebar footer | ✅ DONE | 2 min |

---

## Q1 2026 (March–May) — Launch Sprint

### Revenue-Impact Features

| # | Priority | Feature | Impact | Effort | Status |
|---|----------|---------|--------|--------|--------|
| 7 | 🟡 | Replace affiliate placeholder URLs with real links | Enables revenue | 30 min | ❌ TODO |
| 8 | 🟡 | Add "Buy Me a Coffee" / Ko-fi tip jar link in footer | Quick revenue | 10 min | ❌ TODO |
| 9 | 🟡 | Add public pick track record page (W-L, ROI) | Builds trust | 4 hours | ❌ TODO |
| 10 | 🟢 | Welcome email sequence (3 drip emails for new subscribers) | Retention | 2 hours | ❌ TODO |
| 11 | 🟢 | Weekly recap email (automated summary of the week's picks) | Engagement | 4 hours | ❌ TODO |

### User Experience

| # | Priority | Feature | Impact | Effort | Status |
|---|----------|---------|--------|--------|--------|
| 12 | 🟡 | Add loading skeleton/shimmer while odds load | Polish | 1 hour | ❌ TODO |
| 13 | 🟡 | Persist bets to JSON file (survive page refresh) | Data safety | 2 hours | ❌ TODO |
| 14 | 🟢 | Add game start countdown timer on Today tab | Engagement | 1 hour | ❌ TODO |
| 15 | 🟢 | Sort games by tip-off time (soonest first) | UX | 30 min | ❌ TODO |
| 16 | 🟢 | Add "Copy pick to clipboard" button for sharing | Growth | 30 min | ❌ TODO |
| 17 | ⚪ | Dark/light theme toggle | Polish | 2 hours | ❌ TODO |

### Technical Debt

| # | Priority | Feature | Impact | Effort | Status |
|---|----------|---------|--------|--------|--------|
| 18 | 🟡 | Add error boundary / try-except around every tab's main block | Stability | 1 hour | ❌ TODO |
| 19 | 🟢 | Split 3,000-line file into modules (`tabs/`, `utils/`, `api/`) | Maintainability | 4 hours | ❌ TODO |
| 20 | 🟢 | Add `logging` module instead of print/st.error for debugging | Debugging | 1 hour | ❌ TODO |
| 21 | ⚪ | Add unit tests for `OddsAnalyzer`, `sanitize_text`, `is_valid_email` | Quality | 3 hours | ❌ TODO |
| 22 | ⚪ | Type hints on all functions | Code quality | 2 hours | ❌ TODO |

---

## Q2 2026 (June–August) — Monetize

### Premium Tier

| # | Priority | Feature | Impact | Effort | Status |
|---|----------|---------|--------|--------|--------|
| 23 | 🟡 | Stripe integration — payment link for premium ($9.99/mo) | Revenue | 2 hours | ❌ TODO |
| 24 | 🟡 | Premium subscriber flag in CSV | Gating | 1 hour | ❌ TODO |
| 25 | 🟢 | 3 picks/day for premium (vs 1 for free) | Value prop | 2 hours | ❌ TODO |
| 26 | 🟢 | Early AM delivery for premium (7 AM vs 9 AM) | Value prop | 30 min | ❌ TODO |

### Data & Analytics

| # | Priority | Feature | Impact | Effort | Status |
|---|----------|---------|--------|--------|--------|
| 27 | 🟡 | Historical odds tracking (store snapshots in JSON/SQLite) | Line movement | 1 day | ❌ TODO |
| 28 | 🟡 | Line movement visualization (odds chart over time) | Analysis | 4 hours | ❌ TODO |
| 29 | 🟢 | Closing Line Value (CLV) tracker — did you beat the closing line? | Skill metric | 4 hours | ❌ TODO |
| 30 | 🟢 | Backtesting — "if you'd followed BetBoard picks for X months" | Trust | 1 week | ❌ TODO |

### Growth

| # | Priority | Feature | Impact | Effort | Status |
|---|----------|---------|--------|--------|--------|
| 31 | 🟡 | Share buttons (Twitter, Reddit) on pick cards | Distribution | 1 hour | ❌ TODO |
| 32 | 🟢 | Referral program — "share with a friend, get premium free" | Growth | 4 hours | ❌ TODO |
| 33 | 🟢 | SEO landing page (separate HTML page, not Streamlit) | Discovery | 1 day | ❌ TODO |
| 34 | ⚪ | Discord bot that posts daily picks | Community | 4 hours | ❌ TODO |

---

## Q3 2026 (September–November) — NFL Season

| # | Priority | Feature | Impact | Effort | Status |
|---|----------|---------|--------|--------|--------|
| 35 | 🟡 | NFL-specific features (bye weeks, division matchups) | Relevance | 4 hours | ❌ TODO |
| 36 | 🟡 | Weather integration for NFL games (API: OpenWeatherMap free) | Edge | 4 hours | ❌ TODO |
| 37 | 🟢 | Injury report integration (ESPN or CBS scraping) | Edge | 1 day | ❌ TODO |
| 38 | 🟢 | Parlay builder — suggest 2-3 leg parlays from value bets | Feature | 4 hours | ❌ TODO |
| 39 | ⚪ | Survivor pool tracker | Niche feature | 4 hours | ❌ TODO |

---

## Q4 2026 / 2027 — Scale

| # | Priority | Feature | Impact | Effort | Status |
|---|----------|---------|--------|--------|--------|
| 40 | 🟡 | Migrate to Railway/Render if Streamlit Cloud can't handle traffic | Scale | 2 hours | ❌ TODO |
| 41 | 🟡 | Database migration (CSV → SQLite → PostgreSQL) | Scale | 1 day | ❌ TODO |
| 42 | 🟢 | User accounts (email-based auth via Streamlit) | Personalization | 1 week | ❌ TODO |
| 43 | 🟢 | Multi-user bet tracking (each user sees their own bets) | Personalization | 1 week | ❌ TODO |
| 44 | ⚪ | React frontend rewrite (if SaaS pivot) | Scale | 2-3 months | ❌ TODO |
| 45 | ⚪ | Mobile app (React Native or Flutter wrapper) | Reach | 1-2 months | ❌ TODO |

---

## Completed

| # | Feature | Version | Date |
|---|---------|---------|------|
| — | Live odds comparison | v6.0 | Feb 28 |
| — | Value bet + arbitrage calculators | v6.0 | Feb 28 |
| — | Full parlay tracker | v7.0 | Mar 1 |
| — | Player props tab | v7.0 | Mar 1 |
| — | Newsletter system (Resend) | v8.0 | Mar 2 |
| — | GitHub Actions daily email | v8.0 | Mar 2 |
| — | BetBoard rebrand + hero screen | v9.0 | Mar 3 |
| — | Analysis mega-tab (5 sub-tabs) | v9.0 | Mar 3 |
| — | P&L pie + ROI line charts | v9.0 | Mar 3 |
| — | Brevo email provider | v9.0.1 | Mar 4 |
| — | Feedback tab | v9.0.1 | Mar 4 |
| — | Security hardening (sanitize, honeypot, rate limit) | v9.0.1 | Mar 4 |
| — | `_get_secret()` fallback chain | v9.0.1 | Mar 4 |
| — | Session cost tracker | v9.0.1 | Mar 4 |

---

## How to Add Items

1. Check the **💬 Feedback** tab for user submissions
2. Assess **Impact** (revenue, user experience, security) and **Effort** (hours/days)
3. Place in the appropriate quarter
4. Tag priority: 🔴 🟡 🟢 ⚪
5. Update status as you work: ❌ TODO → 🔄 IN PROGRESS → ✅ DONE

---

*See [CHANGELOG.md](CHANGELOG.md) for what's already been built and [BUSINESS_PLAN.md](BUSINESS_PLAN.md) for strategic context.*
