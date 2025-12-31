"""
Unit tests for the geocoding service.

Tests cover:
- Address geocoding
- Intersection geocoding
- Postal code geocoding
- Neighborhood geocoding
- Error handling and edge cases
- Cache functionality
"""

import pytest
from unittest.mock import Mock, patch, MagicMock
import sys
import os

# Add parent directory to path for imports
sys.path.insert(0, os.path.dirname(os.path.dirname(os.path.abspath(__file__))))

from services.geocoding_service import (
    GeocodingService,
    GeocodingResult,
    GeocodedLocation,
    get_geocoding_service,
    reset_geocoding_service,
)


class TestGeocodedLocation:
    """Tests for GeocodedLocation dataclass"""
    
    def test_geocoded_location_creation(self):
        """Test creating a GeocodedLocation"""
        location = GeocodedLocation(
            latitude=43.6532,
            longitude=-79.3832,
            formatted_address="Toronto, ON, Canada",
            location_type="address",
            confidence=0.95,
            components={"city": "Toronto", "province": "ON"}
        )
        
        assert location.latitude == 43.6532
        assert location.longitude == -79.3832
        assert location.formatted_address == "Toronto, ON, Canada"
        assert location.location_type == "address"
        assert location.confidence == 0.95
        assert location.components["city"] == "Toronto"
    
    def test_geocoded_location_to_dict(self):
        """Test converting GeocodedLocation to dictionary"""
        location = GeocodedLocation(
            latitude=43.6532,
            longitude=-79.3832,
            formatted_address="Toronto, ON, Canada",
            location_type="address",
            confidence=0.95,
            components={"city": "Toronto"}
        )
        
        result = location.to_dict()
        
        assert isinstance(result, dict)
        assert result["latitude"] == 43.6532
        assert result["longitude"] == -79.3832
        assert result["location_type"] == "address"
        assert result["confidence"] == 0.95


class TestGeocodingResult:
    """Tests for GeocodingResult dataclass"""
    
    def test_successful_result(self):
        """Test successful geocoding result"""
        location = GeocodedLocation(
            latitude=43.6532,
            longitude=-79.3832,
            formatted_address="Toronto, ON, Canada",
            location_type="address",
            confidence=0.95,
            components={}
        )
        
        result = GeocodingResult(
            success=True,
            location=location,
            error_message=None,
            attempted_address="100 Queen St, Toronto"
        )
        
        assert result.success is True
        assert result.location is not None
        assert result.error_message is None
    
    def test_failed_result(self):
        """Test failed geocoding result"""
        result = GeocodingResult(
            success=False,
            location=None,
            error_message="Address not found",
            attempted_address="Invalid Address 123"
        )
        
        assert result.success is False
        assert result.location is None
        assert result.error_message == "Address not found"
    
    def test_result_to_dict(self):
        """Test converting GeocodingResult to dictionary"""
        result = GeocodingResult(
            success=False,
            location=None,
            error_message="Not found",
            attempted_address="Test Address"
        )
        
        result_dict = result.to_dict()
        
        assert isinstance(result_dict, dict)
        assert result_dict["success"] is False
        assert result_dict["location"] is None
        assert result_dict["error_message"] == "Not found"


class TestGeocodingService:
    """Tests for GeocodingService class"""
    
    @pytest.fixture
    def service(self):
        """Create a fresh geocoding service instance"""
        reset_geocoding_service()
        return GeocodingService()
    
    @pytest.fixture
    def mock_location(self):
        """Create a mock geopy location object"""
        mock = MagicMock()
        mock.latitude = 43.6532
        mock.longitude = -79.3832
        mock.address = "100 Queen Street West, Toronto, ON, Canada"
        mock.raw = {
            "type": "building",
            "class": "building",
            "importance": 0.8,
            "address": {
                "city": "Toronto",
                "state": "Ontario",
                "postcode": "M5V 1A1",
                "country": "Canada",
                "road": "Queen Street West",
                "house_number": "100"
            }
        }
        return mock
    
    def test_service_initialization(self, service):
        """Test service initializes correctly"""
        assert service.user_agent == "SummitlyRealEstate/1.0"
        assert service.timeout == 10
        assert service.max_retries == 3
        assert service.min_request_interval == 1.0
    
    def test_custom_initialization(self):
        """Test service with custom parameters"""
        service = GeocodingService(
            user_agent="CustomAgent/2.0",
            timeout=5,
            max_retries=5
        )
        
        assert service.user_agent == "CustomAgent/2.0"
        assert service.timeout == 5
        assert service.max_retries == 5
    
    def test_calculate_confidence_address(self, service, mock_location):
        """Test confidence calculation for addresses"""
        confidence = service._calculate_confidence(mock_location, "address")
        
        assert 0.0 <= confidence <= 1.0
        assert confidence > 0.7  # Building type should give high confidence
    
    def test_calculate_confidence_intersection(self, service, mock_location):
        """Test confidence calculation for intersections"""
        mock_location.raw["type"] = "road"
        confidence = service._calculate_confidence(mock_location, "intersection")
        
        assert 0.0 <= confidence <= 1.0
    
    def test_calculate_confidence_postal_code(self, service, mock_location):
        """Test confidence calculation for postal codes"""
        mock_location.raw["type"] = "postcode"
        confidence = service._calculate_confidence(mock_location, "postal_code")
        
        assert 0.0 <= confidence <= 1.0
        assert confidence >= 0.8  # Postcodes should have decent confidence
    
    @patch.object(GeocodingService, '_geocode_with_retry')
    def test_geocode_address_success(self, mock_geocode, service, mock_location):
        """Test successful address geocoding"""
        mock_geocode.return_value = mock_location
        
        result = service.geocode_address("100 Queen St W", "Toronto")
        
        assert result.success is True
        assert result.location is not None
        assert result.location.latitude == 43.6532
        assert result.location.longitude == -79.3832
        assert result.location.location_type == "address"
        assert result.error_message is None
    
    @patch.object(GeocodingService, '_geocode_with_retry')
    def test_geocode_address_not_found(self, mock_geocode, service):
        """Test address not found"""
        mock_geocode.return_value = None
        
        result = service.geocode_address("Nonexistent Address 12345", "Fakecity")
        
        assert result.success is False
        assert result.location is None
        assert result.error_message == "Address not found"
    
    @patch.object(GeocodingService, '_geocode_with_retry')
    def test_geocode_address_error(self, mock_geocode, service):
        """Test geocoding error handling"""
        mock_geocode.side_effect = Exception("Network error")
        
        result = service.geocode_address("100 Queen St", "Toronto")
        
        assert result.success is False
        assert result.location is None
        assert "error" in result.error_message.lower()
    
    @patch.object(GeocodingService, '_geocode_with_retry')
    def test_geocode_intersection_success(self, mock_geocode, service, mock_location):
        """Test successful intersection geocoding"""
        mock_geocode.return_value = mock_location
        
        result = service.geocode_intersection("Yonge Street", "Bloor Street", "Toronto")
        
        assert result.success is True
        assert result.location is not None
        assert result.location.location_type == "intersection"
        assert result.location.components["street1"] == "Yonge Street"
        assert result.location.components["street2"] == "Bloor Street"
    
    @patch.object(GeocodingService, '_geocode_with_retry')
    def test_geocode_intersection_not_found(self, mock_geocode, service):
        """Test intersection not found - tries all formats"""
        mock_geocode.return_value = None
        
        result = service.geocode_intersection("Fake St", "Nonexistent Ave", "Toronto")
        
        assert result.success is False
        assert result.location is None
        assert "not found" in result.error_message.lower()
    
    @patch.object(GeocodingService, '_geocode_with_retry')
    def test_geocode_postal_code_full(self, mock_geocode, service, mock_location):
        """Test geocoding full postal code"""
        mock_geocode.return_value = mock_location
        
        result = service.geocode_postal_code("M5V 1A1")
        
        assert result.success is True
        assert result.location is not None
        assert result.location.location_type == "postal_code"
    
    @patch.object(GeocodingService, '_geocode_with_retry')
    def test_geocode_postal_code_fsa(self, mock_geocode, service, mock_location):
        """Test geocoding FSA postal code"""
        mock_geocode.return_value = mock_location
        
        result = service.geocode_postal_code("M5V")
        
        assert result.success is True
        assert result.location is not None
    
    def test_geocode_postal_code_invalid_format(self, service):
        """Test invalid postal code format"""
        result = service.geocode_postal_code("INVALID")
        
        assert result.success is False
        assert "Invalid postal code format" in result.error_message
    
    @patch.object(GeocodingService, '_geocode_with_retry')
    def test_geocode_neighborhood_success(self, mock_geocode, service, mock_location):
        """Test successful neighborhood geocoding"""
        mock_geocode.return_value = mock_location
        
        result = service.geocode_neighborhood("Liberty Village", "Toronto")
        
        assert result.success is True
        assert result.location is not None
        assert result.location.location_type == "neighborhood"
        assert result.location.components["neighborhood"] == "Liberty Village"
    
    @patch.object(GeocodingService, '_geocode_with_retry')
    def test_geocode_neighborhood_not_found(self, mock_geocode, service):
        """Test neighborhood not found"""
        mock_geocode.return_value = None
        
        result = service.geocode_neighborhood("Fake Neighborhood", "Toronto")
        
        assert result.success is False
        assert "not found" in result.error_message.lower()
    
    def test_cache_functionality(self, service):
        """Test that caching works correctly"""
        # Clear cache first
        service.clear_cache()
        
        # Create a mock result
        location = GeocodedLocation(
            latitude=43.6532,
            longitude=-79.3832,
            formatted_address="Test",
            location_type="address",
            confidence=0.9,
            components={}
        )
        result = GeocodingResult(
            success=True,
            location=location,
            error_message=None,
            attempted_address="Test"
        )
        
        # Cache the result
        cache_key = ("100 Queen St", "Toronto", "Ontario", "Canada")
        service._cache_result(cache_key, result)
        
        # Retrieve from cache
        cached = service._get_cached_result(cache_key)
        
        assert cached is not None
        assert cached.success is True
        assert cached.location.latitude == 43.6532
    
    def test_clear_cache(self, service):
        """Test clearing the cache"""
        # Add something to cache
        cache_key = ("test", "test", "test", "test")
        result = GeocodingResult(
            success=True,
            location=None,
            error_message=None,
            attempted_address="test"
        )
        service._cache_result(cache_key, result)
        
        # Clear cache
        service.clear_cache()
        
        # Should be empty
        assert service._get_cached_result(cache_key) is None


class TestGeocodingServiceSingleton:
    """Tests for singleton pattern"""
    
    def test_get_geocoding_service_singleton(self):
        """Test that get_geocoding_service returns the same instance"""
        reset_geocoding_service()
        
        service1 = get_geocoding_service()
        service2 = get_geocoding_service()
        
        assert service1 is service2
    
    def test_reset_geocoding_service(self):
        """Test resetting the singleton"""
        service1 = get_geocoding_service()
        reset_geocoding_service()
        service2 = get_geocoding_service()
        
        assert service1 is not service2


class TestGeocodingServiceIntegration:
    """
    Integration tests that make real API calls.
    These are marked as slow and can be skipped in CI.
    """
    
    @pytest.fixture
    def live_service(self):
        """Create a service for live testing"""
        reset_geocoding_service()
        return GeocodingService()
    
    @pytest.mark.slow
    @pytest.mark.integration
    def test_geocode_real_toronto_address(self, live_service):
        """Test geocoding a real Toronto address"""
        result = live_service.geocode_address(
            "100 Queen Street West",
            "Toronto",
            "Ontario"
        )
        
        # Should succeed with a location in Toronto area
        if result.success:
            assert result.location is not None
            # Toronto is roughly at 43.65° N, 79.38° W
            assert 43.0 < result.location.latitude < 44.0
            assert -80.0 < result.location.longitude < -79.0
    
    @pytest.mark.slow
    @pytest.mark.integration
    def test_geocode_real_postal_code(self, live_service):
        """Test geocoding a real postal code"""
        result = live_service.geocode_postal_code("M5V 1A1")
        
        if result.success:
            assert result.location is not None
            # Should be in Toronto area
            assert 43.0 < result.location.latitude < 44.0
    
    @pytest.mark.slow
    @pytest.mark.integration
    def test_geocode_real_intersection(self, live_service):
        """Test geocoding a real intersection"""
        result = live_service.geocode_intersection(
            "Yonge Street",
            "Dundas Street",
            "Toronto"
        )
        
        if result.success:
            assert result.location is not None
            assert result.location.location_type == "intersection"


if __name__ == "__main__":
    pytest.main([__file__, "-v", "-m", "not slow"])
