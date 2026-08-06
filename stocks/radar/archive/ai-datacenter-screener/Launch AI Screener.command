#!/bin/bash
# ============================================================================
#  AI Data Center Screener — double-click launcher (macOS)
#
#  Double-click this file in Finder. It starts the local server, opens the
#  screener in your browser automatically, and stays running in this window.
#  To quit the app: close this window (or press Ctrl+C).
#
#  Sharing it: zip the whole project folder and send it. On the other Mac,
#  double-click this file — the first run sets up its Python environment
#  automatically (needs Python 3; the script tells you if it's missing).
# ============================================================================
cd "$(dirname "$0")" || exit 1

PY=".venv/bin/python"

# Ensure a working environment. Rebuilds if the venv is missing OR broken — the
# latter happens when a folder is shared/copied with someone else's .venv inside,
# whose paths point back at the original machine.
if [ -x "$PY" ] && "$PY" -c "import flask, yfinance, requests" >/dev/null 2>&1; then
  : # environment is good — go straight to launch
else
  echo "Setting up the Python environment (one-time, ~1 minute)…"
  echo
  if ! command -v python3 >/dev/null 2>&1; then
    echo "✗ Python 3 was not found on this Mac."
    echo "  Install it from https://www.python.org/downloads/ (or run: xcode-select --install)"
    echo "  then double-click this file again."
    echo
    read -r -p "Press Return to close this window."
    exit 1
  fi
  rm -rf .venv
  python3 -m venv .venv || { echo "✗ Could not create the environment."; read -r -p "Press Return to close."; exit 1; }
  "$PY" -m pip install --quiet --upgrade pip
  "$PY" -m pip install --quiet -r requirements.txt || { echo "✗ Dependency install failed."; read -r -p "Press Return to close."; exit 1; }
  echo "✓ Setup complete."
  echo
fi

# Hand off to the launcher (picks a free port, opens the browser, keeps running).
exec "$PY" launcher.py
