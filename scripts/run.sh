#!/bin/bash

# Real Estate AI Assistant - Run Script
echo "🏠 Starting Real Estate AI Assistant with Summitly Integration"
echo "=============================================================="

# Check if virtual environment exists
if [ ! -d "venv" ]; then
    echo "❌ Virtual environment not found. Please run setup.sh first:"
    echo "   ./setup.sh"
    exit 1
fi

# Activate virtual environment
echo "🔄 Activating virtual environment..."
source venv/bin/activate

# Check if requirements are installed
if ! python -c "import flask" 2>/dev/null; then
    echo "❌ Dependencies not installed. Please run setup.sh first:"
    echo "   ./setup.sh"
    exit 1
fi

echo "✅ Environment ready!"
echo "🚀 Starting Flask server on http://localhost:5050..."
echo ""
echo "📱 Features available:"
echo "   💬 Text + Voice Input"
echo "   📸 Property Images from Summitly"
echo "   🔗 Direct Links to Summitly Properties"
echo "   🤖 AI-Powered Property Matching"
echo ""
echo "🔍 Try searching for:"
echo "   • 'Show me apartments in Toronto'"
echo "   • 'Properties in Manhattan'"
echo "   • 'Houses in Vancouver'"
echo ""
echo "Press Ctrl+C to stop the server"
echo "=============================================================="

# Run the Flask application
python voice_assistant_repliers.py