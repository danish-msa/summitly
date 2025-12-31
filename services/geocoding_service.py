"""
Geocoding service using Nominatim (OpenStreetMap) for Canadian addresses.
Handles address validation, intersection resolution, and postal code geocoding.

Production-grade service with:
- Rate limiting (1 req/sec for Nominatim)
- Caching with LRU cache
- Retry logic with exponential backoff
- Comprehensive error handling
- Detailed logging for debugging
"""

import logging
import time
from typing import Optional, Dict, List, Any
from dataclasses import dataclass, field
from functools import lru_cache

logger = logging.getLogger(__name__)

# Try importing geopy with graceful degradation
try:
    from geopy.geocoders import Nominatim
    from geopy.exc import GeocoderTimedOut, GeocoderServiceError, GeocoderUnavailable
    GEOPY_AVAILABLE = True
except ImportError:
    GEOPY_AVAILABLE = False
    logger.warning("geopy not available - geocoding will be disabled. Install with: pip install geopy")
    Nominatim = None
    GeocoderTimedOut = Exception
    GeocoderServiceError = Exception
    GeocoderUnavailable = Exception


@dataclass
class GeocodedLocation:
    """Represents a successfully geocoded location"""
    latitude: float
    longitude: float
    formatted_address: str
    location_type: str  # 'address', 'intersection', 'postal_code', 'neighborhood'
    confidence: float  # 0.0 to 1.0
    components: Dict[str, Any] = field(default_factory=dict)  # city, province, postal_code, etc.
    
    def to_dict(self) -> Dict[str, Any]:
        """Convert to dictionary for JSON serialization"""
        return {
            'latitude': self.latitude,
            'longitude': self.longitude,
            'formatted_address': self.formatted_address,
            'location_type': self.location_type,
            'confidence': self.confidence,
            'components': self.components
        }


@dataclass
class GeocodingResult:
    """Result of geocoding attempt"""
    success: bool
    location: Optional[GeocodedLocation]
    error_message: Optional[str]
    attempted_address: str
    
    def to_dict(self) -> Dict[str, Any]:
        """Convert to dictionary for JSON serialization"""
        return {
            'success': self.success,
            'location': self.location.to_dict() if self.location else None,
            'error_message': self.error_message,
            'attempted_address': self.attempted_address
        }


class GeocodingService:
    """
    Production-ready geocoding service with retry logic and caching.
    Uses Nominatim (free, no API key required) with proper rate limiting.
    
    Features:
    - Rate limiting to comply with Nominatim usage policy (1 req/sec)
    - LRU caching to reduce API calls
    - Retry logic with exponential backoff
    - Support for addresses, intersections, and postal codes
    - Canadian-specific geocoding with country code restriction
    """
    
    def __init__(
        self, 
        user_agent: str = "SummitlyRealEstate/1.0",
        timeout: int = 10,
        max_retries: int = 3
    ):
        """
        Initialize the geocoding service.
        
        Args:
            user_agent: User agent string for Nominatim (required)
            timeout: Request timeout in seconds
            max_retries: Maximum number of retry attempts
        """
        self.user_agent = user_agent
        self.timeout = timeout
        self.max_retries = max_retries
        self.last_request_time = 0
        self.min_request_interval = 1.0  # Nominatim requires 1 req/sec
        self._geolocator = None
        
        if not GEOPY_AVAILABLE:
            logger.warning("🚫 [GEOCODING] geopy not installed - service will return mock results")
    
    @property
    def geolocator(self):
        """Lazy initialization of geolocator"""
        if self._geolocator is None and GEOPY_AVAILABLE:
            self._geolocator = Nominatim(
                user_agent=self.user_agent,
                timeout=self.timeout,
                domain='nominatim.openstreetmap.org'
            )
        return self._geolocator
    
    def _rate_limit(self) -> None:
        """Ensure we don't exceed Nominatim rate limits (1 request per second)"""
        elapsed = time.time() - self.last_request_time
        if elapsed < self.min_request_interval:
            sleep_time = self.min_request_interval - elapsed
            logger.debug(f"⏳ [GEOCODING] Rate limiting - sleeping {sleep_time:.2f}s")
            time.sleep(sleep_time)
        self.last_request_time = time.time()
    
    def _calculate_confidence(self, location: Any, expected_type: str) -> float:
        """
        Calculate confidence score based on location match quality.
        
        Args:
            location: Geopy location result
            expected_type: Expected location type ('address', 'intersection', etc.)
            
        Returns:
            Confidence score between 0.0 and 1.0
        """
        base_confidence = 0.75
        
        if not location or not hasattr(location, 'raw'):
            return base_confidence
        
        # Get location type from raw response
        location_type = location.raw.get('type', '')
        location_class = location.raw.get('class', '')
        importance = location.raw.get('importance', 0.5)
        
        # Boost confidence based on type match
        if expected_type == 'address':
            if location_type in ['house', 'building', 'residential', 'apartments']:
                base_confidence = 0.95
            elif location_class == 'building':
                base_confidence = 0.90
            elif location_class == 'place':
                base_confidence = 0.85
        elif expected_type == 'intersection':
            if location_type in ['intersection', 'junction']:
                base_confidence = 0.90
            elif 'road' in location_type or location_class == 'highway':
                base_confidence = 0.85
        elif expected_type == 'postal_code':
            if location_type == 'postcode':
                base_confidence = 0.90
            else:
                base_confidence = 0.80
        elif expected_type == 'neighborhood':
            if location_type in ['neighbourhood', 'suburb', 'residential']:
                base_confidence = 0.85
        
        # Adjust by importance score from Nominatim
        base_confidence = base_confidence * (0.8 + importance * 0.2)
        
        return min(1.0, max(0.0, base_confidence))
    
    def _geocode_with_retry(
        self, 
        query: str, 
        addressdetails: bool = True
    ) -> Optional[Any]:
        """
        Execute geocode request with retry logic.
        
        Args:
            query: Address query string
            addressdetails: Whether to include address details
            
        Returns:
            Geopy location result or None
        """
        if not GEOPY_AVAILABLE or not self.geolocator:
            logger.warning("🚫 [GEOCODING] Geolocator not available")
            return None
        
        for attempt in range(self.max_retries):
            try:
                self._rate_limit()
                location = self.geolocator.geocode(
                    query,
                    addressdetails=addressdetails,
                    country_codes=['ca']  # Restrict to Canada
                )
                return location
                
            except GeocoderTimedOut:
                wait_time = (2 ** attempt) * 0.5  # Exponential backoff
                logger.warning(
                    f"⏱️ [GEOCODING] Timeout on attempt {attempt + 1}/{self.max_retries}, "
                    f"retrying in {wait_time:.1f}s..."
                )
                time.sleep(wait_time)
                
            except (GeocoderServiceError, GeocoderUnavailable) as e:
                logger.error(f"❌ [GEOCODING] Service error: {str(e)}")
                if attempt == self.max_retries - 1:
                    raise
                time.sleep(1)
                
            except Exception as e:
                logger.error(f"❌ [GEOCODING] Unexpected error: {str(e)}")
                if attempt == self.max_retries - 1:
                    raise
                time.sleep(1)
        
        return None
    
    def geocode_address(
        self, 
        address: str, 
        city: Optional[str] = None,
        province: str = "Ontario",
        country: str = "Canada"
    ) -> GeocodingResult:
        """
        Geocode a full street address.
        
        Args:
            address: Street address (e.g., "123 Main St")
            city: City name (e.g., "Toronto")
            province: Province (default: "Ontario")
            country: Country (default: "Canada")
            
        Returns:
            GeocodingResult with lat/lng if successful
            
        Example:
            >>> service = GeocodingService()
            >>> result = service.geocode_address("100 Queen St W", "Toronto")
            >>> if result.success:
            ...     print(f"Lat: {result.location.latitude}, Lng: {result.location.longitude}")
        """
        # Build full address string
        address_parts = [address]
        if city:
            address_parts.append(city)
        address_parts.extend([province, country])
        full_address = ", ".join(address_parts)
        
        logger.info(f"🌍 [GEOCODING] Attempting to geocode address: {full_address}")
        
        # Check cache first (using tuple for hashable key)
        cache_key = (address, city, province, country)
        cached_result = self._get_cached_result(cache_key)
        if cached_result:
            logger.info(f"💾 [GEOCODING] Cache hit for: {full_address}")
            return cached_result
        
        try:
            location = self._geocode_with_retry(full_address)
            
            if location:
                address_details = location.raw.get('address', {})
                
                geocoded_loc = GeocodedLocation(
                    latitude=location.latitude,
                    longitude=location.longitude,
                    formatted_address=location.address,
                    location_type='address',
                    confidence=self._calculate_confidence(location, 'address'),
                    components={
                        'city': (
                            address_details.get('city') or 
                            address_details.get('town') or 
                            address_details.get('municipality') or
                            address_details.get('village')
                        ),
                        'province': address_details.get('state'),
                        'postal_code': address_details.get('postcode'),
                        'country': address_details.get('country'),
                        'street': address_details.get('road'),
                        'house_number': address_details.get('house_number')
                    }
                )
                
                logger.info(
                    f"✅ [GEOCODING] Address geocoded: {location.latitude:.6f}, "
                    f"{location.longitude:.6f} (confidence: {geocoded_loc.confidence:.2f})"
                )
                
                result = GeocodingResult(
                    success=True,
                    location=geocoded_loc,
                    error_message=None,
                    attempted_address=full_address
                )
                self._cache_result(cache_key, result)
                return result
            else:
                logger.warning(f"❌ [GEOCODING] No results for address: {full_address}")
                return GeocodingResult(
                    success=False,
                    location=None,
                    error_message="Address not found",
                    attempted_address=full_address
                )
                
        except Exception as e:
            logger.error(f"❌ [GEOCODING] Error geocoding address: {str(e)}")
            return GeocodingResult(
                success=False,
                location=None,
                error_message=f"Geocoding error: {str(e)}",
                attempted_address=full_address
            )
    
    def geocode_intersection(
        self,
        street1: str,
        street2: str,
        city: str,
        province: str = "Ontario"
    ) -> GeocodingResult:
        """
        Geocode a street intersection.
        
        Args:
            street1: First street name (e.g., "Yonge Street")
            street2: Second street name (e.g., "Bloor Street")
            city: City name (e.g., "Toronto")
            province: Province (default: "Ontario")
            
        Returns:
            GeocodingResult with intersection lat/lng
            
        Example:
            >>> service = GeocodingService()
            >>> result = service.geocode_intersection("Yonge Street", "Bloor Street", "Toronto")
            >>> if result.success:
            ...     print(f"Intersection at: {result.location.latitude}, {result.location.longitude}")
        """
        # Normalize street names
        street1_clean = street1.strip()
        street2_clean = street2.strip()
        
        # Try multiple query formats for intersections
        formats = [
            f"{street1_clean} and {street2_clean}, {city}, {province}, Canada",
            f"{street1_clean} & {street2_clean}, {city}, {province}, Canada",
            f"intersection of {street1_clean} and {street2_clean}, {city}, {province}, Canada",
            f"{street2_clean} and {street1_clean}, {city}, {province}, Canada",  # Reversed order
        ]
        
        logger.info(f"🌍 [INTERSECTION] Geocoding: {street1_clean} & {street2_clean}, {city}")
        
        for query in formats:
            try:
                location = self._geocode_with_retry(query)
                
                if location:
                    geocoded_loc = GeocodedLocation(
                        latitude=location.latitude,
                        longitude=location.longitude,
                        formatted_address=location.address,
                        location_type='intersection',
                        confidence=self._calculate_confidence(location, 'intersection'),
                        components={
                            'street1': street1_clean,
                            'street2': street2_clean,
                            'city': city,
                            'province': province
                        }
                    )
                    
                    logger.info(
                        f"✅ [INTERSECTION] Geocoded: {location.latitude:.6f}, "
                        f"{location.longitude:.6f} (confidence: {geocoded_loc.confidence:.2f})"
                    )
                    
                    return GeocodingResult(
                        success=True,
                        location=geocoded_loc,
                        error_message=None,
                        attempted_address=query
                    )
                    
            except Exception as e:
                logger.warning(f"⚠️ [INTERSECTION] Failed format '{query}': {str(e)}")
                continue
        
        # If all formats fail
        logger.error(f"❌ [INTERSECTION] Could not geocode intersection: {street1_clean} & {street2_clean}")
        return GeocodingResult(
            success=False,
            location=None,
            error_message="Intersection not found. Please verify street names.",
            attempted_address=f"{street1_clean} & {street2_clean}, {city}"
        )
    
    def geocode_postal_code(
        self,
        postal_code: str,
        city: Optional[str] = None
    ) -> GeocodingResult:
        """
        Geocode a Canadian postal code (FSA or full).
        
        Args:
            postal_code: Postal code (e.g., "M5V" or "M5V 1A1")
            city: Optional city hint for better accuracy
            
        Returns:
            GeocodingResult with postal code centroid
            
        Example:
            >>> service = GeocodingService()
            >>> result = service.geocode_postal_code("M5V 1A1")
            >>> if result.success:
            ...     print(f"Postal code center: {result.location.latitude}, {result.location.longitude}")
        """
        # Normalize postal code (uppercase, remove spaces)
        postal_normalized = postal_code.upper().replace(" ", "").strip()
        
        # Validate format
        if len(postal_normalized) not in [3, 6]:
            logger.warning(f"❌ [POSTAL_CODE] Invalid length: {postal_code}")
            return GeocodingResult(
                success=False,
                location=None,
                error_message="Invalid postal code format. Use 3-char FSA (M5V) or 6-char (M5V 1A1)",
                attempted_address=postal_code
            )
        
        # Format with space for 6-char codes
        if len(postal_normalized) == 6:
            postal_formatted = f"{postal_normalized[:3]} {postal_normalized[3:]}"
        else:
            postal_formatted = postal_normalized
        
        # Build query
        query_parts = [postal_formatted]
        if city:
            query_parts.append(city)
        query_parts.append("Canada")
        query = ", ".join(query_parts)
        
        logger.info(f"📮 [POSTAL_CODE] Geocoding: {postal_formatted}")
        
        try:
            location = self._geocode_with_retry(query)
            
            if location:
                address_details = location.raw.get('address', {})
                
                geocoded_loc = GeocodedLocation(
                    latitude=location.latitude,
                    longitude=location.longitude,
                    formatted_address=location.address,
                    location_type='postal_code',
                    confidence=self._calculate_confidence(location, 'postal_code'),
                    components={
                        'postal_code': postal_formatted,
                        'fsa': postal_normalized[:3],
                        'city': address_details.get('city') or address_details.get('town'),
                        'province': address_details.get('state'),
                        'is_full_postal': len(postal_normalized) == 6
                    }
                )
                
                logger.info(
                    f"✅ [POSTAL_CODE] Geocoded: {location.latitude:.6f}, "
                    f"{location.longitude:.6f} (confidence: {geocoded_loc.confidence:.2f})"
                )
                
                return GeocodingResult(
                    success=True,
                    location=geocoded_loc,
                    error_message=None,
                    attempted_address=query
                )
            else:
                logger.warning(f"❌ [POSTAL_CODE] Not found: {postal_formatted}")
                return GeocodingResult(
                    success=False,
                    location=None,
                    error_message="Postal code not found",
                    attempted_address=query
                )
                
        except Exception as e:
            logger.error(f"❌ [POSTAL_CODE] Error: {str(e)}")
            return GeocodingResult(
                success=False,
                location=None,
                error_message=f"Geocoding error: {str(e)}",
                attempted_address=query
            )
    
    def geocode_neighborhood(
        self,
        neighborhood: str,
        city: str,
        province: str = "Ontario"
    ) -> GeocodingResult:
        """
        Geocode a neighborhood within a city.
        
        Args:
            neighborhood: Neighborhood name (e.g., "Liberty Village", "Yorkville")
            city: City name (e.g., "Toronto")
            province: Province (default: "Ontario")
            
        Returns:
            GeocodingResult with neighborhood centroid
            
        Example:
            >>> service = GeocodingService()
            >>> result = service.geocode_neighborhood("Liberty Village", "Toronto")
            >>> if result.success:
            ...     print(f"Neighborhood center: {result.location.latitude}, {result.location.longitude}")
        """
        # Try multiple query formats
        formats = [
            f"{neighborhood}, {city}, {province}, Canada",
            f"{neighborhood} neighbourhood, {city}, {province}, Canada",
            f"{neighborhood} neighborhood, {city}, {province}, Canada",
        ]
        
        logger.info(f"🏘️ [NEIGHBORHOOD] Geocoding: {neighborhood}, {city}")
        
        for query in formats:
            try:
                location = self._geocode_with_retry(query)
                
                if location:
                    geocoded_loc = GeocodedLocation(
                        latitude=location.latitude,
                        longitude=location.longitude,
                        formatted_address=location.address,
                        location_type='neighborhood',
                        confidence=self._calculate_confidence(location, 'neighborhood'),
                        components={
                            'neighborhood': neighborhood,
                            'city': city,
                            'province': province
                        }
                    )
                    
                    logger.info(
                        f"✅ [NEIGHBORHOOD] Geocoded: {location.latitude:.6f}, "
                        f"{location.longitude:.6f} (confidence: {geocoded_loc.confidence:.2f})"
                    )
                    
                    return GeocodingResult(
                        success=True,
                        location=geocoded_loc,
                        error_message=None,
                        attempted_address=query
                    )
                    
            except Exception as e:
                logger.warning(f"⚠️ [NEIGHBORHOOD] Failed format '{query}': {str(e)}")
                continue
        
        # If all formats fail
        logger.error(f"❌ [NEIGHBORHOOD] Could not geocode: {neighborhood}, {city}")
        return GeocodingResult(
            success=False,
            location=None,
            error_message="Neighborhood not found. Please verify the name.",
            attempted_address=f"{neighborhood}, {city}"
        )
    
    # Simple in-memory cache (using dict since lru_cache doesn't work well with class methods)
    _cache: Dict[tuple, GeocodingResult] = {}
    _cache_max_size: int = 500
    
    def _get_cached_result(self, key: tuple) -> Optional[GeocodingResult]:
        """Get cached result if available"""
        return self._cache.get(key)
    
    def _cache_result(self, key: tuple, result: GeocodingResult) -> None:
        """Cache a geocoding result"""
        # Simple LRU: remove oldest if cache is full
        if len(self._cache) >= self._cache_max_size:
            # Remove first item (oldest in insertion order for Python 3.7+)
            oldest_key = next(iter(self._cache))
            del self._cache[oldest_key]
        self._cache[key] = result
    
    def clear_cache(self) -> None:
        """Clear the geocoding cache"""
        self._cache.clear()
        logger.info("🧹 [GEOCODING] Cache cleared")


# Global singleton instance
_geocoding_service: Optional[GeocodingService] = None


def get_geocoding_service() -> GeocodingService:
    """
    Get singleton geocoding service instance.
    
    Returns:
        GeocodingService instance
        
    Example:
        >>> from services.geocoding_service import get_geocoding_service
        >>> service = get_geocoding_service()
        >>> result = service.geocode_address("100 Queen St W", "Toronto")
    """
    global _geocoding_service
    if _geocoding_service is None:
        _geocoding_service = GeocodingService()
    return _geocoding_service


def reset_geocoding_service() -> None:
    """Reset the singleton instance (useful for testing)"""
    global _geocoding_service
    _geocoding_service = None
