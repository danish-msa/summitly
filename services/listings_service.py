"""
Listings Service - Property Search and Details
Handles all listing-related API operations including search, details, and similar properties
"""
import logging
from typing import Dict, Any, List, Optional
from datetime import datetime

from services.repliers_client import client, RepliersAPIError
from services.repliers_config import config

logger = logging.getLogger(__name__)


class ListingsService:
    """Service for managing property listings operations"""
    
    def __init__(self, api_client=None):
        """
        Initialize listings service
        
        Args:
            api_client: Optional RepliersClient instance (uses default if not provided)
        """
        self.client = api_client or client
    
    def search_listings(
        self,
        # Location filters
        city: Optional[str] = None,
        neighborhood: Optional[str] = None,
        postal_code: Optional[str] = None,
        street_name: Optional[str] = None,  # NEW: Street address search
        street_number: Optional[str] = None,  # NEW: Street number search
        latitude: Optional[float] = None,
        longitude: Optional[float] = None,
        radius_km: Optional[float] = None,
        
        # Property filters
        min_price: Optional[float] = None,
        max_price: Optional[float] = None,
        property_type: Optional[str] = None,
        property_style: Optional[str] = None,
        min_bedrooms: Optional[int] = None,
        max_bedrooms: Optional[int] = None,
        min_bathrooms: Optional[float] = None,
        max_bathrooms: Optional[float] = None,
        min_sqft: Optional[int] = None,
        max_sqft: Optional[int] = None,
        
        # Status filters
        status: Optional[str] = None,  # active, sold, leased
        transaction_type: Optional[str] = None,  # sale, lease
        
        # Feature filters
        keywords: Optional[List[str]] = None,
        has_pool: Optional[bool] = None,
        has_garage: Optional[bool] = None,
        parking_spots: Optional[int] = None,
        
        # Date filters
        listed_after: Optional[str] = None,  # ISO date format
        listed_before: Optional[str] = None,
        open_house_date: Optional[str] = None,
        
        # Pagination
        page: int = 1,
        page_size: int = 25,
        
        # Sorting
        sort_by: Optional[str] = None,  # price_asc, price_desc, date_asc, date_desc
        
    ) -> Dict[str, Any]:
        """
        Search for property listings with comprehensive filters
        
        Args:
            city: City name (e.g., "Toronto")
            neighborhood: Neighborhood name
            postal_code: Postal code or ZIP code
            latitude: Latitude for coordinate-based search
            longitude: Longitude for coordinate-based search
            radius_km: Search radius in kilometers (when using coordinates)
            min_price: Minimum price
            max_price: Maximum price
            property_type: Type of property (e.g., "residential", "commercial")
            property_style: Style of property (e.g., "condo", "detached", "townhouse")
            min_bedrooms: Minimum number of bedrooms
            max_bedrooms: Maximum number of bedrooms
            min_bathrooms: Minimum number of bathrooms
            max_bathrooms: Maximum number of bathrooms
            min_sqft: Minimum square footage
            max_sqft: Maximum square footage
            status: Listing status
            keywords: List of keywords to search for
            has_pool: Filter for properties with pool
            has_garage: Filter for properties with garage
            parking_spots: Minimum parking spots
            listed_after: Only show listings after this date
            listed_before: Only show listings before this date
            open_house_date: Filter by open house date
            page: Page number for pagination
            page_size: Results per page
            sort_by: Sort order
            
        Returns:
            Dictionary containing search results and metadata
        """
        # Build query parameters
        params = {}
        
        # Location parameters
        if city:
            params['city'] = city
        if neighborhood:
            params['neighborhood'] = neighborhood
        if postal_code:
            params['postalCode'] = postal_code
        if street_name:
            params['streetName'] = street_name
        if street_number:
            params['streetNumber'] = street_number
        if latitude is not None and longitude is not None:
            params['latitude'] = latitude
            params['longitude'] = longitude
            if radius_km:
                params['radius'] = radius_km
        
        # Property parameters
        if min_price is not None:
            params['minPrice'] = min_price
        if max_price is not None:
            params['maxPrice'] = max_price
        if property_type:
            params['propertyType'] = property_type
        if property_style:
            params['propertyStyle'] = property_style
        if min_bedrooms is not None:
            params['minBedrooms'] = min_bedrooms
        if max_bedrooms is not None:
            params['maxBedrooms'] = max_bedrooms
        if min_bathrooms is not None:
            params['minBathrooms'] = min_bathrooms
        if max_bathrooms is not None:
            params['maxBathrooms'] = max_bathrooms
        if min_sqft is not None:
            params['minSqft'] = min_sqft
        if max_sqft is not None:
            params['maxSqft'] = max_sqft
        
        # Status - API expects 'A' (Active) or 'U' (Under Contract)
        if status:
            status_mapping = {
                'active': 'A',
                'sold': 'S',
                'leased': 'L',
                'under_contract': 'U',
                'A': 'A',
                'U': 'U',
                'S': 'S',
                'L': 'L'
            }
            params['status'] = status_mapping.get(status.lower(), status)
        
        # Transaction type - Use 'type' parameter for Sale vs Lease
        if transaction_type:
            transaction_mapping = {
                'sale': 'sale',
                'lease': 'lease',
                'rent': 'lease',
                'buy': 'sale',
            }
            params['type'] = transaction_mapping.get(transaction_type.lower(), transaction_type.lower())
        
        # Features
        if keywords:
            params['keywords'] = ','.join(keywords)
        if has_pool is not None:
            params['hasPool'] = str(has_pool).lower()
        if has_garage is not None:
            params['hasGarage'] = str(has_garage).lower()
        if parking_spots is not None:
            params['parkingSpots'] = parking_spots
        
        # Date filters
        # ✅ FIX: Use correct Repliers API parameter names (minListDate/maxListDate, not listedAfter/listedBefore)
        if listed_after:
            params['minListDate'] = listed_after  # Format: YYYY-MM-DD
        if listed_before:
            params['maxListDate'] = listed_before  # Format: YYYY-MM-DD
        if open_house_date:
            params['openHouseDate'] = open_house_date
        
        # Pagination
        params['page'] = page
        params['pageSize'] = min(page_size, config.MAX_PAGE_SIZE)
        
        # Sorting
        if sort_by:
            params['sortBy'] = sort_by
        
        try:
            logger.info(f"Searching listings with {len(params)} filters")
            response = self.client.get(
                config.get_endpoint('listings'),
                params=params
            )
            
            return response
        
        except RepliersAPIError as e:
            logger.error(f"Error searching listings: {e.message}")
            raise
    
    def get_listing_details(
        self,
        listing_id: Optional[str] = None,
        mls_number: Optional[str] = None,
        include_address_history: bool = False
    ) -> Dict[str, Any]:
        """
        Get detailed information for a specific property
        
        Args:
            listing_id: Repliers listing ID
            mls_number: MLS number (alternative to listing_id)
            include_address_history: Include historical listing data for this address
            
        Returns:
            Dictionary containing detailed property information
        """
        if not listing_id and not mls_number:
            raise ValueError("Either listing_id or mls_number must be provided")
        
        params = {}
        if mls_number:
            params['mlsNumber'] = mls_number
        if include_address_history:
            params['includeAddressHistory'] = 'true'
        
        try:
            endpoint = config.get_endpoint('listing_detail', id=listing_id or mls_number)
            logger.info(f"Fetching details for listing: {listing_id or mls_number}")
            
            response = self.client.get(endpoint, params=params)
            return response
        
        except RepliersAPIError as e:
            logger.error(f"Error fetching listing details: {e.message}")
            raise
    
    def find_similar_listings(
        self,
        listing_id: str,
        limit: int = 10,
        max_price_difference_percent: Optional[float] = None,
        max_distance_km: Optional[float] = None
    ) -> Dict[str, Any]:
        """
        Find similar properties based on a reference listing
        
        Args:
            listing_id: Reference listing ID
            limit: Maximum number of similar listings to return
            max_price_difference_percent: Maximum price difference (e.g., 20 for 20%)
            max_distance_km: Maximum distance from reference property
            
        Returns:
            Dictionary containing similar listings
        """
        params = {
            'limit': limit
        }
        
        if max_price_difference_percent is not None:
            params['maxPriceDiff'] = max_price_difference_percent
        if max_distance_km is not None:
            params['maxDistance'] = max_distance_km
        
        try:
            endpoint = config.get_endpoint('similar', id=listing_id)
            logger.info(f"Finding similar listings for: {listing_id}")
            
            response = self.client.get(endpoint, params=params)
            return response
        
        except RepliersAPIError as e:
            logger.error(f"Error finding similar listings: {e.message}")
            raise
    
    def get_address_history(
        self,
        address: str,
        city: Optional[str] = None,
        state: Optional[str] = None,
        postal_code: Optional[str] = None
    ) -> Dict[str, Any]:
        """
        Get historical listing activity for a specific address
        
        Args:
            address: Street address
            city: City name
            state: State/province
            postal_code: Postal code
            
        Returns:
            Dictionary containing address history
        """
        params = {
            'address': address
        }
        
        if city:
            params['city'] = city
        if state:
            params['state'] = state
        if postal_code:
            params['postalCode'] = postal_code
        
        try:
            logger.info(f"Fetching address history for: {address}")
            response = self.client.get(
                config.get_endpoint('address_history'),
                params=params
            )
            return response
        
        except RepliersAPIError as e:
            logger.error(f"Error fetching address history: {e.message}")
            raise
    
    def get_property_types(self, market: Optional[str] = None) -> List[Dict[str, Any]]:
        """
        Get available property types for a market
        
        Args:
            market: Market identifier (e.g., "toronto", "vancouver")
            
        Returns:
            List of property types
        """
        params = {}
        if market:
            params['market'] = market
        
        try:
            logger.info("Fetching property types")
            response = self.client.get(
                config.get_endpoint('property_types'),
                params=params
            )
            return response.get('propertyTypes', [])
        
        except RepliersAPIError as e:
            logger.error(f"Error fetching property types: {e.message}")
            raise
    
    def get_property_styles(self, market: Optional[str] = None) -> List[Dict[str, Any]]:
        """
        Get available property styles for a market
        
        Args:
            market: Market identifier
            
        Returns:
            List of property styles
        """
        params = {}
        if market:
            params['market'] = market
        
        try:
            logger.info("Fetching property styles")
            response = self.client.get(
                config.get_endpoint('property_styles'),
                params=params
            )
            return response.get('propertyStyles', [])
        
        except RepliersAPIError as e:
            logger.error(f"Error fetching property styles: {e.message}")
            raise


# Create default service instance
listings_service = ListingsService()


if __name__ == '__main__':
    # Test listings service
    print("🏠 Testing Listings Service...\n")
    
    service = ListingsService()
    
    # Test 1: Search listings in Toronto
    print("1️⃣  Searching for condos in Toronto under $700k...")
    try:
        results = service.search_listings(
            city="Toronto",
            property_style="condo",
            max_price=700000,
            min_bedrooms=2,
            status="active",
            page_size=5
        )
        print(f"   ✅ Found {results.get('total', 0)} listings")
        print(f"   📄 Showing {len(results.get('listings', []))} results\n")
    except Exception as e:
        print(f"   ❌ Error: {str(e)}\n")
    
    # Test 2: Get property types
    print("2️⃣  Fetching property types...")
    try:
        types = service.get_property_types()
        print(f"   ✅ Found {len(types)} property types")
        if types:
            print(f"   Examples: {', '.join([t.get('name', 'N/A') for t in types[:3]])}\n")
    except Exception as e:
        print(f"   ❌ Error: {str(e)}\n")
