@echo off
chcp 65001 > nul
title PDI Digital — Mercedes-Benz Türk

echo ╔══════════════════════════════════════╗
echo ║   PDI Digital — Mercedes-Benz Türk   ║
echo ╚══════════════════════════════════════╝
echo.

set SCRIPT_DIR=%~dp0

REM Backend
echo [1/2] Backend baslatiliyor (port 8000)...
cd /d "%SCRIPT_DIR%backend"

if not exist "venv" (
    echo   Sanal ortam olusturuluyor...
    python -m venv venv
)

call venv\Scripts\activate.bat
pip install -r requirements.txt -q
start "PDI Backend" /min cmd /c "call venv\Scripts\activate.bat && python main.py"

timeout /t 3 /nobreak > nul

REM Frontend
echo [2/2] Frontend baslatiliyor (port 5173)...
cd /d "%SCRIPT_DIR%frontend"

if not exist "node_modules" (
    echo   npm paketleri yukleniyor...
    npm install
)

start "PDI Frontend" /min cmd /c "npm run dev -- --host"

timeout /t 4 /nobreak > nul

echo.
echo Sistem hazir!
echo   Admin  : http://localhost:5173/admin
echo   Usta   : http://localhost:5173/usta
echo   Ana    : http://localhost:5173
echo.

start "" "http://localhost:5173"

echo Kapatmak icin bu pencereyi kapatin (backend ve frontend arka planda calisir).
pause
