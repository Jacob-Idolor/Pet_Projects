# 💰 BetBoard — Monetization Playbook

**Last updated: March 4, 2026**

> A realistic, no-BS guide to turning BetBoard into passive income. Sorted by "easy money first" — start at the top and work down.

---

## Table of Contents

1. [Revenue Model Overview](#1-revenue-model-overview)
2. [Tier 1 — Affiliate Links (Day 1, $0 Cost)](#2-tier-1--affiliate-links)
3. [Tier 2 — Newsletter Monetization (Week 1)](#3-tier-2--newsletter-monetization)
4. [Tier 3 — Ad Placements (100+ Daily Visitors)](#4-tier-3--ad-placements)
5. [Tier 4 — Premium Subscription (100+ Subscribers)](#5-tier-4--premium-subscription)
6. [Tier 5 — Sponsorships (500+ Subscribers)](#6-tier-5--sponsorships)
7. [Tier 6 — Digital Products (Anytime)](#7-tier-6--digital-products)
8. [Revenue Projections — Realistic Numbers](#8-revenue-projections)
9. [Affiliate Program Directory](#9-affiliate-program-directory)
10. [Email Provider Cost Comparison](#10-email-provider-cost-comparison)
11. [Monthly P&L Template](#11-monthly-pl-template)
12. [The 90-Day Launch Plan](#12-the-90-day-launch-plan)

---

## 1. Revenue Model Overview

BetBoard generates revenue through **5 channels**, ordered by ease:

```
┌──────────────────────────────────────────────────────────────────────┐
│  REVENUE FUNNEL                                                       │
│                                                                       │
│  Visitor lands on BetBoard (free)                                     │
│    │                                                                  │
│    ├─→ Clicks affiliate link → Signs up at sportsbook     → $50-200  │
│    ├─→ Sees ad placement → Ad impression/click             → $0.01-5 │
│    ├─→ Subscribes to free newsletter                                  │
│    │     ├─→ Affiliate links in every email                → $50-200 │
│    │     ├─→ Upgrades to Premium ($5-15/mo)                → $5-15   │
│    │     └─→ Reads sponsored placement                     → $50-500 │
│    ├─→ Buys digital product (betting guide)                → $29-99  │
│    └─→ Tips via Buy Me a Coffee                            → $3-25   │
└──────────────────────────────────────────────────────────────────────┘
```

**Your biggest revenue driver early on: Sportsbook affiliate signups ($50–200 each).**

---

## 2. Tier 1 — Affiliate Links

**Start: Day 1** | **Cost: $0** | **Revenue: $50–200 per signup** | **Effort: 30 minutes**

### What Are Affiliate Links?

When someone clicks your link and creates a funded sportsbook account, the sportsbook pays you a commission. This is the sports betting industry's primary customer acquisition method — they *want* to pay you.

### Where BetBoard Already Has Placement Spots

The app already has these built-in ad/link spots:

1. **Sidebar "Sportsbook Bonuses" expander** — lists FanDuel, DraftKings, BetMGM, Caesars, ESPN BET with placeholder links
2. **Every email newsletter** — can include affiliate CTAs
3. **Hero landing screen** — 6 feature cards visible on load
4. **My Bets tab** — when users log a bet at a specific sportsbook

### How to Get Affiliate Links

Apply to these programs (most approve within 24–48 hours):

| Program | Apply At | Typical Payout | Notes |
|---------|----------|----------------|-------|
| **FanDuel** | [fanduel.com/partners](https://www.fanduel.com/partners) | $50–100/signup | Largest US sportsbook |
| **DraftKings** | [draftkings.com/affiliates](https://www.draftkings.com/affiliates) | $50–100/signup | #2 market share |
| **BetMGM** | [betmgmaffiliates.com](https://betmgmaffiliates.com) | $100–200/signup | Highest payouts |
| **Caesars** | [caesars.com/affiliates](https://www.caesars.com/affiliates) | $100–150/signup | Good brand recognition |
| **ESPN BET** | Contact via ESPN sports partnerships | $50–75/signup | Growing platform |
| **bet365** | [bet365affiliates.com](https://www.bet365affiliates.com) | $30–50/signup | International |

### Where to Place Links in the Code

The sidebar bonus section is in `sports_analysis_dashboard.py` inside the `MonetizationManager` class. Replace the placeholder URLs:

```python
# Current (placeholder):
{"name": "FanDuel", "bonus": "Bet $5, Get $200 in Bonus Bets", "code": "BETBOARD", "link": "#"}

# Updated (with your real affiliate link):
{"name": "FanDuel", "bonus": "Bet $5, Get $200 in Bonus Bets", "code": "BETBOARD", "link": "https://fanduel.com/ref/YOUR_AFFILIATE_ID"}
```

### Revenue Estimate

| Monthly Visitors | Signup Rate | Avg Payout | Monthly Revenue |
|-----------------|-------------|------------|-----------------|
| 100 | 2% (2 signups) | $75 | **$150** |
| 500 | 2% (10 signups) | $75 | **$750** |
| 1,000 | 2% (20 signups) | $75 | **$1,500** |
| 5,000 | 1.5% (75 signups) | $75 | **$5,625** |

> **Affiliate links alone can generate $150–750/month with modest traffic.** This is the #1 revenue channel for sports betting sites.

---

## 3. Tier 2 — Newsletter Monetization

**Start: Week 1** | **Cost: $0 (Brevo free tier)** | **Revenue: $50–500/mo** | **Effort: 15 min/day**

### The Newsletter Flywheel

```
Free daily pick → Subscriber trusts you → Opens emails → Clicks affiliate
links / Upgrades to Premium → Revenue
```

Your newsletter (`send_daily_pick.py` + GitHub Actions) already sends a daily "Pick of the Day" email automatically at 9 AM ET. Each email is a revenue opportunity.

### Email Monetization Tactics

1. **Affiliate CTA in every email** — "Today's pick is on FanDuel. Don't have an account? [Get $200 in bonus bets →]"
2. **Sportsbook promo callout** — "DraftKings is offering 30% profit boost on NCAAB today. [Claim it →]"
3. **Track record flex** — "This month: 18-12 (60%), +$430 profit. [See all picks on BetBoard →]"
4. **Weekly recap email** — "Top 5 picks this week, how they hit, next week's best bets"

### Growing Your Subscriber List

BetBoard already has subscriber capture in:
- The **Newsletter tab** (form + honeypot + validation)
- The **sidebar** (compact email capture)

To grow faster:
- **Share picks on Twitter/X** — "BetBoard Pick of the Day: Duke -3.5 (Edge: 4.2%). Free daily picks → [link]"
- **Post in sports betting subreddits** — r/sportsbook, r/SportsBetting, r/MarchMadness (check rules first)
- **Sports betting Discord servers** — share your app link with picks
- **Create a landing page** — use BetBoard's hero screen as the landing page

### Email Provider Cost at Scale

| Subscribers | Emails/Month | Brevo Cost | Resend Cost |
|-------------|-------------|------------|-------------|
| 1–300 | ~9,000 | **$0** | $0 |
| 300–1,000 | ~30,000 | **$25/mo** | $20/mo |
| 1,000–5,000 | ~150,000 | **$65/mo** | $80/mo |

BetBoard supports **both Brevo and Resend** — switch between them in the Newsletter tab sidebar.

---

## 4. Tier 3 — Ad Placements

**Start: 100+ daily visitors** | **Cost: $0** | **Revenue: $50–500/mo**

### Option A — Google AdSense (Programmatic)

> **Note:** Streamlit apps can't directly embed Google AdSense scripts easily because Streamlit renders HTML inside iframes. The best approach is to use Streamlit's `st.markdown()` with `unsafe_allow_html=True` for static ad placements, or use **affiliate links styled as ads** (which BetBoard already has).

BetBoard already has **dark-themed ad placeholders** in the sidebar that look like ads but link to affiliate programs. This is actually *better* than AdSense because:

- Sportsbook affiliate payouts ($50–200) >>> AdSense click payouts ($0.50–2.00)
- No approval process needed
- You control what appears
- No third-party tracking scripts

### Option B — Carbon Ads (Developer/Tech Audience)

If BetBoard attracts a tech-savvy audience:

1. Apply at **[carbonads.net](https://www.carbonads.net)**
2. They serve tasteful single-ad placements
3. Revenue: ~$2–5 CPM (per 1,000 impressions)
4. Good for sidebar placement

### Option C — Direct Sponsorship Banners

Sell banner space directly to betting tool companies:

- Odds aggregators (OddsJam, OddsShopper)
- Bankroll management apps
- Sports data providers
- Betting course creators

Rate: $100–500/month for a banner spot in the sidebar.

### The BetBoard Ad Strategy (Recommended)

```
Don't use AdSense. Instead:

1. Keep affiliate "bonus" cards in the sidebar          → $50-200 per signup
2. Add 1-2 direct sponsor banners when available        → $100-500/mo fixed
3. Include affiliate CTAs in every newsletter email     → $50-200 per signup
4. Save AdSense for if/when you build a separate blog   → $2-5 CPM
```

---

## 5. Tier 4 — Premium Subscription

**Start: 100+ free subscribers** | **Cost: Stripe fees (2.9% + $0.30)** | **Revenue: $500–5,000/mo**

### Free vs Premium Tier

| Feature | Free Tier | Premium ($5–15/mo) |
|---------|-----------|-------------------|
| Daily picks | 1/day | 3–5/day |
| Pick delivery | 9 AM | 7 AM (early bird) |
| Parlay suggestions | ❌ | ✅ (2-3 leg parlays) |
| Conference/division breakdowns | ❌ | ✅ |
| Win/loss track record | Weekly summary | Real-time dashboard |
| Discord/community access | ❌ | ✅ |
| Ad-free emails | ❌ | ✅ |

### Implementation Path

1. **Create a Stripe account** — [stripe.com](https://stripe.com) (free to create, you only pay when you charge)
2. **Create a product** — "BetBoard Premium" → $9.99/month recurring
3. **Get a payment link** — Stripe generates a URL like `https://buy.stripe.com/xxx`
4. **Add the link to BetBoard** — in the Newsletter tab as an "Upgrade" button
5. **Gate premium content** — check subscriber CSV for `tier=premium` flag

### Pricing Sweet Spots

| Price | Conversion Rate | At 500 Subs | At 1,000 Subs |
|-------|----------------|------------|--------------|
| $4.99/mo | 8–12% | $200–300/mo | $400–600/mo |
| $9.99/mo | 4–7% | $200–350/mo | $400–700/mo |
| $14.99/mo | 2–4% | $150–300/mo | $300–600/mo |

> **Recommendation:** Start at **$9.99/month** or **$79/year** (save 34%). The discount encourages annual commits.

---

## 6. Tier 5 — Sponsorships

**Start: 500+ subscribers** | **Cost: $0** | **Revenue: $200–2,000/mo**

### Who Pays for Newsletter Sponsorships?

1. **Sportsbook affiliate managers** — they'll pay for dedicated sends
2. **Sports betting tools** (OddsJam, OddsShopper, Unabated) — they want your audience
3. **Fantasy sports platforms** — seasonal around NFL, NBA, MLB
4. **Betting course creators** — "learn to bet" products
5. **Bankroll tracking apps** — direct competitors pay for exposure

### Outreach Template

```
Subject: Sponsorship opportunity — BetBoard newsletter (X,XXX subscribers)

Hi [Name],

I run BetBoard, a daily sports betting picks newsletter focused on
NBA and March Madness. We currently have X,XXX subscribers with a
Y% open rate and Z% click-through rate.

I'd love to explore a sponsored placement in our daily pick email.
Options:
- Single dedicated email: $XXX
- Week of banner placements: $XXX
- Monthly sidebar sponsor: $XXX

Happy to share our media kit and audience demographics.

Best,
[Your Name]
BetBoard — [your-url].streamlit.app
```

### Sponsorship Pricing Guide

| Subscriber Count | Open Rate | Single Blast | Weekly Banner | Monthly Sidebar |
|-----------------|-----------|-------------|--------------|----------------|
| 500 | 35%+ | $100–200 | $200–400 | $300–500 |
| 1,000 | 35%+ | $200–500 | $400–800 | $500–1,000 |
| 5,000 | 30%+ | $500–1,500 | $1,000–3,000 | $2,000–5,000 |

---

## 7. Tier 6 — Digital Products

**Start: Anytime** | **Cost: $0 (Gumroad takes 10%)** | **Revenue: $500–5,000/mo**

### Product Ideas

| Product | Price | Platform | Effort |
|---------|-------|----------|--------|
| "How I Pick Winners" PDF guide | $19–49 | Gumroad | 2–3 days |
| March Madness bracket strategy guide | $9.99 | Gumroad | 1 day |
| Betting spreadsheet template (Excel) | $14.99 | Gumroad | 1 day |
| Video course: "Sports Betting 101" | $49–99 | Gumroad/Teachable | 1 week |
| BetBoard self-hosted license | $29–99 one-time | Gumroad | 0 effort (sell the code) |

### Selling the Code Itself

BetBoard is a fully functional betting analytics platform. You can sell it as a template:

- **"Build Your Own Sports Betting Dashboard"** — $49–99
- Includes source code, setup guide, API key instructions
- Marketed to developers and sports bettors on Twitter/X, Reddit, Product Hunt
- List on **[gumroad.com](https://gumroad.com)** — takes 10% commission, handles payments

---

## 8. Revenue Projections

### Realistic Monthly Revenue by Stage

| Stage | Monthly Visitors | Subscribers | Revenue Sources | Monthly Revenue |
|-------|-----------------|-------------|----------------|-----------------|
| **Month 1** | 50–100 | 10–30 | Affiliate links only | **$0–150** |
| **Month 3** | 200–500 | 50–100 | Affiliates + newsletter CTAs | **$150–500** |
| **Month 6** | 500–1,000 | 200–500 | Affiliates + premium tier + ads | **$500–2,000** |
| **Month 12** | 1,000–5,000 | 500–1,500 | All channels active | **$2,000–8,000** |
| **Year 2** | 5,000+ | 2,000+ | Full monetization | **$5,000–20,000** |

### Revenue vs Cost (Break-Even Analysis)

| Revenue/mo | Hosting Cost | API Cost | Email Cost | Domain | Net Profit |
|-----------|-------------|---------|------------|--------|------------|
| $0 | $0 | $0 | $0 | $0 | **$0** |
| $150 | $0 | $0 | $0 | $1 | **$149** |
| $500 | $0 | $0 | $0 | $1 | **$499** |
| $2,000 | $5 | $0 | $25 | $1 | **$1,969** |
| $5,000 | $5 | $79 | $65 | $1 | **$4,850** |
| $10,000 | $20 | $199 | $90 | $1 | **$9,690** |

> **The margins are incredible.** At $2,000/month revenue, your costs are ~$31. That's a 98.5% profit margin.

---

## 9. Affiliate Program Directory

### Sportsbook Affiliates (Highest Payouts)

| Company | Program | Payout | Cookie | Apply |
|---------|---------|--------|--------|-------|
| FanDuel | FanDuel Partners | $50–100/CPA | 30 days | [fanduel.com/partners](https://www.fanduel.com/partners) |
| DraftKings | DK Affiliates | $50–100/CPA | 30 days | [draftkings.com/affiliates](https://www.draftkings.com/affiliates) |
| BetMGM | BetMGM Affiliates | $100–200/CPA | 30 days | [betmgmaffiliates.com](https://betmgmaffiliates.com) |
| Caesars | Caesars Affiliates | $100–150/CPA | 30 days | [caesars.com/affiliates](https://www.caesars.com/affiliates) |
| BetRivers | Rush Street Affiliates | $50–75/CPA | 30 days | [rushstreetinteractive.com](https://www.rushstreetinteractive.com) |

### Betting Tool Affiliates (Recurring Revenue)

| Company | Payout | Type | Notes |
|---------|--------|------|-------|
| OddsJam | 30% recurring | Revenue share | Popular odds comparison tool |
| Unabated | $25/referral | CPA | Line shopping tool |
| Action Network | $10–20/referral | CPA | Betting content platform |

---

## 10. Email Provider Cost Comparison

BetBoard supports both providers. Here's the full comparison:

| Feature | Brevo (Sendinblue) | Resend |
|---------|-------------------|--------|
| **Free tier** | **9,000/month** (300/day) | 3,000/month |
| **First paid tier** | $25/mo (20K emails) | $20/mo (50K emails) |
| **API style** | REST + SMTP | REST only |
| **Built into BetBoard** | ✅ Yes | ✅ Yes |
| **Transactional + Marketing** | Both | Transactional focused |
| **Best for** | Starting out (3x free emails) | Scaling up (cheaper at volume) |

**Recommendation:** Start with **Brevo** (more free emails), switch to **Resend** when you exceed 9,000/month.

---

## 11. Monthly P&L Template

Track your BetBoard business each month:

```
MONTH: ____________

REVENUE
  Affiliate signups:      ___ × $____ = $________
  Newsletter affiliates:  ___ × $____ = $________
  Premium subscribers:    ___ × $____ = $________
  Sponsorships:                         $________
  Digital products:                     $________
  Tips / donations:                     $________
  ──────────────────────────────────────────────
  TOTAL REVENUE:                        $________

COSTS
  Hosting:                              $________
  The Odds API:                         $________
  Email provider:                       $________
  Domain:                               $________
  ──────────────────────────────────────────────
  TOTAL COSTS:                          $________

NET PROFIT:                             $________
PROFIT MARGIN:                          ________%

METRICS
  Total site visitors:                  ________
  New subscribers:                      ________
  Total subscribers:                    ________
  Newsletter open rate:                 ________%
  Pick record (W-L):                    ________
  Pick ROI:                             ________%
```

---

## 12. The 90-Day Launch Plan

### Week 1 — Deploy & Seed

- [ ] Deploy BetBoard to Streamlit Community Cloud (free)
- [ ] Apply to FanDuel + DraftKings + BetMGM affiliate programs
- [ ] Replace placeholder affiliate links in sidebar
- [ ] Set up Brevo account (free) + configure in BetBoard
- [ ] Activate GitHub Actions daily email
- [ ] Subscribe yourself + 5 friends as test subscribers
- [ ] Set up UptimeRobot monitoring

### Week 2 — Content & Promotion

- [ ] Post your first pick on Twitter/X with BetBoard link
- [ ] Share BetBoard in 2–3 sports betting subreddits (follow rules)
- [ ] Join 2 sports betting Discord servers, share picks
- [ ] Send your first real newsletter blast to subscribers
- [ ] Track: which picks hit, which missed (builds credibility)

### Week 3–4 — Grow the List

- [ ] Post daily picks on Twitter/X (build the habit)
- [ ] Create a simple landing page / bio link (linktr.ee or similar)
- [ ] Reach 25 subscribers goal
- [ ] Review feedback tab — act on top requests
- [ ] Track open rates and click rates

### Month 2 — Monetize

- [ ] Affiliate links should be approved — verify they work
- [ ] Add affiliate CTAs to every newsletter email
- [ ] First affiliate payout should be arriving
- [ ] Reach 50 subscribers goal
- [ ] Consider: should I add a premium tier?
- [ ] Track W-L record publicly (transparency builds trust)

### Month 3 — Scale

- [ ] Reach 100 subscribers goal
- [ ] Launch premium tier ($9.99/mo via Stripe) if demand exists
- [ ] Approach 1–2 sponsors for newsletter placements
- [ ] Buy a custom domain ($8–12/year)
- [ ] Review P&L — are you profitable?
- [ ] Set Q2 growth targets

---

## The Bottom Line

**BetBoard's path to passive income:**

1. **$0 to launch** — Streamlit Cloud + Brevo + Odds API free tiers
2. **$150–750/month** within 3 months from affiliate links alone
3. **$2,000–8,000/month** within 12 months with all channels active
4. **98%+ profit margins** — almost no costs until serious scale
5. **The subscriber list is your asset** — it compounds over time

The key insight: **Every subscriber is worth $1–5/month to you.** Get to 1,000 subscribers and you have a $1,000–5,000/month business on autopilot.

---

*Next: See [DEPLOYMENT_GUIDE.md](DEPLOYMENT_GUIDE.md) for step-by-step hosting setup and [USER_GUIDE.md](USER_GUIDE.md) to understand every app feature.*
