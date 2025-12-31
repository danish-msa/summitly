"""
Repliers API Integration for Property Valuation
Provides functions to fetch property details and find comparable sold properties
for Canadian real estate valuation using the Direct Comparison Approach.

API Documentation: https://api.repliers.io/docs
Author: Real Estate Valuation System
Date: November 2025
"""

from __future__ import annotations

import os
import logging
import requests
from datetime import datetime, timedelta, date
from typing import Dict, List, Optional, Any, Tuple, TYPE_CHECKING
from functools import lru_cache
import time
import hashlib
import json

# Type hints only (not imported at runtime to avoid circular imports)
if TYPE_CHECKING:
    from models.valuation_models import PropertyDetails, ComparableProperty

# Configure logging
logging.basicConfig(
    level=logging.INFO,
    format='%(asctime)s - %(name)s - %(levelname)s - %(message)s'
)
logger = logging.getLogger(__name__)

# API Configuration
REPLIERS_BASE_URL = "https://api.repliers.io"
REPLIERS_API_KEY = os.getenv('REPLIERS_API_KEY', '')
REQUEST_TIMEOUT = 30  # seconds
CACHE_TTL = 3600  # 1 hour in seconds

# Cache storage for time-based expiry (simple alternative to lru_cache for time-aware caching)
_cache_store = {}


# ==================== UTILITY FUNCTIONS ====================

def _get_cache_key(*args, **kwargs) -> str:
    """Generate a cache key from function arguments."""
    key_data = str(args) + str(sorted(kwargs.items()))
    return hashlib.md5(key_data.encode()).hexdigest()


def _is_cache_valid(cache_entry: Dict) -> bool:
    """Check if a cache entry is still valid."""
    if not cache_entry:
        return False
    timestamp = cache_entry.get('timestamp', 0)
    return (time.time() - timestamp) < CACHE_TTL


def _get_from_cache(cache_key: str) -> Optional[Any]:
    """Retrieve data from cache if valid."""
    if cache_key in _cache_store:
        entry = _cache_store[cache_key]
        if _is_cache_valid(entry):
            logger.debug(f"Cache hit for key: {cache_key[:8]}...")
            return entry['data']
        else:
            # Remove expired entry
            del _cache_store[cache_key]
    return None


def _save_to_cache(cache_key: str, data: Any):
    """Save data to cache with timestamp."""
    _cache_store[cache_key] = {
        'data': data,
        'timestamp': time.time()
    }
    logger.debug(f"Cached data for key: {cache_key[:8]}...")


def _make_api_request(
    endpoint: str,
    params: Dict[str, Any] = None,
    method: str = 'GET',
    use_cache: bool = True
) -> Optional[Dict]:
    """
    Make an API request to Repliers with error handling and caching.
    Uses the same authentication pattern as voice_assistant_clean.py
    
    Args:
        endpoint: API endpoint path (e.g., '/listings')
        params: Query parameters dictionary
        method: HTTP method (GET, POST)
        use_cache: Whether to use caching for this request
        
    Returns:
        API response as dictionary, or None if request fails
    """
    # Generate cache key
    cache_key = _get_cache_key(endpoint, params or {}, method)
    
    # Check cache first
    if use_cache:
        cached_data = _get_from_cache(cache_key)
        if cached_data is not None:
            return cached_data
    
    # Prepare request
    url = f"{REPLIERS_BASE_URL}{endpoint}"
    
    # Use the correct header format from repliers_client.py
    params_with_key = params.copy() if params else {}
    
    headers = {
        'REPLIERS-API-KEY': REPLIERS_API_KEY,
        'Content-Type': 'application/json',
        'Accept': 'application/json',
        'User-Agent': 'RealEstateValuationBot/1.0'
    }
    
    try:
        logger.info(f"Making {method} request to Repliers API: {endpoint}")
        
        # Use the correct authentication header (REPLIERS-API-KEY)
        if method.upper() == 'GET':
            response = requests.get(
                url,
                headers=headers,
                params=params,
                timeout=REQUEST_TIMEOUT
            )
        elif method.upper() == 'POST':
            response = requests.post(
                url,
                headers=headers,
                json=params,
                timeout=REQUEST_TIMEOUT
            )
        else:
            raise ValueError(f"Unsupported HTTP method: {method}")
        
        # Check response status
        response.raise_for_status()
        
        data = response.json()
        
        # Cache successful response
        if use_cache:
            _save_to_cache(cache_key, data)
        
        logger.info(f"Successfully retrieved data from {endpoint}")
        return data
        
    except requests.exceptions.Timeout:
        logger.error(f"Request timeout after {REQUEST_TIMEOUT}s for {endpoint}")
        return None
        
    except requests.exceptions.HTTPError as e:
        logger.error(f"HTTP error for {endpoint}: {e.response.status_code} - {e.response.text}")
        return None
        
    except requests.exceptions.ConnectionError:
        logger.error(f"Connection error - unable to reach Repliers API at {url}")
        return None
        
    except requests.exceptions.RequestException as e:
        logger.error(f"Request failed for {endpoint}: {str(e)}")
        return None
        
    except json.JSONDecodeError:
        logger.error(f"Invalid JSON response from {endpoint}")
        return None
        
    except Exception as e:
        logger.error(f"Unexpected error making API request to {endpoint}: {str(e)}")
        return None


def _extract_property_value(data: Dict, *keys, default=None) -> Any:
    """
    Safely extract nested dictionary values with multiple fallback keys.
    
    Args:
        data: Dictionary to extract from
        *keys: Sequence of keys to try (e.g., 'details', 'bedrooms')
        default: Default value if key not found
        
    Returns:
        Extracted value or default
    """
    for key in keys:
        if isinstance(data, dict) and key in data:
            data = data[key]
        else:
            return default
    return data if data is not None else default


def _parse_canadian_price(price_str: Any) -> Optional[float]:
    """
    Parse Canadian price strings to float.
    
    Examples:
        '$1,250,000' -> 1250000.0
        '850000' -> 850000.0
        '$1.2M' -> 1200000.0
    """
    if price_str is None:
        return None
    
    if isinstance(price_str, (int, float)):
        return float(price_str)
    
    try:
        # Remove currency symbols, commas, spaces
        price_clean = str(price_str).replace('$', '').replace(',', '').replace(' ', '').strip()
        
        # Handle M (millions) and K (thousands)
        if 'M' in price_clean.upper():
            return float(price_clean.upper().replace('M', '')) * 1_000_000
        elif 'K' in price_clean.upper():
            return float(price_clean.upper().replace('K', '')) * 1_000
        
        return float(price_clean)
    except (ValueError, AttributeError):
        logger.warning(f"Could not parse price: {price_str}")
        return None


def _parse_sqft(sqft_str: Any) -> int:
    """
    Parse square footage strings to integer.
    
    Handles formats like:
        '0-499' -> 250 (midpoint)
        '< 700' -> 350 (half of max)
        '700-1100' -> 900 (midpoint)
        '1200' -> 1200
        1200 -> 1200
    """
    if sqft_str is None:
        return 0
    
    if isinstance(sqft_str, (int, float)):
        return int(sqft_str)
    
    try:
        sqft_str = str(sqft_str).strip()
        
        # Handle "< 700" format
        if sqft_str.startswith('<'):
            max_val = int(''.join(filter(str.isdigit, sqft_str)))
            return max_val // 2  # Use half of max
        
        # Handle "> 2000" format
        if sqft_str.startswith('>'):
            min_val = int(''.join(filter(str.isdigit, sqft_str)))
            return min_val  # Use the minimum value
        
        # Handle "700-1100" range format
        if '-' in sqft_str:
            parts = sqft_str.split('-')
            if len(parts) == 2:
                try:
                    min_val = int(parts[0].strip())
                    max_val = int(parts[1].strip())
                    return (min_val + max_val) // 2  # Return midpoint
                except ValueError:
                    pass
        
        # Handle direct number
        return int(''.join(filter(str.isdigit, sqft_str)) or '0')
    
    except (ValueError, AttributeError):
        logger.warning(f"Could not parse sqft: {sqft_str}")
        return 0


def _parse_date(date_str: Any) -> Optional[date]:
    """
    Parse various date formats to date object.
    
    Supports: 'YYYY-MM-DD', 'DD/MM/YYYY', timestamps
    """
    if date_str is None:
        return None
    
    if isinstance(date_str, date):
        return date_str
    
    if isinstance(date_str, datetime):
        return date_str.date()
    
    # Handle ISO 8601 format with timezone (e.g., "2025-11-26T01:39:17.000-00:00")
    # Strip timezone info and parse
    date_str_clean = str(date_str)
    if 'T' in date_str_clean and ('-' in date_str_clean[-6:] or '+' in date_str_clean[-6:]):
        # Has timezone offset at end - remove it
        date_str_clean = date_str_clean.rsplit('-', 1)[0].rsplit('+', 1)[0]
    
    # Try various date formats
    date_formats = [
        '%Y-%m-%d',
        '%d/%m/%Y',
        '%m/%d/%Y',
        '%Y/%m/%d',
        '%d-%m-%Y',
        '%Y-%m-%dT%H:%M:%S',
        '%Y-%m-%dT%H:%M:%S.%f'
    ]
    
    for fmt in date_formats:
        try:
            return datetime.strptime(date_str_clean, fmt).date()
        except ValueError:
            continue
    
    logger.warning(f"Could not parse date: {date_str}")
    return None


# ==================== MAIN API FUNCTIONS ====================

def fetch_property_details(mls_id: str) -> Optional["PropertyDetails"]:
    """
    Fetch detailed property information from Repliers API by MLS ID.
    
    This function searches for a property using its MLS number and returns
    comprehensive property details suitable for valuation analysis.
    
    Args:
        mls_id: MLS listing number (e.g., 'C8753210', 'W1234567')
        
    Returns:
        PropertyDetails object with all available property information,
        or None if property not found or API request fails
        
    Example:
        >>> property_data = fetch_property_details('C8753210')
        >>> if property_data:
        ...     print(f"Found: {property_data.address}")
        ...     print(f"Size: {property_data.sqft} sqft, {property_data.bedrooms} beds")
    """
    # Lazy import to avoid module loading issues
    from models.valuation_models import PropertyDetails
    
    if not mls_id or not mls_id.strip():
        logger.error("MLS ID cannot be empty")
        return None
    
    mls_id = mls_id.strip().upper()
    logger.info(f"Fetching property details for MLS ID: {mls_id}")
    
    # Use /listings endpoint - MLS ID is unique so no need for map filter
    params = {
        'mlsNumber': mls_id,
        'fields': 'boardId,mlsNumber,map,class,status,listPrice,lastStatus,address,details,listDate,lastTransition,soldDate,soldPrice',
        'limit': 1
    }
    
    # Disable cache for property fetch to ensure fresh data after parameter changes
    response = _make_api_request('/listings', params=params, use_cache=False)
    
    if not response:
        logger.error(f"No response from API for MLS ID: {mls_id}")
        return None
    
    # Extract results - /listings endpoint returns direct array or {'listings': [...]}
    if isinstance(response, list):
        results = response
    else:
        results = response.get('listings', response.get('results', []))
    
    if not results:
        logger.warning(f"No property found with MLS ID: {mls_id}")
        return None
    
    # Get first result
    property_data = results[0]
    
    try:
        # Extract address information
        address_data = property_data.get('address', {})
        
        # Build street address from components
        street_number = address_data.get('streetNumber', '')
        street_name = address_data.get('streetName', '')
        street_suffix = address_data.get('streetSuffix', '')
        
        if street_number and street_name:
            # Build full street address
            street_address = f"{street_number} {street_name}"
            if street_suffix:
                street_address += f" {street_suffix}"
        else:
            # Fallback to single field if available
            street_address = (
                address_data.get('streetAddress') or 
                address_data.get('address') or 
                property_data.get('streetAddress', 'Unknown Address')
            )
        
        city = (
            address_data.get('city') or 
            property_data.get('city', 'Unknown City')
        )
        province = (
            address_data.get('state') or  # API uses 'state' for province
            address_data.get('province') or 
            property_data.get('province', 'ON')
        )
        postal_code = (
            address_data.get('zip') or 
            address_data.get('postalCode') or 
            property_data.get('postalCode', '')
        )
        
        # Extract property details
        details = property_data.get('details', {})
        
        # Bedrooms and bathrooms
        bedrooms = int(_extract_property_value(details, 'numBedrooms', default=0) or 
                      _extract_property_value(property_data, 'bedrooms', default=0) or 0)
        
        bathrooms = float(_extract_property_value(details, 'numBathrooms', default=0) or 
                         _extract_property_value(property_data, 'bathrooms', default=0) or 0)
        
        # Square footage - handle range formats like "700-1100" or "< 700"
        sqft_raw = (_extract_property_value(details, 'sqft') or 
                   _extract_property_value(property_data, 'sqft') or 
                   _extract_property_value(details, 'livingArea') or 0)
        sqft = _parse_sqft(sqft_raw)
        
        # Lot size
        land_data = property_data.get('land', {})
        lot_size = (
            land_data.get('sizeTotal') or 
            details.get('lotSize') or 
            property_data.get('lotSize')
        )
        if lot_size:
            lot_size = int(float(lot_size))
        
        # Year built - handle "New" or other non-numeric values
        year_built = (
            details.get('yearBuilt') or 
            property_data.get('yearBuilt')
        )
        if year_built:
            try:
                # Try to extract digits only
                year_str = ''.join(filter(str.isdigit, str(year_built)))
                if year_str:
                    year_built = int(year_str)
                    # Validate year range (must be between 1700 and current year + 10)
                    current_year = datetime.now().year
                    if year_built < 1700 or year_built > current_year + 10:
                        logger.warning(f"Invalid year_built value: {year_built}. Setting to None.")
                        year_built = None
                else:
                    year_built = None  # "New" or other text
            except (ValueError, AttributeError):
                year_built = None
        
        # Property type
        property_type = (
            property_data.get('type') or 
            details.get('propertyType') or 
            property_data.get('propertyType', 'Residential')
        )
        
        # Architectural style
        style = (
            details.get('style') or 
            details.get('architecturalStyle') or 
            property_data.get('style')
        )
        
        # Basement
        basement_finish = (
            details.get('basement') or 
            details.get('basementType') or 
            property_data.get('basement', 'Unfinished')
        )
        
        # Garage
        garage_type = (
            details.get('garage') or 
            details.get('garageType') or 
            property_data.get('garageType', 'None')
        )
        
        # Parking spaces
        parking_spaces = int(
            details.get('numParkingSpaces', 0) or 
            details.get('parkingSpaces', 0) or 
            property_data.get('parkingSpaces', 0) or 0
        )
        
        # Condition
        condition = (
            property_data.get('condition') or 
            details.get('condition', 'Average')
        )
        
        # Features
        features = (
            details.get('features', []) or 
            property_data.get('features', []) or 
            []
        )
        if isinstance(features, str):
            features = [f.strip() for f in features.split(',')]
        
        # Geographic coordinates
        map_data = property_data.get('map', {})
        latitude = (
            map_data.get('latitude') or 
            property_data.get('latitude')
        )
        longitude = (
            map_data.get('longitude') or 
            property_data.get('longitude')
        )
        
        # Create PropertyDetails object
        property_details = PropertyDetails(
            mls_id=mls_id,
            address=street_address,
            city=city,
            province=province,
            postal_code=postal_code,
            property_type=property_type,
            bedrooms=bedrooms,
            bathrooms=bathrooms,
            sqft=sqft,
            lot_size=lot_size,
            year_built=year_built,
            condition=condition,
            style=style,
            basement_finish=basement_finish,
            garage_type=garage_type,
            parking_spaces=parking_spaces,
            features=features if isinstance(features, list) else [],
            latitude=float(latitude) if latitude else None,
            longitude=float(longitude) if longitude else None
        )
        
        logger.info(f"Successfully fetched property: {property_details.address}")
        return property_details
        
    except ValueError as e:
        logger.error(f"Validation error creating PropertyDetails for {mls_id}: {str(e)}")
        return None
        
    except Exception as e:
        logger.error(f"Error parsing property data for {mls_id}: {str(e)}")
        return None


def find_comparables(
    subject_property: "PropertyDetails",
    limit: int = 8,
    radius_km: float = 2.0,
    max_age_days: int = 180
) -> List["ComparableProperty"]:
    """
    Find comparable sold properties for valuation analysis.
    
    Searches for recently sold properties that match the subject property's
    characteristics within specified tolerances. Uses Direct Comparison Approach
    criteria for selecting valid comparables.
    
    IMPORTANT: Uses actual SOLD PRICES from property history, not list prices.
    Extracts soldPrice and soldDate from the 'history' field in API response.
    
    Search Criteria:
        - Same property type (Detached, Semi-Detached, Townhouse, etc.)
        - Same city or within radius if coordinates available
        - Bedrooms: ±1 from subject property
        - Bathrooms: ±1 from subject property
        - Square footage: ±15% from subject property
        - Sold within last 6 months (configurable)
        - Must have soldPrice and soldDate in history
    
    Args:
        subject_property: The property being valued
        limit: Maximum number of comparables to return (default: 8)
        radius_km: Search radius in kilometers if coordinates available (default: 2.0)
        max_age_days: Maximum age of sales in days (default: 180)
        
    Returns:
        List of ComparableProperty objects sorted by sale date (most recent first)
        Returns empty list if no comparables found or API fails
        
    Example:
        >>> subject = fetch_property_details('C8753210')
        >>> comparables = find_comparables(subject, limit=5)
        >>> for comp in comparables:
        ...     print(f"{comp.property_details.address}: ${comp.sale_price:,.0f}")
    """
    # Ensure project root is in sys.path for imports
    # Lazy import to avoid module loading issues
    from models.valuation_models import PropertyDetails, ComparableProperty
    
    if not subject_property:
        logger.error("Subject property cannot be None")
        return []
    
    logger.info(f"Finding comparables for {subject_property.address}")
    
    # Calculate search parameters
    sqft_min = int(subject_property.sqft * 0.85)  # -15%
    sqft_max = int(subject_property.sqft * 1.15)  # +15%
    
    beds_min = max(0, subject_property.bedrooms - 1)
    beds_max = subject_property.bedrooms + 1
    
    baths_min = max(0, subject_property.bathrooms - 1)
    baths_max = subject_property.bathrooms + 1
    
    # Calculate date range for sold properties (sold within last N days)
    # Using history data with soldPrice and soldDate for accurate valuations
    min_sold_date = (datetime.now() - timedelta(days=max_age_days)).strftime('%Y-%m-%d')
    
    # Build API parameters to fetch properties with history
    params = {
        'city': subject_property.city,
        'propertyType': subject_property.property_type,
        'minBeds': beds_min,
        'maxBeds': beds_max,
        'minBaths': baths_min,
        'maxBaths': baths_max,
        'minSqft': sqft_min,
        'maxSqft': sqft_max,
        'minListPrice': 100000,  # Filter out rentals
        'limit': limit * 3,  # Request more to filter for sold properties
        'sort': 'listDate:desc'  # Most recent first
    }
    
    # Add geographic search if coordinates available
    if subject_property.latitude and subject_property.longitude:
        params['lat'] = subject_property.latitude  # API expects 'lat', not 'latitude'
        params['long'] = subject_property.longitude  # API expects 'long', not 'longitude'
        params['radius'] = radius_km
        logger.info(f"Using geographic search: {radius_km}km radius")
    
    logger.info(f"Search parameters: {sqft_min}-{sqft_max} sqft, {beds_min}-{beds_max} beds, {baths_min}-{baths_max} baths")
    
    # Add fields parameter - CRITICAL: include 'history' to get sold data
    params['fields'] = 'boardId,mlsNumber,map,class,status,listPrice,lastStatus,address,details,listDate,lastTransition,soldDate,soldPrice,history'
    
    # Make API request using /listings endpoint with history data
    response = _make_api_request('/listings', params=params)
    
    if not response:
        logger.error("Failed to fetch comparables from API")
        return []
    
    # Extract results - /listings endpoint returns direct array or {'listings': [...]}
    if isinstance(response, list):
        results = response
    else:
        results = response.get('listings', response.get('results', []))
    
    if not results:
        logger.warning(f"No comparables found for {subject_property.address}")
        return []
    
    logger.info(f"Found {len(results)} potential comparables")
    
    # Parse and create ComparableProperty objects
    sold_comparables = []
    active_comparables = []
    
    for result in results:
        try:
            # Skip if this is the subject property itself
            result_mls = result.get('mlsNumber', '').upper()
            if result_mls == subject_property.mls_id:
                continue
            
            # CRITICAL FIX: Extract SOLD price from history, not list price
            sale_price = None
            sale_date = None
            is_sold = False
            
            # Check history for sold data (most recent sold transaction)
            history = result.get('history', [])
            if history:
                # Find the most recent sold transaction
                for transaction in sorted(history, key=lambda x: x.get('soldDate') or '', reverse=True):
                    if transaction.get('soldPrice') and transaction.get('soldDate'):
                        sale_price = _parse_canadian_price(transaction.get('soldPrice'))
                        sale_date = _parse_date(transaction.get('soldDate'))
                        if sale_price and sale_date:
                            # Check if sold date is within our time range
                            days_ago = (datetime.now().date() - sale_date).days
                            if days_ago <= max_age_days:
                                is_sold = True
                                logger.debug(f"Found sold data for {result_mls}: ${sale_price:,} on {sale_date}")
                                break
                        sale_price = None
                        sale_date = None
            
            # FALLBACK: Use active listing price if no sold data (less reliable but better than nothing)
            if not sale_price or not sale_date:
                # Only use active listings as fallback
                if result.get('status') == 'A':
                    sale_price = _parse_canadian_price(result.get('listPrice') or result.get('price'))
                    sale_date = _parse_date(result.get('listDate') or result.get('lastTransition') or result.get('date'))
                    
                    if sale_price and sale_date:
                        # Check if listed within our time range
                        days_ago = (datetime.now().date() - sale_date).days
                        if days_ago <= max_age_days:
                            logger.debug(f"Using active listing for {result_mls}: ${sale_price:,} (fallback)")
                        else:
                            sale_price = None
                            sale_date = None
            
            # Skip if no valid data found
            if not sale_price or not sale_date:
                logger.debug(f"Skipping property {result_mls}: No sold/active price/date")
                continue
            
            # Filter out suspiciously low prices (likely rentals or errors)
            if sale_price < 100000:
                logger.debug(f"Skipping property {result_mls}: Invalid or too low sold price (${sale_price})")
                continue
            
            # Days on market
            days_on_market = result.get('daysOnMarket') or result.get('dom')
            if days_on_market:
                days_on_market = int(days_on_market)
            
            # Create PropertyDetails for this comparable
            comp_property = _create_property_from_result(result)
            
            if not comp_property:
                continue
            
            # Calculate distance if coordinates available
            distance_km = None
            if (subject_property.latitude and subject_property.longitude and 
                comp_property.latitude and comp_property.longitude):
                distance_km = _calculate_distance(
                    subject_property.latitude, subject_property.longitude,
                    comp_property.latitude, comp_property.longitude
                )
            
            # Calculate similarity score
            similarity_score = _calculate_similarity_score(subject_property, comp_property)
            
            # Create ComparableProperty object
            comparable = ComparableProperty(
                property_details=comp_property,
                sale_price=sale_price,
                sale_date=sale_date,
                days_on_market=days_on_market,
                adjustments=[],  # Adjustments calculated separately
                distance_from_subject=distance_km,
                similarity_score=similarity_score
            )
            
            # Separate sold vs active comparables
            if is_sold:
                sold_comparables.append(comparable)
            else:
                active_comparables.append(comparable)
            
        except Exception as e:
            logger.warning(f"Error parsing comparable property: {str(e)}")
            continue
    
    # Prioritize sold comparables, then add active listings if needed
    logger.info(f"Found {len(sold_comparables)} sold comparables and {len(active_comparables)} active listings")
    
    # Sort both lists by similarity and recency
    sold_comparables.sort(key=lambda x: (x.similarity_score or 0, x.sale_date), reverse=True)
    active_comparables.sort(key=lambda x: (x.similarity_score or 0, x.sale_date), reverse=True)
    
    # Strategy: Use sold comparables first, supplement with active if insufficient
    comparables = []
    
    if len(sold_comparables) >= limit:
        # We have enough sold comparables - use only those (most accurate)
        comparables = sold_comparables[:limit]
        logger.info(f"Using {len(comparables)} sold comparables (sufficient sold data)")
    elif len(sold_comparables) >= 3:
        # We have at least 3 sold - use those + best active listings
        comparables = sold_comparables + active_comparables[:limit - len(sold_comparables)]
        logger.info(f"Using {len(sold_comparables)} sold + {len(comparables) - len(sold_comparables)} active comparables (hybrid approach)")
    else:
        # Insufficient sold data - use mix with active listings (less reliable)
        comparables = sold_comparables + active_comparables
        comparables = comparables[:limit]
        logger.warning(f"⚠️ Only {len(sold_comparables)} sold comparables found. Using {len(comparables)} total comparables (including {len(comparables) - len(sold_comparables)} active listings). Valuation may be less accurate.")
    
    logger.info(f"Returning {len(comparables)} comparables for {subject_property.address}")
    
    return comparables


def get_market_data(city: str, province: str = 'ON') -> Dict[str, Any]:
    """
    Fetch market statistics and trends for a specific city.
    
    Retrieves comprehensive market data including median prices, price per square foot,
    average days on market, inventory levels, and price trends. Falls back to regional
    defaults if API data unavailable.
    
    Args:
        city: City name (e.g., 'Toronto', 'Brampton', 'London')
        province: Province code (default: 'ON' for Ontario)
        
    Returns:
        Dictionary containing market statistics:
        {
            'city': str,
            'province': str,
            'median_price': float,
            'average_price': float,
            'price_per_sqft': float,
            'avg_days_on_market': int,
            'inventory_level': str,
            'sale_to_list_ratio': float,
            'price_trend_3month': float,  # Percentage change
            'price_trend_6month': float,
            'price_trend_12month': float,
            'market_status': str,  # 'Seller', 'Buyer', 'Balanced'
            'total_sales_count': int,
            'data_source': str,
            'last_updated': str
        }
        
    Example:
        >>> market = get_market_data('Toronto')
        >>> print(f"Median: ${market['median_price']:,.0f}")
        >>> print(f"Trend: {market['price_trend_3month']:+.1f}%")
    """
    if not city or not city.strip():
        logger.error("City name cannot be empty")
        return _get_default_market_data('Unknown', province)
    
    city = city.strip().title()
    logger.info(f"Fetching market data for {city}, {province}")
    
    try:
        # Try to fetch market statistics from Repliers API
        params = {
            'city': city,
            'province': province,
            'period': '3months',  # Last 3 months
            'aggregation': 'statistics'
        }
        
        response = _make_api_request('/market/statistics', params=params, use_cache=True)
        
        if response and response.get('data'):
            data = response['data']
            
            # Extract statistics
            return {
                'city': city,
                'province': province,
                'median_price': _parse_canadian_price(data.get('medianPrice')) or 0,
                'average_price': _parse_canadian_price(data.get('averagePrice')) or 0,
                'price_per_sqft': float(data.get('pricePerSqft', 0)),
                'avg_days_on_market': int(data.get('avgDaysOnMarket', 0)),
                'inventory_level': data.get('inventoryLevel', 'Balanced'),
                'sale_to_list_ratio': float(data.get('saleToListRatio', 1.0)),
                'price_trend_3month': float(data.get('priceTrend3Month', 0)),
                'price_trend_6month': float(data.get('priceTrend6Month', 0)),
                'price_trend_12month': float(data.get('priceTrend12Month', 0)),
                'market_status': data.get('marketStatus', 'Balanced'),
                'total_sales_count': int(data.get('totalSales', 0)),
                'data_source': 'Repliers API',
                'last_updated': datetime.now().strftime('%Y-%m-%d %H:%M:%S')
            }
        
    except Exception as e:
        logger.warning(f"Error fetching market data from API: {str(e)}")
    
    # Fallback to default regional data
    logger.info(f"Using default market data for {city}")
    return _get_default_market_data(city, province)


# ==================== HELPER FUNCTIONS ====================

def _create_property_from_result(result: Dict) -> Optional["PropertyDetails"]:
    """Create PropertyDetails object from API search result."""
    # Ensure project root is in sys.path for imports
    import sys
    import os
    project_root = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))
    # Lazy import to avoid module loading issues
    from models.valuation_models import PropertyDetails
    
    try:
        # Extract MLS first for logging
        mls_id = result.get('mlsNumber', result.get('mls_id', f"MLS{int(time.time())}"))
        
        # Extract address - try multiple possible field locations
        address_data = result.get('address', {})
        
        # CRITICAL FIX: Ensure we only get string values, not dict objects
        street_address = (
            address_data.get('streetAddress') or 
            result.get('streetAddress') or
            # Skip result.get('address') since it returns the full dict, not a string
            f"{result.get('streetNumber', '')} {result.get('streetName', '')}".strip() or
            f"MLS {result.get('mlsNumber', 'Property')}"
        )
        
        # Ensure street_address is always a string (safety check)
        if not isinstance(street_address, str):
            street_address = f"MLS {mls_id}"
        
        city = address_data.get('city') or result.get('city', 'Unknown')
        province = address_data.get('province') or result.get('province', 'ON')
        postal_code = address_data.get('zip') or result.get('postalCode', '')
        
        # Log address extraction for debugging
        if isinstance(street_address, str) and street_address.startswith("MLS"):
            logger.debug(f"⚠️ Property {mls_id}: Address not found in API response, using fallback")
            logger.debug(f"   Available fields: {list(result.keys())}")
            logger.debug(f"   Address data: {address_data}")
        
        # Extract details
        details = result.get('details', {})
        
        bedrooms = int(details.get('numBedrooms', 0) or result.get('bedrooms', 0) or 0)
        bathrooms = float(details.get('numBathrooms', 0) or result.get('bathrooms', 0) or 0)
        sqft_raw = details.get('sqft') or result.get('sqft') or 0
        sqft = _parse_sqft(sqft_raw)
        
        lot_size = result.get('land', {}).get('sizeTotal') or details.get('lotSize')
        if lot_size:
            lot_size = int(float(lot_size))
        
        # Year built - handle "New" or other non-numeric values
        year_built = details.get('yearBuilt') or result.get('yearBuilt')
        if year_built:
            try:
                year_str = ''.join(filter(str.isdigit, str(year_built)))
                year_built = int(year_str) if year_str else None
            except (ValueError, AttributeError):
                year_built = None
        
        property_type = result.get('type') or details.get('propertyType', 'Residential')
        style = details.get('style')
        basement_finish = details.get('basement', 'Unfinished')
        garage_type = details.get('garage', 'None')
        parking_spaces = int(details.get('numParkingSpaces', 0) or 0)
        
        features = details.get('features', []) or []
        if isinstance(features, str):
            features = [f.strip() for f in features.split(',')]
        
        map_data = result.get('map', {})
        latitude = map_data.get('latitude') or result.get('latitude')
        longitude = map_data.get('longitude') or result.get('longitude')
        
        return PropertyDetails(
            mls_id=mls_id,
            address=street_address,
            city=city,
            province=province,
            postal_code=postal_code,
            property_type=property_type,
            bedrooms=bedrooms,
            bathrooms=bathrooms,
            sqft=sqft,
            lot_size=lot_size,
            year_built=year_built,
            condition='Average',
            style=style,
            basement_finish=basement_finish,
            garage_type=garage_type,
            parking_spaces=parking_spaces,
            features=features if isinstance(features, list) else [],
            latitude=float(latitude) if latitude else None,
            longitude=float(longitude) if longitude else None
        )
        
    except Exception as e:
        logger.error(f"Error creating PropertyDetails from result: {str(e)}")
        return None


def _calculate_distance(lat1: float, lon1: float, lat2: float, lon2: float) -> float:
    """
    Calculate distance between two points using Haversine formula.
    
    Returns distance in kilometers.
    """
    from math import radians, sin, cos, sqrt, atan2
    
    R = 6371  # Earth's radius in kilometers
    
    lat1, lon1, lat2, lon2 = map(radians, [lat1, lon1, lat2, lon2])
    
    dlat = lat2 - lat1
    dlon = lon2 - lon1
    
    a = sin(dlat/2)**2 + cos(lat1) * cos(lat2) * sin(dlon/2)**2
    c = 2 * atan2(sqrt(a), sqrt(1-a))
    
    return R * c


def _calculate_similarity_score(subject: "PropertyDetails", comparable: "PropertyDetails") -> float:
    """
    Calculate similarity score between subject and comparable property.
    
    Score based on:
    - Property type match (30%)
    - Square footage similarity (25%)
    - Bedroom match (20%)
    - Bathroom match (15%)
    - Year built similarity (10%)
    
    Returns score from 0 to 100.
    """
    score = 0.0
    
    # Property type (30 points)
    if subject.property_type.lower() == comparable.property_type.lower():
        score += 30
    
    # Square footage (25 points)
    if subject.sqft > 0:
        sqft_diff = abs(subject.sqft - comparable.sqft) / subject.sqft
        sqft_score = max(0, 25 * (1 - sqft_diff * 2))  # Penalize >50% difference
        score += sqft_score
    
    # Bedrooms (20 points)
    bed_diff = abs(subject.bedrooms - comparable.bedrooms)
    if bed_diff == 0:
        score += 20
    elif bed_diff == 1:
        score += 10
    
    # Bathrooms (15 points)
    bath_diff = abs(subject.bathrooms - comparable.bathrooms)
    if bath_diff == 0:
        score += 15
    elif bath_diff <= 0.5:
        score += 10
    elif bath_diff <= 1:
        score += 5
    
    # Year built (10 points)
    if subject.year_built and comparable.year_built:
        year_diff = abs(subject.year_built - comparable.year_built)
        if year_diff <= 5:
            score += 10
        elif year_diff <= 10:
            score += 7
        elif year_diff <= 20:
            score += 4
    
    return round(score, 2)


def _get_default_market_data(city: str, province: str) -> Dict[str, Any]:
    """
    Get default market data for major Ontario cities.
    
    Fallback data based on recent market averages (2025).
    """
    # Default data for major Ontario markets
    defaults = {
        'toronto': {
            'median_price': 1100000,
            'average_price': 1250000,
            'price_per_sqft': 500,
            'avg_days_on_market': 18,
            'sale_to_list_ratio': 1.02,
            'price_trend_3month': 1.2,
            'price_trend_6month': 2.8,
            'price_trend_12month': 5.5
        },
        'mississauga': {
            'median_price': 950000,
            'average_price': 1050000,
            'price_per_sqft': 420,
            'avg_days_on_market': 22,
            'sale_to_list_ratio': 1.00,
            'price_trend_3month': 0.8,
            'price_trend_6month': 2.2,
            'price_trend_12month': 4.8
        },
        'brampton': {
            'median_price': 700000,
            'average_price': 750000,
            'price_per_sqft': 350,
            'avg_days_on_market': 25,
            'sale_to_list_ratio': 0.99,
            'price_trend_3month': 0.5,
            'price_trend_6month': 1.8,
            'price_trend_12month': 3.5
        },
        'markham': {
            'median_price': 1050000,
            'average_price': 1150000,
            'price_per_sqft': 480,
            'avg_days_on_market': 20,
            'sale_to_list_ratio': 1.01,
            'price_trend_3month': 1.0,
            'price_trend_6month': 2.5,
            'price_trend_12month': 5.0
        },
        'london': {
            'median_price': 450000,
            'average_price': 500000,
            'price_per_sqft': 300,
            'avg_days_on_market': 30,
            'sale_to_list_ratio': 0.98,
            'price_trend_3month': 0.3,
            'price_trend_6month': 1.2,
            'price_trend_12month': 2.8
        },
        'ottawa': {
            'median_price': 650000,
            'average_price': 700000,
            'price_per_sqft': 380,
            'avg_days_on_market': 28,
            'sale_to_list_ratio': 0.99,
            'price_trend_3month': 0.6,
            'price_trend_6month': 1.5,
            'price_trend_12month': 3.2
        }
    }
    
    city_lower = city.lower()
    city_data = defaults.get(city_lower, defaults['brampton'])  # Default to Brampton
    
    # Determine market status based on sale-to-list ratio
    ratio = city_data['sale_to_list_ratio']
    if ratio >= 1.02:
        market_status = 'Seller\'s Market'
        inventory = 'Low'
    elif ratio <= 0.98:
        market_status = 'Buyer\'s Market'
        inventory = 'High'
    else:
        market_status = 'Balanced Market'
        inventory = 'Balanced'
    
    return {
        'city': city,
        'province': province,
        'median_price': city_data['median_price'],
        'average_price': city_data['average_price'],
        'price_per_sqft': city_data['price_per_sqft'],
        'avg_days_on_market': city_data['avg_days_on_market'],
        'inventory_level': inventory,
        'sale_to_list_ratio': city_data['sale_to_list_ratio'],
        'price_trend_3month': city_data['price_trend_3month'],
        'price_trend_6month': city_data['price_trend_6month'],
        'price_trend_12month': city_data['price_trend_12month'],
        'market_status': market_status,
        'total_sales_count': 0,
        'data_source': 'Default Regional Data',
        'last_updated': datetime.now().strftime('%Y-%m-%d %H:%M:%S')
    }


def clear_cache():
    """Clear all cached API responses. Useful for testing or forcing fresh data."""
    global _cache_store
    _cache_store.clear()
    logger.info("Cache cleared")


def get_cache_stats() -> Dict[str, Any]:
    """Get statistics about the current cache state."""
    valid_entries = sum(1 for entry in _cache_store.values() if _is_cache_valid(entry))
    
    return {
        'total_entries': len(_cache_store),
        'valid_entries': valid_entries,
        'expired_entries': len(_cache_store) - valid_entries,
        'cache_ttl_seconds': CACHE_TTL
    }


# ==================== MAIN EXAMPLE ====================

if __name__ == '__main__':
    """Example usage and testing."""
    
    print("=" * 70)
    print("Repliers API Integration - Property Valuation System")
    print("=" * 70)
    
    # Test 1: Fetch property details
    print("\n📍 Test 1: Fetching Property Details")
    print("-" * 70)
    
    test_mls_id = 'C8753210'  # Replace with actual MLS ID
    property_data = fetch_property_details(test_mls_id)
    
    if property_data:
        print(f"✅ Successfully fetched property:")
        print(f"   {property_data.get_summary()}")
        print(f"   MLS: {property_data.mls_id}")
        print(f"   Price per sqft estimate: ${property_data.calculate_price_per_sqft(1200000):.2f}")
    else:
        print(f"❌ Could not fetch property with MLS ID: {test_mls_id}")
        print("   Note: Using mock MLS ID for demonstration")
        
        # Create mock property for testing
        property_data = PropertyDetails(
            mls_id='MOCK123',
            address='123 Test Street',
            city='Toronto',
            province='ON',
            postal_code='M5V 3A8',
            property_type='Detached',
            bedrooms=4,
            bathrooms=3.5,
            sqft=2500,
            lot_size=5000,
            year_built=2015
        )
        print(f"   Created mock property for testing: {property_data.address}")
    
    # Test 2: Find comparables
    print("\n🔍 Test 2: Finding Comparable Properties")
    print("-" * 70)
    
    comparables = find_comparables(property_data, limit=5)
    
    if comparables:
        print(f"✅ Found {len(comparables)} comparable properties:")
        for i, comp in enumerate(comparables, 1):
            print(f"\n   {i}. {comp.property_details.address}")
            print(f"      MLS: {comp.property_details.mls_id}")
            print(f"      Sale Price: ${comp.sale_price:,.0f}")
            print(f"      Sale Date: {comp.sale_date}")
            print(f"      Size: {comp.property_details.sqft} sqft, "
                  f"{comp.property_details.bedrooms} bed, {comp.property_details.bathrooms} bath")
            print(f"      Similarity Score: {comp.similarity_score:.1f}%")
            if comp.distance_from_subject:
                print(f"      Distance: {comp.distance_from_subject:.2f} km")
    else:
        print("❌ No comparables found (this is expected with mock data)")
    
    # Test 3: Get market data
    print("\n📊 Test 3: Fetching Market Data")
    print("-" * 70)
    
    market_data = get_market_data('Toronto', 'ON')
    
    print(f"✅ Market data for {market_data['city']}, {market_data['province']}:")
    print(f"   Median Price: ${market_data['median_price']:,.0f}")
    print(f"   Average Price: ${market_data['average_price']:,.0f}")
    print(f"   Price per Sqft: ${market_data['price_per_sqft']:.2f}")
    print(f"   Avg Days on Market: {market_data['avg_days_on_market']} days")
    print(f"   Market Status: {market_data['market_status']}")
    print(f"   Price Trend (3mo): {market_data['price_trend_3month']:+.1f}%")
    print(f"   Sale-to-List Ratio: {market_data['sale_to_list_ratio']:.2f}")
    print(f"   Data Source: {market_data['data_source']}")
    
    # Cache statistics
    print("\n💾 Cache Statistics")
    print("-" * 70)
    cache_stats = get_cache_stats()
    print(f"   Total Entries: {cache_stats['total_entries']}")
    print(f"   Valid Entries: {cache_stats['valid_entries']}")
    print(f"   Cache TTL: {cache_stats['cache_ttl_seconds']}s ({cache_stats['cache_ttl_seconds']//60} minutes)")
    
    print("\n" + "=" * 70)
    print("✅ All tests completed!")
    print("=" * 70)
