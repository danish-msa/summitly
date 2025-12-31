"""
Services module - Contains all business logic services for the real estate chatbot
"""

__version__ = "3.0.0"

# Import core services for easy access
try:
    from .repliers_client import repliers_client
except ImportError:
    repliers_client = None

try:
    from .listings_service import listings_service
except ImportError:
    listings_service = None

try:
    from .nlp_service import nlp_service
except ImportError:
    nlp_service = None

try:
    from .chatbot_formatter import chatbot_formatter
except ImportError:
    chatbot_formatter = None

# Import location services
try:
    from .geocoding_service import get_geocoding_service, GeocodingService
except ImportError:
    get_geocoding_service = None
    GeocodingService = None

try:
    from .postal_code_service import get_postal_code_service, PostalCodeService
except ImportError:
    get_postal_code_service = None
    PostalCodeService = None

__all__ = [
    'repliers_client',
    'listings_service',
    'nlp_service',
    'chatbot_formatter',
    'get_geocoding_service',
    'GeocodingService',
    'get_postal_code_service',
    'PostalCodeService',
]
