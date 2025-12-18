# 🎯 GTO Quick Reference Card

## 9-Max Opening Ranges (At a Glance)

### Position Order (Best → Worst for Pre-Flop)
1. **BTN** (Button) - 👑 BEST
2. **CO** (Cutoff) - ⭐⭐⭐⭐⭐
3. **HJ** (Hijack) - ⭐⭐⭐⭐
4. **MP+1** (Middle +1) - ⭐⭐⭐
5. **MP** (Middle) - ⭐⭐⭐
6. **UTG+1** (Under Gun +1) - ⭐⭐
7. **UTG** (Under the Gun) - ⭐
8. **SB** (Small Blind) - 🔄 Complex
9. **BB** (Big Blind) - 🛡️ Defensive

---

## Opening Ranges by VPIP %

| Position | VPIP | Hands | Players After | Difficulty |
|----------|------|-------|---------------|------------|
| **BTN** | 45% | ~600 combos | 2 | Easy |
| **CO** | 26% | ~345 combos | 3 | Easy |
| **HJ** | 22% | ~290 combos | 4 | Medium |
| **MP+1** | 18% | ~240 combos | 5 | Medium |
| **MP** | 15% | ~200 combos | 6 | Medium |
| **UTG+1** | 12% | ~160 combos | 7 | Hard |
| **UTG** | 10% | ~130 combos | 8 | Hard |
| **SB** | 36% | vs BB only | 1 | Hard |
| **BB** | 50%+ | Defending | 0 | Medium |

---

## Hand Categories

### Premium Pairs
`AA, KK, QQ` - **Raise from ANY position, 4-bet often**

### Strong Pairs
`JJ, TT, 99` - **Raise UTG+, call 3-bets in position**

### Medium Pairs
`88, 77, 66` - **Raise MP+, set mine vs 3-bets**

### Small Pairs
`55, 44, 33, 22` - **Raise HJ+, pure set mining**

### Premium Broadway
`AKs, AKo` - **Raise any position, 4-bet often**
`AQs, AQo` - **Raise any position, call 3-bets**

### Suited Aces
`AJs, ATs, A9s...A2s` - **Raise MP+ for suited, fold offsuit**

### Suited Connectors
`JTs, T9s, 98s, 87s, 76s, 65s, 54s` - **Raise HJ+, fold to 3-bets**

### Broadway Combos
`KQs, KJs, QJs` - **Raise MP+, good flop playability**
`KQo, KJo, QJo` - **Raise CO+, fold to 3-bets**

---

## Position-Specific Cheat Sheet

### 🔴 UTG (10% - TIGHTEST)
**RAISE:**
- Pairs: `77+`
- Aces: `AKs, AKo, AQs, AQo, AJs, ATs, A5s`
- Kings: `KQs, KJs`
- Queens: `QJs`
- Connectors: `JTs`

**FOLD:**
- `AJo, ATo, A9s-A2s` (except A5s)
- `KQo, KJo, KTs+`
- All pairs below `77`
- All connectors except `JTs`

---

### 🟠 UTG+1 (12%)
**ADD TO UTG RANGE:**
- Pairs: `+66`
- Aces: `+A9s, A4s`
- Kings: `+KTs`
- Queens: `+QTs`
- Connectors: `+T9s`

---

### 🟡 MP (15%)
**ADD TO UTG+1 RANGE:**
- Pairs: `+55`
- Aces: `+A8s, A7s, A3s, A2s, AJo`
- Kings: `+KQo`
- Connectors: `+98s, 87s`

---

### 🟢 MP+1 (18%)
**ADD TO MP RANGE:**
- Pairs: `+44`
- Aces: `+A6s, ATo`
- Kings: `+KJo, K9s`
- Queens: `+Q9s`
- Jacks: `+J9s`
- Connectors: `+T8s, 76s, 65s`

---

### 🔵 HJ (22%)
**ADD TO MP+1 RANGE:**
- Pairs: `+33, 22` (ALL PAIRS)
- Aces: `+A9o, K8s`
- Kings: `+KTo, K8s`
- Queens: `+QJo, Q8s`
- Jacks: `+J8s`
- Connectors: `+97s, 54s`

---

### 🟣 CO (26%)
**ADD TO HJ RANGE:**
- Aces: `+A8o`
- Kings: `+K9o, K7s`
- Queens: `+QTo`
- Jacks: `+JTo, J9o`
- Tens: `+T9o`
- Connectors: `+86s, 75s`

---

### 🟢 BTN (45% - WIDEST!)
**RAISE ALMOST EVERYTHING:**
- Pairs: `22+` (ALL PAIRS)
- Aces: `A2o+, A2s+` (ANY ACE)
- Kings: `K7o+, K4s+`
- Queens: `Q8o+, Q6s+`
- Jacks: `J8o+, J7s+`
- Tens: `T8o+, T7s+`
- Connectors: `98o+, 54s+`

**FOLD ONLY:**
- `K6o-, Q7o-, J7o-, T7o-` (pure garbage)

---

### 🔵 SB (36% vs BB, 20% vs opens)
**VS BB ONLY (Unopened):**
- Raise ~36% (similar to CO range)
- Use position + fold equity

**VS OPENS:**
- Tighten to ~20% (MP-style range)
- OOP = huge disadvantage

---

### 🛡️ BB (Defending 40-60%)
**VS UTG RAISE:**
- Defend ~30% (they're super strong)
- `99+, AQs+, AKo, KQs`

**VS CO/BTN RAISE:**
- Defend ~55% (they're stealing)
- `Any pair, A2s+, A8o+, K9s+, KTo+, Q9s+, QTo+, suited connectors`

---

## Quick Decision Tree

### Pre-Flop (Unopened Pot)
```
1. What position am I in?
   ├─ Early (UTG-MP): Play tight (10-15%)
   ├─ Middle (MP+1-HJ): Play balanced (18-22%)
   └─ Late (CO-BTN): Play aggressive (26-45%)

2. Is my hand in range for this position?
   ├─ YES: RAISE (2.5-3BB)
   └─ NO: FOLD

3. If 3-bet behind me:
   ├─ Premium (AA-JJ, AK): 4-bet or call
   ├─ Strong (TT-77, AQ, KQ): Call if in position
   └─ Speculative (small pairs, suited): Fold or call for set
```

### Facing a Raise
```
1. Where did the raise come from?
   ├─ Early position: Tight range → Tighten defense
   └─ Late position: Wide range → Defend wide

2. Am I in position?
   ├─ YES: Can call wider
   └─ NO: 3-bet or fold (avoid calling OOP)

3. What's my hand strength?
   ├─ Premium: 3-bet for value
   ├─ Strong: Call and see flop
   └─ Marginal: FOLD (unless great pot odds)
```

---

## Common Hands - Position Guide

| Hand | UTG | MP | HJ | CO | BTN | SB | BB |
|------|-----|----|----|-----|-----|----|----|
| `AA-QQ` | ✅ | ✅ | ✅ | ✅ | ✅ | ✅ | ✅ |
| `JJ-99` | ✅ | ✅ | ✅ | ✅ | ✅ | ✅ | ✅ |
| `88-66` | ❌ | ✅ | ✅ | ✅ | ✅ | ✅ | ✅ |
| `55-22` | ❌ | ❌ | ✅ | ✅ | ✅ | ✅ | ✅ |
| `AKs/o` | ✅ | ✅ | ✅ | ✅ | ✅ | ✅ | ✅ |
| `AQs/o` | ✅ | ✅ | ✅ | ✅ | ✅ | ✅ | ✅ |
| `AJs` | ✅ | ✅ | ✅ | ✅ | ✅ | ✅ | ✅ |
| `AJo` | ❌ | ✅ | ✅ | ✅ | ✅ | ✅ | ✅ |
| `ATs/o` | ✅/❌ | ✅/❌ | ✅/✅ | ✅ | ✅ | ✅ | ✅ |
| `A9s-A2s` | ❌ | ❌/✅ | ✅ | ✅ | ✅ | ✅ | ✅ |
| `KQs` | ✅ | ✅ | ✅ | ✅ | ✅ | ✅ | ✅ |
| `KQo` | ❌ | ✅ | ✅ | ✅ | ✅ | ✅ | ✅ |
| `KJs/o` | ✅/❌ | ✅/❌ | ✅/✅ | ✅ | ✅ | ✅ | ✅ |
| `KTs` | ❌ | ✅ | ✅ | ✅ | ✅ | ✅ | ✅ |
| `QJs` | ✅ | ✅ | ✅ | ✅ | ✅ | ✅ | ✅ |
| `QTs` | ❌ | ✅ | ✅ | ✅ | ✅ | ✅ | ✅ |
| `JTs` | ✅ | ✅ | ✅ | ✅ | ✅ | ✅ | ✅ |
| `T9s` | ❌ | ✅ | ✅ | ✅ | ✅ | ✅ | ✅ |
| `98s` | ❌ | ✅ | ✅ | ✅ | ✅ | ✅ | ✅ |
| `87s` | ❌ | ✅ | ✅ | ✅ | ✅ | ✅ | ✅ |
| `76s` | ❌ | ❌ | ✅ | ✅ | ✅ | ✅ | ✅ |

---

## Pro Tips by Position

### 🎯 Early Position (UTG, UTG+1, MP)
- **Tight is right** - Only play strong hands
- **Raise or fold** - Never limp
- **Fold to 3-bets** - Unless premium hand
- **Accept position disadvantage**

### 🎯 Middle Position (MP+1, HJ)
- **Transition zone** - Mix tight and aggressive
- **Add speculative hands** - Suited connectors
- **Start stealing** - From HJ onwards
- **Watch for late position 3-bets**

### 🎯 Late Position (CO, BTN)
- **Steal aggressively** - Raise 25-45%
- **Position over cards** - You'll act last
- **C-bet almost always** - Range advantage
- **Adjust to blinds** - Tighter blinds = wider opens

### 🎯 Small Blind
- **VS BB: Aggressive** - Raise 36%, fold rest
- **VS Opens: Tight** - Only strong hands
- **Avoid calling** - 3-bet or fold (OOP)
- **Accept losses** - SB loses money long-term

### 🎯 Big Blind
- **Defend wide** - Already invested 1BB
- **VS UTG: Tight** - ~30% defense
- **VS BTN: Wide** - ~55% defense
- **Use pot odds** - Calculate break-even

---

## Profitability by Position

```
📈 MOST PROFITABLE
  BTN  (+15 to +25 BB/100)
   CO  (+10 to +18 BB/100)
   HJ  (+5 to +12 BB/100)
  MP+1 (0 to +5 BB/100)
   MP  (-2 to +2 BB/100)
  UTG1 (-5 to 0 BB/100)
  UTG  (-8 to -2 BB/100)
   SB  (-15 to -5 BB/100)
   BB  (-20 to -10 BB/100)
📉 LEAST PROFITABLE
```

**Key Insight**: BTN is 30+ BB/100 more profitable than UTG!

---

## Remember

✅ **Position > Cards** (within reason)  
✅ **Later = Wider** (ranges expand)  
✅ **Information = Money** (act last = profit)  
✅ **GTO is baseline** (start here, exploit later)  
✅ **Practice makes perfect** (use this app daily!)

---

**Print this card or save to your phone for quick reference during play! 🎰**
