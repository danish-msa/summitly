#!/bin/bash
# Quick Start Script for Repliers API Integration

echo "🏠 Repliers API Integration - Quick Start"
echo "=========================================="
echo ""

# Check Python version
echo "1️⃣  Checking Python version..."
python_version=$(python3 --version 2>&1 | awk '{print $2}')
echo "   Found: Python $python_version"
echo ""

# Check if .env exists
echo "2️⃣  Checking configuration..."
if [ ! -f ".env" ]; then
    echo "   ⚠️  .env file not found"
    echo "   Creating from template..."
    cp .env.example .env
    echo "   ✅ Created .env - Please add your REPLIERS_API_KEY"
    echo "   Edit .env file and add your API key, then run this script again"
    exit 1
else
    echo "   ✅ .env file found"
fi
echo ""

# Check if API key is set
echo "3️⃣  Validating API key..."
if grep -q "your_api_key_here" .env; then
    echo "   ❌ Please set your REPLIERS_API_KEY in .env file"
    echo "   Open .env and replace 'your_api_key_here' with your actual API key"
    exit 1
else
    echo "   ✅ API key configured"
fi
echo ""

# Install dependencies
echo "4️⃣  Installing dependencies..."
if [ ! -d "venv" ]; then
    echo "   Creating virtual environment..."
    python3 -m venv venv
fi

echo "   Activating virtual environment..."
source venv/bin/activate

echo "   Installing packages..."
pip install -q -r repliers_requirements.txt
echo "   ✅ Dependencies installed"
echo ""

# Validate configuration
echo "5️⃣  Validating Repliers configuration..."
python3 repliers_config.py
echo ""

# Test API connection
echo "6️⃣  Testing API connection..."
python3 -c "
from repliers_client import client
try:
    response = client.get('/listings/property-types')
    print('   ✅ Successfully connected to Repliers API!')
except Exception as e:
    print(f'   ❌ Connection failed: {e}')
    exit(1)
"
echo ""

# Show next steps
echo "=========================================="
echo "✅ Setup Complete!"
echo ""
echo "🚀 Next Steps:"
echo ""
echo "1. Start the voice assistant with Repliers integration:"
echo "   python3 voice_assistant_repliers.py"
echo ""
echo "2. Test the chat endpoint:"
echo "   curl -X POST http://localhost:5000/chat \\"
echo "     -H 'Content-Type: application/json' \\"
echo "     -d '{\"message\": \"Find condos in Toronto under 600k\", \"user_id\": \"test_user\"}'"
echo ""
echo "3. Read the complete guide:"
echo "   cat REPLIERS_INTEGRATION_GUIDE.md"
echo ""
echo "📚 Available Services:"
echo "   • Property Search (listings_service.py)"
echo "   • NLP Query Processing (nlp_service.py)"
echo "   • Saved Searches & Alerts (saved_search_service.py)"
echo "   • Webhooks (webhook_handler.py)"
echo "   • Property Estimates (estimates_service.py)"
echo "   • Client Messaging (message_service.py)"
echo ""
echo "🔗 Endpoints Available:"
echo "   POST   /chat                    - Natural language property search"
echo "   GET    /listing/<id>            - Get property details"
echo "   GET    /listing/<id>/similar    - Find similar properties"
echo "   POST   /estimate                - Get property valuation"
echo "   POST   /saved-search            - Create saved search with alerts"
echo "   GET    /saved-searches          - Get user's saved searches"
echo "   POST   /address-history         - Get property history"
echo "   POST   /webhooks/repliers       - Webhook endpoint"
echo "   GET    /health                  - Health check"
echo ""
echo "Happy building! 🏠🚀"
