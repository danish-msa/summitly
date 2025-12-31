#!/bin/bash
set -e

echo "🔧 Starting Summitly AI build process..."

# Upgrade pip
echo "📦 Upgrading pip..."
python -m pip install --upgrade pip

# Install production requirements
echo "📦 Installing production requirements..."
pip install -r requirements/requirements.txt

# Verify critical dependencies
echo "✅ Verifying critical dependencies..."
python -c "import aiohttp; print('✅ aiohttp installed')"
python -c "import httpx; print('✅ httpx installed')" 
python -c "import websockets; print('✅ websockets installed')"
python -c "import openai; print('✅ openai installed')"
python -c "import flask; print('✅ flask installed')"

echo "🎉 Build completed successfully!"