# Radar score & outlook hierarchy

Not financial advice. Same playbook on every ticker.

## What matters (friend feedback)

| Priority | Layer | Where |
|---------:|-------|--------|
| **1** | **Valuation + news** | Expand any ticker — PE / forward PE / PEG, optional group lean (`cheap` / `fair` / `rich`), headlines |
| **2** | **Macro rates** | Strip at top — 10Y, front-end bills, 5Y, TLT, dollar. Yields frame multiples |
| **3** | **Technical momentum** | Pulse lean buy / sell / watch — may or may not hold |

Raw PE alone is **not** a buy/sell. Without peer context it’s chat fuel next to the thesis. Human `valuation.bias` / `valuation.note` / `catalyst` on the watchlist beat lonely multiples.

Data: `public/outlook.json` from `node scripts/fetch-outlook.mjs` (also runs soft-fail at the end of `update-quotes`).

---

## Technical lean labels (secondary)

| Score | Label |
|------:|--------|
| **≥ +3** | Lean buy |
| **−2 … +2** | Watch |
| **≤ −3** | Lean sell |

## Weights (not everything equal)

| Factor | Buy | Sell | Why heavier / lighter |
|--------|----:|-----:|------------------------|
| RSI ≤30 / ≥70 | **+3** | **−3** | Strongest short-term stretch signal |
| Near 52-week low / high | **+2** | **−2** | Where price sits in the year matters |
| Deep below / extended above SMA50 (>10%) | **+2** | **−2** | Cheap vs stretched vs ~2.5 months |
| Near ATH (within ~3%) | | **−2** | Extra stretch risk |
| Quiet coil / **pre-momentum** | **+2** | | See below — names that haven’t run yet |
| RSI soft (≤40) / elevated (≥65) | +1 | −1 | Mild version of RSI |
| Bullish / bearish trend | +1 | −1 | Context only — can fight mean-reversion |
| Quiet volume near highs | | −1 | Sleepy + expensive is less interesting |

## Pre-momentum (quiet names)

For stocks **without** a momentum run yet, we look for a **coil**:

- Volume under ~75% of the 20-day average (quiet tape)
- RSI in a mid zone (~35–55) — not washed out, not hot
- Price near or slightly under the 50-day average (not a huge dump)
- Not sitting at year highs / near ATH

That setup gets **+2** and a `pre-momentum` tag. On the pulse **Watch** list, those float to the top so the group can discuss “what’s asleep?” — not just what’s already moving.

## Setup flavors (tags)

| Tag | Rough meaning |
|-----|----------------|
| `pre-momentum` | Quiet coil — no run yet |
| `washed-out` | Soft RSI / deep below averages / near lows |
| `extended` | Hot RSI / stretched / near highs |
| `trending` | Clear bullish or bearish MA stack |
| `mixed` | None of the above |

## Optional watchlist fields

```json
{
  "valuation": { "bias": "cheap", "note": "Still discounted vs peer optical names if AOCs land." },
  "catalyst": "Next earnings + datacenter transceiver commentary"
}
```

`bias`: `cheap` | `fair` | `rich` | `unknown`
