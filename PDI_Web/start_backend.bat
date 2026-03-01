@echo off
echo Starting PDI Backend...
cd /d %~dp0backend

if not exist venv (
    echo Creating virtual environment...
    python -m venv venv
)

call venv\Scripts\activate
pip install -r requirements.txt

echo Backend is starting on http://localhost:8000
python main.py
pause
