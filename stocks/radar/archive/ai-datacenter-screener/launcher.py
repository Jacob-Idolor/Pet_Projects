"""
Desktop entry point for the AI Data Center Screener.

Starts the Flask server on a stable local port, opens the default browser, and
keeps running until the window is closed. This is the file PyInstaller bundles
into the .exe / Mac binary — double-clickable, no terminal commands, no Python
install required on the target machine.

Single-instance: if the screener is ALREADY running (e.g. you double-clicked the
launcher again, or you have `python app.py` going), we just open a browser tab to
that instance instead of starting a second server on a different port. That keeps
one stable URL and avoids "Failed to load data" from tabs pointed at a stopped
instance.
"""

import socket
import threading
import urllib.request
import webbrowser

from app import app

# Tried in order. A stable, predictable port means bookmarks/old tabs keep working.
PREFERRED_PORTS = (5050, 5051, 5052, 8000)


def _port_is_free(port):
    s = socket.socket(socket.AF_INET, socket.SOCK_STREAM)
    try:
        s.bind(("127.0.0.1", port))
        return True
    except OSError:
        return False
    finally:
        s.close()


def _our_app_on(port):
    """True if THIS app is already serving on the port (via the health marker)."""
    try:
        with urllib.request.urlopen(f"http://127.0.0.1:{port}/api/health", timeout=1.5) as r:
            return r.status == 200 and b"ai-dc-screener" in r.read(200)
    except Exception:  # noqa: BLE001 — connection refused / wrong app / timeout
        return False


def choose_port():
    """Return (port, reuse): reuse=True means an instance is already running there
    and we should just open it; reuse=False means start a fresh server on that port."""
    for p in PREFERRED_PORTS:
        if _our_app_on(p):
            return p, True          # already running our app -> reuse it
        if _port_is_free(p):
            return p, False         # free -> start here
        # else: taken by something unrelated -> try the next candidate
    # all preferred ports busy with other things -> let the OS pick a free one
    s = socket.socket(socket.AF_INET, socket.SOCK_STREAM)
    s.bind(("127.0.0.1", 0))
    port = s.getsockname()[1]
    s.close()
    return port, False


def main():
    port, reuse = choose_port()
    url = f"http://127.0.0.1:{port}"

    if reuse:
        print("=" * 52)
        print("  AI Data Center Screener is already running.")
        print(f"  Opening {url} in your browser…")
        print("=" * 52)
        webbrowser.open(url)
        return

    print("=" * 52)
    print("  AI Data Center Screener")
    print("=" * 52)
    print(f"  Opening {url} in your browser…")
    print("  Keep this window open while you use the app.")
    print("  Close this window (or press Ctrl+C) to quit.")
    print("=" * 52)

    # open the browser shortly after the server starts accepting connections
    threading.Timer(1.5, lambda: webbrowser.open(url)).start()

    # debug/reloader MUST be off in a frozen build (the reloader re-execs python)
    app.run(host="127.0.0.1", port=port, debug=False, use_reloader=False, threaded=True)


if __name__ == "__main__":
    main()
