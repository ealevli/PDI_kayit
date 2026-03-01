@echo off
echo Starting PDI Frontend...
cd /d %~dp0frontend

if not exist node_modules (
    echo Installing node modules...
    npm install
)

echo Frontend is starting...
npm run dev -- --host
pause
