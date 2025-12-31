"""
Repliers API Base Client
Handles HTTP requests, authentication, retries, and error handling
"""
import requests
import time
import logging
from typing import Dict, Any, Optional, Union
from requests.adapters import HTTPAdapter
from urllib3.util.retry import Retry

from services.repliers_config import config

# Configure logging
logging.basicConfig(
    level=getattr(logging, config.LOG_LEVEL),
    format='%(asctime)s - %(name)s - %(levelname)s - %(message)s'
)
logger = logging.getLogger(__name__)


class RepliersAPIError(Exception):
    """Base exception for Repliers API errors"""
    def __init__(self, message: str, status_code: Optional[int] = None, response_data: Optional[dict] = None):
        self.message = message
        self.status_code = status_code
        self.response_data = response_data
        super().__init__(self.message)


class AuthenticationError(RepliersAPIError):
    """Raised when API authentication fails"""
    pass


class RateLimitError(RepliersAPIError):
    """Raised when API rate limit is exceeded"""
    pass


class NotFoundError(RepliersAPIError):
    """Raised when requested resource is not found"""
    pass


class ValidationError(RepliersAPIError):
    """Raised when request validation fails"""
    pass


class RepliersClient:
    """
    Base HTTP client for Repliers API with authentication, 
    retry logic, and error handling
    """
    
    def __init__(self, api_key: Optional[str] = None):
        """
        Initialize Repliers API client
        
        Args:
            api_key: Optional API key (uses environment variable if not provided)
        """
        self.api_key = api_key or config.get_api_key()
        self.base_url = config.BASE_URL
        self.session = self._create_session()
        
    def _create_session(self) -> requests.Session:
        """
        Create requests session with connection pooling and retry strategy
        
        Returns:
            Configured requests.Session object
        """
        session = requests.Session()
        
        # Configure retry strategy
        retry_strategy = Retry(
            total=config.MAX_RETRIES,
            backoff_factor=config.RETRY_BACKOFF,
            status_forcelist=[429, 500, 502, 503, 504],
            allowed_methods=["HEAD", "GET", "OPTIONS", "POST", "PUT", "DELETE"]
        )
        
        adapter = HTTPAdapter(
            max_retries=retry_strategy,
            pool_connections=10,
            pool_maxsize=20
        )
        
        session.mount("http://", adapter)
        session.mount("https://", adapter)
        
        # Set default headers
        session.headers.update(self._get_headers())
        
        return session
    
    def _get_headers(self) -> Dict[str, str]:
        """
        Get authentication headers for API requests
        
        Returns:
            Dictionary of HTTP headers
        """
        return {
            'REPLIERS-API-KEY': self.api_key,
            'Content-Type': 'application/json',
            'Accept': 'application/json',
            'User-Agent': 'Repliers-Python-Client/1.0'
        }
    
    def _handle_response(self, response: requests.Response) -> Dict[str, Any]:
        """
        Handle API response and raise appropriate exceptions
        
        Args:
            response: requests.Response object
            
        Returns:
            Parsed JSON response
            
        Raises:
            Various RepliersAPIError subclasses based on status code
        """
        # Log request details if enabled
        if config.LOG_API_REQUESTS:
            logger.debug(f"{response.request.method} {response.url} - Status: {response.status_code}")
        
        try:
            response_data = response.json() if response.content else {}
        except ValueError:
            response_data = {'raw_content': response.text}
        
        # Handle successful responses
        if 200 <= response.status_code < 300:
            return response_data
        
        # Handle error responses
        # Check if response_data is a list (some endpoints return arrays)
        if isinstance(response_data, list):
            error_message = 'Unknown error'
        else:
            error_message = response_data.get('message', response_data.get('error', 'Unknown error'))
        
        # Log full error details for debugging
        logger.error(f"API Error {response.status_code}: URL={response.url}")
        logger.error(f"Response content: {response.text[:700]}")  # First 700 chars
        logger.error(f"Error message: {error_message}")
        
        if response.status_code == 401:
            raise AuthenticationError(
                f"Authentication failed: {error_message}",
                status_code=response.status_code,
                response_data=response_data
            )
        elif response.status_code == 404:
            raise NotFoundError(
                f"Resource not found: {error_message}",
                status_code=response.status_code,
                response_data=response_data
            )
        elif response.status_code == 429:
            retry_after = response.headers.get('Retry-After', '60')
            raise RateLimitError(
                f"Rate limit exceeded. Retry after {retry_after} seconds",
                status_code=response.status_code,
                response_data=response_data
            )
        elif response.status_code == 422:
            raise ValidationError(
                f"Validation error: {error_message}",
                status_code=response.status_code,
                response_data=response_data
            )
        else:
            raise RepliersAPIError(
                f"API error ({response.status_code}): {error_message}",
                status_code=response.status_code,
                response_data=response_data
            )
    
    def request(
        self,
        method: str,
        endpoint: str,
        params: Optional[Dict[str, Any]] = None,
        json_data: Optional[Dict[str, Any]] = None,
        timeout: Optional[int] = None
    ) -> Dict[str, Any]:
        """
        Make HTTP request to Repliers API
        
        Args:
            method: HTTP method (GET, POST, PUT, DELETE)
            endpoint: API endpoint (relative or absolute URL)
            params: URL query parameters
            json_data: JSON request body
            timeout: Request timeout in seconds
            
        Returns:
            Parsed JSON response
            
        Raises:
            RepliersAPIError: On API errors
        """
        # Build full URL
        if endpoint.startswith('http'):
            url = endpoint
        else:
            url = f"{self.base_url}{endpoint}"
        
        timeout = timeout or config.TIMEOUT
        
        try:
            logger.info(f"Making {method} request to {url}")
            if params:
                logger.info(f"Query params: {params}")
            if json_data:
                logger.info(f"JSON body: {json_data}")
            
            response = self.session.request(
                method=method,
                url=url,
                params=params,
                json=json_data,
                timeout=timeout
            )
            
            return self._handle_response(response)
            
        except requests.exceptions.Timeout:
            logger.error(f"Request timeout after {timeout}s: {url}")
            raise RepliersAPIError(f"Request timeout after {timeout} seconds")
        
        except requests.exceptions.ConnectionError as e:
            logger.error(f"Connection error: {str(e)}")
            raise RepliersAPIError(f"Connection error: {str(e)}")
        
        except RepliersAPIError:
            # Re-raise our custom exceptions
            raise
        
        except Exception as e:
            logger.error(f"Unexpected error: {str(e)}")
            raise RepliersAPIError(f"Unexpected error: {str(e)}")
    
    def get(self, endpoint: str, params: Optional[Dict[str, Any]] = None, **kwargs) -> Dict[str, Any]:
        """Make GET request"""
        return self.request('GET', endpoint, params=params, **kwargs)
    
    def post(self, endpoint: str, json_data: Optional[Dict[str, Any]] = None, **kwargs) -> Dict[str, Any]:
        """Make POST request"""
        return self.request('POST', endpoint, json_data=json_data, **kwargs)
    
    def put(self, endpoint: str, json_data: Optional[Dict[str, Any]] = None, **kwargs) -> Dict[str, Any]:
        """Make PUT request"""
        return self.request('PUT', endpoint, json_data=json_data, **kwargs)
    
    def delete(self, endpoint: str, **kwargs) -> Dict[str, Any]:
        """Make DELETE request"""
        return self.request('DELETE', endpoint, **kwargs)
    
    def close(self):
        """Close the session"""
        self.session.close()
    
    def __enter__(self):
        """Context manager entry"""
        return self
    
    def __exit__(self, exc_type, exc_val, exc_tb):
        """Context manager exit"""
        self.close()


# Create default client instance
client = RepliersClient()


if __name__ == '__main__':
    # Test client connectivity
    print("🔌 Testing Repliers API connection...\n")
    
    try:
        with RepliersClient() as test_client:
            # Try to fetch property types as a connectivity test
            response = test_client.get('/listings/property-types')
            print("✅ Successfully connected to Repliers API!")
            print(f"   Response keys: {list(response.keys())}")
    
    except AuthenticationError as e:
        print(f"❌ Authentication failed: {e.message}")
        print("   Check your REPLIERS_API_KEY in .env file")
    
    except RepliersAPIError as e:
        print(f"❌ API Error: {e.message}")
        if e.status_code:
            print(f"   Status code: {e.status_code}")
    
    except Exception as e:
        print(f"❌ Unexpected error: {str(e)}")
