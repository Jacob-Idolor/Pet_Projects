# Local AI Data Center Screener (Flask)

**Production** StocksWatch is a **static** Astro site (`/` screener). This folder is the **desktop / local** Flask app for live Yahoo pulls, SQLite history, and full score backtests.

## Run locally

```bash
cd archive/ai-datacenter-screener
python -m venv .venv
# Windows: .venv\Scripts\activate
source .venv/bin/activate
pip install -r requirements.txt
python launcher.py
```

## Syncing into production

| Source here | Production |
|-------------|------------|
| `static/app.js`, `style.css`, `map.js`, `backtest.js` | Copied into `public/datacenter/` then hashed |
| `datacenters.py` | Export → `public/datacenter/campuses.json` |
| `universe.py` | Prefer `src/data/datacenter-universe.json` for the live site |

Do **not** deploy Flask to AWS — keeps cost at ~$0.50–3/mo.
