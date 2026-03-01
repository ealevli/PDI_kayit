#!/bin/bash
# PDI Web - Unified Startup Script (Mac/Linux)

# Scriptin bulunduğu klasöre git
SCRIPT_DIR="$( cd "$( dirname "${BASH_SOURCE[0]}" )" &> /dev/null && pwd )"
cd "$SCRIPT_DIR"

cleanup() {
    echo ""
    echo "Servisler durduruluyor..."
    kill $(jobs -p) 2>/dev/null
    exit
}

trap cleanup SIGINT SIGTERM EXIT

echo "--- PDI Web Başlatılıyor ---"

# Backend
echo "[1/2] Backend başlatılıyor (Port 8000)..."
(
    cd backend
    if [ ! -d "venv" ]; then
        echo "Backend: Sanal ortam oluşturuluyor..."
        python3 -m venv venv
    fi
    source venv/bin/activate
    pip install -r requirements.txt > /dev/null
    python main.py
) &

# Frontend
echo "[2/2] Frontend başlatılıyor (Port 5173)..."
(
    cd frontend
    if [ ! -d "node_modules" ]; then
        echo "Frontend: Paketler yükleniyor (ilk seferde uzun sürebilir)..."
        npm install > /dev/null
    fi
    npm run dev -- --host
) &

echo ""
echo "Sistem çalışıyor. Tarayıcınızdan http://localhost:5173 adresine gidebilirsiniz."
echo "Kapatmak için bu terminalde CTRL+C tuşlarına basın."
wait
