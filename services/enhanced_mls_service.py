"""
Enhanced MLS Query Service
==========================
Accepts ConversationState and builds comprehensive property queries.

Handles:
- All standard filters (location, bedrooms, bathrooms, price, property type)
- Amenities (pool, gym, parking, etc.)
- Rental listings (listingType=Lease)
- Context-aware query building
- Fallback handling for missing data

Author: Summitly Team
Date: December 12, 2025
"""

import logging
from typing import Dict, List, Optional, Any
from services.conversation_state import ConversationState

logger = logging.getLogger(__name__)


class EnhancedMLSQueryService:
    """
    Enhanced MLS query service that works with ConversationState.
    Builds comprehensive queries combining context with new user input.
    """
    
    def __init__(self, listings_service=None):
        """
        Initialize with MLS listings service.
        
        Args:
            listings_service: Repliers listings service instance
        """
        self.listings_service = listings_service
        logger.info("EnhancedMLSQueryService initialized")
    
    def search_properties(
        self,
        state: ConversationState,
        limit: int = 20
    ) -> Dict[str, Any]:
        """
        Search properties using conversation state.
        
        Args:
            state: ConversationState with all search criteria
            limit: Maximum number of results
            
        Returns:
            Dictionary with:
                - results: List of properties
                - total: Total count
                - filters_used: Filters applied
                - query_summary: Human-readable summary
        """
        logger.info(f"🔍 Searching properties with state: {state.get_summary()}")
        
        # Build query parameters from state
        query_params = self._build_query_params(state, limit)
        
        try:
            # Import listings service if not provided
            if not self.listings_service:
                from services.listings_service import listings_service
                self.listings_service = listings_service
            
            # Execute search
            logger.info(f"Executing MLS query with params: {query_params}")
            results = self.listings_service.search_listings(**query_params)
            
            # Extract results - API returns 'listings' and 'count', not 'results' and 'total'
            properties = results.get('listings', results.get('results', []))
            total = results.get('count', results.get('total', len(properties)))
            
            logger.info(f"✅ Found {total} properties")
            
            return {
                'success': True,
                'results': properties,
                'total': total,
                'filters_used': state.get_active_filters(),
                'query_summary': state.get_summary(),
                'query_params': query_params
            }
        
        except Exception as e:
            logger.error(f"❌ MLS query error: {e}")
            return {
                'success': False,
                'error': str(e),
                'results': [],
                'total': 0,
                'filters_used': state.get_active_filters(),
                'query_summary': state.get_summary()
            }
    
    def _build_query_params(self, state: ConversationState, limit: int) -> Dict[str, Any]:
        """
        Build MLS query parameters from conversation state.
        
        Args:
            state: ConversationState
            limit: Result limit
            
        Returns:
            Dictionary of query parameters for MLS API
        """
        params = {}
        
        # Location with GTA expansion
        if state.location:
            location_lower = state.location.lower()
            
            # Handle GTA/Greater Toronto Area as multiple city search
            if location_lower in ['gta', 'greater toronto area']:
                # For GTA, we'll search Toronto specifically (largest city) to get results
                # The API doesn't support multi-city queries, so we use Toronto as primary
                params['city'] = 'Toronto'
                logger.info(f"🏠 [GTA EXPANSION] Expanded '{state.location}' to search Toronto (primary GTA city)")
            elif any(keyword in location_lower for keyword in 
                     ['downtown', 'yorkville', 'liberty village', 'king west', 'queen west']):
                # It's a neighborhood
                params['neighborhood'] = state.location
            else:
                # It's a city
                params['city'] = state.location
        
        # Bedrooms
        if state.bedrooms is not None:
            params['min_bedrooms'] = state.bedrooms
            params['max_bedrooms'] = state.bedrooms
        
        # Bathrooms
        if state.bathrooms is not None:
            params['min_bathrooms'] = state.bathrooms
        
        # Property type - CRITICAL FIX: use property_style not property_type
        if state.property_type:
            params['property_style'] = self._normalize_property_type(state.property_type)
        
        # Price range
        if state.price_range:
            min_price, max_price = state.price_range
            if min_price:
                params['min_price'] = min_price
            if max_price:
                params['max_price'] = max_price
        
        # Listing type (sale vs rent) - FIXED: use transaction_type not listing_type
        if state.listing_type == 'rent':
            params['transaction_type'] = 'lease'
        else:
            params['transaction_type'] = 'sale'
        
        # Status - always search for active listings
        params['status'] = 'active'
        
        # Square footage
        if state.sqft_range:
            min_sqft, max_sqft = state.sqft_range
            if min_sqft:
                params['min_sqft'] = min_sqft
            if max_sqft:
                params['max_sqft'] = max_sqft
        
        # Parking
        if state.parking_spots is not None:
            params['parking_spaces'] = state.parking_spots
        
        # Amenities (Note: MLS API support varies)
        # We'll handle these as best we can or filter client-side
        if state.amenities:
            amenity_params = self._map_amenities_to_params(state.amenities)
            params.update(amenity_params)
        
        # Result limit - FIXED: use page_size not limit
        params['page_size'] = limit
        params['page'] = 1
        
        logger.debug(f"Built query params: {params}")
        return params
    
    def _normalize_property_type(self, property_type: str) -> str:
        """
        Normalize property type to MLS API format.
        
        Args:
            property_type: Property type from state
            
        Returns:
            Normalized property type for MLS API (lowercase)
        """
        type_mapping = {
            'condo': 'condo',
            'detached': 'detached',
            'townhouse': 'townhouse',
            'semi-detached': 'semi-detached',
            'apartment': 'condo',
            'house': 'detached'
        }
        
        return type_mapping.get(property_type.lower(), property_type.lower())
    
    def _map_amenities_to_params(self, amenities: List[str]) -> Dict[str, Any]:
        """
        Map amenities to MLS query parameters.
        
        Note: Not all MLS APIs support amenity filtering directly.
        This provides best-effort mapping where possible.
        
        Args:
            amenities: List of amenity strings
            
        Returns:
            Dictionary of amenity-related parameters
        """
        params = {}
        
        # Pool
        if 'pool' in amenities:
            params['has_pool'] = True
        
        # Garage/Parking
        if 'parking' in amenities or 'garage' in amenities:
            # Ensure at least 1 parking spot
            if 'parking_spaces' not in params:
                params['min_parking_spaces'] = 1
        
        # Waterfront
        if 'waterfront' in amenities:
            params['waterfront'] = True
        
        # For amenities not directly supported by API,
        # we'll need to filter client-side after getting results
        # Store them for potential client-side filtering
        unsupported_amenities = [
            a for a in amenities 
            if a not in ['pool', 'parking', 'garage', 'waterfront']
        ]
        
        if unsupported_amenities:
            logger.debug(f"Amenities requiring client-side filtering: {unsupported_amenities}")
            params['_client_side_amenities'] = unsupported_amenities
        
        return params
    
    def filter_properties_by_amenities(
        self,
        properties: List[Dict],
        required_amenities: List[str]
    ) -> List[Dict]:
        """
        Client-side filtering for amenities not supported by MLS API.
        
        Args:
            properties: List of property dictionaries
            required_amenities: List of required amenity strings
            
        Returns:
            Filtered list of properties
        """
        if not required_amenities:
            return properties
        
        filtered = []
        
        for prop in properties:
            # Extract property amenities from various possible fields
            prop_amenities = self._extract_property_amenities(prop)
            
            # Check if property has all required amenities
            has_all = all(
                self._property_has_amenity(prop_amenities, amenity)
                for amenity in required_amenities
            )
            
            if has_all:
                filtered.append(prop)
        
        logger.info(f"Client-side amenity filter: {len(properties)} -> {len(filtered)} properties")
        return filtered
    
    def _extract_property_amenities(self, property_data: Dict) -> List[str]:
        """
        Extract amenities from property data.
        
        Args:
            property_data: Property dictionary
            
        Returns:
            List of amenity strings (lowercase)
        """
        amenities = []
        
        # Check various fields where amenities might be listed
        amenity_fields = [
            'amenities', 'features', 'buildingAmenities',
            'propertyFeatures', 'description', 'remarks'
        ]
        
        for field in amenity_fields:
            value = property_data.get(field)
            if value:
                if isinstance(value, list):
                    amenities.extend([str(a).lower() for a in value])
                elif isinstance(value, str):
                    amenities.append(value.lower())
        
        return amenities
    
    def _property_has_amenity(self, property_amenities: List[str], required_amenity: str) -> bool:
        """
        Check if property has a specific amenity.
        
        Args:
            property_amenities: List of amenities from property (lowercase)
            required_amenity: Required amenity string
            
        Returns:
            True if property has the amenity
        """
        # Define search terms for each amenity
        amenity_search_terms = {
            'gym': ['gym', 'fitness', 'exercise room', 'workout'],
            'balcony': ['balcony', 'terrace', 'patio'],
            'garden': ['garden', 'yard', 'backyard'],
            'ensuite': ['ensuite', 'en-suite', 'master bath'],
            'laundry': ['laundry', 'washer', 'dryer'],
            'storage': ['storage', 'locker'],
            'concierge': ['concierge', 'doorman'],
            'elevator': ['elevator', 'lift'],
            'pets': ['pet friendly', 'pets allowed', 'dogs', 'cats']
        }
        
        search_terms = amenity_search_terms.get(required_amenity, [required_amenity])
        
        # Check if any search term appears in property amenities
        return any(
            any(term in prop_amenity for term in search_terms)
            for prop_amenity in property_amenities
        )
    
    def get_property_details(self, property_id: str) -> Optional[Dict]:
        """
        Get detailed information about a specific property.
        
        Args:
            property_id: MLS property ID
            
        Returns:
            Property details dictionary or None
        """
        try:
            if not self.listings_service:
                from services.listings_service import listings_service
                self.listings_service = listings_service
            
            logger.info(f"Fetching details for property {property_id}")
            details = self.listings_service.get_listing_details(property_id)
            
            logger.info(f"✅ Retrieved property details for {property_id}")
            return details
        
        except Exception as e:
            logger.error(f"❌ Error fetching property details: {e}")
            return None


# Global service instance
enhanced_mls_service = EnhancedMLSQueryService()


def search_with_state(state: ConversationState, limit: int = 20) -> Dict[str, Any]:
    """
    Convenience function to search properties with conversation state.
    
    Args:
        state: ConversationState
        limit: Maximum results
        
    Returns:
        Search results dictionary
    """
    return enhanced_mls_service.search_properties(state, limit)


if __name__ == "__main__":
    # Test the service
    print("🧪 Testing EnhancedMLSQueryService...\n")
    
    from services.conversation_state import ConversationState
    
    # Test 1: Basic search
    print("1️⃣  Testing basic search")
    state = ConversationState(session_id="test")
    state.update_from_dict({
        'location': 'Toronto',
        'bedrooms': 2,
        'property_type': 'condo',
        'price_range': (None, 600000)
    })
    
    service = EnhancedMLSQueryService()
    params = service._build_query_params(state, 10)
    print(f"Query params: {params}\n")
    
    # Test 2: Rental search with amenities
    print("2️⃣  Testing rental search with amenities")
    state2 = ConversationState(session_id="test2")
    state2.update_from_dict({
        'location': 'Mississauga',
        'bedrooms': 3,
        'listing_type': 'rent',
        'amenities': ['pool', 'gym']
    })
    
    params2 = service._build_query_params(state2, 10)
    print(f"Query params: {params2}\n")
    
    # Test 3: Client-side amenity filtering
    print("3️⃣  Testing client-side amenity filtering")
    mock_properties = [
        {'id': 1, 'features': ['pool', 'gym', 'parking']},
        {'id': 2, 'features': ['parking', 'balcony']},
        {'id': 3, 'amenities': 'Pool and fitness center available'},
    ]
    
    filtered = service.filter_properties_by_amenities(
        mock_properties,
        ['pool', 'gym']
    )
    print(f"Filtered: {len(filtered)} properties match\n")
    
    print("✅ All tests completed!")
