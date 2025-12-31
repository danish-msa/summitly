"""
Unit Tests for InputValidator
==============================
Comprehensive tests for input validation and sanitization.

Author: Summitly Team
Date: December 22, 2025
"""

import pytest
from services.input_validator import (
    InputValidator,
    get_input_validator,
    validate_message,
    validate_filters,
    validate_session_id,
    validate_postal_code,
    validate_price,
    ValidationError,
)


class TestUserMessageValidation:
    """Test suite for user message validation."""
    
    def test_valid_message(self):
        """Test validation of valid messages."""
        validator = InputValidator()
        
        # Simple valid message
        is_valid, cleaned, error = validator.validate_user_message("Hello world")
        assert is_valid is True
        assert cleaned == "Hello world"
        assert error == ""
    
    def test_message_with_whitespace(self):
        """Test message cleaning with extra whitespace."""
        validator = InputValidator()
        
        # Leading/trailing whitespace
        is_valid, cleaned, error = validator.validate_user_message("  hello  ")
        assert is_valid is True
        assert cleaned == "hello"
        assert error == ""
        
        # Multiple spaces
        is_valid, cleaned, error = validator.validate_user_message("hello    world")
        assert is_valid is True
        assert cleaned == "hello world"
        assert error == ""
    
    def test_empty_message(self):
        """Test rejection of empty messages."""
        validator = InputValidator()
        
        # Empty string
        is_valid, cleaned, error = validator.validate_user_message("")
        assert is_valid is False
        assert cleaned == ""
        assert "empty" in error.lower()
        
        # Only whitespace
        is_valid, cleaned, error = validator.validate_user_message("   ")
        assert is_valid is False
        assert cleaned == ""
        assert "empty" in error.lower()
    
    def test_none_message(self):
        """Test rejection of None message."""
        validator = InputValidator()
        
        is_valid, cleaned, error = validator.validate_user_message(None)
        assert is_valid is False
        assert cleaned == ""
        assert "None" in error
    
    def test_non_string_message(self):
        """Test rejection of non-string messages."""
        validator = InputValidator()
        
        # Integer
        is_valid, cleaned, error = validator.validate_user_message(123)
        assert is_valid is False
        assert "string" in error.lower()
        
        # List
        is_valid, cleaned, error = validator.validate_user_message(["hello"])
        assert is_valid is False
        assert "string" in error.lower()
    
    def test_message_length_limits(self):
        """Test message length validation."""
        validator = InputValidator()
        
        # Too long (over 2000 chars)
        long_msg = "x" * 5000
        is_valid, cleaned, error = validator.validate_user_message(long_msg)
        assert is_valid is False
        assert "2000" in error
        
        # At limit (2000 chars)
        at_limit = "x" * 2000
        is_valid, cleaned, error = validator.validate_user_message(at_limit)
        assert is_valid is True
        
        # Just under limit
        under_limit = "x" * 1999
        is_valid, cleaned, error = validator.validate_user_message(under_limit)
        assert is_valid is True
    
    def test_control_character_removal(self):
        """Test removal of control characters."""
        validator = InputValidator()
        
        # Control characters (should be removed)
        message_with_control = "hello\x00\x01world\x1F"
        is_valid, cleaned, error = validator.validate_user_message(message_with_control)
        assert is_valid is True
        assert "\x00" not in cleaned
        assert "\x01" not in cleaned
        assert "\x1F" not in cleaned
    
    def test_utf8_encoding(self):
        """Test UTF-8 encoding validation."""
        validator = InputValidator()
        
        # Valid UTF-8 (emoji, special chars)
        is_valid, cleaned, error = validator.validate_user_message("Hello 🏠 world")
        assert is_valid is True
        assert "🏠" in cleaned


class TestFilterValidation:
    """Test suite for filter validation."""
    
    def test_valid_filters(self):
        """Test validation of valid filter sets."""
        validator = InputValidator()
        
        # Complete valid filter set
        filters = {
            'bedrooms': 3,
            'bathrooms': 2,
            'min_price': 300000,
            'max_price': 800000,
            'listing_type': 'sale',
            'property_type': 'condo',
            'location': 'Toronto',
            'amenities': ['pool', 'gym']
        }
        is_valid, cleaned, error = validator.validate_filters(filters)
        assert is_valid is True
        assert cleaned['bedrooms'] == 3
        assert cleaned['bathrooms'] == 2
        assert error == ""
    
    def test_none_filters(self):
        """Test handling of None filters."""
        validator = InputValidator()
        
        is_valid, cleaned, error = validator.validate_filters(None)
        assert is_valid is True
        assert cleaned == {}
    
    def test_empty_filters(self):
        """Test handling of empty filter dict."""
        validator = InputValidator()
        
        is_valid, cleaned, error = validator.validate_filters({})
        assert is_valid is True
        assert cleaned == {}
    
    def test_room_count_validation(self):
        """Test bedroom/bathroom count validation."""
        validator = InputValidator()
        
        # Valid room counts
        for count in [0, 1, 3, 8]:
            is_valid, cleaned, error = validator.validate_filters({'bedrooms': count})
            assert is_valid is True
            assert cleaned['bedrooms'] == count
        
        # Invalid room counts (too high)
        is_valid, cleaned, error = validator.validate_filters({'bedrooms': 15})
        assert is_valid is False
        assert "0 and 8" in error
        
        # Invalid room counts (negative)
        is_valid, cleaned, error = validator.validate_filters({'bedrooms': -1})
        assert is_valid is False
    
    def test_price_validation(self):
        """Test price filter validation."""
        validator = InputValidator()
        
        # Valid prices
        is_valid, cleaned, error = validator.validate_filters({
            'min_price': 300000,
            'max_price': 800000
        })
        assert is_valid is True
        assert cleaned['min_price'] == 300000
        assert cleaned['max_price'] == 800000
        
        # Invalid price range (max < min)
        is_valid, cleaned, error = validator.validate_filters({
            'min_price': 800000,
            'max_price': 300000
        })
        assert is_valid is False
        assert "greater than or equal to" in error.lower()
        
        # String prices (should be converted)
        is_valid, cleaned, error = validator.validate_filters({
            'min_price': '300000',
            'max_price': '800,000'
        })
        assert is_valid is True
        assert cleaned['min_price'] == 300000
        assert cleaned['max_price'] == 800000
    
    def test_listing_type_validation(self):
        """Test listing type validation."""
        validator = InputValidator()
        
        # Valid listing types
        for listing_type in ['sale', 'rent', 'SALE', 'Rent']:
            is_valid, cleaned, error = validator.validate_filters({
                'listing_type': listing_type
            })
            assert is_valid is True
            assert cleaned['listing_type'].lower() in ['sale', 'rent']
        
        # Invalid listing type
        is_valid, cleaned, error = validator.validate_filters({
            'listing_type': 'lease-to-own'
        })
        assert is_valid is False
    
    def test_property_type_validation(self):
        """Test property type validation."""
        validator = InputValidator()
        
        # Valid property types
        for prop_type in ['house', 'condo', 'townhouse']:
            is_valid, cleaned, error = validator.validate_filters({
                'property_type': prop_type
            })
            assert is_valid is True
            assert cleaned['property_type'] == prop_type
    
    def test_amenities_validation(self):
        """Test amenities list validation."""
        validator = InputValidator()
        
        # Valid amenities
        is_valid, cleaned, error = validator.validate_filters({
            'amenities': ['pool', 'gym', 'parking']
        })
        assert is_valid is True
        assert len(cleaned['amenities']) == 3
        
        # Empty amenities
        is_valid, cleaned, error = validator.validate_filters({
            'amenities': []
        })
        assert is_valid is True
        assert cleaned['amenities'] == []
        
        # None amenities
        is_valid, cleaned, error = validator.validate_filters({
            'amenities': None
        })
        assert is_valid is True
        assert cleaned['amenities'] == []
    
    def test_location_validation(self):
        """Test location field validation."""
        validator = InputValidator()
        
        # Valid location
        is_valid, cleaned, error = validator.validate_filters({
            'location': 'Toronto'
        })
        assert is_valid is True
        assert cleaned['location'] == 'Toronto'
        
        # Empty location string
        is_valid, cleaned, error = validator.validate_filters({
            'location': '   '
        })
        assert is_valid is False
        assert "empty" in error.lower()


class TestSessionIdValidation:
    """Test suite for session ID validation."""
    
    def test_valid_session_ids(self):
        """Test validation of valid session IDs."""
        validator = InputValidator()
        
        # UUID format
        is_valid, error = validator.validate_session_id(
            "550e8400-e29b-41d4-a716-446655440000"
        )
        assert is_valid is True
        assert error == ""
        
        # Alphanumeric with underscore
        is_valid, error = validator.validate_session_id("user_123_session")
        assert is_valid is True
        
        # Alphanumeric with hyphen
        is_valid, error = validator.validate_session_id("session-abc-123")
        assert is_valid is True
    
    def test_invalid_session_ids(self):
        """Test rejection of invalid session IDs."""
        validator = InputValidator()
        
        # Path traversal attempt
        is_valid, error = validator.validate_session_id("../../../etc/passwd")
        assert is_valid is False
        assert "invalid characters" in error.lower()
        
        # Too long
        is_valid, error = validator.validate_session_id("a" * 150)
        assert is_valid is False
        assert "maximum length" in error.lower()
        
        # Special characters
        is_valid, error = validator.validate_session_id("session@#$%")
        assert is_valid is False
        
        # None
        is_valid, error = validator.validate_session_id(None)
        assert is_valid is False
        assert "None" in error
        
        # Empty
        is_valid, error = validator.validate_session_id("")
        assert is_valid is False
        assert "empty" in error.lower()


class TestPostalCodeValidation:
    """Test suite for Canadian postal code validation."""
    
    def test_valid_postal_codes(self):
        """Test validation of valid Canadian postal codes."""
        validator = InputValidator()
        
        # With space
        is_valid, normalized, error = validator.validate_postal_code("M5V 3A8")
        assert is_valid is True
        assert normalized == "M5V 3A8"
        assert error == ""
        
        # Without space
        is_valid, normalized, error = validator.validate_postal_code("M5V3A8")
        assert is_valid is True
        assert normalized == "M5V 3A8"
        
        # Lowercase (should be normalized)
        is_valid, normalized, error = validator.validate_postal_code("m5v 3a8")
        assert is_valid is True
        assert normalized == "M5V 3A8"
        
        # Mixed case
        is_valid, normalized, error = validator.validate_postal_code("m5V3a8")
        assert is_valid is True
        assert normalized == "M5V 3A8"
    
    def test_invalid_postal_codes(self):
        """Test rejection of invalid postal codes."""
        validator = InputValidator()
        
        # US ZIP code
        is_valid, normalized, error = validator.validate_postal_code("12345")
        assert is_valid is False
        assert "invalid" in error.lower()
        
        # Too short
        is_valid, normalized, error = validator.validate_postal_code("M5V")
        assert is_valid is False
        
        # Wrong pattern (numbers where letters should be)
        is_valid, normalized, error = validator.validate_postal_code("123456")
        assert is_valid is False
        
        # None
        is_valid, normalized, error = validator.validate_postal_code(None)
        assert is_valid is False
        assert "None" in error
        
        # Empty
        is_valid, normalized, error = validator.validate_postal_code("")
        assert is_valid is False
        assert "empty" in error.lower()


class TestPriceValidation:
    """Test suite for context-aware price validation."""
    
    def test_valid_sale_prices(self):
        """Test validation of valid sale prices."""
        validator = InputValidator()
        
        # Normal sale prices
        for price in [100000, 500000, 1000000, 5000000]:
            is_valid, error = validator.validate_price(price, 'sale')
            assert is_valid is True
            assert error == ""
        
        # At maximum
        is_valid, error = validator.validate_price(50_000_000, 'sale')
        assert is_valid is True
    
    def test_invalid_sale_prices(self):
        """Test rejection of invalid sale prices."""
        validator = InputValidator()
        
        # Exceeds maximum
        is_valid, error = validator.validate_price(100_000_000, 'sale')
        assert is_valid is False
        assert "50,000,000" in error
        
        # Negative
        is_valid, error = validator.validate_price(-100000, 'sale')
        assert is_valid is False
        assert "negative" in error.lower()
    
    def test_valid_rent_prices(self):
        """Test validation of valid rent prices."""
        validator = InputValidator()
        
        # Normal rent prices
        for price in [1000, 2000, 3500, 5000]:
            is_valid, error = validator.validate_price(price, 'rent')
            assert is_valid is True
            assert error == ""
        
        # At maximum
        is_valid, error = validator.validate_price(10_000, 'rent')
        assert is_valid is True
    
    def test_invalid_rent_prices(self):
        """Test rejection of invalid rent prices."""
        validator = InputValidator()
        
        # Exceeds maximum
        is_valid, error = validator.validate_price(50_000, 'rent')
        assert is_valid is False
        assert "10,000" in error
    
    def test_none_price(self):
        """Test handling of None price (valid - no filter)."""
        validator = InputValidator()
        
        is_valid, error = validator.validate_price(None, 'sale')
        assert is_valid is True
        assert error == ""
    
    def test_price_string_conversion(self):
        """Test conversion of string prices."""
        validator = InputValidator()
        
        # With commas
        is_valid, error = validator.validate_price("750,000", 'sale')
        assert is_valid is True
        
        # With dollar sign
        is_valid, error = validator.validate_price("$750000", 'sale')
        assert is_valid is True


class TestChatRequestValidation:
    """Test suite for complete chat request validation."""
    
    def test_valid_chat_request(self):
        """Test validation of valid chat request."""
        validator = InputValidator()
        
        request = {
            'message': 'Show me condos in Toronto',
            'session_id': 'user-123',
            'context': {
                'bedrooms': 2,
                'listing_type': 'sale'
            }
        }
        
        is_valid, cleaned, errors = validator.validate_chat_request(request)
        assert is_valid is True
        assert cleaned['message'] == 'Show me condos in Toronto'
        assert cleaned['session_id'] == 'user-123'
        assert len(errors) == 0
    
    def test_missing_message(self):
        """Test rejection when message is missing."""
        validator = InputValidator()
        
        request = {'session_id': 'user-123'}
        
        is_valid, cleaned, errors = validator.validate_chat_request(request)
        assert is_valid is False
        assert len(errors) > 0
        assert any('message' in err.lower() for err in errors)
    
    def test_invalid_filters_in_context(self):
        """Test rejection when context filters are invalid."""
        validator = InputValidator()
        
        request = {
            'message': 'Show me properties',
            'context': {
                'bedrooms': 15  # Invalid - too high
            }
        }
        
        is_valid, cleaned, errors = validator.validate_chat_request(request)
        assert is_valid is False
        assert any('bedroom' in err.lower() for err in errors)


class TestSingletonAndConvenienceFunctions:
    """Test suite for singleton instance and convenience functions."""
    
    def test_singleton_instance(self):
        """Test that get_input_validator returns the same instance."""
        validator1 = get_input_validator()
        validator2 = get_input_validator()
        
        assert validator1 is validator2
    
    def test_convenience_functions(self):
        """Test convenience wrapper functions."""
        
        # validate_message
        is_valid, cleaned, error = validate_message("hello")
        assert is_valid is True
        assert cleaned == "hello"
        
        # validate_filters
        is_valid, cleaned, error = validate_filters({'bedrooms': 3})
        assert is_valid is True
        
        # validate_session_id
        is_valid, error = validate_session_id("session-123")
        assert is_valid is True
        
        # validate_postal_code
        is_valid, normalized, error = validate_postal_code("M5V3A8")
        assert is_valid is True
        assert normalized == "M5V 3A8"
        
        # validate_price
        is_valid, error = validate_price(750000, 'sale')
        assert is_valid is True


class TestEdgeCases:
    """Test suite for edge cases and security scenarios."""
    
    def test_sql_injection_patterns(self):
        """Test that SQL injection patterns are handled safely."""
        validator = InputValidator()
        
        # SQL injection attempts should still be valid messages
        # (they'll be parameterized later, but message itself is valid)
        is_valid, cleaned, error = validator.validate_user_message(
            "'; DROP TABLE users; --"
        )
        assert is_valid is True
        # The actual SQL injection protection happens in the database layer
    
    def test_xss_patterns(self):
        """Test that XSS patterns are handled safely."""
        validator = InputValidator()
        
        # XSS attempts should be valid messages
        # (they'll be escaped later when rendering)
        is_valid, cleaned, error = validator.validate_user_message(
            "<script>alert('xss')</script>"
        )
        assert is_valid is True
    
    def test_unicode_normalization(self):
        """Test Unicode character handling."""
        validator = InputValidator()
        
        # Various Unicode characters
        is_valid, cleaned, error = validator.validate_user_message(
            "Café résumé naïve"
        )
        assert is_valid is True
        assert "Café" in cleaned
    
    def test_very_long_valid_message(self):
        """Test message at exactly the maximum length."""
        validator = InputValidator()
        
        # Exactly 2000 characters
        message = "a" * 2000
        is_valid, cleaned, error = validator.validate_user_message(message)
        assert is_valid is True
        assert len(cleaned) == 2000


if __name__ == '__main__':
    pytest.main([__file__, '-v'])
