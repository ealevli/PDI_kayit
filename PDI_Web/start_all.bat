@echo off
TITLE PDI Web - Unified Startup

:: Scriptin bulunduğu klasöre git
cd /d %~dp0

echo --- PDI Web Başlatılıyor ---

:: Backend ayarları
echo [1/2] Backend yeni pencerede başlatılıyor (Port 8000)...
start "PDI Backend API" cmd /c "cd backend && call venv\Scripts\activate && python main.py"

:: Frontend ayarları
echo [2/2] Frontend yeni pencerede başlatılıyor (Port 5173)...
start "PDI Frontend Web" cmd /c "cd frontend && npm run dev -- --host"

echo.
echo Her iki sistem de ayri pencerelerde calismaya basladi.
echo.
echo API: http://localhost:8000
echo Web: http://localhost:5173 
echo.
echo Bu pencereyi kapatabilirsiniz.
pause
