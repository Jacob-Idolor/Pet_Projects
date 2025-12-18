/**
 * Configuration Module
 * Central configuration for the entire app
 * Extensible for future game stages (turn, river)
 */

const APP_CONFIG = {
    // App Info
    APP_NAME: 'GTO Poker Trainer',
    VERSION: '2.0.0',
    STAGE: 'PREFLOP', // Future: 'TURN', 'RIVER', 'COMPLETE'
    
    // Game Settings
    GAME: {
        INITIAL_RUNS: 10,
        RUNS_PER_DAY: 10,
        AD_BONUS_RUNS: 5,
        AD_COOLDOWN_HOURS: 12,
        POSITIONS: ['UTG', 'UTG+1', 'MP', 'MP+1', 'HJ', 'CO', 'BTN', 'SB', 'BB'],
        MAX_POSITION_PLAYERS: 9
    },
    
    // AI Insights
    AI: {
        MIN_HANDS_FOR_INSIGHTS: 20,
        MIN_HANDS_PER_POSITION: 10,
        MAX_MISTAKES_STORED: 50,
        SKILL_THRESHOLDS: {
            EXPERT: 85,
            ADVANCED: 75,
            INTERMEDIATE: 65,
            BEGINNER: 50
        },
        TENDENCY_THRESHOLD: 0.60,
        STRENGTH_THRESHOLD: 0.80,
        WEAKNESS_THRESHOLD: 0.65
    },
    
    // Storage Keys
    STORAGE: {
        BEST_STREAK: 'gtoPokerBestStreak',
        DAILY_RUNS: 'gtoPokerDailyRuns',
        LAST_RESET: 'gtoPokerLastReset',
        AD_LAST_WATCHED: 'gtoPokerAdLastWatched',
        USER_STATS: 'gtoPokerUserStats',
        CURRENT_USER: 'gtoPokerCurrentUser',
        SETTINGS: 'gtoPokerSettings'
    },
    
    // UI Settings
    UI: {
        ANIMATION_SPEED: 300,
        CARD_FLIP_SPEED: 200,
        TOAST_DURATION: 3000,
        MOBILE_BREAKPOINT: 768
    },
    
    // Feature Flags (for future expansion)
    FEATURES: {
        PREFLOP: true,
        TURN: false,      // Future
        RIVER: false,     // Future
        MULTI_STREET: false, // Future
        TOURNAMENTS: false,  // Future
        CASH_GAME: true,
        AI_INSIGHTS: true,
        LEADERBOARDS: false, // Future with Firebase
        ACHIEVEMENTS: false  // Future
    },
    
    // Error Messages
    ERRORS: {
        NO_USER: 'Please log in to continue',
        NO_RUNS: 'Out of daily runs',
        INVALID_POSITION: 'Invalid position selected',
        STORAGE_FULL: 'Storage limit reached',
        NETWORK_ERROR: 'Network connection issue'
    }
};

// Export for use in other modules
if (typeof module !== 'undefined' && module.exports) {
    module.exports = APP_CONFIG;
}
