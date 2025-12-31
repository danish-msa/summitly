"""
Repliers API Filter Mapper
============================
Comprehensive filter-mapping layer that converts natural language queries and
ConversationState into valid Repliers API search parameters.

This module ensures:
- Correct parameter naming (minListDate vs listedAfter)
- Location hierarchy validation (city/community/neighborhood)
- Property type normalization
- Date filter application based on user intent
- Complete support for all Repliers API parameters
- Neighborhood alias expansion (King West -> Niagara, etc.)
- ADDRESS KEY SUPPORT: addressKey-based exact and street-level searches

Author: Summitly Team
Date: December 15, 2025
"""

import logging
import re
from typing import Dict, Any, Optional, List, Tuple, TYPE_CHECKING
from datetime import datetime, timedelta
from services.neighborhood_normalizer import normalize_neighborhood, should_expand_neighborhood

# Avoid circular imports
if TYPE_CHECKING:
    from services.address_key_normalizer import NormalizedAddress
    from services.conversation_state import ConversationState

logger = logging.getLogger(__name__)


# ===========================
# PROPERTY TYPE MAPPINGS
# ===========================

PROPERTY_TYPE_MAPPING = {
    # Common residential types
    'detached': 'Detached',
    'house': 'Detached',
    'single family': 'Detached',
    'semi-detached': 'Semi-Detached',
    'semi detached': 'Semi-Detached',
    'semi': 'Semi-Detached',
    'townhouse': 'Townhouse',
    'town': 'Townhouse',
    'condo': 'Condo Apartment',
    'condo apartment': 'Condo Apartment',
    'apartment': 'Condo Apartment',
    'condo townhouse': 'Condo Townhouse',
    'duplex': 'Duplex',
    'triplex': 'Triplex',
    'fourplex': 'Fourplex',
    
    # Commercial
    'commercial': 'Commercial',
    'office': 'Commercial/Office',
    'retail': 'Commercial/Retail',
    
    # Land
    'vacant land': 'Vacant Land',
    'land': 'Vacant Land',
    'lot': 'Vacant Land',
}

OWNERSHIP_TYPE_MAPPING = {
    'freehold': 'Freehold',
    'condo': 'Condo',
    'condominium': 'Condo',
    'co-op': 'Co-op',
    'cooperative': 'Co-op',
    'leasehold': 'Leasehold',
}

PROPERTY_STYLE_MAPPING = {
    '2-storey': '2-Storey',
    '2 storey': '2-Storey',
    'two storey': '2-Storey',
    'bungalow': 'Bungalow',
    'backsplit': 'Backsplit',
    'sidesplit': 'Sidesplit',
    'apartment': 'Apartment',
    'loft': 'Loft',
    'penthouse': 'Penthouse',
}


# ===========================
# LOCATION VALIDATION
# ===========================

# GTA cities and their common neighborhoods/communities
LOCATION_HIERARCHY = {
    'Toronto': {
        'communities': [
            'Downtown Core', 'Etobicoke', 'North York', 'Scarborough', 'York',
            'East York', 'The Beaches', 'Rosedale', 'Forest Hill', 'High Park'
        ],
        'neighborhoods': [
            'Yorkville', 'Liberty Village', 'King West', 'Queen West',
            'Distillery District', 'Leslieville', 'Riverdale', 'Danforth',
            'Annex', 'Junction', 'Bloor West Village'
        ]
    },
    'Mississauga': {
        'communities': [
            'Port Credit', 'Streetsville', 'Meadowvale', 'Erin Mills',
            'Square One', 'Lakeview', 'Clarkson'
        ],
        'neighborhoods': []
    },
    'Vaughan': {
        'communities': [
            'Woodbridge', 'Thornhill', 'Maple', 'Concord', 'Kleinburg'
        ],
        'neighborhoods': []
    },
    'Brampton': {
        'communities': [
            'Downtown Brampton', 'Bramalea', 'Sandalwood', 'Queen Street'
        ],
        'neighborhoods': []
    },
    'Markham': {
        'communities': [
            'Unionville', 'Markham Village', 'Thornhill', 'Cornell',
            'Berczy Village', 'Angus Glen'
        ],
        'neighborhoods': []
    },
    'Richmond Hill': {
        'communities': [
            'Oak Ridges', 'Mill Pond', 'Bayview Hill', 'Elgin Mills'
        ],
        'neighborhoods': []
    },
    'Oakville': {
        'communities': [
            'Old Oakville', 'Glen Abbey', 'Bronte', 'Clearview',
            'River Oaks', 'Uptown Core'
        ],
        'neighborhoods': []
    },
    'Burlington': {
        'communities': [
            'Downtown Burlington', 'Aldershot', 'Millcroft', 'Orchard'
        ],
        'neighborhoods': []
    },
    'Ajax': {
        'communities': ['Downtown Ajax', 'Pickering Village'],
        'neighborhoods': []
    },
    'Whitby': {
        'communities': ['Downtown Whitby', 'Brooklin', 'Port Whitby'],
        'neighborhoods': []
    },
    'Oshawa': {
        'communities': ['Downtown Oshawa', 'Kedron', 'Eastdale'],
        'neighborhoods': []
    },
    'Hamilton': {
        'communities': [
            'Downtown Hamilton', 'Westdale', 'Dundas', 'Ancaster',
            'Stoney Creek', 'Waterdown'
        ],
        'neighborhoods': []
    },
}


def validate_location_hierarchy(
    city: Optional[str],
    community: Optional[str],
    neighborhood: Optional[str]
) -> Tuple[Optional[str], Optional[str], Optional[str], List[str]]:
    """
    Validate and correct location hierarchy to prevent mixing cities.
    
    Args:
        city: City name
        community: Community name
        neighborhood: Neighborhood name
        
    Returns:
        Tuple of (validated_city, validated_community, validated_neighborhood, warnings)
    """
    warnings = []
    
    # If no city specified, try to infer from community/neighborhood
    if not city and (community or neighborhood):
        location_query = (community or neighborhood).title()
        
        # Search for community/neighborhood in hierarchy
        for city_name, data in LOCATION_HIERARCHY.items():
            if location_query in data['communities'] or location_query in data['neighborhoods']:
                city = city_name
                warnings.append(f"Inferred city '{city}' from {location_query}")
                break
    
    # Validate community belongs to city
    if city and community:
        city_title = city.title()
        community_title = community.title()
        
        if city_title in LOCATION_HIERARCHY:
            valid_communities = LOCATION_HIERARCHY[city_title]['communities']
            if community_title not in valid_communities:
                warnings.append(
                    f"Community '{community}' may not belong to {city}. "
                    f"Falling back to city-only search."
                )
                community = None
    
    # Validate neighborhood belongs to city
    if city and neighborhood:
        city_title = city.title()
        neighborhood_title = neighborhood.title()
        
        if city_title in LOCATION_HIERARCHY:
            valid_neighborhoods = LOCATION_HIERARCHY[city_title]['neighborhoods']
            if neighborhood_title not in valid_neighborhoods:
                warnings.append(
                    f"Neighborhood '{neighborhood}' may not belong to {city}. "
                    f"Falling back to city-only search."
                )
                neighborhood = None
    
    # Don't mix city levels - if community is set, clear neighborhood (too specific)
    if community and neighborhood:
        warnings.append(
            "Both community and neighborhood specified. Using community only."
        )
        neighborhood = None
    
    return city, community, neighborhood, warnings


# ===========================
# DATE FILTER LOGIC
# ===========================

def detect_date_intent(user_message: str) -> bool:
    """
    Detect if user wants date filtering based on their message.
    
    Args:
        user_message: User's search query
        
    Returns:
        True if date filtering should be applied
    """
    date_keywords = [
        'new', 'recent', 'recently', 'latest', 'fresh',
        'listed today', 'listed yesterday', 'this week', 'last week',
        'past', 'days', 'just listed', 'newly listed'
    ]
    
    message_lower = user_message.lower()
    return any(keyword in message_lower for keyword in date_keywords)


def parse_date_range(
    user_message: str,
    list_date_from: Optional[str] = None,
    list_date_to: Optional[str] = None
) -> Tuple[Optional[str], Optional[str]]:
    """
    Parse date range from user message or use provided dates.
    
    Args:
        user_message: User's search query
        list_date_from: Explicit start date (YYYY-MM-DD)
        list_date_to: Explicit end date (YYYY-MM-DD)
        
    Returns:
        Tuple of (minListDate, maxListDate) in YYYY-MM-DD format
    """
    # If explicit dates provided, use them
    if list_date_from or list_date_to:
        return list_date_from, list_date_to
    
    # Check if date filtering is needed
    if not detect_date_intent(user_message):
        return None, None
    
    today = datetime.now().date()
    message_lower = user_message.lower()
    
    # Parse relative dates
    if 'today' in message_lower or 'listed today' in message_lower:
        return today.isoformat(), today.isoformat()
    
    elif 'yesterday' in message_lower:
        yesterday = today - timedelta(days=1)
        return yesterday.isoformat(), yesterday.isoformat()
    
    elif 'this week' in message_lower or 'past week' in message_lower:
        week_ago = today - timedelta(days=7)
        return week_ago.isoformat(), today.isoformat()
    
    elif 'last week' in message_lower:
        week_ago = today - timedelta(days=7)
        two_weeks_ago = today - timedelta(days=14)
        return two_weeks_ago.isoformat(), week_ago.isoformat()
    
    elif 'past 3 days' in message_lower or 'last 3 days' in message_lower:
        three_days_ago = today - timedelta(days=3)
        return three_days_ago.isoformat(), today.isoformat()
    
    elif 'past 30 days' in message_lower or 'last month' in message_lower:
        month_ago = today - timedelta(days=30)
        return month_ago.isoformat(), today.isoformat()
    
    # Extract number of days using regex
    days_match = re.search(r'(past|last)\s+(\d+)\s+days?', message_lower)
    if days_match:
        num_days = int(days_match.group(2))
        days_ago = today - timedelta(days=num_days)
        return days_ago.isoformat(), today.isoformat()
    
    # Default for "new" or "recent" - last 7 days
    if 'new' in message_lower or 'recent' in message_lower:
        week_ago = today - timedelta(days=7)
        return week_ago.isoformat(), today.isoformat()
    
    return None, None


# ===========================
# ADDRESS SEARCH BUILDER (NEW)
# ===========================

def buildRepliersAddressSearchParams(
    normalized_address: Any,  # NormalizedAddress type
    listing_type: str = "Sale",
    limit: int = 25,
    additional_filters: Optional[Dict[str, Any]] = None
) -> Dict[str, Any]:
    """
    Build Repliers API parameters for deterministic address-specific searches using addressKey.
    
    RULES:
    1. Exact address search: Use addressKey ONLY if street_number AND street_name present
    2. Street search: Use city fetch + post-filter with addressKey.startswith() 
    3. NO fuzzy q queries for street searches
    
    Args:
        normalized_address: NormalizedAddress with addressKey data
        listing_type: "Sale" or "Rent" (default: "Sale")
        limit: Result limit (default 25)
        additional_filters: Optional filters (beds, price, etc.)
        
    Returns:
        Dictionary of Repliers API parameters for address search
    """
    params = {}
    
    # Basic parameters
    params['transaction_type'] = listing_type
    params['page_size'] = limit
    
    # Determine search strategy based on address components
    components = normalized_address.components if hasattr(normalized_address, 'components') else None
    
    # Track if this is an exact address search (for filter decision below)
    is_exact_address_search = False
    
    # RULE 1: Exact address search - use addressKey ONLY if street_number AND street_name present  
    if (components and components.street_number and components.street_name and 
        hasattr(normalized_address, 'exact_address_key') and normalized_address.exact_address_key):
        
        # Exact address matching with addressKey
        params['address_key'] = normalized_address.exact_address_key
        is_exact_address_search = True
        logger.info(f"🎯 [EXACT_ADDRESS] Using addressKey: {normalized_address.exact_address_key}")
        logger.info(f"🚫 [EXACT_ADDRESS] Skipping additional filters - user wants this specific property")
        
    # RULE 2: Street search - city fetch for post-filtering (NO fuzzy q)
    elif (components and components.street_name and 
          hasattr(normalized_address, 'street_address_key') and normalized_address.street_address_key):
        
        # Use city-based search for street filtering
        params['city'] = components.city or 'Toronto'
        params['page_size'] = 200  # Fetch more for filtering
        logger.info(f"🏘️ [STREET_SEARCH] City fetch for filtering: {params['city']}")
        
        # Store street key for post-filtering
        params['_street_filter_key'] = normalized_address.street_address_key
        params['_search_type'] = 'street_search'
        
    else:
        logger.warning("⚠️ [ADDRESS_SEARCH] No valid deterministic search strategy available")
        return {}
    
    # Apply additional filters ONLY for street searches, NOT for exact address searches
    # For exact address: User wants to see THAT specific property regardless of previous filters
    # For street search: Store filters for POST-FILTERING, NOT API level (to avoid 0 results)
    if additional_filters and not is_exact_address_search:
        # CRITICAL FIX: Don't apply restrictive filters at API level for street searches
        # Store them as internal params for post-filtering only
        params['_post_filters'] = additional_filters
        logger.info(f"➕ [STREET_SEARCH] Filters saved for POST-filtering (not API level): {additional_filters}")
    
    return params


# ===========================
# MAIN FILTER BUILDER
# ===========================

def buildRepliersSearchParams(
    state: Any,  # ConversationState type  
    user_message: str = "",
    limit: int = 25
) -> Dict[str, Any]:
    """
    Build comprehensive Repliers API search parameters from ConversationState.
    
    This function maps ALL supported Repliers API parameters correctly:
    - Property basics (propertyType, transaction_type, ownershipType)
    - Price (minPrice, maxPrice)
    - Beds & Baths (minBeds, maxBeds, minBaths, maxBaths, bedroomsPlus)
    - Location (city, community, neighborhood, postalCode, streetName)
    - Size (minSqft, maxSqft)
    - Condo features (exposure, balcony, locker, amenities)
    - Listing dates (minListDate, maxListDate - NOT listedAfter/listedBefore)
    - MLS & status (mlsNumber, status)
    
    Args:
        state: ConversationState with search criteria
        user_message: Original user message (for date intent detection)
        limit: Result limit (default 25)
        
    Returns:
        Dictionary of Repliers API parameters
    """
    params = {}
    
    logger.info(f"🔨 Building Repliers params from state: {state.get_summary()}")
    
    # Helper function to safely get filter values from either UnifiedConversationState or legacy state
    def get_filter(attr_name, default=None):
        """Get filter value from either state.active_filters (Unified) or state.attr (legacy)"""
        # Try UnifiedConversationState path first
        if hasattr(state, 'active_filters') and hasattr(state.active_filters, attr_name):
            return getattr(state.active_filters, attr_name, default)
        # Fall back to legacy ConversationState path
        return getattr(state, attr_name, default)
    
    # ===== LOCATION (NEW: Use location_state for structured location handling) =====
    location_state = getattr(state, 'location_state', None)
    
    if location_state and not location_state.is_empty():
        # Use structured location_state
        logger.info(f"📍 Using location_state: {location_state.get_summary()}")
        
        # Extract location fields from location_state
        # Handle both snake_case (Pydantic) and camelCase (legacy) attributes
        city = location_state.city
        community = location_state.community
        neighborhood = location_state.neighborhood
        postal_code = getattr(location_state, 'postal_code', None) or getattr(location_state, 'postalCode', None)
        street_name = getattr(location_state, 'street_name', None) or getattr(location_state, 'streetName', None)
        street_number = getattr(location_state, 'street_number', None) or getattr(location_state, 'streetNumber', None)
        
        # PHOTON INTEGRATION: Check if lat/lng coordinates are available
        # When Photon geocoding provides coordinates, we use city-level search + geo-filtering
        # instead of postal code filtering (more accurate for intersections/landmarks)
        latitude = getattr(location_state, 'latitude', None)
        longitude = getattr(location_state, 'longitude', None)
        has_coordinates = latitude is not None and longitude is not None
        
        if has_coordinates:
            logger.info(
                f"🌍 [PHOTON MODE] Coordinates available (lat={latitude:.4f}, lon={longitude:.4f}), "
                f"will use city-level search + geo-filtering instead of postal code"
            )
        
        # Validate location hierarchy
        city, community, neighborhood, location_warnings = validate_location_hierarchy(
            city, community, neighborhood
        )
        
        for warning in location_warnings:
            logger.warning(f"⚠️ Location: {warning}")
        
        # Handle "GTA" as a location
        if city and city.upper() == 'GTA':
            logger.info(f"🏙️ [GTA SEARCH] User requested 'GTA' - defaulting to Toronto")
            city = 'Toronto'
            location_warnings.append("Searching Toronto (GTA's largest city). For other GTA cities, please specify.")
        
        # Apply location fields to params (respecting hierarchy)
        # POSTAL CODE PRIORITY: streetNumber > streetName > postalCode > neighborhood > community > city
        # CRITICAL: DO NOT combine postalCode with streetName
        # PHOTON OVERRIDE: When lat/lng available, skip postal code and use city-level search
        if street_number and street_name:
            params['street_name'] = street_name
            params['street_number'] = street_number
            if city:  # Always include city with street address for better results
                params['city'] = city
            logger.info(f"🏠 Searching specific address: {street_number} {street_name}, {city or 'Toronto'}")
        elif street_name:
            params['street_name'] = street_name
            if city:  # CRITICAL: Include city with street name to narrow down results
                params['city'] = city
            logger.info(f"🛣️ Searching street: {street_name}, {city or 'Toronto'}")
        elif postal_code and not has_coordinates:
            # POSTAL CODE SEARCH: Use postal code + city ONLY
            # DO NOT combine with streetName, neighborhood, or community
            # SKIP if coordinates available (Photon geocoding provides better filtering)
            params['postal_code'] = postal_code
            if city:
                params['city'] = city
                logger.info(f"📮 [POSTAL CODE SEARCH] Searching: {postal_code}, {city}")
            else:
                logger.info(f"📮 [POSTAL CODE SEARCH] Searching: {postal_code} (no city specified)")
            
            # Log validation
            if street_name or neighborhood or community:
                logger.warning(
                    f"⚠️ [POSTAL CODE PRIORITY] Ignoring street/neighborhood/community "
                    f"because postal code is set: {postal_code}"
                )
        elif has_coordinates and city:
            # PHOTON MODE: Use city-level search, let orchestrator geo-filter by distance
            params['city'] = city
            logger.info(
                f"🌍 [PHOTON MODE] Using city-level search: {city} "
                f"(geo-filtering will be applied by orchestrator)"
            )
            if postal_code:
                logger.info(
                    f"📮 [PHOTON MODE] Skipping postal code filter ({postal_code}) "
                    f"in favor of geo-distance filtering"
                )
        elif neighborhood:
            # PRODUCTION FIX: Expand neighborhood aliases (e.g., "King West" -> ["Niagara", ...])
            if should_expand_neighborhood(neighborhood):
                mls_neighborhoods = normalize_neighborhood(neighborhood)
                logger.info(
                    f"🏘️ [NEIGHBORHOOD ALIAS] '{neighborhood}' expanded to {len(mls_neighborhoods)} MLS neighborhoods: {mls_neighborhoods}"
                )
                # Use first neighborhood as primary, but log that we're querying a broader area
                params['neighborhood'] = mls_neighborhoods[0]
                if city:
                    params['city'] = city
                logger.info(f"🏘️ Searching MLS neighborhood: {params['neighborhood']}, {city}")
                # TODO: Future enhancement - query all neighborhoods and merge results
            else:
                params['neighborhood'] = neighborhood
                if city:
                    params['city'] = city
                logger.info(f"🏘️ Searching neighborhood: {neighborhood}, {city}")
        elif community:
            params['community'] = community
            if city:
                params['city'] = city
            logger.info(f"🏙️ Searching community: {community}, {city}")
        elif city:
            params['city'] = city
            logger.info(f"🌆 Searching city: {city}")
    else:
        # Fallback to legacy location fields
        logger.debug("📍 Using legacy location fields (location, community, neighborhood)")
        city, community, neighborhood, location_warnings = validate_location_hierarchy(
            getattr(state, 'location', None),
            getattr(state, 'community', None),
            getattr(state, 'neighborhood', None)
        )
        
        for warning in location_warnings:
            logger.warning(f"⚠️ Location: {warning}")
        
        # Handle "GTA" as a location
        if city and city.upper() == 'GTA':
            logger.info(f"🏙️ [GTA SEARCH] User requested 'GTA' - defaulting to Toronto")
            city = 'Toronto'
        
        if city:
            params['city'] = city
        if community:
            params['community'] = community
        if neighborhood:
            # PRODUCTION FIX: Expand neighborhood aliases (legacy path)
            if should_expand_neighborhood(neighborhood):
                mls_neighborhoods = normalize_neighborhood(neighborhood)
                logger.info(
                    f"🏘️ [NEIGHBORHOOD ALIAS - LEGACY] '{neighborhood}' expanded to {mls_neighborhoods}"
                )
                params['neighborhood'] = mls_neighborhoods[0]
            else:
                params['neighborhood'] = neighborhood
        
        # Postal code
        if hasattr(state, 'postal_code') and state.postal_code:
            params['postal_code'] = state.postal_code
        
        # Street name
        if hasattr(state, 'street_name') and state.street_name:
            params['street_name'] = state.street_name
    
    # ===== PROPERTY BASICS =====
    # Property type
    property_type = get_filter('property_type')
    if property_type:
        normalized = PROPERTY_TYPE_MAPPING.get(
            property_type.lower(),
            property_type
        )
        params['property_type'] = normalized
    
    # Ownership type
    ownership_type = get_filter('ownership_type')
    if ownership_type:
        normalized = OWNERSHIP_TYPE_MAPPING.get(
            ownership_type.lower(),
            ownership_type
        )
        params['ownership_type'] = normalized
    
    # Property style
    property_style = get_filter('property_style')
    if property_style:
        normalized = PROPERTY_STYLE_MAPPING.get(
            property_style.lower(),
            property_style
        )
        params['style'] = normalized
    
    # Transaction type (Sale vs Lease)
    # CRITICAL FIX #2: ALWAYS add transaction_type to prevent rent/sale mixing
    # The Repliers API needs this constraint to avoid returning wrong listing types
    listing_type = get_filter('listing_type')
    if listing_type == 'rent':
        params['transaction_type'] = 'rent'
        logger.debug(f"📋 Added transaction_type: rent (rent requested)")
    elif listing_type == 'sale':
        params['transaction_type'] = 'sale'
        logger.debug(f"📋 Added transaction_type: sale (sale requested)")
    elif listing_type is None:
        # No explicit listing_type - check if we can infer from price
        min_price = params.get('minPrice')
        max_price = params.get('maxPrice')
        if (min_price and min_price > 100000) or (max_price and max_price > 100000):
            # High price indicates sale
            params['transaction_type'] = 'sale'
            logger.info(f"🏠 [AUTO-INFER] Price > $100k → transaction_type=Sale")
        else:
            # Default to Sale for backward compatibility (most queries are sale)
            params['transaction_type'] = 'sale'
            logger.debug(f"� Added transaction_type: sale (default)")
    else:
        # Default to Sale for any other case
        params['transaction_type'] = 'sale'
        logger.debug(f"📋 Added transaction_type: sale (fallback default)")
    
    # ===== BEDS & BATHS =====
    bedrooms = get_filter('bedrooms')
    if bedrooms is not None:
        params['min_bedrooms'] = bedrooms
        params['max_bedrooms'] = bedrooms
    
    # Support for separate min/max
    min_bedrooms = get_filter('min_bedrooms')
    max_bedrooms = get_filter('max_bedrooms')
    if min_bedrooms is not None:
        params['min_bedrooms'] = min_bedrooms
    if max_bedrooms is not None:
        params['max_bedrooms'] = max_bedrooms
    
    # Bedrooms plus (e.g., 2+1)
    bedrooms_plus = get_filter('bedrooms_plus')
    if bedrooms_plus:
        params['bedrooms_plus'] = bedrooms_plus
    
    bathrooms = get_filter('bathrooms')
    if bathrooms is not None:
        params['min_bathrooms'] = bathrooms
    
    # Support for separate min/max
    min_bathrooms = get_filter('min_bathrooms')
    max_bathrooms = get_filter('max_bathrooms')
    if min_bathrooms is not None:
        params['min_bathrooms'] = min_bathrooms
    if max_bathrooms is not None:
        params['max_bathrooms'] = max_bathrooms
    
    # ===== PRICE =====
    price_range = get_filter('price_range')
    if price_range:
        min_price, max_price = price_range
        if min_price is not None:
            params['min_price'] = min_price
        if max_price is not None:
            params['max_price'] = max_price
    
    # ===== SIZE & LOT =====
    sqft_range = get_filter('sqft_range')
    if sqft_range:
        min_sqft, max_sqft = sqft_range
        if min_sqft is not None:
            params['min_sqft'] = min_sqft
        if max_sqft is not None:
            params['max_sqft'] = max_sqft
    
    # Lot size
    lot_size = get_filter('lot_size')
    if lot_size:
        params['lot_size'] = lot_size
    
    # ===== PARKING & GARAGE =====
    parking_spots = get_filter('parking_spots')
    if parking_spots is not None:
        params['parking_spots'] = parking_spots
    
    garage_type = get_filter('garage_type')
    if garage_type:
        params['garage_type'] = garage_type
    
    # ===== CONDO FEATURES =====
    exposure = get_filter('exposure')
    if exposure:
        params['exposure'] = exposure
    
    balcony = get_filter('balcony')
    if balcony is not None:
        params['balcony'] = balcony
    
    locker = get_filter('locker')
    if locker is not None:
        params['locker'] = locker
    
    # ===== AMENITIES =====
    amenities = get_filter('amenities')
    if amenities:
        # Map common amenity names to API format
        amenity_params = _map_amenities_to_repliers(amenities)
        params.update(amenity_params)
    
    # ===== LISTING DATES (CRITICAL FIX) =====
    # Use ONLY minListDate/maxListDate, NOT listedAfter/listedBefore
    # Apply date filters ONLY when user intent includes date keywords
    
    min_date, max_date = parse_date_range(
        user_message,
        getattr(state, 'list_date_from', None),
        getattr(state, 'list_date_to', None)
    )
    
    if min_date:
        params['listed_after'] = min_date
        logger.info(f"📅 Applied minListDate: {min_date}")
    
    if max_date:
        params['listed_before'] = max_date
        logger.info(f"📅 Applied maxListDate: {max_date}")
    
    # ===== MLS & STATUS =====
    mls_number = get_filter('mls_number')
    if mls_number:
        params['mls_number'] = mls_number
    
    # Status - default to active (lowercase required by contract)
    status = get_filter('status')
    if status:
        params['status'] = status
    else:
        params['status'] = 'active'  # Contract requires lowercase or API code 'A'
    
    # ===== YEAR BUILT =====
    year_built_min = get_filter('year_built_min')
    if year_built_min:
        params['year_built_min'] = year_built_min
    year_built_max = get_filter('year_built_max')
    if year_built_max:
        params['year_built_max'] = year_built_max
    
    # ===== MEDIA & EXTRAS =====
    has_images = get_filter('has_images')
    if has_images:
        params['hasImages'] = True
    
    has_virtual_tour = get_filter('has_virtual_tour')
    if has_virtual_tour:
        params['hasVirtualTour'] = True
    
    # ===== PAGINATION =====
    params['page_size'] = limit
    params['page'] = 1
    
    # Log final params
    logger.info(f"✅ Built {len(params)} Repliers API parameters")
    logger.debug(f"Parameters: {params}")
    
    # Convert to snake_case for listings_service compatibility
    params = convert_to_snake_case(params)
    
    # Filter out unsupported parameters (streetName, streetNumber not supported by ListingsService)
    params = filter_supported_params(params)
    
    return params


def filter_supported_params(params: Dict[str, Any]) -> Dict[str, Any]:
    """
    Filter out parameters not supported by ListingsService.
    
    ListingsService.search_listings() does NOT support:
    - community (some APIs use this, but not supported in our wrapper)
    
    Args:
        params: Dictionary of parameters
        
    Returns:
        Dictionary with only supported parameters
    """
    unsupported = ['community']  # street_name and street_number are NOW supported
    
    filtered = {k: v for k, v in params.items() if k not in unsupported}
    
    removed = [k for k in params.keys() if k in unsupported]
    if removed:
        logger.warning(f"⚠️ Removed unsupported ListingsService parameters: {removed}")
    
    return filtered


def convert_to_snake_case(params: Dict[str, Any]) -> Dict[str, Any]:
    """
    Convert camelCase parameter names to snake_case for listings_service.
    
    The Repliers API uses camelCase (propertyType, minPrice, etc.)
    but our ListingsService uses snake_case (property_type, min_price, etc.)
    
    Args:
        params: Dictionary with camelCase keys
        
    Returns:
        Dictionary with snake_case keys
    """
    mapping = {
        # Property basics
        'propertyType': 'property_type',
        'transaction_type': 'transaction_type',
        'ownershipType': 'ownership_type',
        'propertyStyle': 'property_style',
        
        # Beds & Baths
        'minBeds': 'min_bedrooms',
        'maxBeds': 'max_bedrooms',
        'minBaths': 'min_bathrooms',
        'maxBaths': 'max_bathrooms',
        'bedroomsPlus': 'bedrooms_plus',
        
        # Price
        'minPrice': 'min_price',
        'maxPrice': 'max_price',
        
        # Size
        'minSqft': 'min_sqft',
        'maxSqft': 'max_sqft',
        'lotSize': 'lot_size',
        
        # Location
        'postalCode': 'postal_code',
        'streetName': 'street_name',
        'streetNumber': 'street_number',
        
        # Parking & Features
        'parkingSpaces': 'parking_spots',
        'garageType': 'garage_type',
        'hasPool': 'has_pool',
        'hasGarage': 'has_garage',
        
        # Dates
        'minListDate': 'listed_after',
        'maxListDate': 'listed_before',
        'openHouseDate': 'open_house_date',
        
        # MLS & Status
        'mlsNumber': 'mls_number',
        
        # Media
        'hasImages': 'has_images',
        'hasVirtualTour': 'has_virtual_tour',
        
        # Pagination
        'pageSize': 'page_size',
        
        # Year
        'yearBuiltMin': 'year_built_min',
        'yearBuiltMax': 'year_built_max',
    }
    
    converted = {}
    for key, value in params.items():
        # Use mapping if available, otherwise keep original key
        new_key = mapping.get(key, key)
        converted[new_key] = value
    
    return converted


def _map_amenities_to_repliers(amenities: List[str]) -> Dict[str, Any]:
    """
    Map amenity strings to Repliers API parameters.
    
    The ListingsService uses specific boolean flags (has_pool, has_garage)
    and keywords for amenities, not a generic amenities parameter.
    
    Args:
        amenities: List of amenity strings
        
    Returns:
        Dictionary of amenity-related parameters for ListingsService
    """
    params = {}
    amenities_lower = [a.lower() for a in amenities]
    keywords = []
    
    # Pool - use has_pool boolean flag
    if any(word in amenities_lower for word in ['pool', 'swimming pool']):
        params['hasPool'] = True
        keywords.append('pool')
    
    # Gym / Fitness - add to keywords
    if any(word in amenities_lower for word in ['gym', 'fitness', 'exercise room']):
        keywords.append('gym')
    
    # Concierge - add to keywords
    if 'concierge' in amenities_lower:
        keywords.append('concierge')
    
    # Parking/Garage - use has_garage boolean flag
    if any(word in amenities_lower for word in ['parking', 'garage']):
        if 'parkingSpaces' not in params:
            params['hasGarage'] = True
            params['parking_spots'] = 1
    
    # Balcony - add to keywords (no direct API support)
    if 'balcony' in amenities_lower:
        params['balcony'] = 'Yes'
        keywords.append('balcony')
    
    # Locker - add to keywords (no direct API support)
    if 'locker' in amenities_lower or 'storage' in amenities_lower:
        params['locker'] = 'Yes'
        keywords.append('locker')
    
    # Other amenities - add to keywords for text search
    other_amenities = [
        a for a in amenities_lower 
        if a not in ['pool', 'swimming pool', 'gym', 'fitness', 'exercise room', 
                     'concierge', 'parking', 'garage', 'balcony', 'locker', 'storage']
    ]
    keywords.extend(other_amenities)
    
    # Add keywords parameter if we have any
    if keywords:
        params['keywords'] = keywords
    
    return params


# ===========================
# VALIDATION & ERROR HANDLING
# ===========================

def validate_params(params: Dict[str, Any]) -> Tuple[Dict[str, Any], List[str]]:
    """
    Validate parameters before sending to Repliers API.
    
    Args:
        params: Parameter dictionary
        
    Returns:
        Tuple of (validated_params, warnings)
    """
    warnings = []
    validated = params.copy()
    
    # Validate price range
    if 'minPrice' in validated and 'maxPrice' in validated:
        if validated['minPrice'] > validated['maxPrice']:
            warnings.append(
                f"minPrice ({validated['minPrice']}) > maxPrice ({validated['maxPrice']}). "
                f"Swapping values."
            )
            validated['minPrice'], validated['maxPrice'] = \
                validated['maxPrice'], validated['minPrice']
    
    # Validate bedroom range
    if 'minBeds' in validated and 'maxBeds' in validated:
        if validated['minBeds'] > validated['maxBeds']:
            warnings.append(
                f"minBeds ({validated['minBeds']}) > maxBeds ({validated['maxBeds']}). "
                f"Swapping values."
            )
            validated['minBeds'], validated['maxBeds'] = \
                validated['maxBeds'], validated['minBeds']
    
    # Validate date range
    if 'minListDate' in validated and 'maxListDate' in validated:
        try:
            min_date = datetime.fromisoformat(validated['minListDate'])
            max_date = datetime.fromisoformat(validated['maxListDate'])
            if min_date > max_date:
                warnings.append(
                    f"minListDate > maxListDate. Swapping values."
                )
                validated['minListDate'], validated['maxListDate'] = \
                    validated['maxListDate'], validated['minListDate']
        except ValueError:
            warnings.append("Invalid date format. Dates should be YYYY-MM-DD.")
    
    # Warn if no location specified
    if not any(k in validated for k in ['city', 'neighborhood', 'community', 'postalCode']):
        warnings.append(
            "⚠️ No location specified. Results may be too broad. "
            "Consider suggesting popular cities."
        )
    
    # Validate page size
    if validated.get('pageSize', 0) > 100:
        warnings.append(f"pageSize {validated['pageSize']} exceeds recommended limit. Capping at 100.")
        validated['pageSize'] = 100
    
    return validated, warnings


def log_filter_summary(params: Dict[str, Any], result_count: int) -> None:
    """
    Log a summary of applied filters and result count.
    Useful for debugging when unusually large datasets are returned.
    
    Args:
        params: Applied parameters
        result_count: Number of results returned
    """
    filter_summary = []
    
    if 'city' in params:
        filter_summary.append(f"city={params['city']}")
    if 'minPrice' in params or 'maxPrice' in params:
        min_p = params.get('minPrice', '0')
        max_p = params.get('maxPrice', '∞')
        filter_summary.append(f"price=${min_p}-${max_p}")
    if 'minBeds' in params:
        filter_summary.append(f"beds={params['min_bedrooms']}")
    if 'propertyType' in params:
        filter_summary.append(f"type={params['property_type']}")
    if 'transaction_type' in params:
        filter_summary.append(f"transaction={params['transaction_type']}")
    
    summary_str = ", ".join(filter_summary) if filter_summary else "no filters"
    
    if result_count > 500:
        logger.warning(
            f"⚠️ Large dataset returned: {result_count} results with filters: {summary_str}"
        )
    else:
        logger.info(f"📊 Query returned {result_count} results with filters: {summary_str}")


# ===========================
# EXPORT
# ===========================

__all__ = [
    'buildRepliersSearchParams',
    'validate_params',
    'validate_location_hierarchy',
    'parse_date_range',
    'detect_date_intent',
    'log_filter_summary',
    'convert_to_snake_case',
]
