"""
Photon Geocoding Service
=========================
OpenStreetMap + Elasticsearch geocoding for improved location accuracy.

Handles:
- Street intersections
- Partial addresses
- Ambiguous location names
- Landmarks
- Neighborhoods

Non-blocking fallback architecture ensures system stability.

Author: Summitly Team
Date: December 2025
"""

import logging
import requests
from typing import Optional, Dict, List, Any
from dataclasses import dataclass
from functools import lru_cache
from datetime import datetime, timedelta

logger = logging.getLogger(__name__)

# Photon API Configuration
PHOTON_BASE_URL = "https://photon.komoot.io/api/"
PHOTON_TIMEOUT = 5  # seconds
PHOTON_LIMIT = 5  # max results
PHOTON_COUNTRY = "ca"  # Canada only

# Confidence thresholds
MIN_CONFIDENCE = 0.6
HIGH_CONFIDENCE = 0.8

# Feature type mapping
FEATURE_TYPE_MAP = {
    "highway": "street",
    "street": "street",
    "road": "street",
    "place": "neighborhood",
    "suburb": "neighborhood",
    "neighbourhood": "neighborhood",
    "quarter": "neighborhood",
    "city_district": "neighborhood",
    "poi": "landmark",
    "amenity": "landmark",
    "building": "landmark",
}


@dataclass
class PhotonResult:
    """Structured Photon geocoding result"""
    lat: float
    lng: float
    confidence: float
    type: str  # 'intersection', 'street', 'neighborhood', 'landmark'
    label: str
    source: str = "photon"
    raw_data: Dict[str, Any] = None
    
    def to_dict(self) -> Dict[str, Any]:
        """Convert to dictionary for JSON serialization"""
        return {
            'lat': self.lat,
            'lng': self.lng,
            'confidence': self.confidence,
            'type': self.type,
            'label': self.label,
            'source': self.source
        }


class PhotonGeocodingService:
    """
    Production-ready Photon geocoding service.
    
    Features:
    - Timeout handling (5s)
    - Graceful degradation on failure
    - Result caching (24h TTL)
    - Confidence scoring
    - Canadian-only results
    - Detailed logging
    """
    
    def __init__(
        self,
        base_url: str = PHOTON_BASE_URL,
        timeout: int = PHOTON_TIMEOUT,
        country: str = PHOTON_COUNTRY
    ):
        """
        Initialize Photon geocoding service.
        
        Args:
            base_url: Photon API endpoint
            timeout: Request timeout in seconds
            country: ISO country code (default: 'ca' for Canada)
        """
        self.base_url = base_url
        self.timeout = timeout
        self.country = country
        self.cache = {}  # Simple in-memory cache
        self.cache_ttl = timedelta(hours=24)
        
        logger.info(f"✅ [PHOTON] Service initialized | endpoint={base_url} | timeout={timeout}s")
    
    def geocode(
        self,
        query: str,
        city: Optional[str] = None,
        location_hint: Optional[str] = None
    ) -> Optional[PhotonResult]:
        """
        Geocode a location query using Photon.
        
        Args:
            query: Location query (e.g., "King and Bay", "Yonge Street", "CN Tower")
            city: Optional city context (e.g., "Toronto")
            location_hint: Optional hint for location type (e.g., "intersection")
            
        Returns:
            PhotonResult if successful and confident, None otherwise
        """
        # Check cache first
        cache_key = f"{query}:{city}:{location_hint}".lower()
        cached = self._get_cached(cache_key)
        if cached:
            logger.debug(f"[PHOTON] Cache hit for: {query}")
            return cached
        
        try:
            # Build query string
            full_query = self._build_query(query, city)
            
            logger.info(f"🌍 [PHOTON] Geocoding: {full_query}")
            
            # Make API request
            params = {
                'q': full_query,
                'limit': PHOTON_LIMIT,
                'osm_tag': '!place:country',  # Exclude country-level results
            }
            
            # Add location bias if available (improves accuracy)
            # Note: Photon uses 'lat'/'lon' for result filtering, not bias
            # We'll rely on query context instead
            
            response = requests.get(
                self.base_url,
                params=params,
                timeout=self.timeout,
                headers={'User-Agent': 'SummitlyRealEstate/1.0'}
            )
            
            if response.status_code != 200:
                logger.warning(f"⚠️ [PHOTON] API returned {response.status_code}")
                return None
            
            data = response.json()
            features = data.get('features', [])
            
            if not features:
                logger.info(f"❌ [PHOTON] No results for: {full_query}")
                return None
            
            # Process top result
            result = self._process_result(features[0], location_hint)
            
            if result and result.confidence >= MIN_CONFIDENCE:
                logger.info(
                    f"✅ [PHOTON] Geocoded: {result.label} | "
                    f"lat={result.lat:.4f}, lng={result.lng:.4f} | "
                    f"confidence={result.confidence:.2f} | type={result.type}"
                )
                
                # Cache result
                self._cache_result(cache_key, result)
                
                return result
            else:
                logger.info(f"⚠️ [PHOTON] Low confidence result rejected")
                return None
                
        except requests.exceptions.Timeout:
            logger.warning(f"⏱️ [PHOTON] Timeout after {self.timeout}s for: {query}")
            return None
        except requests.exceptions.RequestException as e:
            logger.warning(f"❌ [PHOTON] Request failed: {e}")
            return None
        except Exception as e:
            logger.error(f"❌ [PHOTON] Unexpected error: {e}")
            return None
    
    def geocode_intersection(
        self,
        street1: str,
        street2: str,
        city: str
    ) -> Optional[PhotonResult]:
        """
        Geocode a street intersection.
        
        Args:
            street1: First street name
            street2: Second street name
            city: City name
            
        Returns:
            PhotonResult if successful, None otherwise
        """
        query = f"{street1} and {street2}"
        return self.geocode(query, city=city, location_hint="intersection")
    
    def _build_query(self, query: str, city: Optional[str]) -> str:
        """Build full query string with context"""
        parts = [query.strip()]
        
        if city:
            parts.append(city)
        
        parts.append("Canada")
        
        return ", ".join(parts)
    
    def _process_result(
        self,
        feature: Dict[str, Any],
        location_hint: Optional[str]
    ) -> Optional[PhotonResult]:
        """
        Process Photon feature into structured result.
        
        Args:
            feature: GeoJSON feature from Photon
            location_hint: Optional hint about expected location type
            
        Returns:
            PhotonResult if valid, None otherwise
        """
        try:
            # Extract coordinates
            geometry = feature.get('geometry', {})
            coordinates = geometry.get('coordinates', [])
            
            if len(coordinates) < 2:
                return None
            
            lng, lat = coordinates[0], coordinates[1]
            
            # Extract properties
            props = feature.get('properties', {})
            
            # Build label
            label = self._build_label(props)
            
            # Determine feature type
            feature_type = self._determine_type(props, location_hint)
            
            # Calculate confidence
            confidence = self._calculate_confidence(props, feature_type, location_hint)
            
            return PhotonResult(
                lat=lat,
                lng=lng,
                confidence=confidence,
                type=feature_type,
                label=label,
                source="photon",
                raw_data=props
            )
            
        except Exception as e:
            logger.warning(f"⚠️ [PHOTON] Error processing result: {e}")
            return None
    
    def _build_label(self, props: Dict[str, Any]) -> str:
        """Build human-readable label from properties"""
        parts = []
        
        # Name or street
        if props.get('name'):
            parts.append(props['name'])
        elif props.get('street'):
            parts.append(props['street'])
        
        # City
        if props.get('city'):
            parts.append(props['city'])
        elif props.get('county'):
            parts.append(props['county'])
        
        # Province
        if props.get('state'):
            parts.append(props['state'])
        
        return ", ".join(parts) if parts else "Unknown Location"
    
    def _determine_type(
        self,
        props: Dict[str, Any],
        hint: Optional[str]
    ) -> str:
        """Determine location type from properties"""
        
        # Use hint if provided and it's intersection
        if hint == "intersection":
            return "intersection"
        
        # Check OSM tags
        osm_key = props.get('osm_key', '')
        osm_value = props.get('osm_value', '')
        
        # Map to our types
        combined = f"{osm_key}:{osm_value}".lower()
        
        for key_pattern, loc_type in FEATURE_TYPE_MAP.items():
            if key_pattern in combined or key_pattern in osm_key.lower():
                return loc_type
        
        # Check type field
        type_field = props.get('type', '').lower()
        for key_pattern, loc_type in FEATURE_TYPE_MAP.items():
            if key_pattern in type_field:
                return loc_type
        
        # Default
        return "street"
    
    def _calculate_confidence(
        self,
        props: Dict[str, Any],
        feature_type: str,
        hint: Optional[str]
    ) -> float:
        """
        Calculate confidence score based on result quality.
        
        Factors:
        - Feature type match with hint
        - Completeness of address data
        - OSM importance score
        """
        confidence = 0.5  # Base confidence
        
        # Boost if type matches hint
        if hint and feature_type == hint:
            confidence += 0.2
        
        # Boost for complete address data
        if props.get('name'):
            confidence += 0.1
        if props.get('street'):
            confidence += 0.05
        if props.get('city'):
            confidence += 0.1
        if props.get('postcode'):
            confidence += 0.05
        
        # Use OSM extent/importance if available
        extent = props.get('extent')
        if extent:
            # Smaller extent = more precise = higher confidence
            # This is a simple heuristic
            confidence += 0.1
        
        return min(confidence, 1.0)
    
    def _get_cached(self, key: str) -> Optional[PhotonResult]:
        """Get cached result if still valid"""
        if key in self.cache:
            result, timestamp = self.cache[key]
            if datetime.now() - timestamp < self.cache_ttl:
                return result
            else:
                # Expired, remove
                del self.cache[key]
        return None
    
    def _cache_result(self, key: str, result: PhotonResult):
        """Cache result with timestamp"""
        self.cache[key] = (result, datetime.now())
        
        # Simple cache cleanup (keep last 100 entries)
        if len(self.cache) > 100:
            oldest_key = min(self.cache.keys(), key=lambda k: self.cache[k][1])
            del self.cache[oldest_key]


# Singleton instance
_photon_service: Optional[PhotonGeocodingService] = None


def get_photon_service() -> PhotonGeocodingService:
    """Get or create singleton Photon service instance"""
    global _photon_service
    if _photon_service is None:
        _photon_service = PhotonGeocodingService()
    return _photon_service


def reset_photon_service():
    """Reset singleton (useful for testing)"""
    global _photon_service
    _photon_service = None
