#!/bin/bash
# Edge TTS Server Startup Script

echo "Starting Edge TTS Server..."
echo ""

# Check if dependencies are installed
if ! python3 -c "import edge_tts" &> /dev/null; then
    echo "⚠️  Dependencies not found. Installing..."
    pip install -q -r requirements.txt
    echo "✅ Dependencies installed"
    echo ""
fi

# Start the server
echo "🚀 Starting server on http://localhost:5002"
echo "Press Ctrl+C to stop"
echo ""

python3 server.py
