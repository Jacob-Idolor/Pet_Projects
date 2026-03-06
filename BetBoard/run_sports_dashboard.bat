@echo off
echo Starting March Madness and NBA Analysis Dashboard...
echo.

cd /d "%~dp0"

REM Activate virtual environment if it exists
if exist "..\..\.venv\Scripts\activate.bat" (
    call "..\..\.venv\Scripts\activate.bat"
)

REM Install requirements if needed
pip install -r requirements_sports.txt --quiet

REM Run the Streamlit dashboard
streamlit run sports_analysis_dashboard.py --server.port 8517

pause
