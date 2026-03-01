#!/bin/bash
# start_backend.sh

SCRIPT_DIR="$( cd "$( dirname "${BASH_SOURCE[0]}" )" &> /dev/null && pwd )"
cd "$SCRIPT_DIR/backend"

echo "Starting Backend..."

# Virtual environment kontrolü
if [ ! -d "venv" ]; then
    echo "Creating virtual environment..."
    python3 -m venv venv
fi

source venv/bin/activate
pip install -r requirements.txt

# Run FastAPI server
python3 main.py
