/**
 * GTO Poker Trainer - Main Application
 * Version 2.0 - Modular Architecture
 * Focus: Pre-Flop Training (Extensible for Turn/River)
 */

class GTOPokerApp {
    constructor() {
        // Core modules
        this.state = stateManager;
        this.ui = uiController;
        this.preflopEngine = null;
        this.userManager = null;
        this.insightsAI = null;
        
        // Initialize
        this.init();
    }
    
    /**
     * Initialize application
     */
    async init() {
        try {
            console.log(`${APP_CONFIG.APP_NAME} v${APP_CONFIG.VERSION} initializing...`);
            
            // Load GTO data
            const gtoData = await this.loadGTOData();
            
            // Initialize modules
            this.preflopEngine = new PreFlopEngine(gtoData);
            this.userManager = new UserManager();
            this.insightsAI = new PokerInsightsAI();
            
            // Initialize UI
            this.ui.initialize();
            
            // Setup state listeners
            this.setupStateListeners();
            
            // Setup UI event listeners
            this.setupEventListeners();
            
            // Initialize state from storage
            this.state.initializeFromStorage();
            
            // Check authentication
            await this.checkAuth();
            
            console.log('App initialized successfully');
        } catch (error) {
            console.error('Initialization error:', error);
            this.ui.showError('Failed to initialize app');
        }
    }
    
    /**
     * Load GTO data
     */
    async loadGTOData() {
        // In production, this could load from API
        // For now, return from global GTO_DATA
        return new Promise((resolve) => {
            setTimeout(() => resolve(window.GTO_DATA), 0);
        });
    }
    
    /**
     * Setup state change listeners
     */
    setupStateListeners() {
        this.state.subscribe((newState, prevState) => {
            // Update UI when state changes
            if (newState.currentScreen !== prevState.currentScreen) {
                this.ui.showScreen(newState.currentScreen);
            }
            
            // Update stats display
            if (newState.currentStreak !== prevState.currentStreak ||
                newState.bestStreak !== prevState.bestStreak ||
                newState.runsRemaining !== prevState.runsRemaining) {
                this.ui.updateStats(newState);
            }
            
            // Handle out of runs
            if (newState.runsRemaining === 0 && prevState.runsRemaining > 0) {
                this.handleOutOfRuns();
            }
            
            // Handle loading state
            if (newState.loading !== prevState.loading) {
                if (newState.loading) {
                    this.ui.showLoading(newState.loadingMessage);
                } else {
                    this.ui.hideLoading();
                }
            }
            
            // Handle errors
            if (newState.error && newState.error !== prevState.error) {
                this.ui.showError(newState.error);
            }
        });
    }
    
    /**
     * Setup event listeners
     */
    setupEventListeners() {
        // Login buttons
        const googleBtn = document.getElementById('googleSignInBtn');
        if (googleBtn) {
            googleBtn.addEventListener('click', () => this.handleGoogleSignIn());
        }
        
        const guestBtn = document.getElementById('guestPlayBtn');
        if (guestBtn) {
            guestBtn.addEventListener('click', () => this.handleGuestPlay());
        }
        
        // Logout
        const logoutBtn = document.getElementById('logoutBtn');
        if (logoutBtn) {
            logoutBtn.addEventListener('click', () => this.handleLogout());
        }
        
        // Start game
        const startBtn = document.getElementById('startGameBtn');
        if (startBtn) {
            startBtn.addEventListener('click', () => this.showModeSelection());
        }
        
        // Continue to game
        const continueBtn = document.getElementById('continueToGameBtn');
        if (continueBtn) {
            continueBtn.addEventListener('click', () => this.startGame());
        }
        
        // Mode selection
        const randomBtn = document.getElementById('randomModeBtn');
        if (randomBtn) {
            randomBtn.addEventListener('click', () => this.selectMode('random'));
        }
        
        // Position selection via UI controller delegation
        this.ui.on('position:selected', (position) => this.selectPosition(position));
        
        // Action selection via UI controller delegation
        this.ui.on('action:selected', (action) => this.handleAction(action));
        
        // Play again
        const playAgainBtn = document.getElementById('playAgainBtn');
        if (playAgainBtn) {
            playAgainBtn.addEventListener('click', () => this.playAgain());
        }
        
        // Back to menu buttons
        document.querySelectorAll('[id^="backToMenu"]').forEach(btn => {
            btn.addEventListener('click', () => this.backToMenu());
        });
        
        // Profile button
        const profileBtn = document.getElementById('viewProfileBtn');
        if (profileBtn) {
            profileBtn.addEventListener('click', () => this.showProfile());
        }
        
        // Insights button
        const insightsBtn = document.getElementById('viewInsightsBtn');
        if (insightsBtn) {
            insightsBtn.addEventListener('click', () => this.showInsights());
        }
        
        // Close insights
        const closeInsightsBtn = document.getElementById('closeInsightsBtn');
        if (closeInsightsBtn) {
            closeInsightsBtn.addEventListener('click', () => this.closeInsights());
        }
        
        // Practice position from insights
        document.addEventListener('click', (e) => {
            if (e.target.classList.contains('practice-position-btn')) {
                const position = e.target.dataset.position;
                this.practicePosition(position);
            }
        });
        
        // Position info modals
        document.querySelectorAll('.info-btn').forEach(btn => {
            btn.addEventListener('click', (e) => {
                const position = e.target.closest('.position-card').dataset.position;
                this.showPositionInfo(position);
            });
        });
    }
    
    /**
     * Check authentication state
     */
    async checkAuth() {
        const user = this.userManager.getCurrentUser();
        if (user) {
            this.state.setUser(user);
            this.state.navigateTo('welcome');
        } else {
            this.state.navigateTo('login');
        }
    }
    
    /**
     * Handle Google sign in
     */
    async handleGoogleSignIn() {
        this.state.setLoading(true, 'Signing in...');
        
        try {
            const user = await this.userManager.signInWithGoogle();
            this.state.setUser(user);
            this.state.navigateTo('welcome');
            this.ui.showSuccess('Signed in successfully!');
        } catch (error) {
            console.error('Sign in error:', error);
            this.ui.showError('Failed to sign in. Please try again.');
        } finally {
            this.state.setLoading(false);
        }
    }
    
    /**
     * Handle guest play
     */
    handleGuestPlay() {
        const guestUser = this.userManager.createGuestUser();
        this.state.setUser(guestUser);
        this.state.navigateTo('welcome');
    }
    
    /**
     * Handle logout
     */
    handleLogout() {
        this.userManager.signOut();
        this.state.setUser(null);
        this.state.reset();
        this.state.navigateTo('login');
        this.ui.showSuccess('Signed out successfully');
    }
    
    /**
     * Show mode selection screen
     */
    showModeSelection() {
        this.state.navigateTo('positionSelection');
    }
    
    /**
     * Select game mode
     */
    selectMode(mode) {
        this.state.setState({ selectedMode: mode, selectedPosition: null });
        
        // Highlight selected mode
        document.querySelectorAll('.mode-card').forEach(card => {
            card.classList.toggle('selected', card.dataset.mode === mode);
        });
        
        // Show/hide position grid
        const positionGrid = document.getElementById('positionGrid');
        if (positionGrid) {
            positionGrid.style.display = mode === 'specific' ? 'grid' : 'none';
        }
        
        if (mode === 'random') {
            // Can start immediately
            this.ui.showSuccess('Random mode selected. Click Continue!');
        }
    }
    
    /**
     * Select specific position
     */
    selectPosition(position) {
        this.state.setState({ selectedPosition: position });
        
        // Highlight selected position
        document.querySelectorAll('.position-card').forEach(card => {
            card.classList.toggle('selected', card.dataset.position === position);
        });
        
        this.ui.showSuccess(`${position} selected!`);
    }
    
    /**
     * Start game
     */
    startGame() {
        const { selectedMode, selectedPosition, runsRemaining } = this.state.getState();
        
        // Validation
        if (runsRemaining <= 0) {
            this.state.navigateTo('outOfRuns');
            return;
        }
        
        if (selectedMode === 'specific' && !selectedPosition) {
            this.ui.showError('Please select a position');
            return;
        }
        
        // Use a run
        this.state.useRun();
        
        // Start game
        this.state.startGame(selectedMode, selectedPosition);
        
        // Generate first scenario
        this.newScenario();
    }
    
    /**
     * Generate new scenario
     */
    newScenario() {
        try {
            const { selectedMode, selectedPosition } = this.state.getState();
            const position = selectedMode === 'specific' ? selectedPosition : null;
            
            const scenario = this.preflopEngine.generateScenario(position);
            this.state.setState({ currentScenario: scenario });
            
            // Render in UI
            this.ui.renderScenario(scenario);
            
        } catch (error) {
            console.error('Error generating scenario:', error);
            this.ui.showError('Failed to generate scenario');
        }
    }
    
    /**
     * Handle player action
     */
    async handleAction(action) {
        this.ui.disableActionButtons();
        
        try {
            // Validate action
            const result = this.preflopEngine.validateAction(action);
            
            // Show visual feedback
            this.ui.showFeedback(result.correct);
            
            // Update streak
            this.state.updateStreak(result.correct);
            
            // Track for insights
            await this.trackDecision(result);
            
            // Wait a moment for feedback
            await this.delay(500);
            
            if (result.correct) {
                // Continue to next hand
                this.newScenario();
            } else {
                // Game over
                this.handleGameOver(result);
            }
            
        } catch (error) {
            console.error('Action handling error:', error);
            this.ui.showError('An error occurred');
            this.ui.enableActionButtons(this.state.get('currentScenario').availableActions);
        }
    }
    
    /**
     * Track decision for AI insights
     */
    async trackDecision(result) {
        const { currentScenario } = this.state.getState();
        
        if (!result.correct) {
            const mistakeData = {
                hand: result.hand,
                playerAction: result.playerAction,
                correctAction: result.correctAction,
                isMarginal: this.preflopEngine.isHandMarginal(result.hand, result.position),
                timestamp: Date.now()
            };
            
            this.userManager.updateUserStats(
                result.position,
                false,
                mistakeData
            );
        } else {
            this.userManager.updateUserStats(
                result.position,
                true
            );
        }
    }
    
    /**
     * Handle game over
     */
    handleGameOver(result) {
        const streak = this.state.get('currentStreak');
        
        this.ui.renderGameOver({
            ...result,
            streak
        });
        
        this.state.endGame(result);
    }
    
    /**
     * Handle out of runs
     */
    handleOutOfRuns() {
        this.ui.showError('Out of runs for today!');
        setTimeout(() => {
            this.state.navigateTo('outOfRuns');
        }, 1000);
    }
    
    /**
     * Play again
     */
    playAgain() {
        if (this.state.get('runsRemaining') > 0) {
            this.startGame();
        } else {
            this.handleOutOfRuns();
        }
    }
    
    /**
     * Back to menu
     */
    backToMenu() {
        this.state.reset();
        this.state.navigateTo('welcome');
    }
    
    /**
     * Show profile
     */
    showProfile() {
        const user = this.userManager.getCurrentUser();
        if (!user) {
            this.ui.showError('Please sign in first');
            return;
        }
        
        const userData = {
            ...user,
            stats: this.userManager.getUserStats()
        };
        
        this.ui.renderProfile(userData);
        this.state.navigateTo('profile');
    }
    
    /**
     * Show AI insights
     */
    showInsights() {
        const userStats = this.userManager.getUserStats();
        const insights = this.insightsAI.generateInsights(userStats);
        
        // Render insights
        this.renderInsightsUI(insights);
        this.state.navigateTo('insights');
    }
    
    /**
     * Render insights UI
     */
    renderInsightsUI(insights) {
        const container = document.getElementById('insightsContainer');
        if (!container) return;
        
        // This would call the existing renderInsights method
        // Keeping compatibility with existing AI insights code
        if (typeof window.renderInsights === 'function') {
            window.renderInsights(insights);
        } else {
            container.innerHTML = `<p>Insights: ${JSON.stringify(insights, null, 2)}</p>`;
        }
    }
    
    /**
     * Close insights
     */
    closeInsights() {
        this.state.navigateTo('profile');
    }
    
    /**
     * Practice specific position
     */
    practicePosition(position) {
        this.state.setState({
            selectedMode: 'specific',
            selectedPosition: position
        });
        
        if (this.state.get('runsRemaining') > 0) {
            this.startGame();
        } else {
            this.handleOutOfRuns();
        }
    }
    
    /**
     * Show position info modal
     */
    showPositionInfo(position) {
        const info = this.preflopEngine.getPositionInfo(position);
        const stats = this.preflopEngine.getPositionStats(position);
        
        // Create modal
        const modal = document.createElement('div');
        modal.className = 'modal-overlay';
        modal.innerHTML = `
            <div class="modal-content">
                <h2>${position}</h2>
                <p>${info.description}</p>
                <div class="position-stats">
                    <p><strong>Opening Range:</strong> ${stats.vpip} hands</p>
                    <p><strong>Raising:</strong> ${stats.raisePercentage}%</p>
                    <p><strong>Strategy:</strong> ${info.strategy}</p>
                </div>
                <button class="btn close-modal">Close</button>
            </div>
        `;
        
        document.body.appendChild(modal);
        
        // Close on button click or overlay click
        modal.addEventListener('click', (e) => {
            if (e.target.classList.contains('close-modal') || e.target === modal) {
                modal.remove();
            }
        });
    }
    
    /**
     * Utility: Delay/sleep
     */
    delay(ms) {
        return new Promise(resolve => setTimeout(resolve, ms));
    }
    
    /**
     * Get app state (for debugging)
     */
    getState() {
        return this.state.getState();
    }
    
    /**
     * Get app info
     */
    getInfo() {
        return {
            name: APP_CONFIG.APP_NAME,
            version: APP_CONFIG.VERSION,
            stage: APP_CONFIG.STAGE,
            features: APP_CONFIG.FEATURES
        };
    }
}

// Initialize app when DOM is ready
document.addEventListener('DOMContentLoaded', () => {
    window.gtoApp = new GTOPokerApp();
    console.log('GTO Poker Trainer ready!', window.gtoApp.getInfo());
});

// Export for testing
if (typeof module !== 'undefined' && module.exports) {
    module.exports = GTOPokerApp;
}
