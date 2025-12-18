// GTO Chart Data - 9-Max Table (9 players)
// Positions ordered from earliest to latest (worst to best)

const GTO_DATA = {
    // Table configuration
    tableSize: 9, // Standard 9-max online poker table
    
    positions: {
        UTG: {
            name: 'Under the Gun',
            fullName: 'UTG (Under the Gun)',
            description: 'First to act - tightest range',
            players: 9,
            playersAfter: 8,
            difficulty: 'Hard',
            vpip: '10-12%', // Voluntarily Put $ In Pot
            rangeDescription: 'Only premium hands - you have 8 players left to act',
            gtoExplanation: 'UTG is the hardest position because you act first with 8 players behind you. Any player can wake up with a premium hand and you\'ll be out of position post-flop. GTO strategy: Play ultra-tight, only strong hands that can handle 3-bets.',
            keyPoints: [
                '8 players can 3-bet you',
                'Always out of position post-flop (except vs blinds)',
                'Must play strongest ~10% of hands',
                'High 3-bet % from players behind',
                'Position is king - you have none'
            ],
            profitability: 'Lowest',
            color: '#ef4444'
        },
        UTG1: {
            name: 'UTG+1',
            fullName: 'UTG+1 (Under the Gun +1)',
            description: 'Second to act - very tight range',
            players: 9,
            playersAfter: 7,
            difficulty: 'Hard',
            vpip: '11-13%',
            rangeDescription: 'Still tight - 7 players to act behind',
            gtoExplanation: 'Slightly better than UTG but still early position. You can add a few more hands to your range (suited connectors, small pairs) but still need to be very selective. One less player to worry about, but position is still terrible.',
            keyPoints: [
                '7 players left to act',
                'Can add suited broadway hands',
                'Still mostly out of position',
                'Small edge over UTG',
                'Fold to 3-bets often'
            ],
            profitability: 'Very Low',
            color: '#f97316'
        },
        MP: {
            name: 'Middle Position',
            fullName: 'MP (Middle Position)',
            description: 'Middle of the pack - balanced range',
            players: 9,
            playersAfter: 6,
            difficulty: 'Medium',
            vpip: '13-16%',
            rangeDescription: 'Can start opening more hands - 6 players behind',
            gtoExplanation: 'True middle position. You can start opening more speculative hands like suited connectors and small pocket pairs. Still have late position players behind you, but the field is thinning. Balance between tight and aggressive.',
            keyPoints: [
                '6 players behind (still risky)',
                'Can open suited connectors',
                'Mix of IP and OOP post-flop',
                'Start playing more aggressively',
                'Consider stack sizes'
            ],
            profitability: 'Below Average',
            color: '#f59e0b'
        },
        MP2: {
            name: 'Middle Position +1',
            fullName: 'MP+1 (Middle Position +1)',
            description: 'Late-middle position - open more',
            players: 9,
            playersAfter: 5,
            difficulty: 'Medium',
            vpip: '15-18%',
            rangeDescription: 'Expanding range - only 5 players left',
            gtoExplanation: 'The transition zone to late position. You can start opening wider with suited aces, more broadway hands, and connected cards. CO and BTN are the main threats now. You\'ll have position on blinds and early position post-flop.',
            keyPoints: [
                'Only 5 players to worry about',
                'Open suited aces (A5s-A9s)',
                'Good position vs blinds',
                'CO and BTN are threats',
                'Steal attempts increase'
            ],
            profitability: 'Average',
            color: '#eab308'
        },
        HJ: {
            name: 'Hijack',
            fullName: 'HJ (Hijack)',
            description: 'Late position - aggressive opens',
            players: 9,
            playersAfter: 4,
            difficulty: 'Medium-Easy',
            vpip: '18-22%',
            rangeDescription: 'First late position seat - steal blinds',
            gtoExplanation: 'Hijack is where late position play begins. You have just 4 players behind, and you\'ll have position on everyone except CO and BTN. This is where aggressive blind stealing starts. Open wide, especially vs weak blinds.',
            keyPoints: [
                'First seat of "late position"',
                'Only 4 players behind',
                'Start blind stealing',
                'Open 20%+ of hands',
                'Position advantage increases'
            ],
            profitability: 'Above Average',
            color: '#a3e635'
        },
        CO: {
            name: 'Cutoff',
            fullName: 'CO (Cutoff)',
            description: 'Second best position - steal aggressively',
            players: 9,
            playersAfter: 3,
            difficulty: 'Easy',
            vpip: '24-28%',
            rangeDescription: 'Very wide range - only BTN and blinds left',
            gtoExplanation: 'Cutoff is the second most profitable position. Only BTN and the blinds are behind you. You can open VERY wide here - suited connectors, one-gappers, weak aces. The blinds will fold often, and you\'ll have position post-flop.',
            keyPoints: [
                'Only 3 players behind',
                'Open 25%+ of hands',
                'Aggressive blind stealing',
                'BTN can squeeze you',
                'Highly profitable long-term'
            ],
            profitability: 'High',
            color: '#22c55e'
        },
        BTN: {
            name: 'Button',
            fullName: 'BTN (Button)',
            description: 'Best position - widest opening range',
            players: 9,
            playersAfter: 2,
            difficulty: 'Easy',
            vpip: '40-50%',
            rangeDescription: 'Widest range - last to act pre and post-flop',
            gtoExplanation: 'The Button is the MOST PROFITABLE position in poker. You act last pre-flop and on every post-flop street. You can open nearly 50% of hands here. Steal blinds relentlessly. Position is everything - and you have maximum position.',
            keyPoints: [
                'Most profitable position in poker',
                'Last to act on all streets',
                'Open 40-50% of hands',
                'Steal blinds aggressively',
                'Can play speculative hands',
                'Maximum information advantage'
            ],
            profitability: 'Highest',
            color: '#10b981'
        },
        SB: {
            name: 'Small Blind',
            fullName: 'SB (Small Blind)',
            description: 'Worst post-flop position - tight/aggressive',
            players: 9,
            playersAfter: 1,
            difficulty: 'Hard',
            vpip: '36-40% (vs BB), 15-25% (vs opens)',
            rangeDescription: 'Tricky position - already invested 0.5BB',
            gtoExplanation: 'Small Blind is deceptively hard. You have dead money in (0.5BB) so you can\'t just fold everything, but you\'re ALWAYS out of position post-flop except vs BB. Vs opens: play tight. Vs BB: steal aggressively. It\'s a tricky balance.',
            keyPoints: [
                'Worst position post-flop',
                'Already invested 0.5BB',
                'Out of position on all streets',
                'VS BB: Raise/fold aggressively',
                'VS opens: Tighten up significantly',
                'Most complex position strategically'
            ],
            profitability: 'Low (loses money long-term)',
            color: '#f97316'
        },
        BB: {
            name: 'Big Blind',
            fullName: 'BB (Big Blind)',
            description: 'Forced investment - defend wide vs single raises',
            players: 9,
            playersAfter: 0,
            difficulty: 'Medium',
            vpip: '40-60% (vs single raise)',
            rangeDescription: 'Already invested 1BB - defend wide vs steals',
            gtoExplanation: 'Big Blind is a defensive position. You already have 1BB invested, so you get great pot odds to call. Vs late position steals, defend VERY wide (even weak hands). You close the action pre-flop but act first post-flop. Position is bad, but price is right.',
            keyPoints: [
                'Already invested 1BB',
                'Close the action pre-flop',
                'Defend 40-60% vs single raises',
                'Pot odds justify wide calls',
                'Out of position post-flop',
                'VS late position: Defend aggressively'
            ],
            profitability: 'Low (loses money long-term)',
            color: '#ef4444'
        }
    },

    // Hand categories
    handCategories: {
        premiumPairs: ['AA', 'KK', 'QQ'],
        strongPairs: ['JJ', 'TT', '99'],
        mediumPairs: ['88', '77', '66'],
        smallPairs: ['55', '44', '33', '22'],
        premiumBroadway: ['AK', 'AQ', 'AJ', 'KQ'],
        suitedBroadway: ['AKs', 'AQs', 'AJs', 'ATs', 'KQs', 'KJs', 'QJs'],
        offSuitBroadway: ['AKo', 'AQo', 'AJo', 'KQo'],
        suitedConnectors: ['JTs', 'T9s', '98s', '87s', '76s', '65s'],
        weakAces: ['A9', 'A8', 'A7', 'A6', 'A5', 'A4', 'A3', 'A2'],
        trash: ['J2', 'T3', '94', '83', '72', '62']
    },

    // GTO Opening Ranges for 9-Max Table (unopened pot, 100BB deep)
    // Ranges get WIDER as you move from early to late position
    openingRanges: {
        // UTG: ~10% VPIP (Tightest)
        UTG: {
            raise: [
                'AA', 'KK', 'QQ', 'JJ', 'TT', '99', '88', '77',
                'AKs', 'AKo', 'AQs', 'AQo', 'AJs', 'ATs', 'A5s',
                'KQs', 'KJs',
                'QJs', 'JTs'
            ],
            fold: ['66', '55', '44', '33', '22', 'AJo', 'ATo', 'A9s', 'A8s', 'A7s', 'A6s', 'A4s', 'A3s', 'A2s', 
                   'KQo', 'KTs', 'K9s', 'QTs', 'Q9s', 'T9s', '98s', '87s', '76s', '65s']
        },
        
        // UTG+1: ~12% VPIP
        UTG1: {
            raise: [
                'AA', 'KK', 'QQ', 'JJ', 'TT', '99', '88', '77', '66',
                'AKs', 'AKo', 'AQs', 'AQo', 'AJs', 'ATs', 'A9s', 'A5s', 'A4s',
                'KQs', 'KJs', 'KTs',
                'QJs', 'QTs',
                'JTs', 'T9s'
            ],
            fold: ['55', '44', '33', '22', 'AJo', 'ATo', 'A8s', 'A7s', 'A6s', 'A3s', 'A2s',
                   'KQo', 'KJo', 'K9s', 'QJo', 'Q9s', '98s', '87s', '76s', '65s']
        },
        
        // MP: ~15% VPIP
        MP: {
            raise: [
                'AA', 'KK', 'QQ', 'JJ', 'TT', '99', '88', '77', '66', '55',
                'AKs', 'AKo', 'AQs', 'AQo', 'AJs', 'AJo', 'ATs', 'A9s', 'A8s', 'A7s', 'A5s', 'A4s', 'A3s', 'A2s',
                'KQs', 'KQo', 'KJs', 'KTs',
                'QJs', 'QTs',
                'JTs', 'T9s', '98s', '87s'
            ],
            fold: ['44', '33', '22', 'ATo', 'A6s', 'KJo', 'KTo', 'K9s', 'QJo', 'Q9s', 
                   'J9s', 'T8s', '76s', '65s', '54s']
        },
        
        // MP+1: ~18% VPIP
        MP2: {
            raise: [
                'AA', 'KK', 'QQ', 'JJ', 'TT', '99', '88', '77', '66', '55', '44',
                'AKs', 'AKo', 'AQs', 'AQo', 'AJs', 'AJo', 'ATs', 'ATo', 'A9s', 'A8s', 'A7s', 'A6s', 'A5s', 'A4s', 'A3s', 'A2s',
                'KQs', 'KQo', 'KJs', 'KJo', 'KTs', 'K9s',
                'QJs', 'QTs', 'Q9s',
                'JTs', 'J9s', 'T9s', 'T8s', '98s', '87s', '76s', '65s'
            ],
            fold: ['33', '22', 'A9o', 'KTo', 'K9o', 'QJo', 'QTo', 'Q9o', 'J8s', '97s', '86s', '75s', '54s']
        },
        
        // HJ (Hijack): ~22% VPIP
        HJ: {
            raise: [
                'AA', 'KK', 'QQ', 'JJ', 'TT', '99', '88', '77', '66', '55', '44', '33', '22',
                'AKs', 'AKo', 'AQs', 'AQo', 'AJs', 'AJo', 'ATs', 'ATo', 'A9s', 'A9o', 'A8s', 'A7s', 'A6s', 'A5s', 'A4s', 'A3s', 'A2s',
                'KQs', 'KQo', 'KJs', 'KJo', 'KTs', 'KTo', 'K9s', 'K8s',
                'QJs', 'QJo', 'QTs', 'Q9s', 'Q8s',
                'JTs', 'J9s', 'J8s', 'T9s', 'T8s', '98s', '97s', '87s', '76s', '65s', '54s'
            ],
            fold: ['A8o', 'K9o', 'K8o', 'QTo', 'Q9o', 'JTo', 'J9o', 'T8o', '86s', '75s', '64s']
        },
        
        // CO (Cutoff): ~26% VPIP
        CO: {
            raise: [
                'AA', 'KK', 'QQ', 'JJ', 'TT', '99', '88', '77', '66', '55', '44', '33', '22',
                'AKs', 'AKo', 'AQs', 'AQo', 'AJs', 'AJo', 'ATs', 'ATo', 'A9s', 'A9o', 'A8s', 'A8o', 'A7s', 'A6s', 'A5s', 'A4s', 'A3s', 'A2s',
                'KQs', 'KQo', 'KJs', 'KJo', 'KTs', 'KTo', 'K9s', 'K9o', 'K8s', 'K7s',
                'QJs', 'QJo', 'QTs', 'QTo', 'Q9s', 'Q9o', 'Q8s',
                'JTs', 'JTo', 'J9s', 'J9o', 'J8s', 'T9s', 'T9o', 'T8s', '98s', '97s', '87s', '86s', '76s', '75s', '65s', '54s'
            ],
            fold: ['A7o', 'A6o', 'K8o', 'K7o', 'Q8o', 'J8o', 'T8o', '96s', '85s', '74s', '64s', '53s']
        },
        
        // BTN (Button): ~45% VPIP (Widest!)
        BTN: {
            raise: [
                'AA', 'KK', 'QQ', 'JJ', 'TT', '99', '88', '77', '66', '55', '44', '33', '22',
                'AKs', 'AKo', 'AQs', 'AQo', 'AJs', 'AJo', 'ATs', 'ATo', 'A9s', 'A9o', 'A8s', 'A8o', 'A7s', 'A7o', 'A6s', 'A6o', 'A5s', 'A5o', 'A4s', 'A4o', 'A3s', 'A3o', 'A2s', 'A2o',
                'KQs', 'KQo', 'KJs', 'KJo', 'KTs', 'KTo', 'K9s', 'K9o', 'K8s', 'K8o', 'K7s', 'K7o', 'K6s', 'K5s', 'K4s',
                'QJs', 'QJo', 'QTs', 'QTo', 'Q9s', 'Q9o', 'Q8s', 'Q8o', 'Q7s', 'Q6s',
                'JTs', 'JTo', 'J9s', 'J9o', 'J8s', 'J8o', 'J7s',
                'T9s', 'T9o', 'T8s', 'T8o', 'T7s', '98s', '98o', '97s', '87s', '86s', '76s', '75s', '65s', '64s', '54s'
            ],
            fold: ['K6o', 'K5o', 'K4o', 'K3o', 'K2o', 'Q7o', 'Q6o', 'J7o', 'T7o', '97o', '87o', '96s', '85s', '74s', '63s', '53s', '43s']
        },
        
        // SB: ~36% vs BB only (very wide), ~20% vs opens (tight)
        SB: {
            raise: [
                'AA', 'KK', 'QQ', 'JJ', 'TT', '99', '88', '77', '66', '55', '44', '33', '22',
                'AKs', 'AKo', 'AQs', 'AQo', 'AJs', 'AJo', 'ATs', 'ATo', 'A9s', 'A9o', 'A8s', 'A7s', 'A6s', 'A5s', 'A4s', 'A3s', 'A2s',
                'KQs', 'KQo', 'KJs', 'KJo', 'KTs', 'KTo', 'K9s', 'K8s', 'K7s',
                'QJs', 'QJo', 'QTs', 'Q9s', 'Q8s',
                'JTs', 'JTo', 'J9s', 'J8s', 'T9s', 'T8s', '98s', '97s', '87s', '76s', '65s', '54s'
            ],
            fold: ['A8o', 'A7o', 'K9o', 'K8o', 'QTo', 'Q9o', 'J9o', 'T9o', 'T8o', '86s', '75s', '64s', '53s']
        },
        
        // BB: Defending range vs single raise (40-60% depending on position)
        BB: {
            raise: [], // BB mostly calls/3-bets
            fold: [], // Position-dependent
            call: [ // vs CO/BTN steal (very wide defense)
                'AA', 'KK', 'QQ', 'JJ', 'TT', '99', '88', '77', '66', '55', '44', '33', '22',
                'AKs', 'AKo', 'AQs', 'AQo', 'AJs', 'AJo', 'ATs', 'ATo', 'A9s', 'A9o', 'A8s', 'A8o', 'A7s', 'A7o', 'A6s', 'A6o', 'A5s', 'A5o', 'A4s', 'A4o', 'A3s', 'A2s',
                'KQs', 'KQo', 'KJs', 'KJo', 'KTs', 'KTo', 'K9s', 'K9o', 'K8s', 'K7s', 'K6s',
                'QJs', 'QJo', 'QTs', 'QTo', 'Q9s', 'Q9o', 'Q8s', 'Q7s',
                'JTs', 'JTo', 'J9s', 'J9o', 'J8s', 'J7s',
                'T9s', 'T9o', 'T8s', 'T7s', '98s', '98o', '97s', '87s', '86s', '76s', '75s', '65s', '54s'
            ]
        },
        SB: {
            raise: [
                'AA', 'KK', 'QQ', 'JJ', 'TT', '99', '88', '77', '66', '55', '44', '33', '22',
                'AKs', 'AKo', 'AQs', 'AQo', 'AJs', 'AJo', 'ATs', 'ATo', 'A9s', 'A8s', 'A7s', 'A6s', 'A5s', 'A4s', 'A3s', 'A2s',
                'KQs', 'KQo', 'KJs', 'KTs', 'K9s',
                'QJs', 'QTs',
                'JTs', 'T9s', '98s', '87s', '76s'
            ],
            fold: ['J2o', 'T3o', '94o', '83o', '72o', '62o', '52o', '42o', '32o', 'K2o', 'Q2o', 'J3o']
        },
        BB: {
            // BB is already invested, so defending range is wider
            call: [
                'AA', 'KK', 'QQ', 'JJ', 'TT', '99', '88', '77', '66', '55', '44', '33', '22',
                'AKs', 'AKo', 'AQs', 'AQo', 'AJs', 'AJo', 'ATs', 'ATo', 'A9s', 'A9o', 'A8s', 'A7s', 'A6s', 'A5s', 'A4s', 'A3s', 'A2s',
                'KQs', 'KQo', 'KJs', 'KJo', 'KTs', 'K9s', 'K8s',
                'QJs', 'QTs', 'Q9s',
                'JTs', 'J9s', 'T9s', 'T8s', '98s', '97s', '87s', '86s', '76s', '75s', '65s', '64s', '54s'
            ],
            raise: ['AA', 'KK', 'QQ', 'JJ', 'TT', 'AKs', 'AKo'],
            fold: ['J2o', 'T2o', '92o', '82o', '72o', '62o', '52o', '42o', '32o']
        }
    },

    // Actions facing a single raise
    vsRaise: {
        BTN: {
            '3bet': ['AA', 'KK', 'QQ', 'JJ', 'TT', 'AKs', 'AKo', 'AQs', 'AJs', 'KQs'],
            call: ['99', '88', '77', '66', '55', '44', 'AQo', 'AJo', 'ATs', 'KJs', 'KTs', 'QJs', 'JTs', 'T9s', '98s', '87s', '76s'],
            fold: ['22', '33', 'A9o', 'A8o', 'KJo', 'KTo', 'QJo', 'QTo', 'J9s', '65s', '54s']
        },
        CO: {
            '3bet': ['AA', 'KK', 'QQ', 'JJ', 'TT', 'AKs', 'AKo', 'AQs', 'KQs'],
            call: ['99', '88', '77', '66', '55', 'AQo', 'AJs', 'ATs', 'KJs', 'QJs', 'JTs', 'T9s', '98s'],
            fold: ['22', '33', '44', 'AJo', 'ATo', 'KQo', 'KTs', 'QTs', '87s', '76s', '65s']
        },
        BB: {
            '3bet': ['AA', 'KK', 'QQ', 'JJ', 'AKs', 'AKo'],
            call: ['TT', '99', '88', '77', '66', '55', '44', '33', '22', 'AQs', 'AQo', 'AJs', 'AJo', 'ATs', 'A9s', 'A8s', 'A7s', 'A5s', 'A4s', 'KQs', 'KJs', 'KTs', 'QJs', 'JTs', 'T9s', '98s', '87s', '76s'],
            fold: ['A6s', 'A3s', 'A2s', 'K9s', 'Q9s', 'J9s', '65s', '54s']
        }
    }
};

// Card suits and values for display
const SUITS = {
    s: '♠', // spades
    h: '♥', // hearts
    d: '♦', // diamonds
    c: '♣'  // clubs
};

const CARD_VALUES = {
    'A': 'A',
    'K': 'K',
    'Q': 'Q',
    'J': 'J',
    'T': '10',
    '9': '9',
    '8': '8',
    '7': '7',
    '6': '6',
    '5': '5',
    '4': '4',
    '3': '3',
    '2': '2'
};

// Helper function to get a random element from an array
function getRandomElement(array) {
    return array[Math.floor(Math.random() * array.length)];
}

// Helper function to determine correct action based on position and hand
// Pure GTO decision logic - no exploits, no adjustments
function getCorrectAction(position, hand, scenario = 'unopened') {
    if (scenario === 'unopened') {
        const ranges = GTO_DATA.openingRanges[position];
        
        // Check suited vs offsuit
        const suited = hand.endsWith('s');
        const offsuit = hand.endsWith('o');
        const pair = hand.length === 2 && hand[0] === hand[1];
        
        // Pure GTO range check - exact match first
        if (ranges.raise.includes(hand)) {
            return 'raise';
        }
        if (ranges.fold.includes(hand)) {
            return 'fold';
        }
        
        // Check without suit designation for pairs
        if (pair) {
            const baseHand = hand.substring(0, 2);
            if (ranges.raise.includes(baseHand)) {
                return 'raise';
            }
        }
        
        // Check both suited and offsuit versions
        if (!suited && !offsuit && !pair) {
            const suitedHand = hand + 's';
            const offsuitHand = hand + 'o';
            
            if (ranges.raise.includes(suitedHand) || ranges.raise.includes(offsuitHand)) {
                return 'raise';
            }
        }
        
        // Default to fold for hands not in range
        return 'fold';
    } else if (scenario === 'vsRaise') {
        const ranges = GTO_DATA.vsRaise[position];
        
        if (ranges['3bet'].includes(hand)) {
            return 'raise'; // 3-bet
        }
        if (ranges.call.includes(hand)) {
            return 'call';
        }
        if (ranges.fold.includes(hand)) {
            return 'fold';
        }
        
        // Default to fold
        return 'fold';
    }
    
    return 'fold';
}

// Generate explanation for the correct play
function generateExplanation(position, hand, correctAction, scenario = 'unopened') {
    const posName = GTO_DATA.positions[position].name;
    
    let explanation = '';
    
    if (scenario === 'unopened') {
        if (correctAction === 'raise') {
            explanation = `${hand} is in the raising range from ${posName}. This hand is strong enough to open-raise and build the pot with the positional advantage you have.`;
        } else if (correctAction === 'fold') {
            explanation = `${hand} is not in the opening range from ${posName}. This hand is too weak to profitably open from this position, even with fold equity.`;
        }
    } else if (scenario === 'vsRaise') {
        if (correctAction === 'raise') {
            explanation = `${hand} is strong enough to 3-bet from ${posName}. This hand plays well for value and can also apply pressure on the original raiser.`;
        } else if (correctAction === 'call') {
            explanation = `${hand} should flat call from ${posName}. This hand has good playability post-flop but isn't quite strong enough to 3-bet for value consistently.`;
        } else if (correctAction === 'fold') {
            explanation = `${hand} should be folded from ${posName} facing a raise. This hand doesn't have enough equity or playability to continue profitably.`;
        }
    }
    
    return explanation;
}

// Export for use in game.js
if (typeof module !== 'undefined' && module.exports) {
    module.exports = { GTO_DATA, SUITS, CARD_VALUES, getRandomElement, getCorrectAction, generateExplanation };
}
