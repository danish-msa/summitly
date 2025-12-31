"""
Unit tests for LocationContextManager

Tests cover:
- Location detection (postal codes, addresses, intersections, neighborhoods)
- Context management
- Validation
- Integration with geocoding and postal code services
"""

import pytest
from unittest.mock import Mock, patch, MagicMock
import sys
import os

sys.path.insert(0, os.path.dirname(os.path.dirname(os.path.abspath(__file__))))

from services.location_context_manager import (
    LocationContextManager,
    LocationContext,
    LocationType,
    get_location_context_manager,
    reset_location_context_manager,
)
from services.postal_code_service import PostalCodeInfo
from services.geocoding_service import GeocodingResult, GeocodedLocation


class TestLocationContext:
    """Tests for LocationContext dataclass"""
    
    def test_location_context_creation(self):
        """Test creating a LocationContext"""
        context = LocationContext(
            location_type=LocationType.POSTAL_CODE,
            raw_input="Show me homes in M5V",
            postal_code="M5V",
            fsa="M5V",
            city="Toronto",
            province="ON",
            search_radius_km=1.5,
            is_validated=True
        )
        
        assert context.location_type == LocationType.POSTAL_CODE
        assert context.postal_code == "M5V"
        assert context.city == "Toronto"
    
    def test_location_context_to_dict(self):
        """Test converting LocationContext to dictionary"""
        context = LocationContext(
            location_type=LocationType.ADDRESS,
            raw_input="100 Queen St Toronto",
            street_address="100 Queen St",
            city="Toronto"
        )
        
        result = context.to_dict()
        
        assert isinstance(result, dict)
        assert result['location_type'] == 'address'
        assert result['street_address'] == "100 Queen St"


class TestLocationContextManager:
    """Tests for LocationContextManager"""
    
    @pytest.fixture
    def manager(self):
        """Create a fresh manager instance"""
        reset_location_context_manager()
        return LocationContextManager()
    
    @pytest.fixture
    def mock_postal_info(self):
        """Create mock postal code info"""
        return PostalCodeInfo(
            code="M5V",
            fsa="M5V",
            is_full=False,
            city="Toronto",
            province="ON",
            is_urban=True
        )
    
    @pytest.fixture
    def mock_geocoded_location(self):
        """Create mock geocoded location"""
        return GeocodedLocation(
            latitude=43.6532,
            longitude=-79.3832,
            formatted_address="Toronto, ON, Canada",
            location_type="postal_code",
            confidence=0.90,
            components={'city': 'Toronto', 'province': 'Ontario'}
        )
    
    def test_manager_initialization(self, manager):
        """Test manager initializes correctly"""
        assert manager.geocoding_service is not None
        assert manager.postal_code_service is not None
        assert manager.current_location is None
    
    @patch('services.location_context_manager.get_postal_code_service')
    @patch('services.location_context_manager.get_geocoding_service')
    def test_detect_postal_code(self, mock_geo_service, mock_postal_service, manager):
        """Test postal code detection in message"""
        # Setup mocks
        mock_postal_svc = Mock()
        mock_postal_info = PostalCodeInfo(
            code="M5V",
            fsa="M5V",
            is_full=False,
            city="Toronto",
            province="ON",
            is_urban=True
        )
        mock_postal_svc.detect_postal_code_in_text.return_value = mock_postal_info
        mock_postal_svc.get_fsa_radius.return_value = 1.5
        
        mock_geo_svc = Mock()
        mock_geo_result = GeocodingResult(
            success=True,
            location=GeocodedLocation(
                latitude=43.6532,
                longitude=-79.3832,
                formatted_address="Toronto, ON",
                location_type="postal_code",
                confidence=0.9,
                components={}
            ),
            error_message=None,
            attempted_address="M5V"
        )
        mock_geo_svc.geocode_postal_code.return_value = mock_geo_result
        
        manager.postal_code_service = mock_postal_svc
        manager.geocoding_service = mock_geo_svc
        
        # Test detection
        context = manager.detect_location_in_message("Show me condos in M5V")
        
        assert context is not None
        assert context.location_type == LocationType.POSTAL_CODE
        assert context.postal_code == "M5V"
        assert context.fsa == "M5V"
        assert context.city == "Toronto"
        assert context.latitude == 43.6532
        assert context.longitude == -79.3832
    
    @patch('services.location_context_manager.get_postal_code_service')
    def test_detect_postal_code_not_found(self, mock_postal_service, manager):
        """Test postal code detection when none present"""
        mock_postal_svc = Mock()
        mock_postal_svc.detect_postal_code_in_text.return_value = None
        manager.postal_code_service = mock_postal_svc
        
        context = manager.detect_location_in_message("Show me condos in Toronto")
        
        # Should not be postal code type (might be None or other type)
        if context:
            assert context.location_type != LocationType.POSTAL_CODE
    
    def test_detect_street_address_pattern(self, manager):
        """Test street address pattern detection"""
        messages = [
            "100 Queen Street West Toronto",
            "at 55 Bloor Street",
            "near 123 Main Street, Mississauga",
        ]
        
        for message in messages:
            # Just test that pattern matching works
            # Actual geocoding will be mocked in integration tests
            result = manager._detect_street_address(message)
            # May or may not succeed depending on geocoding, just ensure no crash
            assert result is None or isinstance(result, LocationContext)
    
    def test_detect_intersection_pattern(self, manager):
        """Test intersection pattern detection"""
        messages = [
            "Yonge and Bloor",
            "King St and Bay St",
            "at Queen & University",
        ]
        
        for message in messages:
            result = manager._detect_intersection(message)
            assert result is None or isinstance(result, LocationContext)
    
    def test_extract_city_from_message(self, manager):
        """Test city extraction"""
        assert manager._extract_city_from_message("condos in Toronto") == "Toronto"
        assert manager._extract_city_from_message("houses in Mississauga") == "Mississauga"
        assert manager._extract_city_from_message("Vancouver properties") == "Vancouver"
        assert manager._extract_city_from_message("random text") is None
    
    def test_set_and_get_location_context(self, manager):
        """Test setting and getting location context"""
        context = LocationContext(
            location_type=LocationType.POSTAL_CODE,
            raw_input="M5V",
            postal_code="M5V"
        )
        
        manager.set_location_context(context)
        retrieved = manager.get_location_context()
        
        assert retrieved is not None
        assert retrieved.postal_code == "M5V"
    
    def test_clear_location_context(self, manager):
        """Test clearing location context"""
        context = LocationContext(
            location_type=LocationType.POSTAL_CODE,
            raw_input="M5V",
            postal_code="M5V"
        )
        
        manager.set_location_context(context)
        assert manager.get_location_context() is not None
        
        manager.clear_location_context()
        assert manager.get_location_context() is None
    
    def test_get_search_radius_with_context(self, manager):
        """Test getting search radius with context set"""
        context = LocationContext(
            location_type=LocationType.POSTAL_CODE,
            raw_input="M5V",
            postal_code="M5V",
            search_radius_km=1.5
        )
        
        manager.set_location_context(context)
        radius = manager.get_search_radius()
        
        assert radius == 1.5
    
    def test_get_search_radius_without_context(self, manager):
        """Test getting search radius without context"""
        radius = manager.get_search_radius()
        assert radius == 5.0  # Default
    
    def test_get_lat_lng_with_context(self, manager):
        """Test getting lat/lng with context set"""
        context = LocationContext(
            location_type=LocationType.ADDRESS,
            raw_input="100 Queen St",
            latitude=43.6532,
            longitude=-79.3832
        )
        
        manager.set_location_context(context)
        lat_lng = manager.get_lat_lng()
        
        assert lat_lng is not None
        assert lat_lng == (43.6532, -79.3832)
    
    def test_get_lat_lng_without_context(self, manager):
        """Test getting lat/lng without context"""
        lat_lng = manager.get_lat_lng()
        assert lat_lng is None
    
    def test_format_location_for_voice_postal_code(self, manager):
        """Test voice formatting for postal code"""
        context = LocationContext(
            location_type=LocationType.POSTAL_CODE,
            raw_input="M5V",
            postal_code="M5V",
            city="Toronto"
        )
        
        manager.set_location_context(context)
        voice_text = manager.format_location_for_voice()
        
        assert "postal code" in voice_text.lower()
        assert "M5V" in voice_text
        assert "Toronto" in voice_text
    
    def test_format_location_for_voice_address(self, manager):
        """Test voice formatting for address"""
        context = LocationContext(
            location_type=LocationType.ADDRESS,
            raw_input="100 Queen St W",
            street_address="100 Queen St W",
            formatted_address="100 Queen Street West, Toronto, ON"
        )
        
        manager.set_location_context(context)
        voice_text = manager.format_location_for_voice()
        
        assert "address" in voice_text.lower()
    
    def test_format_location_for_voice_no_context(self, manager):
        """Test voice formatting without context"""
        voice_text = manager.format_location_for_voice()
        assert voice_text == "No location set"
    
    @patch('services.location_context_manager.get_postal_code_service')
    def test_validate_postal_city_match_valid(self, mock_postal_service, manager):
        """Test postal code/city validation - valid match"""
        mock_postal_svc = Mock()
        mock_postal_svc.validate_city_for_postal_code.return_value = (True, None)
        manager.postal_code_service = mock_postal_svc
        
        result = manager.validate_postal_city_match("M5V", "Toronto")
        
        assert result['valid'] is True
        assert "matches" in result['message'].lower()
    
    @patch('services.location_context_manager.get_postal_code_service')
    def test_validate_postal_city_match_invalid(self, mock_postal_service, manager):
        """Test postal code/city validation - mismatch"""
        mock_postal_svc = Mock()
        mock_postal_svc.validate_city_for_postal_code.return_value = (False, "Toronto")
        manager.postal_code_service = mock_postal_svc
        
        result = manager.validate_postal_city_match("M5V", "Mississauga")
        
        assert result['valid'] is False
        assert result['correct_city'] == "Toronto"
        assert "belongs to" in result['message'].lower()


class TestLocationContextManagerSingleton:
    """Tests for singleton pattern"""
    
    def test_get_location_context_manager_singleton(self):
        """Test that function returns same instance"""
        reset_location_context_manager()
        
        manager1 = get_location_context_manager()
        manager2 = get_location_context_manager()
        
        assert manager1 is manager2
    
    def test_reset_location_context_manager(self):
        """Test resetting the singleton"""
        manager1 = get_location_context_manager()
        reset_location_context_manager()
        manager2 = get_location_context_manager()
        
        assert manager1 is not manager2


class TestLocationContextManagerIntegration:
    """Integration tests with real services (marked slow)"""
    
    @pytest.fixture
    def live_manager(self):
        """Create manager for live testing"""
        reset_location_context_manager()
        return LocationContextManager()
    
    @pytest.mark.slow
    @pytest.mark.integration
    def test_detect_real_postal_code(self, live_manager):
        """Test detecting a real postal code"""
        context = live_manager.detect_location_in_message("Show me condos in M5V 1A1")
        
        if context:
            assert context.location_type == LocationType.POSTAL_CODE
            assert context.postal_code is not None
            # Geocoding might succeed or fail depending on API
    
    @pytest.mark.slow
    @pytest.mark.integration
    def test_detect_real_address(self, live_manager):
        """Test detecting a real address"""
        context = live_manager.detect_location_in_message("properties at 100 Queen Street West Toronto")
        
        # May or may not succeed depending on geocoding API
        if context:
            assert context.location_type in [LocationType.ADDRESS, LocationType.POSTAL_CODE]


if __name__ == "__main__":
    pytest.main([__file__, "-v", "-m", "not slow"])
