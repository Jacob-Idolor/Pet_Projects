# Firebase Integration Guide - GTO Poker Trainer

## 🔥 What's New

Your app now has:
- ✅ **Authentication System** (Google & Apple Sign-In ready)
- ✅ **Position Selection** (Choose specific position or random)
- ✅ **Login Streak Tracking** (Daily login rewards)
- ✅ **Ad Integration** (Watch ads for +10 bonus runs)
- ✅ **User Profile** (Stats, accuracy, favorite position)
- ✅ **Backend-Ready Architecture** (Easy Firebase/Supabase integration)

## 🚀 Quick Start

### Current Status: **Demo Mode**
The app works right now with simulated auth and local storage. To go live, follow the Firebase setup below.

---

## 📱 Firebase Setup (For Production)

### Step 1: Create Firebase Project

1. Go to [Firebase Console](https://console.firebase.google.com/)
2. Click "Add Project"
3. Name it "gto-poker-trainer"
4. Enable Google Analytics (optional)
5. Click "Create Project"

### Step 2: Add Web App

1. In Firebase Console, click the **Web** icon (</>)
2. Register app name: "GTO Trainer Web"
3. Enable Firebase Hosting (optional)
4. Copy the Firebase config object

### Step 3: Update Config

Open `auth.js` and replace the config:

```javascript
const firebaseConfig = {
    apiKey: "AIzaSyXXXXXXXXXXXXXXXXXXXXXXXX",
    authDomain: "gto-poker-trainer.firebaseapp.com",
    projectId: "gto-poker-trainer",
    storageBucket: "gto-poker-trainer.appspot.com",
    messagingSenderId: "123456789012",
    appId: "1:123456789012:web:abc123def456"
};
```

### Step 4: Enable Authentication

In Firebase Console:

1. Go to **Authentication** > **Sign-in method**
2. Enable **Google**:
   - Click Google provider
   - Toggle "Enable"
   - Add support email
   - Save
3. Enable **Apple** (requires Apple Developer account):
   - Click Apple provider
   - Toggle "Enable"
   - Add Service ID, Team ID, Key ID, Private Key
   - Save

### Step 5: Install Firebase SDK

Add to your `index.html` before `</body>`:

```html
<!-- Firebase SDK -->
<script src="https://www.gstatic.com/firebasejs/10.7.1/firebase-app-compat.js"></script>
<script src="https://www.gstatic.com/firebasejs/10.7.1/firebase-auth-compat.js"></script>
<script src="https://www.gstatic.com/firebasejs/10.7.1/firebase-firestore-compat.js"></script>

<script src="gto-data.js"></script>
<script src="auth.js"></script>
<script src="game.js"></script>
```

### Step 6: Update auth.js with Real Firebase

Replace the simulated methods:

```javascript
// Initialize Firebase
firebase.initializeApp(firebaseConfig);
const auth = firebase.auth();
const db = firebase.firestore();

class UserManager {
    constructor() {
        this.auth = auth;
        this.db = db;
        this.currentUser = null;
        this.isGuest = false;
        this.loginStreak = 0;
        this.lastLoginDate = null;
        
        // Listen for auth state changes
        this.auth.onAuthStateChanged((user) => {
            if (user) {
                this.currentUser = {
                    uid: user.uid,
                    displayName: user.displayName,
                    email: user.email,
                    photoURL: user.photoURL,
                    provider: user.providerData[0].providerId
                };
                this.checkLoginStreak();
                this.syncUserData();
            } else {
                this.currentUser = null;
            }
        });
    }

    // Real Google Sign In
    async signInWithGoogle() {
        const provider = new firebase.auth.GoogleAuthProvider();
        try {
            const result = await this.auth.signInWithPopup(provider);
            return result.user;
        } catch (error) {
            console.error('Google sign-in error:', error);
            throw error;
        }
    }

    // Real Apple Sign In
    async signInWithApple() {
        const provider = new firebase.auth.OAuthProvider('apple.com');
        try {
            const result = await this.auth.signInWithPopup(provider);
            return result.user;
        } catch (error) {
            console.error('Apple sign-in error:', error);
            throw error;
        }
    }

    // Sync user data to Firestore
    async syncUserData() {
        if (!this.currentUser) return;
        
        const userRef = this.db.collection('users').doc(this.currentUser.uid);
        const doc = await userRef.get();
        
        if (!doc.exists) {
            // Create new user document
            await userRef.set({
                displayName: this.currentUser.displayName,
                email: this.currentUser.email,
                createdAt: firebase.firestore.FieldValue.serverTimestamp(),
                stats: {
                    totalHandsPlayed: 0,
                    totalCorrect: 0,
                    totalWrong: 0,
                    longestStreak: 0
                },
                loginStreak: {
                    current: 0,
                    longest: 0,
                    lastLoginDate: null
                }
            });
        }
    }

    // Update stats in Firestore
    async updateUserStats(position, isCorrect) {
        if (!this.currentUser) return;
        
        const userRef = this.db.collection('users').doc(this.currentUser.uid);
        
        await userRef.update({
            'stats.totalHandsPlayed': firebase.firestore.FieldValue.increment(1),
            [`stats.positionStats.${position}.played`]: firebase.firestore.FieldValue.increment(1)
        });
        
        if (isCorrect) {
            await userRef.update({
                'stats.totalCorrect': firebase.firestore.FieldValue.increment(1),
                [`stats.positionStats.${position}.correct`]: firebase.firestore.FieldValue.increment(1)
            });
        } else {
            await userRef.update({
                'stats.totalWrong': firebase.firestore.FieldValue.increment(1)
            });
        }
    }

    // Sign out
    async signOut() {
        await this.auth.signOut();
        this.currentUser = null;
    }
}
```

---

## 📊 Firestore Database Structure

```
users/
  {userId}/
    - displayName: string
    - email: string
    - photoURL: string
    - createdAt: timestamp
    - stats/
      - totalHandsPlayed: number
      - totalCorrect: number
      - totalWrong: number
      - longestStreak: number
      - positionStats/
        - BTN/
          - played: number
          - correct: number
        - CO/
          - played: number
          - correct: number
        ... (all positions)
    - loginStreak/
      - current: number
      - longest: number
      - lastLoginDate: string
    - dailyRuns/
      - date: string
      - runsRemaining: number
      - adWatchTime: timestamp
```

### Firestore Rules

In Firebase Console > Firestore > Rules:

```javascript
rules_version = '2';
service cloud.firestore {
  match /databases/{database}/documents {
    // Users can read/write their own data
    match /users/{userId} {
      allow read, write: if request.auth != null && request.auth.uid == userId;
    }
    
    // Leaderboards are readable by all authenticated users
    match /leaderboards/{document=**} {
      allow read: if request.auth != null;
      allow write: if false; // Only Cloud Functions can write
    }
  }
}
```

---

## 📺 AdMob Integration

### For Web (Google AdSense)

1. Sign up for [Google AdSense](https://www.google.com/adsense/)
2. Get your publisher ID
3. Update `auth.js`:

```javascript
class AdManager {
    constructor() {
        this.adClient = 'ca-pub-XXXXXXXXXXXXXXXX'; // Your AdSense ID
        this.lastAdWatchTime = this.getLastAdWatchTime();
        this.adCooldownHours = 5;
        this.loadAds();
    }

    loadAds() {
        // Load AdSense script
        const script = document.createElement('script');
        script.src = `https://pagead2.googlesyndication.com/pagead/js/adsbygoogle.js?client=${this.adClient}`;
        script.async = true;
        script.crossOrigin = 'anonymous';
        document.head.appendChild(script);
    }

    async watchAd() {
        // Show rewarded ad
        return new Promise((resolve, reject) => {
            if (typeof window.adsbygoogle !== 'undefined') {
                // Display rewarded ad
                // This is simplified - actual implementation depends on ad format
                setTimeout(() => {
                    this.lastAdWatchTime = Date.now();
                    localStorage.setItem('gtoAdWatchTime', this.lastAdWatchTime.toString());
                    resolve(true);
                }, 5000); // Simulate 5-second ad
            } else {
                reject(new Error('Ads not loaded'));
            }
        });
    }
}
```

### For Mobile Apps (AdMob)

When you convert to React Native or Capacitor:

**React Native:**
```bash
npm install react-native-google-mobile-ads
```

```javascript
import { RewardedAd, RewardedAdEventType } from 'react-native-google-mobile-ads';

const adUnitId = 'ca-app-pub-XXXXX/YYYYY'; // Your AdMob ID

const rewarded = RewardedAd.createForAdRequest(adUnitId);

rewarded.addAdEventListener(RewardedAdEventType.EARNED_REWARD, reward => {
  console.log('User earned reward:', reward);
  // Grant +10 runs
});

rewarded.load();
rewarded.show();
```

---

## 🎮 New User Flow

### 1. First Time User:
```
Login Screen
  → Choose: Google / Apple / Guest
  → Profile Screen (shows login streak)
  → Welcome Screen
  → Position Selection (Random or Specific)
  → Game Starts
```

### 2. Returning User:
```
Auto-login (if previously signed in)
  → Welcome Screen (sees updated runs, login streak)
  → Start Game
```

### 3. Position Selection Flow:
```
Click "Start New Run"
  → Position Selection Screen
    → Option 1: Random (recommended) → Starts immediately
    → Option 2: Choose Position → Shows 6 position cards → Select one → Starts
  → Game with selected mode
```

### 4. Out of Runs:
```
Used all 10 runs
  → Watch Ad Button appears
  → Click to watch 5-hour cooldown ad
  → Get +10 bonus runs
  → Continue playing
```

---

## 🔐 Authentication Features

### Current Implementation:

1. **Google Sign-In** ✅
   - One-click authentication
   - Auto-fills name and email
   - Stores user data

2. **Apple Sign-In** ✅
   - Required for iOS App Store
   - Privacy-focused
   - Works on web and mobile

3. **Guest Mode** ✅
   - Play without account
   - Data saved locally only
   - Can't access leaderboards

4. **Login Streak** ✅
   - Tracks consecutive daily logins
   - Shows 🔥 flame icon
   - Progress bar fills up

5. **User Profile** ✅
   - Total hands played
   - Overall accuracy %
   - Best position stats
   - Login streak display

---

## 📈 User Stats Tracking

The app now tracks:

- **Total Hands Played**: Every decision made
- **Accuracy**: Correct decisions / Total decisions
- **Position Stats**: Performance per position
  - BTN (Button)
  - CO (Cutoff)
  - MP (Middle Position)
  - UTG (Under the Gun)
  - SB (Small Blind)
  - BB (Big Blind)
- **Best Position**: Position with highest accuracy
- **Longest Streak**: Best run ever
- **Login Streak**: Consecutive days logged in

---

## 🎯 Position Selection System

### Random Mode (Recommended):
- Practices all 6 positions
- Balanced GTO training
- Changes every hand
- **Best for improving overall game**

### Specific Position Mode:
- Focus on one position
- Master specific ranges
- Choose from 6 positions
- **Best for drilling weak areas**

### Difficulty Levels:
- **Easy**: BTN, CO (wide ranges, profitable)
- **Medium**: MP, SB, BB (moderate ranges)
- **Hard**: UTG (tight range, challenging)

---

## 💰 Monetization Ready

### Current Free Tier:
- 10 runs per day
- Watch ad for +10 runs (5-hour cooldown)
- Basic stats tracking
- Login streak rewards

### Premium Options (Easy to Add):

**1. Premium Unlock ($4.99 one-time)**
```javascript
const isPremium = user.premium || false;
if (isPremium) {
    this.runsRemaining = 999; // Unlimited
    this.hideAds();
}
```

**2. Subscription ($2.99/month)**
- Unlimited runs
- No ads
- Advanced statistics
- Post-flop scenarios
- Leaderboard access

**3. Position Packs ($1.99 each)**
- Unlock specific positions
- Advanced scenarios per position
- Video tutorials

---

## 🚀 Deployment Checklist

### Firebase Setup:
- [ ] Create Firebase project
- [ ] Enable Google authentication
- [ ] Enable Apple authentication (if iOS app)
- [ ] Set up Firestore database
- [ ] Configure Firestore rules
- [ ] Add Firebase SDK to HTML
- [ ] Update firebaseConfig in auth.js
- [ ] Test authentication flow

### AdMob Setup:
- [ ] Sign up for AdSense/AdMob
- [ ] Create rewarded ad unit
- [ ] Add ad unit ID to code
- [ ] Test ad display
- [ ] Verify reward grant
- [ ] Set cooldown period

### App Store Prep:
- [ ] Create app icon (1024x1024)
- [ ] Set up Apple Developer account
- [ ] Configure Apple Sign-In
- [ ] Add privacy policy
- [ ] Create app screenshots
- [ ] Write app description

---

## 🧪 Testing Guide

### Test Auth Flow:
1. Open app → Should see login screen
2. Click "Play as Guest" → Goes to welcome screen
3. Click "View Profile" → See guest profile
4. Click logout → Back to login screen
5. Click "Continue with Google" → Simulates sign-in
6. See profile with Google account

### Test Position Selection:
1. Click "Start New Run"
2. See position selection screen
3. Click "Random Position" → Game starts immediately
4. Complete a run, click "Play Again"
5. This time click "Choose Position"
6. See 6 position cards
7. Click "BTN" → Game starts with BTN position
8. All hands are BTN position

### Test Ad System:
1. Use all 10 runs
2. Click "Watch Ad for +10 Runs"
3. Wait 2 seconds (simulated ad)
4. Get +10 runs added
5. Ad button disabled for 5 hours
6. See countdown timer

### Test Login Streak:
1. Sign in today
2. Check profile → Streak = 1
3. Change system date to tomorrow
4. Refresh app
5. Streak increases to 2
6. Skip a day
7. Streak resets to 1

---

## 📱 Mobile App Conversion

Your app is now ready for:

### Capacitor (Easiest):
```bash
npm install @capacitor/core @capacitor/cli
npx cap init
npx cap add ios android
```

### React Native (Best Performance):
- Use component structure from COMPONENT-MAP.md
- Firebase works natively
- AdMob has React Native SDK

---

## 🎉 What's Working Right Now

Without any backend setup, you can test:

✅ Login screen (simulated auth)
✅ Guest mode (full functionality)
✅ Position selection (random or specific)
✅ Profile with stats
✅ Login streak tracking (local)
✅ Ad system (simulated 5-hour cooldown)
✅ All game functionality
✅ User stats tracking
✅ Daily run limits

**Everything is stored locally and works offline!**

---

## 🔮 Next Steps

1. **Test locally** - Everything works now
2. **Set up Firebase** - When ready for multi-device sync
3. **Add AdMob** - When ready to monetize
4. **Deploy to hosting** - Netlify, Vercel, or Firebase Hosting
5. **Convert to app** - Capacitor or React Native
6. **Submit to stores** - App Store and Google Play

---

## 📞 Need Help?

The app is fully functional now in demo mode. When you're ready to go live:

1. Follow Firebase setup above
2. Replace simulated auth with real Firebase
3. Add actual AdMob ads
4. Deploy to production

**Your app is ready to test and gather user feedback right now!** 🚀
