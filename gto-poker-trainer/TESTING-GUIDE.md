# 🚀 Quick Start - Testing the Refactored App

## Option 1: Test New Architecture (Side-by-Side)

### Step 1: Create Test HTML
Create `index-v2.html` to test new architecture without breaking existing app:

```html
<!DOCTYPE html>
<html lang="en">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>GTO Poker Trainer v2.0</title>
    <link rel="stylesheet" href="styles.css">
</head>
<body>
    <div class="container">
        <header>
            <h1>🃏 GTO Poker Trainer v2.0</h1>
            <p class="tagline">Modular Architecture</p>
        </header>

        <!-- Keep all existing HTML structure from index.html -->
        <!-- ... (copy from current index.html) ... -->

    </div>

    <!-- NEW MODULE LOADING ORDER -->
    <script src="modules/config.js"></script>
    <script src="modules/state-manager.js"></script>
    <script src="modules/ui-controller.js"></script>
    <script src="modules/preflop-engine.js"></script>
    
    <!-- Legacy modules -->
    <script src="gto-data.js"></script>
    <script src="auth.js"></script>
    <script src="ai-insights.js"></script>
    
    <!-- New Main App -->
    <script src="app.js"></script>
</body>
</html>
```

### Step 2: Test in Browser
```powershell
# Open new version
start index-v2.html

# Open dev console (F12)
# Check for errors
# Test features
```

### Step 3: Verify Features
- [ ] Login works
- [ ] Mode selection works
- [ ] Game starts
- [ ] Actions work
- [ ] Streak updates
- [ ] Game over displays
- [ ] AI insights work
- [ ] Profile displays

---

## Option 2: Switch Existing HTML

### Step 1: Backup
```powershell
Copy-Item index.html index-backup.html
Copy-Item game.js game-backup.js
```

### Step 2: Update index.html
Change script loading at the end of `index.html`:

**FROM:**
```html
<script src="gto-data.js"></script>
<script src="auth.js"></script>
<script src="ai-insights.js"></script>
<script src="game.js"></script>
```

**TO:**
```html
<!-- Core Modules -->
<script src="modules/config.js"></script>
<script src="modules/state-manager.js"></script>
<script src="modules/ui-controller.js"></script>
<script src="modules/preflop-engine.js"></script>

<!-- Legacy -->
<script src="gto-data.js"></script>
<script src="auth.js"></script>
<script src="ai-insights.js"></script>

<!-- Main App -->
<script src="app.js"></script>
```

### Step 3: Test
```powershell
start index.html
```

---

## Browser Console Commands

### Check App Status:
```javascript
// App loaded?
console.log(window.gtoApp);

// App info
window.gtoApp.getInfo()
// Output: { name: "GTO Poker Trainer", version: "2.0.0", stage: "PREFLOP", ... }

// Current state
window.gtoApp.getState()
// Output: { user: {...}, gameActive: false, currentStreak: 0, ... }
```

### Debugging:
```javascript
// State history
window.gtoApp.state.getHistory()

// Current scenario
window.gtoApp.preflopEngine.getCurrentScenario()

// User stats
window.gtoApp.userManager.getUserStats()
```

### Manual Testing:
```javascript
// Manually start game
window.gtoApp.showModeSelection()
window.gtoApp.selectMode('random')
window.gtoApp.startGame()

// Manually select position
window.gtoApp.selectPosition('BTN')

// Check AI insights
window.gtoApp.showInsights()
```

---

## Performance Testing

### Before (Old Architecture):
```javascript
// Time DOM queries
console.time('render');
// Render scenario
console.timeEnd('render');
// Expected: ~50ms
```

### After (New Architecture):
```javascript
console.time('render');
window.gtoApp.ui.renderScenario(scenario);
console.timeEnd('render');
// Expected: ~20ms ✅
```

---

## Troubleshooting

### Error: "gtoApp is not defined"
**Cause:** Modules not loaded in correct order  
**Fix:** Ensure `app.js` loads AFTER all modules

### Error: "GTO_DATA is not defined"
**Cause:** `gto-data.js` not loaded  
**Fix:** Ensure `gto-data.js` loads before `app.js`

### Error: "stateManager is not defined"
**Cause:** `state-manager.js` not loaded  
**Fix:** Load `modules/state-manager.js` before `app.js`

### UI Not Updating
**Cause:** State changes not triggering updates  
**Fix:** Check state subscriptions in `app.js`

### Actions Not Working
**Cause:** Event delegation not set up  
**Fix:** Check `ui-controller.js` initialization

---

## Rollback Plan

If new architecture has issues:

### Step 1: Restore Backup
```powershell
Copy-Item index-backup.html index.html
```

### Step 2: Use Old Game
Comment out new modules, uncomment `game.js`:
```html
<!-- <script src="modules/config.js"></script> -->
<!-- <script src="modules/state-manager.js"></script> -->
<!-- <script src="app.js"></script> -->
<script src="game.js"></script>
```

### Step 3: Test
```powershell
start index.html
```

---

## Feature Comparison Checklist

Test these features in both old and new versions:

### Authentication:
- [ ] Google sign-in
- [ ] Guest play
- [ ] Logout
- [ ] Profile display

### Game Flow:
- [ ] Random mode
- [ ] Specific position mode
- [ ] Scenario generation
- [ ] Action validation
- [ ] Correct action → next hand
- [ ] Wrong action → game over

### Stats:
- [ ] Streak updates
- [ ] Best streak saves
- [ ] Runs decrement
- [ ] Out of runs screen

### AI Insights:
- [ ] View insights button
- [ ] Insights generation
- [ ] Position breakdown
- [ ] Recommendations
- [ ] Practice from insights

### UI:
- [ ] Screen transitions
- [ ] Animations
- [ ] Toast notifications
- [ ] Loading states
- [ ] Error messages

---

## Performance Checklist

Measure improvements:

### Load Time:
- [ ] Old: ~500ms
- [ ] New: ~300ms ✅

### Render Time:
- [ ] Old: ~50ms
- [ ] New: ~20ms ✅

### Memory Usage:
- [ ] Old: ~15MB
- [ ] New: ~10MB ✅

### DOM Queries:
- [ ] Old: ~100 per game
- [ ] New: ~20 per game ✅

---

## Next Steps After Testing

### If Everything Works:
1. Delete old `game.js`
2. Update main `index.html`
3. Update `README.md`
4. Deploy new version

### If Issues Found:
1. Document issues
2. Fix in new architecture
3. Test again
4. Keep old version as backup

---

## Reporting Issues

### Template:
```
**What I Did:**
[Steps to reproduce]

**Expected:**
[What should happen]

**Actual:**
[What actually happened]

**Console Errors:**
[Any error messages]

**Browser:**
[Chrome, Safari, etc.]
```

---

## Success Indicators

✅ No console errors  
✅ All features work  
✅ Performance improved  
✅ UI feels smoother  
✅ State updates correctly  
✅ Easy to understand code  

---

**Ready to test! Start with Option 1 (side-by-side) for safety.** 🚀
