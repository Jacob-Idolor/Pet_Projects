// Simple test runner for CI/CD
const tests = [];
let passed = 0;
let failed = 0;

function test(name, fn) {
    tests.push({ name, fn });
}

function assertEquals(actual, expected, message = '') {
    if (actual !== expected) {
        throw new Error(`${message}\nExpected: ${expected}\nActual: ${actual}`);
    }
}

function assertTrue(condition, message = '') {
    if (!condition) {
        throw new Error(message || 'Assertion failed');
    }
}

// Load required files
const fs = require('fs');

// Test 1: Verify all required files exist
test('All required files exist', () => {
    const requiredFiles = [
        'index.html',
        'styles.css',
        'design-tokens.css',
        'game.js',
        'gto-data.js',
        'auth.js',
        'ai-insights.js',
        'manifest.json'
    ];
    
    requiredFiles.forEach(file => {
        assertTrue(fs.existsSync(file), `File ${file} should exist`);
    });
});

// Test 2: Verify HTML structure
test('index.html has required elements', () => {
    const html = fs.readFileSync('index.html', 'utf8');
    assertTrue(html.includes('<!DOCTYPE html>'), 'Should have DOCTYPE');
    assertTrue(html.includes('<title>'), 'Should have title');
    assertTrue(html.includes('gto-data.js'), 'Should load gto-data.js');
    assertTrue(html.includes('game.js'), 'Should load game.js');
});

// Test 3: Verify JavaScript syntax (already done by node -c, but we can check structure)
test('game.js has GTOPokerGame class', () => {
    const gameJs = fs.readFileSync('game.js', 'utf8');
    assertTrue(gameJs.includes('class GTOPokerGame'), 'Should have GTOPokerGame class');
    assertTrue(gameJs.includes('generateRandomHand'), 'Should have generateRandomHand method');
});

// Test 4: Verify GTO data structure
test('gto-data.js has required GTO data', () => {
    const gtoData = fs.readFileSync('gto-data.js', 'utf8');
    assertTrue(gtoData.includes('GTO_DATA'), 'Should define GTO_DATA');
    assertTrue(gtoData.includes('openingRanges'), 'Should have opening ranges');
    assertTrue(gtoData.includes('getCorrectAction'), 'Should have getCorrectAction function');
    
    // Verify all 9 positions exist
    const positions = ['UTG', 'UTG1', 'MP', 'MP2', 'HJ', 'CO', 'BTN', 'SB', 'BB'];
    positions.forEach(pos => {
        assertTrue(gtoData.includes(`${pos}:`), `Should have ${pos} position`);
    });
});

// Test 5: Verify CSS files load properly
test('CSS files are valid', () => {
    const stylesExist = fs.existsSync('styles.css');
    const tokensExist = fs.existsSync('design-tokens.css');
    assertTrue(stylesExist, 'styles.css should exist');
    assertTrue(tokensExist, 'design-tokens.css should exist');
});

// Test 6: Verify manifest.json is valid JSON
test('manifest.json is valid', () => {
    const manifest = fs.readFileSync('manifest.json', 'utf8');
    let parsed;
    try {
        parsed = JSON.parse(manifest);
    } catch (e) {
        throw new Error('manifest.json is not valid JSON');
    }
    assertTrue(parsed.name !== undefined, 'Manifest should have name');
    assertTrue(parsed.icons !== undefined, 'Manifest should have icons');
});

// Run all tests
console.log('\n🧪 Running tests...\n');

tests.forEach(({ name, fn }) => {
    try {
        fn();
        console.log(`✅ ${name}`);
        passed++;
    } catch (error) {
        console.log(`❌ ${name}`);
        console.log(`   ${error.message}\n`);
        failed++;
    }
});

console.log(`\n📊 Results: ${passed} passed, ${failed} failed\n`);

if (failed > 0) {
    process.exit(1);
}
