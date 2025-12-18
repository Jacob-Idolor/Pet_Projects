// ===================================================================
// PURE GTO POKER TRAINER
// Core Focus: Completely random hands + Pure GTO strategy
// No exploits, no adjustments - learn optimal Game Theory play
// ===================================================================

class GTOPokerGame {
    constructor() {
        this.currentStreak = 0;
        this.bestStreak = this.loadBestStreak();
        this.runsRemaining = 10;
        this.currentScenario = null;
        this.gameActive = false;
        
        // User tracking for insights
        this.userManager = new UserManager();
        this.adManager = new AdManager();
        this.insightsAI = new PokerInsightsAI();
        
        this.initializeElements();
        this.initializeDailyRuns();
        this.attachEventListeners();
        this.checkAuthState();
        this.updateDisplay();
    }

    initializeElements() {
        // Screens
        this.loginScreen = document.getElementById('loginScreen');
        this.profileScreen = document.getElementById('profileScreen');
        this.insightsScreen = document.getElementById('insightsScreen');
        this.positionSelectionScreen = document.getElementById('positionSelectionScreen');
        this.welcomeScreen = document.getElementById('welcomeScreen');
        this.pokerTable = document.getElementById('pokerTable');
        this.gameOverScreen = document.getElementById('gameOverScreen');
        this.outOfRunsScreen = document.getElementById('outOfRunsScreen');

        // Stats
        this.currentStreakEl = document.getElementById('currentStreak');
        this.bestStreakEl = document.getElementById('bestStreak');
        this.runsRemainingEl = document.getElementById('runsRemaining');

        // Game elements
        this.positionNameEl = document.getElementById('positionName');
        this.card1El = document.getElementById('card1');
        this.card2El = document.getElementById('card2');
        this.potSizeEl = document.getElementById('potSize');
        this.actionDescriptionEl = document.getElementById('actionDescription');

        // Auth buttons
        this.googleSignInBtn = document.getElementById('googleSignInBtn');
        this.appleSignInBtn = document.getElementById('appleSignInBtn');
        this.guestPlayBtn = document.getElementById('guestPlayBtn');
        this.logoutBtn = document.getElementById('logoutBtn');
        this.viewProfileBtn = document.getElementById('viewProfileBtn');
        this.viewInsightsBtn = document.getElementById('viewInsightsBtn');
        this.closeInsightsBtn = document.getElementById('closeInsightsBtn');
        this.continueToGameBtn = document.getElementById('continueToGameBtn');

        // Profile elements
        this.userAvatarEl = document.getElementById('userAvatar');
        this.userNameEl = document.getElementById('userName');
        this.userEmailEl = document.getElementById('userEmail');
        this.loginStreakCountEl = document.getElementById('loginStreakCount');
        this.streakProgressBarEl = document.getElementById('streakProgressBar');
        this.totalHandsPlayedEl = document.getElementById('totalHandsPlayed');
        this.totalAccuracyEl = document.getElementById('totalAccuracy');
        this.favoritePositionEl = document.getElementById('favoritePosition');
        
        // Insights elements
        this.insightsContainer = document.getElementById('insightsContainer');

        // Position selection
        this.randomModeBtn = document.getElementById('randomModeBtn');
        this.positionGrid = document.getElementById('positionGrid');
        this.positionCards = document.querySelectorAll('.position-card');
        this.modeCards = document.querySelectorAll('.mode-card');
        this.backToWelcomeBtn = document.getElementById('backToWelcomeBtn');

        // Buttons
        this.startGameBtn = document.getElementById('startGameBtn');
        this.playAgainBtn = document.getElementById('playAgainBtn');
        this.backToMenuBtn = document.getElementById('backToMenuBtn');
        this.backToMenuFromOut = document.getElementById('backToMenuFromOut');
        this.actionButtons = document.querySelectorAll('.action-btn');

        // Ad elements
        this.watchAdBtn = document.getElementById('watchAdBtn');
        this.adCooldownEl = document.getElementById('adCooldown');
        this.adTimerEl = document.getElementById('adTimer');
        this.adBonusSection = document.getElementById('adBonusSection');

        // Game over elements
        this.gameOverTitle = document.getElementById('gameOverTitle');
        this.finalStreakEl = document.getElementById('finalStreak');
        this.mistakePositionEl = document.getElementById('mistakePosition');
        this.mistakeHandEl = document.getElementById('mistakeHand');
        this.mistakeActionEl = document.getElementById('mistakeAction');
        this.correctActionEl = document.getElementById('correctAction');
        this.explanationEl = document.getElementById('explanation');
        this.remainingRunsBtnEl = document.getElementById('remainingRunsBtn');

        // Welcome screen elements
        this.runsCountEl = document.getElementById('runsCount');
        this.runsInfoEl = document.getElementById('runsInfo');
    }

    attachEventListeners() {
        // Auth listeners
        this.googleSignInBtn.addEventListener('click', () => this.handleGoogleSignIn());
        this.appleSignInBtn.addEventListener('click', () => this.handleAppleSignIn());
        this.guestPlayBtn.addEventListener('click', () => this.handleGuestPlay());
        this.logoutBtn.addEventListener('click', () => this.handleLogout());
        this.viewProfileBtn.addEventListener('click', () => this.showProfileScreen());
        this.viewInsightsBtn.addEventListener('click', () => this.showInsightsScreen());
        this.closeInsightsBtn.addEventListener('click', () => this.showProfileScreen());
        this.continueToGameBtn.addEventListener('click', () => this.showWelcomeScreen());

        // Position selection listeners
        this.modeCards.forEach(card => {
            card.addEventListener('click', (e) => this.handleModeSelection(e));
        });
        // Note: Position cards are dynamically generated, so listeners are attached in generatePositionCards()
        this.backToWelcomeBtn.addEventListener('click', () => this.showWelcomeScreen());

        // Game flow listeners
        this.startGameBtn.addEventListener('click', () => this.showPositionSelection());
        this.playAgainBtn.addEventListener('click', () => this.showPositionSelection());
        this.backToMenuBtn.addEventListener('click', () => this.showWelcomeScreen());
        this.backToMenuFromOut.addEventListener('click', () => this.showWelcomeScreen());

        // Ad listener
        this.watchAdBtn.addEventListener('click', () => this.handleWatchAd());

        // Action buttons
        this.actionButtons.forEach(btn => {
            btn.addEventListener('click', (e) => {
                const action = e.currentTarget.getAttribute('data-action');
                this.handleAction(action);
            });
        });

        // Start ad timer if needed
        this.updateAdButton();
        setInterval(() => this.updateAdButton(), 1000);
    }

    // Authentication methods
    checkAuthState() {
        if (!this.userManager.isAuthenticated()) {
            this.showLoginScreen();
        } else {
            this.showWelcomeScreen();
            this.updateProfileDisplay();
        }
    }

    async handleGoogleSignIn() {
        this.googleSignInBtn.disabled = true;
        this.googleSignInBtn.textContent = 'Signing in...';
        
        try {
            await this.userManager.signInWithGoogle();
            this.updateProfileDisplay();
            this.showProfileScreen();
        } catch (error) {
            console.error('Google sign-in error:', error);
            alert('Sign in failed. Please try again.');
        } finally {
            this.googleSignInBtn.disabled = false;
            this.googleSignInBtn.innerHTML = '<span class="btn-icon">🔐</span><span>Continue with Google</span>';
        }
    }

    async handleAppleSignIn() {
        this.appleSignInBtn.disabled = true;
        this.appleSignInBtn.textContent = 'Signing in...';
        
        try {
            await this.userManager.signInWithApple();
            this.updateProfileDisplay();
            this.showProfileScreen();
        } catch (error) {
            console.error('Apple sign-in error:', error);
            alert('Sign in failed. Please try again.');
        } finally {
            this.appleSignInBtn.disabled = false;
            this.appleSignInBtn.innerHTML = '<span class="btn-icon">🍎</span><span>Continue with Apple</span>';
        }
    }

    handleGuestPlay() {
        this.userManager.playAsGuest();
        this.updateProfileDisplay();
        this.showWelcomeScreen();
    }

    handleLogout() {
        if (confirm('Are you sure you want to sign out?')) {
            this.userManager.signOut();
            this.showLoginScreen();
        }
    }

    updateProfileDisplay() {
        const user = this.userManager.currentUser;
        if (!user) return;

        // Update profile info
        this.userNameEl.textContent = user.displayName || 'Player';
        this.userEmailEl.textContent = user.email || 'guest@gtotrainer.com';
        
        // Update login streak
        this.loginStreakCountEl.textContent = this.userManager.loginStreak;
        const streakProgress = Math.min((this.userManager.loginStreak % 7) / 7 * 100, 100);
        this.streakProgressBarEl.style.width = streakProgress + '%';

        // Update stats
        const stats = this.userManager.getUserStats();
        this.totalHandsPlayedEl.textContent = stats.totalHandsPlayed;
        this.totalAccuracyEl.textContent = this.userManager.getAccuracy() + '%';
        this.favoritePositionEl.textContent = this.userManager.getFavoritePosition();
    }

    // AI Insights Screen
    showInsightsScreen() {
        this.hideAllScreens();
        this.insightsScreen.style.display = 'flex';
        
        // Generate insights with full user manager access for aggregated analysis
        const stats = this.userManager.getUserStats();
        const insights = this.insightsAI.generateInsights(stats, this.userManager);
        
        // Render insights
        this.renderInsights(insights);
    }

    renderInsights(insights) {
        const container = this.insightsContainer;
        
        // Check if sufficient data
        if (insights.overall.level === 'insufficient_data') {
            container.innerHTML = `
                <div class="insight-card insufficient-data">
                    <div class="insight-icon">📊</div>
                    <h3>Need More Data</h3>
                    <p>${insights.overall.message}</p>
                    <div class="insight-tip">
                        Keep practicing to unlock AI-powered insights about your play!
                    </div>
                </div>
            `;
            return;
        }

        // Build insights HTML
        let html = '';

        // Overall Performance
        html += `
            <div class="insight-card overall-insight">
                <div class="insight-header">
                    <span class="insight-emoji">${insights.overall.emoji}</span>
                    <h3>Overall Performance</h3>
                </div>
                <div class="insight-level ${insights.overall.level}">${insights.overall.level.toUpperCase()}</div>
                <p class="insight-message">${insights.overall.message}</p>
                <div class="insight-stats">
                    <div class="insight-stat">
                        <span class="stat-label">Accuracy:</span>
                        <span class="stat-value">${(insights.overall.accuracy * 100).toFixed(1)}%</span>
                    </div>
                    <div class="insight-stat">
                        <span class="stat-label">Hands Played:</span>
                        <span class="stat-value">${insights.overall.totalHands}</span>
                    </div>
                </div>
            </div>
        `;

        // Top Recommendation
        if (insights.recommendations.length > 0) {
            const rec = insights.recommendations[0];
            html += `
                <div class="insight-card recommendation-card priority-${rec.priority}">
                    <div class="insight-header">
                        <span class="insight-emoji">${rec.emoji}</span>
                        <h3>${rec.title}</h3>
                    </div>
                    <p class="insight-description">${rec.description}</p>
                    <div class="insight-action">
                        <strong>💡 Action:</strong> ${rec.action}
                    </div>
                    <div class="insight-improvement">
                        <strong>📈 Expected Impact:</strong> ${rec.expectedImprovement}
                    </div>
                </div>
            `;
        }

        // Tendencies
        if (insights.tendencies.length > 0) {
            html += '<div class="insights-section"><h3>🎯 Detected Tendencies</h3>';
            insights.tendencies.forEach(tendency => {
                html += `
                    <div class="insight-card tendency-card">
                        <div class="insight-header">
                            <span class="insight-emoji">${tendency.emoji}</span>
                            <h4>${tendency.title}</h4>
                        </div>
                        <p>${tendency.description}</p>
                        <div class="insight-fix">
                            <strong>Fix:</strong> ${tendency.fix}
                        </div>
                    </div>
                `;
            });
            html += '</div>';
        }

        // Strengths
        if (insights.strengths.length > 0) {
            html += '<div class="insights-section"><h3>💪 Your Strengths</h3><div class="strengths-grid">';
            insights.strengths.forEach(strength => {
                html += `
                    <div class="strength-badge">
                        <span class="strength-emoji">${strength.emoji}</span>
                        <div class="strength-name">${strength.name}</div>
                        <div class="strength-accuracy">${(strength.accuracy * 100).toFixed(1)}%</div>
                    </div>
                `;
            });
            html += '</div></div>';
        }

        // Weaknesses
        if (insights.weaknesses.length > 0) {
            html += '<div class="insights-section"><h3>🎯 Areas to Improve</h3>';
            insights.weaknesses.slice(0, 3).forEach(weakness => {
                html += `
                    <div class="insight-card weakness-card">
                        <div class="insight-header">
                            <span class="insight-emoji">${weakness.emoji}</span>
                            <h4>${weakness.name} - ${(weakness.accuracy * 100).toFixed(1)}% Accuracy</h4>
                        </div>
                        <p><strong>Issue:</strong> ${weakness.primaryIssue.description}</p>
                        <div class="insight-fix">
                            <strong>💡 Solution:</strong> ${weakness.primaryIssue.fix}
                        </div>
                        <button class="btn btn-sm practice-position-btn" data-position="${weakness.position}">
                            Practice ${weakness.position} Now
                        </button>
                    </div>
                `;
            });
            html += '</div>';
        }

        // Position-by-position breakdown
        html += '<div class="insights-section"><h3>📊 Position Breakdown</h3><div class="position-insights-grid">';
        const positions = ['UTG', 'UTG1', 'MP', 'MP2', 'HJ', 'CO', 'BTN', 'SB', 'BB'];
        positions.forEach(pos => {
            const posInsight = insights.byPosition[pos];
            if (posInsight && posInsight.status !== 'insufficient_data') {
                html += `
                    <div class="position-insight-card">
                        <div class="position-insight-header">
                            <strong>${pos}</strong>
                            <span class="${posInsight.accuracy >= 0.75 ? 'good' : posInsight.accuracy >= 0.60 ? 'ok' : 'poor'}">
                                ${(posInsight.accuracy * 100).toFixed(0)}%
                            </span>
                        </div>
                        <div class="position-insight-hands">${posInsight.played} hands</div>
                    </div>
                `;
            }
        });
        html += '</div></div>';

        // Motivational message
        const motivationalMsg = this.insightsAI.getMotivationalMessage(this.userManager.getUserStats());
        html += `
            <div class="insight-card motivational-card">
                <h3>${motivationalMsg}</h3>
                <p>Keep practicing and reviewing the insights to improve your GTO game!</p>
            </div>
        `;

        container.innerHTML = html;

        // Add event listeners to practice buttons
        const practiceButtons = container.querySelectorAll('.practice-position-btn');
        practiceButtons.forEach(btn => {
            btn.addEventListener('click', (e) => {
                const position = e.target.getAttribute('data-position');
                this.selectedMode = 'specific';
                this.selectedPosition = position;
                this.startNewRun();
            });
        });
    }

    // Position selection methods
    showPositionSelection() {
        if (this.runsRemaining <= 0) {
            this.showOutOfRunsScreen();
            return;
        }

        // Skip position selection screen - go straight to pure random game
        this.startGame();
    }

    generatePositionCards() {
        const grid = document.getElementById('positionGrid');
        if (grid.children.length > 0) return; // Already generated
        
        // Define position order (early to late position)
        const positionOrder = ['UTG', 'UTG1', 'MP', 'MP2', 'HJ', 'CO', 'BTN', 'SB', 'BB'];
        
        positionOrder.forEach(posKey => {
            const posData = GTO_DATA.positions[posKey];
            if (!posData) return;
            
            const card = document.createElement('button');
            card.className = 'position-card';
            card.setAttribute('data-position', posKey);
            card.style.setProperty('--position-color', posData.color);
            
            card.innerHTML = `
                <button class="position-info-btn" data-position="${posKey}">ℹ</button>
                <div class="position-name">${posData.name}</div>
                <div class="position-fullname">${posData.fullName}</div>
                <div class="position-vpip">${posData.vpip}</div>
                <div class="position-players-after">${posData.playersAfter} players after</div>
                <div class="position-difficulty ${posData.difficulty}">${posData.difficulty}</div>
            `;
            
            // Add click handler for card
            card.addEventListener('click', (e) => {
                // Don't trigger if clicking info button
                if (e.target.classList.contains('position-info-btn')) {
                    e.stopPropagation();
                    this.showPositionDetail(posKey);
                    return;
                }
                this.handlePositionSelection(posKey);
            });
            
            // Add info button handler
            const infoBtn = card.querySelector('.position-info-btn');
            infoBtn.addEventListener('click', (e) => {
                e.stopPropagation();
                this.showPositionDetail(posKey);
            });
            
            grid.appendChild(card);
        });
    }

    showPositionDetail(posKey) {
        const posData = GTO_DATA.positions[posKey];
        if (!posData) return;
        
        const modal = document.getElementById('positionDetailModal');
        const modalName = document.getElementById('modalPositionName');
        const modalVpip = document.getElementById('modalVpip');
        const modalGto = document.getElementById('modalGtoExplanation');
        const modalKeyPoints = document.getElementById('modalKeyPoints');
        const modalPlayersAfter = document.getElementById('modalPlayersAfter');
        const modalProfitability = document.getElementById('modalProfitability');
        const modalSelectBtn = document.getElementById('modalSelectBtn');
        const modalCloseBtn = document.getElementById('modalCloseBtn');
        
        // Populate modal
        modalName.textContent = posData.fullName;
        modalVpip.textContent = `VPIP: ${posData.vpip}`;
        modalGto.textContent = posData.gtoExplanation;
        
        // Clear and populate key points
        modalKeyPoints.innerHTML = '';
        posData.keyPoints.forEach(point => {
            const li = document.createElement('li');
            li.textContent = point;
            modalKeyPoints.appendChild(li);
        });
        
        modalPlayersAfter.textContent = posData.playersAfter;
        modalProfitability.textContent = posData.profitability;
        
        // Show modal
        modal.style.display = 'flex';
        
        // Add event listeners
        modalSelectBtn.onclick = () => {
            modal.style.display = 'none';
            this.handlePositionSelection(posKey);
        };
        
        modalCloseBtn.onclick = () => {
            modal.style.display = 'none';
        };
        
        // Close on background click
        modal.onclick = (e) => {
            if (e.target === modal) {
                modal.style.display = 'none';
            }
        };
    }

    handleModeSelection(e) {
        const card = e.currentTarget;
        const mode = card.getAttribute('data-mode');
        
        // Update UI
        this.modeCards.forEach(c => c.classList.remove('selected'));
        card.classList.add('selected');
        
        if (mode === 'random') {
            this.selectedMode = 'random';
            this.selectedPosition = null;
            this.positionGrid.style.display = 'none';
            // Start immediately with random mode
            setTimeout(() => this.startNewRun(), 300);
        } else {
            this.selectedMode = 'specific';
            this.positionGrid.style.display = 'grid';
        }
    }

    handlePositionSelection(position) {
        // Update UI - select the card
        const cards = document.querySelectorAll('.position-card');
        cards.forEach(c => c.classList.remove('selected'));
        const selectedCard = document.querySelector(`[data-position="${position}"]`);
        if (selectedCard) {
            selectedCard.classList.add('selected');
        }
        
        this.selectedPosition = position;
        
        // Start game with selected position after a short delay
        setTimeout(() => this.startNewRun(), 300);
    }

    // Ad management methods
    async handleWatchAd() {
        if (!this.adManager.canWatchAd()) {
            alert('Please wait before watching another ad.');
            return;
        }

        this.watchAdBtn.disabled = true;
        this.watchAdBtn.textContent = 'Loading Ad...';
        
        try {
            // Simulate ad watching (replace with actual ad SDK)
            await this.adManager.watchAd();
            
            // Grant bonus runs
            this.runsRemaining += 10;
            this.saveDailyData();
            this.updateDisplay();
            
            // Show success message
            alert('🎉 You earned 10 bonus runs! Thank you for watching.');
            
        } catch (error) {
            console.error('Ad watch error:', error);
            alert('Ad failed to load. Please try again later.');
        } finally {
            this.updateAdButton();
        }
    }

    updateAdButton() {
        if (!this.adBonusSection) return;
        
        if (this.adManager.canWatchAd()) {
            this.watchAdBtn.disabled = false;
            this.watchAdBtn.innerHTML = '<span class="ad-icon">📺</span><span>Watch Ad for +10 Runs</span>';
            if (this.adCooldownEl) this.adCooldownEl.style.display = 'none';
        } else {
            this.watchAdBtn.disabled = true;
            this.watchAdBtn.textContent = 'Ad Not Available Yet';
            if (this.adCooldownEl) {
                this.adCooldownEl.style.display = 'block';
                this.adTimerEl.textContent = this.adManager.formatTimeRemaining();
            }
        }
    }

    // Screen management
    hideAllScreens() {
        this.loginScreen.style.display = 'none';
        this.profileScreen.style.display = 'none';
        this.positionSelectionScreen.style.display = 'none';
        this.welcomeScreen.style.display = 'none';
        this.pokerTable.style.display = 'none';
        this.gameOverScreen.style.display = 'none';
        this.outOfRunsScreen.style.display = 'none';
    }

    showLoginScreen() {
        this.hideAllScreens();
        this.loginScreen.style.display = 'flex';
    }

    showProfileScreen() {
        this.hideAllScreens();
        this.updateProfileDisplay();
        this.profileScreen.style.display = 'block';
    }

    // Daily runs management
    initializeDailyRuns() {
        const today = this.getTodayString();
        const stored = localStorage.getItem('gtoPokerTrainer');
        
        if (stored) {
            const data = JSON.parse(stored);
            
            // Check if it's a new day
            if (data.date === today) {
                this.runsRemaining = data.runsRemaining;
                this.bestStreak = data.bestStreak || 0;
            } else {
                // New day - reset runs
                this.runsRemaining = 10;
                this.saveDailyData();
            }
        } else {
            // First time user
            this.saveDailyData();
        }
    }

    getTodayString() {
        const today = new Date();
        return `${today.getFullYear()}-${today.getMonth() + 1}-${today.getDate()}`;
    }

    saveDailyData() {
        const data = {
            date: this.getTodayString(),
            runsRemaining: this.runsRemaining,
            bestStreak: this.bestStreak
        };
        localStorage.setItem('gtoPokerTrainer', JSON.stringify(data));
    }

    loadBestStreak() {
        const stored = localStorage.getItem('gtoPokerTrainer');
        if (stored) {
            const data = JSON.parse(stored);
            return data.bestStreak || 0;
        }
        return 0;
    }

    useRun() {
        this.runsRemaining--;
        this.saveDailyData();
        this.updateDisplay();
    }

    // Game flow
    startNewRun() {
        if (this.runsRemaining <= 0) {
            this.showOutOfRunsScreen();
            return;
        }

        this.useRun();
        this.currentStreak = 0;
        this.gameActive = true;
        this.showPokerTable();
        this.generateNewScenario();
        this.updateDisplay();
    }

    generateNewScenario() {
        // Starting with Big Blind only for now
        const position = 'BB';

        // Generate completely random hand - pure randomness
        const hand = this.generateRandomHand();

        // Unopened pot scenario
        const scenarioType = 'unopened';
        
        // Get GTO correct action
        const correctAction = getCorrectAction(position, hand, scenarioType);

        this.currentScenario = {
            position,
            hand,
            scenarioType,
            correctAction
        };

        this.displayScenario();
    }

    generateRandomHand() {
        // All 13 ranks
        const ranks = ['A', 'K', 'Q', 'J', 'T', '9', '8', '7', '6', '5', '4', '3', '2'];
        
        // Pure random selection - use crypto.getRandomValues for true randomness
        const randomArray = new Uint32Array(3);
        if (typeof crypto !== 'undefined' && crypto.getRandomValues) {
            crypto.getRandomValues(randomArray);
            var rank1Index = randomArray[0] % ranks.length;
            var rank2Index = randomArray[1] % ranks.length;
            var suitedRandom = randomArray[2] / 0xFFFFFFFF; // 0 to 1
        } else {
            // Fallback to Math.random
            var rank1Index = Math.floor(Math.random() * ranks.length);
            var rank2Index = Math.floor(Math.random() * ranks.length);
            var suitedRandom = Math.random();
        }
        
        const rank1 = ranks[rank1Index];
        const rank2 = ranks[rank2Index];
        
        // Pocket pair
        if (rank1Index === rank2Index) {
            return rank1 + rank2;
        }
        
        // Two different ranks - higher rank first
        const higherRank = rank1Index < rank2Index ? rank1 : rank2;
        const lowerRank = rank1Index < rank2Index ? rank2 : rank1;
        
        // True probability: 23.5% suited, 76.5% offsuit
        const isSuited = suitedRandom < 0.235;
        
        return higherRank + lowerRank + (isSuited ? 's' : 'o');
    }

    displayScenario() {
        const { position, hand, scenarioType } = this.currentScenario;

        // Display position
        this.positionNameEl.textContent = position;

        // Display hand
        this.displayHand(hand);

        // Display scenario info
        if (scenarioType === 'unopened') {
            this.potSizeEl.textContent = '1.5bb';
            this.actionDescriptionEl.textContent = 'Unopened pot - Action is on you';
        }

        // Enable action buttons
        this.enableActionButtons();
    }

    displayHand(hand) {
        // Parse hand notation (e.g., "AKs", "QQ", "T9o")
        let card1Value, card2Value, suited;

        if (hand.length === 2) {
            // Pocket pair
            card1Value = hand[0];
            card2Value = hand[1];
            suited = false;
        } else {
            card1Value = hand[0];
            card2Value = hand[1];
            suited = hand[2] === 's';
        }

        // Pure random suit assignment using crypto API
        const suitOptions = ['s', 'h', 'd', 'c'];
        let suit1, suit2;
        
        if (typeof crypto !== 'undefined' && crypto.getRandomValues) {
            const randomSuits = new Uint32Array(2);
            crypto.getRandomValues(randomSuits);
            
            if (suited) {
                // Same suit for suited hands
                suit1 = suitOptions[randomSuits[0] % 4];
                suit2 = suit1;
            } else {
                // Different suits for pairs/offsuit
                suit1 = suitOptions[randomSuits[0] % 4];
                // Ensure different suit
                let suit2Index = randomSuits[1] % 4;
                while (suitOptions[suit2Index] === suit1) {
                    suit2Index = (suit2Index + 1) % 4;
                }
                suit2 = suitOptions[suit2Index];
            }
        } else {
            // Fallback
            if (suited) {
                suit1 = suitOptions[Math.floor(Math.random() * 4)];
                suit2 = suit1;
            } else {
                suit1 = suitOptions[Math.floor(Math.random() * 4)];
                const otherSuits = suitOptions.filter(s => s !== suit1);
                suit2 = otherSuits[Math.floor(Math.random() * otherSuits.length)];
            }
        }

        this.displayCard(this.card1El, card1Value, suit1);
        this.displayCard(this.card2El, card2Value, suit2);
    }

    displayCard(cardElement, value, suit) {
        const displayValue = CARD_VALUES[value];
        const suitSymbol = SUITS[suit];
        
        cardElement.textContent = `${displayValue}${suitSymbol}`;
        
        // Color based on suit
        if (suit === 'h' || suit === 'd') {
            cardElement.className = 'card red';
        } else {
            cardElement.className = 'card black';
        }
    }

    handleAction(action) {
        if (!this.gameActive) return;

        this.disableActionButtons();

        const correctAction = this.currentScenario.correctAction;

        // Map 'raise' to handle both 'raise' and 'allin' as correct for simplicity
        // In real GTO, you'd have specific bet sizing, but for learning, we'll keep it simple
        const playerAction = action;
        const isCorrect = (playerAction === correctAction) || 
                         (correctAction === 'raise' && (playerAction === 'raise' || playerAction === 'allin'));

        if (isCorrect) {
            this.handleCorrectAnswer();
        } else {
            this.handleWrongAnswer(action);
        }
    }

    handleCorrectAnswer() {
        this.currentStreak++;
        
        // Update user stats with full decision data
        if (this.userManager && this.currentScenario) {
            const decisionData = {
                hand: this.currentScenario.hand,
                playerAction: this.currentScenario.correctAction,
                correctAction: this.currentScenario.correctAction,
                isMarginal: this.isHandMarginal(this.currentScenario.hand, this.currentScenario.position)
            };
            this.userManager.updateUserStats(this.currentScenario.position, true, decisionData);
        }
        
        if (this.currentStreak > this.bestStreak) {
            this.bestStreak = this.currentStreak;
            this.saveDailyData();
        }

        this.updateDisplay();

        // Flash correct animation
        this.pokerTable.classList.add('correct-animation');
        setTimeout(() => {
            this.pokerTable.classList.remove('correct-animation');
        }, 500);

        // Generate next scenario after a short delay
        setTimeout(() => {
            this.generateNewScenario();
        }, 1000);
    }

    handleWrongAnswer(playerAction) {
        this.gameActive = false;

        // Prepare detailed decision data for AI analysis
        const decisionData = {
            hand: this.currentScenario.hand,
            playerAction: playerAction,
            correctAction: this.currentScenario.correctAction,
            isMarginal: this.isHandMarginal(this.currentScenario.hand, this.currentScenario.position)
        };

        // Update user stats with detailed mistake tracking
        if (this.userManager && this.currentScenario) {
            this.userManager.updateUserStats(this.currentScenario.position, false, decisionData);
        }

        // Flash wrong animation
        this.pokerTable.classList.add('wrong-animation');
        setTimeout(() => {
            this.pokerTable.classList.remove('wrong-animation');
        }, 500);

        // Show game over screen after animation
        setTimeout(() => {
            this.showGameOverScreen(playerAction);
        }, 1000);
    }

    // Determine if a hand is marginal (close to the edge of the opening range)
    isHandMarginal(hand, position) {
        // Marginal hands are at the edge of the opening range
        // These are "close decisions" that are more forgivable to get wrong
        const marginalHands = {
            'UTG': ['77', '66', 'AJo', 'A9s', 'A8s', 'KTs', 'QTs'],
            'UTG1': ['66', '55', 'AJo', 'ATo', 'A8s', 'A7s', 'K9s', 'QJo'],
            'MP': ['44', '33', 'ATo', 'A6s', 'KJo', 'KTo', 'QJo', 'QTo', 'T8s'],
            'MP2': ['33', '22', 'A9o', 'KTo', 'K8s', 'QTo', 'Q8s', 'J8s', '97s'],
            'HJ': ['A9o', 'A8o', 'K9o', 'K7s', 'Q9o', 'Q7s', 'J9o', 'J7s', 'T8o'],
            'CO': ['A7o', 'A6o', 'K8o', 'K6s', 'Q8o', 'J8o', 'T8o', '96s', '85s'],
            'BTN': ['K6o', 'K5o', 'Q7o', 'Q6o', 'J7o', 'T7o', '97o', '87o', '86s'],
            'SB': ['A8o', 'A7o', 'K9o', 'K8o', 'QTo', 'Q9o', 'J9o', 'T9o', 'T8o'],
            'BB': [] // BB mostly defends, different logic
        };

        return marginalHands[position]?.includes(hand) || false;
    }

    showGameOverScreen(playerAction) {
        const { position, hand, correctAction } = this.currentScenario;

        this.pokerTable.style.display = 'none';
        this.gameOverScreen.style.display = 'flex';

        // Set game over content
        if (this.currentStreak === 0) {
            this.gameOverTitle.textContent = 'Tough Start!';
        } else if (this.currentStreak < 5) {
            this.gameOverTitle.textContent = 'Good Try!';
        } else if (this.currentStreak < 10) {
            this.gameOverTitle.textContent = 'Nice Run!';
        } else {
            this.gameOverTitle.textContent = 'Impressive Streak!';
        }

        this.finalStreakEl.textContent = this.currentStreak;
        this.mistakePositionEl.textContent = GTO_DATA.positions[position].name;
        this.mistakeHandEl.textContent = hand;
        this.mistakeActionEl.textContent = this.formatAction(playerAction);
        this.correctActionEl.textContent = this.formatAction(correctAction);
        
        const explanation = generateExplanation(position, hand, correctAction, this.currentScenario.scenarioType);
        this.explanationEl.textContent = explanation;

        this.remainingRunsBtnEl.textContent = this.runsRemaining;

        // Disable play again if no runs left
        if (this.runsRemaining <= 0) {
            this.playAgainBtn.disabled = true;
            this.playAgainBtn.textContent = 'No Runs Remaining';
        } else {
            this.playAgainBtn.disabled = false;
            this.playAgainBtn.innerHTML = `Play Again (<span id="remainingRunsBtn">${this.runsRemaining}</span> runs left)`;
        }
    }

    formatAction(action) {
        const actionMap = {
            'fold': 'FOLD',
            'call': 'CALL',
            'raise': 'RAISE',
            'allin': 'ALL-IN'
        };
        return actionMap[action] || action.toUpperCase();
    }

    showWelcomeScreen() {
        this.hideAllScreens();
        this.welcomeScreen.style.display = 'flex';

        this.runsCountEl.textContent = this.runsRemaining;

        if (this.runsRemaining <= 0) {
            this.startGameBtn.disabled = true;
            this.startGameBtn.textContent = 'Out of Runs';
            this.runsInfoEl.innerHTML = '<strong>You have used all runs for today.</strong> Come back tomorrow!';
            this.runsInfoEl.style.background = 'rgba(231, 76, 60, 0.1)';
            this.runsInfoEl.style.color = '#e74c3c';
        } else {
            this.startGameBtn.disabled = false;
            this.startGameBtn.textContent = 'Start New Run';
            this.runsInfoEl.innerHTML = `You have <strong id="runsCount">${this.runsRemaining}</strong> runs remaining today`;
            this.runsInfoEl.style.background = 'rgba(96, 239, 255, 0.1)';
            this.runsInfoEl.style.color = '#60efff';
        }
    }

    showPokerTable() {
        this.hideAllScreens();
        this.pokerTable.style.display = 'block';
    }

    showOutOfRunsScreen() {
        this.hideAllScreens();
        this.outOfRunsScreen.style.display = 'flex';

        // Calculate time until midnight
        const now = new Date();
        const midnight = new Date(now);
        midnight.setHours(24, 0, 0, 0);
        const resetTime = midnight.toLocaleTimeString('en-US', { hour: 'numeric', minute: '2-digit', hour12: true });

        document.getElementById('resetTime').textContent = resetTime;
        document.getElementById('todayBestStreak').textContent = this.bestStreak;
    }

    enableActionButtons() {
        this.actionButtons.forEach(btn => {
            btn.disabled = false;
        });
    }

    disableActionButtons() {
        this.actionButtons.forEach(btn => {
            btn.disabled = true;
        });
    }

    updateDisplay() {
        this.currentStreakEl.textContent = this.currentStreak;
        this.bestStreakEl.textContent = this.bestStreak;
        this.runsRemainingEl.textContent = this.runsRemaining;
    }
}

// Initialize game when DOM is ready
document.addEventListener('DOMContentLoaded', () => {
    const game = new GTOPokerGame();
    
    // Register Service Worker for PWA
    if ('serviceWorker' in navigator) {
        navigator.serviceWorker.register('/service-worker.js')
            .then(registration => {
                console.log('Service Worker registered:', registration);
            })
            .catch(error => {
                console.log('Service Worker registration failed:', error);
            });
    }
});
