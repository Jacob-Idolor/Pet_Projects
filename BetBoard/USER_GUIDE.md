# 🎯 BetBoard — User Guide

**Last updated: March 4, 2026** | **App Version: 9.0**

> Everything you need to know about using BetBoard to make smarter sports bets, understand odds, and get an edge during March Madness, NBA, and beyond.

---

## Table of Contents

1. [What Is BetBoard?](#1-what-is-betboard)
2. [How It's Different From Other Apps](#2-how-its-different)
3. [Getting Started (2 Minutes)](#3-getting-started)
4. [Tab-by-Tab Walkthrough](#4-tab-by-tab-walkthrough)
5. [Understanding the Numbers](#5-understanding-the-numbers)
6. [March Madness Game Plan](#6-march-madness-game-plan)
7. [NBA & NFL Betting Strategies](#7-nba--nfl-betting-strategies)
8. [The Pick of the Day Algorithm](#8-the-pick-of-the-day-algorithm)
9. [How to Use BetBoard to Actually Make Money](#9-how-to-use-betboard-to-actually-make-money)
10. [Glossary](#10-glossary)
11. [FAQ](#11-faq)

---

## 1. What Is BetBoard?

BetBoard is a **free sports betting command center** that pulls live odds from 8+ sportsbooks in real time and helps you find the best bets.

Think of it as your **unfair advantage** — while most bettors check one sportsbook, BetBoard shows you every price from every book side-by-side and tells you exactly where the value is.

### What It Does

| Feature | What It Means For You |
|---------|----------------------|
| **Live odds from 8+ books** | See FanDuel, DraftKings, BetMGM, Caesars, and more — all in one screen |
| **Value bet finder** | Tells you when a sportsbook is offering a price better than it should be |
| **Arbitrage detector** | Spots guaranteed-profit bets where you can bet both sides and win no matter what |
| **EV calculator** | Shows if a bet is mathematically profitable long-term |
| **Kelly Criterion** | Tells you exactly how much to bet (not too much, not too little) |
| **Player props comparison** | Compares Over/Under prices across all books for any player |
| **Bet tracker with P&L** | Track every bet, see your win rate, ROI, and profit over time |
| **Daily pick email** | Automated email every morning with the best bet of the day |
| **Feedback system** | Request features and report bugs right in the app |

### Supported Sports

BetBoard pulls live data for any sport with active odds:

- 🏀 **NBA** (year-round)
- 🏀 **NCAAB / March Madness** (Nov–Apr, peak in March)
- 🏈 **NFL** (Sep–Feb)
- 🏈 **NCAAF / College Football** (Aug–Jan)
- ⚾ **MLB** (Mar–Oct)
- 🏒 **NHL** (Oct–Jun)
- ⚽ **Soccer** (MLS, EPL, Champions League)
- 🥊 **MMA / UFC**

---

## 2. How It's Different

### BetBoard vs. FanDuel / DraftKings Apps

| | Sportsbook Apps | BetBoard |
|---|---|---|
| **Purpose** | Take your bets (they want you to lose) | Help you find the best bets (wants you to win) |
| **Odds shown** | Only their own odds | All 8+ books side-by-side |
| **Value bets** | Never shown (costs them money) | Highlighted automatically |
| **Arbitrage** | Hidden (guaranteed loss for them) | Calculated with exact stake sizes |
| **Bias** | Biased toward their house edge | Mathematically neutral |
| **Cost** | Free (they make money on your losses) | Free (makes money on affiliates) |

### BetBoard vs. OddsJam / Action Network / Other Tools

| | Paid Tools ($30–100/mo) | BetBoard |
|---|---|---|
| **Cost** | $30–100/month | **$0** |
| **Open source** | No | Yes — you own the code |
| **Customizable** | No | Fully — add any feature you want |
| **Newsletter** | No | Built-in daily pick emailer |
| **Bet tracking** | Basic | Full parlay support + P&L charts |
| **Self-hosted** | No | Yes — your data stays private |

**The core value proposition:** BetBoard gives you 80% of what a $50/month tool does, for free, with the bonus of a newsletter system you can monetize.

---

## 3. Getting Started

### Step 1 — Open BetBoard

If running locally:
```
http://localhost:8517
```

If deployed:
```
https://YOUR_USERNAME-betboard.streamlit.app
```

### Step 2 — Odds Are Provided by the Site

Odds data is loaded automatically. You don't need to enter an API key. Expand the sidebar (**`>`** in the top-left) to see **"Odds data: Connected"** when the site is configured.

### Step 3 — Select Your Sports

In the sidebar under **"Select Sports"**, choose:
- **Basketball — NBA** ← always on
- **Basketball — NCAAB (March Madness)** ← during college season
- Add any others you bet on

### Step 4 — Explore the Tabs

Click through the 8 tabs across the top. Each one is explained in detail below.

---

## 4. Tab-by-Tab Walkthrough

### 📅 Tab 1 — Today's Board

**What it shows:** Every game happening today (and upcoming) with live odds from every sportsbook.

**How to use it:**
1. Games are displayed as cards with team names, tip-off time, and odds
2. Each card shows **Moneyline**, **Spread**, and **Over/Under** from multiple books
3. **Green highlights** = best available price for that bet
4. Click **📌 Pin** to add any game to your Watchlist
5. During March Madness, a special banner appears at the top

**What to look for:**
- **Big odds differences between books** — if FanDuel has Duke at -150 and DraftKings has Duke at -130, the -130 is better value
- **Line movement** — if a spread moves from -3 to -5, heavy money is coming in on one side
- **Games with many books listed** — more competition = better odds for you

### 📌 Tab 2 — Watchlist

**What it shows:** Only the games you've pinned from Today's Board.

**How to use it:**
1. Pin games you're interested in from Tab 1
2. Come back to Watchlist to track just those games
3. Unpin games when they're over or you've placed your bet

**Pro tip:** Pin 3–5 games you're considering, then compare them all in one view before deciding where to put your money.

### 🔬 Tab 3 — Analysis

This tab has **5 sub-tabs** packed with analytical tools:

#### 💎 Sub-tab: Value Bets

**What it shows:** Bets where one sportsbook's price is significantly better than the market average.

**How to read it:**
- **Edge %** — how much better the best price is vs. the average. Higher = more value.
- **Edge > 5%** = strong value (highlighted)
- **Edge > 10%** = rare, exceptional value (grab it fast — books correct these quickly)

**Example:**
```
Game: Duke vs UNC
Market: Duke Moneyline
Best Odds: -120 (FanDuel)
Avg Odds:  -145 (market average)
Edge:      8.3%  ← FanDuel is offering a much better price than they should
```

**Action:** Bet the -120 at FanDuel. You're getting a price that implies ~54.5% probability when the market consensus says ~59.2%. That's free edge.

#### ⚖️ Sub-tab: Arbitrage

**What it shows:** Games where you can bet both sides across different books and **guarantee a profit** regardless of outcome.

**How it works:**
1. Book A has Team 1 at +150
2. Book B has Team 2 at +120
3. If the combined implied probability is under 100%, there's an arbitrage opportunity
4. BetBoard calculates the exact dollar amount to bet on each side

**Example:**
```
Arbitrage Found!  Profit: 2.3%
Bet $54.20 on Duke at FanDuel (+150)
Bet $45.80 on UNC at DraftKings (+120)
Total staked: $100
Guaranteed return: $102.30  (no matter who wins)
```

**Reality check:** Arbitrage opportunities are rare (maybe 1–3 per day across all sports) and disappear within minutes. When you see one, act fast.

#### 🧮 Sub-tab: EV Calculator

**What it shows:** Whether a bet is mathematically profitable long-term.

**How to use it:**
1. Enter the **American odds** (e.g., +150 or -110)
2. Enter your **estimated win probability** (e.g., 55%)
3. BetBoard calculates the Expected Value (EV)

**Reading the result:**
- **+EV** (positive) = profitable long-term → **bet it**
- **-EV** (negative) = losing long-term → **skip it**
- **0 EV** = break-even → no edge

**Formula:** `EV = (Win% × Payout) - (Loss% × Stake)`

**Example:**
```
Odds: +150  |  Your Win Prob: 45%
Payout if win: $150 on a $100 bet
EV = (0.45 × $150) - (0.55 × $100) = $67.50 - $55.00 = +$12.50

+EV! You'd make $12.50 per $100 bet on average over time.
```

#### 📐 Sub-tab: Kelly Criterion

**What it shows:** The mathematically optimal bet size based on your edge and bankroll.

**How to use it:**
1. Enter your **bankroll** (total money dedicated to betting)
2. Enter the **odds** and your **win probability**
3. Kelly tells you the ideal percentage to bet

**Why it matters:** Most bettors bet too much or too little. Kelly Criterion prevents:
- **Over-betting** — risking too much on one game (ruin risk)
- **Under-betting** — not capitalizing on strong edges

**Rule of thumb:** Most pros use **Half Kelly** (bet half of what Kelly suggests) for safety.

**Example:**
```
Bankroll: $1,000
Odds: +150  |  Win Prob: 50%
Full Kelly: 16.7% → $167
Half Kelly: 8.3% → $83  ← bet this amount
```

#### 📈 Sub-tab: Odds Comparison Chart

**What it shows:** A visual bar chart comparing one team's moneyline odds across all sportsbooks.

**How to use it:** Instantly see which book has the best price. The tallest bar = best odds = where you should place the bet.

### 🎯 Tab 4 — Props (Player Props)

**What it shows:** Player prop bets (Points Over/Under, Rebounds, Assists, etc.) compared across all books.

**How to use it:**
1. Select a game from the dropdown
2. See every player prop available
3. **Green highlight** = best Over price, **Blue highlight** = best Under price
4. Bet the prop at whichever book offers the best number

**Example:**
```
LeBron James Points O/U 25.5
  FanDuel:    Over -110  |  Under -110
  DraftKings: Over -105  |  Under -115  ← Better Over price!
  BetMGM:     Over -108  |  Under -112
```

### 🏆 Tab 5 — Scores

**What it shows:** Live scores for in-progress games, final results, and upcoming schedule.

**How to use it:** Check if your bets are winning in real-time. See final scores. Plan tomorrow's bets.

### 📝 Tab 6 — My Bets

**What it shows:** Your complete bet tracker — straight bets AND parlays — with live P&L analytics.

**How to use it:**

1. **Add a straight bet:** Fill in the team, odds, stake, sportsbook, and ticket number
2. **Add a parlay:** Toggle "Parlay" mode, add 2–12 legs, each with its own odds and status
3. **Update outcomes:** Mark bets as Won, Lost, Push, or Active
4. **View P&L dashboard:**
   - **Net Profit/Loss** — your total earnings or losses
   - **ROI %** — return on investment (positive = you're beating the books)
   - **Win Rate %** — percentage of bets that hit
   - **Record** — W-L-P (Wins, Losses, Pushes)
   - **Pie chart** — visual breakdown of bet outcomes
   - **ROI trend line** — tracks your performance over time

**Pro tip:** Be religious about tracking EVERY bet. The data doesn't lie — after 50+ bets, you'll see which sports, bet types, and books are most profitable for you.

### 📧 Tab 7 — Newsletter

**What it shows:** The Pick of the Day system — auto-generated best bet, subscriber management, and email blasting.

**How it works:**
1. BetBoard analyzes all loaded games across all sports
2. Finds the bet with the highest edge vs. market consensus
3. Generates a professional HTML email with:
   - The pick (team, odds, book)
   - Edge percentage
   - Quick analysis
   - Gambling disclaimer
4. You can preview, test, and send to your subscriber list

**Email providers:** Choose between **Resend** (3,000/mo free) or **Brevo** (9,000/mo free) in the sidebar.

### 💬 Tab 8 — Feedback

**What it shows:** A form for users (including you) to submit feature requests, bug reports, and general feedback.

**Features:**
- 3 feedback types: 🚀 Feature Request, 🐛 Bug Report, 💬 General
- Submissions saved locally to `feedback.json`
- Anti-spam: honeypot fields, keyword filter, rate limiting
- Admin view: see all feedback in a table + download as CSV
- Stats strip: total entries, requests, bugs, general breakdown

---

## 5. Understanding the Numbers

### American Odds (The Basics)

| Odds | Meaning | Bet $100 → Win | Implied Probability |
|------|---------|-----------------|-------------------|
| **-110** | Slight favorite | $90.91 profit | 52.4% |
| **-150** | Moderate favorite | $66.67 profit | 60.0% |
| **-300** | Heavy favorite | $33.33 profit | 75.0% |
| **+100** | Even money | $100.00 profit | 50.0% |
| **+150** | Moderate underdog | $150.00 profit | 40.0% |
| **+300** | Big underdog | $300.00 profit | 25.0% |

**Quick mental math:**
- Negative odds: divide 100 by the number → that's your profit per $100 bet
- Positive odds: that IS your profit per $100 bet

### Edge % (What BetBoard Calculates)

**Edge = how much better the best price is vs. the market average.**

```
Edge 0-2%   → Marginal (normal market variance)
Edge 2-5%   → Interesting (worth a look)
Edge 5-10%  → Strong value (bet this)
Edge 10%+   → Exceptional (rare, act immediately)
```

### Expected Value (EV)

**EV = how much you'd profit per $1 bet over thousands of repetitions.**

```
+EV  → Profitable long-term → BET
0 EV → Break-even → SKIP
-EV  → Losing long-term → SKIP
```

Every sportsbook bet has a built-in house edge (the "vig" or "juice"), typically -110 on both sides. That means most bets are slightly -EV. BetBoard finds the exceptions — the +EV bets where the numbers are in YOUR favor.

### Implied Probability

Every set of odds implies a win probability:

```
-110 → 52.4% (standard "even" bet with juice)
-200 → 66.7% (heavy favorite)
+200 → 33.3% (underdog)
+500 → 16.7% (long shot)
```

**The key insight:** If you think a team has a 55% chance of winning but the odds imply only 50% (even money / +100), that's a value bet. You have a 5% edge.

### Kelly Criterion (How Much to Bet)

Kelly tells you the mathematically optimal bet size:

```
Kelly % = (bp - q) / b

Where:
b = decimal odds - 1 (payout multiple)
p = your estimated win probability
q = 1 - p (loss probability)
```

**In practice:**
- Full Kelly is aggressive — use **Half Kelly** or **Quarter Kelly** for safety
- Never bet more than 5% of your bankroll on a single bet
- If Kelly says 0% or negative — **don't bet**

---

## 6. March Madness Game Plan

March Madness (NCAA Tournament) is the **biggest betting opportunity of the year**. Here's how to use BetBoard for it:

### Before the Tournament (First Two Weeks of March)

1. **Set sports to NCAAB** in the sidebar
2. **Watch line movement** on conference tournament games — these preview tournament matchups
3. **Track your bets** in My Bets — build data before the Big Dance
4. **Subscribe to the newsletter** — daily picks start ramping up

### During the Tournament (Mid-March to Early April)

#### First Round (64 → 32)

- **Focus on 5-12, 6-11, 7-10 matchups** — these have the most upsets and mispriced odds
- **Use the Value Bets tab** — books often misprice mid-major teams (Cinderella candidates)
- **Check Arbitrage** — first-round games have the most books offering odds, creating more arb opportunities
- **Don't parlay first-round games** — too many upsets. Straight bets only.

#### Sweet 16 and Elite 8

- **Lines tighten** — less value available as books adjust
- **Player props become valuable** — BetBoard's Props tab shines here
- **Use Kelly Criterion** — with fewer games, proper sizing matters more

#### Final Four and Championship

- **Maximum public betting** — the public overvalues blue bloods (Duke, UNC, Kansas, Kentucky)
- **Fade the public** — if 75%+ of money is on one side, consider the other
- **One or two bets max** — don't spray bets, focus on your best edge

### March Madness Specific Tips

1. **Unders are undervalued early** — first-round games often go under with nerves and tempo changes
2. **Double-digit seeds cover more than you think** — 12-seeds beat 5-seeds ~35% of the time
3. **Track which books are slowest to adjust lines** — those are where value hides
4. **Check BetBoard 30–60 minutes before tip-off** — late line movements reveal sharp money

---

## 7. NBA & NFL Betting Strategies

### NBA Season

**When to bet:**
- **Early season (Oct–Dec):** Books are setting lines based on last season. Teams change. Find value on improved teams that books haven't adjusted for.
- **All-Star break (Feb):** Lines reset. Look for value in second-half projections.
- **Playoffs (Apr–Jun):** Fewer games, more analysis per game. Props become more valuable.

**NBA-specific BetBoard usage:**
- **Player Props** — NBA has the most prop markets. Use Tab 4 heavily.
- **Back-to-back games** — Teams on the second night of a back-to-back are fatigued. BetBoard shows you which games those are.
- **Totals** — NBA totals (over/under points) are often mispriced early in the season.

### NFL Season

**When to bet:**
- **Week 1:** Books have the LEAST data. Most mispriced lines of the season.
- **Weeks 4–8:** Data is building. Start using BetBoard's value finder for mid-season adjustments.
- **Playoffs:** Public money floods in. Fade the public on popular teams.

**NFL-specific BetBoard usage:**
- **Spreads** — NFL is a spread-dominated market. Compare spreads across all books.
- **Divisional games** — closer matchups, more upset potential.
- **Weather games** — BetBoard doesn't track weather (yet), but totals drop in rain/snow/wind.

---

## 8. The Pick of the Day Algorithm

Here's exactly how BetBoard's automated Pick of the Day works (in `newsletter.py`):

### Step-by-Step Process

1. **Pull all live odds** from The Odds API for every selected sport
2. **For each game**, collect h2h (moneyline) odds from every available bookmaker
3. **Calculate implied probability** for each bookmaker's odds
4. **Calculate market average** implied probability (average across all books)
5. **Find the best available price** (highest odds) for each team
6. **Calculate edge** = best price's implied probability vs. market average
7. **Rank all bets** by edge (highest = most value)
8. **Apply sport priority** when edges are tied: NCAAB > NBA > NHL > MLB
9. **The #1 ranked bet is the Pick of the Day**

### Why This Works

- The **market average** represents the "true" probability as estimated by all books combined
- When **one book offers a significantly better price**, it means that book hasn't adjusted properly
- Over time, betting on these edges is **mathematically profitable** (positive expected value)

### Limitations (Be Honest With Yourself)

- The algorithm finds **pricing inefficiencies**, not guaranteed wins
- A 5% edge means you'll win **slightly more than you lose** over hundreds of bets — not that every bet wins
- Some "edges" are real, some are noise — the more books that agree on a line, the more reliable the consensus
- **You will have losing streaks.** A 55% win rate means you lose 45% of the time.

---

## 9. How to Use BetBoard to Actually Make Money

### The Profitable Bettor's Framework

```
1. Find edges (BetBoard Value Bets + Arbitrage tabs)
2. Size correctly (Kelly Criterion tab)
3. Track everything (My Bets tab)
4. Review and adjust (P&L charts)
5. Be patient (it's a marathon, not a sprint)
```

### Bankroll Management Rules

| Rule | Why |
|------|-----|
| **Never bet more than 5% on one bet** | One bad beat won't ruin you |
| **Start with a fixed bankroll** | e.g., $500 — this is money you can afford to lose |
| **Use Half Kelly sizing** | Aggressive enough to grow, safe enough to survive variance |
| **Track every bet in My Bets** | Data-driven decisions beat gut feelings |
| **Take breaks after losing streaks** | Tilt is the #1 bankroll killer |

### What a Winning Month Looks Like

```
Starting bankroll: $1,000
Bets placed: 40
Win rate: 55% (22W - 18L)
Average bet: $50 (5% of bankroll)
Average odds: -110

Wins:  22 × $45.45 (profit at -110) = $1,000
Losses: 18 × $50.00 = $900

Net profit: +$100 (10% ROI for the month)
New bankroll: $1,100
```

**That's realistic.** A 55% win rate at -110 odds yields ~4.5% ROI per bet cycle. Over a season, that compounds. The pros who make millions win at 53–58% — not 70%.

### Red Flags (Stop Betting If…)

- Your ROI in My Bets is negative after 50+ bets → you might be chasing losses
- You're betting more than 10% of your bankroll per bet → you're over-leveraged
- You're betting on sports you don't watch → you lack context for your edges
- You're betting when upset, drunk, or tilted → take a break

---

## 10. Glossary

| Term | Definition |
|------|-----------|
| **ATS** | Against The Spread — betting on whether a team covers the point spread |
| **Arbitrage** | Betting both sides across different books for a guaranteed profit |
| **Bankroll** | The total money you've set aside for betting |
| **Closing line** | The final odds before a game starts — the most accurate prediction |
| **Cover** | When a team beats the spread (e.g., -3.5 favorite wins by 4+) |
| **Edge** | Your advantage over the sportsbook's odds (expressed as %) |
| **EV (Expected Value)** | The average profit/loss per bet over the long run |
| **Fade** | To bet against something (e.g., "fade the public" = bet the opposite of popular opinion) |
| **Handle** | Total amount of money wagered on a game |
| **Hook** | A half-point in a spread (e.g., -3.5 — the .5 is the hook) |
| **Implied probability** | The win chance that the odds represent |
| **Juice / Vig** | The sportsbook's commission (usually -110 on both sides = ~4.5% vig) |
| **Kelly Criterion** | Mathematical formula for optimal bet sizing |
| **Line** | The odds or spread for a game |
| **Line movement** | When odds change (indicates where money/information is flowing) |
| **Moneyline** | A bet on which team wins outright (no spread) |
| **Over/Under (Total)** | A bet on whether the combined score goes over or under a number |
| **Parlay** | Multiple bets combined — all must win for a payout (higher risk, higher reward) |
| **Props** | Proposition bets — bets on individual player performances |
| **Push** | A tie against the spread — your bet is refunded |
| **ROI** | Return On Investment — (profit / total wagered) × 100 |
| **Sharp** | A professional, well-informed bettor |
| **Square** | A casual, public bettor |
| **Spread** | The point handicap applied to a game (e.g., Duke -3.5) |
| **Steam move** | Sudden, dramatic line movement caused by sharp action |
| **Value bet** | A bet where the odds are better than the true probability suggests |

---

## 11. FAQ

### General

**Q: Is BetBoard free?**
A: Yes, completely free. It runs on The Odds API's free tier (500 calls/month) and free hosting.

**Q: Do I need to download anything?**
A: No. BetBoard runs in your web browser. If deployed, just visit the URL.

**Q: Which sportsbooks does BetBoard compare?**
A: FanDuel, DraftKings, BetMGM, Caesars, PointsBet, BetRivers, Bovada, and more — depends on what The Odds API has for each game.

**Q: Is my data private?**
A: Yes. Your bets, subscriber list, and feedback are stored locally (or on your own server). Nothing is sent to third parties except API calls to get odds.

### Betting

**Q: Will BetBoard make me money?**
A: BetBoard gives you **tools** — value finders, EV calculators, arbitrage detectors. Whether you make money depends on discipline, bankroll management, and using the data consistently. No tool guarantees winning bets.

**Q: What's a realistic win rate?**
A: Professional bettors win 53–58% of their bets long-term. BetBoard helps you get closer to that range by finding pricing inefficiencies, but sports are inherently unpredictable.

**Q: How many bets should I place per day?**
A: Quality over quantity. Wait for strong edges (5%+ on the Value Bets tab). Most days that's 1–3 bets. Some days it's zero — and that's okay.

**Q: Should I bet parlays?**
A: Parlays are high-risk. The house edge multiplies with each leg. Use parlays sparingly and only with 2–3 legs max on bets you'd make straight anyway. BetBoard tracks parlay P&L separately so you can see if they're hurting your ROI.

### Technical

**Q: How often do the odds update?**
A: BetBoard caches data for 10 minutes to conserve API calls. Click "Refresh" or reload the page for the latest. Odds change constantly — check 30–60 minutes before game time for the most accurate lines.

**Q: What happens if I run out of API calls?**
A: The site uses a server-configured Odds API key. If the free tier (500 calls/month) is exhausted, new odds won't load until the next cycle. The operator manages this; as a visitor you just use the site.

**Q: Can I use BetBoard on my phone?**
A: Yes. The UI is responsive and works on mobile browsers. Expand the sidebar with the `>` arrow.

**Q: Can I run BetBoard on Mac/Linux?**
A: Yes. Python and Streamlit work on all platforms. Just run:
```
pip install streamlit requests pandas plotly
python -m streamlit run sports_analysis_dashboard.py
```

---

## Quick Start Cheat Sheet

```
1. Open BetBoard → Odds load automatically (no key needed)
2. Select NBA + NCAAB
3. Check 📅 Today tab → Pin interesting games
4. Check 🔬 Analysis → Value Bets → Look for Edge > 5%
5. Use 📐 Kelly → Calculate optimal bet size
6. Place bet at the sportsbook with the best price
7. Log it in 📝 My Bets → Track your P&L
8. Repeat daily. Review P&L weekly. Adjust strategy monthly.
```

**Remember:** The goal isn't to win every bet. The goal is to consistently find +EV spots and let the math work over time. BetBoard is the tool. Discipline is the strategy.

---

*⚠️ Gambling involves risk. Must be 21+ and in a legal jurisdiction. If you or someone you know has a gambling problem, call 1-800-522-4700. Never bet money you can't afford to lose.*

---

*See also: [DEPLOYMENT_GUIDE.md](DEPLOYMENT_GUIDE.md) for hosting setup.*
