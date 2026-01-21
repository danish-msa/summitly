"""
Residential Property Search Service
====================================
Comprehensive service for searching residential properties through Repliers API.
This service provides:
- Universal search capabilities (any filter combination, any location)
- Natural language query parsing
- Filter normalization and validation
- Pagination support for unlimited results
- Integration with the chatbot pipeline

Author: Summitly Team
Date: January 10, 2026
"""

import logging
import os
from typing import Dict, Any, List, Optional, Union
from datetime import datetime

from services.residential_filter_mapper import (
    ResidentialFilters,
    ResidentialFilterExtractor,
    build_residential_api_params,
    build_residential_search_params,
    get_filter_extractor,
    RESIDENTIAL_PROPERTY_TYPE_MAPPING,
)
from services.repliers_client import client, RepliersAPIError
from services.repliers_config import config

logger = logging.getLogger(__name__)


class ResidentialPropertySearchService:
    """
    Service for searching residential properties with comprehensive filter support.
    
    Features:
    - Support for all MLS form filters
    - Natural language query parsing
    - Universal search (any location, any filter combination)
    - Pagination for large result sets
    - Result transformation and formatting
    """
    
    def __init__(self, api_client=None):
        """
        Initialize the residential property search service.
        
        Args:
            api_client: Optional RepliersClient instance
        """
        self.client = api_client or client
        self.filter_extractor = get_filter_extractor()
        logger.info("ResidentialPropertySearchService initialized")
    
    def search(
        self,
        filters: Optional[ResidentialFilters] = None,
        natural_language_query: Optional[str] = None,
        **kwargs
    ) -> Dict[str, Any]:
        """
        Search for residential properties.
        
        Args:
            filters: ResidentialFilters object with search criteria
            natural_language_query: Natural language search query
            **kwargs: Additional filter parameters (city, property_type, etc.)
            
        Returns:
            Dictionary containing:
            - success: bool
            - listings: List of property listings
            - count: Total count
            - page: Current page
            - total_pages: Total pages available
            - filters_applied: Dict of applied filters
            - message: Status message
        """
        try:
            # Build filters from various sources
            if natural_language_query and not filters:
                filters = self.filter_extractor.extract_all(natural_language_query)
                logger.info(f"Extracted filters from query: {natural_language_query}")
            
            if not filters:
                filters = ResidentialFilters()
            
            # Apply kwargs to filters
            for key, value in kwargs.items():
                if hasattr(filters, key) and value is not None:
                    setattr(filters, key, value)
            
            # Validate and normalize filters
            filters = self._normalize_filters(filters)
            
            # Convert to API parameters
            params = build_residential_api_params(filters)
            
            logger.info(f"Searching residential properties with params: {params}")
            
            # Make API request
            response = self.client.get(
                config.get_endpoint('listings'),
                params=params
            )
            
            # Process response
            listings = response.get('listings', [])
            count = response.get('count', len(listings))
            page = response.get('page', 1)
            total_pages = response.get('numPages', 1)
            
            # Transform listings to standardized format
            transformed_listings = [
                self._transform_listing(listing) for listing in listings
            ]
            
            return {
                'success': True,
                'listings': transformed_listings,
                'count': count,
                'page': page,
                'total_pages': total_pages,
                'page_size': filters.page_size,
                'filters_applied': self._get_applied_filters_summary(filters),
                'message': f"Found {count} residential properties"
            }
            
        except RepliersAPIError as e:
            logger.error(f"Repliers API error: {e.message}")
            return {
                'success': False,
                'listings': [],
                'count': 0,
                'error': e.message,
                'message': f"API error: {e.message}"
            }
        except Exception as e:
            logger.error(f"Search error: {str(e)}")
            return {
                'success': False,
                'listings': [],
                'count': 0,
                'error': str(e),
                'message': f"Search error: {str(e)}"
            }
    
    def search_all_pages(
        self,
        filters: Optional[ResidentialFilters] = None,
        max_results: int = 500,
        **kwargs
    ) -> Dict[str, Any]:
        """
        Search and fetch all results across multiple pages.
        
        Args:
            filters: ResidentialFilters object
            max_results: Maximum total results to fetch
            **kwargs: Additional filter parameters
            
        Returns:
            Dictionary with all listings
        """
        if not filters:
            filters = ResidentialFilters()
        
        # Apply kwargs
        for key, value in kwargs.items():
            if hasattr(filters, key) and value is not None:
                setattr(filters, key, value)
        
        all_listings = []
        page = 1
        filters.page_size = 100  # Use larger page size for efficiency
        
        while len(all_listings) < max_results:
            filters.page = page
            result = self.search(filters=filters)
            
            if not result['success'] or not result['listings']:
                break
            
            all_listings.extend(result['listings'])
            
            if page >= result.get('total_pages', 1):
                break
            
            page += 1
        
        # Trim to max_results
        all_listings = all_listings[:max_results]
        
        return {
            'success': True,
            'listings': all_listings,
            'count': len(all_listings),
            'total_fetched': len(all_listings),
            'message': f"Fetched {len(all_listings)} residential properties"
        }
    
    def search_by_location(
        self,
        city: Optional[str] = None,
        neighborhood: Optional[str] = None,
        postal_code: Optional[str] = None,
        latitude: Optional[float] = None,
        longitude: Optional[float] = None,
        radius_km: float = 5.0,
        **filters
    ) -> Dict[str, Any]:
        """
        Search properties by location.
        
        Args:
            city: City name
            neighborhood: Neighborhood name
            postal_code: Postal code (FSA or full)
            latitude: Latitude for geo search
            longitude: Longitude for geo search
            radius_km: Search radius in km (for geo search)
            **filters: Additional filter parameters
            
        Returns:
            Search results
        """
        search_filters = ResidentialFilters(
            city=city,
            neighborhood=neighborhood,
            postal_code=postal_code,
            latitude=latitude,
            longitude=longitude,
            radius_km=radius_km if (latitude and longitude) else None,
        )
        
        return self.search(filters=search_filters, **filters)
    
    def search_by_price(
        self,
        min_price: Optional[float] = None,
        max_price: Optional[float] = None,
        city: Optional[str] = None,
        **filters
    ) -> Dict[str, Any]:
        """
        Search properties by price range.
        
        Args:
            min_price: Minimum price
            max_price: Maximum price
            city: Optional city filter
            **filters: Additional filter parameters
            
        Returns:
            Search results
        """
        search_filters = ResidentialFilters(
            min_price=min_price,
            max_price=max_price,
            city=city,
        )
        
        return self.search(filters=search_filters, **filters)
    
    def search_condos(
        self,
        city: Optional[str] = None,
        min_price: Optional[float] = None,
        max_price: Optional[float] = None,
        min_bedrooms: Optional[int] = None,
        exposure: Optional[str] = None,
        has_balcony: bool = False,
        has_locker: bool = False,
        max_maintenance: Optional[float] = None,
        building_amenities: Optional[List[str]] = None,
        **filters
    ) -> Dict[str, Any]:
        """
        Search specifically for condo properties.
        
        Args:
            city: City name
            min_price: Minimum price
            max_price: Maximum price
            min_bedrooms: Minimum bedrooms
            exposure: Unit exposure (N, S, E, W, etc.)
            has_balcony: Require balcony
            has_locker: Require locker
            max_maintenance: Maximum monthly maintenance fee
            building_amenities: List of required amenities
            **filters: Additional filter parameters
            
        Returns:
            Search results for condos
        """
        search_filters = ResidentialFilters(
            property_type='Condo Apartment',
            city=city,
            min_price=min_price,
            max_price=max_price,
            min_bedrooms=min_bedrooms,
            exposure=exposure,
            balcony='Open' if has_balcony else None,
            locker='Owned' if has_locker else None,
            max_maintenance=max_maintenance,
            building_amenities=building_amenities or [],
        )
        
        return self.search(filters=search_filters, **filters)
    
    def search_houses(
        self,
        city: Optional[str] = None,
        property_type: str = 'Detached',
        min_price: Optional[float] = None,
        max_price: Optional[float] = None,
        min_bedrooms: Optional[int] = None,
        garage_type: Optional[str] = None,
        basement_type: Optional[str] = None,
        has_pool: bool = False,
        min_lot_size: Optional[int] = None,
        **filters
    ) -> Dict[str, Any]:
        """
        Search specifically for houses (detached, semi, townhouse).
        
        Args:
            city: City name
            property_type: Detached, Semi-Detached, Townhouse
            min_price: Minimum price
            max_price: Maximum price
            min_bedrooms: Minimum bedrooms
            garage_type: Type of garage
            basement_type: Type of basement
            has_pool: Require pool
            min_lot_size: Minimum lot size in sqft
            **filters: Additional filter parameters
            
        Returns:
            Search results for houses
        """
        # Normalize property type
        normalized_type = RESIDENTIAL_PROPERTY_TYPE_MAPPING.get(
            property_type.lower(), property_type
        )
        
        search_filters = ResidentialFilters(
            property_type=normalized_type,
            city=city,
            min_price=min_price,
            max_price=max_price,
            min_bedrooms=min_bedrooms,
            garage_type=garage_type,
            basement_type=basement_type,
            has_pool=has_pool if has_pool else None,
            min_lot_size=min_lot_size,
        )
        
        return self.search(filters=search_filters, **filters)
    
    def search_rentals(
        self,
        city: Optional[str] = None,
        property_type: Optional[str] = None,
        min_price: Optional[float] = None,
        max_price: Optional[float] = None,
        min_bedrooms: Optional[int] = None,
        pets_allowed: bool = False,
        furnished: bool = False,
        available_date: Optional[str] = None,
        **filters
    ) -> Dict[str, Any]:
        """
        Search for rental properties.
        
        Args:
            city: City name
            property_type: Property type
            min_price: Minimum monthly rent
            max_price: Maximum monthly rent
            min_bedrooms: Minimum bedrooms
            pets_allowed: Require pet-friendly
            furnished: Require furnished
            available_date: Required availability date (YYYY-MM-DD)
            **filters: Additional filter parameters
            
        Returns:
            Search results for rentals
        """
        search_filters = ResidentialFilters(
            transaction_type='Lease',
            city=city,
            min_price=min_price,
            max_price=max_price,
            min_bedrooms=min_bedrooms,
            pets_allowed='Yes' if pets_allowed else None,
            furnished=furnished if furnished else None,
            available_date=available_date,
        )
        
        if property_type:
            search_filters.property_type = RESIDENTIAL_PROPERTY_TYPE_MAPPING.get(
                property_type.lower(), property_type
            )
        
        return self.search(filters=search_filters, **filters)
    
    def search_sold(
        self,
        city: Optional[str] = None,
        property_type: Optional[str] = None,
        min_sold_price: Optional[float] = None,
        max_sold_price: Optional[float] = None,
        min_sold_date: Optional[str] = None,
        max_sold_date: Optional[str] = None,
        **filters
    ) -> Dict[str, Any]:
        """
        Search for sold properties (comparable sales).
        
        Note: Repliers API only supports 'A' (Active) and 'U' (Under Contract) for status.
        For sold properties, we use the lastStatus=Sld parameter and date filters.
        
        Args:
            city: City name
            property_type: Property type
            min_sold_price: Minimum sold price
            max_sold_price: Maximum sold price
            min_sold_date: Sold after date (YYYY-MM-DD)
            max_sold_date: Sold before date (YYYY-MM-DD)
            **filters: Additional filter parameters
            
        Returns:
            Search results for sold properties
        """
        # For sold properties, we need to use lastStatus=Sld instead of status=S
        # This searches the historical sold listings
        search_filters = ResidentialFilters(
            status='A',  # Keep status as Active but use additional sold filters
            city=city,
            min_sold_price=min_sold_price,
            max_sold_price=max_sold_price,
            min_sold_date=min_sold_date,
            max_sold_date=max_sold_date,
        )
        
        if property_type:
            search_filters.property_type = RESIDENTIAL_PROPERTY_TYPE_MAPPING.get(
                property_type.lower(), property_type
            )
        
        # Add lastStatus filter for sold properties
        # This is a special parameter that searches sold listings
        filters['lastStatus'] = 'Sld'
        
        return self.search(filters=search_filters, **filters)
    
    def get_listing_details(self, mls_number: str) -> Dict[str, Any]:
        """
        Get detailed information for a specific listing.
        
        Args:
            mls_number: MLS listing number
            
        Returns:
            Detailed listing information
        """
        try:
            endpoint = config.get_endpoint('listing_detail', id=mls_number)
            response = self.client.get(endpoint)
            
            if response:
                return {
                    'success': True,
                    'listing': self._transform_listing(response),
                    'raw': response
                }
            else:
                return {
                    'success': False,
                    'error': 'Listing not found'
                }
                
        except RepliersAPIError as e:
            return {
                'success': False,
                'error': e.message
            }
    
    def _normalize_filters(self, filters: ResidentialFilters) -> ResidentialFilters:
        """
        Normalize and validate filters.
        
        Args:
            filters: ResidentialFilters object
            
        Returns:
            Normalized filters
        """
        # Normalize property type
        if filters.property_type:
            prop_type_lower = filters.property_type.lower()
            
            # ★★★ CRITICAL FIX ★★★
            # 'residential' is a CLASS, not a propertyType!
            # When user clicks the 'residential' button, don't filter by propertyType
            if prop_type_lower in ['residential', 'any', 'all']:
                logger.info(f"🔧 [NORMALIZE] Clearing invalid propertyType='{filters.property_type}' (not a valid API value)")
                filters.property_type = None
            else:
                # Try to normalize to API-compatible format
                normalized = RESIDENTIAL_PROPERTY_TYPE_MAPPING.get(
                    prop_type_lower,
                    None  # Don't fallback to unknown types
                )
                if normalized:
                    filters.property_type = normalized
                else:
                    # Check if already a valid API type
                    valid_api_types = ['Detached', 'Semi-Detached', 'Townhouse', 'Condo Apartment', 
                                      'Condo Townhouse', 'Duplex', 'Triplex', 'Multiplex', 'Link',
                                      'Vacant Land', 'Farm', 'Mobile/Trailer']
                    if filters.property_type not in valid_api_types:
                        logger.warning(f"⚠️ [NORMALIZE] Unknown propertyType='{filters.property_type}' - clearing to avoid API error")
                        filters.property_type = None
        
        # Ensure price range is valid
        if filters.min_price and filters.max_price:
            if filters.min_price > filters.max_price:
                filters.min_price, filters.max_price = filters.max_price, filters.min_price
        
        # Ensure bedroom range is valid
        if filters.min_bedrooms and filters.max_bedrooms:
            if filters.min_bedrooms > filters.max_bedrooms:
                filters.min_bedrooms, filters.max_bedrooms = filters.max_bedrooms, filters.min_bedrooms
        
        # Default status to Active if not specified
        if not filters.status:
            filters.status = 'A'
        
        # Limit page size
        if filters.page_size > 200:
            filters.page_size = 200
        
        return filters
    
    def _transform_listing(self, listing: Dict[str, Any]) -> Dict[str, Any]:
        """
        Transform raw listing to standardized format.
        
        Args:
            listing: Raw listing from API
            
        Returns:
            Standardized listing dict
        """
        # Extract nested fields safely
        address = listing.get('address', {})
        details = listing.get('details', {})
        taxes = listing.get('taxes', {})
        lot = listing.get('lot', {})
        map_data = listing.get('map', {})
        timestamps = listing.get('timestamps', {})
        images = listing.get('images', [])
        
        return {
            # Basic info
            'mls_number': listing.get('mlsNumber'),
            'list_price': listing.get('listPrice'),
            'sold_price': listing.get('soldPrice'),
            'status': listing.get('status'),
            'type': listing.get('type'),
            
            # Address
            'address': {
                'full': self._format_address(address),
                'street_number': address.get('streetNumber'),
                'street_name': address.get('streetName'),
                'street_suffix': address.get('streetSuffix'),
                'unit_number': address.get('unitNumber'),
                'city': address.get('city'),
                'state': address.get('state'),
                'postal_code': address.get('zip'),
                'neighborhood': address.get('neighborhood'),
                'community': address.get('community'),
            },
            
            # Property details
            'property_type': details.get('propertyType'),
            'style': details.get('style'),
            'bedrooms': details.get('numBedrooms'),
            'bedrooms_plus': details.get('numBedroomsPlus'),
            'bathrooms': details.get('numBathrooms'),
            'sqft': details.get('sqft'),
            'year_built': details.get('yearBuilt'),
            'garage': details.get('garage'),
            'garage_spaces': details.get('numGarageSpaces'),
            'parking_spaces': details.get('numParkingSpaces'),
            'basement': details.get('basement1'),
            'heating': details.get('heating'),
            'cooling': details.get('airConditioning'),
            'description': details.get('description'),
            
            # Lot info
            'lot': {
                'width': lot.get('width'),
                'depth': lot.get('depth'),
                'size': lot.get('size'),
                'acres': lot.get('acres'),
            },
            
            # Financials
            'taxes': {
                'annual_amount': taxes.get('annualAmount'),
                'assessment_year': taxes.get('assessmentYear'),
            },
            'maintenance_fee': listing.get('maintenance', {}).get('fee'),
            
            # Location
            'coordinates': {
                'latitude': map_data.get('latitude'),
                'longitude': map_data.get('longitude'),
            },
            
            # Media
            'images': images[:10] if images else [],  # Limit to 10 images
            'image_count': listing.get('photoCount', len(images) if images else 0),
            'virtual_tour': details.get('virtualTourUrl'),
            
            # Dates
            'list_date': timestamps.get('listingEntryDate'),
            'sold_date': listing.get('soldDate'),
            'days_on_market': listing.get('daysOnMarket') or listing.get('simpleDaysOnMarket'),
            
            # Agent/Office
            'office': listing.get('office', {}).get('brokerageName'),
        }
    
    def _format_address(self, address: Dict[str, Any]) -> str:
        """Format address components into a full address string."""
        parts = []
        
        if address.get('streetNumber'):
            parts.append(str(address['streetNumber']))
        if address.get('streetName'):
            parts.append(address['streetName'])
        if address.get('streetSuffix'):
            parts.append(address['streetSuffix'])
        if address.get('unitNumber'):
            parts.append(f"Unit {address['unitNumber']}")
        
        street = ' '.join(parts)
        
        location_parts = []
        if address.get('city'):
            location_parts.append(address['city'])
        if address.get('state'):
            location_parts.append(address['state'])
        if address.get('zip'):
            location_parts.append(address['zip'])
        
        location = ', '.join(location_parts)
        
        if street and location:
            return f"{street}, {location}"
        return street or location or "Address not available"
    
    def _get_applied_filters_summary(self, filters: ResidentialFilters) -> Dict[str, Any]:
        """Get summary of applied filters for logging/display."""
        summary = {}
        
        filter_fields = [
            'city', 'neighborhood', 'postal_code', 'property_type', 'property_style',
            'min_price', 'max_price', 'min_bedrooms', 'max_bedrooms',
            'min_bathrooms', 'transaction_type', 'status', 'has_pool',
            'garage_type', 'basement_type', 'min_sqft', 'max_sqft'
        ]
        
        for field in filter_fields:
            value = getattr(filters, field, None)
            if value is not None:
                summary[field] = value
        
        return summary


# ============================================================================
# SINGLETON INSTANCE
# ============================================================================

_service_instance = None


def get_residential_search_service() -> ResidentialPropertySearchService:
    """Get singleton instance of ResidentialPropertySearchService."""
    global _service_instance
    if _service_instance is None:
        _service_instance = ResidentialPropertySearchService()
    return _service_instance


# Convenience alias
residential_search_service = None


def init_residential_search_service():
    """Initialize the residential search service."""
    global residential_search_service
    residential_search_service = get_residential_search_service()
    return residential_search_service


# ============================================================================
# EXPORTS
# ============================================================================

__all__ = [
    'ResidentialPropertySearchService',
    'get_residential_search_service',
    'init_residential_search_service',
    'residential_search_service',
]
