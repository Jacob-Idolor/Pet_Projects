# Component Architecture Map

## 🧩 Current Web Components → Future Mobile Components

This document maps your current HTML/CSS structure to components for Figma design and React Native/Flutter development.

---

## 📊 Component Hierarchy

```
App
├── Header
│   ├── Title
│   └── Tagline
│
├── StatsBar
│   ├── StatItem (Current Streak)
│   ├── StatItem (Best Streak)
│   └── StatItem (Runs Remaining)
│
└── GameContainer
    ├── WelcomeScreen
    │   ├── WelcomeTitle
    │   ├── WelcomeText
    │   ├── GameRules (List)
    │   ├── StartButton
    │   └── RunsInfo
    │
    ├── GameScreen (PokerTable)
    │   ├── PositionBadge
    │   ├── HandDisplay
    │   │   └── Card (x2)
    │   ├── ScenarioInfo
    │   │   ├── ScenarioText
    │   │   └── PotInfo
    │   └── ActionButtons
    │       ├── RaiseButton
    │       ├── CallButton
    │       ├── FoldButton
    │       └── AllInButton
    │
    ├── GameOverScreen
    │   ├── GameOverTitle
    │   ├── FinalStats
    │   ├── MistakeInfo
    │   │   ├── MistakeDetails
    │   │   └── Explanation
    │   └── GameOverActions
    │       ├── PlayAgainButton
    │       └── BackToMenuButton
    │
    └── OutOfRunsScreen
        ├── OutOfRunsTitle
        ├── ResetTime
        ├── TodayStats
        └── BackButton
```

---

## 🎨 Component Details for Figma

### 1. StatsBar Component
**HTML:** `.stats-bar`
**Type:** Horizontal container
**Children:** 3x StatItem

**Properties:**
- Display: Flex, horizontal
- Gap: space-md (16px)
- Background: rgba(255,255,255,0.05)
- Border-radius: 16px
- Padding: 16px

**Figma Frame:**
- Width: Fill parent
- Height: Auto
- Auto Layout: Horizontal
- Gap: 16px

---

### 2. StatItem Component
**HTML:** `.stat-item`
**Type:** Vertical stack
**Variants:** 3 (Streak, Best, Runs)

**Properties:**
- Display: Flex, vertical
- Align: Center
- Gap: 4px

**Figma Component:**
- Auto Layout: Vertical
- Gap: 4px
- Variants: streak | best | runs

**Content:**
- stat-value: 32px, Bold, Color varies by variant
- stat-label: 12px, Regular, #aaaaaa

---

### 3. ActionButton Component
**HTML:** `.action-btn`
**Type:** Button
**Variants:** 4 (Raise, Call, Fold, All-in)

**Properties:**
```css
Height: 60px
Border-radius: 12px
Font-size: 20px
Font-weight: 700
Text-transform: uppercase
```

**Figma Component:**
- Type: Button
- Variants: raise | call | fold | allin
- States: default | pressed | disabled

**Colors:**
- Raise: Linear gradient #f39c12 → #e67e22
- Call: Linear gradient #3498db → #2980b9
- Fold: Linear gradient #e74c3c → #c0392b
- All-in: Linear gradient #9b59b6 → #8e44ad

**Touch Feedback:**
- Active: Scale 0.97
- Ripple: rgba(255,255,255,0.1)

---

### 4. Card Component
**HTML:** `.card`
**Type:** Display element
**Variants:** 52 (optional) or 2 (red/black)

**Properties:**
```css
Width: 70px
Height: 98px
Border-radius: 8px
Background: white
Font-size: 32px
Font-weight: 700
```

**Figma Component:**
- Size: 70 x 98
- Variants: red | black
- Props: rank (text), suit (icon)

**Content Structure:**
- Rank text (A, K, Q, J, 10, 9...)
- Suit symbol (♠ ♥ ♦ ♣)

---

### 5. PositionBadge Component
**HTML:** `.position-badge`
**Type:** Label
**Variants:** 6 (BTN, CO, MP, UTG, SB, BB)

**Properties:**
```css
Padding: 12px 24px
Border-radius: 16px
Border: 2px solid #00ff87
Background: gradient rgba(0,255,135,0.2) → rgba(96,239,255,0.2)
Font-size: 24px
Font-weight: 700
Color: #00ff87
```

**Figma Component:**
- Auto Layout: Horizontal
- Padding: 12px 24px
- Variants: BTN | CO | MP | UTG | SB | BB

---

## 🔄 React Native Component Mapping

### StatsBar.js
```javascript
import { View, Text, StyleSheet } from 'react-native';

const StatsBar = ({ currentStreak, bestStreak, runsRemaining }) => (
  <View style={styles.statsBar}>
    <StatItem value={currentStreak} label="Streak" />
    <StatItem value={bestStreak} label="Best" />
    <StatItem value={runsRemaining} label="Runs" type="runs" />
  </View>
);

const styles = StyleSheet.create({
  statsBar: {
    flexDirection: 'row',
    justifyContent: 'space-around',
    backgroundColor: 'rgba(255,255,255,0.05)',
    borderRadius: 16,
    padding: 16,
    marginBottom: 16,
  }
});
```

---

### ActionButton.js
```javascript
import { TouchableOpacity, Text, StyleSheet } from 'react-native';
import LinearGradient from 'react-native-linear-gradient';

const ActionButton = ({ type, onPress, disabled }) => {
  const gradients = {
    raise: ['#f39c12', '#e67e22'],
    call: ['#3498db', '#2980b9'],
    fold: ['#e74c3c', '#c0392b'],
    allin: ['#9b59b6', '#8e44ad'],
  };

  return (
    <TouchableOpacity 
      activeOpacity={0.8}
      onPress={onPress}
      disabled={disabled}
    >
      <LinearGradient
        colors={gradients[type]}
        style={styles.button}
      >
        <Text style={styles.buttonText}>{type.toUpperCase()}</Text>
      </LinearGradient>
    </TouchableOpacity>
  );
};

const styles = StyleSheet.create({
  button: {
    height: 60,
    borderRadius: 12,
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 12,
  },
  buttonText: {
    fontSize: 20,
    fontWeight: '700',
    color: '#FFFFFF',
  }
});
```

---

### Card.js
```javascript
import { View, Text, StyleSheet } from 'react-native';

const Card = ({ rank, suit, color }) => (
  <View style={styles.card}>
    <Text style={[styles.cardText, { color }]}>
      {rank}{suit}
    </Text>
  </View>
);

const styles = StyleSheet.create({
  card: {
    width: 70,
    height: 98,
    backgroundColor: 'white',
    borderRadius: 8,
    justifyContent: 'center',
    alignItems: 'center',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3,
    shadowRadius: 8,
  },
  cardText: {
    fontSize: 32,
    fontWeight: '700',
  }
});
```

---

## 📐 Design Token Export (for Figma)

### colors.json
```json
{
  "background": {
    "primary": "#0a0e27",
    "secondary": "#1a1a2e",
    "card": "#16213e"
  },
  "accent": {
    "green": "#00ff87",
    "blue": "#60efff"
  },
  "actions": {
    "raise": "#f39c12",
    "call": "#3498db",
    "fold": "#e74c3c",
    "allin": "#9b59b6"
  },
  "text": {
    "primary": "#ffffff",
    "secondary": "#aaaaaa"
  }
}
```

### spacing.json
```json
{
  "xs": 8,
  "sm": 12,
  "md": 16,
  "lg": 24,
  "xl": 32
}
```

### typography.json
```json
{
  "fontSize": {
    "xs": 12,
    "sm": 14,
    "md": 16,
    "lg": 20,
    "xl": 24,
    "2xl": 32,
    "3xl": 48
  },
  "fontWeight": {
    "regular": "400",
    "bold": "700"
  }
}
```

### components.json
```json
{
  "button": {
    "height": 60,
    "borderRadius": 12
  },
  "card": {
    "width": 70,
    "height": 98,
    "borderRadius": 8
  }
}
```

---

## 🎯 Implementation Priority

### Phase 1: Core Components (Week 1)
1. ✅ ActionButton (most important - user interaction)
2. ✅ Card (visual feedback)
3. ✅ PositionBadge (game state)
4. ✅ StatsBar (progress tracking)

### Phase 2: Screens (Week 2)
5. WelcomeScreen
6. GameScreen
7. GameOverScreen
8. OutOfRunsScreen

### Phase 3: Polish (Week 3)
9. Animations
10. Sound effects
11. Haptic feedback
12. Loading states

---

## 🔗 Component Props Interface

### For TypeScript/React:

```typescript
// ActionButton.tsx
interface ActionButtonProps {
  type: 'raise' | 'call' | 'fold' | 'allin';
  onPress: () => void;
  disabled?: boolean;
}

// Card.tsx
interface CardProps {
  rank: string;
  suit: '♠' | '♥' | '♦' | '♣';
  animated?: boolean;
}

// PositionBadge.tsx
interface PositionBadgeProps {
  position: 'BTN' | 'CO' | 'MP' | 'UTG' | 'SB' | 'BB';
}

// StatItem.tsx
interface StatItemProps {
  value: number;
  label: string;
  type?: 'default' | 'runs';
}
```

---

## 📱 Screen Dimensions

### iPhone:
- iPhone 13/14: 390 x 844 pt (@3x = 1170 x 2532 px)
- iPhone 13/14 Pro Max: 428 x 926 pt
- iPhone SE: 375 x 667 pt

### Android:
- Small: 360 x 640 dp
- Medium: 411 x 823 dp
- Large: 414 x 896 dp

### Design Canvas (Figma):
- **Primary frame**: 375 x 812 (iPhone X/11 Pro)
- Scales to all other sizes

---

## 🎨 Figma Naming Convention

```
Frames:
- Home/Welcome
- Home/Game-Active
- Home/Game-Over
- Home/Out-of-Runs

Components:
- Button/Action/Raise
- Button/Action/Call
- Button/Action/Fold
- Button/Action/AllIn
- Card/Red
- Card/Black
- Badge/Position/BTN
- Stats/Item

Variants:
- state=default|pressed|disabled
- type=raise|call|fold|allin
- color=red|black
```

---

## 🚀 Export Workflow

### Figma → Code:

1. **Design in Figma** using components above
2. **Use Anima plugin** to export
3. **Or manually copy** CSS from Figma
4. **Replace variables** in styles.css
5. **Test** in browser

### Figma → React Native:

1. **Design components** in Figma
2. **Use Figma to React Native plugin**
3. **Or manually recreate** using component maps above
4. **Import** into React Native project
5. **Style** using StyleSheet

---

## 💡 Tips

1. **Keep components atomic**: One component = one responsibility
2. **Use variants**: Don't create separate components for colors
3. **Auto Layout**: Makes responsive design easier
4. **Name consistently**: Easier to find and export
5. **Component instances**: Create once, reuse everywhere

---

## ✅ Component Checklist

Ready to design? Check off as you create:

### Core UI:
- [ ] ActionButton component (4 variants)
- [ ] Card component (2 variants)
- [ ] PositionBadge component (6 variants)
- [ ] StatItem component (3 variants)

### Containers:
- [ ] StatsBar container
- [ ] ActionButtons container
- [ ] HandDisplay container

### Screens:
- [ ] WelcomeScreen
- [ ] GameScreen
- [ ] GameOverScreen
- [ ] OutOfRunsScreen

### Assets:
- [ ] App icon (1024x1024)
- [ ] Splash screen
- [ ] Card suit symbols
- [ ] Gradient backgrounds

---

**You now have everything needed to:**
✅ Design in Figma
✅ Export to code
✅ Build in React Native
✅ Or keep as web app

**Choose your adventure and build something amazing!** 🚀
