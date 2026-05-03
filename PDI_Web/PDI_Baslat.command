#!/bin/bash
# PDI Digital — Mac Kısayol (Çift tıkla çalıştır)

SCRIPT_DIR="$( cd "$( dirname "${BASH_SOURCE[0]}" )" &> /dev/null && pwd )"
cd "$SCRIPT_DIR"

echo "╔══════════════════════════════════════╗"
echo "║   PDI Digital — Mercedes-Benz Türk   ║"
echo "╚══════════════════════════════════════╝"
echo ""

cleanup() {
    echo ""
    echo "Servisler durduruluyor..."
    kill $(jobs -p) 2>/dev/null
    exit
}
trap cleanup SIGINT SIGTERM EXIT

# Backend
echo "▶ Backend başlatılıyor (port 8000)..."
(
    cd backend
    if [ ! -d "venv" ]; then
        echo "  Sanal ortam oluşturuluyor (ilk kez)..."
        python3 -m venv venv
    fi
    source venv/bin/activate
    pip install -r requirements.txt -q
    python main.py
) &

sleep 3

# Frontend
echo "▶ Frontend başlatılıyor (port 5173)..."
(
    cd frontend
    if [ ! -d "node_modules" ]; then
        echo "  npm paketleri yükleniyor (ilk kez uzun sürebilir)..."
        npm install
    fi
    npm run dev -- --host
) &

sleep 4

# Open browser
echo ""
echo "✓ Sistem hazır!"
echo "  Admin  : http://localhost:5173/admin"
echo "  Usta   : http://localhost:5173/usta"
echo "  Ana    : http://localhost:5173"
echo ""
open "http://localhost:5173"

echo "Kapatmak için bu pencerede CTRL+C'ye basın."
wait
