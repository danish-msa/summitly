"""
Location Context Manager
========================
Centralized location handling for the Summitly chatbot using new geocoding services.

Integrates:
- GeocodingService for addresses, intersections, and neighborhoods
- PostalCodeService for Canadian postal code validation
- Location state management in conversation context
- Backward compatibility with existing postal_code_validator

Author: Summitly Team  
Date: December 26, 2025
"""

import logging
import re
from typing import Optional, Dict, Any, Tuple, List
from dataclasses import dataclass, field
from enum import Enum

# Import new location services
from services.geocoding_service import (
    get_geocoding_service,
    GeocodingService,
    GeocodingResult,
    GeocodedLocation
)
from services.postal_code_service import (
    get_postal_code_service,
    PostalCodeService,
    PostalCodeInfo
)

logger = logging.getLogger(__name__)

# Import Photon geocoding for enhanced accuracy
try:
    from services.photon_geocoding_service import (
        get_photon_service,
        PhotonGeocodingService,
        PhotonResult
    )
    from services.intersection_detector import (
        get_intersection_detector,
        IntersectionDetector,
        IntersectionMatch
    )
    PHOTON_AVAILABLE = True
except ImportError:
    PHOTON_AVAILABLE = False
    logger.warning("⚠️ [LOCATION_MGR] Photon services not available - using standard geocoding only")


class LocationType(Enum):
    """Types of location that can be detected"""
    POSTAL_CODE = "postal_code"
    ADDRESS = "address"
    INTERSECTION = "intersection"
    NEIGHBORHOOD = "neighborhood"
    CITY = "city"
    UNKNOWN = "unknown"


@dataclass
class LocationContext:
    """
    Stores the current location context for a conversation session.
    """
    location_type: LocationType
    raw_input: str  # Original user input
    
    # Geocoded data
    latitude: Optional[float] = None
    longitude: Optional[float] = None
    formatted_address: Optional[str] = None
    confidence: float = 0.0
    
    # Components
    postal_code: Optional[str] = None
    fsa: Optional[str] = None  # Forward Sortation Area (first 3 chars)
    city: Optional[str] = None
    province: Optional[str] = None
    street_address: Optional[str] = None
    neighborhood: Optional[str] = None
    
    # Search parameters
    search_radius_km: float = 2.0
    is_validated: bool = False
    
    # Metadata
    detection_method: Optional[str] = None  # 'postal_code_service', 'geocoding_service', etc.
    timestamp: Optional[str] = None
    
    def to_dict(self) -> Dict[str, Any]:
        """Convert to dictionary for JSON serialization"""
        return {
            'location_type': self.location_type.value,
            'raw_input': self.raw_input,
            'latitude': self.latitude,
            'longitude': self.longitude,
            'formatted_address': self.formatted_address,
            'confidence': self.confidence,
            'postal_code': self.postal_code,
            'fsa': self.fsa,
            'city': self.city,
            'province': self.province,
            'street_address': self.street_address,
            'neighborhood': self.neighborhood,
            'search_radius_km': self.search_radius_km,
            'is_validated': self.is_validated,
            'detection_method': self.detection_method,
            'timestamp': self.timestamp
        }


class LocationContextManager:
    """
    Manages location context extraction, validation, and geocoding for chatbot conversations.
    
    Features:
    - Detects location entities in user messages
    - Validates and normalizes postal codes
    - Geocodes addresses, intersections, and neighborhoods
    - Maintains location context across conversation turns
    - Provides search radius recommendations
    - Backward compatible with existing postal_code_validator
    """
    
    def __init__(self):
        """Initialize the location context manager"""
        self.geocoding_service: GeocodingService = get_geocoding_service()
        self.postal_code_service: PostalCodeService = get_postal_code_service()
        
        # Initialize Photon services if available
        if PHOTON_AVAILABLE:
            self.photon_service: Optional[PhotonGeocodingService] = get_photon_service()
            self.intersection_detector: Optional[IntersectionDetector] = get_intersection_detector()
            logger.info("✅ [LOCATION_MGR] Photon geocoding enabled")
        else:
            self.photon_service = None
            self.intersection_detector = None
            logger.info("⚠️ [LOCATION_MGR] Photon geocoding disabled (fallback mode)")
        
        self.current_location: Optional[LocationContext] = None
        logger.info("🗺️ [LOCATION_MGR] Initialized LocationContextManager")
    
    def detect_location_in_message(self, message: str) -> Optional[LocationContext]:
        """
        Detect and extract location from user message.
        
        Pipeline priority (IMPORTANT - ensures accuracy):
        1. Postal code detection (AUTHORITATIVE - regex-based, most reliable)
        2. Street address detection (full address with number)
        3. Intersection detection via Photon (enhanced accuracy)
        4. Partial/ambiguous location via Photon (landmarks, neighborhoods)
        5. Neighborhood detection (fallback)
        
        Args:
            message: User's input message
            
        Returns:
            LocationContext if location detected, None otherwise
        """
        logger.info(f"🔍 [LOCATION_MGR] Detecting location in: {message}")
        
        # 1. Try postal code detection first (AUTHORITATIVE - don't override)
        postal_context = self._detect_postal_code(message)
        if postal_context:
            return postal_context
        
        # 2. Try full street address detection (has street number)
        address_context = self._detect_street_address(message)
        if address_context:
            return address_context
        
        # 3. Try Photon-enhanced intersection detection (NEW)
        if PHOTON_AVAILABLE and self.photon_service:
            intersection_context = self._detect_intersection_photon(message)
            if intersection_context:
                return intersection_context
        
        # 4. Try Photon for partial/ambiguous locations (NEW)
        if PHOTON_AVAILABLE and self.photon_service:
            photon_context = self._detect_location_photon(message)
            if photon_context:
                return photon_context
        
        # 5. Fallback: Try standard intersection detection
        intersection_context = self._detect_intersection(message)
        if intersection_context:
            return intersection_context
        
        # 6. Final fallback: Try neighborhood detection
        neighborhood_context = self._detect_neighborhood(message)
        if neighborhood_context:
            return neighborhood_context
        
        logger.info("❌ [LOCATION_MGR] No location detected")
        return None
    
    def _detect_postal_code(self, message: str) -> Optional[LocationContext]:
        """
        Detect Canadian postal code in message and validate it.
        
        Returns:
            LocationContext with postal code info if valid
        """
        # Use PostalCodeService to detect postal code in text
        postal_info = self.postal_code_service.detect_postal_code_in_text(message)
        
        if not postal_info:
            return None
        
        logger.info(f"📮 [LOCATION_MGR] Detected postal code: {postal_info.code}")
        
        # Get appropriate search radius
        if postal_info.is_full:
            radius = self.postal_code_service.get_full_postal_code_radius()
        else:
            radius = self.postal_code_service.get_fsa_radius(postal_info.fsa)
        
        # Try to geocode the postal code for lat/lng
        geocode_result = self.geocoding_service.geocode_postal_code(postal_info.code, postal_info.city)
        
        context = LocationContext(
            location_type=LocationType.POSTAL_CODE,
            raw_input=message,
            postal_code=postal_info.code,
            fsa=postal_info.fsa,
            city=postal_info.city,
            province=postal_info.province,
            search_radius_km=radius,
            is_validated=True,
            detection_method='postal_code_service'
        )
        
        # Add geocoded coordinates if available
        if geocode_result.success and geocode_result.location:
            context.latitude = geocode_result.location.latitude
            context.longitude = geocode_result.location.longitude
            context.formatted_address = geocode_result.location.formatted_address
            context.confidence = geocode_result.location.confidence
            logger.info(
                f"✅ [LOCATION_MGR] Geocoded postal code: "
                f"{context.latitude:.6f}, {context.longitude:.6f}"
            )
        else:
            logger.warning(f"⚠️ [LOCATION_MGR] Could not geocode postal code: {geocode_result.error_message}")
            # Still valid postal code, just no coordinates
            context.confidence = 0.7
        
        return context
    
    def _detect_street_address(self, message: str) -> Optional[LocationContext]:
        """
        Detect street address in message.
        
        Looks for patterns like:
        - "123 Main Street, Toronto"
        - "at 100 Queen St W Toronto"
        - "near 55 Bloor Street"
        """
        # Common address patterns
        patterns = [
            # Number + Street + optional city
            r'\b(\d+\s+[A-Za-z\s]+(?:Street|St|Avenue|Ave|Road|Rd|Drive|Dr|Boulevard|Blvd|Way|Lane|Ln|Court|Ct|Place|Pl)(?:\s*[A-Za-z]*)?(?:\s*,?\s*([A-Za-z\s]+))?)',
            # "at/near" + address
            r'(?:at|near|on)\s+(\d+\s+[A-Za-z\s]+(?:Street|St|Avenue|Ave|Road|Rd)(?:\s*[A-Za-z]*)?)',
        ]
        
        for pattern in patterns:
            match = re.search(pattern, message, re.IGNORECASE)
            if match:
                address = match.group(1).strip()
                city = match.group(2).strip() if len(match.groups()) > 1 and match.group(2) else None
                
                logger.info(f"🏠 [LOCATION_MGR] Detected address: {address}, city: {city}")
                
                # Try to geocode the address
                geocode_result = self.geocoding_service.geocode_address(
                    address=address,
                    city=city,
                    province="Ontario",  # Default to Ontario, TODO: make configurable
                    country="Canada"
                )
                
                if geocode_result.success and geocode_result.location:
                    loc = geocode_result.location
                    context = LocationContext(
                        location_type=LocationType.ADDRESS,
                        raw_input=message,
                        latitude=loc.latitude,
                        longitude=loc.longitude,
                        formatted_address=loc.formatted_address,
                        confidence=loc.confidence,
                        street_address=address,
                        city=loc.components.get('city') or city,
                        province=loc.components.get('province'),
                        postal_code=loc.components.get('postal_code'),
                        search_radius_km=1.5,  # 1.5km for specific addresses (increased from 1.0km)
                        is_validated=True,
                        detection_method='geocoding_service'
                    )
                    
                    logger.info(
                        f"✅ [LOCATION_MGR] Geocoded address: "
                        f"{context.latitude:.6f}, {context.longitude:.6f}"
                    )
                    return context
                else:
                    logger.warning(f"⚠️ [LOCATION_MGR] Failed to geocode address: {geocode_result.error_message}")
        
        return None
    
    def _detect_intersection(self, message: str) -> Optional[LocationContext]:
        """
        Detect street intersection in message.
        
        Looks for patterns like:
        - "Yonge and Bloor"
        - "King St and Bay St"
        - "at Queen & University"
        """
        # Intersection patterns
        patterns = [
            # Street1 and/& Street2
            r'([A-Za-z\s]+(?:Street|St|Avenue|Ave|Road|Rd))\s*(?:and|&)\s*([A-Za-z\s]+(?:Street|St|Avenue|Ave|Road|Rd))',
            # at/near Street1 and Street2
            r'(?:at|near)\s+([A-Za-z\s]+)\s*(?:and|&)\s*([A-Za-z\s]+)',
        ]
        
        for pattern in patterns:
            match = re.search(pattern, message, re.IGNORECASE)
            if match:
                street1 = match.group(1).strip()
                street2 = match.group(2).strip()
                
                logger.info(f"🔀 [LOCATION_MGR] Detected intersection: {street1} & {street2}")
                
                # Extract city from message or use default
                city = self._extract_city_from_message(message) or "Toronto"
                
                # Try to geocode the intersection
                geocode_result = self.geocoding_service.geocode_intersection(
                    street1=street1,
                    street2=street2,
                    city=city,
                    province="Ontario"
                )
                
                if geocode_result.success and geocode_result.location:
                    loc = geocode_result.location
                    context = LocationContext(
                        location_type=LocationType.INTERSECTION,
                        raw_input=message,
                        latitude=loc.latitude,
                        longitude=loc.longitude,
                        formatted_address=loc.formatted_address,
                        confidence=loc.confidence,
                        city=city,
                        province="Ontario",
                        search_radius_km=1.0,  # 1km for intersections (increased from 0.5km - too restrictive)
                        is_validated=True,
                        detection_method='geocoding_service'
                    )
                    
                    logger.info(
                        f"✅ [LOCATION_MGR] Geocoded intersection: "
                        f"{context.latitude:.6f}, {context.longitude:.6f}"
                    )
                    return context
                else:
                    logger.warning(f"⚠️ [LOCATION_MGR] Failed to geocode intersection: {geocode_result.error_message}")
        
        return None
    
    def _detect_neighborhood(self, message: str) -> Optional[LocationContext]:
        """
        Detect neighborhood name in message.
        
        Looks for patterns like:
        - "in Liberty Village"
        - "near Yorkville"
        - "downtown Toronto"
        """
        # Known neighborhoods (could be expanded or loaded from DB)
        known_neighborhoods = [
            'liberty village', 'yorkville', 'cabbagetown', 'distillery district',
            'the annex', 'high park', 'leslieville', 'riverdale', 'beaches',
            'rosedale', 'forest hill', 'the junction', 'king west', 'queen west',
            'entertainment district', 'financial district', 'harbourfront',
            'downtown', 'midtown', 'uptown', 'etobicoke', 'scarborough', 'north york'
        ]
        
        message_lower = message.lower()
        
        for neighborhood in known_neighborhoods:
            if neighborhood in message_lower:
                logger.info(f"🏘️ [LOCATION_MGR] Detected neighborhood: {neighborhood}")
                
                # Extract city or use default
                city = self._extract_city_from_message(message) or "Toronto"
                
                # Try to geocode the neighborhood
                geocode_result = self.geocoding_service.geocode_neighborhood(
                    neighborhood=neighborhood.title(),
                    city=city,
                    province="Ontario"
                )
                
                if geocode_result.success and geocode_result.location:
                    loc = geocode_result.location
                    context = LocationContext(
                        location_type=LocationType.NEIGHBORHOOD,
                        raw_input=message,
                        latitude=loc.latitude,
                        longitude=loc.longitude,
                        formatted_address=loc.formatted_address,
                        confidence=loc.confidence,
                        neighborhood=neighborhood.title(),
                        city=city,
                        province="Ontario",
                        search_radius_km=3.0,  # 3km for neighborhoods (increased from 2km)
                        is_validated=True,
                        detection_method='geocoding_service'
                    )
                    
                    logger.info(
                        f"✅ [LOCATION_MGR] Geocoded neighborhood: "
                        f"{context.latitude:.6f}, {context.longitude:.6f}"
                    )
                    return context
                else:
                    logger.warning(f"⚠️ [LOCATION_MGR] Failed to geocode neighborhood: {geocode_result.error_message}")
        
        return None
    
    def _extract_city_from_message(self, message: str) -> Optional[str]:
        """Extract city name from message if present"""
        cities = [
            'Toronto', 'Mississauga', 'Brampton', 'Markham', 'Vaughan',
            'Richmond Hill', 'Oakville', 'Burlington', 'Hamilton', 'Ottawa',
            'Vancouver', 'Calgary', 'Montreal', 'Edmonton'
        ]
        
        message_lower = message.lower()
        for city in cities:
            if city.lower() in message_lower:
                return city
        
        return None
    
    def set_location_context(self, context: LocationContext) -> None:
        """
        Set the current location context for the conversation.
        
        Args:
            context: LocationContext to set
        """
        self.current_location = context
        logger.info(f"📍 [LOCATION_MGR] Location context set: {context.location_type.value}")
    
    def get_location_context(self) -> Optional[LocationContext]:
        """Get the current location context"""
        return self.current_location
    
    def clear_location_context(self) -> None:
        """Clear the current location context"""
        self.current_location = None
        logger.info("🧹 [LOCATION_MGR] Location context cleared")
    
    def get_search_radius(self) -> float:
        """Get the search radius for current location context"""
        if self.current_location:
            return self.current_location.search_radius_km
        return 5.0  # Default 5km
    
    def get_lat_lng(self) -> Optional[Tuple[float, float]]:
        """Get (latitude, longitude) tuple for current location"""
        if self.current_location and self.current_location.latitude and self.current_location.longitude:
            return (self.current_location.latitude, self.current_location.longitude)
        return None
    
    def format_location_for_voice(self) -> str:
        """
        Format current location for voice output.
        
        Returns:
            Human-readable location description
        """
        if not self.current_location:
            return "No location set"
        
        ctx = self.current_location
        
        if ctx.location_type == LocationType.POSTAL_CODE:
            if ctx.city:
                return f"postal code {ctx.postal_code} in {ctx.city}"
            return f"postal code {ctx.postal_code}"
        
        elif ctx.location_type == LocationType.ADDRESS:
            return f"address {ctx.formatted_address or ctx.street_address}"
        
        elif ctx.location_type == LocationType.INTERSECTION:
            return f"intersection near {ctx.formatted_address}"
        
        elif ctx.location_type == LocationType.NEIGHBORHOOD:
            return f"{ctx.neighborhood} neighborhood in {ctx.city}"
        
        elif ctx.location_type == LocationType.CITY:
            return f"city of {ctx.city}"
        
        return "your specified location"
    
    def validate_postal_city_match(self, postal_code: str, city: str) -> Dict[str, Any]:
        """
        Validate if a postal code matches the given city.
        Uses new PostalCodeService for validation.
        
        Args:
            postal_code: Canadian postal code
            city: City name to validate against
            
        Returns:
            Dictionary with validation results
        """
        is_valid, suggested_city = self.postal_code_service.validate_city_for_postal_code(
            postal_code, city
        )
        
        return {
            'valid': is_valid,
            'postal_code': postal_code,
            'provided_city': city,
            'correct_city': suggested_city,
            'message': (
                f"Postal code {postal_code} belongs to {suggested_city}, not {city}"
                if not is_valid else
                f"Postal code {postal_code} matches {city}"
            )
        }
    
    def _detect_intersection_photon(self, message: str) -> Optional[LocationContext]:
        """
        Detect street intersection using Photon geocoding.
        
        Uses intersection_detector to identify patterns, then Photon for accurate geocoding.
        
        Args:
            message: User message
            
        Returns:
            LocationContext with intersection info if detected
        """
        if not self.intersection_detector or not self.photon_service:
            return None
        
        # Detect intersection pattern
        intersection_match = self.intersection_detector.detect(message)
        if not intersection_match:
            return None
        
        logger.info(
            f"🚦 [LOCATION_MGR] Intersection detected via Photon: "
            f"{intersection_match.street1} & {intersection_match.street2}"
        )
        
        # Extract city from message (simple heuristic)
        city = self._extract_city_from_message(message)
        if not city:
            city = "Toronto"  # Default for Canadian real estate
        
        # Geocode via Photon
        photon_result = self.photon_service.geocode_intersection(
            street1=intersection_match.street1,
            street2=intersection_match.street2,
            city=city
        )
        
        if not photon_result:
            logger.warning(f"⚠️ [LOCATION_MGR] Photon failed to geocode intersection")
            return None
        
        # Determine radius based on type - INCREASED to prevent zero results
        # Previous values (300m, 500m) were too restrictive for real estate searches
        radius_m = 1000  # Default 1km for intersections
        if photon_result.type == "intersection":
            radius_m = 800  # Intersections: 800m radius (was 300m)
        elif photon_result.type == "street":
            radius_m = 2000  # Streets: 2km radius (was 500m) - streets span long distances
        
        # Set street_address so orchestrator detects it as an address-type location
        context = LocationContext(
            location_type=LocationType.INTERSECTION,
            raw_input=message,
            latitude=photon_result.lat,
            longitude=photon_result.lng,
            formatted_address=photon_result.label,
            confidence=photon_result.confidence,
            city=city,
            street_address=photon_result.label,  # Set this so orchestrator's elif branch executes
            search_radius_km=radius_m / 1000.0,
            is_validated=True,
            detection_method='photon_intersection'
        )
        
        logger.info(
            f"✅ [LOCATION_MGR] Photon geocoded intersection: "
            f"{photon_result.lat:.6f}, {photon_result.lng:.6f} "
            f"(confidence: {photon_result.confidence:.2f}, radius: {radius_m}m)"
        )
        
        return context
    
    def _detect_location_photon(self, message: str) -> Optional[LocationContext]:
        """
        Detect ambiguous/partial location using Photon geocoding.
        
        Handles:
        - Partial street names ("Robson Street Vancouver")
        - Landmarks ("CN Tower Toronto")
        - Neighborhoods ("Yaletown Vancouver")
        
        Args:
            message: User message
            
        Returns:
            LocationContext with geocoded location if successful
        """
        if not self.photon_service:
            return None
        
        # Extract city hint
        city = self._extract_city_from_message(message)
        
        # Try Photon geocoding
        photon_result = self.photon_service.geocode(
            query=message,
            city=city
        )
        
        if not photon_result:
            return None
        
        # Only accept high-confidence results for ambiguous queries
        if photon_result.confidence < 0.7:
            logger.info(
                f"⚠️ [LOCATION_MGR] Photon result rejected (low confidence: {photon_result.confidence:.2f})"
            )
            return None
        
        # Map Photon type to our LocationType
        location_type_map = {
            'street': LocationType.ADDRESS,
            'neighborhood': LocationType.NEIGHBORHOOD,
            'landmark': LocationType.NEIGHBORHOOD,
            'intersection': LocationType.INTERSECTION,
        }
        location_type = location_type_map.get(photon_result.type, LocationType.NEIGHBORHOOD)
        
        # Determine radius based on type - INCREASED to prevent zero results
        # Previous values were too restrictive for real estate searches
        # "King West Toronto" should return properties, not 0
        radius_map = {
            'street': 2000,       # Streets: 2km (was 500m) - streets span long distances
            'intersection': 1000, # Intersections: 1km (was 400m)
            'neighborhood': 2500, # Neighborhoods: 2.5km (was 1200m)
            'landmark': 1500,     # Landmarks: 1.5km (was 600m)
        }
        radius_m = radius_map.get(photon_result.type, 1500)  # Default 1.5km (was 800m)
        
        # Set the appropriate field based on location_type so orchestrator can detect it
        street_address = None
        neighborhood = None
        if location_type == LocationType.ADDRESS or location_type == LocationType.INTERSECTION:
            street_address = photon_result.label
        elif location_type == LocationType.NEIGHBORHOOD:
            neighborhood = photon_result.label
        
        context = LocationContext(
            location_type=location_type,
            raw_input=message,
            latitude=photon_result.lat,
            longitude=photon_result.lng,
            formatted_address=photon_result.label,
            confidence=photon_result.confidence,
            city=city,
            street_address=street_address,
            neighborhood=neighborhood,
            search_radius_km=radius_m / 1000.0,
            is_validated=True,
            detection_method='photon_general'
        )
        
        logger.info(
            f"✅ [LOCATION_MGR] Photon geocoded location: "
            f"{photon_result.label} at {photon_result.lat:.6f}, {photon_result.lng:.6f} "
            f"(type: {photon_result.type}, confidence: {photon_result.confidence:.2f}, radius: {radius_m}m)"
        )
        
        return context
    
    def _extract_city_from_message(self, message: str) -> Optional[str]:
        """
        Extract city name from message using simple pattern matching.
        
        Args:
            message: User message
            
        Returns:
            City name if found, None otherwise
        """
        # Common Canadian cities
        cities = [
            'Toronto', 'Vancouver', 'Montreal', 'Calgary', 'Edmonton',
            'Ottawa', 'Mississauga', 'Winnipeg', 'Quebec City', 'Hamilton',
            'Brampton', 'Surrey', 'Kitchener', 'London', 'Victoria',
            'Markham', 'Halifax', 'Vaughan', 'Gatineau', 'Saskatoon'
        ]
        
        message_lower = message.lower()
        for city in cities:
            if city.lower() in message_lower:
                return city
        
        return None


# Global singleton instance
_location_context_manager: Optional[LocationContextManager] = None


def get_location_context_manager() -> LocationContextManager:
    """
    Get singleton location context manager instance.
    
    Returns:
        LocationContextManager instance
    """
    global _location_context_manager
    if _location_context_manager is None:
        _location_context_manager = LocationContextManager()
    return _location_context_manager


def reset_location_context_manager() -> None:
    """Reset the singleton instance (useful for testing)"""
    global _location_context_manager
    _location_context_manager = None
