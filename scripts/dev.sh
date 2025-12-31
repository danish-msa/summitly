#!/bin/bash

# Development script with debug mode
echo "🔧 Starting Real Estate AI Assistant in DEBUG mode"
echo "=================================================="

# Check if virtual environment exists
if [ ! -d "venv" ]; then
    echo "❌ Virtual environment not found. Running setup first..."
    ./setup.sh
fi

# Activate virtual environment
source venv/bin/activate

# Set debug environment variables
export FLASK_DEBUG=1
export PYTHONPATH=$PYTHONPATH:$(pwd)

echo "🐛 Debug mode enabled"
echo "🚀 Starting server on http://localhost:5050"
echo "   Server will auto-reload on file changes"
echo "   Press Ctrl+C to stop"
echo ""

# Run with debug
python voice_assistant_repliers.py