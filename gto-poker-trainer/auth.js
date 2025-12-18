// Firebase Configuration and Authentication
// Replace with your actual Firebase config
const firebaseConfig = {
    apiKey: "YOUR_API_KEY",
    authDomain: "YOUR_AUTH_DOMAIN",
    projectId: "YOUR_PROJECT_ID",
    storageBucket: "YOUR_STORAGE_BUCKET",
    messagingSenderId: "YOUR_MESSAGING_SENDER_ID",
    appId: "YOUR_APP_ID"
};

// User Management System
class UserManager {
    constructor() {
        this.currentUser = null;
        this.isGuest = false;
        this.loginStreak = 0;
        this.lastLoginDate = null;
        this.initializeUser();
    }

    initializeUser() {
        // Check if user is logged in
        const userData = localStorage.getItem('gtoUserData');
        if (userData) {
            try {
                this.currentUser = JSON.parse(userData);
                this.checkLoginStreak();
            } catch (e) {
                console.error('Error parsing user data:', e);
                this.currentUser = null;
            }
        }
    }

    // Google Sign In (Web)
    async signInWithGoogle() {
        // For now, simulate sign-in (replace with actual Firebase auth)
        return this.simulateSignIn('google');
    }

    // Apple Sign In (Web)
    async signInWithApple() {
        // For now, simulate sign-in (replace with actual Firebase auth)
        return this.simulateSignIn('apple');
    }

    // Simulate sign-in for demo purposes
    simulateSignIn(provider) {
        return new Promise((resolve) => {
            setTimeout(() => {
                this.currentUser = {
                    uid: 'demo_' + Date.now(),
                    displayName: provider === 'google' ? 'Demo User (Google)' : 'Demo User (Apple)',
                    email: `demo@${provider}.com`,
                    photoURL: null,
                    provider: provider,
                    createdAt: Date.now()
                };
                this.isGuest = false;
                this.checkLoginStreak();
                this.saveUserData();
                resolve(this.currentUser);
            }, 1000);
        });
    }

    // Guest Play
    playAsGuest() {
        this.currentUser = {
            uid: 'guest_' + Date.now(),
            displayName: 'Guest Player',
            email: 'guest@gtotrainer.com',
            photoURL: null,
            provider: 'guest',
            createdAt: Date.now()
        };
        this.isGuest = true;
        this.saveUserData();
        return this.currentUser;
    }

    // Check and update login streak
    checkLoginStreak() {
        const today = this.getTodayString();
        const streakData = this.getStreakData();
        
        if (streakData.lastLoginDate === today) {
            // Already logged in today
            this.loginStreak = streakData.currentStreak;
        } else if (this.isYesterday(streakData.lastLoginDate)) {
            // Logged in yesterday, continue streak
            this.loginStreak = streakData.currentStreak + 1;
            this.updateStreakData(this.loginStreak, today);
        } else {
            // Streak broken, start over
            this.loginStreak = 1;
            this.updateStreakData(1, today);
        }
        
        this.lastLoginDate = today;
    }

    getStreakData() {
        const data = localStorage.getItem('gtoLoginStreak');
        if (data) {
            return JSON.parse(data);
        }
        return {
            currentStreak: 0,
            longestStreak: 0,
            lastLoginDate: null
        };
    }

    updateStreakData(streak, date) {
        const data = this.getStreakData();
        data.currentStreak = streak;
        data.lastLoginDate = date;
        if (streak > data.longestStreak) {
            data.longestStreak = streak;
        }
        localStorage.setItem('gtoLoginStreak', JSON.stringify(data));
    }

    getTodayString() {
        const today = new Date();
        return `${today.getFullYear()}-${today.getMonth() + 1}-${today.getDate()}`;
    }

    isYesterday(dateString) {
        if (!dateString) return false;
        const yesterday = new Date();
        yesterday.setDate(yesterday.getDate() - 1);
        const yesterdayString = `${yesterday.getFullYear()}-${yesterday.getMonth() + 1}-${yesterday.getDate()}`;
        return dateString === yesterdayString;
    }

    saveUserData() {
        if (this.currentUser && !this.isGuest) {
            localStorage.setItem('gtoUserData', JSON.stringify(this.currentUser));
        }
    }

    // Get user stats
    getUserStats() {
        const stats = localStorage.getItem('gtoUserStats');
        if (stats) {
            return JSON.parse(stats);
        }
        return {
            totalHandsPlayed: 0,
            totalCorrect: 0,
            totalWrong: 0,
            positionStats: {
                UTG: { played: 0, correct: 0, mistakes: [] },
                UTG1: { played: 0, correct: 0, mistakes: [] },
                MP: { played: 0, correct: 0, mistakes: [] },
                MP2: { played: 0, correct: 0, mistakes: [] },
                HJ: { played: 0, correct: 0, mistakes: [] },
                CO: { played: 0, correct: 0, mistakes: [] },
                BTN: { played: 0, correct: 0, mistakes: [] },
                SB: { played: 0, correct: 0, mistakes: [] },
                BB: { played: 0, correct: 0, mistakes: [] }
            },
            longestStreak: 0
        };
    }

    updateUserStats(position, isCorrect, decisionData = null) {
        const stats = this.getUserStats();
        stats.totalHandsPlayed++;
        
        // Initialize position if it doesn't exist (for backward compatibility)
        if (!stats.positionStats[position]) {
            stats.positionStats[position] = { 
                played: 0, 
                correct: 0, 
                mistakes: [],
                handHistory: []
            };
        }
        
        // Track EVERY decision for analysis
        if (!stats.positionStats[position].handHistory) {
            stats.positionStats[position].handHistory = [];
        }
        
        // Record this hand decision
        const handRecord = {
            hand: decisionData ? decisionData.hand : 'Unknown',
            playerAction: decisionData ? decisionData.playerAction : 'Unknown',
            correctAction: decisionData ? decisionData.correctAction : 'Unknown',
            isCorrect: isCorrect,
            timestamp: Date.now(),
            isMarginal: decisionData ? (decisionData.isMarginal || false) : false
        };
        
        // Keep last 100 hands per position for detailed analysis
        if (stats.positionStats[position].handHistory.length >= 100) {
            stats.positionStats[position].handHistory.shift();
        }
        stats.positionStats[position].handHistory.push(handRecord);
        
        if (isCorrect) {
            stats.totalCorrect++;
            stats.positionStats[position].correct++;
        } else {
            stats.totalWrong++;
            
            // Track detailed mistake data for AI analysis
            if (decisionData) {
                if (!stats.positionStats[position].mistakes) {
                    stats.positionStats[position].mistakes = [];
                }
                
                // Keep only last 50 mistakes per position to avoid storage bloat
                if (stats.positionStats[position].mistakes.length >= 50) {
                    stats.positionStats[position].mistakes.shift();
                }
                
                stats.positionStats[position].mistakes.push({
                    hand: decisionData.hand,
                    playerAction: decisionData.playerAction,
                    correctAction: decisionData.correctAction,
                    timestamp: Date.now(),
                    isMarginal: decisionData.isMarginal || false
                });
            }
        }
        
        stats.positionStats[position].played++;
        
        localStorage.setItem('gtoUserStats', JSON.stringify(stats));
    }
    
    // Get aggregated mistake patterns for AI analysis
    getMistakePatterns() {
        const stats = this.getUserStats();
        const patterns = {
            commonMistakes: {},
            positionWeaknesses: [],
            handTypeErrors: {
                premiumHands: 0,
                marginalHands: 0,
                trashHands: 0
            },
            actionTendencies: {
                tooTight: 0, // Folding when should raise
                tooLoose: 0, // Raising when should fold
                wrongSizing: 0 // Call when should raise, etc
            }
        };
        
        // Analyze mistakes across all positions
        Object.keys(stats.positionStats).forEach(position => {
            const posData = stats.positionStats[position];
            
            if (posData.mistakes && posData.mistakes.length > 0) {
                const accuracy = posData.played > 0 ? (posData.correct / posData.played) * 100 : 0;
                
                if (accuracy < 70 && posData.played >= 5) {
                    patterns.positionWeaknesses.push({
                        position: position,
                        accuracy: accuracy.toFixed(1),
                        mistakes: posData.mistakes.length
                    });
                }
                
                // Analyze each mistake
                posData.mistakes.forEach(mistake => {
                    // Track most common mistake hands
                    if (!patterns.commonMistakes[mistake.hand]) {
                        patterns.commonMistakes[mistake.hand] = 0;
                    }
                    patterns.commonMistakes[mistake.hand]++;
                    
                    // Categorize hand type errors
                    if (this.isPremiumHand(mistake.hand)) {
                        patterns.handTypeErrors.premiumHands++;
                    } else if (mistake.isMarginal) {
                        patterns.handTypeErrors.marginalHands++;
                    } else {
                        patterns.handTypeErrors.trashHands++;
                    }
                    
                    // Analyze action tendencies
                    if (mistake.correctAction === 'raise' && mistake.playerAction === 'fold') {
                        patterns.actionTendencies.tooTight++;
                    } else if (mistake.correctAction === 'fold' && mistake.playerAction !== 'fold') {
                        patterns.actionTendencies.tooLoose++;
                    } else {
                        patterns.actionTendencies.wrongSizing++;
                    }
                });
            }
        });
        
        return patterns;
    }
    
    // Helper to identify premium hands
    isPremiumHand(hand) {
        const premium = ['AA', 'KK', 'QQ', 'JJ', 'TT', 'AKs', 'AKo', 'AQs', 'AQo'];
        return premium.includes(hand);
    }
    
    // Get recent performance trend
    getRecentPerformance() {
        const stats = this.getUserStats();
        const recentHands = [];
        
        // Collect recent hands from all positions
        Object.keys(stats.positionStats).forEach(position => {
            const posData = stats.positionStats[position];
            if (posData.handHistory) {
                recentHands.push(...posData.handHistory.map(h => ({
                    ...h,
                    position: position
                })));
            }
        });
        
        // Sort by timestamp and get last 20
        recentHands.sort((a, b) => b.timestamp - a.timestamp);
        const last20 = recentHands.slice(0, 20);
        
        if (last20.length === 0) {
            return { accuracy: 0, trend: 'insufficient_data' };
        }
        
        const correct = last20.filter(h => h.isCorrect).length;
        const accuracy = (correct / last20.length) * 100;
        
        // Determine trend by comparing first half vs second half
        const firstHalf = last20.slice(0, Math.floor(last20.length / 2));
        const secondHalf = last20.slice(Math.floor(last20.length / 2));
        
        const firstAccuracy = (firstHalf.filter(h => h.isCorrect).length / firstHalf.length) * 100;
        const secondAccuracy = (secondHalf.filter(h => h.isCorrect).length / secondHalf.length) * 100;
        
        let trend = 'stable';
        if (secondAccuracy - firstAccuracy > 10) {
            trend = 'improving';
        } else if (firstAccuracy - secondAccuracy > 10) {
            trend = 'declining';
        }
        
        return {
            accuracy: accuracy.toFixed(1),
            trend: trend,
            recentHands: last20.length
        };
    }

    getFavoritePosition() {
        const stats = this.getUserStats();
        let bestPosition = 'BTN';
        let bestAccuracy = 0;

        Object.keys(stats.positionStats).forEach(pos => {
            const posStats = stats.positionStats[pos];
            if (posStats.played > 0) {
                const accuracy = (posStats.correct / posStats.played) * 100;
                if (accuracy > bestAccuracy) {
                    bestAccuracy = accuracy;
                    bestPosition = pos;
                }
            }
        });

        return bestPosition;
    }

    getAccuracy() {
        const stats = this.getUserStats();
        if (stats.totalHandsPlayed === 0) return 0;
        return Math.round((stats.totalCorrect / stats.totalHandsPlayed) * 100);
    }

    // Sign out
    signOut() {
        this.currentUser = null;
        this.isGuest = false;
        localStorage.removeItem('gtoUserData');
    }

    // Check if user is authenticated
    isAuthenticated() {
        return this.currentUser !== null;
    }
}

// Ad Manager for bonus runs
class AdManager {
    constructor() {
        this.lastAdWatchTime = this.getLastAdWatchTime();
        this.adCooldownHours = 5; // 5 hours between ads
    }

    getLastAdWatchTime() {
        const data = localStorage.getItem('gtoAdWatchTime');
        return data ? parseInt(data) : 0;
    }

    canWatchAd() {
        const now = Date.now();
        const timeSinceLastAd = now - this.lastAdWatchTime;
        const cooldownMs = this.adCooldownHours * 60 * 60 * 1000;
        return timeSinceLastAd >= cooldownMs;
    }

    getTimeUntilNextAd() {
        const now = Date.now();
        const cooldownMs = this.adCooldownHours * 60 * 60 * 1000;
        const timeSinceLastAd = now - this.lastAdWatchTime;
        const timeRemaining = cooldownMs - timeSinceLastAd;
        
        if (timeRemaining <= 0) return null;
        
        const hours = Math.floor(timeRemaining / (60 * 60 * 1000));
        const minutes = Math.floor((timeRemaining % (60 * 60 * 1000)) / (60 * 1000));
        const seconds = Math.floor((timeRemaining % (60 * 1000)) / 1000);
        
        return { hours, minutes, seconds, ms: timeRemaining };
    }

    // Simulate watching an ad (replace with actual ad SDK)
    async watchAd() {
        return new Promise((resolve) => {
            // Simulate ad loading and watching
            setTimeout(() => {
                this.lastAdWatchTime = Date.now();
                localStorage.setItem('gtoAdWatchTime', this.lastAdWatchTime.toString());
                resolve(true);
            }, 2000); // Simulate 2 second ad
        });
    }

    // Format time remaining
    formatTimeRemaining() {
        const time = this.getTimeUntilNextAd();
        if (!time) return '0:00:00';
        
        const h = time.hours.toString().padStart(1, '0');
        const m = time.minutes.toString().padStart(2, '0');
        const s = time.seconds.toString().padStart(2, '0');
        
        return `${h}:${m}:${s}`;
    }
}

// Export for use in game.js
if (typeof module !== 'undefined' && module.exports) {
    module.exports = { UserManager, AdManager };
}
