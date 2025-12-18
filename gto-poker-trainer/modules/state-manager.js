/**
 * State Manager Module
 * Centralized state management with reactive updates
 * Handles all app state transitions
 */

class StateManager {
    constructor() {
        this.state = {
            // User state
            user: null,
            isAuthenticated: false,
            
            // Game state
            currentScreen: 'login',
            gameActive: false,
            currentScenario: null,
            selectedMode: 'random',
            selectedPosition: null,
            
            // Stats
            currentStreak: 0,
            bestStreak: this.loadBestStreak(),
            runsRemaining: APP_CONFIG.GAME.INITIAL_RUNS,
            
            // Session
            handsPlayed: 0,
            sessionStartTime: Date.now(),
            
            // UI
            loading: false,
            error: null
        };
        
        this.listeners = [];
        this.history = [];
    }
    
    /**
     * Subscribe to state changes
     * @param {Function} callback - Called when state changes
     * @returns {Function} Unsubscribe function
     */
    subscribe(callback) {
        this.listeners.push(callback);
        return () => {
            this.listeners = this.listeners.filter(cb => cb !== callback);
        };
    }
    
    /**
     * Update state and notify listeners
     * @param {Object} updates - Partial state updates
     */
    setState(updates) {
        const prevState = { ...this.state };
        this.state = { ...this.state, ...updates };
        
        // Save to history (for debugging/undo)
        this.history.push({
            timestamp: Date.now(),
            prevState,
            updates,
            newState: { ...this.state }
        });
        
        // Keep history manageable
        if (this.history.length > 50) {
            this.history.shift();
        }
        
        // Notify all listeners
        this.listeners.forEach(callback => {
            try {
                callback(this.state, prevState);
            } catch (error) {
                console.error('State listener error:', error);
            }
        });
    }
    
    /**
     * Get current state (immutable)
     */
    getState() {
        return { ...this.state };
    }
    
    /**
     * Get specific state value
     */
    get(key) {
        return this.state[key];
    }
    
    /**
     * Navigate to a screen
     */
    navigateTo(screen) {
        this.setState({ currentScreen: screen });
    }
    
    /**
     * Set user and authentication status
     */
    setUser(user) {
        this.setState({
            user,
            isAuthenticated: !!user
        });
    }
    
    /**
     * Start a new game
     */
    startGame(mode, position = null) {
        this.setState({
            gameActive: true,
            selectedMode: mode,
            selectedPosition: position,
            currentScreen: 'game'
        });
    }
    
    /**
     * End current game
     */
    endGame(result) {
        this.setState({
            gameActive: false,
            currentScenario: null,
            currentScreen: 'gameOver'
        });
    }
    
    /**
     * Update streak
     */
    updateStreak(correct) {
        if (correct) {
            const newStreak = this.state.currentStreak + 1;
            const updates = { currentStreak: newStreak };
            
            if (newStreak > this.state.bestStreak) {
                updates.bestStreak = newStreak;
                this.saveBestStreak(newStreak);
            }
            
            this.setState(updates);
        } else {
            this.setState({ currentStreak: 0 });
        }
    }
    
    /**
     * Decrement runs
     */
    useRun() {
        const remaining = Math.max(0, this.state.runsRemaining - 1);
        this.setState({ runsRemaining: remaining });
        this.saveDailyRuns(remaining);
    }
    
    /**
     * Add runs (from ad bonus)
     */
    addRuns(count) {
        const remaining = this.state.runsRemaining + count;
        this.setState({ runsRemaining: remaining });
        this.saveDailyRuns(remaining);
    }
    
    /**
     * Reset daily runs
     */
    resetDailyRuns() {
        this.setState({ runsRemaining: APP_CONFIG.GAME.INITIAL_RUNS });
        this.saveDailyRuns(APP_CONFIG.GAME.INITIAL_RUNS);
    }
    
    /**
     * Set loading state
     */
    setLoading(loading, message = null) {
        this.setState({ loading, loadingMessage: message });
    }
    
    /**
     * Set error state
     */
    setError(error) {
        this.setState({ error });
    }
    
    /**
     * Clear error
     */
    clearError() {
        this.setState({ error: null });
    }
    
    /**
     * Get state history (for debugging)
     */
    getHistory() {
        return [...this.history];
    }
    
    /**
     * Clear history
     */
    clearHistory() {
        this.history = [];
    }
    
    // ===== Persistence Methods =====
    
    loadBestStreak() {
        try {
            return parseInt(localStorage.getItem(APP_CONFIG.STORAGE.BEST_STREAK)) || 0;
        } catch (error) {
            console.error('Error loading best streak:', error);
            return 0;
        }
    }
    
    saveBestStreak(streak) {
        try {
            localStorage.setItem(APP_CONFIG.STORAGE.BEST_STREAK, streak.toString());
        } catch (error) {
            console.error('Error saving best streak:', error);
        }
    }
    
    saveDailyRuns(runs) {
        try {
            const data = {
                runs,
                date: new Date().toDateString()
            };
            localStorage.setItem(APP_CONFIG.STORAGE.DAILY_RUNS, JSON.stringify(data));
        } catch (error) {
            console.error('Error saving daily runs:', error);
        }
    }
    
    loadDailyRuns() {
        try {
            const data = JSON.parse(localStorage.getItem(APP_CONFIG.STORAGE.DAILY_RUNS));
            if (!data) return APP_CONFIG.GAME.INITIAL_RUNS;
            
            const today = new Date().toDateString();
            if (data.date !== today) {
                // New day, reset runs
                this.resetDailyRuns();
                return APP_CONFIG.GAME.INITIAL_RUNS;
            }
            
            return data.runs || 0;
        } catch (error) {
            console.error('Error loading daily runs:', error);
            return APP_CONFIG.GAME.INITIAL_RUNS;
        }
    }
    
    /**
     * Initialize state from storage
     */
    initializeFromStorage() {
        const runsRemaining = this.loadDailyRuns();
        this.setState({ runsRemaining });
    }
    
    /**
     * Reset all state
     */
    reset() {
        this.setState({
            gameActive: false,
            currentScenario: null,
            selectedMode: 'random',
            selectedPosition: null,
            currentStreak: 0,
            handsPlayed: 0,
            error: null
        });
    }
}

// Create singleton instance
const stateManager = new StateManager();

// Export
if (typeof module !== 'undefined' && module.exports) {
    module.exports = { StateManager, stateManager };
}
