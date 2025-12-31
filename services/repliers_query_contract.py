"""
Repliers Query Contract - Authoritative Parameter Schema & Validation
=====================================================================

SINGLE SOURCE OF TRUTH for all Repliers API parameter validation, normalization,
and mapping between internal snake_case conventions and external camelCase API.

This contract ensures:
1. Consistent parameter validation across the application
2. Proper snake_case → camelCase translation
3. Status and transaction type semantic mapping
4. Range validation (price, beds, baths, etc.)
5. Zero false positives in audit tools

Architecture:
    Internal Code (snake_case) → Contract Validation → Normalization → Repliers API (camelCase)

Author: Senior Backend Architect
Date: 2025-12-26
"""

import logging
from typing import Dict, Any, Optional, List, Set, Union
from dataclasses import dataclass

logger = logging.getLogger(__name__)


# ============================================================================
# CONTRACT EXCEPTIONS
# ============================================================================

class ContractError(ValueError):
    """Base exception for contract violations"""
    pass


class UnknownParameterError(ContractError):
    """Raised when an unknown parameter is provided"""
    pass


class InvalidParameterValueError(ContractError):
    """Raised when a parameter has an invalid value"""
    pass


class ParameterRangeError(ContractError):
    """Raised when min/max parameters violate logic"""
    pass


# ============================================================================
# INTERNAL PARAMETER SCHEMA (snake_case)
# ============================================================================

@dataclass
class InternalParamSchema:
    """
    Internal parameter schema - snake_case Python conventions
    These are the parameters accepted by our service layer
    """
    
    # Location parameters
    LOCATION = {
        'city': {'type': str, 'description': 'City name'},
        'neighborhood': {'type': str, 'description': 'Neighborhood name'},
        'postal_code': {'type': str, 'description': 'Postal/ZIP code'},
        'street_name': {'type': str, 'description': 'Street name for address search'},
        'street_number': {'type': str, 'description': 'Street number for address search'},
        'latitude': {'type': (float, int), 'description': 'Latitude coordinate'},
        'longitude': {'type': (float, int), 'description': 'Longitude coordinate'},
        'radius_km': {'type': (float, int), 'description': 'Search radius in km'},
    }
    
    # Property filters
    PROPERTY = {
        'min_price': {'type': (float, int), 'description': 'Minimum listing price'},
        'max_price': {'type': (float, int), 'description': 'Maximum listing price'},
        'property_type': {'type': str, 'description': 'Property type'},
        'property_style': {'type': str, 'description': 'Property style'},
        'min_bedrooms': {'type': int, 'description': 'Minimum bedrooms'},
        'max_bedrooms': {'type': int, 'description': 'Maximum bedrooms'},
        'min_bathrooms': {'type': (float, int), 'description': 'Minimum bathrooms'},
        'max_bathrooms': {'type': (float, int), 'description': 'Maximum bathrooms'},
        'min_sqft': {'type': int, 'description': 'Minimum square footage'},
        'max_sqft': {'type': int, 'description': 'Maximum square footage'},
    }
    
    # Status and transaction
    STATUS = {
        'status': {
            'type': str, 
            'description': 'Listing status',
            'valid_values': {
                # Internal values (accept both)
                'active', 'sold', 'leased', 'under_contract',
                'A', 'S', 'L', 'U'
            }
        },
        'transaction_type': {
            'type': str,
            'description': 'Transaction type',
            'valid_values': {'sale', 'lease', 'rent', 'buy'}
        },
    }
    
    # Features
    FEATURES = {
        'keywords': {'type': (str, list), 'description': 'Search keywords'},
        'has_pool': {'type': bool, 'description': 'Has swimming pool'},
        'has_garage': {'type': bool, 'description': 'Has garage'},
        'parking_spots': {'type': int, 'description': 'Minimum parking spots'},
    }
    
    # Date filters
    DATES = {
        'listed_after': {'type': str, 'description': 'Listed after date (YYYY-MM-DD)'},
        'listed_before': {'type': str, 'description': 'Listed before date (YYYY-MM-DD)'},
        'open_house_date': {'type': str, 'description': 'Open house date'},
    }
    
    # Pagination
    PAGINATION = {
        'page': {'type': int, 'description': 'Page number'},
        'page_size': {'type': int, 'description': 'Results per page', 'max': 200},
        'limit': {'type': int, 'description': 'Result limit (alias for page_size)'},
    }
    
    # Sorting
    SORTING = {
        'sort_by': {
            'type': str,
            'description': 'Sort order',
            'valid_values': {'price_asc', 'price_desc', 'date_asc', 'date_desc'}
        },
    }
    
    @classmethod
    def get_all_valid_params(cls) -> Set[str]:
        """Return set of all valid internal parameter names"""
        all_params = set()
        for group in [cls.LOCATION, cls.PROPERTY, cls.STATUS, cls.FEATURES, 
                     cls.DATES, cls.PAGINATION, cls.SORTING]:
            all_params.update(group.keys())
        return all_params
    
    @classmethod
    def get_param_schema(cls, param_name: str) -> Optional[Dict]:
        """Get schema for a specific parameter"""
        for group in [cls.LOCATION, cls.PROPERTY, cls.STATUS, cls.FEATURES,
                     cls.DATES, cls.PAGINATION, cls.SORTING]:
            if param_name in group:
                return group[param_name]
        return None


# ============================================================================
# EXTERNAL PARAMETER SCHEMA (camelCase - Repliers API)
# ============================================================================

@dataclass
class ExternalParamSchema:
    """
    External parameter schema - camelCase for Repliers API
    These are the actual parameters sent to the Repliers API
    """
    
    # Explicit mapping from internal (snake_case) to external (camelCase)
    PARAM_MAPPING = {
        # Location
        'city': 'city',
        'neighborhood': 'neighborhood',
        'postal_code': 'postalCode',
        'street_name': 'streetName',
        'street_number': 'streetNumber',
        'latitude': 'latitude',
        'longitude': 'longitude',
        'radius_km': 'radius',
        
        # Property
        'min_price': 'minPrice',
        'max_price': 'maxPrice',
        'property_type': 'propertyType',
        'property_style': 'propertyStyle',
        'min_bedrooms': 'minBedrooms',
        'max_bedrooms': 'maxBedrooms',
        'min_bathrooms': 'minBathrooms',
        'max_bathrooms': 'maxBathrooms',
        'min_sqft': 'minSqft',
        'max_sqft': 'maxSqft',
        
        # Status
        'status': 'status',
        'transaction_type': 'type',  # Note: maps to 'type' in Repliers API
        
        # Features
        'keywords': 'keywords',
        'has_pool': 'hasPool',
        'has_garage': 'hasGarage',
        'parking_spots': 'parkingSpots',
        
        # Dates
        'listed_after': 'minListDate',
        'listed_before': 'maxListDate',
        'open_house_date': 'openHouseDate',
        
        # Pagination
        'page': 'page',
        'page_size': 'pageSize',
        'limit': 'pageSize',  # 'limit' maps to 'pageSize'
        
        # Sorting
        'sort_by': 'sortBy',
    }
    
    # Status value mapping (semantic normalization)
    STATUS_MAPPING = {
        # Internal string → API code
        'active': 'A',
        'sold': 'S',
        'leased': 'L',
        'under_contract': 'U',
        # Pass-through if already API code
        'A': 'A',
        'S': 'S',
        'L': 'L',
        'U': 'U',
    }
    
    # Transaction type mapping
    TRANSACTION_MAPPING = {
        'sale': 'sale',
        'lease': 'lease',
        'rent': 'lease',  # 'rent' is alias for 'lease'
        'buy': 'sale',    # 'buy' is alias for 'sale'
    }


# ============================================================================
# CONTRACT VALIDATOR
# ============================================================================

class RepliersQueryContract:
    """
    Authoritative contract for Repliers API queries
    
    Responsibilities:
    1. Validate internal parameters against schema
    2. Normalize status and transaction types
    3. Transform snake_case → camelCase
    4. Enforce range constraints
    5. Provide human-readable error messages
    """
    
    def __init__(self, strict_mode: bool = True):
        """
        Initialize contract
        
        Args:
            strict_mode: If True, reject unknown parameters. If False, warn but allow.
        """
        self.strict_mode = strict_mode
        self.internal_schema = InternalParamSchema()
        self.external_schema = ExternalParamSchema()
    
    def validate_internal_params(self, params: Dict[str, Any]) -> None:
        """
        Validate internal parameters against schema
        
        Args:
            params: Dictionary of internal parameters (snake_case)
            
        Raises:
            UnknownParameterError: If unknown parameter found
            InvalidParameterValueError: If parameter value is invalid
            ParameterRangeError: If min/max constraints violated
        """
        valid_params = self.internal_schema.get_all_valid_params()
        
        # Check for unknown parameters
        for param_name in params.keys():
            if param_name not in valid_params:
                if self.strict_mode:
                    raise UnknownParameterError(
                        f"Unknown parameter '{param_name}'. "
                        f"Valid parameters: {sorted(valid_params)}"
                    )
                else:
                    logger.warning(f"Unknown parameter '{param_name}' (strict_mode=False)")
        
        # Validate each parameter
        for param_name, param_value in params.items():
            if param_value is None:
                continue  # Skip None values
            
            schema = self.internal_schema.get_param_schema(param_name)
            if not schema:
                continue  # Unknown param already handled above
            
            # Type validation
            expected_type = schema['type']
            if not isinstance(param_value, expected_type):
                raise InvalidParameterValueError(
                    f"Parameter '{param_name}' expects type {expected_type}, "
                    f"got {type(param_value).__name__}"
                )
            
            # Valid values validation
            if 'valid_values' in schema:
                valid_values = schema['valid_values']
                if param_value not in valid_values:
                    raise InvalidParameterValueError(
                        f"Parameter '{param_name}' has invalid value '{param_value}'. "
                        f"Valid values: {sorted(valid_values)}"
                    )
            
            # Max value validation (e.g., page_size max 200)
            if 'max' in schema:
                max_val = schema['max']
                if param_value > max_val:
                    raise InvalidParameterValueError(
                        f"Parameter '{param_name}' exceeds maximum value {max_val} "
                        f"(got {param_value})"
                    )
        
        # Range constraint validation
        self._validate_ranges(params)
    
    def _validate_ranges(self, params: Dict[str, Any]) -> None:
        """Validate min/max parameter constraints"""
        
        # Price range
        if 'min_price' in params and 'max_price' in params:
            if params['min_price'] is not None and params['max_price'] is not None:
                if params['min_price'] > params['max_price']:
                    raise ParameterRangeError(
                        f"min_price ({params['min_price']}) cannot exceed "
                        f"max_price ({params['max_price']})"
                    )
        
        # Bedroom range
        if 'min_bedrooms' in params and 'max_bedrooms' in params:
            if params['min_bedrooms'] is not None and params['max_bedrooms'] is not None:
                if params['min_bedrooms'] > params['max_bedrooms']:
                    raise ParameterRangeError(
                        f"min_bedrooms ({params['min_bedrooms']}) cannot exceed "
                        f"max_bedrooms ({params['max_bedrooms']})"
                    )
        
        # Bathroom range
        if 'min_bathrooms' in params and 'max_bathrooms' in params:
            if params['min_bathrooms'] is not None and params['max_bathrooms'] is not None:
                if params['min_bathrooms'] > params['max_bathrooms']:
                    raise ParameterRangeError(
                        f"min_bathrooms ({params['min_bathrooms']}) cannot exceed "
                        f"max_bathrooms ({params['max_bathrooms']})"
                    )
        
        # Sqft range
        if 'min_sqft' in params and 'max_sqft' in params:
            if params['min_sqft'] is not None and params['max_sqft'] is not None:
                if params['min_sqft'] > params['max_sqft']:
                    raise ParameterRangeError(
                        f"min_sqft ({params['min_sqft']}) cannot exceed "
                        f"max_sqft ({params['max_sqft']})"
                    )
        
        # Coordinate validation
        if ('latitude' in params) != ('longitude' in params):
            if params.get('latitude') is not None or params.get('longitude') is not None:
                raise ParameterRangeError(
                    "Both 'latitude' and 'longitude' must be provided for coordinate search"
                )
    
    def normalize_status(self, status_value: str) -> str:
        """
        Normalize status value to Repliers API format
        
        Args:
            status_value: Internal status value (e.g., 'active', 'A')
            
        Returns:
            Normalized status code (e.g., 'A')
            
        Raises:
            InvalidParameterValueError: If status value is invalid
        """
        if not status_value:
            return None
        
        status_lower = status_value.lower()
        
        # Try direct mapping first
        if status_value in self.external_schema.STATUS_MAPPING:
            return self.external_schema.STATUS_MAPPING[status_value]
        
        # Try lowercase mapping
        if status_lower in self.external_schema.STATUS_MAPPING:
            return self.external_schema.STATUS_MAPPING[status_lower]
        
        raise InvalidParameterValueError(
            f"Invalid status value '{status_value}'. "
            f"Valid values: {sorted(self.external_schema.STATUS_MAPPING.keys())}"
        )
    
    def normalize_transaction_type(self, transaction_type: str) -> str:
        """
        Normalize transaction type to Repliers API format
        
        Args:
            transaction_type: Internal transaction type (e.g., 'sale', 'rent')
            
        Returns:
            Normalized transaction type (e.g., 'sale', 'lease')
            
        Raises:
            InvalidParameterValueError: If transaction type is invalid
        """
        if not transaction_type:
            return None
        
        transaction_lower = transaction_type.lower()
        
        if transaction_lower in self.external_schema.TRANSACTION_MAPPING:
            return self.external_schema.TRANSACTION_MAPPING[transaction_lower]
        
        raise InvalidParameterValueError(
            f"Invalid transaction_type '{transaction_type}'. "
            f"Valid values: {sorted(self.external_schema.TRANSACTION_MAPPING.keys())}"
        )
    
    def normalize_to_repliers(self, params: Dict[str, Any]) -> Dict[str, Any]:
        """
        Transform internal parameters to Repliers API format
        
        This is the AUTHORITATIVE transformation from snake_case → camelCase
        with semantic normalization of status and transaction types.
        
        Args:
            params: Dictionary of internal parameters (snake_case)
            
        Returns:
            Dictionary of external parameters (camelCase) ready for Repliers API
        """
        normalized = {}
        
        for internal_name, value in params.items():
            # Skip None values
            if value is None:
                continue
            
            # Get external parameter name
            external_name = self.external_schema.PARAM_MAPPING.get(internal_name)
            
            if not external_name:
                # Unknown parameter - skip in non-strict mode, error caught earlier in strict
                if self.strict_mode:
                    continue  # Already validated, should not reach here
                else:
                    logger.warning(f"Skipping unknown parameter '{internal_name}'")
                    continue
            
            # Special handling for status
            if internal_name == 'status':
                normalized[external_name] = self.normalize_status(value)
            
            # Special handling for transaction_type
            elif internal_name == 'transaction_type':
                normalized[external_name] = self.normalize_transaction_type(value)
            
            # Special handling for keywords (ensure comma-separated string)
            elif internal_name == 'keywords':
                if isinstance(value, list):
                    normalized[external_name] = ','.join(value)
                else:
                    normalized[external_name] = value
            
            # Special handling for boolean values
            elif isinstance(value, bool):
                normalized[external_name] = str(value).lower()
            
            # All other parameters
            else:
                normalized[external_name] = value
        
        return normalized
    
    def validate_and_normalize(
        self, 
        params: Dict[str, Any],
        debug: bool = False
    ) -> Dict[str, Any]:
        """
        Complete validation and normalization pipeline
        
        Args:
            params: Internal parameters (snake_case)
            debug: If True, log transformation details
            
        Returns:
            Normalized parameters ready for Repliers API (camelCase)
            
        Raises:
            ContractError: If validation fails
        """
        # Step 1: Validate internal parameters
        self.validate_internal_params(params)
        
        # Step 2: Normalize to external format
        normalized = self.normalize_to_repliers(params)
        
        # Step 3: Debug logging
        if debug:
            logger.info("=" * 60)
            logger.info("REPLIERS QUERY CONTRACT - NORMALIZATION")
            logger.info("=" * 60)
            logger.info(f"Input (internal):  {params}")
            logger.info(f"Output (external): {normalized}")
            logger.info("=" * 60)
        
        return normalized


# ============================================================================
# GLOBAL CONTRACT INSTANCE
# ============================================================================

# Default contract instance (strict mode)
contract = RepliersQueryContract(strict_mode=True)

# Relaxed contract instance for legacy code
relaxed_contract = RepliersQueryContract(strict_mode=False)


# ============================================================================
# CONVENIENCE FUNCTIONS
# ============================================================================

def validate_internal_params(params: Dict[str, Any]) -> None:
    """
    Validate internal parameters against contract
    
    Args:
        params: Internal parameters (snake_case)
        
    Raises:
        ContractError: If validation fails
    """
    contract.validate_internal_params(params)


def normalize_to_repliers(params: Dict[str, Any], debug: bool = False) -> Dict[str, Any]:
    """
    Normalize internal parameters to Repliers API format
    
    Args:
        params: Internal parameters (snake_case)
        debug: Enable debug logging
        
    Returns:
        Normalized parameters (camelCase)
    """
    return contract.validate_and_normalize(params, debug=debug)


def is_valid_internal_param(param_name: str) -> bool:
    """Check if parameter name is valid in internal schema"""
    return param_name in InternalParamSchema.get_all_valid_params()


def get_external_param_name(internal_name: str) -> Optional[str]:
    """Get external (camelCase) parameter name for internal (snake_case) name"""
    return ExternalParamSchema.PARAM_MAPPING.get(internal_name)


# ============================================================================
# MODULE EXPORTS
# ============================================================================

__all__ = [
    # Exceptions
    'ContractError',
    'UnknownParameterError',
    'InvalidParameterValueError',
    'ParameterRangeError',
    
    # Schemas
    'InternalParamSchema',
    'ExternalParamSchema',
    
    # Contract class
    'RepliersQueryContract',
    
    # Global instances
    'contract',
    'relaxed_contract',
    
    # Convenience functions
    'validate_internal_params',
    'normalize_to_repliers',
    'is_valid_internal_param',
    'get_external_param_name',
]


if __name__ == '__main__':
    # Self-test
    print("🧪 Testing Repliers Query Contract\n")
    
    # Test 1: Valid parameters
    print("Test 1: Valid parameters")
    test_params = {
        'city': 'Toronto',
        'property_style': 'condo',
        'min_bedrooms': 2,
        'max_price': 800000,
        'status': 'active',
        'transaction_type': 'sale',
        'page_size': 25
    }
    try:
        normalized = normalize_to_repliers(test_params, debug=True)
        print("✅ PASS\n")
    except Exception as e:
        print(f"❌ FAIL: {e}\n")
    
    # Test 2: Invalid status
    print("Test 2: Invalid status value")
    try:
        invalid_params = {'status': 'invalid_status'}
        normalize_to_repliers(invalid_params)
        print("❌ FAIL: Should have raised error\n")
    except InvalidParameterValueError as e:
        print(f"✅ PASS: Caught error - {e}\n")
    
    # Test 3: Range violation
    print("Test 3: Price range violation")
    try:
        range_params = {'min_price': 1000000, 'max_price': 500000}
        normalize_to_repliers(range_params)
        print("❌ FAIL: Should have raised error\n")
    except ParameterRangeError as e:
        print(f"✅ PASS: Caught error - {e}\n")
    
    # Test 4: Unknown parameter
    print("Test 4: Unknown parameter")
    try:
        unknown_params = {'invalid_param': 'test', 'city': 'Toronto'}
        normalize_to_repliers(unknown_params)
        print("❌ FAIL: Should have raised error\n")
    except UnknownParameterError as e:
        print(f"✅ PASS: Caught error - {e}\n")
    
    print("🎉 Contract self-test complete!")
