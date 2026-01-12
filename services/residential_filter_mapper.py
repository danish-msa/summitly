"""
Residential Property Filter Mapper
===================================
Comprehensive filter-mapping layer that converts natural language queries,
user intents, and ConversationState into valid Repliers API search parameters
for RESIDENTIAL property searches.

This module handles ALL MLS residential form filters including:
- Property basics (type, style, ownership, transaction type)
- Location (city, neighborhood, postal code, street address)
- Price ranges (list price, sold price, price per sqft)
- Room counts (bedrooms, bathrooms, total rooms, kitchens)
- Size specifications (sqft, lot size, lot dimensions)
- Parking & garage details
- Building features (year built, basement, construction, HVAC)
- Condo-specific features (fees, exposure, balcony, amenities)
- Property features (pool, waterfront, utilities)
- Financial info (taxes, assessments)
- Date filters (list date, sold date, DOM)
- MLS & agent info
- Rental-specific filters
- Geo/map search (lat/lng, radius, polygon)
- Keywords and text search

Author: Summitly Team
Date: January 10, 2026
"""

import logging
import re
from datetime import datetime
from typing import Dict, Any, Optional, List, Tuple, Union
from datetime import datetime, timedelta
from dataclasses import dataclass, field

logger = logging.getLogger(__name__)


# ============================================================================
# RESIDENTIAL PROPERTY TYPE MAPPINGS
# ============================================================================

RESIDENTIAL_PROPERTY_TYPE_MAPPING = {
    # Common user inputs → API values
    'detached': 'Detached',
    'house': 'Detached',
    'single family': 'Detached',
    'single-family': 'Detached',
    'semi-detached': 'Semi-Detached',
    'semi detached': 'Semi-Detached',
    'semi': 'Semi-Detached',
    'townhouse': 'Townhouse',
    'townhome': 'Townhouse',
    'town house': 'Townhouse',
    'row house': 'Townhouse',
    'freehold townhouse': 'Townhouse',
    'penthouse': 'Condo Apartment',
    'condo': 'Condo Apartment',
    'condo apartment': 'Condo Apartment',
    'apartment': 'Condo Apartment',
    'apt': 'Condo Apartment',
    'condominium': 'Condo Apartment',
    'condo townhouse': 'Condo Townhouse',
    'condo town': 'Condo Townhouse',
    'duplex': 'Duplex',
    'triplex': 'Triplex',
    'fourplex': 'Fourplex',
    'multiplex': 'Multiplex',
    'multi-family': 'Multiplex',
    'link': 'Link',
    'link house': 'Link',
    'vacant land': 'Vacant Land',
    'land': 'Vacant Land',
    'lot': 'Vacant Land',
    'farm': 'Farm',
    'farmhouse': 'Farm',
    'mobile': 'Mobile/Trailer',
    'trailer': 'Mobile/Trailer',
    'mobile home': 'Mobile/Trailer',
    'home': 'Detached',
    'store with apartment': 'Store w/Apt/Office',
    'mixed use': 'Store w/Apt/Office',
}

PROPERTY_STYLE_MAPPING = {
    '2-storey': '2-Storey',
    '2 storey': '2-Storey',
    'two storey': '2-Storey',
    'two-storey': '2-Storey',
    '3-storey': '3-Storey',
    '3 storey': '3-Storey',
    'three storey': '3-Storey',
    'bungalow': 'Bungalow',
    'bungaloft': 'Bungaloft',
    'backsplit': 'Backsplit 4',
    'backsplit 3': 'Backsplit 3',
    'backsplit 4': 'Backsplit 4',
    'backsplit 5': 'Backsplit 5',
    'sidesplit': 'Sidesplit 4',
    'sidesplit 3': 'Sidesplit 3',
    'sidesplit 4': 'Sidesplit 4',
    'sidesplit 5': 'Sidesplit 5',
    '1.5 storey': '1 1/2 Storey',
    '1 1/2 storey': '1 1/2 Storey',
    'one and half': '1 1/2 Storey',
    '2.5 storey': '2 1/2 Storey',
    '2 1/2 storey': '2 1/2 Storey',
    'split level': 'Split Level',
    'raised bungalow': 'Raised Bungalow',
    'loft': 'Loft',
    'stacked townhouse': 'Stacked Townhouse',
    'stacked town': 'Stacked Townhouse',
    'apartment style': 'Apartment',
    'tudor': 'Tudor Style',
    'victorian': 'Victorian',
    'georgian': 'Georgian',
    'contemporary': 'Contemporary',
    'modern': 'Contemporary',
}

OWNERSHIP_TYPE_MAPPING = {
    'freehold': 'Freehold',
    'condo': 'Condominium',
    'condominium': 'Condominium',
    'co-ownership': 'Co-ownership',
    'co-op': 'Co-op',
    'cooperative': 'Co-op',
    'leasehold': 'Leasehold',
}

GARAGE_TYPE_MAPPING = {
    'attached': 'Attached',
    'attached garage': 'Attached',
    'detached': 'Detached',
    'detached garage': 'Detached',
    'built-in': 'Built-In',
    'underground': 'Underground',
    'underground parking': 'Underground',
    'carport': 'Carport',
    'none': 'None',
    'no garage': 'None',
}

BASEMENT_TYPE_MAPPING = {
    'full': 'Full',
    'full basement': 'Full',
    'partial': 'Partial',
    'finished': 'Finished',
    'finished basement': 'Finished',
    'unfinished': 'Unfinished',
    'walk-out': 'Walk-Out',
    'walkout': 'Walk-Out',
    'walk out': 'Walk-Out',
    'apartment': 'Apartment',
    'basement apartment': 'Apartment',
    'none': 'None',
    'no basement': 'None',
}

EXPOSURE_MAPPING = {
    'north': 'N',
    'n': 'N',
    'south': 'S',
    's': 'S',
    'east': 'E',
    'e': 'E',
    'west': 'W',
    'w': 'W',
    'northeast': 'NE',
    'ne': 'NE',
    'northwest': 'NW',
    'nw': 'NW',
    'southeast': 'SE',
    'se': 'SE',
    'southwest': 'SW',
    'sw': 'SW',
}

POOL_TYPE_MAPPING = {
    'indoor': 'Indoor',
    'indoor pool': 'Indoor',
    'inground': 'Inground',
    'in-ground': 'Inground',
    'in ground': 'Inground',
    'above ground': 'Above Ground',
    'aboveground': 'Above Ground',
    'none': 'None',
    'no pool': 'None',
}


# ============================================================================
# RESIDENTIAL FILTERS DATA CLASS
# ============================================================================

@dataclass
class ResidentialFilters:
    """
    Complete residential property search filters based on MLS form.
    All filters that can be applied to a residential property search.
    """
    
    # === PROPERTY BASICS ===
    property_class: Optional[str] = "residential"  # residential, condo
    property_type: Optional[str] = None  # Detached, Condo Apartment, etc.
    property_style: Optional[str] = None  # 2-Storey, Bungalow, etc.
    ownership_type: Optional[str] = None  # Freehold, Condominium, etc.
    transaction_type: Optional[str] = None  # Sale, Lease
    status: Optional[str] = "A"  # A (Active), S (Sold), L (Leased)
    
    # === LOCATION ===
    city: Optional[str] = None
    community: Optional[str] = None
    neighborhood: Optional[str] = None
    postal_code: Optional[str] = None
    street_name: Optional[str] = None
    street_number: Optional[str] = None
    unit_number: Optional[str] = None
    area_code: Optional[str] = None
    district: Optional[str] = None
    
    # === PRICE ===
    min_price: Optional[float] = None
    max_price: Optional[float] = None
    min_sold_price: Optional[float] = None
    max_sold_price: Optional[float] = None
    
    # === ROOMS ===
    min_bedrooms: Optional[int] = None
    max_bedrooms: Optional[int] = None
    bedrooms_plus: Optional[int] = None  # Den/office
    min_bathrooms: Optional[float] = None
    max_bathrooms: Optional[float] = None
    min_rooms: Optional[int] = None
    max_rooms: Optional[int] = None
    kitchens: Optional[int] = None
    
    # === SIZE ===
    min_sqft: Optional[int] = None
    max_sqft: Optional[int] = None
    min_lot_size: Optional[int] = None
    max_lot_size: Optional[int] = None
    min_lot_depth: Optional[float] = None
    max_lot_depth: Optional[float] = None
    min_lot_frontage: Optional[float] = None
    max_lot_frontage: Optional[float] = None
    
    # === PARKING ===
    min_parking_spaces: Optional[int] = None
    max_parking_spaces: Optional[int] = None
    garage_spaces: Optional[int] = None
    garage_type: Optional[str] = None
    parking_type: Optional[str] = None
    driveway: Optional[str] = None
    
    # === BUILDING ===
    min_year_built: Optional[int] = None
    max_year_built: Optional[int] = None
    stories: Optional[int] = None
    basement_type: Optional[str] = None
    exterior: Optional[str] = None
    construction_type: Optional[str] = None
    heating_type: Optional[str] = None
    cooling_type: Optional[str] = None
    has_fireplace: Optional[bool] = None
    fireplace_count: Optional[int] = None
    
    # === CONDO SPECIFIC ===
    min_maintenance: Optional[float] = None
    max_maintenance: Optional[float] = None
    exposure: Optional[str] = None
    balcony: Optional[str] = None
    locker: Optional[str] = None
    floor_level: Optional[int] = None
    building_amenities: List[str] = field(default_factory=list)
    pets_allowed: Optional[str] = None
    
    # === FEATURES ===
    pool: Optional[str] = None
    has_pool: Optional[bool] = None
    waterfront: Optional[str] = None
    has_elevator: Optional[bool] = None
    central_vac: Optional[bool] = None
    
    # === FINANCIALS ===
    min_taxes: Optional[float] = None
    max_taxes: Optional[float] = None
    
    # === DATES ===
    min_list_date: Optional[str] = None  # YYYY-MM-DD
    max_list_date: Optional[str] = None
    min_sold_date: Optional[str] = None
    max_sold_date: Optional[str] = None
    min_dom: Optional[int] = None  # Days on market
    max_dom: Optional[int] = None
    
    # === MLS ===
    mls_number: Optional[str] = None
    board: Optional[str] = None
    has_virtual_tour: Optional[bool] = None
    has_images: Optional[bool] = None
    
    # === RENTAL ===
    lease_term: Optional[str] = None
    utilities_included: List[str] = field(default_factory=list)
    furnished: Optional[bool] = None
    available_date: Optional[str] = None
    
    # === GEO ===
    latitude: Optional[float] = None
    longitude: Optional[float] = None
    radius_km: Optional[float] = None
    
    # === KEYWORDS ===
    keywords: List[str] = field(default_factory=list)
    exclude_keywords: List[str] = field(default_factory=list)
    
    # === PAGINATION ===
    page: int = 1
    page_size: int = 25
    sort_by: Optional[str] = None


# ============================================================================
# FILTER EXTRACTION FROM NATURAL LANGUAGE
# ============================================================================

class ResidentialFilterExtractor:
    """
    Extract residential property filters from natural language queries.
    """
    
    def __init__(self):
        self.price_patterns = [
            # "$500k to $800k", "$500,000 - $800,000"
            r'\$?\s*([\d,]+)\s*[kK]?\s*(?:to|-|–)\s*\$?\s*([\d,]+)\s*[kK]?',
            # "under $500k", "below $500,000"
            r'(?:under|below|less than|max|maximum|up to)\s*\$?\s*([\d,]+)\s*[kK]?',
            # "over $500k", "above $500,000", "minimum $500k"
            r'(?:over|above|more than|min|minimum|at least|starting)\s*\$?\s*([\d,]+)\s*[kK]?',
            # "$500k" standalone
            r'\$\s*([\d,]+)\s*[kK]?(?!\s*(?:to|-|–))',
        ]
        
        self.bedroom_patterns = [
            # "3 bedroom", "3 bed", "3 br", "3-bed"
            r'(\d+)\s*[-]?\s*(?:bed(?:room)?s?|br|bdr)',
            # "3+ bedrooms"
            r'(\d+)\+\s*(?:bed(?:room)?s?|br)',
        ]
        
        self.bathroom_patterns = [
            # "2 bathroom", "2 bath", "2.5 bath"
            r'(\d+(?:\.\d+)?)\s*[-]?\s*(?:bath(?:room)?s?|ba)',
        ]
        
        self.sqft_patterns = [
            # "1500 sqft", "1500 sq ft", "1,500 square feet"
            r'(\d+[,]?\d*)\s*(?:sq\.?\s*ft\.?|square\s*feet|sqft)',
            # "1500-2000 sqft"
            r'(\d+[,]?\d*)\s*[-–to]\s*(\d+[,]?\d*)\s*(?:sq\.?\s*ft\.?|sqft)',
        ]
        
        self.year_patterns = [
            # "built after 2010", "newer than 2015"
            r'(?:built|constructed)\s*(?:after|since|from)\s*(\d{4})',
            # "built before 2000"
            r'(?:built|constructed)\s*(?:before|prior to)\s*(\d{4})',
        ]
    
    def extract_price_range(self, text: str) -> Tuple[Optional[float], Optional[float]]:
        """Extract price range from text."""
        text = text.lower()
        min_price = None
        max_price = None
        
        # Helper to parse a price value with its suffix
        def parse_price_value(val_str: str, suffix_context: str) -> float:
            val = float(val_str.replace(',', ''))
            suffix_context = suffix_context.lower()
            
            # Check for million suffix
            if 'million' in suffix_context or suffix_context.strip().endswith('m'):
                return val * 1000000
            # Check for k suffix
            elif 'k' in suffix_context or 'thousand' in suffix_context:
                return val * 1000
            # If small number without suffix, likely in millions or thousands
            elif val < 100:
                # Assume millions for values like "1.5", "2"
                if '.' in val_str or val <= 10:
                    return val * 1000000
            return val
        
        # Check for mixed pattern: "between 700k and 1 million", "700k to 2 million"
        mixed_between_match = re.search(
            r'between\s*\$?\s*([\d,.]+)\s*([kKm]?)\s*(?:and|&|to|-)\s*\$?\s*([\d,.]+)\s*(million|mil|[kKm])\b',
            text
        )
        if mixed_between_match:
            val1 = float(mixed_between_match.group(1).replace(',', ''))
            suffix1 = mixed_between_match.group(2) or ''
            val2 = float(mixed_between_match.group(3).replace(',', ''))
            suffix2 = mixed_between_match.group(4)
            
            # Parse first value
            if suffix1.lower() == 'k':
                min_val = val1 * 1000
            elif suffix1.lower() == 'm' or 'million' in suffix1.lower():
                min_val = val1 * 1000000
            else:
                # No suffix on first value - assume k if less than 10000
                min_val = val1 * 1000 if val1 < 10000 else val1
            
            # Parse second value
            if 'million' in suffix2.lower() or suffix2.lower() == 'm':
                max_val = val2 * 1000000
            elif suffix2.lower() == 'k':
                max_val = val2 * 1000
            else:
                max_val = val2
            
            return min_val, max_val
        
        # Check for "between X million and Y million" pattern (both in millions)
        million_between_match = re.search(
            r'between\s*\$?\s*([\d,.]+)\s*(?:million|mil)\s*(?:and|&)\s*\$?\s*([\d,.]+)\s*(?:million|mil)',
            text
        )
        if million_between_match:
            min_val = float(million_between_match.group(1).replace(',', '')) * 1000000
            max_val = float(million_between_match.group(2).replace(',', '')) * 1000000
            return min_val, max_val
        
        # Check for million patterns: "over 2 million", "under 2.5 million"
        million_max_match = re.search(
            r'(?:under|below|less than|max|maximum|up to|budget)\s*(?:of\s*)?\$?\s*([\d,.]+)\s*(?:million|mil|m\b)',
            text
        )
        if million_max_match:
            val = float(million_max_match.group(1).replace(',', ''))
            return None, val * 1000000
        
        million_min_match = re.search(
            r'(?:over|above|more than|min|minimum|at least|starting)\s*(?:at\s*)?\$?\s*([\d,.]+)\s*(?:million|mil|m\b)',
            text
        )
        if million_min_match:
            val = float(million_min_match.group(1).replace(',', ''))
            return val * 1000000, None
        
        # Check for "between X and Y" pattern with k suffix
        between_match = re.search(
            r'between\s*\$?\s*([\d,]+)\s*[kK]\s*(?:and|&)\s*\$?\s*([\d,]+)\s*[kK]',
            text
        )
        if between_match:
            min_val = float(between_match.group(1).replace(',', '')) * 1000
            max_val = float(between_match.group(2).replace(',', '')) * 1000
            return min_val, max_val
        
        # Check for range pattern: "$500k to $800k", "$500,000 - $800,000"
        range_match = re.search(
            r'\$?\s*([\d,]+)\s*([kK])?\s*(?:to|-|–)\s*\$?\s*([\d,]+)\s*([kK])?',
            text
        )
        if range_match:
            val1 = float(range_match.group(1).replace(',', ''))
            suffix1 = range_match.group(2) or ''
            val2 = float(range_match.group(3).replace(',', ''))
            suffix2 = range_match.group(4) or ''
            
            min_val = val1 * 1000 if suffix1.lower() == 'k' else val1
            max_val = val2 * 1000 if suffix2.lower() == 'k' else val2
            return min_val, max_val
        
        # Check for max price
        max_match = re.search(
            r'(?:under|below|less than|max|maximum|up to|budget)\s*(?:of\s*)?\$?\s*([\d,]+)\s*([kK])?',
            text
        )
        if max_match:
            val = float(max_match.group(1).replace(',', ''))
            suffix = max_match.group(2) or ''
            max_price = val * 1000 if suffix.lower() == 'k' else val
        
        # Check for min price
        min_match = re.search(
            r'(?:over|above|more than|min|minimum|at least|starting)\s*(?:at\s*)?\$?\s*([\d,]+)\s*([kK])?',
            text
        )
        if min_match:
            val = float(min_match.group(1).replace(',', ''))
            suffix = min_match.group(2) or ''
            min_price = val * 1000 if suffix.lower() == 'k' else val
        
        return min_price, max_price
    
    def extract_bedrooms(self, text: str) -> Tuple[Optional[int], Optional[int]]:
        """Extract bedroom count from text."""
        text = text.lower()
        
        # Range pattern: "2-3 bedrooms"
        range_match = re.search(r'(\d+)\s*[-–to]\s*(\d+)\s*(?:bed(?:room)?s?|br)', text)
        if range_match:
            return int(range_match.group(1)), int(range_match.group(2))
        
        # Plus pattern: "3+ bedrooms"
        plus_match = re.search(r'(\d+)\+\s*(?:bed(?:room)?s?|br)', text)
        if plus_match:
            return int(plus_match.group(1)), None
        
        # Exact pattern: "3 bedrooms"
        exact_match = re.search(r'(\d+)\s*[-]?\s*(?:bed(?:room)?s?|br|bdr)', text)
        if exact_match:
            beds = int(exact_match.group(1))
            return beds, beds
        
        return None, None
    
    def extract_bathrooms(self, text: str) -> Tuple[Optional[float], Optional[float]]:
        """Extract bathroom count from text."""
        text = text.lower()
        
        match = re.search(r'(\d+(?:\.\d+)?)\s*[-]?\s*(?:bath(?:room)?s?|ba)', text)
        if match:
            baths = float(match.group(1))
            return baths, None
        
        return None, None
    
    def extract_property_type(self, text: str) -> Optional[str]:
        """Extract property type from text."""
        text = text.lower()
        
        # Sort keys by length (longest first) to prioritize more specific matches
        # This ensures "townhouse" matches before "house"
        sorted_keys = sorted(RESIDENTIAL_PROPERTY_TYPE_MAPPING.keys(), key=len, reverse=True)
        
        for key in sorted_keys:
            if key in text:
                return RESIDENTIAL_PROPERTY_TYPE_MAPPING[key]
        
        return None
    
    def extract_property_style(self, text: str) -> Optional[str]:
        """Extract property style from text."""
        text = text.lower()
        
        # Sort keys by length (longest first) to prioritize more specific matches
        sorted_keys = sorted(PROPERTY_STYLE_MAPPING.keys(), key=len, reverse=True)
        
        for key in sorted_keys:
            if key in text:
                return PROPERTY_STYLE_MAPPING[key]
        
        return None
    
    def extract_transaction_type(self, text: str) -> Optional[str]:
        """Extract transaction type (sale/rent) from text."""
        text = text.lower()
        
        rent_keywords = ['rent', 'rental', 'lease', 'leasing', 'for rent', 'to rent']
        sale_keywords = ['buy', 'purchase', 'for sale', 'to buy', 'buying']
        
        for keyword in rent_keywords:
            if keyword in text:
                return 'Lease'
        
        for keyword in sale_keywords:
            if keyword in text:
                return 'Sale'
        
        return None
    
    def extract_amenities(self, text: str) -> List[str]:
        """Extract amenities from text."""
        text = text.lower()
        amenities = []
        
        amenity_keywords = {
            'pool': ['pool', 'swimming pool'],
            'gym': ['gym', 'fitness', 'exercise room', 'workout'],
            'concierge': ['concierge', '24/7 concierge'],
            'security': ['security', 'security guard', '24 hour security'],
            'parking': ['parking', 'underground parking'],
            'balcony': ['balcony', 'terrace'],
            'rooftop': ['rooftop', 'roof deck', 'rooftop deck'],
            'bbq': ['bbq', 'barbecue'],
            'party room': ['party room', 'entertainment room'],
            'tennis': ['tennis', 'tennis court'],
            'sauna': ['sauna'],
            'hot tub': ['hot tub', 'jacuzzi'],
            'pet friendly': ['pet friendly', 'pets allowed', 'dog friendly'],
            'bike storage': ['bike storage', 'bicycle storage'],
        }
        
        for amenity, keywords in amenity_keywords.items():
            for keyword in keywords:
                if keyword in text:
                    amenities.append(amenity)
                    break
        
        return amenities
    
    def extract_basement_type(self, text: str) -> Optional[str]:
        """Extract basement type from text."""
        text_lower = text.lower()
        
        # Sort by length to prioritize more specific matches
        sorted_keys = sorted(BASEMENT_TYPE_MAPPING.keys(), key=len, reverse=True)
        
        for key in sorted_keys:
            if key in text_lower:
                return BASEMENT_TYPE_MAPPING[key]
        
        return None
    
    def extract_waterfront(self, text: str) -> bool:
        """Extract waterfront preference from text."""
        text_lower = text.lower()
        waterfront_keywords = ['waterfront', 'lakefront', 'lake view', 'water view', 'oceanfront', 'beachfront', 'on the water', 'waterside']
        return any(keyword in text_lower for keyword in waterfront_keywords)
    
    def extract_balcony(self, text: str) -> bool:
        """Extract balcony preference from text."""
        text_lower = text.lower()
        balcony_keywords = ['balcony', 'terrace', 'patio', 'outdoor space', 'deck']
        return any(keyword in text_lower for keyword in balcony_keywords)
    
    def extract_locker(self, text: str) -> bool:
        """Extract locker preference from text."""
        text_lower = text.lower()
        locker_keywords = ['locker', 'storage locker', 'storage unit']
        return any(keyword in text_lower for keyword in locker_keywords)
    
    def extract_parking(self, text: str) -> Optional[int]:
        """Extract parking requirement from text."""
        text_lower = text.lower()
        
        # Check for specific number of parking spaces
        match = re.search(r'(\d+)\s*(?:car\s+)?(?:garage|parking|spot|stall)', text_lower)
        if match:
            return int(match.group(1))
        
        # Check for general parking mention
        if 'parking' in text_lower or 'garage' in text_lower:
            return 1  # At least 1 parking space
        
        return None
    
    def extract_garage_type(self, text: str) -> Optional[str]:
        """Extract garage type from text."""
        text_lower = text.lower()
        
        if 'attached garage' in text_lower:
            return 'Attached'
        elif 'detached garage' in text_lower:
            return 'Detached'
        elif 'built-in garage' in text_lower or 'built in garage' in text_lower:
            return 'Built-In'
        elif 'underground garage' in text_lower or 'underground parking' in text_lower:
            return 'Underground'
        
        return None
    
    def extract_floor_level(self, text: str) -> Optional[int]:
        """Extract floor level preference from text."""
        text_lower = text.lower()
        
        # "on 20th floor", "floor 20", "20th floor or higher"
        match = re.search(r'(?:on\s+)?(\d+)(?:st|nd|rd|th)?\s*floor', text_lower)
        if match:
            return int(match.group(1))
        
        # "high floor", "penthouse"
        if 'penthouse' in text_lower:
            return 30  # Assume high floor for penthouse
        if 'high floor' in text_lower:
            return 15  # Assume at least 15th floor
        
        return None
    
    def extract_exposure(self, text: str) -> Optional[str]:
        """Extract exposure/facing direction from text."""
        text_lower = text.lower()
        
        # Check for exposure mentions
        for key, value in EXPOSURE_MAPPING.items():
            if f'{key} exposure' in text_lower or f'{key} facing' in text_lower or f'faces {key}' in text_lower:
                return value
        
        return None
    
    def extract_maintenance_fee(self, text: str) -> Optional[float]:
        """Extract maximum maintenance fee from text."""
        text_lower = text.lower()
        
        # "maintenance under $500", "maintenance fee under 500"
        match = re.search(r'maintenance(?:\s+fee)?\s+(?:under|below|less than|max)\s*\$?\s*(\d+)', text_lower)
        if match:
            return float(match.group(1))
        
        return None
    
    def extract_sqft(self, text: str) -> Tuple[Optional[int], Optional[int]]:
        """Extract square footage range from text."""
        text_lower = text.lower()
        
        # Range pattern: "1000-1500 sqft"
        range_match = re.search(r'(\d+[,]?\d*)\s*[-–to]\s*(\d+[,]?\d*)\s*(?:sq\.?\s*ft\.?|square\s*feet|sqft)', text_lower)
        if range_match:
            min_sqft = int(range_match.group(1).replace(',', ''))
            max_sqft = int(range_match.group(2).replace(',', ''))
            return min_sqft, max_sqft
        
        # "at least 1000 sqft", "over 1500 sqft"
        min_match = re.search(r'(?:at least|over|above|minimum|min)\s*(\d+[,]?\d*)\s*(?:sq\.?\s*ft\.?|square\s*feet|sqft)', text_lower)
        if min_match:
            return int(min_match.group(1).replace(',', '')), None
        
        # "under 1000 sqft", "max 1500 sqft"
        max_match = re.search(r'(?:under|below|max|maximum)\s*(\d+[,]?\d*)\s*(?:sq\.?\s*ft\.?|square\s*feet|sqft)', text_lower)
        if max_match:
            return None, int(max_match.group(1).replace(',', ''))
        
        return None, None
    
    def extract_year_built(self, text: str) -> Optional[int]:
        """Extract year built filter from text."""
        text_lower = text.lower()
        
        # "built after 2015", "constructed after 2010"
        after_match = re.search(r'(?:built|constructed)\s+(?:after|since|from)\s+(\d{4})', text_lower)
        if after_match:
            return int(after_match.group(1))
        
        # "new construction", "newly built"
        if 'new construction' in text_lower or 'newly built' in text_lower:
            return datetime.now().year - 3  # Properties from last 3 years
        
        return None
    
    def extract_neighborhood(self, text: str) -> Optional[str]:
        """Extract neighborhood from text."""
        text_lower = text.lower()
        
        # Common GTA neighborhoods
        neighborhoods = [
            # Toronto neighborhoods
            'yorkville', 'king west', 'liberty village', 'queen west', 
            'distillery district', 'st. lawrence market', 'the annex', 'annex',
            'rosedale', 'forest hill', 'cabbagetown', 'leslieville',
            'danforth', 'beaches', 'beach', 'parkdale', 'junction',
            'high park', 'etobicoke', 'north york', 'scarborough',
            'don mills', 'bayview', 'lawrence park', 'leaside',
            'mimico', 'long branch', 'new toronto', 'humber bay',
            'midtown', 'downtown', 'entertainment district', 'harbourfront',
            'cityplace', 'fort york', 'southcore', 'ice condos',
            'bloor-yorkville', 'yonge-eglinton', 'yonge corridor',
            # Mississauga neighborhoods
            'port credit', 'streetsville', 'erin mills', 'meadowvale',
            'square one', 'city centre', 'lorne park', 'clarkson',
            # Oakville neighborhoods
            'bronte', 'old oakville', 'glen abbey',
            # Vaughan neighborhoods
            'woodbridge', 'kleinburg', 'maple', 'concord',
            # Other GTA
            'unionville', 'thornhill', 'richmond hill', 'aurora',
        ]
        
        # Sort by length to prioritize longer matches
        neighborhoods_sorted = sorted(neighborhoods, key=len, reverse=True)
        
        for neighborhood in neighborhoods_sorted:
            if neighborhood in text_lower:
                # Title case the neighborhood name
                return neighborhood.title()
        
        return None
    
    def extract_location_keywords(self, text: str) -> Dict[str, Optional[str]]:
        """Extract location-related keywords from text."""
        # This is a basic implementation - the actual location extraction
        # is handled by location_extractor service
        location = {}
        
        # Common cities
        cities = [
            'toronto', 'mississauga', 'brampton', 'vaughan', 'markham',
            'richmond hill', 'oakville', 'burlington', 'hamilton',
            'ajax', 'whitby', 'oshawa', 'pickering', 'newmarket',
            'aurora', 'king city', 'caledon', 'milton', 'halton hills',
            'vancouver', 'calgary', 'edmonton', 'ottawa', 'montreal'
        ]
        
        text_lower = text.lower()
        for city in cities:
            if city in text_lower:
                location['city'] = city.title()
                break
        
        # Postal code pattern
        postal_match = re.search(r'\b([A-Za-z]\d[A-Za-z])\s*(\d[A-Za-z]\d)?\b', text)
        if postal_match:
            postal = postal_match.group(1).upper()
            if postal_match.group(2):
                postal += ' ' + postal_match.group(2).upper()
            location['postal_code'] = postal
        
        return location
    
    def extract_all(self, text: str) -> ResidentialFilters:
        """Extract all filters from natural language text."""
        filters = ResidentialFilters()
        
        # Price
        min_price, max_price = self.extract_price_range(text)
        filters.min_price = min_price
        filters.max_price = max_price
        
        # Bedrooms
        min_beds, max_beds = self.extract_bedrooms(text)
        filters.min_bedrooms = min_beds
        filters.max_bedrooms = max_beds
        
        # Bathrooms
        min_baths, max_baths = self.extract_bathrooms(text)
        filters.min_bathrooms = min_baths
        filters.max_bathrooms = max_baths
        
        # Property type
        filters.property_type = self.extract_property_type(text)
        
        # Property style
        filters.property_style = self.extract_property_style(text)
        
        # Transaction type
        filters.transaction_type = self.extract_transaction_type(text)
        
        # Amenities
        amenities = self.extract_amenities(text)
        if amenities:
            filters.building_amenities = amenities
            if 'pool' in amenities:
                filters.has_pool = True
        
        # Basement type
        filters.basement_type = self.extract_basement_type(text)
        
        # Waterfront
        if self.extract_waterfront(text):
            filters.waterfront = True
        
        # Balcony
        if self.extract_balcony(text):
            filters.balcony = True
        
        # Locker
        if self.extract_locker(text):
            filters.locker = True
        
        # Parking
        parking = self.extract_parking(text)
        if parking:
            filters.min_parking_spaces = parking
        
        # Garage type
        filters.garage_type = self.extract_garage_type(text)
        
        # Floor level
        floor_level = self.extract_floor_level(text)
        if floor_level:
            filters.floor_level = floor_level
        
        # Exposure
        filters.exposure = self.extract_exposure(text)
        
        # Maintenance fee
        maintenance = self.extract_maintenance_fee(text)
        if maintenance:
            filters.max_maintenance = maintenance
        
        # Square footage
        min_sqft, max_sqft = self.extract_sqft(text)
        filters.min_sqft = min_sqft
        filters.max_sqft = max_sqft
        
        # Year built
        year_built = self.extract_year_built(text)
        if year_built:
            filters.min_year_built = year_built
        
        # Location
        location = self.extract_location_keywords(text)
        filters.city = location.get('city')
        filters.postal_code = location.get('postal_code')
        
        # Neighborhood
        filters.neighborhood = self.extract_neighborhood(text)
        
        return filters


# ============================================================================
# CONVERT FILTERS TO REPLIERS API PARAMETERS
# ============================================================================

def build_residential_api_params(
    filters: ResidentialFilters,
    remove_empty: bool = True
) -> Dict[str, Any]:
    """
    Convert ResidentialFilters to Repliers API parameters.
    
    Args:
        filters: ResidentialFilters object with search criteria
        remove_empty: If True, remove None/empty values from params
        
    Returns:
        Dictionary of Repliers API parameters (camelCase)
    """
    params = {}
    
    # === PROPERTY BASICS ===
    if filters.property_class:
        params['class'] = filters.property_class
    if filters.property_type:
        params['propertyType'] = filters.property_type
    if filters.property_style:
        params['style'] = filters.property_style
    if filters.ownership_type:
        params['ownershipType'] = filters.ownership_type
    if filters.transaction_type:
        params['type'] = filters.transaction_type
    if filters.status:
        params['status'] = filters.status
    
    # === LOCATION ===
    if filters.city:
        params['city'] = filters.city
    if filters.community:
        params['community'] = filters.community
    if filters.neighborhood:
        params['neighborhood'] = filters.neighborhood
    if filters.postal_code:
        params['postalCode'] = filters.postal_code
    if filters.street_name:
        params['streetName'] = filters.street_name
    if filters.street_number:
        params['streetNumber'] = filters.street_number
    if filters.unit_number:
        params['unitNumber'] = filters.unit_number
    if filters.area_code:
        params['areaCode'] = filters.area_code
    if filters.district:
        params['district'] = filters.district
    
    # === PRICE ===
    if filters.min_price is not None:
        params['minPrice'] = int(filters.min_price)
    if filters.max_price is not None:
        params['maxPrice'] = int(filters.max_price)
    if filters.min_sold_price is not None:
        params['minSoldPrice'] = int(filters.min_sold_price)
    if filters.max_sold_price is not None:
        params['maxSoldPrice'] = int(filters.max_sold_price)
    
    # === ROOMS ===
    if filters.min_bedrooms is not None:
        params['minBedrooms'] = filters.min_bedrooms
    if filters.max_bedrooms is not None:
        params['maxBedrooms'] = filters.max_bedrooms
    if filters.bedrooms_plus is not None:
        params['bedroomsPlus'] = filters.bedrooms_plus
    if filters.min_bathrooms is not None:
        params['minBathrooms'] = filters.min_bathrooms
    if filters.max_bathrooms is not None:
        params['maxBathrooms'] = filters.max_bathrooms
    if filters.min_rooms is not None:
        params['minRooms'] = filters.min_rooms
    if filters.max_rooms is not None:
        params['maxRooms'] = filters.max_rooms
    if filters.kitchens is not None:
        params['kitchens'] = filters.kitchens
    
    # === SIZE ===
    if filters.min_sqft is not None:
        params['minSqft'] = filters.min_sqft
    if filters.max_sqft is not None:
        params['maxSqft'] = filters.max_sqft
    if filters.min_lot_size is not None:
        params['minLotSize'] = filters.min_lot_size
    if filters.max_lot_size is not None:
        params['maxLotSize'] = filters.max_lot_size
    if filters.min_lot_depth is not None:
        params['minLotDepth'] = filters.min_lot_depth
    if filters.max_lot_depth is not None:
        params['maxLotDepth'] = filters.max_lot_depth
    if filters.min_lot_frontage is not None:
        params['minLotFrontage'] = filters.min_lot_frontage
    if filters.max_lot_frontage is not None:
        params['maxLotFrontage'] = filters.max_lot_frontage
    
    # === PARKING ===
    if filters.min_parking_spaces is not None:
        params['minParkingSpaces'] = filters.min_parking_spaces
    if filters.max_parking_spaces is not None:
        params['maxParkingSpaces'] = filters.max_parking_spaces
    if filters.garage_spaces is not None:
        params['garageSpaces'] = filters.garage_spaces
    if filters.garage_type:
        params['garageType'] = filters.garage_type
    if filters.parking_type:
        params['parkingType'] = filters.parking_type
    if filters.driveway:
        params['driveway'] = filters.driveway
    
    # === BUILDING ===
    if filters.min_year_built is not None:
        params['minYearBuilt'] = filters.min_year_built
    if filters.max_year_built is not None:
        params['maxYearBuilt'] = filters.max_year_built
    if filters.stories is not None:
        params['stories'] = filters.stories
    if filters.basement_type:
        params['basementType'] = filters.basement_type
    if filters.exterior:
        params['exterior'] = filters.exterior
    if filters.construction_type:
        params['constructionType'] = filters.construction_type
    if filters.heating_type:
        params['heatingType'] = filters.heating_type
    if filters.cooling_type:
        params['coolingType'] = filters.cooling_type
    if filters.has_fireplace is not None:
        params['hasFireplace'] = filters.has_fireplace
    if filters.fireplace_count is not None:
        params['fireplaceCount'] = filters.fireplace_count
    
    # === CONDO SPECIFIC ===
    if filters.min_maintenance is not None:
        params['minMaintenance'] = filters.min_maintenance
    if filters.max_maintenance is not None:
        params['maxMaintenance'] = filters.max_maintenance
    if filters.exposure:
        params['exposure'] = EXPOSURE_MAPPING.get(filters.exposure.lower(), filters.exposure)
    if filters.balcony:
        params['balcony'] = filters.balcony
    if filters.locker:
        params['locker'] = filters.locker
    if filters.floor_level is not None:
        params['floorLevel'] = filters.floor_level
    if filters.building_amenities:
        params['buildingAmenities'] = ','.join(filters.building_amenities)
    if filters.pets_allowed:
        params['petsAllowed'] = filters.pets_allowed
    
    # === FEATURES ===
    if filters.pool:
        params['pool'] = POOL_TYPE_MAPPING.get(filters.pool.lower(), filters.pool)
    if filters.has_pool is not None:
        params['hasPool'] = filters.has_pool
    if filters.waterfront:
        params['waterfront'] = filters.waterfront
    if filters.has_elevator is not None:
        params['hasElevator'] = filters.has_elevator
    if filters.central_vac is not None:
        params['centralVac'] = 'Y' if filters.central_vac else 'N'
    
    # === FINANCIALS ===
    if filters.min_taxes is not None:
        params['minTaxes'] = filters.min_taxes
    if filters.max_taxes is not None:
        params['maxTaxes'] = filters.max_taxes
    
    # === DATES ===
    if filters.min_list_date:
        params['minListDate'] = filters.min_list_date
    if filters.max_list_date:
        params['maxListDate'] = filters.max_list_date
    if filters.min_sold_date:
        params['minSoldDate'] = filters.min_sold_date
    if filters.max_sold_date:
        params['maxSoldDate'] = filters.max_sold_date
    if filters.min_dom is not None:
        params['minDom'] = filters.min_dom
    if filters.max_dom is not None:
        params['maxDom'] = filters.max_dom
    
    # === MLS ===
    if filters.mls_number:
        params['mlsNumber'] = filters.mls_number
    if filters.board:
        params['board'] = filters.board
    if filters.has_virtual_tour is not None:
        params['hasVirtualTour'] = filters.has_virtual_tour
    if filters.has_images is not None:
        params['hasImages'] = filters.has_images
    
    # === RENTAL ===
    if filters.lease_term:
        params['leaseTerm'] = filters.lease_term
    if filters.utilities_included:
        params['utilitiesIncluded'] = ','.join(filters.utilities_included)
    if filters.furnished is not None:
        params['furnished'] = filters.furnished
    if filters.available_date:
        params['availableDate'] = filters.available_date
    
    # === GEO ===
    if filters.latitude is not None:
        params['lat'] = filters.latitude
    if filters.longitude is not None:
        params['lng'] = filters.longitude
    if filters.radius_km is not None:
        params['radius'] = filters.radius_km
    
    # === KEYWORDS ===
    if filters.keywords:
        params['keywords'] = ','.join(filters.keywords)
    if filters.exclude_keywords:
        params['excludeKeywords'] = ','.join(filters.exclude_keywords)
    
    # === PAGINATION ===
    params['page'] = filters.page
    params['resultsPerPage'] = min(filters.page_size, 200)  # Max 200
    if filters.sort_by:
        params['sortBy'] = filters.sort_by
    
    # Remove empty values if requested
    if remove_empty:
        params = {k: v for k, v in params.items() if v is not None and v != '' and v != []}
    
    return params


# ============================================================================
# CONVENIENCE FUNCTION
# ============================================================================

def build_residential_search_params(
    city: Optional[str] = None,
    property_type: Optional[str] = None,
    min_price: Optional[float] = None,
    max_price: Optional[float] = None,
    min_bedrooms: Optional[int] = None,
    max_bedrooms: Optional[int] = None,
    min_bathrooms: Optional[float] = None,
    transaction_type: Optional[str] = None,
    page_size: int = 25,
    **kwargs
) -> Dict[str, Any]:
    """
    Convenience function to build residential search parameters.
    
    Args:
        city: City name
        property_type: Property type (will be normalized)
        min_price: Minimum price
        max_price: Maximum price
        min_bedrooms: Minimum bedrooms
        max_bedrooms: Maximum bedrooms
        min_bathrooms: Minimum bathrooms
        transaction_type: 'sale' or 'rent'
        page_size: Results per page
        **kwargs: Additional filter parameters
        
    Returns:
        Dictionary of Repliers API parameters
    """
    filters = ResidentialFilters(
        city=city,
        min_price=min_price,
        max_price=max_price,
        min_bedrooms=min_bedrooms,
        max_bedrooms=max_bedrooms,
        min_bathrooms=min_bathrooms,
        page_size=page_size,
    )
    
    # Normalize property type
    if property_type:
        filters.property_type = RESIDENTIAL_PROPERTY_TYPE_MAPPING.get(
            property_type.lower(), property_type
        )
    
    # Normalize transaction type
    if transaction_type:
        if transaction_type.lower() in ['rent', 'rental', 'lease']:
            filters.transaction_type = 'Lease'
        elif transaction_type.lower() in ['sale', 'buy', 'purchase']:
            filters.transaction_type = 'Sale'
    
    # Apply additional kwargs
    for key, value in kwargs.items():
        if hasattr(filters, key) and value is not None:
            setattr(filters, key, value)
    
    return build_residential_api_params(filters)


# ============================================================================
# SINGLETON EXTRACTOR
# ============================================================================

_extractor_instance = None

def get_filter_extractor() -> ResidentialFilterExtractor:
    """Get singleton instance of ResidentialFilterExtractor."""
    global _extractor_instance
    if _extractor_instance is None:
        _extractor_instance = ResidentialFilterExtractor()
    return _extractor_instance


# ============================================================================
# EXPORTS
# ============================================================================

__all__ = [
    'ResidentialFilters',
    'ResidentialFilterExtractor',
    'build_residential_api_params',
    'build_residential_search_params',
    'get_filter_extractor',
    'RESIDENTIAL_PROPERTY_TYPE_MAPPING',
    'PROPERTY_STYLE_MAPPING',
    'OWNERSHIP_TYPE_MAPPING',
    'GARAGE_TYPE_MAPPING',
    'BASEMENT_TYPE_MAPPING',
    'EXPOSURE_MAPPING',
    'POOL_TYPE_MAPPING',
]
