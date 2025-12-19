"""
Repliers API Configuration Module
Manages API credentials, base URLs, and environment settings
"""
import os
from typing import Optional
from dotenv import load_dotenv, find_dotenv
from pathlib import Path

# Load environment variables from .env file
# Try multiple paths to ensure it works from any execution context
env_paths = [
    Path(__file__).parent.parent / 'config' / '.env',  # From services/ directory
    Path.cwd() / 'config' / '.env',                    # From project root
    find_dotenv()                                       # Auto-detect
]

for env_path in env_paths:
    if env_path and Path(env_path).exists():
        load_dotenv(dotenv_path=env_path)
        break


class RepliersConfig:
    """Configuration manager for Repliers API integration"""
    
    # Base API URL
    BASE_URL = "https://api.repliers.io"
    
    # API Endpoints
    ENDPOINTS = {
        'listings': '/listings',
        'listing_detail': '/listings/{id}',
        'nlp': '/nlp',
        'similar': '/listings/{id}/similar',
        'estimates': '/listings/estimates',
        'address_history': '/listings/address-history',
        'property_types': '/listings/property-types',
        'property_styles': '/listings/property-styles',
        'saved_searches': '/searches',
        'saved_search_detail': '/searches/{id}',
        'webhooks': '/webhooks',
        'webhook_detail': '/webhooks/{id}',
        'messages': '/messages',
        'message_token': '/messages/token/{token}',
    }
    
    # API Authentication
    @staticmethod
    def get_api_key() -> str:
        """
        Retrieve API key from environment variables
        Raises ValueError if API key is not configured
        """
        api_key = os.getenv('REPLIERS_API_KEY')
        if not api_key:
            raise ValueError(
                "REPLIERS_API_KEY not found in environment variables. "
                "Please set it in your .env file or environment."
            )
        return api_key
    
    # Request Configuration
    TIMEOUT = 30  # Request timeout in seconds
    MAX_RETRIES = 3  # Maximum retry attempts for failed requests
    RETRY_BACKOFF = 2  # Exponential backoff multiplier
    
    # Pagination
    DEFAULT_PAGE_SIZE = 25
    MAX_PAGE_SIZE = 200  # Increased from 100 to 200 for better coverage in large FSA areas
    
    # Cache Settings
    CACHE_TTL = {
        'property_types': 86400,  # 24 hours
        'property_styles': 86400,  # 24 hours
        'listing_details': 300,    # 5 minutes
        'search_results': 180,     # 3 minutes
    }
    
    # Webhook Settings
    WEBHOOK_SECRET = os.getenv('REPLIERS_WEBHOOK_SECRET', '')
    WEBHOOK_TARGET_URL = os.getenv('REPLIERS_WEBHOOK_URL', 'https://your-domain.com/webhooks/repliers')
    
    # Alert Preferences
    ALERT_FREQUENCIES = ['instant', 'daily', 'weekly', 'monthly']
    ALERT_DELIVERY_METHODS = ['email', 'sms', 'both']
    
    # Logging
    LOG_LEVEL = os.getenv('LOG_LEVEL', 'INFO')
    LOG_API_REQUESTS = os.getenv('LOG_API_REQUESTS', 'true').lower() == 'true'
    
    @classmethod
    def get_endpoint(cls, endpoint_name: str, **kwargs) -> str:
        """
        Get full URL for a specific endpoint
        
        Args:
            endpoint_name: Name of the endpoint from ENDPOINTS dict
            **kwargs: URL parameters to format into the endpoint
        
        Returns:
            Full URL string
        """
        endpoint = cls.ENDPOINTS.get(endpoint_name)
        if not endpoint:
            raise ValueError(f"Unknown endpoint: {endpoint_name}")
        
        # Format URL parameters if provided
        if kwargs:
            endpoint = endpoint.format(**kwargs)
        
        return f"{cls.BASE_URL}{endpoint}"
    
    @classmethod
    def validate_config(cls) -> dict:
        """
        Validate configuration and return status
        
        Returns:
            Dict with validation results
        """
        results = {
            'valid': True,
            'errors': [],
            'warnings': []
        }
        
        # Check API key
        try:
            api_key = cls.get_api_key()
            if len(api_key) < 20:
                results['warnings'].append('API key seems unusually short')
        except ValueError as e:
            results['valid'] = False
            results['errors'].append(str(e))
        
        # Check webhook configuration
        if not cls.WEBHOOK_SECRET:
            results['warnings'].append('REPLIERS_WEBHOOK_SECRET not set - webhooks will not be authenticated')
        
        if 'your-domain.com' in cls.WEBHOOK_TARGET_URL:
            results['warnings'].append('REPLIERS_WEBHOOK_URL uses default placeholder - update for production')
        
        return results


# Export singleton instance
config = RepliersConfig()


if __name__ == '__main__':
    # Configuration validation script
    print("🔍 Validating Repliers API Configuration...\n")
    
    validation = RepliersConfig.validate_config()
    
    if validation['valid']:
        print("✅ Configuration is valid!")
    else:
        print("❌ Configuration has errors:")
        for error in validation['errors']:
            print(f"   - {error}")
    
    if validation['warnings']:
        print("\n⚠️  Warnings:")
        for warning in validation['warnings']:
            print(f"   - {warning}")
    
    print(f"\n📊 Configuration Details:")
    print(f"   Base URL: {RepliersConfig.BASE_URL}")
    print(f"   Timeout: {RepliersConfig.TIMEOUT}s")
    print(f"   Max Retries: {RepliersConfig.MAX_RETRIES}")
    print(f"   Webhook URL: {RepliersConfig.WEBHOOK_TARGET_URL}")
