#!/bin/bash

# 🚀 Summitly Backend - One-Click Startup Script
# This script starts both the backend server and opens the frontend

echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
echo "🏠 SUMMITLY REAL ESTATE AI PLATFORM"
echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
echo ""

# Get the script directory
SCRIPT_DIR="$( cd "$( dirname "${BASH_SOURCE[0]}" )" && pwd )"
PROJECT_ROOT="$( cd "$SCRIPT_DIR/.." && pwd )"

echo "📁 Project: $PROJECT_ROOT"
echo ""

# Navigate to project root
cd "$PROJECT_ROOT"

# Check if virtual environment exists
if [ ! -d "venv" ]; then
    echo "❌ Virtual environment not found!"
    echo "   Run setup first: ./scripts/setup.sh"
    exit 1
fi

# Start backend in background
echo "🔄 Starting Flask backend server..."
echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"

# Activate virtual environment and start server
source venv/bin/activate && python app/voice_assistant_clean.py &
BACKEND_PID=$!

# Wait for backend to start
echo ""
echo "⏳ Waiting for backend to initialize..."
sleep 3

# Check if backend is running
if curl -s http://localhost:5050/api/health > /dev/null 2>&1; then
    echo "✅ Backend is running on http://localhost:5050"
else
    echo "⚠️  Backend started but health check pending..."
    echo "   Check http://localhost:5050/api/health manually"
fi

echo ""
echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
echo "🌐 Opening frontend in browser..."
echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
sleep 1

# Open frontend
open "$PROJECT_ROOT/Frontend/legacy/Summitly_main.html"

echo ""
echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
echo "✨ SYSTEM STATUS"
echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
echo ""
echo "✅ Backend:  http://localhost:5050"
echo "✅ Frontend: Opened in browser"
echo "✅ Health:   http://localhost:5050/api/health"
echo ""
echo "📊 Available Features:"
echo "   • AI Chatbot (Llama 3.2)"
echo "   • Multimodal AI (Qwen2.5-Omni)"
echo "   • Property Search"
echo "   • Real-time Market Data (Exa AI)"
echo "   • Manager Dashboard"
echo ""
echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
echo "🛑 To stop the server, press CTRL+C or run:"
echo "   kill $BACKEND_PID"
echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
echo ""

# Keep script running
wait $BACKEND_PID
