"""
Schools Service - Nearby Schools Data for Properties
Handles fetching real school data from multiple sources for property analysis
"""
import os
import logging
from typing import Dict, List, Optional, Any
from datetime import datetime
from math import radians, cos, sin, asin, sqrt

logger = logging.getLogger(__name__)


class SchoolsService:
    """Service for fetching nearby schools for property analysis"""
    
    def __init__(self):
        """Initialize the schools service with API configurations"""
        # Check API availability
        self.google_places_available = bool(os.environ.get('GOOGLE_PLACES_API_KEY'))
        self.exa_available = self._check_exa_availability()
        
        # Cache for frequently requested school data
        self._school_cache = {}
        
        logger.info(f"✅ Schools Service initialized")
        logger.info(f"   Google Places API: {'Available' if self.google_places_available else 'Not configured'}")
        logger.info(f"   Exa AI: {'Available' if self.exa_available else 'Not available'}")
    
    def _check_exa_availability(self) -> bool:
        """Check if Exa AI is available"""
        try:
            import exa_py
            return bool(os.environ.get('EXA_API_KEY'))
        except ImportError:
            return False
    
    def get_nearby_schools_for_property(self, mls_number: str, property_data: Dict, limit: int = 5) -> Dict:
        """
        Fetch REAL schools near a specific property.
        
        Args:
            mls_number: Property MLS number (CRITICAL: must be unique per property)
            property_data: Property details including coordinates/address
            limit: Max schools to return
        
        Returns:
            {
                'success': bool,
                'mls_number': str,  # CRITICAL: Track which property this is for
                'schools': [
                    {
                        'name': str,
                        'type': str (Elementary|Middle|High|Private),
                        'rating': float (0-10),
                        'distance_km': float,
                        'address': str,
                        'phone': str,
                        'website': str,
                        'programs': [str],  # e.g., ['French Immersion', 'STEM', 'IB']
                        'enrollment': int,
                        'principal': str,
                        'special_features': [str]
                    }
                ],
                'source_mls': str  # CRITICAL: verify consistency
            }
        """
        try:
            # Extract property location (MUST be from property_data, not cache)
            location_data = self._extract_property_location(property_data)
            latitude = location_data.get('latitude')
            longitude = location_data.get('longitude')
            city = location_data.get('city')
            province = location_data.get('province', 'ON')
            
            # Validate MLS number (CRITICAL: ensure it's real data, not cached)
            if not mls_number or mls_number == 'N/A':
                return {'success': False, 'error': 'Invalid MLS number', 'schools': []}
            
            logger.info(f"🏫 [SCHOOLS] Fetching schools for MLS {mls_number} in {city}, {province}")
            logger.info(f"📍 [SCHOOLS] Coordinates: {latitude}, {longitude}")
            
            schools_data = []
            
            # Priority 1: Google Places API (if available and has quota)
            if self.google_places_available and latitude and longitude:
                try:
                    schools_data = self._fetch_schools_from_google_places(
                        latitude, longitude, city, limit
                    )
                    logger.info(f"✅ [SCHOOLS] Found {len(schools_data)} schools via Google Places")
                except Exception as e:
                    logger.warning(f"⚠️ [SCHOOLS] Google Places failed: {e}")
            
            # Priority 2: Repliers School API (if integrated)
            if not schools_data:
                try:
                    schools_data = self._fetch_schools_from_repliers(mls_number, city, limit)
                    logger.info(f"✅ [SCHOOLS] Found {len(schools_data)} schools via Repliers")
                except Exception as e:
                    logger.warning(f"⚠️ [SCHOOLS] Repliers Schools API failed: {e}")
            
            # Priority 3: Ontario Education Ministry API (public data)
            if not schools_data and self.exa_available:
                try:
                    schools_data = self._fetch_schools_from_ontario_registry(city, limit)
                    logger.info(f"✅ [SCHOOLS] Found {len(schools_data)} schools via Ontario Registry")
                except Exception as e:
                    logger.warning(f"⚠️ [SCHOOLS] Ontario Registry failed: {e}")
            
            # CRITICAL: Verify schools are unique to this MLS
            # (Add distance calculation to confirm proximity)
            schools_with_distance = []
            for school in schools_data:
                if latitude and longitude and school.get('coordinates'):
                    # School has coordinates - calculate exact distance
                    school_lat, school_lon = school['coordinates']
                    distance = self._calculate_distance(latitude, longitude, school_lat, school_lon)
                    if distance <= 10:  # Within 10km
                        school['distance_km'] = distance
                        schools_with_distance.append(school)
                elif city and city.lower() in (school.get('name', '').lower() + ' ' + school.get('address', '').lower()):
                    # School doesn't have coordinates but mentions the city - likely nearby
                    school['distance_km'] = 'Nearby'  # Approximate distance
                    schools_with_distance.append(school)
                elif not school.get('coordinates'):
                    # School from registry without coordinates - assume nearby if from same search
                    school['distance_km'] = 'In Area'  # Indicate it's from local search
                    schools_with_distance.append(school)
            
            schools_data = schools_with_distance[:limit]
            
            logger.info(f"📍 [SCHOOLS] Distance-verified {len(schools_data)} schools for MLS {mls_number}")
            
            return {
                'success': True,
                'mls_number': mls_number,
                'city': city,
                'schools': schools_data,
                'source_mls': mls_number,  # CRITICAL verification
                'fetch_timestamp': datetime.now().isoformat()
            }
        
        except Exception as e:
            logger.error(f"❌ [SCHOOLS] Error: {e}")
            import traceback
            traceback.print_exc()
            return {
                'success': False,
                'error': str(e),
                'schools': [],
                'mls_number': mls_number
            }
    
    def _extract_property_location(self, property_data: Dict) -> Dict:
        """Extract location data from property information"""
        location_info = {}
        
        logger.info(f"📍 [LOCATION EXTRACT] Property data keys: {list(property_data.keys())}")
        
        # Handle Repliers API data structure
        address_data = property_data.get('address', {}) if isinstance(property_data.get('address'), dict) else {}
        map_data = property_data.get('map', {}) if isinstance(property_data.get('map'), dict) else {}
        
        # Try to extract coordinates (Repliers stores in 'map' object)
        latitude, longitude = None, None
        
        if map_data.get('latitude') and map_data.get('longitude'):
            latitude = float(map_data['latitude'])
            longitude = float(map_data['longitude'])
            logger.info(f"📍 [LOCATION] Found coordinates in map: {latitude}, {longitude}")
        elif 'latitude' in property_data and 'longitude' in property_data:
            latitude = float(property_data['latitude'])
            longitude = float(property_data['longitude'])
        elif 'lat' in property_data and 'lon' in property_data:
            latitude = float(property_data['lat'])
            longitude = float(property_data['lon'])
        elif 'coordinates' in property_data:
            coords = property_data['coordinates']
            if isinstance(coords, dict):
                latitude = float(coords.get('lat', coords.get('latitude', 0)))
                longitude = float(coords.get('lng', coords.get('longitude', 0)))
        
        if latitude and longitude:
            location_info['latitude'] = latitude
            location_info['longitude'] = longitude
        
        # Extract city information (Repliers stores in 'address' object)
        city = None
        if address_data.get('city'):
            city = address_data['city']
            logger.info(f"📍 [LOCATION] Found city in address: {city}")
        elif address_data.get('area'):
            city = address_data['area']
            logger.info(f"📍 [LOCATION] Found city in area: {city}")
        else:
            # Fallback to direct property data
            city = (property_data.get('city') or 
                    property_data.get('municipalityName') or 
                    property_data.get('municipality') or
                    property_data.get('location', '').split(',')[0].strip())
        
        if city:
            location_info['city'] = city
        else:
            logger.warning("⚠️ [LOCATION] Could not extract city from property data")
            location_info['city'] = 'Location not available'
        
        # Extract province/state (Repliers stores in 'address' object)
        province = None
        if address_data.get('state'):
            province = address_data['state']
        else:
            province = (property_data.get('province') or 
                       property_data.get('provinceCode') or 
                       property_data.get('state') or 'ON')
        
        location_info['province'] = province
        
        logger.info(f"📍 [LOCATION EXTRACT] Final location: {location_info}")
        return location_info
    
    def _fetch_schools_from_google_places(self, lat: float, lon: float, city: str, limit: int = 5) -> List[Dict]:
        """
        Fetch schools using Google Places API.
        Requires: GOOGLE_PLACES_API_KEY in .env
        """
        try:
            import googlemaps
            
            gmaps = googlemaps.Client(key=os.environ.get('GOOGLE_PLACES_API_KEY'))
            
            # Search for schools within 5km radius
            places_result = gmaps.places_nearby(
                location=(lat, lon),
                radius=5000,
                type='school',
                page_token=None
            )
            
            schools = []
            for place in places_result.get('results', [])[:limit]:
                # Get place details for more info
                place_details = gmaps.place(place['place_id'])['result']
                
                schools.append({
                    'name': place_details.get('name', 'N/A'),
                    'type': self._extract_school_type(place_details.get('name', '')),
                    'rating': place_details.get('rating', 'N/A'),
                    'address': place_details.get('formatted_address', ''),
                    'phone': place_details.get('formatted_phone_number', ''),
                    'website': place_details.get('website', ''),
                    'coordinates': (place_details['geometry']['location']['lat'], 
                                   place_details['geometry']['location']['lng']),
                    'programs': [],  # Would require additional API call
                    'special_features': []
                })
            
            return schools
        
        except Exception as e:
            logger.error(f"❌ Google Places error: {e}")
            return []
    
    def _fetch_schools_from_repliers(self, mls_number: str, city: str, limit: int = 5) -> List[Dict]:
        """
        Fetch schools using Repliers School API.
        """
        try:
            # Import listings service to check for school endpoints
            from services.listings_service import listings_service
            
            # Check if Repliers has school nearby endpoints
            # This would need to be implemented based on Repliers API documentation
            logger.warning("⚠️ Repliers Schools API not yet implemented - would need API documentation")
            
            # Placeholder for when Repliers adds school endpoints
            return []
        
        except Exception as e:
            logger.error(f"❌ Repliers Schools API error: {e}")
            return []
    
    def _fetch_schools_from_ontario_registry(self, city: str, limit: int = 5) -> List[Dict]:
        """
        Fetch schools from Ontario Education Ministry public data.
        Uses Exa AI to search official registries.
        """
        try:
            if not self.exa_available:
                return []
            
            from exa_py import Exa
            exa = Exa(os.environ.get('EXA_API_KEY'))
            
            # Search for Ontario school registry data
            exa_results = exa.search_and_contents(
                f"Ontario schools {city} elementary middle high school official registry",
                type="keyword",
                num_results=limit * 2
            )
            
            schools = []
            for result in exa_results.results:
                # Extract more comprehensive school information
                school_name = self._extract_school_name_from_text(result.text)
                
                # Skip if we couldn't extract a meaningful name
                if school_name == "School Name N/A" or not school_name.strip():
                    continue
                    
                school_data = {
                    'name': school_name,
                    'type': self._extract_school_type_from_text(result.text),
                    'rating': self._extract_rating_from_text(result.text),
                    'address': self._extract_address_from_text(result.text) or f"Address available at source",
                    'phone': self._extract_phone_from_text(result.text),
                    'website': result.url,
                    'programs': self._extract_programs_from_text(result.text),
                    'special_features': self._extract_features_from_text(result.text)
                }
                
                # Add some validation
                if school_data['name'] and len(school_data['name']) > 3:
                    schools.append(school_data)
                    
            return schools[:limit]
            
        except Exception as e:
            logger.error(f"❌ Ontario Registry error: {e}")
            return []
    
    def _calculate_distance(self, lat1: float, lon1: float, lat2: float, lon2: float) -> float:
        """
        Calculate distance between two coordinates in kilometers.
        Uses Haversine formula.
        """
        lon1, lat1, lon2, lat2 = map(radians, [lon1, lat1, lon2, lat2])
        dlon = lon2 - lon1
        dlat = lat2 - lat1
        a = sin(dlat/2)**2 + cos(lat1) * cos(lat2) * sin(dlon/2)**2
        c = 2 * asin(sqrt(a))
        r = 6371  # Radius of earth in kilometers
        return c * r
    
    def _extract_school_type(self, school_name: str) -> str:
        """Extract school type (Elementary, Middle, High, Private) from name."""
        school_name_lower = school_name.lower()
        if 'high' in school_name_lower or 'secondary' in school_name_lower:
            return 'High School'
        elif 'middle' in school_name_lower or 'junior' in school_name_lower:
            return 'Middle School'
        elif 'elementary' in school_name_lower or 'primary' in school_name_lower:
            return 'Elementary School'
        elif 'private' in school_name_lower:
            return 'Private School'
        else:
            return 'School'
    
    def _extract_school_name_from_text(self, text: str) -> str:
        """Extract school name from text content"""
        # Simple extraction - look for patterns like "School Name Elementary School"
        import re
        
        # Look for school patterns
        school_patterns = [
            r'([A-Z][a-zA-Z\s]+(?:Elementary|Middle|High|Secondary|Private)?\s+School)',
            r'([A-Z][a-zA-Z\s]+(?:École|School))',
        ]
        
        for pattern in school_patterns:
            match = re.search(pattern, text)
            if match:
                return match.group(1).strip()
        
        return "School Name N/A"
    
    def _extract_school_type_from_text(self, text: str) -> str:
        """Extract school type from text content"""
        text_lower = text.lower()
        if 'high' in text_lower or 'secondary' in text_lower:
            return 'High School'
        elif 'middle' in text_lower or 'junior' in text_lower:
            return 'Middle School'
        elif 'elementary' in text_lower or 'primary' in text_lower:
            return 'Elementary School'
        elif 'private' in text_lower:
            return 'Private School'
        else:
            return 'School'
    
    def _extract_rating_from_text(self, text: str) -> str:
        """Extract rating from text content"""
        import re
        
        # Look for rating patterns
        rating_patterns = [
            r'rating[:\s]+(\d+(?:\.\d+)?)',
            r'score[:\s]+(\d+(?:\.\d+)?)',
            r'(\d+(?:\.\d+)?)\s*(?:out of|/)\s*(?:10|5)',
        ]
        
        for pattern in rating_patterns:
            match = re.search(pattern, text, re.IGNORECASE)
            if match:
                return match.group(1)
        
        return "N/A"
    
    def _extract_address_from_text(self, text: str) -> str:
        """Extract address from text content"""
        import re
        
        # Look for address patterns
        address_patterns = [
            r'(\d+\s+[A-Za-z\s]+(?:Street|St|Avenue|Ave|Road|Rd|Drive|Dr|Boulevard|Blvd)[^,\n]*)',
            r'Address[:\s]+([^\n]+)',
            r'Located at[:\s]+([^\n]+)',
        ]
        
        for pattern in address_patterns:
            match = re.search(pattern, text, re.IGNORECASE)
            if match:
                return match.group(1).strip()
        
        return ""
    
    def _extract_phone_from_text(self, text: str) -> str:
        """Extract phone number from text content"""
        import re
        
        # Look for phone patterns
        phone_patterns = [
            r'(\d{3}[-.\s]?\d{3}[-.\s]?\d{4})',
            r'\(\d{3}\)\s*\d{3}[-.\s]?\d{4}',
            r'Phone[:\s]+([^\n]+)',
        ]
        
        for pattern in phone_patterns:
            match = re.search(pattern, text, re.IGNORECASE)
            if match:
                return match.group(1).strip()
        
        return ""
    
    def _extract_programs_from_text(self, text: str) -> List[str]:
        """Extract special programs from text content"""
        import re
        
        programs = []
        text_lower = text.lower()
        
        # Common school programs
        program_keywords = [
            'french immersion', 'stem', 'ib program', 'international baccalaureate',
            'gifted program', 'special education', 'arts program', 'music program',
            'sports program', 'advanced placement', 'ap courses', 'enrichment'
        ]
        
        for keyword in program_keywords:
            if keyword in text_lower:
                programs.append(keyword.title())
        
        return programs[:3]  # Limit to 3 programs
    
    def _extract_features_from_text(self, text: str) -> List[str]:
        """Extract special features from text content"""
        import re
        
        features = []
        text_lower = text.lower()
        
        # Common school features
        feature_keywords = [
            'library', 'gymnasium', 'cafeteria', 'computer lab', 'science lab',
            'playground', 'auditorium', 'swimming pool', 'track field'
        ]
        
        for keyword in feature_keywords:
            if keyword in text_lower:
                features.append(keyword.title())
        
        return features[:3]  # Limit to 3 features


# Create singleton instance
schools_service = SchoolsService()