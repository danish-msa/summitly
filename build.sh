#!/bin/bash
set -e

echo "🔧 Starting Summitly AI build process..."

# Upgrade pip
echo "📦 Upgrading pip..."
python -m pip install --upgrade pip

# Install production requirements
echo "📦 Installing production requirements..."
pip install -r requirements/requirements.txt

# Download spaCy English model for NLP/NER
echo "📦 Downloading spaCy English model..."
python -m spacy download en_core_web_sm || echo "⚠️ spaCy model download failed (will use fallback)"

# Verify critical dependencies
echo "✅ Verifying critical dependencies..."
python -c "import aiohttp; print('✅ aiohttp installed')"
python -c "import httpx; print('✅ httpx installed')" 
python -c "import websockets; print('✅ websockets installed')"
python -c "import openai; print('✅ openai installed')"
python -c "import flask; print('✅ flask installed')"
python -c "import spacy; print('✅ spacy installed')" || echo "⚠️ spacy not available"
python -c "import rapidfuzz; print('✅ rapidfuzz installed')" || echo "⚠️ rapidfuzz not available"
python -c "import geopy; print('✅ geopy installed')" || echo "⚠️ geopy not available"

echo "🎉 Build completed successfully!"