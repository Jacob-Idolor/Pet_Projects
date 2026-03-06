# What to Work On Next (Business Plan + Master Guide)

**Use this after the app and guides are aligned.** Order is by priority: deploy first, then revenue, then growth and polish.

---

## Phase 1 — Get live (do first)

| # | Task | Where | Time |
|---|------|--------|-----|
| 1 | **Deploy to Streamlit Cloud** | [share.streamlit.io](https://share.streamlit.io) → New app → repo `betboard`, file `sports_analysis_dashboard.py`, Python 3.11. Add Secrets (ODDS_API_KEY, RESEND_API_KEY, etc.). | ~15 min |
| 2 | **Test the live app** | Open public URL → Today tab, Newsletter, Feedback. Sidebar shows "Odds data: Connected". View Source: no API keys. | 5 min |
| 3 | **GitHub Actions for daily email** | Repo → Settings → Secrets and variables → Actions → add `ODDS_API_KEY`, `RESEND_API_KEY`. Actions tab → run "Send Daily Pick Email" once to test. | 10 min |

> **Note:** Free Streamlit Cloud needs a **public** GitHub repo. Keep business/monetization docs in `private/` (gitignored).

---

## Phase 2 — Revenue (business plan Q1 critical)

| # | Task | Where | Time |
|---|------|--------|-----|
| 4 | **Apply to 3 affiliate programs** | FanDuel Partners, DraftKings Affiliates, BetMGM Affiliates (see your private deploy-actions doc). Approval often 24–48 hours. | ~1 hour |
| 5 | **Replace affiliate links in the app** | In `sports_analysis_dashboard.py`, search for `MonetizationManager` and the `sportsbooks` lists. Replace placeholder URLs with your real affiliate links once approved. | ~30 min |
| 6 | **Add tip jar (optional)** | Add "Buy Me a Coffee" or Ko-fi link in sidebar/footer (ROADMAP #8). Quick revenue + community signal. | ~10 min |

---

## Phase 3 — Trust and growth (master guide / roadmap)

| # | Task | Impact | Time |
|---|------|--------|-----|
| 7 | **Track pick W–L publicly** | Post daily pick + result on Twitter or a simple public page. Builds trust (business plan Q1). | 5 min/day |
| 8 | **Post daily picks on Twitter/X** | "BetBoard Pick of the Day: [pick]. Free tool → [link]." Drives traffic and subs. | 10 min/day |
| 9 | **Persist bets to JSON** | So My Bets survives refresh (ROADMAP #13). Data safety. | ~2 hours |
| 10 | **Loading skeleton while odds load** | Better UX while API responds (ROADMAP #12). | ~1 hour |

---

## Phase 4 — When you have time

- Custom domain + Cloudflare (branding + security)
- Product Hunt launch
- Welcome email sequence (3 emails for new subs)
- Public pick track record page (W–L, ROI)

---

## Quick reference

- **Deploy steps:** [DEPLOYMENT_GUIDE.md](DEPLOYMENT_GUIDE.md), [DEPLOY_CHECKLIST.md](DEPLOY_CHECKLIST.md)
- **Running locally:** [MASTER_GUIDE.md](MASTER_GUIDE.md) §3
- **Revenue and strategy:** your `private/` docs (not in repo)

*Update this list as you complete items or reprioritize.*
