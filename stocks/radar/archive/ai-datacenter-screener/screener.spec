# -*- mode: python ; coding: utf-8 -*-
# PyInstaller spec — builds a single-file executable for the current OS.
#   macOS:   ./dist/AI-DataCenter-Screener
#   Windows: .\dist\AI-DataCenter-Screener.exe   (built by GitHub Actions)
#
# Build:  pyinstaller screener.spec --noconfirm

from PyInstaller.utils.hooks import collect_all

# Bundle the web assets as data files (resolved at runtime via app.resource_path).
datas = [("templates", "templates"), ("static", "static")]
binaries = []
hiddenimports = []

# yfinance and a few of its deps ship compiled libraries / data files (notably
# curl_cffi's libcurl + cacert.pem) that PyInstaller doesn't pick up on its own.
for pkg in ("yfinance", "curl_cffi", "peewee", "multitasking", "platformdirs"):
    pkg_datas, pkg_binaries, pkg_hidden = collect_all(pkg)
    datas += pkg_datas
    binaries += pkg_binaries
    hiddenimports += pkg_hidden

a = Analysis(
    ["launcher.py"],
    pathex=[],
    binaries=binaries,
    datas=datas,
    hiddenimports=hiddenimports,
    hookspath=[],
    hooksconfig={},
    runtime_hooks=[],
    excludes=["tkinter", "matplotlib"],  # not used; keeps the binary smaller
    noarchive=False,
)

pyz = PYZ(a.pure)

exe = EXE(
    pyz,
    a.scripts,
    a.binaries,
    a.datas,
    [],
    name="AI-DataCenter-Screener",
    debug=False,
    bootloader_ignore_signals=False,
    strip=False,
    upx=True,
    upx_exclude=[],
    runtime_tmpdir=None,
    console=True,        # show a small status window users can close to quit
    disable_windowed_traceback=False,
    argv_emulation=False,
    target_arch=None,
    codesign_identity=None,
    entitlements_file=None,
)
