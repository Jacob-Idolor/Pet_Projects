# Pet Projects

A curated collection of personal coding projects showcasing skills in Go, Python, web development, data engineering, and more.

## Table of Contents

- [BallStats](#ballstats)  
- [Dynatrace Problem Viewer](#dynatrace-problem-viewer)  
- [PickEm](#pickem)  
- [PythonPractice](#pythonpractice)  
- [Getting Started](#getting-started)  
- [Prerequisites](#prerequisites)  
- [Contributing](#contributing)  

---

## BallStats

Location: `BallStats/`

A Go-based backend for fetching, storing, and cleaning NBA advanced player statistics in MongoDB.

- **Key components**  
  - `api/AddSeasons.go`: Fetches NBA player data by season, upserts into a MongoDB database.  
  - `db/Cleanplayers.go` & `db/mongo.go`: Data‐cleanup and query utilities for your stored stats.  
- **Technologies**: Go, MongoDB, REST APIs  

---

## Dynatrace Problem Viewer

Location: `Dynatrace/`

A FastAPI web application that pulls “problems” from Dynatrace’s Problems API v2 and renders them in a clean HTML UI with Jinja2.

- **Key components**  
  - `main.py` & `app/api/problems.py`: FastAPI routes and Jinja2‐powered templates.  
  - `app/core/dt_client.py`: Thin Dynatrace API client (with epoch→UTC converter).  
  - `app/templates/` & `app/static/css/`: Server-side‐rendered HTML and styling.  
- **Technologies**: Python 3.11+, FastAPI, Jinja2, Pydantic settings, `.env` config  

See [Dynatrace/README.md](Dynatrace/README.md) for full setup instructions.

---

## PickEm

Location: `PickEm/`

A suite of Python scripts, datasets, and simple GUI tools for NBA “Pick ’Em” analysis and predictive modeling.

- **Data gathering**: `GatherCurrentNBA*.py`, `GetStats.py`, `GetMatchups.py`  
- **Cleaning & merging**: `CleanupLines.py`, `Mergetest.py`, `Merge*`  
- **Analytics & modeling**: `predictive_model_script.py`, `ShowMetheMoney.py`  
- **GUI exploration**: `Gui.py`  
- **Datasets**: CSVs, JSON game logs, PrizePicks API extracts  
- **Technologies**: Python, pandas, JSON/CSV, tkinter, basic machine learning  

See `PickEm/readme.md` for usage examples and workflow.

---

## PythonPractice

Location: `PythonPractice/`

A sandbox of small Python exercises, scripts, and algorithm challenges—perfect for sharpening fundamentals and experimenting with new libraries. (Add specifics here as you accumulate more notebooks and scripts.)

---

## Getting Started

```bash
# Clone this repo
git clone https://github.com/yourusername/pet-projects.git
cd pet-projects
```

Then pick a project folder and follow its individual README or instructions:

- **BallStats**  
  ```bash
  cd BallStats/api
  go run AddSeasons.go --start=2015 --end=2023
  ```
- **Dynatrace**  
  ```bash
  cd Dynatrace
  python3 -m venv venv
  source venv/bin/activate      # Windows: venv\Scripts\activate
  pip install -r requirements.txt
  uvicorn main:app --reload
  ```
- **PickEm**  
  ```bash
  cd PickEm
  # see PickEm/readme.md for detailed steps
  ```

---

## Prerequisites

- Go 1.18+ (for BallStats)  
- Python 3.10+ (for Dynatrace & PickEm)  
- MongoDB running locally (BallStats)  
- Dynatrace API token & URL (Dynatrace)  

---

## Contributing

This is a personal portfolio—feel free to fork or open issues if you spot bugs or have suggestions!

---