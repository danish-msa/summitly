"""
Postal Code Fallback Service
============================
Implements 3-tier fallback strategy for Canadian postal code searches.

Strategy:
1. EXACT search: Full postal code with pageSize=20
2. PAGESIZE RETRY: Same postal code with pageSize=100
3. FSA FALLBACK: First 3 characters (FSA) with pageSize=50

User transparency is MANDATORY - users must be informed when searches are expanded.

Author: Summitly Team
Date: December 18, 2025
"""

import logging
from typing import Dict, Any, Optional, List
from services.conversation_state import ConversationState

logger = logging.getLogger(__name__)


class PostalCodeFallbackService:
    """
    Service for handling postal code searches with intelligent fallback.
    """
    
    def __init__(self, listings_service=None):
        """
        Initialize postal code fallback service.
        
        Args:
            listings_service: Repliers listings service instance
        """
        self.listings_service = listings_service
        logger.info("PostalCodeFallbackService initialized")
    
    def search_with_fallback(
        self,
        state: ConversationState,
        user_message: str = ""
    ) -> Dict[str, Any]:
        """
        Execute postal code search with 3-tier fallback strategy.
        
        Args:
            state: ConversationState with postal code
            user_message: Original user message
            
        Returns:
            Dictionary with:
                - success: bool
                - properties: List of properties
                - total: Total count
                - fallback_type: 'exact' | 'pagesize_retry' | 'fsa_fallback' | None
                - fallback_message: User-facing message about search expansion
                - postal_code_used: Actual postal code searched (may be FSA)
        """
        if not state.location_state or not state.location_state.postalCode:
            return {
                'success': False,
                'error': 'No postal code in state',
                'properties': [],
                'total': 0,
                'fallback_type': None,
                'fallback_message': None
            }
        
        postal_code = state.location_state.postalCode
        is_fsa = len(postal_code.replace(' ', '')) == 3
        
        logger.info(f"📮 [POSTAL SEARCH] Starting search for postal code: {postal_code} (FSA: {is_fsa})")
        
        # Import listings service if not provided
        if not self.listings_service:
            from services.listings_service import listings_service
            self.listings_service = listings_service
        
        # If user directly searched FSA (3 characters), skip straight to FSA search
        if is_fsa:
            logger.info(f"📮 [POSTAL SEARCH] Direct FSA search (3 characters)")
            return self._search_fsa_direct(state, postal_code, user_message)
        
        # TIER 1: Exact postal code search with pageSize=20
        logger.info(f"📮 [POSTAL SEARCH] Tier 1: Exact search (pageSize=20)")
        tier1_results = self._search_exact(state, postal_code, page_size=20, user_message=user_message)
        
        if tier1_results['properties']:
            logger.info(f"✅ [POSTAL SEARCH] Tier 1 SUCCESS: Found {len(tier1_results['properties'])} properties")
            tier1_results['fallback_type'] = 'exact'
            tier1_results['fallback_message'] = None  # No fallback needed
            tier1_results['postal_code_used'] = postal_code
            return tier1_results
        
        logger.info(f"📮 [POSTAL FALLBACK] Tier 1 returned 0 results, proceeding to Tier 2")
        
        # TIER 2: Retry with pageSize=100
        logger.info(f"📮 [POSTAL FALLBACK] Tier 2: PageSize retry (pageSize=100)")
        tier2_results = self._search_exact(state, postal_code, page_size=100, user_message=user_message)
        
        if tier2_results['properties']:
            logger.info(f"✅ [POSTAL FALLBACK] Tier 2 SUCCESS: Found {len(tier2_results['properties'])} properties")
            tier2_results['fallback_type'] = 'pagesize_retry'
            tier2_results['fallback_message'] = "I expanded the search slightly to make sure we don't miss any listings."
            tier2_results['postal_code_used'] = postal_code
            return tier2_results
        
        logger.info(f"📮 [POSTAL FALLBACK] Tier 2 returned 0 results, proceeding to Tier 3")
        
        # TIER 3: FSA fallback (first 3 characters)
        fsa = postal_code[:3].upper()
        logger.info(f"📮 [POSTAL FALLBACK] Tier 3: FSA fallback (postalCode={fsa}, pageSize=50)")
        
        tier3_results = self._search_fsa_fallback(state, fsa, user_message)
        
        if tier3_results['properties']:
            logger.info(f"✅ [POSTAL FALLBACK] Tier 3 SUCCESS: Found {len(tier3_results['properties'])} properties in FSA {fsa}")
            tier3_results['fallback_type'] = 'fsa_fallback'
            tier3_results['fallback_message'] = (
                f"There are no active listings in this exact postal code, "
                f"so I expanded the search to the broader {fsa} area."
            )
            tier3_results['postal_code_used'] = fsa
            return tier3_results
        
        # All tiers failed
        logger.warning(f"❌ [POSTAL FALLBACK] All 3 tiers returned 0 results for {postal_code}")
        return {
            'success': True,
            'properties': [],
            'total': 0,
            'fallback_type': 'fsa_fallback_empty',
            'fallback_message': (
                f"There are no active listings in postal code {postal_code} "
                f"or the broader {fsa} area at this time."
            ),
            'postal_code_used': fsa
        }
    
    def _search_exact(
        self,
        state: ConversationState,
        postal_code: str,
        page_size: int,
        user_message: str = ""
    ) -> Dict[str, Any]:
        """
        Execute exact postal code search with specified page size.
        
        Args:
            state: ConversationState
            postal_code: Full postal code (6 characters)
            page_size: Page size for query (20 or 100)
            user_message: Original user message
            
        Returns:
            Dictionary with properties and total count
        """
        from services.repliers_filter_mapper import buildRepliersSearchParams
        
        # Build query parameters
        query_params = buildRepliersSearchParams(state, user_message, limit=page_size)
        
        # Override postal code and page size
        query_params['postal_code'] = postal_code
        query_params['page_size'] = page_size
        
        logger.debug(f"Query params: {query_params}")
        
        try:
            # Execute search
            results = self.listings_service.search_listings(**query_params)
            
            # Extract properties
            properties = results.get('listings', results.get('results', []))
            total = results.get('count', results.get('total', len(properties)))
            
            # Deduplicate (just in case)
            properties = self._deduplicate_properties(properties)
            
            # Post-filter to ensure postal code match and listing type
            listing_type = state.listing_type if state else None
            properties = self._post_filter_postal(properties, postal_code, listing_type)
            
            return {
                'success': True,
                'properties': properties,
                'total': len(properties)
            }
        
        except Exception as e:
            logger.error(f"❌ [POSTAL SEARCH] Error: {e}")
            return {
                'success': False,
                'error': str(e),
                'properties': [],
                'total': 0
            }
    
    def _search_fsa_fallback(
        self,
        state: ConversationState,
        fsa: str,
        user_message: str = ""
    ) -> Dict[str, Any]:
        """
        Execute FSA fallback search with pageSize=200.
        Increased from 50 to 200 to capture more properties in large FSA areas (e.g., M5V downtown Toronto).
        
        Args:
            state: ConversationState
            fsa: FSA code (3 characters)
            user_message: Original user message
            
        Returns:
            Dictionary with properties and total count
        """
        from services.repliers_filter_mapper import buildRepliersSearchParams
        
        # Build query parameters with larger page size for FSA searches
        query_params = buildRepliersSearchParams(state, user_message, limit=200)
        
        # Override postal code with FSA
        query_params['postal_code'] = fsa
        query_params['page_size'] = 200
        
        logger.debug(f"FSA fallback query params: {query_params}")
        
        try:
            # SMART PAGINATION: FSA searches fetch ALL pages (no limit)
            # Repliers API caps at 100 per page, so keep fetching until we get all results
            all_properties = []
            page = 1
            max_pages = 20  # Safety limit to prevent infinite loops (20 pages = 2000 properties max)
            
            logger.info(f"📮 [POSTAL SEARCH] Starting pagination for FSA {fsa} (will fetch ALL available pages)")
            
            while page <= max_pages:
                query_params['page'] = page
                logger.info(f"📮 [POSTAL SEARCH] Fetching page {page} for FSA {fsa}")
                
                # Execute search for this page
                results = self.listings_service.search_listings(**query_params)
                
                # Extract properties from this page
                page_properties = results.get('listings', results.get('results', []))
                
                if not page_properties or len(page_properties) == 0:
                    logger.info(f"📮 [POSTAL SEARCH] Page {page} returned 0 results, stopping pagination")
                    break
                
                all_properties.extend(page_properties)
                logger.info(f"📮 [POSTAL SEARCH] Page {page} returned {len(page_properties)} properties (total so far: {len(all_properties)})")
                
                # If we got fewer than 100 properties, this is the last page
                if len(page_properties) < 100:
                    logger.info(f"📮 [POSTAL SEARCH] Last page reached (got {len(page_properties)} < 100 properties)")
                    break
                
                page += 1
            
            logger.info(f"📮 [POSTAL SEARCH] Fetched {len(all_properties)} properties across {page} page(s)")
            
            # Deduplicate properties by MLS number BEFORE post-filtering
            # API sometimes returns duplicates across pages
            all_properties = self._deduplicate_properties(all_properties)
            logger.info(f"📮 [POSTAL SEARCH] After deduplication: {len(all_properties)} unique properties")
            
            # Post-filter to ensure FSA match and listing type
            listing_type = state.listing_type if state else None
            filtered_properties = self._post_filter_postal(all_properties, fsa, listing_type)
            
            return {
                'success': True,
                'properties': filtered_properties,
                'total': len(filtered_properties)
            }
        
        except Exception as e:
            logger.error(f"❌ [POSTAL FALLBACK] FSA search error: {e}")
            return {
                'success': False,
                'error': str(e),
                'properties': [],
                'total': 0
            }
    
    def _search_fsa_direct(
        self,
        state: ConversationState,
        fsa: str,
        user_message: str = ""
    ) -> Dict[str, Any]:
        """
        Execute direct FSA search (when user searches for 3-character FSA).
        
        Args:
            state: ConversationState
            fsa: FSA code (3 characters)
            user_message: Original user message
            
        Returns:
            Dictionary with properties and total count
        """
        result = self._search_fsa_fallback(state, fsa, user_message)
        
        # No fallback message for direct FSA search
        result['fallback_type'] = 'fsa_direct'
        result['fallback_message'] = None
        result['postal_code_used'] = fsa
        
        return result
    
    def _deduplicate_properties(
        self,
        properties: List[Dict[str, Any]]
    ) -> List[Dict[str, Any]]:
        """
        Deduplicate properties by MLS number.
        API sometimes returns duplicate properties across pages.
        
        Args:
            properties: List of properties (may contain duplicates)
            
        Returns:
            List of unique properties
        """
        if not properties:
            return []
        
        seen_mls = set()
        unique_properties = []
        duplicates_count = 0
        
        for prop in properties:
            mls_number = None
            
            # Extract MLS number
            if isinstance(prop, dict):
                mls_number = prop.get('mlsNumber') or prop.get('mls_number') or prop.get('id')
            else:
                # Object with attributes
                mls_number = getattr(prop, 'mlsNumber', None) or getattr(prop, 'mls_number', None) or getattr(prop, 'id', None)
            
            if mls_number:
                if mls_number not in seen_mls:
                    seen_mls.add(mls_number)
                    unique_properties.append(prop)
                else:
                    duplicates_count += 1
            else:
                # No MLS number, keep it anyway (shouldn't happen)
                unique_properties.append(prop)
        
        if duplicates_count > 0:
            logger.info(f"🔄 [DEDUPLICATION] Removed {duplicates_count} duplicate properties")
        
        return unique_properties
    
    def _post_filter_postal(
        self,
        properties: List[Dict[str, Any]],
        postal_code: str,
        listing_type: Optional[str] = None
    ) -> List[Dict[str, Any]]:
        """
        Post-filter properties to ensure postal code match and listing type.
        This is critical because the Repliers API doesn't properly filter by postal code or transactionType.
        
        Args:
            properties: List of properties from API
            postal_code: Postal code to match (can be FSA or full)
            listing_type: 'sale' or 'rent' to filter by (optional)
            
        Returns:
            Filtered list of properties matching postal code prefix and listing type
        """
        if not properties:
            return []
        
        def normalize_postal(pc):
            """Normalize postal code for comparison."""
            if not pc:
                return ""
            return pc.replace(' ', '').replace('-', '').upper()
        
        def get_listing_type(prop):
            """Extract listing type from property."""
            if isinstance(prop, dict):
                # Check class field (common in Repliers API)
                prop_class = prop.get('class', '').lower()
                if prop_class in ['rental', 'lease']:
                    return 'rent'
                elif prop_class in ['residential', 'commercialProperty', 'sale']:
                    return 'sale'
                
                # Check listPrice vs soldPrice
                list_price = prop.get('listPrice')
                sold_price = prop.get('soldPrice')
                
                # If price is very low (< $10k), likely rental
                if list_price and list_price < 10000:
                    return 'rent'
                elif list_price and list_price >= 10000:
                    return 'sale'
            
            return None
        
        normalized_search = normalize_postal(postal_code)
        original_count = len(properties)
        
        filtered = []
        no_postal_count = 0
        mismatch_count = 0
        type_filter_count = 0
        
        for prop in properties:
            prop_postal = None
            
            # Try different postal code field names
            if isinstance(prop, dict):
                address = prop.get('address', {})
                prop_postal = address.get('zip') or address.get('postalCode') or address.get('postal_code')
            else:
                # Object with attributes
                if hasattr(prop, 'address'):
                    prop_postal = getattr(prop.address, 'zip', None) or getattr(prop.address, 'postalCode', None)
            
            if prop_postal:
                normalized_prop = normalize_postal(prop_postal)
                
                # Match by prefix (FSA match for FSA search, full match for full postal search)
                if normalized_prop.startswith(normalized_search):
                    # Also filter by listing type if specified
                    if listing_type:
                        prop_type = get_listing_type(prop)
                        if prop_type and prop_type != listing_type:
                            type_filter_count += 1
                            continue  # Skip properties that don't match listing type
                    
                    filtered.append(prop)
                else:
                    mismatch_count += 1
            else:
                no_postal_count += 1
        
        filtered_count = len(filtered)
        
        if filtered_count != original_count or listing_type is None:
            if listing_type is None:
                logger.info(f"📮 [POST-FILTER] Filtered: {original_count} → {filtered_count} properties for postal code {postal_code} (listing_type=None, showing BOTH sale AND rent)")
            else:
                logger.info(f"📮 [POST-FILTER] Filtered: {original_count} → {filtered_count} properties for postal code {postal_code} (listing_type={listing_type} explicitly requested)")
            
            if original_count - filtered_count > 10:
                logger.info(f"📮 [POST-FILTER DEBUG] Removed: {no_postal_count} no postal, {mismatch_count} postal mismatch, {type_filter_count} wrong listing type")
        
        return filtered


# Singleton instance
postal_code_fallback_service = PostalCodeFallbackService()
