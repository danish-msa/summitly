"""
Input Validator Service
========================
Comprehensive input validation and sanitization for all user inputs.

This service provides centralized validation for:
- User messages (length, encoding, sanitization)
- Search filters (bedrooms, bathrooms, prices, etc.)
- Session IDs (format, security)
- Postal codes (Canadian format)
- Prices (context-aware validation)

Author: Summitly Team
Date: December 22, 2025
"""

import re
import logging
from typing import Dict, List, Optional, Any, Tuple
from enum import Enum

logger = logging.getLogger(__name__)


# =============================================================================
# CONSTANTS & CONFIGURATION
# =============================================================================

# Message validation limits
MIN_MESSAGE_LENGTH = 1
MAX_MESSAGE_LENGTH = 2000

# Session ID validation
MAX_SESSION_ID_LENGTH = 100
SESSION_ID_PATTERN = re.compile(r'^[a-zA-Z0-9\-_]+$')

# Canadian postal code pattern (A1A 1A1 or A1A1A1)
POSTAL_CODE_PATTERN = re.compile(r'^[A-Za-z]\d[A-Za-z][\s\-]?\d[A-Za-z]\d$')

# Control characters to remove (except newline, tab, carriage return)
CONTROL_CHARS_PATTERN = re.compile(r'[\x00-\x08\x0B\x0C\x0E-\x1F\x7F]')

# Price limits (in CAD)
MAX_SALE_PRICE = 50_000_000  # 50 million CAD
MAX_RENT_PRICE = 10_000      # 10,000 CAD/month

# Room count limits
MIN_ROOM_COUNT = 0
MAX_ROOM_COUNT = 8

# Valid property types (comprehensive list)
VALID_PROPERTY_TYPES = {
    'house', 'condo', 'townhouse', 'apartment', 'bungalow', 
    'duplex', 'triplex', 'fourplex', 'semi-detached', 'detached',
    'land', 'commercial', 'industrial', 'farm', 'cottage',
    'mobile home', 'manufactured home', 'loft', 'studio',
    'penthouse', 'villa', 'estate'
}

# Valid listing types
VALID_LISTING_TYPES = {'sale', 'rent'}


class ValidationError(Exception):
    """Custom exception for validation errors"""
    pass


class InputValidator:
    """
    Centralized input validation and sanitization service.
    
    All validation methods return tuples with:
    - Success boolean
    - Cleaned/normalized data
    - Error message (empty string if valid)
    
    Example:
        validator = InputValidator()
        is_valid, cleaned_msg, error = validator.validate_user_message(user_input)
        if not is_valid:
            return jsonify({'error': error}), 400
    """
    
    def __init__(self):
        """Initialize the input validator."""
        logger.info("InputValidator initialized")
    
    # =========================================================================
    # MESSAGE VALIDATION
    # =========================================================================
    
    def validate_user_message(self, message: Any) -> Tuple[bool, str, str]:
        """
        Validate and sanitize user message.
        
        Validation checks:
        1. Not None
        2. Is string type
        3. Not empty after stripping
        4. Within length limits
        5. Valid UTF-8 encoding
        6. No dangerous control characters
        
        Args:
            message: User's input message
            
        Returns:
            Tuple of (is_valid, cleaned_message, error_reason)
            
        Examples:
            >>> validator.validate_user_message("")
            (False, "", "Message is empty")
            
            >>> validator.validate_user_message("  hello  ")
            (True, "hello", "")
            
            >>> validator.validate_user_message("x" * 5000)
            (False, "", "Message exceeds 2000 characters")
            
            >>> validator.validate_user_message(None)
            (False, "", "Message is None")
        """
        # Check if None
        if message is None:
            return (False, "", "Message is None")
        
        # Check if string
        if not isinstance(message, str):
            return (False, "", f"Message must be a string, got {type(message).__name__}")
        
        # Check UTF-8 encoding validity
        try:
            # Ensure valid UTF-8
            message = message.encode('utf-8').decode('utf-8')
        except (UnicodeDecodeError, UnicodeEncodeError) as e:
            logger.warning(f"Invalid UTF-8 encoding in message: {e}")
            return (False, "", "Message contains invalid characters")
        
        # Remove control characters (except \n, \r, \t)
        cleaned = CONTROL_CHARS_PATTERN.sub('', message)
        
        # Strip leading/trailing whitespace
        cleaned = cleaned.strip()
        
        # Check if empty after cleaning
        if not cleaned:
            return (False, "", "Message is empty")
        
        # Normalize multiple spaces to single space
        cleaned = re.sub(r'\s+', ' ', cleaned)
        
        # Check length constraints
        if len(cleaned) < MIN_MESSAGE_LENGTH:
            return (False, "", f"Message is too short (minimum {MIN_MESSAGE_LENGTH} character)")
        
        if len(cleaned) > MAX_MESSAGE_LENGTH:
            return (False, "", f"Message exceeds {MAX_MESSAGE_LENGTH} characters")
        
        return (True, cleaned, "")
    
    # =========================================================================
    # FILTER VALIDATION
    # =========================================================================
    
    def validate_filters(self, filters: Any) -> Tuple[bool, Dict[str, Any], str]:
        """
        Validate and clean search filters.
        
        Validates:
        - location: non-empty string if provided
        - bedrooms: 0-8 integer or null
        - bathrooms: 0-8 integer or null
        - min_price: non-negative integer or null
        - max_price: non-negative integer or null, >= min_price
        - listing_type: 'sale' or 'rent' or null
        - property_type: valid enum or null
        - amenities: list of strings or empty list
        
        Args:
            filters: Dictionary of search filters
            
        Returns:
            Tuple of (is_valid, cleaned_filters, error_reason)
            
        Examples:
            >>> validator.validate_filters({'bedrooms': 3, 'listing_type': 'sale'})
            (True, {'bedrooms': 3, 'listing_type': 'sale'}, "")
            
            >>> validator.validate_filters({'bedrooms': 15})
            (False, {}, "Bedrooms must be between 0 and 8")
        """
        if filters is None:
            return (True, {}, "")
        
        if not isinstance(filters, dict):
            return (False, {}, f"Filters must be a dictionary, got {type(filters).__name__}")
        
        cleaned_filters = {}
        errors = []
        
        # Validate location
        if 'location' in filters and filters['location'] is not None:
            location = filters['location']
            if not isinstance(location, str):
                errors.append("Location must be a string")
            else:
                location = location.strip()
                if not location:
                    errors.append("Location cannot be empty")
                else:
                    cleaned_filters['location'] = location
        
        # Validate bedrooms
        if 'bedrooms' in filters and filters['bedrooms'] is not None:
            is_valid, value, error = self._validate_room_count(
                filters['bedrooms'], 'bedrooms'
            )
            if not is_valid:
                errors.append(error)
            else:
                cleaned_filters['bedrooms'] = value
        
        # Validate bathrooms
        if 'bathrooms' in filters and filters['bathrooms'] is not None:
            is_valid, value, error = self._validate_room_count(
                filters['bathrooms'], 'bathrooms'
            )
            if not is_valid:
                errors.append(error)
            else:
                cleaned_filters['bathrooms'] = value
        
        # Validate min_price
        if 'min_price' in filters and filters['min_price'] is not None:
            is_valid, value, error = self._validate_price_value(
                filters['min_price'], 'min_price'
            )
            if not is_valid:
                errors.append(error)
            else:
                cleaned_filters['min_price'] = value
        
        # Validate max_price
        if 'max_price' in filters and filters['max_price'] is not None:
            is_valid, value, error = self._validate_price_value(
                filters['max_price'], 'max_price'
            )
            if not is_valid:
                errors.append(error)
            else:
                cleaned_filters['max_price'] = value
        
        # Validate price range consistency
        if 'min_price' in cleaned_filters and 'max_price' in cleaned_filters:
            if cleaned_filters['min_price'] > cleaned_filters['max_price']:
                errors.append("Maximum price must be greater than or equal to minimum price")
        
        # Validate listing_type
        if 'listing_type' in filters and filters['listing_type'] is not None:
            listing_type = filters['listing_type']
            if not isinstance(listing_type, str):
                errors.append("Listing type must be a string")
            else:
                listing_type = listing_type.lower().strip()
                if listing_type not in VALID_LISTING_TYPES:
                    errors.append(f"Listing type must be one of: {', '.join(VALID_LISTING_TYPES)}")
                else:
                    cleaned_filters['listing_type'] = listing_type
        
        # Validate property_type
        if 'property_type' in filters and filters['property_type'] is not None:
            property_type = filters['property_type']
            if not isinstance(property_type, str):
                errors.append("Property type must be a string")
            else:
                property_type = property_type.lower().strip()
                if property_type not in VALID_PROPERTY_TYPES:
                    logger.warning(f"Unknown property type: {property_type}")
                    # Still allow it, just log warning
                cleaned_filters['property_type'] = property_type
        
        # Validate amenities
        if 'amenities' in filters:
            amenities = filters['amenities']
            if amenities is None:
                cleaned_filters['amenities'] = []
            elif isinstance(amenities, list):
                cleaned_amenities = []
                for amenity in amenities:
                    if isinstance(amenity, str):
                        amenity = amenity.strip()
                        if amenity:
                            cleaned_amenities.append(amenity.lower())
                    else:
                        errors.append(f"Amenity must be a string, got {type(amenity).__name__}")
                cleaned_filters['amenities'] = cleaned_amenities
            else:
                errors.append("Amenities must be a list")
        
        # Return validation result
        if errors:
            error_msg = "; ".join(errors)
            return (False, {}, error_msg)
        
        return (True, cleaned_filters, "")
    
    def _validate_room_count(self, value: Any, field_name: str) -> Tuple[bool, int, str]:
        """Validate room count (bedrooms/bathrooms)."""
        try:
            # Convert to int
            if isinstance(value, float):
                if not value.is_integer():
                    return (False, 0, f"{field_name.capitalize()} must be a whole number")
                value = int(value)
            elif isinstance(value, str):
                value = int(value)
            elif not isinstance(value, int):
                return (False, 0, f"{field_name.capitalize()} must be a number")
            
            # Check range
            if value < MIN_ROOM_COUNT or value > MAX_ROOM_COUNT:
                return (False, 0, f"{field_name.capitalize()} must be between {MIN_ROOM_COUNT} and {MAX_ROOM_COUNT}")
            
            return (True, value, "")
        
        except (ValueError, TypeError):
            return (False, 0, f"{field_name.capitalize()} must be a valid number")
    
    def _validate_price_value(self, value: Any, field_name: str) -> Tuple[bool, int, str]:
        """Validate price value (min_price/max_price)."""
        try:
            # Convert to int
            if isinstance(value, float):
                value = int(value)
            elif isinstance(value, str):
                # Remove common formatting (commas, dollar signs)
                value = value.replace(',', '').replace('$', '').strip()
                value = int(value)
            elif not isinstance(value, int):
                return (False, 0, f"{field_name.capitalize()} must be a number")
            
            # Check non-negative
            if value < 0:
                return (False, 0, f"{field_name.capitalize()} cannot be negative")
            
            return (True, value, "")
        
        except (ValueError, TypeError):
            return (False, 0, f"{field_name.capitalize()} must be a valid number")
    
    # =========================================================================
    # SESSION ID VALIDATION
    # =========================================================================
    
    def validate_session_id(self, session_id: Any) -> Tuple[bool, str]:
        """
        Validate session ID for security and format.
        
        Requirements:
        - UUID format or alphanumeric with hyphens/underscores
        - Max 100 characters
        - No path traversal characters (../, \\, etc.)
        - No special characters that could cause issues
        
        Args:
            session_id: Session identifier
            
        Returns:
            Tuple of (is_valid, error_reason)
            
        Examples:
            >>> validator.validate_session_id("550e8400-e29b-41d4-a716-446655440000")
            (True, "")
            
            >>> validator.validate_session_id("../../../etc/passwd")
            (False, "Session ID contains invalid characters")
            
            >>> validator.validate_session_id("a" * 150)
            (False, "Session ID exceeds maximum length of 100 characters")
        """
        if session_id is None:
            return (False, "Session ID is None")
        
        if not isinstance(session_id, str):
            return (False, f"Session ID must be a string, got {type(session_id).__name__}")
        
        # Check length
        if len(session_id) > MAX_SESSION_ID_LENGTH:
            return (False, f"Session ID exceeds maximum length of {MAX_SESSION_ID_LENGTH} characters")
        
        if not session_id.strip():
            return (False, "Session ID is empty")
        
        # Check for path traversal characters
        dangerous_patterns = ['../', '..\\', './', '.\\', '//', '\\\\']
        for pattern in dangerous_patterns:
            if pattern in session_id:
                return (False, "Session ID contains invalid characters")
        
        # Validate format (alphanumeric with hyphens/underscores only)
        if not SESSION_ID_PATTERN.match(session_id):
            return (False, "Session ID must contain only letters, numbers, hyphens, and underscores")
        
        return (True, "")
    
    # =========================================================================
    # POSTAL CODE VALIDATION (CANADA)
    # =========================================================================
    
    def validate_postal_code(self, code: Any) -> Tuple[bool, str, str]:
        """
        Validate and normalize Canadian postal code.
        
        Format: A1A 1A1 or A1A1A1
        Returns normalized: uppercase with space after first 3 chars
        
        Args:
            code: Postal code string
            
        Returns:
            Tuple of (is_valid, normalized_code, error_reason)
            
        Examples:
            >>> validator.validate_postal_code("m5v 3a8")
            (True, "M5V 3A8", "")
            
            >>> validator.validate_postal_code("M5V3A8")
            (True, "M5V 3A8", "")
            
            >>> validator.validate_postal_code("12345")
            (False, "", "Invalid Canadian postal code format")
        """
        if code is None:
            return (False, "", "Postal code is None")
        
        if not isinstance(code, str):
            return (False, "", f"Postal code must be a string, got {type(code).__name__}")
        
        # Clean and normalize
        code = code.strip().upper()
        
        # Remove any existing space or hyphen
        code = code.replace(' ', '').replace('-', '')
        
        if not code:
            return (False, "", "Postal code is empty")
        
        # Check format (must be exactly 6 characters: A1A1A1)
        if len(code) != 6:
            return (False, "", "Invalid Canadian postal code format (must be 6 characters)")
        
        # Validate pattern: Letter-Digit-Letter Digit-Letter-Digit
        if not re.match(r'^[A-Z]\d[A-Z]\d[A-Z]\d$', code):
            return (False, "", "Invalid Canadian postal code format (must be A1A 1A1)")
        
        # Format with space: A1A 1A1
        normalized = f"{code[:3]} {code[3:]}"
        
        return (True, normalized, "")
    
    # =========================================================================
    # PRICE VALIDATION (CONTEXT-AWARE)
    # =========================================================================
    
    def validate_price(
        self, 
        price: Any, 
        context: str = 'sale'
    ) -> Tuple[bool, str]:
        """
        Validate price based on listing context (sale vs rent).
        
        For 'sale': 0-50,000,000 CAD (realistic home prices)
        For 'rent': 0-10,000 CAD/month (realistic monthly rent)
        
        Args:
            price: Price value
            context: 'sale' or 'rent'
            
        Returns:
            Tuple of (is_valid, error_reason)
            
        Examples:
            >>> validator.validate_price(750000, 'sale')
            (True, "")
            
            >>> validator.validate_price(100000000, 'sale')
            (False, "Sale price exceeds maximum of $50,000,000 CAD")
            
            >>> validator.validate_price(2500, 'rent')
            (True, "")
            
            >>> validator.validate_price(50000, 'rent')
            (False, "Rent price exceeds maximum of $10,000 CAD/month")
        """
        if price is None:
            return (True, "")  # None is valid (no price filter)
        
        # Convert to number
        try:
            if isinstance(price, str):
                price = price.replace(',', '').replace('$', '').strip()
                price = float(price)
            elif not isinstance(price, (int, float)):
                return (False, f"Price must be a number, got {type(price).__name__}")
            
            price = int(price)
        except (ValueError, TypeError):
            return (False, "Price must be a valid number")
        
        # Check for negative
        if price < 0:
            return (False, "Price cannot be negative")
        
        # Context-aware validation
        context = context.lower().strip() if isinstance(context, str) else 'sale'
        
        if context == 'rent':
            if price > MAX_RENT_PRICE:
                return (False, f"Rent price exceeds maximum of ${MAX_RENT_PRICE:,} CAD/month")
        else:  # Default to 'sale'
            if price > MAX_SALE_PRICE:
                return (False, f"Sale price exceeds maximum of ${MAX_SALE_PRICE:,} CAD")
        
        return (True, "")
    
    # =========================================================================
    # BATCH VALIDATION
    # =========================================================================
    
    def validate_chat_request(self, request_data: Dict[str, Any]) -> Tuple[bool, Dict[str, Any], List[str]]:
        """
        Validate complete chat request payload.
        
        Validates:
        - message (required)
        - session_id (optional, auto-generated if missing)
        - context/filters (optional)
        
        Args:
            request_data: Complete request payload
            
        Returns:
            Tuple of (is_valid, cleaned_data, error_messages)
        """
        cleaned_data = {}
        errors = []
        
        # Validate message (required)
        message = request_data.get('message')
        is_valid, cleaned_msg, error = self.validate_user_message(message)
        if not is_valid:
            errors.append(f"Message validation failed: {error}")
        else:
            cleaned_data['message'] = cleaned_msg
        
        # Validate session_id (optional)
        session_id = request_data.get('session_id')
        if session_id is not None:
            is_valid, error = self.validate_session_id(session_id)
            if not is_valid:
                errors.append(f"Session ID validation failed: {error}")
            else:
                cleaned_data['session_id'] = session_id
        
        # Validate context/filters (optional)
        context = request_data.get('context', {})
        if context:
            is_valid, cleaned_filters, error = self.validate_filters(context)
            if not is_valid:
                errors.append(f"Filter validation failed: {error}")
            else:
                cleaned_data['context'] = cleaned_filters
        
        # Return result
        if errors:
            return (False, {}, errors)
        
        return (True, cleaned_data, [])


# =============================================================================
# SINGLETON INSTANCE
# =============================================================================

# Create global singleton instance
_validator_instance = None

def get_input_validator() -> InputValidator:
    """
    Get singleton instance of InputValidator.
    
    Returns:
        InputValidator instance
    """
    global _validator_instance
    if _validator_instance is None:
        _validator_instance = InputValidator()
    return _validator_instance


# =============================================================================
# CONVENIENCE FUNCTIONS
# =============================================================================

def validate_message(message: str) -> Tuple[bool, str, str]:
    """Convenience function for message validation."""
    return get_input_validator().validate_user_message(message)


def validate_filters(filters: Dict[str, Any]) -> Tuple[bool, Dict[str, Any], str]:
    """Convenience function for filter validation."""
    return get_input_validator().validate_filters(filters)


def validate_session_id(session_id: str) -> Tuple[bool, str]:
    """Convenience function for session ID validation."""
    return get_input_validator().validate_session_id(session_id)


def validate_postal_code(code: str) -> Tuple[bool, str, str]:
    """Convenience function for postal code validation."""
    return get_input_validator().validate_postal_code(code)


def validate_price(price: Any, context: str = 'sale') -> Tuple[bool, str]:
    """Convenience function for price validation."""
    return get_input_validator().validate_price(price, context)
