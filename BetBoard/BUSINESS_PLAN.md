# 📊 BetBoard — Business Plan

**Last updated: March 4, 2026** | **Version: 1.0**

> A pragmatic, no-fluff business plan for turning BetBoard into a sustainable passive income stream. Based on what we actually have, not what we hope to build.

---

## Table of Contents

1. [Executive Summary](#1-executive-summary)
2. [Product — Honest Assessment](#2-product--honest-assessment)
3. [Market Analysis](#3-market-analysis)
4. [Competitive Positioning](#4-competitive-positioning)
5. [Revenue Model](#5-revenue-model)
6. [Growth Strategy](#6-growth-strategy)
7. [KPIs to Track](#7-kpis-to-track)
8. [Risk Assessment](#8-risk-assessment)
9. [Quarterly Roadmap (Year 1)](#9-quarterly-roadmap)
10. [Iteration Framework](#10-iteration-framework)
11. [Financial Projections](#11-financial-projections)
12. [Exit Strategies](#12-exit-strategies)

---

## 1. Executive Summary

**What:** BetBoard is a free, web-based sports betting analytics dashboard with a built-in newsletter system.

**Who:** Sports bettors who want to compare odds across sportsbooks, find value, and track their betting performance. Primary audience: men 21-45 in the US who bet on NBA, March Madness, and NFL.

**How it makes money:**
1. Sportsbook affiliate referrals ($50-200 per signup)
2. Newsletter with embedded affiliate links
3. Premium tier ($9.99/month) for extra picks and features
4. Sponsorships (at scale)

**Current state:** Fully functional 3,000-line Python/Streamlit app with 8 tabs, live odds from 8+ books, bet tracker, newsletter system (Resend + Brevo), feedback system, and dark mobile-responsive UI.

**Realistic Year 1 target:** $500-2,000/month passive income at 200-500 newsletter subscribers.

---

## 2. Product — Honest Assessment

### What We Have (Strengths)

| Feature | Status | Quality |
|---------|--------|---------|
| Live odds comparison (8+ books) | ✅ Working | Good — real API data, 10-min cache |
| Value bet finder (edge %) | ✅ Working | Good — mathematically sound |
| Arbitrage calculator | ✅ Working | Good — correct formula, stake sizing |
| EV + Kelly calculators | ✅ Working | Good — standard models |
| Player props comparison | ✅ Working | Good — cross-book comparison |
| Bet tracker + P&L | ✅ Working | Good — parlays, charts, ROI |
| Newsletter (auto pick-of-day) | ✅ Working | Good — edge-based algorithm, 2 providers |
| Feedback system | ✅ Working | Adequate — local JSON storage |
| Dark theme + mobile CSS | ✅ Working | Good — professional look |
| Security (sanitize, honeypot, rate limit) | ✅ Working | Adequate for Streamlit |

### What We DON'T Have (Gaps — Be Honest)

| Gap | Impact | Difficulty to Add |
|-----|--------|-------------------|
| **No user accounts / login** | Can't gate premium content, can't track individual users | Hard (need auth system) |
| **No historical odds data** | Can't show "line moved from -3 to -5" over hours/days | Medium (need database) |
| **No backtesting** | Can't prove "our picks would have won X% over the past year" | Medium |
| **No push notifications** | Only email — no browser push, SMS, or Discord alerts | Easy |
| **No payment processing** | Can't charge for premium tier without Stripe integration | Medium |
| **Single-server architecture** | Streamlit is single-threaded; heavy traffic = slow | Hard (need rewrite) |
| **No social proof** | No public track record, no testimonials, no user count | Easy (just needs time) |
| **No SEO / landing page** | Streamlit apps aren't great for search engine discovery | Medium (need separate landing page) |
| **Flat file storage** | CSV/JSON files, not a database — doesn't scale past ~5,000 subscribers | Medium |

### The Brutal Truth

BetBoard is a **solid MVP** (minimum viable product). It does real things that real bettors want. But it's competing against well-funded companies (OddsJam, Action Network, Unabated) that have teams of engineers, marketing budgets, and years of data.

**Our competitive advantage isn't features — it's cost.**

- OddsJam: $39-99/month
- Action Network Pro: $36/month
- Unabated: $99/month
- **BetBoard: Free** (with optional $9.99/month premium)

That's the pitch. That's the wedge into the market.

---

## 3. Market Analysis

### Market Size (US Sports Betting)

| Metric | Value | Source |
|--------|-------|--------|
| US legal sports betting revenue (2025) | ~$15 billion | AGA |
| US bettors (estimated) | ~50 million | AGA |
| Bettors who use analytics tools | ~10-15% | Industry estimate |
| Total addressable market (analytics) | 5-7.5 million people | Derived |
| Willing to pay $10/month | ~2-5% | Industry benchmark |
| Realistic paying market | 100K-375K | Conservative |

### Key Trends in Our Favor

1. **Sports betting legalization expanding** — more states every year = more bettors
2. **"Sharp" culture growing** — TikTok/YouTube sports betting content exploding
3. **Newsletter economy booming** — sports betting newsletters are hot (Action Network sold for $240M)
4. **March Madness is the #1 betting event** — perfect timing for launch (March 2026)
5. **DIY tools gaining respect** — "vibe-coded" apps resonate with the builder community

### Key Trends Against Us

1. **Market saturation** — many free odds comparison tools exist
2. **Sportsbooks getting smarter** — arbitrage windows shrinking
3. **Regulation tightening** — affiliate marketing rules getting stricter in some states
4. **AI competition** — ChatGPT-style "ask about odds" tools emerging

---

## 4. Competitive Positioning

### Positioning Matrix

```
                    HIGH PRICE
                        │
           Unabated     │    (empty space)
           ($99/mo)     │
                        │
  ──────────────────────┼──────────────────────  FEATURES
           OddsJam      │    BetBoard
           ($39-99)     │    ($0-9.99/mo)
                        │
           Action Net   │    Free odds sites
           ($36/mo)     │    (no tools)
                        │
                    LOW PRICE
```

### Our Niche

**"The free analytics dashboard for everyday bettors who want tools, not just data."**

- We don't target pros (they use Unabated, have custom systems)
- We don't target casual "fun" bettors (they just use their sportsbook app)
- We target the **middle:** recreational bettors who want to bet smarter but won't pay $50+/month

### Value Proposition (One Sentence)

> "BetBoard gives you the same value bet finder and odds comparison that paid tools charge $50/month for — free, with a daily email pick."

---

## 5. Revenue Model

### Revenue Streams (Ranked by Realistic Potential)

| Stream | When | Revenue/Unit | Confidence |
|--------|------|-------------|------------|
| **1. Sportsbook affiliates** | Day 1 | $50-200/signup | ⭐⭐⭐⭐⭐ High |
| **2. Newsletter affiliate CTAs** | Week 2 | $50-200/signup | ⭐⭐⭐⭐ High |
| **3. Premium newsletter** | Month 3 | $9.99/mo/subscriber | ⭐⭐⭐ Medium |
| **4. Sponsorships** | Month 6+ | $100-500/blast | ⭐⭐ Medium |
| **5. Digital products** | Anytime | $19-99/sale | ⭐⭐ Medium |
| **6. Tip jar** | Day 1 | $3-25/tip | ⭐ Low |

### Why Affiliates Are #1

Sports betting affiliate payouts are among the highest in any industry:
- A single FanDuel referral = $50-100
- A single BetMGM referral = $100-200
- You need just **5-10 signups per month** to make $500-1,000

Compare this to AdSense (you'd need 100,000+ pageviews for the same revenue).

### Unit Economics

```
Cost to acquire 1 newsletter subscriber:     $0 (organic)
Lifetime value of 1 subscriber (12 months):  $5-25
  - 2% become sportsbook affiliates:         $1.50-4.00
  - 5% upgrade to premium ($9.99 × 6 mo):   $3.00
  - Newsletter engagement (ad value):        $0.50-1.00
  
Cost to serve 1 subscriber:                  ~$0.002/email
Margin per subscriber:                       ~99%
```

---

## 6. Growth Strategy

### Phase 1 — Seed (Month 1)
**Goal: 50 subscribers, first affiliate revenue**

- Deploy to Streamlit Cloud (free)
- Apply to FanDuel + DraftKings + BetMGM affiliates
- Post daily picks on Twitter/X with BetBoard link
- Share in 3 sports betting subreddits (follow rules)
- Join 2 Discord communities, share picks
- Send daily newsletter via GitHub Actions
- KPI: 50 subscribers, 1-2 affiliate signups

### Phase 2 — Validate (Month 2-3)
**Goal: 200 subscribers, consistent affiliate revenue**

- Track pick W-L record publicly (builds trust)
- Post "March Madness free picks" content during tournament
- Launch on Product Hunt (dev/betting audience overlap)
- Test paid Twitter ads ($5/day max) targeting sports bettors
- Start building email "welcome sequence" (3 emails over 1 week)
- KPI: 200 subs, $200-500/month affiliate revenue

### Phase 3 — Monetize (Month 4-6)
**Goal: 500 subscribers, launch premium tier**

- Launch premium tier ($9.99/month) via Stripe
- Gate: 3 picks/day, early delivery, parlay suggestions
- Buy custom domain ($12/year)
- Add Cloudflare (free)
- First sponsorship outreach (5 cold emails)
- KPI: 500 subs, 20-30 premium, $500-1,500/month total

### Phase 4 — Scale (Month 7-12)
**Goal: 1,000+ subscribers, $2,000+/month**

- Hire a writer ($100-200/month) for newsletter content
- Launch YouTube/TikTok short-form content (picks + analysis)
- Partner with 1-2 other betting newsletters for cross-promotion
- Consider moving from Streamlit to Railway ($5/month)
- KPI: 1,000+ subs, $2,000-5,000/month

---

## 7. KPIs to Track

### Weekly Dashboard (Track Every Sunday)

| KPI | Target (Month 1) | Target (Month 6) | Target (Month 12) |
|-----|-------------------|-------------------|--------------------|
| **Total subscribers** | 50 | 500 | 1,000+ |
| **New subs this week** | 10-15 | 20-30 | 30-50 |
| **Unsubscribe rate** | <5% | <3% | <2% |
| **Email open rate** | 40%+ | 35%+ | 30%+ |
| **Email click rate** | 5%+ | 4%+ | 3%+ |
| **Affiliate signups** | 1-2 | 5-10 | 10-20 |
| **Monthly revenue** | $0-150 | $500-1,500 | $2,000-5,000 |
| **Pick W-L record** | Track it | 55%+ | 55%+ |
| **Site visitors/week** | 50-100 | 200-500 | 500-1,000 |
| **Feedback submissions** | 2-3 | 5-10 | 10+ |

### Where to Track These

- **Subscribers / unsubscribes:** `subscribers.csv` + Resend/Brevo dashboard
- **Open rate / click rate:** Resend/Brevo analytics
- **Affiliate signups:** Sportsbook affiliate dashboard
- **Revenue:** Monthly P&L template (in MONETIZATION_PLAYBOOK.md)
- **Pick record:** `picks_history.json` + My Bets tab
- **Site visitors:** Streamlit Cloud analytics or Cloudflare
- **Feedback:** Feedback tab in BetBoard

---

## 8. Risk Assessment

### High Risk

| Risk | Likelihood | Impact | Mitigation |
|------|-----------|--------|------------|
| **API key gets leaked** (it's in docs) | High | High | Rotate key before public deploy. Remove from all .md files. Use secrets only. |
| **Odds API changes pricing/limits** | Medium | High | Cache aggressively. Have backup data sources ready. |
| **Sportsbook affiliate programs reject you** | Medium | High | Apply to 5+ programs. Some are easier (BetRivers, bet365). |
| **Nobody subscribes** | Medium | High | Focus on March Madness timing. Free picks = low barrier. |

### Medium Risk

| Risk | Likelihood | Impact | Mitigation |
|------|-----------|--------|------------|
| **Streamlit Cloud has downtime** | Medium | Medium | Monitor with UptimeRobot. Have Railway as backup. |
| **Picks lose money for users** | High | Medium | Always include disclaimers. Track record publicly. Be honest about losses. |
| **Competitor copies the idea** | Medium | Low | First-mover advantage. Build community, not just tools. |
| **Legal / gambling regulations** | Low | High | Include responsible gambling disclaimers. Check state-specific rules. |

### Low Risk

| Risk | Likelihood | Impact | Mitigation |
|------|-----------|--------|------------|
| **Bot abuse on forms** | Low | Low | Already have honeypot + rate limiting |
| **File storage fills up** | Low | Low | CSV/JSON files are tiny. Won't be a problem until 10K+ subscribers. |

### ⚠️ CRITICAL: API Key Exposure

**Right now, your Odds API key (`3f68...0246`) is visible in:**
- `.streamlit/secrets.toml` (correct — this is gitignored)
- `MASTER_GUIDE.md` (4 places) ← **REMOVE BEFORE PUBLIC DEPLOY**
- `DEPLOYMENT_GUIDE.md` (3 places) ← **REMOVE BEFORE PUBLIC DEPLOY**
- `USER_GUIDE.md` (1 place) ← **REMOVE BEFORE PUBLIC DEPLOY**
- `sports_analysis_dashboard.py` line 2839 (inside a markdown tutorial) ← **REMOVE**

**Before pushing to GitHub:** Replace the real key with `YOUR_API_KEY_HERE` in every `.md` and `.py` file except `secrets.toml`.

---

## 9. Quarterly Roadmap (Year 1)

### Q1 (March-May 2026) — "Launch & Learn"

| Priority | Task | Impact | Effort |
|----------|------|--------|--------|
| 🔴 Critical | Rotate API key, remove from docs | Security | 30 min |
| 🔴 Critical | Deploy to Streamlit Cloud | Launch | 15 min |
| 🔴 Critical | Apply to 3 affiliate programs | Revenue | 1 hour |
| 🟡 High | Post daily March Madness picks on Twitter | Growth | 10 min/day |
| 🟡 High | Track pick W-L record publicly | Trust | 5 min/day |
| 🟢 Medium | Buy custom domain | Branding | 20 min |
| 🟢 Medium | Set up Cloudflare | Security | 15 min |
| 🟢 Medium | Launch on Product Hunt | Growth | 1 hour |
| ⚪ Low | Add browser push notifications | Engagement | 4 hours |

### Q2 (June-August 2026) — "Validate & Monetize"

| Priority | Task | Impact | Effort |
|----------|------|--------|--------|
| 🔴 Critical | Launch premium tier (Stripe) | Revenue | 1 day |
| 🟡 High | Build welcome email sequence (3 emails) | Retention | 2 hours |
| 🟡 High | Add NBA Summer League / MLB coverage | Content | 2 hours |
| 🟢 Medium | Add historical pick track record page | Trust | 4 hours |
| 🟢 Medium | First sponsorship outreach (5 emails) | Revenue | 1 hour |
| ⚪ Low | Add Discord community | Engagement | 2 hours |

### Q3 (September-November 2026) — "NFL Season Push"

| Priority | Task | Impact | Effort |
|----------|------|--------|--------|
| 🔴 Critical | NFL season launch marketing push | Growth | Ongoing |
| 🟡 High | Add NFL-specific features (weather, injuries) | Value | 1 day |
| 🟡 High | Cross-promote with 2 other newsletters | Growth | 2 hours |
| 🟢 Medium | Automate weekly recap email | Engagement | 4 hours |
| 🟢 Medium | Consider migration to Railway if traffic warrants | Scale | 2 hours |

### Q4 (December 2026 - February 2027) — "Optimize & Prepare for March"

| Priority | Task | Impact | Effort |
|----------|------|--------|--------|
| 🔴 Critical | Prepare March Madness 2027 marketing | Growth | 1 week |
| 🟡 High | Review Year 1 P&L — is this sustainable? | Business | 2 hours |
| 🟡 High | Build backtesting system (prove track record) | Trust | 1 week |
| 🟢 Medium | Explore second revenue stream (course, ebook) | Revenue | 1 week |
| ⚪ Low | Redesign landing page for SEO | Discovery | 1 day |

---

## 10. Iteration Framework

### How to Decide What to Build Next

Use this 2×2 matrix for every feature request (from the Feedback tab or your own ideas):

```
                    HIGH IMPACT
                        │
      Do these SECOND   │   Do these FIRST
      (Schedule it)     │   (This sprint)
                        │
  ──────────────────────┼──────────────────────  
      Don't do these    │   Do these THIRD
      (Say no)          │   (When bored)
                        │
                    LOW IMPACT
          HIGH EFFORT       LOW EFFORT
```

### Feedback → Feature Pipeline

```
User submits feedback (💬 Tab)
  ↓
Review weekly (Sunday)
  ↓
Tag as: Feature / Bug / Won't Do
  ↓
Prioritize via Impact × Effort matrix
  ↓
Add to ROADMAP.md with target quarter
  ↓
Build → Test → Deploy → Mark as Done
  ↓
Reply to user if email provided
```

### Version Numbering

```
v9.0  ← Current (March 2026)
v9.1  ← Bug fixes + security patches
v9.2  ← Small feature additions
v10.0 ← Major release (premium tier, auth, etc.)
```

### Release Cadence

- **Bug fixes:** Same day
- **Small features:** Weekly (every Sunday)
- **Major releases:** Monthly
- **Log everything in CHANGELOG.md**

---

## 11. Financial Projections

### Conservative Case (You Do the Minimum)

| Month | Subscribers | Revenue | Costs | Profit |
|-------|-----------|---------|-------|--------|
| 1 | 30 | $0 | $0 | $0 |
| 3 | 100 | $150 | $1 | $149 |
| 6 | 250 | $400 | $1 | $399 |
| 12 | 500 | $800 | $6 | $794 |

### Moderate Case (You Execute the Plan)

| Month | Subscribers | Revenue | Costs | Profit |
|-------|-----------|---------|-------|--------|
| 1 | 50 | $100 | $0 | $100 |
| 3 | 200 | $500 | $1 | $499 |
| 6 | 500 | $1,500 | $6 | $1,494 |
| 12 | 1,200 | $4,000 | $110 | $3,890 |

### Aggressive Case (March Madness Goes Viral)

| Month | Subscribers | Revenue | Costs | Profit |
|-------|-----------|---------|-------|--------|
| 1 | 200 | $500 | $0 | $500 |
| 3 | 1,000 | $3,000 | $30 | $2,970 |
| 6 | 3,000 | $8,000 | $110 | $7,890 |
| 12 | 10,000 | $25,000 | $314 | $24,686 |

### Break-Even Analysis

| Monthly Cost | Revenue Needed | How to Get There |
|-------------|---------------|-----------------|
| $0 (free tier) | $0 | You're already profitable |
| $6 (domain + Brevo) | 1 affiliate signup | Achievable in Week 1 |
| $110 (Railway + API + email) | 2 affiliate signups | Achievable at 200 subscribers |
| $314 (full production stack) | 4 affiliate signups | Achievable at 500 subscribers |

**Key insight:** Because costs are near-zero at the start, you are profitable from your very first affiliate signup.

---

## 12. Exit Strategies

If this works, you'll eventually face the question: keep it or sell it?

### Option A — Keep Running (Passive Income)

- Automate everything (GitHub Actions for email, minimal maintenance)
- Time investment: 2-3 hours/week
- Revenue: $2,000-5,000/month indefinitely
- Best if: You enjoy it and the income is meaningful

### Option B — Sell the Newsletter

- Newsletter businesses sell for 24-36× monthly revenue
- At $3,000/month = sale price of $72,000-108,000
- Platforms: [Duuce](https://duuce.com), [Flippa](https://flippa.com), Twitter DMs
- Best if: You've reached 2,000+ subscribers and want a lump sum

### Option C — Sell the Code / Template

- Package BetBoard as a "build your own betting dashboard" template
- Price: $49-199 per license
- Platforms: Gumroad, CodeCanyon
- Revenue: passive, scales without subscribers
- Best if: You'd rather sell tools than run a newsletter

### Option D — Pivot to SaaS

- Rebuild as a proper SaaS (React frontend, Python backend, database, auth)
- Charge $10-50/month with free trial
- Requires significant investment (3-6 months of dev)
- Revenue potential: $10,000-50,000/month at scale
- Best if: You want to build a real company, not a side project

---

## The Bottom Line

**BetBoard is a real product that solves a real problem.** The sports betting analytics market is growing, the margins are incredible (98%+), and the timing is perfect (March Madness 2026).

**What separates you from the 95% of side projects that fail:**
1. You already have a working product (most people never finish)
2. You have a built-in distribution channel (newsletter)
3. Your costs are $0 to start (no financial risk)
4. March Madness creates urgency and relevance RIGHT NOW

**The only thing left is execution.** Deploy it, promote it, track the numbers, iterate weekly.

---

*This document should be reviewed and updated monthly. See [ROADMAP.md](ROADMAP.md) for the technical improvement backlog.*
