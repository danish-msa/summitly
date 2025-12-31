"""
Enhanced Location Handler
=========================
Integrates geocoding with Repliers API for radius-based property searches.
Handles addresses, intersections, postal codes, and neighborhoods.

This module orchestrates:
1. Geocoding (converting location text to lat/lng)
2. Radius calculation (based on location type)
3. Repliers API parameter building

Author: Summitly Team
Date: December 2025
"""

import logging
from typing import Optional, Dict, List, Tuple
from dataclasses import dataclass

from services.geocoding_service import get_geocoding_service, GeocodingResult
from services.postal_code_service import get_postal_code_service
from services.address_intent_detector import AddressIntentType

logger = logging.getLogger(__name__)


@dataclass
class LocationSearchParams:
    """Parameters for Repliers API radius search."""
    latitude: float
    longitude: float
    radius_km: float
    location_type: str  # 'address', 'intersection', 'postal_code', 'neighborhood', 'street'
    original_query: str
    confidence: float
    
    def to_repliers_params(self) -> Dict:
        """Convert to Repliers API parameters."""
        return {
            'lat': self.latitude,
            'long': self.longitude,
            'radius': self.radius_km,
        }


class EnhancedLocationHandler:
    """
    Orchestrates geocoding + Repliers API radius search.
    
    This handler:
    1. Takes location input (address, intersection, postal code)
    2. Geocodes it to lat/lng coordinates
    3. Calculates appropriate search radius
    4. Returns parameters ready for Repliers API
    """
    
    # Default radius values (in kilometers)
    DEFAULT_RADII = {
        'address': 0.2,           # 200m for specific addresses
        'intersection': 0.3,      # 300m for intersections
        'postal_code_full': 0.5,  # 500m for full postal codes
        'postal_code_fsa': 1.5,   # 1.5km for FSA codes
        'neighborhood': 2.0,      # 2km for neighborhoods
        'street': 1.0,            # 1km for street-only searches
        'default': 1.0            # Default fallback
    }
    
    def __init__(self):
        self.geocoding_service = get_geocoding_service()
        self.postal_service = get_postal_code_service()
        logger.info("✅ EnhancedLocationHandler initialized")
    
    def handle_address_search(
        self,
        address: str,
        city: str,
        province: str = "Ontario"
    ) -> Optional[LocationSearchParams]:
        """
        Geocode address and prepare radius search params.
        
        Args:
            address: Street address (e.g., "123 Queen Street West")
            city: City name (e.g., "Toronto")
            province: Province (default: "Ontario")
            
        Returns:
            LocationSearchParams if successful, None otherwise
        """
        logger.info(f"🏠 [ADDRESS_HANDLER] Processing: {address}, {city}")
        
        # Geocode the address
        result = self.geocoding_service.geocode_address(
            address=address,
            city=city,
            province=province
        )
        
        if not result.success or not result.location:
            logger.error(f"❌ [ADDRESS_HANDLER] Geocoding failed: {result.error_message}")
            return None
        
        # Validate confidence
        if result.location.confidence < 0.7:
            logger.warning(f"⚠️ [ADDRESS_HANDLER] Low confidence: {result.location.confidence}")
            # Still proceed but log warning
        
        logger.info(f"✅ [ADDRESS_HANDLER] Geocoded: lat={result.location.latitude}, lng={result.location.longitude}")
        
        return LocationSearchParams(
            latitude=result.location.latitude,
            longitude=result.location.longitude,
            radius_km=self.DEFAULT_RADII['address'],
            location_type='address',
            original_query=address,
            confidence=result.location.confidence
        )
    
    def handle_intersection_search(
        self,
        street1: str,
        street2: str,
        city: str,
        province: str = "Ontario"
    ) -> Optional[LocationSearchParams]:
        """
        Geocode intersection and prepare radius search params.
        
        Args:
            street1: First street name (e.g., "Yonge Street")
            street2: Second street name (e.g., "Bloor Street")
            city: City name (e.g., "Toronto")
            province: Province (default: "Ontario")
            
        Returns:
            LocationSearchParams if successful, None otherwise
        """
        logger.info(f"🚦 [INTERSECTION_HANDLER] Processing: {street1} & {street2}, {city}")
        
        # Geocode the intersection
        result = self.geocoding_service.geocode_intersection(
            street1=street1,
            street2=street2,
            city=city,
            province=province
        )
        
        if not result.success or not result.location:
            logger.error(f"❌ [INTERSECTION_HANDLER] Geocoding failed: {result.error_message}")
            return None
        
        logger.info(f"✅ [INTERSECTION_HANDLER] Geocoded: lat={result.location.latitude}, lng={result.location.longitude}")
        
        return LocationSearchParams(
            latitude=result.location.latitude,
            longitude=result.location.longitude,
            radius_km=self.DEFAULT_RADII['intersection'],
            location_type='intersection',
            original_query=f"{street1} & {street2}",
            confidence=result.location.confidence
        )
    
    def handle_postal_code_search(
        self,
        postal_code: str,
        city: Optional[str] = None
    ) -> Optional[LocationSearchParams]:
        """
        Geocode postal code and prepare radius search params.
        
        Args:
            postal_code: Postal code (FSA like "M5V" or full like "M5V 1A1")
            city: Optional city hint for better geocoding
            
        Returns:
            LocationSearchParams if successful, None otherwise
        """
        logger.info(f"📮 [POSTAL_HANDLER] Processing: {postal_code}")
        
        # Validate and normalize postal code
        postal_info = self.postal_service.normalize_postal_code(postal_code)
        if not postal_info:
            logger.error(f"❌ [POSTAL_HANDLER] Invalid postal code: {postal_code}")
            return None
        
        normalized_code = postal_info.code
        is_full = postal_info.is_full
        fsa = postal_info.fsa
        
        # Geocode postal code
        result = self.geocoding_service.geocode_postal_code(
            postal_code=normalized_code,
            city=city
        )
        
        if not result.success or not result.location:
            logger.error(f"❌ [POSTAL_HANDLER] Geocoding failed: {result.error_message}")
            return None
        
        # Determine radius based on FSA vs full postal code
        if is_full:
            radius = self.DEFAULT_RADII['postal_code_full']
        else:
            # Get FSA-specific radius if available
            fsa_radius = self.postal_service.get_fsa_radius(fsa)
            radius = fsa_radius if fsa_radius else self.DEFAULT_RADII['postal_code_fsa']
        
        logger.info(f"✅ [POSTAL_HANDLER] Geocoded: lat={result.location.latitude}, lng={result.location.longitude}, radius={radius}km")
        
        return LocationSearchParams(
            latitude=result.location.latitude,
            longitude=result.location.longitude,
            radius_km=radius,
            location_type='postal_code',
            original_query=normalized_code,
            confidence=result.location.confidence if result.location.confidence else 0.85
        )
    
    def handle_street_search(
        self,
        street_name: str,
        street_suffix: str,
        city: str,
        province: str = "Ontario"
    ) -> Optional[LocationSearchParams]:
        """
        Geocode a street (without number) and prepare radius search params.
        
        Args:
            street_name: Street name (e.g., "Queen")
            street_suffix: Street suffix (e.g., "Street")
            city: City name
            province: Province
            
        Returns:
            LocationSearchParams if successful, None otherwise
        """
        full_street = f"{street_name} {street_suffix}"
        logger.info(f"🛤️ [STREET_HANDLER] Processing: {full_street}, {city}")
        
        # Geocode the street (will typically return midpoint)
        result = self.geocoding_service.geocode_address(
            address=full_street,
            city=city,
            province=province
        )
        
        if not result.success or not result.location:
            logger.error(f"❌ [STREET_HANDLER] Geocoding failed: {result.error_message}")
            return None
        
        logger.info(f"✅ [STREET_HANDLER] Geocoded: lat={result.location.latitude}, lng={result.location.longitude}")
        
        return LocationSearchParams(
            latitude=result.location.latitude,
            longitude=result.location.longitude,
            radius_km=self.DEFAULT_RADII['street'],
            location_type='street',
            original_query=full_street,
            confidence=result.location.confidence
        )
    
    def handle_neighborhood_search(
        self,
        neighborhood: str,
        city: str,
        province: str = "Ontario"
    ) -> Optional[LocationSearchParams]:
        """
        Geocode a neighborhood and prepare radius search params.
        
        Args:
            neighborhood: Neighborhood name (e.g., "Yorkville")
            city: City name
            province: Province
            
        Returns:
            LocationSearchParams if successful, None otherwise
        """
        logger.info(f"🏘️ [NEIGHBORHOOD_HANDLER] Processing: {neighborhood}, {city}")
        
        # Geocode the neighborhood
        result = self.geocoding_service.geocode_address(
            address=neighborhood,
            city=city,
            province=province
        )
        
        if not result.success or not result.location:
            logger.error(f"❌ [NEIGHBORHOOD_HANDLER] Geocoding failed: {result.error_message}")
            return None
        
        logger.info(f"✅ [NEIGHBORHOOD_HANDLER] Geocoded: lat={result.location.latitude}, lng={result.location.longitude}")
        
        return LocationSearchParams(
            latitude=result.location.latitude,
            longitude=result.location.longitude,
            radius_km=self.DEFAULT_RADII['neighborhood'],
            location_type='neighborhood',
            original_query=neighborhood,
            confidence=result.location.confidence
        )
    
    def calculate_distance(
        self,
        lat1: float,
        lon1: float,
        lat2: float,
        lon2: float
    ) -> float:
        """
        Calculate distance between two lat/lng points using Haversine formula.
        
        Args:
            lat1, lon1: First point coordinates
            lat2, lon2: Second point coordinates
            
        Returns:
            Distance in kilometers
        """
        from math import radians, cos, sin, asin, sqrt
        
        # Convert to radians
        lat1, lon1, lat2, lon2 = map(radians, [lat1, lon1, lat2, lon2])
        
        # Haversine formula
        dlat = lat2 - lat1
        dlon = lon2 - lon1
        a = sin(dlat/2)**2 + cos(lat1) * cos(lat2) * sin(dlon/2)**2
        c = 2 * asin(sqrt(a))
        
        # Radius of earth in kilometers
        r = 6371
        
        return c * r
    
    def rank_listings_by_distance(
        self,
        listings: List[Dict],
        search_params: LocationSearchParams
    ) -> List[Dict]:
        """
        Rank listings by distance from search origin.
        
        Args:
            listings: List of property listings
            search_params: Search parameters with origin lat/lng
            
        Returns:
            Sorted list of listings (closest first)
        """
        for listing in listings:
            # Try to get coordinates from listing
            lat = listing.get('latitude') or listing.get('map', {}).get('latitude')
            lng = listing.get('longitude') or listing.get('map', {}).get('longitude')
            
            if lat and lng:
                distance = self.calculate_distance(
                    search_params.latitude,
                    search_params.longitude,
                    float(lat),
                    float(lng)
                )
                listing['_distance_km'] = distance
            else:
                listing['_distance_km'] = 999  # No coordinates, rank lowest
        
        # Sort by distance (closest first)
        sorted_listings = sorted(listings, key=lambda x: x.get('_distance_km', 999))
        
        return sorted_listings
    
    def format_response(
        self,
        listings: List[Dict],
        search_params: LocationSearchParams,
        total_found: int
    ) -> str:
        """
        Format response message for radius search results.
        
        Args:
            listings: Properties to display
            search_params: Search parameters
            total_found: Total properties found in radius
            
        Returns:
            Formatted response string
        """
        count = len(listings)
        location_desc = search_params.original_query
        radius_m = int(search_params.radius_km * 1000)
        
        if count == 0:
            return f"I couldn't find any properties near {location_desc} within {radius_m}m. Would you like to expand the search radius?"
        
        elif count == 1:
            return f"I found 1 property near {location_desc} (within {radius_m}m):"
        
        else:
            if total_found > count:
                return f"I found {total_found} properties near {location_desc} (within {radius_m}m). Here are the {count} closest ones:"
            else:
                return f"I found {count} properties near {location_desc} (within {radius_m}m):"


# Global singleton instance
_location_handler = None


def get_location_handler() -> EnhancedLocationHandler:
    """Get singleton location handler instance."""
    global _location_handler
    if _location_handler is None:
        _location_handler = EnhancedLocationHandler()
    return _location_handler
