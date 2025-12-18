// AI-Powered Insights Engine
// Analyzes player performance and provides personalized feedback

class PokerInsightsAI {
    constructor() {
        this.minHandsForInsights = 20; // Need at least 20 hands for reliable insights
        this.tendencyThresholds = {
            tooTight: 0.75,      // Folding >75% of correct raises
            tooLoose: 0.75,      // Raising >75% of correct folds
            aggressive: 0.70,    // All-in/Raise >70% when call is correct
            passive: 0.70,       // Call >70% when raise is correct
            scared: 0.60         // Folding >60% when call/raise is correct
        };
    }

    // Main method to generate insights for a user
    generateInsights(userStats, userManager = null) {
        // Get aggregated mistake patterns if userManager is available
        const mistakePatterns = userManager ? userManager.getMistakePatterns() : null;
        const recentPerformance = userManager ? userManager.getRecentPerformance() : null;
        
        const insights = {
            overall: this.generateOverallInsights(userStats, recentPerformance),
            byPosition: this.generatePositionInsights(userStats),
            tendencies: this.detectTendencies(userStats, mistakePatterns),
            recommendations: this.generateRecommendations(userStats, mistakePatterns),
            strengths: this.identifyStrengths(userStats),
            weaknesses: this.identifyWeaknesses(userStats),
            mistakePatterns: mistakePatterns,
            recentTrend: recentPerformance
        };

        return insights;
    }

    // Overall performance insights
    generateOverallInsights(userStats, recentPerformance = null) {
        const totalHands = userStats.totalHandsPlayed || 0;
        const accuracy = userStats.totalCorrect / totalHands || 0;
        
        if (totalHands < this.minHandsForInsights) {
            return {
                message: `Play ${this.minHandsForInsights - totalHands} more hands to unlock AI insights`,
                level: 'insufficient_data'
            };
        }

        let level, message, emoji, trendMessage = '';
        
        // Add recent performance trend
        if (recentPerformance && recentPerformance.trend !== 'insufficient_data') {
            if (recentPerformance.trend === 'improving') {
                trendMessage = ' 📈 Recent performance is improving!';
            } else if (recentPerformance.trend === 'declining') {
                trendMessage = ' 📉 Take a break if needed - stay focused.';
            }
        }
        
        if (accuracy >= 0.85) {
            level = 'expert';
            emoji = '🏆';
            message = 'Exceptional GTO understanding! You\'re playing at a very high level.' + trendMessage;
        } else if (accuracy >= 0.75) {
            level = 'advanced';
            emoji = '⭐';
            message = 'Strong GTO fundamentals. You understand position-based ranges well.' + trendMessage;
        } else if (accuracy >= 0.65) {
            level = 'intermediate';
            emoji = '📈';
            message = 'Good progress! Focus on your weakest positions for improvement.' + trendMessage;
        } else if (accuracy >= 0.50) {
            level = 'beginner';
            emoji = '📚';
            message = 'Building fundamentals. Review GTO ranges for each position.' + trendMessage;
        } else {
            level = 'learning';
            emoji = '🎓';
            message = 'Keep practicing! Click the ℹ️ button to review position strategies.' + trendMessage;
        }

        return { level, emoji, message, accuracy, totalHands, recentPerformance };
    }

    // Position-specific insights
    generatePositionInsights(userStats) {
        const positionInsights = {};
        const positions = ['UTG', 'UTG1', 'MP', 'MP2', 'HJ', 'CO', 'BTN', 'SB', 'BB'];

        positions.forEach(pos => {
            const posData = userStats.positionStats?.[pos];
            if (!posData || posData.played < 10) {
                positionInsights[pos] = {
                    status: 'insufficient_data',
                    message: `Play 10+ hands from ${pos} to unlock insights`
                };
                return;
            }

            const accuracy = posData.correct / posData.played;
            const mistakes = this.analyzePositionMistakes(pos, posData);
            const insight = this.generatePositionInsight(pos, accuracy, mistakes);

            positionInsights[pos] = {
                accuracy,
                played: posData.played,
                correct: posData.correct,
                mistakes,
                insight
            };
        });

        return positionInsights;
    }

    // Analyze specific mistakes by position
    analyzePositionMistakes(position, posData) {
        const mistakes = {
            tooTight: 0,        // Folding when should raise
            tooLoose: 0,        // Raising when should fold
            wrongAction: 0,     // Wrong action type (call vs raise, etc.)
            marginalErrors: 0   // Close decisions, forgivable
        };

        // Analyze mistake patterns from detailed stats
        if (posData.mistakes) {
            posData.mistakes.forEach(mistake => {
                if (mistake.correctAction === 'raise' && mistake.playerAction === 'fold') {
                    mistakes.tooTight++;
                } else if (mistake.correctAction === 'fold' && mistake.playerAction === 'raise') {
                    mistakes.tooLoose++;
                } else if (mistake.correctAction !== mistake.playerAction) {
                    mistakes.wrongAction++;
                }

                // Check if it's a marginal error (hand is close to borderline)
                if (mistake.isMarginal) {
                    mistakes.marginalErrors++;
                }
            });
        }

        return mistakes;
    }

    // Generate specific insight for a position
    generatePositionInsight(position, accuracy, mistakes) {
        const posInfo = this.getPositionInfo(position);
        let insight = {
            emoji: '✅',
            title: '',
            message: '',
            tips: []
        };

        // Accuracy-based insights
        if (accuracy >= 0.85) {
            insight.emoji = '🎯';
            insight.title = `Mastering ${posInfo.name}`;
            insight.message = `Excellent performance from ${position}! You understand this position well.`;
        } else if (accuracy >= 0.70) {
            insight.emoji = '👍';
            insight.title = `Solid ${posInfo.name} Play`;
            insight.message = `Good understanding of ${position}. Minor adjustments needed.`;
        } else {
            insight.emoji = '⚠️';
            insight.title = `${posInfo.name} Needs Work`;
            insight.message = `Focus area: ${position} (${posInfo.difficulty} position)`;
        }

        // Mistake pattern insights
        const totalMistakes = mistakes.tooTight + mistakes.tooLoose + mistakes.wrongAction;
        if (totalMistakes > 0) {
            const tightPercentage = mistakes.tooTight / totalMistakes;
            const loosePercentage = mistakes.tooLoose / totalMistakes;

            if (tightPercentage > 0.6) {
                insight.tendency = 'too_tight';
                insight.tips.push(`You're folding too much from ${position}`);
                insight.tips.push(`${posInfo.vpip} is the target VPIP - you can open more hands`);
                insight.tips.push('Review the opening range and add marginal hands');
            } else if (loosePercentage > 0.6) {
                insight.tendency = 'too_loose';
                insight.tips.push(`You're playing too many hands from ${position}`);
                insight.tips.push(`Remember: ${posInfo.playersAfter} players can still act behind you`);
                insight.tips.push('Tighten up - not all hands are profitable from this position');
            } else {
                insight.tendency = 'inconsistent';
                insight.tips.push('Mixed mistakes - sometimes too tight, sometimes too loose');
                insight.tips.push('Focus on memorizing the exact range for this position');
                insight.tips.push(`Click ℹ️ on ${position} to review the strategy`);
            }
        }

        // Position-specific advice
        insight.tips.push(...this.getPositionSpecificTips(position, mistakes));

        return insight;
    }

    // Get position-specific tips based on mistakes
    getPositionSpecificTips(position, mistakes) {
        const tips = [];
        const posInfo = this.getPositionInfo(position);

        switch(position) {
            case 'UTG':
            case 'UTG1':
                if (mistakes.tooLoose > mistakes.tooTight) {
                    tips.push('Early position = tight is right. Play only premium hands');
                    tips.push('You have 7-8 players behind you - fold marginal hands');
                }
                break;
            
            case 'MP':
            case 'MP2':
                tips.push('Middle position is about balance - not too tight, not too loose');
                if (mistakes.tooTight > 0) {
                    tips.push('You can start adding suited connectors and small pairs');
                }
                break;
            
            case 'HJ':
            case 'CO':
                if (mistakes.tooTight > mistakes.tooLoose) {
                    tips.push('Late position - steal those blinds! Open wider');
                    tips.push('Position is power - you can play more hands here');
                }
                break;
            
            case 'BTN':
                if (mistakes.tooTight > 0) {
                    tips.push('Button = most profitable position. Open 40-50% of hands!');
                    tips.push('Almost any ace, any pair, any suited connector is profitable');
                }
                break;
            
            case 'SB':
                tips.push('SB is complex: wide vs BB, tight vs opens');
                tips.push('Remember: you\'re out of position on all post-flop streets');
                break;
            
            case 'BB':
                tips.push('BB gets great pot odds - defend wider vs late position');
                tips.push('Tighten up vs early position raises');
                break;
        }

        return tips;
    }

    // Detect overall playing tendencies
    detectTendencies(userStats, mistakePatterns = null) {
        const tendencies = [];
        const positions = ['UTG', 'UTG1', 'MP', 'MP2', 'HJ', 'CO', 'BTN', 'SB', 'BB'];
        
        // Use aggregated patterns if available
        if (mistakePatterns) {
            const actionTendencies = mistakePatterns.actionTendencies;
            const totalActionMistakes = actionTendencies.tooTight + actionTendencies.tooLoose + actionTendencies.wrongSizing;
            
            if (totalActionMistakes > 10) {
                if (actionTendencies.tooTight > actionTendencies.tooLoose * 1.5) {
                    tendencies.push({
                        type: 'too_tight',
                        emoji: '🛑',
                        title: 'Playing Too Tight Overall',
                        description: `You've folded ${actionTendencies.tooTight} hands that should have been raises. GTO requires playing wider ranges, especially from late position.`,
                        fix: 'Trust the ranges. If a hand is in the opening range, play it!',
                        severity: 'high'
                    });
                } else if (actionTendencies.tooLoose > actionTendencies.tooTight * 1.5) {
                    tendencies.push({
                        type: 'too_loose',
                        emoji: '🎰',
                        title: 'Playing Too Many Hands',
                        description: `You've raised ${actionTendencies.tooLoose} hands that should have been folds. Remember: position determines range.`,
                        fix: 'Tighten up from early position. Not all hands are playable from UTG/MP.',
                        severity: 'high'
                    });
                }
            }
            
            // Analyze most common mistakes
            const sortedMistakes = Object.entries(mistakePatterns.commonMistakes)
                .sort((a, b) => b[1] - a[1])
                .slice(0, 3);
            
            if (sortedMistakes.length > 0 && sortedMistakes[0][1] >= 3) {
                tendencies.push({
                    type: 'repeated_mistakes',
                    emoji: '🔄',
                    title: 'Repeating Same Mistakes',
                    description: `You've made the same mistake with ${sortedMistakes[0][0]} ${sortedMistakes[0][1]} times. This hand needs extra attention!`,
                    fix: `Review the correct play for ${sortedMistakes[0][0]} from different positions.`,
                    severity: 'medium'
                });
            }
            
            // Hand type analysis
            const handTypeErrors = mistakePatterns.handTypeErrors;
            const totalHandErrors = handTypeErrors.premiumHands + handTypeErrors.marginalHands + handTypeErrors.trashHands;
            
            if (totalHandErrors > 10) {
                if (handTypeErrors.trashHands > totalHandErrors * 0.5) {
                    tendencies.push({
                        type: 'trash_hand_mistakes',
                        emoji: '🗑️',
                        title: 'Trouble with Trash Hands',
                        description: 'Most of your mistakes are with weak hands. Remember: most hands are folds!',
                        fix: 'When in doubt with weak hands (7-2, J-3, etc.), just fold from early/mid position.',
                        severity: 'medium'
                    });
                } else if (handTypeErrors.premiumHands > 3) {
                    tendencies.push({
                        type: 'premium_mistakes',
                        emoji: '💎',
                        title: 'Missing Premium Hands',
                        description: `You've made ${handTypeErrors.premiumHands} mistakes with premium hands (AA, KK, AK, etc.). These should always be raises!`,
                        fix: 'Always raise/3-bet with AA, KK, QQ, AKs, AKo from any position.',
                        severity: 'high'
                    });
                } else if (handTypeErrors.marginalHands > totalHandErrors * 0.6) {
                    tendencies.push({
                        type: 'marginal_struggles',
                        emoji: '⚖️',
                        title: 'Marginal Hand Decisions',
                        description: 'You struggle with borderline hands - the tough decisions at the edge of ranges.',
                        fix: 'Study the exact cutoff points for each position. Use the ℹ️ button for guidance.',
                        severity: 'low'
                    });
                }
            }
        } else {
            // Fallback to original logic if no patterns available
            let totalTooTight = 0;
            let totalTooLoose = 0;
            let totalHands = 0;

            positions.forEach(pos => {
                const posData = userStats.positionStats?.[pos];
                if (posData && posData.played >= 10) {
                    totalHands += posData.played;
                    if (posData.mistakes) {
                        posData.mistakes.forEach(m => {
                            if (m.correctAction === 'raise' && m.playerAction === 'fold') totalTooTight++;
                            if (m.correctAction === 'fold' && m.playerAction === 'raise') totalTooLoose++;
                        });
                    }
                }
            });

            const totalMistakes = totalTooTight + totalTooLoose;
            if (totalMistakes > 10) {
                if (totalTooTight > totalTooLoose * 1.5) {
                    tendencies.push({
                        type: 'too_tight',
                        emoji: '🛑',
                        title: 'Playing Too Tight Overall',
                        description: 'You\'re folding too many profitable hands. GTO requires playing wider ranges, especially from late position.',
                        fix: 'Trust the ranges. If a hand is in the opening range, play it!',
                        severity: 'medium'
                    });
                } else if (totalTooLoose > totalTooTight * 1.5) {
                    tendencies.push({
                        type: 'too_loose',
                        emoji: '🎰',
                        title: 'Playing Too Many Hands',
                        description: 'You\'re opening too wide, especially from early position. Remember: position determines range.',
                        fix: 'Tighten up from early position. Not all hands are playable from UTG/MP.',
                        severity: 'medium'
                    });
                }
            }
        }

        // Position awareness tendency
        const earlyPosAccuracy = this.getPositionGroupAccuracy(userStats, ['UTG', 'UTG1', 'MP']);
        const latePosAccuracy = this.getPositionGroupAccuracy(userStats, ['CO', 'BTN']);

        if (earlyPosAccuracy > 0 && latePosAccuracy > 0) {
            if (latePosAccuracy < earlyPosAccuracy - 0.15) {
                tendencies.push({
                    type: 'not_aggressive_enough',
                    emoji: '📉',
                    title: 'Not Exploiting Late Position',
                    description: 'You play well from early position but aren\'t taking advantage of late position power.',
                    fix: 'Open MUCH wider from CO and BTN. Steal those blinds relentlessly!'
                });
            } else if (earlyPosAccuracy < latePosAccuracy - 0.15) {
                tendencies.push({
                    type: 'early_position_struggle',
                    emoji: '⚠️',
                    title: 'Early Position Struggles',
                    description: 'You\'re doing well from late position but making mistakes from early position.',
                    fix: 'Play tighter from UTG/MP. Review the early position ranges carefully.'
                });
            }
        }

        return tendencies;
    }

    // Calculate accuracy for a group of positions
    getPositionGroupAccuracy(userStats, positions) {
        let totalCorrect = 0;
        let totalPlayed = 0;

        positions.forEach(pos => {
            const posData = userStats.positionStats?.[pos];
            if (posData && posData.played >= 5) {
                totalCorrect += posData.correct;
                totalPlayed += posData.played;
            }
        });

        return totalPlayed > 0 ? totalCorrect / totalPlayed : 0;
    }

    // Identify player strengths
    identifyStrengths(userStats) {
        const strengths = [];
        const positions = ['UTG', 'UTG1', 'MP', 'MP2', 'HJ', 'CO', 'BTN', 'SB', 'BB'];

        // Find positions with >80% accuracy and >10 hands
        positions.forEach(pos => {
            const posData = userStats.positionStats?.[pos];
            if (posData && posData.played >= 10) {
                const accuracy = posData.correct / posData.played;
                if (accuracy >= 0.80) {
                    const posInfo = this.getPositionInfo(pos);
                    strengths.push({
                        position: pos,
                        name: posInfo.name,
                        accuracy: accuracy,
                        emoji: posInfo.difficulty === 'Hard' ? '🏆' : '⭐',
                        message: `Strong ${posInfo.name} play (${(accuracy * 100).toFixed(1)}% accuracy)`
                    });
                }
            }
        });

        // Sort by difficulty (hardest positions = most impressive)
        strengths.sort((a, b) => {
            const difficultyScore = { 'Hard': 3, 'Medium': 2, 'Easy': 1, 'Medium-Easy': 1.5 };
            const aInfo = this.getPositionInfo(a.position);
            const bInfo = this.getPositionInfo(b.position);
            return (difficultyScore[bInfo.difficulty] || 0) - (difficultyScore[aInfo.difficulty] || 0);
        });

        return strengths;
    }

    // Identify player weaknesses
    identifyWeaknesses(userStats) {
        const weaknesses = [];
        const positions = ['UTG', 'UTG1', 'MP', 'MP2', 'HJ', 'CO', 'BTN', 'SB', 'BB'];

        // Find positions with <65% accuracy and >10 hands
        positions.forEach(pos => {
            const posData = userStats.positionStats?.[pos];
            if (posData && posData.played >= 10) {
                const accuracy = posData.correct / posData.played;
                if (accuracy < 0.65) {
                    const posInfo = this.getPositionInfo(pos);
                    const mistakes = this.analyzePositionMistakes(pos, posData);
                    const primaryIssue = this.identifyPrimaryIssue(mistakes);
                    
                    weaknesses.push({
                        position: pos,
                        name: posInfo.name,
                        accuracy: accuracy,
                        emoji: '🎯',
                        primaryIssue,
                        message: `Practice ${posInfo.name} - ${primaryIssue.description}`,
                        priority: this.calculatePriority(accuracy, posData.played)
                    });
                }
            }
        });

        // Sort by priority (lowest accuracy + most hands = highest priority)
        weaknesses.sort((a, b) => b.priority - a.priority);

        return weaknesses;
    }

    // Identify the primary issue from mistakes
    identifyPrimaryIssue(mistakes) {
        const total = mistakes.tooTight + mistakes.tooLoose + mistakes.wrongAction;
        if (total === 0) return { type: 'none', description: 'No clear pattern' };

        if (mistakes.tooTight > mistakes.tooLoose && mistakes.tooTight > mistakes.wrongAction) {
            return { 
                type: 'too_tight', 
                description: 'folding too many profitable hands',
                fix: 'Open wider - trust the GTO ranges'
            };
        } else if (mistakes.tooLoose > mistakes.tooTight && mistakes.tooLoose > mistakes.wrongAction) {
            return { 
                type: 'too_loose', 
                description: 'playing too many unprofitable hands',
                fix: 'Tighten up - respect position'
            };
        } else {
            return { 
                type: 'inconsistent', 
                description: 'inconsistent decision-making',
                fix: 'Review and memorize the opening range'
            };
        }
    }

    // Calculate priority for fixing a weakness
    calculatePriority(accuracy, handsPlayed) {
        // Lower accuracy + more hands = higher priority to fix
        const accuracyScore = (1 - accuracy) * 100; // 0-100
        const volumeScore = Math.min(handsPlayed / 20, 1) * 50; // 0-50
        return accuracyScore + volumeScore;
    }

    // Generate personalized recommendations
    generateRecommendations(userStats) {
        const recommendations = [];
        const weaknesses = this.identifyWeaknesses(userStats);
        const tendencies = this.detectTendencies(userStats);

        // Recommendation based on biggest weakness
        if (weaknesses.length > 0) {
            const topWeakness = weaknesses[0];
            recommendations.push({
                priority: 'high',
                emoji: '🎯',
                title: `Focus on ${topWeakness.name}`,
                description: `Your weakest position (${(topWeakness.accuracy * 100).toFixed(1)}% accuracy)`,
                action: `Use "Choose Position" mode and drill ${topWeakness.position}`,
                expectedImprovement: 'This could boost your overall accuracy by 5-10%'
            });
        }

        // Recommendation based on tendencies
        if (tendencies.length > 0) {
            const topTendency = tendencies[0];
            recommendations.push({
                priority: 'medium',
                emoji: topTendency.emoji,
                title: topTendency.title,
                description: topTendency.description,
                action: topTendency.fix,
                expectedImprovement: 'Fixing this will improve your overall game'
            });
        }

        // General recommendations based on volume
        const totalHands = userStats.totalHandsPlayed || 0;
        if (totalHands < 50) {
            recommendations.push({
                priority: 'low',
                emoji: '🎮',
                title: 'Keep Practicing',
                description: 'Play more hands to build muscle memory',
                action: 'Complete 50+ hands to get deeper insights',
                expectedImprovement: 'More data = better AI analysis'
            });
        } else if (totalHands >= 100) {
            recommendations.push({
                priority: 'low',
                emoji: '📊',
                title: 'Advanced Training',
                description: 'You have solid fundamentals',
                action: 'Focus on drilling your weakest 2-3 positions',
                expectedImprovement: 'Master every position for complete GTO play'
            });
        }

        return recommendations;
    }

    // Get position info from GTO_DATA
    getPositionInfo(position) {
        // Default fallback
        const defaults = {
            name: position,
            vpip: 'N/A',
            playersAfter: 0,
            difficulty: 'Medium'
        };

        if (typeof GTO_DATA === 'undefined' || !GTO_DATA.positions) {
            return defaults;
        }

        const posData = GTO_DATA.positions[position];
        return posData || defaults;
    }

    // Generate a formatted insight card for display
    formatInsightCard(insights) {
        return {
            overall: insights.overall,
            topStrength: insights.strengths[0] || null,
            topWeakness: insights.weaknesses[0] || null,
            topRecommendation: insights.recommendations[0] || null,
            topTendency: insights.tendencies[0] || null
        };
    }

    // Get a motivational message based on progress
    getMotivationalMessage(userStats) {
        const accuracy = userStats.totalCorrect / userStats.totalHandsPlayed || 0;
        const streak = userStats.longestStreak || 0;

        if (streak >= 20) {
            return '🔥 Unstoppable! You\'re on fire!';
        } else if (streak >= 10) {
            return '💪 Great streak! Keep it going!';
        } else if (accuracy >= 0.80) {
            return '⭐ Excellent GTO understanding!';
        } else if (accuracy >= 0.70) {
            return '📈 You\'re improving steadily!';
        } else if (userStats.totalHandsPlayed >= 50) {
            return '🎯 Focus on your weak spots!';
        } else {
            return '🚀 Keep practicing - you\'re learning!';
        }
    }
}

// Export for use in other files
if (typeof module !== 'undefined' && module.exports) {
    module.exports = PokerInsightsAI;
}
