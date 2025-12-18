/**
 * UI Controller Module
 * Manages all DOM interactions and screen transitions
 * Keeps UI logic separate from game logic
 */

class UIController {
    constructor() {
        this.elements = {};
        this.screens = {};
        this.initialized = false;
    }
    
    /**
     * Initialize all DOM elements
     */
    initialize() {
        if (this.initialized) return;
        
        // Cache all important DOM elements
        this.cacheElements();
        
        // Setup event delegation
        this.setupEventDelegation();
        
        this.initialized = true;
    }
    
    /**
     * Cache DOM elements for performance
     */
    cacheElements() {
        // Screens
        this.screens = {
            login: document.getElementById('loginScreen'),
            welcome: document.getElementById('welcomeScreen'),
            positionSelection: document.getElementById('positionSelectionScreen'),
            game: document.getElementById('pokerTable'),
            gameOver: document.getElementById('gameOverScreen'),
            outOfRuns: document.getElementById('outOfRunsScreen'),
            profile: document.getElementById('profileScreen'),
            insights: document.getElementById('insightsScreen')
        };
        
        // Stats
        this.elements.stats = {
            currentStreak: document.getElementById('currentStreak'),
            bestStreak: document.getElementById('bestStreak'),
            runsRemaining: document.getElementById('runsRemaining')
        };
        
        // Game elements
        this.elements.game = {
            positionName: document.getElementById('positionName'),
            card1: document.getElementById('card1'),
            card2: document.getElementById('card2'),
            potSize: document.getElementById('potSize'),
            actionDescription: document.getElementById('actionDescription'),
            actionButtons: document.getElementById('actionButtons')
        };
        
        // Game over elements
        this.elements.gameOver = {
            title: document.getElementById('gameOverTitle'),
            finalStreak: document.getElementById('finalStreak'),
            mistakePosition: document.getElementById('mistakePosition'),
            mistakeHand: document.getElementById('mistakeHand'),
            mistakeAction: document.getElementById('mistakeAction'),
            correctAction: document.getElementById('correctAction'),
            explanation: document.getElementById('explanation')
        };
        
        // Profile elements
        this.elements.profile = {
            avatar: document.getElementById('userAvatar'),
            name: document.getElementById('userName'),
            email: document.getElementById('userEmail'),
            loginStreak: document.getElementById('loginStreakCount'),
            totalHands: document.getElementById('totalHandsPlayed'),
            totalAccuracy: document.getElementById('totalAccuracy'),
            favoritePosition: document.getElementById('favoritePosition')
        };
    }
    
    /**
     * Setup event delegation for better performance
     */
    setupEventDelegation() {
        // Delegate action button clicks
        const actionContainer = document.getElementById('actionButtons');
        if (actionContainer) {
            actionContainer.addEventListener('click', (e) => {
                const btn = e.target.closest('.action-btn');
                if (btn && !btn.disabled) {
                    const action = btn.dataset.action;
                    this.emit('action:selected', action);
                }
            });
        }
        
        // Delegate position card clicks
        const positionGrid = document.getElementById('positionGrid');
        if (positionGrid) {
            positionGrid.addEventListener('click', (e) => {
                const card = e.target.closest('.position-card');
                if (card) {
                    const position = card.dataset.position;
                    this.emit('position:selected', position);
                }
            });
        }
    }
    
    /**
     * Show a specific screen, hide others
     */
    showScreen(screenName) {
        Object.values(this.screens).forEach(screen => {
            if (screen) screen.classList.remove('active');
        });
        
        const screen = this.screens[screenName];
        if (screen) {
            screen.classList.add('active');
            this.emit('screen:changed', screenName);
        }
    }
    
    /**
     * Update stats display
     */
    updateStats(stats) {
        if (this.elements.stats.currentStreak) {
            this.elements.stats.currentStreak.textContent = stats.currentStreak || 0;
        }
        if (this.elements.stats.bestStreak) {
            this.elements.stats.bestStreak.textContent = stats.bestStreak || 0;
        }
        if (this.elements.stats.runsRemaining) {
            this.elements.stats.runsRemaining.textContent = stats.runsRemaining || 0;
        }
    }
    
    /**
     * Render game scenario
     */
    renderScenario(scenario) {
        // Position
        if (this.elements.game.positionName) {
            this.elements.game.positionName.textContent = scenario.position;
        }
        
        // Cards with animation
        this.renderCard(this.elements.game.card1, scenario.hand.card1);
        this.renderCard(this.elements.game.card2, scenario.hand.card2);
        
        // Action description
        if (this.elements.game.actionDescription) {
            this.elements.game.actionDescription.textContent = scenario.scenario.description || 
                `You are in ${scenario.position}. What should you do?`;
        }
        
        // Enable action buttons
        this.enableActionButtons(scenario.availableActions);
    }
    
    /**
     * Render a single card
     */
    renderCard(element, card) {
        if (!element) return;
        
        element.classList.add('flipping');
        
        setTimeout(() => {
            element.innerHTML = `
                <div class="card-rank">${card.rank}</div>
                <div class="card-suit ${this.getCardColor(card.suit)}">${card.suit}</div>
            `;
            element.classList.remove('flipping');
        }, APP_CONFIG.UI.CARD_FLIP_SPEED);
    }
    
    /**
     * Get card color class
     */
    getCardColor(suit) {
        return (suit === '♥' || suit === '♦') ? 'red' : 'black';
    }
    
    /**
     * Enable/disable action buttons
     */
    enableActionButtons(availableActions) {
        const buttons = document.querySelectorAll('.action-btn');
        buttons.forEach(btn => {
            const action = btn.dataset.action;
            btn.disabled = !availableActions.includes(action);
            btn.classList.toggle('disabled', !availableActions.includes(action));
        });
    }
    
    /**
     * Disable all action buttons
     */
    disableActionButtons() {
        const buttons = document.querySelectorAll('.action-btn');
        buttons.forEach(btn => {
            btn.disabled = true;
        });
    }
    
    /**
     * Show feedback animation (correct/incorrect)
     */
    showFeedback(correct) {
        const container = document.getElementById('gameContainer');
        if (!container) return;
        
        const feedbackClass = correct ? 'feedback-correct' : 'feedback-incorrect';
        container.classList.add(feedbackClass);
        
        setTimeout(() => {
            container.classList.remove(feedbackClass);
        }, APP_CONFIG.UI.ANIMATION_SPEED);
    }
    
    /**
     * Render game over screen
     */
    renderGameOver(result) {
        const el = this.elements.gameOver;
        
        if (el.title) {
            el.title.textContent = result.correct ? '✅ Correct!' : '❌ Incorrect';
        }
        
        if (el.finalStreak) {
            el.finalStreak.textContent = result.streak || 0;
        }
        
        if (el.mistakePosition) {
            el.mistakePosition.textContent = result.position;
        }
        
        if (el.mistakeHand) {
            el.mistakeHand.textContent = result.hand;
        }
        
        if (el.mistakeAction) {
            el.mistakeAction.textContent = result.playerAction;
        }
        
        if (el.correctAction) {
            el.correctAction.textContent = result.correctAction;
        }
        
        if (el.explanation) {
            el.explanation.textContent = result.explanation;
        }
    }
    
    /**
     * Render profile screen
     */
    renderProfile(userData) {
        const el = this.elements.profile;
        
        if (el.avatar) {
            el.avatar.src = userData.photoURL || 'default-avatar.png';
        }
        
        if (el.name) {
            el.name.textContent = userData.displayName || 'Guest Player';
        }
        
        if (el.email) {
            el.email.textContent = userData.email || '';
        }
        
        if (el.loginStreak) {
            el.loginStreak.textContent = userData.loginStreak || 0;
        }
        
        const stats = this.calculateProfileStats(userData.stats);
        
        if (el.totalHands) {
            el.totalHands.textContent = stats.totalHands;
        }
        
        if (el.totalAccuracy) {
            el.totalAccuracy.textContent = `${stats.accuracy}%`;
        }
        
        if (el.favoritePosition) {
            el.favoritePosition.textContent = stats.favoritePosition;
        }
    }
    
    /**
     * Calculate profile statistics
     */
    calculateProfileStats(stats) {
        if (!stats || !stats.byPosition) {
            return {
                totalHands: 0,
                accuracy: 0,
                favoritePosition: 'N/A'
            };
        }
        
        let totalHands = 0;
        let totalCorrect = 0;
        let favoritePos = 'N/A';
        let maxHands = 0;
        
        Object.entries(stats.byPosition).forEach(([pos, data]) => {
            totalHands += data.total || 0;
            totalCorrect += data.correct || 0;
            
            if (data.total > maxHands) {
                maxHands = data.total;
                favoritePos = pos;
            }
        });
        
        const accuracy = totalHands > 0 ? ((totalCorrect / totalHands) * 100).toFixed(1) : 0;
        
        return { totalHands, accuracy, favoritePosition: favoritePos };
    }
    
    /**
     * Show loading spinner
     */
    showLoading(message = 'Loading...') {
        // Create or show loading overlay
        let loader = document.getElementById('loadingOverlay');
        if (!loader) {
            loader = document.createElement('div');
            loader.id = 'loadingOverlay';
            loader.innerHTML = `
                <div class="loader-content">
                    <div class="spinner"></div>
                    <p class="loader-message">${message}</p>
                </div>
            `;
            document.body.appendChild(loader);
        }
        loader.classList.add('active');
    }
    
    /**
     * Hide loading spinner
     */
    hideLoading() {
        const loader = document.getElementById('loadingOverlay');
        if (loader) {
            loader.classList.remove('active');
        }
    }
    
    /**
     * Show toast notification
     */
    showToast(message, type = 'info') {
        const toast = document.createElement('div');
        toast.className = `toast toast-${type}`;
        toast.textContent = message;
        
        document.body.appendChild(toast);
        
        // Trigger animation
        setTimeout(() => toast.classList.add('show'), 10);
        
        // Remove after duration
        setTimeout(() => {
            toast.classList.remove('show');
            setTimeout(() => toast.remove(), 300);
        }, APP_CONFIG.UI.TOAST_DURATION);
    }
    
    /**
     * Show error message
     */
    showError(message) {
        this.showToast(message, 'error');
    }
    
    /**
     * Show success message
     */
    showSuccess(message) {
        this.showToast(message, 'success');
    }
    
    /**
     * Simple event emitter
     */
    on(event, callback) {
        if (!this.events) this.events = {};
        if (!this.events[event]) this.events[event] = [];
        this.events[event].push(callback);
    }
    
    emit(event, data) {
        if (!this.events || !this.events[event]) return;
        this.events[event].forEach(callback => callback(data));
    }
    
    /**
     * Add CSS animation class temporarily
     */
    animateElement(element, animationClass, duration = 300) {
        if (!element) return;
        
        element.classList.add(animationClass);
        setTimeout(() => {
            element.classList.remove(animationClass);
        }, duration);
    }
    
    /**
     * Smooth scroll to element
     */
    scrollTo(element) {
        if (!element) return;
        element.scrollIntoView({ behavior: 'smooth', block: 'start' });
    }
}

// Create singleton
const uiController = new UIController();

// Export
if (typeof module !== 'undefined' && module.exports) {
    module.exports = { UIController, uiController };
}
