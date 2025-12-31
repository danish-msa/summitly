# conftest.py - Pytest configuration and fixtures
import sys
import os
from pathlib import Path

# Add parent directory to path for imports
ROOT_DIR = Path(__file__).parent
sys.path.insert(0, str(ROOT_DIR))

import pytest


@pytest.fixture
def client():
    """Create a test client for the Flask app."""
    from app.voice_assistant_clean import app
    
    app.config['TESTING'] = True
    with app.test_client() as client:
        yield client


@pytest.fixture
def mock_properties():
    """Mock property data for testing."""
    return [
        {
            'id': 'PROP001',
            'title': 'Luxury Downtown Toronto Condo',
            'location': 'Downtown Toronto, ON',
            'address': 'Downtown Toronto, ON',
            'price': '$850,000',
            'bedrooms': 2,
            'bathrooms': 2,
            'sqft': '1,200',
            'image_url': 'https://example.com/prop1.jpg',
            'summitly_url': 'https://summitly.ca/property/PROP001'
        },
    ]


@pytest.fixture
def mock_session():
    """Mock user session data."""
    return {
        'session_id': 'test_session_123',
        'user_preferences': {
            'location': 'Toronto',
            'budget_min': 400000,
            'budget_max': 900000,
            'bedrooms': 2,
            'property_type': 'condo'
        },
        'conversation_history': []
    }


def pytest_configure(config):
    """Configure pytest with custom markers."""
    config.addinivalue_line(
        "markers", "integration: Integration tests requiring external services"
    )
    config.addinivalue_line(
        "markers", "unit: Unit tests for individual functions"
    )
    config.addinivalue_line(
        "markers", "slow: Slow running tests"
    )
