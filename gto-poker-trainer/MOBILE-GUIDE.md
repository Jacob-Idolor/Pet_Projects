# Mobile Development Guide - GTO Poker Trainer

## 📱 Mobile-First Design Completed

Your app is now **fully optimized for vertical phone screens** with:
- ✅ Thumb-friendly button layout (60px height buttons)
- ✅ Vertical stacking for one-handed use
- ✅ Design tokens (CSS variables) for easy Figma sync
- ✅ Progressive Web App (PWA) capabilities
- ✅ Works offline after first load
- ✅ Installable on iOS and Android

---

## 🎨 Figma to Code Workflow

### Design Tokens (Already Implemented)
All design values are stored as CSS variables in `styles.css`:

```css
:root {
    /* Colors */
    --color-bg-primary: #0a0e27;
    --color-accent-green: #00ff87;
    
    /* Spacing */
    --space-sm: 12px;
    --space-md: 16px;
    
    /* Typography */
    --font-size-lg: 20px;
    
    /* Component Heights */
    --button-height: 60px;
}
```

### How to Import Your Figma Design:

1. **Export Design Tokens from Figma:**
   - Use Figma plugin: "Design Tokens" or "Tokens Studio"
   - Export as JSON
   - Map to CSS variables in `styles.css`

2. **Component Structure:**
   ```
   Figma Frame → HTML Component
   ├── Position Badge → .position-badge
   ├── Cards → .cards > .card
   ├── Scenario Info → .scenario-info
   └── Action Buttons → .action-buttons > .action-btn
   ```

3. **Button Mapping:**
   ```
   Figma Component → CSS Class
   - Raise Button → .raise-btn
   - Call Button → .call-btn
   - Fold Button → .fold-btn
   - All-in Button → .allin-btn
   ```

---

## 📲 Install as Mobile App (PWA)

### iOS Installation:
1. Open Safari browser
2. Navigate to your app URL
3. Tap Share button
4. Select "Add to Home Screen"
5. App installs like a native app!

### Android Installation:
1. Open Chrome browser
2. Navigate to your app URL
3. Tap menu (three dots)
4. Select "Add to Home Screen"
5. Or browser will prompt automatically

### Features When Installed:
- ✅ Full screen (no browser UI)
- ✅ Works offline
- ✅ App icon on home screen
- ✅ Splash screen on launch
- ✅ Native-like experience

---

## 🚀 Converting to Native Apps

### Option 1: React Native (Recommended for Full Native)

**Step 1: Install React Native**
```bash
npx react-native init GTOPokerApp
cd GTOPokerApp
```

**Step 2: Component Mapping**

Your current code → React Native:

```javascript
// Example: Action Button Component
import { TouchableOpacity, Text, StyleSheet } from 'react-native';

const ActionButton = ({ action, onPress, type }) => (
  <TouchableOpacity 
    style={[styles.actionBtn, styles[`${type}Btn`]]}
    onPress={onPress}
    activeOpacity={0.8}
  >
    <Text style={styles.btnText}>{action}</Text>
  </TouchableOpacity>
);

const styles = StyleSheet.create({
  actionBtn: {
    height: 60,
    borderRadius: 12,
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 12,
  },
  raiseBtn: {
    backgroundColor: '#f39c12',
  },
  callBtn: {
    backgroundColor: '#3498db',
  },
  foldBtn: {
    backgroundColor: '#e74c3c',
  },
  allinBtn: {
    backgroundColor: '#9b59b6',
  },
  btnText: {
    fontSize: 20,
    fontWeight: '700',
    color: '#ffffff',
    textTransform: 'uppercase',
  }
});
```

**Step 3: Storage Migration**
```javascript
// Replace localStorage with AsyncStorage
import AsyncStorage from '@react-native-async-storage/async-storage';

// Instead of localStorage.setItem()
await AsyncStorage.setItem('gtoPokerTrainer', JSON.stringify(data));

// Instead of localStorage.getItem()
const data = await AsyncStorage.getItem('gtoPokerTrainer');
```

**Step 4: File Structure**
```
GTOPokerApp/
├── src/
│   ├── components/
│   │   ├── ActionButton.js
│   │   ├── Card.js
│   │   ├── PositionBadge.js
│   │   └── StatsBar.js
│   ├── screens/
│   │   ├── WelcomeScreen.js
│   │   ├── GameScreen.js
│   │   └── GameOverScreen.js
│   ├── data/
│   │   └── gtoData.js (same as your gto-data.js)
│   ├── utils/
│   │   └── storage.js
│   └── styles/
│       └── theme.js (design tokens)
├── App.js
└── package.json
```

---

### Option 2: Capacitor (Web to Native - Easier)

Keep your current HTML/CSS/JS and wrap it as native app:

**Step 1: Install Capacitor**
```bash
npm init
npm install @capacitor/core @capacitor/cli
npx cap init "GTO Poker Trainer" "com.gtopoker.app"
```

**Step 2: Add Platforms**
```bash
npm install @capacitor/ios @capacitor/android
npx cap add ios
npx cap add android
```

**Step 3: Build**
```bash
npm run build
npx cap sync
npx cap open ios    # Opens in Xcode
npx cap open android # Opens in Android Studio
```

**Advantages:**
- ✅ Use your existing HTML/CSS/JS code
- ✅ Access native features (camera, notifications, etc.)
- ✅ Faster development
- ✅ Single codebase

---

### Option 3: Flutter (If you want Dart)

**Not recommended for your project** since you'd need to rewrite everything.
Stick with React Native or Capacitor.

---

## 🔧 Recommended Tech Stack by Goal

### Goal: **Quick to Market (MVP)**
→ Use **PWA** (what you have now)
- No app store approval needed
- Works immediately on all devices
- Users can install it
- Update instantly without app store

### Goal: **Native App Features** (Push notifications, in-app purchases)
→ Use **Capacitor**
- Wrap your current code
- Add native plugins as needed
- Publish to app stores

### Goal: **Best Performance & Native Feel**
→ Use **React Native**
- Full native app
- Better performance
- More complex but most professional

---

## 📊 Component Breakdown for React Native

### Core Components Needed:

1. **Navigation**
   ```bash
   npm install @react-navigation/native
   npm install @react-navigation/stack
   ```

2. **State Management**
   - Use Context API (built-in) or
   - Redux Toolkit for complex state

3. **Async Storage**
   ```bash
   npm install @react-native-async-storage/async-storage
   ```

4. **Animations**
   ```bash
   npm install react-native-reanimated
   ```

---

## 🎯 Migration Priority

### Phase 1: Keep PWA (Current)
- ✅ Already done
- Test with users
- Get feedback

### Phase 2: Add Capacitor (2-3 days)
- Wrap as native app
- Add app icons
- Test on real devices

### Phase 3: Publish (1 week)
- App Store submission (iOS)
- Google Play submission (Android)
- Marketing materials

### Phase 4: React Native (Optional - 2-4 weeks)
- Only if you need maximum performance
- Rewrite components
- Add advanced features

---

## 📱 Design Specifications (For Figma)

### Screen Dimensions:
- **iPhone 13/14**: 390 x 844 px (2532 x 1170 @3x)
- **iPhone 13/14 Pro Max**: 428 x 926 px
- **Android Standard**: 360 x 800 px
- **Design at**: 375 x 812 px (iPhone X/11 Pro)

### Safe Areas:
- **Top**: 44px (status bar + notch)
- **Bottom**: 34px (home indicator)
- **Sides**: 16px (comfortable thumb zone)

### Touch Target Sizes:
- **Minimum**: 44 x 44 px (Apple HIG)
- **Optimal**: 48-60 px (your buttons are 60px ✅)
- **Spacing**: 12px between buttons

### Typography Scale:
```
Heading 1: 32px (--font-size-2xl)
Heading 2: 24px (--font-size-xl)
Body Large: 20px (--font-size-lg)
Body: 16px (--font-size-md)
Caption: 12px (--font-size-xs)
```

### Color Palette:
```
Primary Action: #f39c12 (Raise - Gold)
Secondary Action: #3498db (Call - Blue)
Danger Action: #e74c3c (Fold - Red)
Special Action: #9b59b6 (All-in - Purple)
Success: #00ff87 (Green)
Background: #0a0e27 (Dark Blue)
```

---

## 🎨 Figma Plugin Recommendations

1. **"Anima"** - Export to React/HTML directly
2. **"Figma to Code"** - Generate React Native components
3. **"Design Tokens"** - Export design system as JSON
4. **"Figmotion"** - Create animations to export

---

## 🔐 Native Features to Add Later

### Phase 1 Native Features:
- Push notifications (daily reminder to practice)
- Haptic feedback on button press
- Dark/light mode toggle

### Phase 2 Native Features:
- Biometric authentication (unlock premium)
- In-app purchases (remove run limit)
- Social sharing (share streak to Instagram/Twitter)

### Phase 3 Native Features:
- Multiplayer challenges
- Real-time leaderboards
- Video tutorials

---

## 📦 Next Steps

1. **Test current PWA** on your phone:
   - Open in browser
   - Install to home screen
   - Test offline functionality

2. **Create Figma mockups** (if needed):
   - Use the design tokens provided
   - Export assets at @2x and @3x for iOS
   - Use Android export for material icons

3. **Choose your path**:
   - Stay with PWA? → Add more features to current code
   - Go native? → Start with Capacitor wrapper
   - Need best performance? → React Native migration

---

## 💡 Pro Tips

1. **Test on real devices early** - Simulators don't show real performance
2. **Use your own phone** - You'll catch UX issues faster
3. **Start with PWA** - Get user feedback before investing in native
4. **Keep web version** - Many users prefer not installing apps
5. **Progressive enhancement** - Add native features gradually

---

## 📚 Resources

### React Native:
- https://reactnative.dev/docs/getting-started
- https://www.udemy.com/react-native/ (courses)

### Capacitor:
- https://capacitorjs.com/docs
- https://ionic.io/docs/capacitor

### PWA:
- https://web.dev/progressive-web-apps/
- https://developer.mozilla.org/en-US/docs/Web/Progressive_web_apps

### Figma to Code:
- https://www.figma.com/community/plugin/842128343887142055/Anima
- https://www.figma.com/community/plugin/771066581815570548/Figma-to-Code

---

## 🎯 Summary

**Your app is NOW:**
✅ Mobile-optimized (vertical layout)
✅ Installable as PWA (iOS & Android)
✅ Works offline
✅ Uses design tokens (Figma-ready)
✅ Touch-friendly buttons
✅ Component-based structure

**You can:**
1. Use it as-is (fully functional PWA)
2. Import to Figma for visual tweaks
3. Wrap with Capacitor for app stores
4. Or rebuild in React Native for best performance

**My recommendation: Start using the PWA, gather user feedback, then decide on native development.**
