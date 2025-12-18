@echo off
echo.
echo ======================================
echo   GTO Poker Trainer - Quick Test
echo ======================================
echo.

echo [1/5] Checking if Node.js is installed...
node --version >nul 2>&1
if errorlevel 1 (
    echo ❌ Node.js not found. Please install from https://nodejs.org
    pause
    exit /b 1
)
echo ✅ Node.js found

echo.
echo [2/5] Checking required files...
if not exist "index.html" (
    echo ❌ index.html not found
    exit /b 1
)
if not exist "game.js" (
    echo ❌ game.js not found
    exit /b 1
)
if not exist "gto-data.js" (
    echo ❌ gto-data.js not found
    exit /b 1
)
echo ✅ All required files exist

echo.
echo [3/5] Validating JavaScript syntax...
node -c game.js
if errorlevel 1 (
    echo ❌ game.js has syntax errors
    pause
    exit /b 1
)
node -c gto-data.js
if errorlevel 1 (
    echo ❌ gto-data.js has syntax errors
    pause
    exit /b 1
)
node -c auth.js
if errorlevel 1 (
    echo ❌ auth.js has syntax errors
    pause
    exit /b 1
)
node -c ai-insights.js
if errorlevel 1 (
    echo ❌ ai-insights.js has syntax errors
    pause
    exit /b 1
)
echo ✅ All JavaScript files are valid

echo.
echo [4/5] Running test suite...
if exist "test-runner.js" (
    node test-runner.js
    if errorlevel 1 (
        echo ❌ Tests failed
        pause
        exit /b 1
    )
) else (
    echo ⚠️  test-runner.js not found, skipping tests
)

echo.
echo [5/5] Starting local server...
echo.
echo 🚀 Opening app in browser at http://localhost:8080
echo.
echo Press Ctrl+C to stop the server
echo.

if exist "node_modules" (
    npx http-server -p 8080 -c-1 -o
) else (
    echo Installing http-server...
    npm install http-server
    npx http-server -p 8080 -c-1 -o
)
