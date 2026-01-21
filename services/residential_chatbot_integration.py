"""
Residential Chatbot Integration
================================
Integration layer between the ResidentialPropertySearchService and the chatbot orchestrator.
This module provides:
- Conversion between ConversationState and ResidentialFilters
- Extended GPT interpreter prompts for all residential filters
- Seamless integration with existing chatbot pipeline

Author: Summitly Team
Date: January 10, 2026
"""

import logging
import re
from typing import Dict, Any, List, Optional, Tuple
from datetime import datetime
from dataclasses import asdict

from services.residential_filter_mapper import (
    ResidentialFilters,
    ResidentialFilterExtractor,
    build_residential_api_params,
    get_filter_extractor,
)
from services.residential_search_service import ResidentialPropertySearchService, get_residential_search_service
from services.conversation_state import ConversationState
from services.location_extractor import LocationState

logger = logging.getLogger(__name__)


# =============================================================================
# EXTENDED GPT INTERPRETER PROMPT WITH ALL RESIDENTIAL FILTERS
# =============================================================================

RESIDENTIAL_FILTERS_EXTENSION = """
EXTENDED RESIDENTIAL PROPERTY FILTERS:
The following additional filters are available for residential property searches:

Property Basics:
- property_class: "residential" (always set for residential properties)
- property_type: condo|house|townhouse|semi-detached|detached|multiplex|duplex|triplex|fourplex|cottage|mobile|modular|farm|land|vacant_land|parking_space
- property_style: bungalow|2-storey|3-storey|split-level|back-split|side-split|multi-level|raised-bungalow|1.5-storey|apartment|loft|stacked|bachelor|studio
- ownership_type: freehold|condo|co-ownership|co-operative|leasehold|timeshare

Building & Structure:
- year_built_min: number (e.g., 1990) - minimum year built
- year_built_max: number (e.g., 2024) - maximum year built
- basement_type: finished|unfinished|partially_finished|none|walkout|apartment|separate_entrance|crawl_space|full|partial
- basement_features: array of strings (finished, walkout, apartment, etc.)
- construction_type: brick|stone|aluminum|vinyl|stucco|wood|concrete|log|icf|steel_frame|etc.
- exterior_finish: brick|stone|aluminum|vinyl|stucco|wood|log|metal|concrete|etc.
- heating_type: forced_air|hot_water|electric|baseboard|radiant|geo_thermal|heat_pump|wood|oil|solar|natural_gas
- cooling_type: central_air|window_ac|none|heat_pump|ductless
- fireplace_type: gas|wood|electric|none (or fireplace: true/false)
- fireplace_count: number

Size & Dimensions:
- min_sqft / max_sqft: square footage range
- lot_size_min / lot_size_max: lot size in square feet or acres
- lot_frontage_min / lot_frontage_max: lot frontage in feet
- lot_depth_min / lot_depth_max: lot depth in feet
- stories_min / stories_max: number of stories

Rooms:
- bedrooms: exact number of bedrooms
- min_bedrooms / max_bedrooms: bedroom range
- bedrooms_plus: e.g., "2+1" (den counted separately)
- bathrooms: exact number of bathrooms
- min_bathrooms / max_bathrooms: bathroom range
- total_rooms_min / total_rooms_max: total room count range
- has_den: true/false
- has_family_room: true/false
- kitchen_count: number of kitchens

Parking & Garage:
- parking_spaces: total parking spaces required
- parking_spaces_min / parking_spaces_max: parking spaces range
- garage_type: attached|detached|built-in|underground|none|carport
- garage_spaces: number of garage spaces
- driveway_type: paved|gravel|concrete|interlocking|none|mutual|circular
- parking_included: true/false (for condos)

Condo-Specific:
- maintenance_fee_min / maintenance_fee_max: monthly maintenance fee range
- condo_exposure: north|south|east|west|north-east|north-west|south-east|south-west
- has_balcony: true/false
- balcony_type: open|enclosed|terrace|juliet|none
- has_locker: true/false
- locker_type: owned|rented|ensuite|none
- condo_amenities: array of strings (pool, gym, concierge, party_room, rooftop, security, sauna, theater, etc.)
- floor_level: number (which floor)
- floor_level_min / floor_level_max: floor level range

Features & Amenities:
- pool: true/false or pool_type: inground|above_ground|indoor|none
- waterfront: true/false
- waterfront_type: lake|river|ocean|canal|pond|creek
- water_source: municipal|well|lake|cistern
- sewer_type: municipal|septic|holding_tank
- utilities: array of strings (gas, hydro, cable, telephone, etc.)
- appliances_included: array of strings (fridge, stove, dishwasher, washer, dryer, etc.)
- has_ac: true/false
- has_fireplace: true/false
- has_hot_tub: true/false
- has_sauna: true/false
- has_elevator: true/false
- accessibility_features: array of strings (wheelchair, elevator, ramps, etc.)

Dates & Status:
- list_date_from / list_date_to: date range for listing date
- sold_date_from / sold_date_to: date range for sold date (for sold listings)
- days_on_market_min / days_on_market_max: DOM range
- status: active|pending|sold (default: active)
- is_new_listing: true/false (listed in last 7 days)

Pricing:
- min_price / max_price: price range
- price_per_sqft_min / price_per_sqft_max: price per square foot range (calculated)
- is_below_market: true/false (flag for potential deals)

Sorting & Pagination:
- sort_by: price|date|bedrooms|sqft|dom|price_change (default: date)
- sort_order: asc|desc (default: desc)
- page: page number (default: 1)
- page_size: results per page (default: 20, max: 100)

Example Natural Language → Filters:
- "3 bed house with finished basement" → bedrooms: 3, property_type: house, basement_type: finished
- "condo with south exposure under 2000/month" → property_type: condo, condo_exposure: south, max_price: 2000, listing_type: rent
- "detached with pool built after 2010" → property_type: detached, pool: true, year_built_min: 2010
- "townhouse with at least 2 parking spots" → property_type: townhouse, parking_spaces_min: 2
- "waterfront property with dock" → waterfront: true
- "bungalow with walkout basement" → property_style: bungalow, basement_type: walkout
- "condo on 20th floor or higher" → property_type: condo, floor_level_min: 20
- "new construction" → year_built_min: {current_year - 2}
- "recently listed" → is_new_listing: true
- "maintenance fee under 500" → maintenance_fee_max: 500
"""


# =============================================================================
# CONVERSATION STATE TO RESIDENTIAL FILTERS CONVERTER
# =============================================================================

class StateToFiltersConverter:
    """
    Converts ConversationState to ResidentialFilters.
    Handles both the existing state fields and extended GPT-extracted filters.
    """
    
    def __init__(self):
        self.extractor = get_filter_extractor()
    
    def convert(
        self,
        state: ConversationState,
        gpt_filters: Optional[Dict[str, Any]] = None,
        user_message: str = ""
    ) -> ResidentialFilters:
        """
        Convert ConversationState to ResidentialFilters.
        
        Args:
            state: The conversation state containing search criteria
            gpt_filters: Optional additional filters extracted by GPT
            user_message: Original user message for NLP extraction
            
        Returns:
            ResidentialFilters instance with all applicable filters
        """
        # Start with empty filters
        filters = ResidentialFilters()
        
        # Set property class to residential
        filters.property_class = "residential"
        
        # ===== LOCATION =====
        if state.location_state:
            loc = state.location_state
            filters.city = loc.city
            filters.neighborhood = loc.neighborhood
            filters.community = loc.community
            filters.postal_code = loc.postalCode
            filters.street_name = loc.streetName
            filters.street_number = loc.streetNumber
            
            # Geo coordinates for radius search
            if hasattr(loc, 'latitude') and loc.latitude:
                filters.latitude = loc.latitude
            if hasattr(loc, 'longitude') and loc.longitude:
                filters.longitude = loc.longitude
            if hasattr(loc, 'radius') and loc.radius:
                filters.radius = loc.radius
        
        # Legacy location fields
        if not filters.city and state.location:
            filters.city = state.location
        if not filters.neighborhood and state.neighborhood:
            filters.neighborhood = state.neighborhood
        if not filters.postal_code and state.postal_code:
            filters.postal_code = state.postal_code
        
        # ===== PROPERTY TYPE =====
        if state.property_type:
            filters.property_type = self._normalize_property_type(state.property_type)
        if state.property_style:
            filters.property_style = state.property_style
        if state.ownership_type:
            filters.ownership_type = state.ownership_type
        
        # ===== ROOMS =====
        if state.bedrooms is not None:
            # Set both min and max to exact bedroom count
            filters.min_bedrooms = state.bedrooms
            filters.max_bedrooms = state.bedrooms
        if state.min_bedrooms is not None:
            filters.min_bedrooms = state.min_bedrooms
        if state.max_bedrooms is not None:
            filters.max_bedrooms = state.max_bedrooms
        if state.bathrooms is not None:
            # Set both min and max to exact bathroom count
            filters.min_bathrooms = state.bathrooms
            filters.max_bathrooms = state.bathrooms
        if state.min_bathrooms is not None:
            filters.min_bathrooms = state.min_bathrooms
        if state.max_bathrooms is not None:
            filters.max_bathrooms = state.max_bathrooms
        
        # ===== PRICE =====
        if state.price_range:
            min_price, max_price = state.price_range
            if min_price:
                filters.min_price = min_price
            if max_price:
                filters.max_price = max_price
        
        # ===== LISTING TYPE =====
        if state.listing_type:
            if state.listing_type.lower() in ['rent', 'rental', 'lease']:
                filters.transaction_type = 'Lease'
            else:
                filters.transaction_type = 'Sale'
        
        # ===== SIZE =====
        if state.sqft_range:
            min_sqft, max_sqft = state.sqft_range
            if min_sqft:
                filters.min_sqft = min_sqft
            if max_sqft:
                filters.max_sqft = max_sqft
        if state.lot_size:
            filters.lot_size_min = state.lot_size
        
        # ===== PARKING =====
        if state.parking_spots is not None:
            filters.min_parking_spaces = state.parking_spots
        if state.garage_type:
            filters.garage_type = state.garage_type
        
        # ===== CONDO FEATURES =====
        if state.exposure:
            filters.exposure = state.exposure
        if state.balcony:
            if state.balcony.lower() in ['yes', 'true']:
                filters.balcony = 'Yes'
            elif state.balcony.lower() not in ['no', 'false']:
                filters.balcony = state.balcony
        if state.locker:
            if state.locker.lower() in ['yes', 'true']:
                filters.locker = 'Yes'
        
        # ===== DATES =====
        if state.list_date_from:
            filters.min_list_date = state.list_date_from
        if state.list_date_to:
            filters.max_list_date = state.list_date_to
        
        # ===== YEAR BUILT =====
        if state.year_built_min:
            filters.min_year_built = state.year_built_min
        if state.year_built_max:
            filters.max_year_built = state.year_built_max
        
        # ===== STATUS =====
        if state.status:
            filters.status = state.status
        
        # ===== AMENITIES =====
        if state.amenities:
            for amenity in state.amenities:
                amenity_lower = amenity.lower()
                if 'pool' in amenity_lower:
                    filters.has_pool = True
                elif 'gym' in amenity_lower or 'fitness' in amenity_lower:
                    if 'gym' not in filters.building_amenities:
                        filters.building_amenities.append('gym')
                elif 'parking' in amenity_lower:
                    if filters.min_parking_spaces is None:
                        filters.min_parking_spaces = 1
                elif 'balcony' in amenity_lower:
                    filters.balcony = 'Yes'
                elif 'garden' in amenity_lower or 'backyard' in amenity_lower:
                    if 'garden' not in filters.building_amenities:
                        filters.building_amenities.append('garden')
                elif 'waterfront' in amenity_lower:
                    filters.waterfront = 'Yes'
                elif 'fireplace' in amenity_lower:
                    filters.has_fireplace = True
                elif 'elevator' in amenity_lower:
                    filters.has_elevator = True
                elif 'concierge' in amenity_lower:
                    if 'concierge' not in filters.building_amenities:
                        filters.building_amenities.append('concierge')
        
        # ===== APPLY GPT EXTRACTED FILTERS =====
        if gpt_filters:
            self._apply_gpt_filters(filters, gpt_filters)
        
        # ===== EXTRACT FROM USER MESSAGE =====
        if user_message:
            self._extract_from_message(filters, user_message)
        
        return filters
    
    def _normalize_property_type(self, property_type: str) -> Optional[str]:
        """
        Normalize property type to API-compatible format.
        
        IMPORTANT: 'Residential' is NOT a valid Repliers API property type!
        When user selects the 'residential' button, we should NOT send propertyType at all.
        The class=residential is what indicates we're searching residential properties.
        
        Returns:
            API-compatible property type string, or None if should not be filtered
        """
        if not property_type:
            return None
            
        property_type_lower = property_type.lower()
        
        # ★★★ CRITICAL FIX ★★★
        # 'residential' is a CLASS, not a propertyType!
        # When user clicks the 'residential' button, don't filter by propertyType
        # This allows ALL residential property types (Detached, Condo, Townhouse, etc.)
        if property_type_lower in ['residential', 'any', 'all']:
            return None  # Don't filter - let all residential property types through
        
        type_mapping = {
            'condo': 'Condo Apartment',
            'apartment': 'Condo Apartment',
            'condominium': 'Condo Apartment',
            'apt': 'Condo Apartment',
            'house': 'Detached',
            'detached': 'Detached',
            'single family': 'Detached',
            'townhouse': 'Townhouse',
            'town': 'Townhouse',
            'row': 'Townhouse',
            'rowhouse': 'Townhouse',
            'semi': 'Semi-Detached',
            'semi-detached': 'Semi-Detached',
            'duplex': 'Duplex',
            'triplex': 'Triplex',
            'multiplex': 'Multiplex',
            'bungalow': 'Detached',  # Style, not type
            'cottage': 'Detached',
        }
        
        # Return mapped value, or None if not a valid specific type
        result = type_mapping.get(property_type_lower)
        if result:
            return result
        
        # If the input is already a valid API type, use it
        valid_api_types = ['Detached', 'Semi-Detached', 'Townhouse', 'Condo Apartment', 
                          'Condo Townhouse', 'Duplex', 'Triplex', 'Multiplex', 'Link',
                          'Vacant Land', 'Farm', 'Mobile/Trailer']
        if property_type in valid_api_types:
            return property_type
            
        # Unknown type - don't filter
        logger.warning(f"⚠️ Unknown property type '{property_type}' - not filtering by propertyType")
        return None
    
    def _apply_gpt_filters(self, filters: ResidentialFilters, gpt_filters: Dict[str, Any]) -> None:
        """Apply GPT-extracted extended filters to ResidentialFilters."""
        # Mapping from GPT filter keys to ResidentialFilters attributes
        direct_mappings = {
            'basement_type': 'basement_type',
            'construction_type': 'construction_type',
            'exterior': 'exterior',
            'heating_type': 'heating_type',
            'cooling_type': 'cooling_type',
            'fireplace_count': 'fireplace_count',
            'min_lot_frontage': 'min_lot_frontage',
            'max_lot_frontage': 'max_lot_frontage',
            'min_lot_depth': 'min_lot_depth',
            'max_lot_depth': 'max_lot_depth',
            'stories': 'stories',
            'garage_type': 'garage_type',
            'garage_spaces': 'garage_spaces',
            'driveway': 'driveway',
            'min_maintenance': 'min_maintenance',
            'max_maintenance': 'max_maintenance',
            'maintenance_fee_max': 'max_maintenance',  # Alias
            'condo_exposure': 'exposure',
            'exposure': 'exposure',
            'balcony': 'balcony',
            'locker': 'locker',
            'floor_level': 'floor_level',
            'floor_level_min': 'floor_level',  # Map to single field
            'sort_by': 'sort_by',
            'year_built_min': 'min_year_built',
            'year_built_max': 'max_year_built',
            'parking_spaces': 'min_parking_spaces',
            'parking_spaces_min': 'min_parking_spaces',
            'parking_spaces_max': 'max_parking_spaces',
        }
        
        # Boolean mappings
        boolean_mappings = {
            'pool': 'has_pool',
            'waterfront': 'waterfront',
            'has_fireplace': 'has_fireplace',
            'fireplace': 'has_fireplace',
            'has_elevator': 'has_elevator',
        }
        
        for gpt_key, filter_attr in direct_mappings.items():
            if gpt_key in gpt_filters and gpt_filters[gpt_key] is not None:
                if hasattr(filters, filter_attr):
                    setattr(filters, filter_attr, gpt_filters[gpt_key])
        
        for gpt_key, filter_attr in boolean_mappings.items():
            if gpt_key in gpt_filters and gpt_filters[gpt_key] is not None:
                value = gpt_filters[gpt_key]
                if hasattr(filters, filter_attr):
                    if isinstance(value, bool):
                        setattr(filters, filter_attr, value)
                    elif isinstance(value, str):
                        setattr(filters, filter_attr, value.lower() in ['true', 'yes', '1'])
        
        # Handle condo_amenities -> building_amenities
        if 'condo_amenities' in gpt_filters and gpt_filters['condo_amenities']:
            amenities = gpt_filters['condo_amenities']
            if isinstance(amenities, list):
                for a in amenities:
                    if a not in filters.building_amenities:
                        filters.building_amenities.append(a)
        
        # Handle is_new_listing -> set min_list_date to 7 days ago
        if gpt_filters.get('is_new_listing'):
            from datetime import datetime, timedelta
            seven_days_ago = (datetime.now() - timedelta(days=7)).strftime('%Y-%m-%d')
            filters.min_list_date = seven_days_ago
    
    def _extract_from_message(self, filters: ResidentialFilters, message: str) -> None:
        """Extract additional filters from user message using NLP."""
        message_lower = message.lower()
        
        # Extract basement type from message
        basement_patterns = [
            (r'finished\s+basement', 'finished'),
            (r'walkout\s+basement', 'walkout'),
            (r'basement\s+apartment', 'apartment'),
            (r'separate\s+entrance.*basement', 'separate_entrance'),
            (r'unfinished\s+basement', 'unfinished'),
        ]
        
        for pattern, basement_type in basement_patterns:
            if re.search(pattern, message_lower):
                filters.basement_type = basement_type
                break
        
        # Extract waterfront type
        waterfront_patterns = [
            (r'lake\s*front|lake\s*view|on\s+the\s+lake', 'lake'),
            (r'river\s*front|river\s*view', 'river'),
            (r'ocean\s*front|ocean\s*view|beach', 'ocean'),
            (r'waterfront|water\s*front', True),
        ]
        
        for pattern, value in waterfront_patterns:
            if re.search(pattern, message_lower):
                if isinstance(value, bool):
                    filters.waterfront = value
                else:
                    filters.waterfront = True
                    filters.waterfront_type = value
                break
        
        # Extract pool type
        pool_patterns = [
            (r'inground\s+pool', 'inground'),
            (r'above\s*ground\s+pool', 'above_ground'),
            (r'indoor\s+pool', 'indoor'),
            (r'\bpool\b', True),
        ]
        
        for pattern, value in pool_patterns:
            if re.search(pattern, message_lower):
                if isinstance(value, bool):
                    filters.has_pool = value
                else:
                    filters.has_pool = True
                    filters.pool = value
                break
        
        # Extract heating type
        heating_patterns = [
            (r'forced\s*air|central\s+heating', 'forced_air'),
            (r'radiant\s+heat|floor\s+heating', 'radiant'),
            (r'geo\s*thermal', 'geo_thermal'),
            (r'heat\s+pump', 'heat_pump'),
        ]
        
        for pattern, heating_type in heating_patterns:
            if re.search(pattern, message_lower):
                filters.heating_type = heating_type
                break
        
        # Extract garage type
        garage_patterns = [
            (r'attached\s+garage', 'attached'),
            (r'detached\s+garage', 'detached'),
            (r'underground\s+(parking|garage)', 'underground'),
            (r'built[\s-]*in\s+garage', 'built-in'),
            (r'carport', 'carport'),
        ]
        
        for pattern, garage_type in garage_patterns:
            if re.search(pattern, message_lower):
                filters.garage_type = garage_type
                break
        
        # Extract new construction
        if re.search(r'new\s+(construction|build|development)', message_lower):
            current_year = datetime.now().year
            filters.min_year_built = current_year - 2
        
        # Extract recently listed
        if re.search(r'recent(ly)?\s+listed|new\s+listing', message_lower):
            from datetime import timedelta
            seven_days_ago = (datetime.now() - timedelta(days=7)).strftime('%Y-%m-%d')
            filters.min_list_date = seven_days_ago


def _filters_to_summary(filters: ResidentialFilters) -> str:
    """Generate a human-readable summary of the filters."""
    parts = []
    
    if filters.city:
        parts.append(f"city={filters.city}")
    if filters.neighborhood:
        parts.append(f"neighborhood={filters.neighborhood}")
    if filters.property_type:
        parts.append(f"type={filters.property_type}")
    if filters.min_bedrooms or filters.max_bedrooms:
        bed_str = f"{filters.min_bedrooms or '?'}-{filters.max_bedrooms or '?'} beds"
        parts.append(bed_str)
    if filters.min_price or filters.max_price:
        price_str = f"${filters.min_price or 0:,}-${filters.max_price or '∞':,}"
        parts.append(price_str)
    if filters.has_pool:
        parts.append("pool")
    if filters.has_fireplace:
        parts.append("fireplace")
    if filters.garage_type:
        parts.append(f"garage={filters.garage_type}")
    if filters.basement_type:
        parts.append(f"basement={filters.basement_type}")
    if filters.waterfront:
        parts.append("waterfront")
    
    return ", ".join(parts) if parts else "no specific filters"


# =============================================================================
# RESIDENTIAL SEARCH INTEGRATION FOR ORCHESTRATOR
# =============================================================================

class ResidentialSearchIntegration:
    """
    Integration class for using ResidentialPropertySearchService in the chatbot orchestrator.
    """
    
    def __init__(self):
        self.search_service = get_residential_search_service()
        self.converter = StateToFiltersConverter()
    
    def search_from_state(
        self,
        state: ConversationState,
        user_message: str = "",
        gpt_filters: Optional[Dict[str, Any]] = None,
        limit: int = 20
    ) -> Dict[str, Any]:
        """
        Execute a residential property search using ConversationState.
        
        Args:
            state: ConversationState with search criteria
            user_message: Original user message
            gpt_filters: Optional GPT-extracted extended filters
            limit: Maximum results to return
            
        Returns:
            Search results with success status, properties, and metadata
        """
        try:
            # Convert state to residential filters
            filters = self.converter.convert(state, gpt_filters, user_message)
            
            # Generate filter summary
            filter_summary = _filters_to_summary(filters)
            
            # Log the conversion
            logger.info(f"🏠 Converted state to residential filters: {filter_summary}")
            
            # Execute search
            results = self.search_service.search(filters=filters, limit=limit)
            
            # Transform results to expected format
            if results['success']:
                return {
                    'success': True,
                    'results': results.get('listings', []),
                    'total': results.get('count', 0),
                    'filters_used': self._filters_to_dict(filters),
                    'query_summary': f"Residential search: {filter_summary}",
                    'query_params': results.get('api_params', {}),
                    'validation_warnings': results.get('warnings', [])
                }
            else:
                return {
                    'success': False,
                    'error': results.get('error', 'Search failed'),
                    'results': [],
                    'total': 0,
                    'filters_used': self._filters_to_dict(filters),
                    'query_summary': f"Residential search failed: {filter_summary}"
                }
                
        except Exception as e:
            logger.error(f"❌ Residential search error: {e}")
            logger.exception("Full error details:")
            return {
                'success': False,
                'error': str(e),
                'results': [],
                'total': 0
            }
    
    def search_natural_language(
        self,
        query: str,
        limit: int = 20
    ) -> Dict[str, Any]:
        """
        Execute a search using natural language query.
        
        Args:
            query: Natural language search query
            limit: Maximum results to return
            
        Returns:
            Search results
        """
        try:
            results = self.search_service.search_with_natural_language(query, limit=limit)
            
            if results['success']:
                return {
                    'success': True,
                    'results': results.get('listings', []),
                    'total': results.get('count', 0),
                    'filters_extracted': results.get('filters_extracted', {}),
                    'query_summary': f"Natural language search: {query}"
                }
            else:
                return {
                    'success': False,
                    'error': results.get('error', 'Search failed'),
                    'results': [],
                    'total': 0
                }
                
        except Exception as e:
            logger.error(f"❌ Natural language search error: {e}")
            return {
                'success': False,
                'error': str(e),
                'results': [],
                'total': 0
            }
    
    def get_listing_details(self, mls_number: str) -> Dict[str, Any]:
        """
        Get details for a specific MLS listing.
        
        Args:
            mls_number: MLS number to look up
            
        Returns:
            Listing details or error
        """
        return self.search_service.get_listing_details(mls_number)
    
    def _filters_to_dict(self, filters: ResidentialFilters) -> Dict[str, Any]:
        """Convert ResidentialFilters to dictionary, excluding None values."""
        result = {}
        for field_name, field_value in asdict(filters).items():
            if field_value is not None:
                result[field_name] = field_value
        return result


# =============================================================================
# CONVENIENCE FUNCTIONS FOR ORCHESTRATOR
# =============================================================================

_residential_integration = None


def get_residential_integration() -> ResidentialSearchIntegration:
    """Get singleton instance of ResidentialSearchIntegration."""
    global _residential_integration
    if _residential_integration is None:
        _residential_integration = ResidentialSearchIntegration()
    return _residential_integration


def search_residential_properties(
    state: ConversationState,
    user_message: str = "",
    gpt_filters: Optional[Dict[str, Any]] = None,
    limit: int = 20
) -> Dict[str, Any]:
    """
    Convenience function for searching residential properties from orchestrator.
    
    Args:
        state: ConversationState with search criteria
        user_message: Original user message
        gpt_filters: Optional GPT-extracted extended filters
        limit: Maximum results
        
    Returns:
        Search results
    """
    integration = get_residential_integration()
    return integration.search_from_state(state, user_message, gpt_filters, limit)


def search_with_natural_language(query: str, limit: int = 20) -> Dict[str, Any]:
    """
    Convenience function for natural language property search.
    
    Args:
        query: Natural language query
        limit: Maximum results
        
    Returns:
        Search results
    """
    integration = get_residential_integration()
    return integration.search_natural_language(query, limit)


def get_extended_gpt_prompt() -> str:
    """
    Get the extended GPT interpreter prompt with all residential filters.
    This should be appended to SYSTEM_PROMPT_INTERPRETER.
    """
    return RESIDENTIAL_FILTERS_EXTENSION
