/**
 * PreFlop Engine Module
 * Core game logic for pre-flop scenarios
 * Separated for future expansion (turn, river engines)
 */

class PreFlopEngine {
    constructor(gtoData) {
        this.gtoData = gtoData;
        this.currentScenario = null;
    }
    
    /**
     * Generate a random pre-flop scenario
     * @param {string|null} position - Specific position or null for random
     * @returns {Object} Scenario object
     */
    generateScenario(position = null) {
        const selectedPosition = position || this.getRandomPosition();
        const hand = this.getRandomHand();
        const scenario = this.gtoData.positions[selectedPosition];
        
        if (!scenario) {
            throw new Error(`Invalid position: ${selectedPosition}`);
        }
        
        const correctAction = this.getCorrectAction(hand, selectedPosition);
        
        this.currentScenario = {
            position: selectedPosition,
            hand,
            correctAction,
            scenario,
            availableActions: this.getAvailableActions(selectedPosition),
            timestamp: Date.now()
        };
        
        return this.currentScenario;
    }
    
    /**
     * Get random position from available positions
     */
    getRandomPosition() {
        const positions = APP_CONFIG.GAME.POSITIONS;
        return positions[Math.floor(Math.random() * positions.length)];
    }
    
    /**
     * Get random hand
     */
    getRandomHand() {
        const suits = ['♠', '♥', '♦', '♣'];
        const ranks = ['A', 'K', 'Q', 'J', 'T', '9', '8', '7', '6', '5', '4', '3', '2'];
        
        const rank1 = ranks[Math.floor(Math.random() * ranks.length)];
        const rank2 = ranks[Math.floor(Math.random() * ranks.length)];
        const suit1 = suits[Math.floor(Math.random() * suits.length)];
        const suit2 = suits[Math.floor(Math.random() * suits.length)];
        
        return {
            card1: { rank: rank1, suit: suit1 },
            card2: { rank: rank2, suit: suit2 },
            display: this.getHandNotation(rank1, rank2, suit1 === suit2)
        };
    }
    
    /**
     * Convert hand to poker notation (e.g., "AKs", "QQ", "72o")
     */
    getHandNotation(rank1, rank2, suited) {
        const ranks = ['A', 'K', 'Q', 'J', 'T', '9', '8', '7', '6', '5', '4', '3', '2'];
        const r1Index = ranks.indexOf(rank1);
        const r2Index = ranks.indexOf(rank2);
        
        // Pair
        if (rank1 === rank2) {
            return `${rank1}${rank2}`;
        }
        
        // Order by rank (higher first)
        const highCard = r1Index < r2Index ? rank1 : rank2;
        const lowCard = r1Index < r2Index ? rank2 : rank1;
        
        return `${highCard}${lowCard}${suited ? 's' : 'o'}`;
    }
    
    /**
     * Get correct GTO action for a hand in a position
     */
    getCorrectAction(hand, position) {
        const positionData = this.gtoData.positions[position];
        if (!positionData) {
            return 'fold'; // Default fallback
        }
        
        const handNotation = hand.display;
        
        // Check each action range
        for (const action of ['raise', 'call', 'fold']) {
            const range = positionData.ranges[action];
            if (range && this.isHandInRange(handNotation, range)) {
                return action;
            }
        }
        
        return 'fold'; // Default if not found
    }
    
    /**
     * Check if hand is in a range
     */
    isHandInRange(handNotation, range) {
        if (!Array.isArray(range)) return false;
        return range.includes(handNotation);
    }
    
    /**
     * Get available actions for a position
     */
    getAvailableActions(position) {
        const positionData = this.gtoData.positions[position];
        if (!positionData) return ['fold', 'call', 'raise'];
        
        const actions = [];
        if (positionData.ranges.fold) actions.push('fold');
        if (positionData.ranges.call) actions.push('call');
        if (positionData.ranges.raise) actions.push('raise');
        
        // Always include all in as option
        actions.push('allin');
        
        return actions;
    }
    
    /**
     * Validate player action
     */
    validateAction(playerAction) {
        if (!this.currentScenario) {
            throw new Error('No active scenario');
        }
        
        const correct = playerAction === this.currentScenario.correctAction;
        
        return {
            correct,
            playerAction,
            correctAction: this.currentScenario.correctAction,
            hand: this.currentScenario.hand.display,
            position: this.currentScenario.position,
            explanation: this.getExplanation(correct)
        };
    }
    
    /**
     * Get explanation for the correct action
     */
    getExplanation(correct) {
        const { position, hand, correctAction, scenario } = this.currentScenario;
        
        if (correct) {
            return `Correct! From ${position}, ${hand.display} is a ${correctAction}. ${scenario.strategy}`;
        } else {
            return `From ${position}, ${hand.display} should ${correctAction}. ${scenario.strategy}`;
        }
    }
    
    /**
     * Check if hand is marginal (close decision)
     */
    isHandMarginal(handNotation, position) {
        const positionData = this.gtoData.positions[position];
        if (!positionData || !positionData.marginalHands) {
            return false;
        }
        
        return positionData.marginalHands.includes(handNotation);
    }
    
    /**
     * Get position information
     */
    getPositionInfo(position) {
        return this.gtoData.positions[position] || null;
    }
    
    /**
     * Get all positions
     */
    getAllPositions() {
        return APP_CONFIG.GAME.POSITIONS.map(pos => ({
            name: pos,
            data: this.gtoData.positions[pos]
        }));
    }
    
    /**
     * Get current scenario
     */
    getCurrentScenario() {
        return this.currentScenario;
    }
    
    /**
     * Reset engine
     */
    reset() {
        this.currentScenario = null;
    }
    
    /**
     * Get statistics about ranges
     */
    getPositionStats(position) {
        const positionData = this.gtoData.positions[position];
        if (!positionData) return null;
        
        const raiseRange = positionData.ranges.raise?.length || 0;
        const callRange = positionData.ranges.call?.length || 0;
        const foldRange = positionData.ranges.fold?.length || 0;
        const total = raiseRange + callRange + foldRange;
        
        return {
            position,
            raisePercentage: total > 0 ? ((raiseRange / total) * 100).toFixed(1) : 0,
            callPercentage: total > 0 ? ((callRange / total) * 100).toFixed(1) : 0,
            foldPercentage: total > 0 ? ((foldRange / total) * 100).toFixed(1) : 0,
            vpip: raiseRange + callRange, // Voluntarily put money in pot
            pfr: raiseRange, // Pre-flop raise
            description: positionData.description
        };
    }
}

// Export
if (typeof module !== 'undefined' && module.exports) {
    module.exports = PreFlopEngine;
}
