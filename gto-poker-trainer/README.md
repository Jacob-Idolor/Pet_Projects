# 🃏 GTO Poker Trainer

[![Deploy Status](https://github.com/YOUR_USERNAME/gto-poker-trainer/workflows/Deploy%20GTO%20Poker%20Trainer/badge.svg)](https://github.com/YOUR_USERNAME/gto-poker-trainer/actions)

A **mobile-first** gamified web application for practicing Game Theory Optimal (GTO) poker strategy. Test your knowledge of position-based ranges and build your streak!

## 🚀 Quick Deploy & Test

```bash
# Local development
npm install
npm run dev

# Run tests
npm test

# Deploy (automatic on push to main)
git push origin main
```

**See [README-DEPLOY.md](README-DEPLOY.md) for full CI/CD setup guide!**

## 📱 Mobile-Optimized Features

- ✅ **Vertical Phone Layout**: Designed for one-handed use
- ✅ **Progressive Web App (PWA)**: Install on iOS & Android
- ✅ **Touch-Optimized**: Large 60px buttons for easy tapping
- ✅ **Works Offline**: Play anywhere after first load
- ✅ **Figma-Ready**: Design tokens for easy customization
- ✅ **React Native Ready**: Component-based architecture

## 🎮 Features

### Current Features (v2.0) - NEW! 🆕
- ✅ **9-Max Table Support**: Complete 9-player table (UTG, UTG+1, MP, MP+1, HJ, CO, BTN, SB, BB)
- ✅ **Detailed Position Info**: Click ℹ️ on any position to see GTO strategy, VPIP %, and key points
- ✅ **Position Selection Modes**: 
  - **Random Mode**: Practice all positions (recommended for beginners)
  - **Specific Mode**: Focus on one position (advanced training)
- ✅ **User Authentication**: Google, Apple, or Guest sign-in
- ✅ **Login Streak Tracking**: Track consecutive daily logins
- ✅ **User Profiles**: View stats, accuracy, and favorite position
- ✅ **Ad-Based Bonus Runs**: Watch ads for +10 runs (5-hour cooldown)
- ✅ **Position-Specific Stats**: Track performance per position
- ✅ **Comprehensive GTO Guides**: 200+ pages of strategy documentation
- ✅ **Interactive Learning**: Modal popups with detailed explanations
- ✅ **Color-Coded Difficulty**: Visual indicators for position complexity
- ✅ **VPIP Percentages**: See optimal play frequency per position
- ✅ **Educational Feedback**: Learn from mistakes with detailed explanations
- ✅ **Beautiful UI**: Professional poker table design with smooth animations
- ✅ **Responsive Design**: Works on desktop and mobile devices
- ✅ **Local Storage**: Tracks your progress and best streaks

### Game Mechanics
- **One Wrong Answer = Game Over**: Forces precision and careful thinking
- **Immediate Feedback**: Learn what went wrong and why
- **Streak Tracking**: Track current and all-time best streaks
- **Daily Reset**: Runs reset at midnight, encouraging daily practice

## 🚀 Getting Started

### Quick Start (Desktop)
1. Open `index.html` in any modern web browser
2. Click "Start New Run"
3. Make the correct GTO decision based on your position and hand
4. Build your streak!

### Install on Mobile (PWA)

**iPhone/iPad:**
1. Open Safari and navigate to your hosted URL
2. Tap the **Share** button
3. Select **"Add to Home Screen"**
4. App installs like a native app!

**Android:**
1. Open Chrome and navigate to your URL
2. Tap the **⋮** menu
3. Select **"Add to Home Screen"**
4. Or follow the automatic prompt

### Host Online (Free Options)
- **Netlify**: Drag folder to netlify.com/drop
- **GitHub Pages**: Push to repo, enable Pages
- **Vercel**: Run `vercel` in terminal

No installation or server required for local use - it's 100% client-side!

## 📖 How to Play

1. **Start a Run**: You begin with 10 runs per day
2. **Read the Scenario**: You're dealt a hand at a specific position
3. **Choose an Action**: Fold, Call, Raise, or All-In
4. **Build Your Streak**: Each correct answer increases your streak
5. **Learn from Mistakes**: One wrong answer ends the run, but you'll learn why

## 🎯 Game Theory Optimal (GTO) Strategy

This app teaches position-based preflop ranges for a **9-max table**:

### Complete 9-Max Positions (Early → Late)

**Early Position (Tightest Ranges):**
1. **UTG (Under the Gun)**: 10% VPIP - Ultra tight, 8 players behind
2. **UTG+1 (Under the Gun +1)**: 12% VPIP - Very tight, 7 players behind
3. **MP (Middle Position)**: 15% VPIP - Balanced, 6 players behind

**Middle Position (Transitional):**
4. **MP+1 (Middle Position +1)**: 18% VPIP - Opening up, 5 players behind
5. **HJ (Hijack)**: 22% VPIP - Late position begins, 4 players behind

**Late Position (Widest Ranges):**
6. **CO (Cutoff)**: 26% VPIP - Aggressive stealing, 3 players behind
7. **BTN (Button)**: 45% VPIP - MOST PROFITABLE, 2 players behind

**Blinds (Special Cases):**
8. **SB (Small Blind)**: 36% vs BB, 20% vs opens - Complex strategy
9. **BB (Big Blind)**: 50%+ defending - Pot odds justify wide calls

### Why Position Matters

**Position = Information = Money**
- Acting last means seeing all actions before you decide
- Late position = wider ranges = more profit
- BTN is 30+ BB/100 more profitable than UTG
- Same hand plays differently from different positions

**Example:** `K♠J♦`
- UTG: **FOLD** ❌ (8 players behind, out of position)
- MP: **FOLD** ❌ (6 players behind, still risky)
- CO: **RAISE** ✅ (3 players left, good steal)
- BTN: **RAISE** ✅ (best position, maximum profit)

📚 **[Read Full GTO Guide](GTO-POSITION-GUIDE.md)** for complete strategy breakdown!

## 🛠️ Technical Stack

- **Frontend**: Pure HTML5, CSS3, JavaScript (ES6+)
- **Storage**: LocalStorage for persistence
- **PWA**: Service Worker for offline support
- **Mobile-First**: Responsive design with CSS design tokens
- **No Dependencies**: No frameworks or libraries required!

## 📱 Mobile Development

This app is **production-ready** for mobile:

### Current Status:
- ✅ **PWA Installable**: Works like a native app
- ✅ **Offline Mode**: Full functionality without internet
- ✅ **Mobile Layout**: Vertical button stack for thumbs
- ✅ **Design System**: CSS variables for Figma integration
- ✅ **Touch Optimized**: 60px buttons, haptic feedback ready

### Path to Native Apps:

**Option 1: Keep as PWA** (Recommended for MVP)
- No app store needed
- Instant updates
- Works everywhere

**Option 2: Capacitor Wrapper** (Easiest native)
- Wrap existing code
- Publish to app stores
- Add native features

**Option 3: React Native** (Best performance)
- Full native rebuild
- 2-4 weeks development
- Maximum performance

**See `MOBILE-GUIDE.md` for complete instructions!**

## 📁 Project Structure

```
gto-poker-trainer/
├── index.html              # Mobile-optimized HTML
├── styles.css              # Mobile-first CSS with design tokens
├── gto-data.js             # GTO ranges and poker data
├── game.js                 # Game logic and state management
├── manifest.json           # PWA manifest
├── service-worker.js       # Offline functionality
├── README.md               # This file
├── MOBILE-GUIDE.md         # Complete mobile dev guide
├── GETTING-STARTED.md      # Quick start & testing guide
└── ICON-GUIDE.md           # App icon creation
```

## 🔮 Future Enhancements

### Planned Features for Full Version

#### Gameplay
- [ ] **Post-flop scenarios**: Continuation betting, turn/river play
- [ ] **3-bet/4-bet spots**: Advanced preflop situations
- [ ] **Multi-street scenarios**: Full hand simulations
- [ ] **Stack depth variations**: Short stack, deep stack strategies
- [ ] **Tournament scenarios**: ICM considerations, bubble play
- [ ] **Cash game scenarios**: Different bet sizing options

#### Progression System
- [ ] **Difficulty Levels**: Beginner, Intermediate, Advanced, Expert
- [ ] **Unlockable Positions**: Master one position before moving to harder ones
- [ ] **Achievement System**: Badges for milestones (10-streak, 50-streak, etc.)
- [ ] **XP and Levels**: Level up your poker knowledge
- [ ] **Daily Challenges**: Special scenarios for bonus rewards

#### Addictive Qualities
- [ ] **Leaderboards**: Compete with other players (requires backend)
- [ ] **Daily Login Rewards**: Extra runs, special challenges
- [ ] **Combo System**: Bonus points for consecutive correct decisions
- [ ] **Power-ups**: "Skip" or "Hint" options (earned through gameplay)
- [ ] **Statistics Dashboard**: Detailed performance analytics
- [ ] **Study Mode**: Practice specific positions/scenarios without run limits

#### Monetization Options (Future)
- [ ] **Premium Subscription**: Unlimited runs, advanced scenarios
- [ ] **One-time Unlock**: Remove daily limit permanently
- [ ] **Cosmetic Upgrades**: Custom card designs, table themes
- [ ] **Ad-supported Free Tier**: Current 10 runs + ads

#### Social Features
- [ ] **Share Results**: Share your streak on social media
- [ ] **Challenge Friends**: Send specific scenarios to friends
- [ ] **Study Groups**: Create private groups for practice
- [ ] **Coaching Mode**: Teachers can track student progress

#### Educational Content
- [ ] **GTO Explanations**: In-depth articles on each position
- [ ] **Video Tutorials**: Pro player tips and strategy
- [ ] **Hand History Review**: Save and review past decisions
- [ ] **Solver Integration**: Compare decisions to actual solver outputs
- [ ] **Range Visualizer**: See your opening/calling ranges visually

## 🎨 Customization

### Design Tokens (Figma-Ready)
All design values are CSS variables in `styles.css`:

```css
:root {
    --color-accent-green: #00ff87;
    --space-md: 16px;
    --button-height: 60px;
    --font-size-lg: 20px;
}
```

### Adding New Ranges
Edit `gto-data.js` to add more hands or adjust ranges:

```javascript
GTO_DATA.openingRanges.BTN.raise.push('K7s', 'Q8s');
```

### Adjusting Daily Runs
In `game.js`, change the run limit:

```javascript
this.runsRemaining = 20; // Change from 10 to 20
```

### Styling Changes
All visual styles are in `styles.css`. The color scheme uses:
- Primary: `#00ff87` (Green)
- Secondary: `#60efff` (Blue)
- Background: `#1a1a2e` to `#16213e` gradient

## � Documentation

### Strategy Guides
- **[GTO-POSITION-GUIDE.md](GTO-POSITION-GUIDE.md)** - Complete 250+ line GTO strategy guide
  - Position-by-position breakdown
  - Hand range charts
  - Profitability analysis
  - Common mistakes
  - Pro tips for each position

- **[QUICK-REFERENCE.md](QUICK-REFERENCE.md)** - Cheat sheet for quick lookups
  - Opening ranges table
  - Hand categories
  - Decision trees
  - Common hands by position

- **[VISUAL-GUIDE.md](VISUAL-GUIDE.md)** - Mobile-friendly visual reference
  - Table layout diagrams
  - Range width visualizations
  - Heat maps
  - Strategy compasses

### Technical Documentation
- **[FIREBASE-GUIDE.md](FIREBASE-GUIDE.md)** - Backend integration guide
  - Firebase setup instructions
  - Authentication implementation
  - Firestore database structure
  - AdMob integration

- **[MOBILE-GUIDE.md](MOBILE-GUIDE.md)** - Mobile development guide
  - PWA installation
  - Capacitor/React Native conversion
  - Mobile optimization tips

- **[COMPONENT-MAP.md](COMPONENT-MAP.md)** - Code structure reference
  - File organization
  - Component breakdown
  - State management

- **[UPDATE-SUMMARY.md](UPDATE-SUMMARY.md)** - Latest changes log
  - New features
  - UI improvements
  - Documentation additions

## 📊 GTO Data Accuracy

**Current Implementation**: 
- ✅ **9-max table** with complete position coverage
- ✅ **Professional-grade opening ranges** based on solver outputs
- ✅ **VPIP percentages** matching real GTO play
- ✅ **Position-specific adjustments** for blinds and late position

**Note**: Ranges are based on 100BB cash game stacks. For serious study:
- Consider professional solver software (PioSolver, GTO+, SimplePostflop)
- Ranges may vary based on stack depth, table dynamics, and opponent tendencies
- This app teaches fundamentals - adjust for live game conditions

## 🤝 Contributing

Want to expand this project? Here are some ideas:
1. ✅ ~~Add 9-max position support~~ **DONE!**
2. ✅ ~~Add detailed GTO explanations~~ **DONE!**
3. ✅ ~~Implement user authentication~~ **DONE!**
4. ⬜ Implement post-flop scenarios (flop texture, turn play)
5. ⬜ Add 3-bet/4-bet ranges
6. ⬜ Create real backend for leaderboards
7. ⬜ Add bet sizing training
8. ⬜ Implement multi-way pot scenarios
9. ⬜ Add tournament (ICM) adjustments
10. ⬜ Create difficulty levels (recreational → pro)

## 📝 License

This project is open source and available for educational purposes.

## 🎓 Learn More About GTO

### Recommended Books:
- "Modern Poker Theory" by Michael Acevedo
- "Play Optimal Poker" by Andrew Brokos
- "Applications of No-Limit Hold'em" by Matthew Janda
- "Expert Heads Up No Limit Hold'em" by Will Tipton

### Solver Software:
- **PioSolver** - Industry standard
- **GTO+** - More affordable alternative
- **SimplePostflop** - Beginner-friendly

### Training Sites:
- **Run It Once** - Jonathan Little, Phil Galfond
- **Upswing Poker** - Doug Polk, Ryan Fee
- **Red Chip Poker** - Strategy + Community

### Practice Routine:
1. **Daily**: Complete 10 runs in this app
2. **Weekly**: Review position stats, drill weak spots
3. **Monthly**: Study one position deeply
4. **Long-term**: Track improvement, adjust strategy
- Upswing Poker Training Site
- Run It Once Training Platform

## 💡 Tips for Users

1. **Take Your Time**: No timer - think through each decision
2. **Learn Positions**: Master one position before moving to others
3. **Read Explanations**: Understanding WHY is more important than memorizing
4. **Daily Practice**: 10 runs per day is perfect for consistent improvement
5. **Track Progress**: Watch your best streak grow over time

## 🐛 Known Issues

- None currently! Report issues if you find any.

## 📞 Contact

For questions, suggestions, or collaboration:
- Create an issue in the repository
- Or reach out directly

---

**Remember**: GTO is the baseline. Master these fundamentals, then adjust based on your opponents' tendencies in real games!

Good luck at the tables! 🎰♠️♥️♣️♦️
