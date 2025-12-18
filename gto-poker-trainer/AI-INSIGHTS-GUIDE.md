# 🤖 AI Insights System - User Guide

## Overview

The **AI-Powered Insights Engine** analyzes your poker decisions and provides personalized feedback on your playing tendencies, strengths, and weaknesses across all 9 positions.

---

## 🎯 What It Tracks

### Per-Position Statistics
- **Hands Played**: Total hands from each position
- **Accuracy**: Correct decisions vs total decisions
- **Mistake Patterns**: Detailed analysis of errors
  - Too tight (folding profitable hands)
  - Too loose (playing unprofitable hands)
  - Wrong action type (call vs raise, etc.)

### Detailed Mistake Data
For every incorrect decision, the AI tracks:
- `hand`: The cards you were dealt
- `playerAction`: What you chose (fold, call, raise, allin)
- `correctAction`: What GTO says to do
- `isMarginal`: Whether it was a "close" decision
- `timestamp`: When the mistake occurred

---

## 📊 Insights Categories

### 1. Overall Performance
**What it shows:**
- Your skill level (Learning → Expert)
- Overall accuracy percentage
- Total hands played
- Motivational message

**Skill Levels:**
- 🏆 **Expert** (85%+ accuracy) - Exceptional GTO understanding
- ⭐ **Advanced** (75-84%) - Strong fundamentals
- 📈 **Intermediate** (65-74%) - Good progress
- 📚 **Beginner** (50-64%) - Building fundamentals
- 🎓 **Learning** (<50%) - Keep practicing

---

### 2. Detected Tendencies

The AI identifies your playing style patterns:

**Too Tight Overall:**
- Folding too many profitable hands
- Not opening wide enough from late position
- Missing steal opportunities

**Too Loose Overall:**
- Playing too many hands from early position
- Not respecting position
- Opening outside GTO ranges

**Not Aggressive Enough (Late Position):**
- Playing well from early position
- Not exploiting BTN/CO advantage
- Missing blind steal opportunities

**Early Position Struggles:**
- Doing well from late position
- Making mistakes from UTG/MP
- Need to tighten up early ranges

---

### 3. Position-Specific Insights

**For Each of 9 Positions:**

**If Accuracy ≥ 85%:**
- 🎯 Mastering this position
- "Excellent performance"
- Tips to maintain excellence

**If Accuracy 70-84%:**
- 👍 Solid play
- "Good understanding"
- Minor adjustments suggested

**If Accuracy < 70%:**
- ⚠️ Needs work
- Focus area identified
- Specific fixes provided

**Insufficient Data:**
- < 10 hands played
- "Play more hands to unlock insights"

---

### 4. Strengths

**What it identifies:**
- Positions with 80%+ accuracy (and 10+ hands)
- Sorted by difficulty (hardest positions = most impressive)
- Shows percentage and emoji

**Example:**
```
🏆 Strong UTG play (87.5% accuracy)
⭐ Solid CO play (82.0% accuracy)
```

---

### 5. Weaknesses (Priority Areas)

**What it shows:**
- Positions with <65% accuracy (and 10+ hands)
- Primary issue identified
  - "folding too many profitable hands"
  - "playing too many unprofitable hands"
  - "inconsistent decision-making"
- Specific solution provided
- Quick "Practice Now" button

**Prioritization:**
- Lower accuracy = higher priority
- More hands played = more urgent to fix

---

### 6. Recommendations

**Top 3 personalized recommendations:**

**Priority Levels:**
- 🔴 **High**: Critical weakness to fix
- 🟠 **Medium**: Playing tendency to adjust
- 🟢 **Low**: General practice advice

**Each recommendation includes:**
- Title (e.g., "Focus on MP+1")
- Description (why it matters)
- Action (what to do)
- Expected improvement (impact on your game)

---

## 🧠 How the AI Analyzes

### Mistake Pattern Analysis

**Too Tight Detection:**
```
If (mistakes where correct=RAISE but player=FOLD) > 60%
  → "You're folding too many profitable hands"
  → Tip: "Open wider from this position"
```

**Too Loose Detection:**
```
If (mistakes where correct=FOLD but player=RAISE) > 60%
  → "You're playing too many unprofitable hands"
  → Tip: "Tighten up - respect position"
```

**Inconsistent Play:**
```
If mistakes are mixed (both too tight and too loose)
  → "Inconsistent decision-making"
  → Tip: "Review and memorize the opening range"
```

### Marginal Hand Forgiveness

The AI knows which hands are "close decisions" (marginal hands):
- **UTG**: `77, 66, AJo, A9s, KTs` (borderline opens)
- **BTN**: `K6o, Q7o, J7o` (edge of range)

Mistakes with marginal hands are noted but weighted less heavily in tendency detection.

---

## 📱 How to Use

### Step 1: Play Hands
- Practice with Random or Specific position modes
- AI tracks every decision you make
- Mistakes are analyzed and stored

### Step 2: View Insights
1. Go to **Profile Screen**
2. Click **🤖 View AI Insights**
3. Wait for analysis (instant!)

### Step 3: Review Feedback
- Read your overall performance
- Check detected tendencies
- Review position-specific insights
- Identify strengths and weaknesses

### Step 4: Take Action
- Click "Practice Now" on weak positions
- Focus on top recommendation
- Adjust playing style based on tendencies
- Re-check insights after 20+ more hands

---

## 🎯 Minimum Data Requirements

**For Overall Insights:**
- Minimum: **20 hands** total
- Recommended: **50+ hands** for reliable patterns
- Optimal: **100+ hands** for deep analysis

**For Position-Specific Insights:**
- Minimum: **10 hands** per position
- Recommended: **20+ hands** per position
- Optimal: **50+ hands** per position

**Before minimum data:**
- Shows "Need More Data" message
- Encourages continued practice
- Explains why more hands are needed

---

## 🔍 Example Insights

### Example 1: Tight Player
```
🛑 Playing Too Tight Overall

Description:
You're folding too many profitable hands. GTO requires 
playing wider ranges, especially from late position.

Fix:
Trust the ranges. If a hand is in the opening range, play it!

Position Breakdown:
- BTN: 72% accuracy (folding KJo, A7s, etc.)
- CO: 68% accuracy (folding suited connectors)
- UTG: 89% accuracy ✓ (good!)

Recommendation:
Focus on BTN and CO - practice opening wider ranges.
Expected impact: +10-15% overall accuracy
```

### Example 2: Position-Aware Player
```
⭐ Advanced Player - Strong GTO Understanding

Overall: 78% accuracy (156 hands)

Strengths:
🏆 UTG play (91% accuracy) - Excellent discipline
👍 MP play (85% accuracy) - Good balance

Areas to Improve:
🎯 SB play (62% accuracy) - Complex position
   Issue: inconsistent decision-making
   Fix: Review SB strategy (wide vs BB, tight vs opens)

Recommendation:
Focus drilling SB position to reach 80%+ on all positions.
```

### Example 3: Loose-Aggressive Player
```
🎰 Playing Too Many Hands

Description:
You're opening too wide, especially from early position. 
Remember: position determines range.

Fix:
Tighten up from early position. Not all hands are 
playable from UTG/MP.

Position Breakdown:
- UTG: 45% accuracy (opening ATo, KJo, 76s)
- MP: 58% accuracy (still too loose)
- BTN: 88% accuracy ✓ (correct aggression)

Recommendation:
Drill UTG and MP positions. Review the tight ranges.
Expected impact: +15-20% accuracy improvement
```

---

## 💡 Tips for Better Insights

### 1. Play Consistently
- Complete full runs (don't quit early)
- Practice regularly (daily ideal)
- Use both Random and Specific modes

### 2. Focus on Weak Positions
- Check insights after every 20 hands
- Use "Practice Now" buttons
- Drill weak positions until 75%+

### 3. Track Progress
- Re-check insights weekly
- Compare accuracy trends
- Celebrate improvements

### 4. Use Position Info
- Click ℹ️ buttons before drilling
- Read GTO explanations
- Understand **why** decisions are correct

### 5. Balance Your Training
- Don't only practice easy positions (BTN, CO)
- Challenge yourself with hard positions (UTG, SB)
- Aim for 75%+ accuracy on ALL positions

---

## 🚀 Advanced Usage

### Identifying Leaks

**Check these patterns:**

1. **Early Position Leak:**
   - Low accuracy from UTG/MP
   - Playing too many marginal hands
   - Not folding enough

2. **Late Position Leak:**
   - High accuracy from UTG
   - Low accuracy from BTN/CO
   - Not opening wide enough
   - Missing steal opportunities

3. **Blind Play Leak:**
   - Low accuracy from SB/BB
   - Not understanding defense frequencies
   - Calling/folding wrong hands

4. **Consistency Leak:**
   - High variance in position accuracy
   - Sometimes too tight, sometimes too loose
   - Need to memorize ranges better

### Benchmarking

**Target Accuracy by Position:**

| Position | Beginner | Intermediate | Advanced | Expert |
|----------|----------|--------------|----------|--------|
| UTG | 50% | 65% | 75% | 85%+ |
| MP | 55% | 70% | 80% | 90%+ |
| CO | 60% | 75% | 85% | 92%+ |
| BTN | 65% | 80% | 88% | 95%+ |
| SB | 45% | 60% | 70% | 80%+ |
| BB | 50% | 65% | 75% | 85%+ |

**Overall Target:**
- Beginner: 55%+
- Intermediate: 70%+
- Advanced: 80%+
- Expert: 88%+

---

## 📊 Data Storage

**What's Saved:**
- Last 50 mistakes per position (rolling window)
- Prevents storage bloat
- Keeps recent, relevant data
- Old mistakes are discarded

**Where It's Saved:**
- Browser localStorage
- User-specific (per account/guest)
- Persists across sessions
- Can be cleared in Profile settings

**Privacy:**
- All data stored locally
- No server uploads
- Guest mode = no account needed
- Can clear data anytime

---

## 🔮 Future AI Enhancements

### Coming Soon:
- 📈 Accuracy trend charts (improving vs declining)
- 🎯 Position difficulty scoring
- 🏆 Achievement system
- 📊 Peer comparison (anonymized)
- 🤖 Real-time suggestions during play
- 📚 Personalized training plans

### Planned Features:
- Post-flop play analysis
- 3-bet/4-bet tendency tracking
- Bet sizing analysis
- Range balancing insights
- Exploitative adjustments suggestions

---

## ❓ FAQ

**Q: Why do I need 20 hands minimum?**
A: Statistical reliability. With fewer hands, patterns could be random luck, not actual tendencies.

**Q: Can I reset my data?**
A: Yes! Click "Clear Stats" in Profile settings. Fresh start anytime.

**Q: Why am I "Too Tight" from BTN but "Good" from UTG?**
A: Perfect! UTG should be tight, BTN should be wide. You're learning proper position adjustment.

**Q: What's a "marginal hand"?**
A: Hands at the edge of the opening range. Close decisions that are more forgivable to get wrong (e.g., `77` from UTG, `K7o` from BTN).

**Q: How often should I check insights?**
A: Every 20-30 hands, or weekly. Too often = not enough new data. Too rare = miss learning opportunities.

**Q: Do insights work in Guest mode?**
A: Yes! All AI features work for guests. Data is saved locally in your browser.

**Q: What if I disagree with the AI?**
A: The AI uses GTO solvers as ground truth. If you disagree, click ℹ️ on the position to read the strategy explanation. GTO isn't always intuitive!

---

## 🎓 Learn From Your Mistakes

**Golden Rule:**
> "The best players don't make fewer mistakes - they learn faster from the mistakes they do make."

**Use AI Insights to:**
1. ✅ Identify patterns you weren't aware of
2. ✅ Get objective feedback (no ego)
3. ✅ Focus practice on actual weaknesses
4. ✅ Track measurable improvement
5. ✅ Build GTO muscle memory

---

## 🎯 Summary

The AI Insights system is your personal poker coach:
- 📊 Tracks every decision
- 🧠 Analyzes patterns
- 💡 Provides actionable feedback
- 🎯 Identifies specific fixes
- 📈 Helps you improve faster

**Use it every session to level up your GTO game!** 🚀
