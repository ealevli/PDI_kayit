#!/bin/bash
# start_frontend.sh

SCRIPT_DIR="$( cd "$( dirname "${BASH_SOURCE[0]}" )" &> /dev/null && pwd )"
cd "$SCRIPT_DIR/frontend"

echo "Starting Frontend..."

npm install
npm run dev -- --host
