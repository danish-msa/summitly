"""
Street-Based Property Search Service
=====================================
Handles street-only searches with client-side filtering.

PROBLEM:
Repliers API does NOT reliably support streetName-only searches.
It requires city + optionally streetNumber for accuracy.

SOLUTION:
1. Query Repliers with city (+ property type if specified)
2. Filter results CLIENT-SIDE by normalized street name
3. Progressively fetch more pages until TARGET_RESULTS found
4. Stop early if enough matches collected

CONSTRAINTS:
- MAX_PAGES = 5 (limit API calls)
- TARGET_RESULTS = 10 (stop when reached)
- Page size = 20 (Repliers default)

Author: Summitly Team
Date: December 18, 2024
"""

import logging
from typing import Dict, List, Optional, Any
from services.street_utils import (
    normalize_street_name,
    streets_match,
    validate_street_search_params,
    log_street_search,
    log_street_match,
    log_street_filter_stats
)

logger = logging.getLogger(__name__)

# Configuration constants
MAX_PAGES = 5  # Maximum pages to fetch (prevent excessive API calls)
TARGET_RESULTS = 10  # Stop early once we have this many matches
PAGE_SIZE = 20  # Properties per page


class StreetSearchService:
    """
    Service for street-only property searches.
    
    Handles the complexity of:
    - Validating street + city are present
    - Querying Repliers with broad city filter
    - Client-side filtering by exact street match
    - Progressive fetching across multiple pages
    - Early stopping when TARGET_RESULTS reached
    """
    
    def __init__(self, listings_service=None):
        """
        Initialize street search service.
        
        Args:
            listings_service: Repliers listings service instance
        """
        self.listings_service = listings_service
        logger.info("StreetSearchService initialized")
    
    def search_properties_by_street(
        self,
        street_name: str,
        city: str,
        property_type: Optional[str] = None,
        min_bedrooms: Optional[int] = None,
        max_price: Optional[int] = None,
        listing_type: str = 'sale'
    ) -> Dict[str, Any]:
        """
        Search for properties on a specific street.
        
        IMPORTANT: This method handles the Repliers API limitation by:
        1. Validating city is present (required)
        2. Querying Repliers with ONLY city + property type
        3. Filtering results CLIENT-SIDE by street name
        4. Progressively fetching pages until TARGET_RESULTS found
        
        Args:
            street_name: Street to search (e.g., "Yonge Street", "King St W")
            city: City to search in (REQUIRED - e.g., "Toronto")
            property_type: Optional property type filter
            min_bedrooms: Optional minimum bedrooms
            max_price: Optional maximum price
            listing_type: 'sale' or 'rent'
            
        Returns:
            Dictionary with:
                - success: bool
                - properties: List of matched properties
                - total_matched: Number of matches found
                - total_fetched: Total properties fetched from API
                - pages_fetched: Number of pages queried
                - normalized_street: Normalized street name used
                - error: Error message if validation failed
        """
        # STEP 1: Validate parameters
        is_valid, error_msg = validate_street_search_params(street_name, city)
        if not is_valid:
            logger.warning(f"⚠️ [STREET SEARCH] Validation failed: {error_msg}")
            return {
                'success': False,
                'error': error_msg,
                'properties': [],
                'total_matched': 0,
                'total_fetched': 0,
                'pages_fetched': 0
            }
        
        # STEP 2: Normalize street name for matching
        normalized_street = normalize_street_name(street_name)
        log_street_search(street_name, city, normalized_street)
        
        # STEP 3: Import listings service if not provided
        if not self.listings_service:
            from services.listings_service import listings_service
            self.listings_service = listings_service
        
        # STEP 4: Progressive fetching with client-side filtering
        matched_properties = []
        total_fetched = 0
        pages_fetched = 0
        
        for page in range(1, MAX_PAGES + 1):
            logger.info(f"📄 [STREET SEARCH] Fetching page {page}/{MAX_PAGES}")
            
            # Query Repliers with ONLY supported filters (NO streetName)
            try:
                api_params = {
                    'city': city,
                    'status': 'A',  # Active listings only
                    'page': page,
                    'page_size': PAGE_SIZE
                }
                
                # Add optional filters
                if property_type:
                    # Map to Repliers property type
                    type_mapping = {
                        'condo': 'condo',
                        'house': 'detached',
                        'townhouse': 'townhouse',
                        'apartment': 'condo',
                        'detached': 'detached',
                        'semi-detached': 'semi-detached'
                    }
                    mapped_type = type_mapping.get(property_type.lower(), property_type.lower())
                    api_params['property_style'] = mapped_type
                
                if min_bedrooms:
                    api_params['min_bedrooms'] = min_bedrooms
                
                if max_price:
                    api_params['max_price'] = max_price
                
                # Call Repliers API
                logger.debug(f"🔍 [STREET SEARCH] API params: {api_params}")
                result = self.listings_service.search_listings(**api_params)
                
                # Extract listings
                page_listings = result.get('listings', result.get('results', []))
                pages_fetched += 1
                total_fetched += len(page_listings)
                
                logger.info(f"📥 [STREET SEARCH] Page {page}: {len(page_listings)} properties fetched")
                
                # STEP 5: Client-side filtering by street name
                for listing in page_listings:
                    # Extract street name from listing
                    listing_street = self._extract_street_from_listing(listing)
                    
                    if not listing_street:
                        logger.debug(f"⚠️ [STREET SEARCH] Listing has no street: {listing.get('mlsNumber', 'unknown')}")
                        continue
                    
                    # Check if streets match (PREFIX matching with word boundary)
                    # This allows "yonge" to match "yonge street", "yonge st", etc.
                    # But prevents "king" from matching "kingston"
                    normalized_listing = normalize_street_name(listing_street)
                    normalized_user = normalize_street_name(street_name)
                    
                    if normalized_listing and normalized_user:
                        # Match if:
                        # 1. Exact match: "yonge" == "yonge"
                        # 2. Prefix with space: "yonge west" starts with "yonge "
                        # This prevents "king" from matching "kingston"
                        is_match = (
                            normalized_listing == normalized_user or
                            normalized_listing.startswith(normalized_user + ' ')
                        )
                        
                        if is_match:
                            matched_properties.append(listing)
                            log_street_match(street_name, listing_street, True)
                        else:
                            log_street_match(street_name, listing_street, False)
                
                logger.info(
                    f"✅ [STREET SEARCH] Page {page}: "
                    f"{len(matched_properties)} total matches so far"
                )
                
                # STEP 6: Early stopping if we have enough results
                if len(matched_properties) >= TARGET_RESULTS:
                    logger.info(
                        f"🎯 [STREET SEARCH] TARGET_RESULTS ({TARGET_RESULTS}) reached, stopping early"
                    )
                    break
                
                # STEP 7: Stop if no more pages available
                total_available = result.get('count', result.get('total', 0))
                if total_fetched >= total_available:
                    logger.info(
                        f"📄 [STREET SEARCH] No more pages available "
                        f"(fetched {total_fetched}/{total_available})"
                    )
                    break
            
            except Exception as e:
                logger.error(f"❌ [STREET SEARCH] API error on page {page}: {e}")
                break
        
        # STEP 8: Log final statistics
        log_street_filter_stats(total_fetched, len(matched_properties), pages_fetched)
        
        # STEP 9: Return results
        return {
            'success': True,
            'properties': matched_properties[:TARGET_RESULTS],  # Limit to target
            'total_matched': len(matched_properties),
            'total_fetched': total_fetched,
            'pages_fetched': pages_fetched,
            'normalized_street': normalized_street,
            'target_street': street_name,
            'city': city
        }
    
    def _extract_street_from_listing(self, listing: Dict) -> Optional[str]:
        """
        Extract street name from MLS listing.
        
        Handles multiple possible formats:
        - listing['address']['streetName']
        - listing['address']['streetName'] + listing['address']['streetSuffix']
        - listing['full_address'] parsed
        
        Args:
            listing: Property listing dict from Repliers
            
        Returns:
            Street name or None if not found
        """
        try:
            # Try structured address first
            address = listing.get('address', {})
            if isinstance(address, dict):
                street_name = address.get('streetName', '')
                street_suffix = address.get('streetSuffix', '')
                street_direction = address.get('streetDirection', '')
                
                # Build full street name
                parts = [p for p in [street_name, street_suffix, street_direction] if p]
                if parts:
                    return ' '.join(parts)
            
            # Try full_address field
            full_address = listing.get('full_address') or listing.get('address')
            if isinstance(full_address, str):
                from services.street_utils import extract_street_from_address
                return extract_street_from_address(full_address)
            
            return None
            
        except Exception as e:
            logger.warning(f"⚠️ [STREET SEARCH] Error extracting street: {e}")
            return None


# ==================== GLOBAL INSTANCE ====================

# Create singleton instance for easy import
street_search_service = StreetSearchService()
