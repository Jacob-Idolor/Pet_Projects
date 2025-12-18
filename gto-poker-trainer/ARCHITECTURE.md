# 🏗️ GTO Poker Trainer - Architecture Documentation

## Version 2.0 - Modular Architecture

**Focus:** Pre-Flop Training (Extensible for Turn/River)

---

## 📐 Architecture Overview

The app has been refactored from a monolithic structure to a **modular, event-driven architecture** that separates concerns and makes it easy to extend with new features (Turn, River, Multi-Street).

```
┌─────────────────────────────────────────────────┐
│                   app.js                        │
│           (Main Application Controller)         │
└─────────────────────────────────────────────────┘
           │         │         │         │
    ┌──────┴───┐ ┌──┴───┐ ┌──┴────┐ ┌──┴────┐
    │ Config   │ │State │ │  UI   │ │Engine │
    │ Manager  │ │Manager│ │Control│ │(Stage)│
    └──────────┘ └───────┘ └───────┘ └───────┘
                                         │
                                    ┌────┴────┐
                                    │ PreFlop │
                                    │  Turn   │ (Future)
                                    │  River  │ (Future)
                                    └─────────┘
```

---

## 📂 File Structure

### New Modular Structure

```
gto-poker-trainer/
├── index.html              # Main HTML (loads modules in correct order)
├── styles.css              # Styles (to be optimized)
├── app.js                  # Main app controller (NEW)
│
├── modules/                # Core modules (NEW)
│   ├── config.js           # App configuration
│   ├── state-manager.js    # Centralized state management
│   ├── ui-controller.js    # UI/DOM controller
│   └── preflop-engine.js   # Pre-flop game logic
│
├── legacy/ (to refactor)
│   ├── gto-data.js         # GTO ranges data
│   ├── auth.js             # User authentication
│   ├── ai-insights.js      # AI insights engine
│   └── game.js             # OLD game logic (to be deprecated)
│
└── docs/
    ├── ARCHITECTURE.md     # This file
    ├── AI-INSIGHTS-GUIDE.md
    └── MOBILE-GUIDE.md
```

---

## 🧩 Core Modules

### 1. **config.js** - Central Configuration

**Purpose:** Single source of truth for all app settings

**Key Features:**
- Game settings (runs, positions, cooldowns)
- AI thresholds
- Storage keys
- Feature flags
- Error messages

**Usage:**
```javascript
// Access config anywhere
APP_CONFIG.GAME.INITIAL_RUNS  // 10
APP_CONFIG.AI.MIN_HANDS_FOR_INSIGHTS  // 20
APP_CONFIG.FEATURES.PREFLOP  // true
APP_CONFIG.FEATURES.TURN  // false (future)
```

**Extension Point:**
```javascript
// When adding Turn/River:
FEATURES: {
    PREFLOP: true,
    TURN: true,     // Enable when ready
    RIVER: true,    // Enable when ready
    MULTI_STREET: true
}
```

---

### 2. **state-manager.js** - State Management

**Purpose:** Reactive state management with pub/sub pattern

**Key Features:**
- Centralized state store
- Subscribe to state changes
- State history (for debugging/undo)
- Automatic persistence
- Type-safe updates

**State Structure:**
```javascript
{
    // User
    user: null,
    isAuthenticated: false,
    
    // Game
    currentScreen: 'login',
    gameActive: false,
    currentScenario: null,
    selectedMode: 'random',
    selectedPosition: null,
    
    // Stats
    currentStreak: 0,
    bestStreak: 0,
    runsRemaining: 10,
    
    // Session
    handsPlayed: 0,
    sessionStartTime: Date.now(),
    
    // UI
    loading: false,
    error: null
}
```

**Usage:**
```javascript
// Subscribe to changes
stateManager.subscribe((newState, prevState) => {
    if (newState.currentStreak !== prevState.currentStreak) {
        console.log('Streak changed!', newState.currentStreak);
    }
});

// Update state
stateManager.setState({ currentStreak: 5 });

// Get state
const state = stateManager.getState();
```

**Benefits:**
- ✅ Single source of truth
- ✅ Predictable state updates
- ✅ Easy debugging (state history)
- ✅ Decoupled components
- ✅ Automatic UI updates

---

### 3. **ui-controller.js** - UI Management

**Purpose:** Handles all DOM interactions and screen transitions

**Key Features:**
- Screen management
- Element caching (performance)
- Event delegation
- Animation helpers
- Toast notifications
- Loading states

**Usage:**
```javascript
// Show a screen
uiController.showScreen('game');

// Update stats
uiController.updateStats({
    currentStreak: 5,
    bestStreak: 10,
    runsRemaining: 7
});

// Render scenario
uiController.renderScenario(scenario);

// Show feedback
uiController.showFeedback(true); // correct
uiController.showFeedback(false); // incorrect

// Toast notifications
uiController.showSuccess('Great job!');
uiController.showError('Out of runs');

// Event emitter
uiController.on('action:selected', (action) => {
    console.log('Player chose:', action);
});
```

**Performance Optimizations:**
- ✅ DOM elements cached on init
- ✅ Event delegation (fewer listeners)
- ✅ CSS animations (GPU accelerated)
- ✅ Debouncing/throttling ready
- ✅ Lazy rendering

---

### 4. **preflop-engine.js** - Game Logic

**Purpose:** Core pre-flop game logic (extensible for turn/river)

**Key Features:**
- Scenario generation
- Hand validation
- Action checking
- Range analysis
- Position statistics

**Usage:**
```javascript
const engine = new PreFlopEngine(gtoData);

// Generate scenario
const scenario = engine.generateScenario('BTN');
// Returns: { position, hand, correctAction, availableActions, ... }

// Validate action
const result = engine.validateAction('raise');
// Returns: { correct: true/false, explanation, ... }

// Check if marginal
const isMarginal = engine.isHandMarginal('77', 'UTG');

// Get stats
const stats = engine.getPositionStats('BTN');
// Returns: { raisePercentage, vpip, pfr, ... }
```

**Extension for Turn/River:**
```javascript
// Future: TurnEngine, RiverEngine
class TurnEngine extends GameEngine {
    generateScenario(preflopState) {
        // Add flop cards
        // Calculate pot odds
        // Get turn action
    }
}

class RiverEngine extends GameEngine {
    generateScenario(turnState) {
        // Add river card
        // Calculate final pot
        // Determine showdown
    }
}
```

---

### 5. **app.js** - Main Controller

**Purpose:** Orchestrates all modules and handles app flow

**Key Responsibilities:**
- Initialize modules
- Setup event listeners
- Route user actions
- Handle game flow
- Coordinate between modules

**Flow:**
```
User Action → UIController (emits event)
           → App (handles logic)
           → Engine (processes)
           → StateManager (updates state)
           → UIController (renders update)
```

**Example:**
```javascript
// User clicks "Raise" button
uiController.on('action:selected', (action) => {
    // App handles it
    app.handleAction(action);
});

handleAction(action) {
    // Engine validates
    const result = this.preflopEngine.validateAction(action);
    
    // State updates
    this.state.updateStreak(result.correct);
    
    // UI feedback
    this.ui.showFeedback(result.correct);
    
    // Next step
    if (result.correct) {
        this.newScenario();
    } else {
        this.handleGameOver(result);
    }
}
```

---

## 🔄 Data Flow

### Read Flow (Display)
```
Storage → StateManager → UIController → DOM
```

### Write Flow (User Action)
```
DOM Event → UIController → App → Engine → StateManager → Storage
                                                        ↓
                                                  UIController → DOM
```

### Example: User Plays a Hand

```
1. User clicks "Raise"
   └─> UIController catches event via delegation

2. UIController emits 'action:selected'
   └─> App.handleAction('raise')

3. App calls PreFlopEngine.validateAction('raise')
   └─> Engine checks GTO data
   └─> Returns { correct: true, explanation: "..." }

4. App calls StateManager.updateStreak(true)
   └─> State updates currentStreak: 6
   └─> Notifies subscribers

5. Subscriber updates UIController.updateStats()
   └─> DOM updates streak display

6. App calls UIController.showFeedback(true)
   └─> Green flash animation

7. App calls UserManager.updateUserStats()
   └─> Saves to localStorage

8. App generates next scenario
   └─> PreFlopEngine.generateScenario()
   └─> UIController.renderScenario()
```

---

## 🎯 Extending for Turn/River

### Current (Pre-Flop Only):
```javascript
app.js
└─> preflop-engine.js
    └─> gto-data.js (preflop ranges)
```

### Future (Multi-Street):
```javascript
app.js
├─> preflop-engine.js
├─> turn-engine.js      (NEW)
├─> river-engine.js     (NEW)
└─> game-orchestrator.js (NEW - coordinates multi-street flow)

gto-data.js
├─> preflop-ranges
├─> turn-ranges         (NEW)
└─> river-ranges        (NEW)
```

### Implementation Guide:

#### Step 1: Enable Turn Feature
```javascript
// config.js
FEATURES: {
    PREFLOP: true,
    TURN: true,  // <-- Enable
    RIVER: false
}
```

#### Step 2: Create Turn Engine
```javascript
// modules/turn-engine.js
class TurnEngine extends GameEngine {
    constructor(gtoData) {
        super(gtoData);
        this.board = [];
    }
    
    generateScenario(preflopState) {
        // Inherit from preflop state
        const { position, hand, pot } = preflopState;
        
        // Add flop (already exists) + turn
        this.board = [...preflopState.board, this.generateTurnCard()];
        
        // Calculate new pot odds
        const potOdds = this.calculatePotOdds(pot, hand, this.board);
        
        // Get correct action from turn GTO data
        const correctAction = this.getCorrectTurnAction(hand, position, this.board);
        
        return {
            stage: 'turn',
            position,
            hand,
            board: this.board,
            pot,
            potOdds,
            correctAction,
            availableActions: ['check', 'bet', 'fold']
        };
    }
    
    generateTurnCard() {
        // Logic to generate turn card (avoid duplicates)
    }
    
    getCorrectTurnAction(hand, position, board) {
        // Access turn GTO ranges
        const turnData = this.gtoData.turn[position];
        const handStrength = this.evaluateHandStrength(hand, board);
        return this.selectAction(handStrength, turnData);
    }
}
```

#### Step 3: Update App Flow
```javascript
// app.js
class GTOPokerApp {
    constructor() {
        this.preflopEngine = new PreFlopEngine(gtoData);
        this.turnEngine = new TurnEngine(gtoData);  // NEW
        this.currentStage = 'preflop';
    }
    
    handleAction(action) {
        const result = this.getCurrentEngine().validateAction(action);
        
        if (result.correct && this.currentStage === 'preflop') {
            // Move to turn
            this.advanceToTurn();
        } else if (result.correct && this.currentStage === 'turn') {
            // Move to river
            this.advanceToRiver();
        } else {
            // Game over
            this.handleGameOver(result);
        }
    }
    
    getCurrentEngine() {
        switch(this.currentStage) {
            case 'preflop': return this.preflopEngine;
            case 'turn': return this.turnEngine;
            case 'river': return this.riverEngine;
        }
    }
    
    advanceToTurn() {
        this.currentStage = 'turn';
        const preflopState = this.preflopEngine.getCurrentScenario();
        const turnScenario = this.turnEngine.generateScenario(preflopState);
        this.ui.renderScenario(turnScenario);
    }
}
```

#### Step 4: Update UI Controller
```javascript
// ui-controller.js
renderScenario(scenario) {
    if (scenario.stage === 'preflop') {
        this.renderPreflopScenario(scenario);
    } else if (scenario.stage === 'turn') {
        this.renderTurnScenario(scenario);  // NEW
    }
}

renderTurnScenario(scenario) {
    // Show board cards
    this.renderBoard(scenario.board);
    
    // Show pot size
    this.renderPot(scenario.pot);
    
    // Enable turn-specific actions
    this.enableActionButtons(['check', 'bet', 'fold']);
}
```

---

## 🚀 Performance Optimizations

### Implemented:
✅ **DOM Caching** - Elements cached on init, not queried repeatedly  
✅ **Event Delegation** - Single listener for multiple buttons  
✅ **CSS Animations** - GPU-accelerated transitions  
✅ **Lazy Loading** - AI insights loaded only when needed  
✅ **State History Limit** - Only keep last 50 state changes  

### To Implement:
🔜 **Virtual Scrolling** - For long insight lists  
🔜 **Web Workers** - Offload AI calculations  
🔜 **Service Worker** - Offline support  
🔜 **Image Sprites** - Combine card images  
🔜 **Code Splitting** - Load turn/river modules on demand  

---

## 🧪 Testing Strategy

### Unit Tests (To Add):
```javascript
// preflop-engine.test.js
describe('PreFlopEngine', () => {
    it('should generate valid scenarios', () => {
        const engine = new PreFlopEngine(mockData);
        const scenario = engine.generateScenario('BTN');
        expect(scenario.position).toBe('BTN');
        expect(scenario.hand).toBeDefined();
    });
    
    it('should validate actions correctly', () => {
        const engine = new PreFlopEngine(mockData);
        engine.generateScenario('UTG');
        const result = engine.validateAction('raise');
        expect(result.correct).toBeDefined();
    });
});
```

### Integration Tests:
```javascript
// app.test.js
describe('GTOPokerApp', () => {
    it('should handle complete game flow', async () => {
        const app = new GTOPokerApp();
        await app.init();
        
        app.startGame();
        expect(app.state.get('gameActive')).toBe(true);
        
        app.handleAction('raise');
        // Assert state changes, UI updates, etc.
    });
});
```

---

## 📊 State Management Patterns

### Pattern 1: One-Way Data Flow
```
Action → Engine → State → UI
```
Never update UI directly. Always go through state.

### Pattern 2: Subscribe to Changes
```javascript
stateManager.subscribe((newState, prevState) => {
    // React to specific changes
    if (newState.runsRemaining !== prevState.runsRemaining) {
        uiController.updateRuns(newState.runsRemaining);
    }
});
```

### Pattern 3: Immutable Updates
```javascript
// Bad ❌
state.currentStreak++;

// Good ✅
stateManager.setState({ 
    currentStreak: state.currentStreak + 1 
});
```

---

## 🔒 Error Handling

### Global Error Boundary
```javascript
window.addEventListener('error', (e) => {
    console.error('Global error:', e);
    uiController.showError('Something went wrong');
    stateManager.setError(e.message);
});
```

### Async Error Handling
```javascript
async handleAction(action) {
    try {
        const result = await this.engine.validateAction(action);
        // ... handle result
    } catch (error) {
        console.error('Action error:', error);
        this.ui.showError('Failed to process action');
        this.state.setError(error.message);
    }
}
```

---

## 📱 Mobile Optimization

### Current:
- Touch-optimized buttons (60px)
- Vertical layout
- No hover states
- PWA manifest

### To Add:
- Haptic feedback (`navigator.vibrate()`)
- Pull-to-refresh
- Swipe gestures
- Offline mode

---

## 🎯 Best Practices

1. **Separation of Concerns**
   - UI logic in UIController
   - Game logic in Engine
   - State in StateManager
   - Config in config.js

2. **Single Responsibility**
   - Each module has one job
   - Easy to test, debug, extend

3. **Event-Driven**
   - Loose coupling via events
   - Easy to add new features

4. **Configuration Over Hardcoding**
   - All magic numbers in config
   - Easy to tweak without code changes

5. **Progressive Enhancement**
   - Core game works without extras
   - AI, ads, auth are optional

---

## 📚 Migration Guide (Old → New)

### Before (Monolithic):
```javascript
// game.js (1000+ lines)
class GTOPokerGame {
    // Everything in one class
    constructor() {
        this.initializeElements();
        this.attachEventListeners();
        this.checkAuthState();
        this.startGame();
        // ...
    }
}
```

### After (Modular):
```javascript
// app.js (300 lines)
class GTOPokerApp {
    constructor() {
        this.state = stateManager;
        this.ui = uiController;
        this.engine = new PreFlopEngine(gtoData);
        this.init();
    }
}

// Each module is self-contained
// Easy to understand, test, extend
```

---

## 🔮 Future Roadmap

### Phase 1: Current (Pre-Flop Only) ✅
- Core game loop
- AI insights
- User tracking
- Mobile optimization

### Phase 2: Turn (Next)
- Turn engine
- Board evaluation
- Pot odds calculation
- Turn GTO ranges

### Phase 3: River
- River engine
- Hand evaluation
- Showdown logic
- River GTO ranges

### Phase 4: Multi-Street
- Complete hand flow (preflop → turn → river)
- Hand history
- Replay feature
- Advanced AI analysis

### Phase 5: Advanced Features
- Tournament mode (ICM)
- Multi-way pots
- Live opponents (multiplayer)
- Solver integration

---

## 💡 Key Takeaways

1. **Modular = Maintainable**
   - Small, focused modules
   - Easy to understand and test

2. **State Management = Predictability**
   - Single source of truth
   - Clear data flow

3. **Separation = Scalability**
   - Add turn/river without rewriting
   - Reuse modules (TurnEngine extends GameEngine)

4. **Events = Flexibility**
   - Loose coupling
   - Easy to add features

5. **Config = Agility**
   - Feature flags
   - Easy environment changes

---

## 🆘 Debugging

### Check State:
```javascript
console.log(window.gtoApp.getState());
```

### Check State History:
```javascript
console.log(window.gtoApp.state.getHistory());
```

### Check Current Scenario:
```javascript
console.log(window.gtoApp.preflopEngine.getCurrentScenario());
```

### Check App Info:
```javascript
console.log(window.gtoApp.getInfo());
```

---

## 📖 Summary

The refactored architecture provides:

✅ **Cleaner Code** - Separated concerns, easier to read  
✅ **Better Performance** - Optimized DOM operations  
✅ **Easier Testing** - Modular, mockable  
✅ **Scalability** - Ready for turn/river  
✅ **Maintainability** - Clear structure, documented  
✅ **Flexibility** - Event-driven, configurable  

**The app is now production-ready for pre-flop training and architected for easy expansion to multi-street poker.** 🚀
