#!/usr/bin/env bash
# Build the macOS desktop binary. Run:  ./build_mac.sh
set -euo pipefail
cd "$(dirname "$0")"

# Use the project venv if present, else fall back to system python3.
if [ -d ".venv" ]; then
  # shellcheck disable=SC1091
  source .venv/bin/activate
fi

echo "→ Installing build dependencies…"
python3 -m pip install -q -r requirements.txt -r requirements-build.txt

echo "→ Building with PyInstaller…"
pyinstaller screener.spec --noconfirm --clean

# Create a double-clickable wrapper so users don't need Terminal.
cat > "dist/Launch AI Screener.command" <<'EOF'
#!/bin/bash
cd "$(dirname "$0")"
./AI-DataCenter-Screener
EOF
chmod +x "dist/Launch AI Screener.command"
chmod +x dist/AI-DataCenter-Screener

echo
echo "✓ Done. In the dist/ folder:"
echo "    • AI-DataCenter-Screener        (the app)"
echo "    • 'Launch AI Screener.command'  (double-click this in Finder)"
