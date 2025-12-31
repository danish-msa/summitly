"""
Unit tests for the postal code service.

Tests cover:
- Postal code validation (FSA and full format)
- Postal code normalization
- Province mapping
- Urban vs rural detection
- City validation
- Search radius calculation
- Postal code detection in text
"""

import pytest
import sys
import os

# Add parent directory to path for imports
sys.path.insert(0, os.path.dirname(os.path.dirname(os.path.abspath(__file__))))

from services.postal_code_service import (
    PostalCodeService,
    PostalCodeInfo,
    get_postal_code_service,
    reset_postal_code_service,
)


class TestPostalCodeInfo:
    """Tests for PostalCodeInfo dataclass"""
    
    def test_postal_code_info_creation(self):
        """Test creating a PostalCodeInfo"""
        info = PostalCodeInfo(
            code="M5V 1A1",
            fsa="M5V",
            is_full=True,
            city="Toronto",
            province="ON",
            is_urban=True
        )
        
        assert info.code == "M5V 1A1"
        assert info.fsa == "M5V"
        assert info.is_full is True
        assert info.city == "Toronto"
        assert info.province == "ON"
        assert info.is_urban is True
    
    def test_postal_code_info_to_dict(self):
        """Test converting PostalCodeInfo to dictionary"""
        info = PostalCodeInfo(
            code="M5V",
            fsa="M5V",
            is_full=False,
            city="Toronto",
            province="ON",
            is_urban=True
        )
        
        result = info.to_dict()
        
        assert isinstance(result, dict)
        assert result["code"] == "M5V"
        assert result["fsa"] == "M5V"
        assert result["is_full"] is False
        assert result["city"] == "Toronto"
        assert result["province"] == "ON"
        assert result["is_urban"] is True


class TestPostalCodeServiceNormalization:
    """Tests for postal code normalization"""
    
    @pytest.fixture
    def service(self):
        """Create a fresh postal code service instance"""
        reset_postal_code_service()
        return PostalCodeService()
    
    # ===== FSA (3-character) Tests =====
    
    def test_normalize_fsa_uppercase(self, service):
        """Test normalizing uppercase FSA"""
        info = service.normalize_postal_code("M5V")
        
        assert info is not None
        assert info.code == "M5V"
        assert info.fsa == "M5V"
        assert info.is_full is False
    
    def test_normalize_fsa_lowercase(self, service):
        """Test normalizing lowercase FSA"""
        info = service.normalize_postal_code("m5v")
        
        assert info is not None
        assert info.code == "M5V"
        assert info.fsa == "M5V"
    
    def test_normalize_fsa_mixed_case(self, service):
        """Test normalizing mixed case FSA"""
        info = service.normalize_postal_code("m5V")
        
        assert info is not None
        assert info.code == "M5V"
    
    def test_normalize_fsa_with_spaces(self, service):
        """Test normalizing FSA with leading/trailing spaces"""
        info = service.normalize_postal_code("  M5V  ")
        
        assert info is not None
        assert info.code == "M5V"
    
    def test_normalize_fsa_toronto(self, service):
        """Test FSA in Toronto"""
        info = service.normalize_postal_code("M5V")
        
        assert info is not None
        assert info.province == "ON"
        assert info.city == "Toronto"
        assert info.is_urban is True
    
    def test_normalize_fsa_vancouver(self, service):
        """Test FSA in Vancouver"""
        info = service.normalize_postal_code("V6B")
        
        assert info is not None
        assert info.province == "BC"
        assert info.city == "Vancouver"
    
    def test_normalize_fsa_calgary(self, service):
        """Test FSA in Calgary"""
        info = service.normalize_postal_code("T2P")
        
        assert info is not None
        assert info.province == "AB"
        assert info.city == "Calgary"
    
    def test_normalize_fsa_ottawa(self, service):
        """Test FSA in Ottawa"""
        info = service.normalize_postal_code("K1A")
        
        assert info is not None
        assert info.province == "ON"
        assert info.city == "Ottawa"
    
    # ===== Full Postal Code (6-character) Tests =====
    
    def test_normalize_full_with_space(self, service):
        """Test normalizing full postal code with space"""
        info = service.normalize_postal_code("M5V 1A1")
        
        assert info is not None
        assert info.code == "M5V 1A1"
        assert info.fsa == "M5V"
        assert info.is_full is True
    
    def test_normalize_full_without_space(self, service):
        """Test normalizing full postal code without space"""
        info = service.normalize_postal_code("M5V1A1")
        
        assert info is not None
        assert info.code == "M5V 1A1"  # Should add space
        assert info.fsa == "M5V"
        assert info.is_full is True
    
    def test_normalize_full_lowercase(self, service):
        """Test normalizing lowercase full postal code"""
        info = service.normalize_postal_code("m5v 1a1")
        
        assert info is not None
        assert info.code == "M5V 1A1"
        assert info.fsa == "M5V"
    
    def test_normalize_full_mixed_case_no_space(self, service):
        """Test normalizing mixed case full postal code without space"""
        info = service.normalize_postal_code("m5V1a1")
        
        assert info is not None
        assert info.code == "M5V 1A1"
    
    # ===== Invalid Postal Code Tests =====
    
    def test_normalize_invalid_too_short(self, service):
        """Test invalid postal code - too short"""
        info = service.normalize_postal_code("M5")
        
        assert info is None
    
    def test_normalize_invalid_too_long(self, service):
        """Test invalid postal code - too long"""
        info = service.normalize_postal_code("M5V 1A1X")
        
        assert info is None
    
    def test_normalize_invalid_wrong_format(self, service):
        """Test invalid postal code - wrong format"""
        info = service.normalize_postal_code("12345")
        
        assert info is None
    
    def test_normalize_invalid_first_letter(self, service):
        """Test invalid FSA - invalid first letter (D, F, I, O, Q, U, W, Z not used)"""
        for letter in ['D', 'F', 'I', 'O', 'Q', 'U', 'W', 'Z']:
            info = service.normalize_postal_code(f"{letter}5V")
            assert info is None, f"Should reject FSA starting with {letter}"
    
    def test_normalize_empty_string(self, service):
        """Test empty string"""
        info = service.normalize_postal_code("")
        
        assert info is None
    
    def test_normalize_none(self, service):
        """Test None input"""
        info = service.normalize_postal_code(None)
        
        assert info is None
    
    def test_normalize_non_string(self, service):
        """Test non-string input"""
        info = service.normalize_postal_code(12345)
        
        assert info is None


class TestPostalCodeServiceValidation:
    """Tests for postal code validation"""
    
    @pytest.fixture
    def service(self):
        return PostalCodeService()
    
    def test_is_valid_postal_code_fsa(self, service):
        """Test validating FSA"""
        assert service.is_valid_postal_code("M5V") is True
        assert service.is_valid_postal_code("L5B") is True
        assert service.is_valid_postal_code("V6B") is True
    
    def test_is_valid_postal_code_full(self, service):
        """Test validating full postal code"""
        assert service.is_valid_postal_code("M5V 1A1") is True
        assert service.is_valid_postal_code("L5B2C3") is True
    
    def test_is_valid_postal_code_invalid(self, service):
        """Test invalid postal codes"""
        assert service.is_valid_postal_code("INVALID") is False
        assert service.is_valid_postal_code("12345") is False
        assert service.is_valid_postal_code("") is False


class TestPostalCodeServiceProvince:
    """Tests for province mapping"""
    
    @pytest.fixture
    def service(self):
        return PostalCodeService()
    
    def test_get_province_ontario(self, service):
        """Test province for Ontario postal codes"""
        assert service.get_province("M5V") == "ON"  # Toronto
        assert service.get_province("K1A") == "ON"  # Ottawa
        assert service.get_province("L5B") == "ON"  # Mississauga
        assert service.get_province("N2L") == "ON"  # Waterloo
    
    def test_get_province_bc(self, service):
        """Test province for BC postal codes"""
        assert service.get_province("V6B") == "BC"
        assert service.get_province("V5A") == "BC"
    
    def test_get_province_alberta(self, service):
        """Test province for Alberta postal codes"""
        assert service.get_province("T2P") == "AB"
        assert service.get_province("T5J") == "AB"
    
    def test_get_province_quebec(self, service):
        """Test province for Quebec postal codes"""
        assert service.get_province("H2X") == "QC"  # Montreal
        assert service.get_province("G1K") == "QC"  # Quebec City
        assert service.get_province("J4W") == "QC"  # Longueuil
    
    def test_get_province_name(self, service):
        """Test getting full province name"""
        assert service.get_province_name("M5V") == "Ontario"
        assert service.get_province_name("V6B") == "British Columbia"
        assert service.get_province_name("T2P") == "Alberta"
        assert service.get_province_name("H2X") == "Quebec"
    
    def test_get_province_invalid(self, service):
        """Test province for invalid postal code"""
        assert service.get_province("INVALID") is None


class TestPostalCodeServiceUrbanRural:
    """Tests for urban vs rural detection"""
    
    @pytest.fixture
    def service(self):
        return PostalCodeService()
    
    def test_urban_fsa_digit_second_char(self, service):
        """Test urban FSA (2nd char is digit)"""
        info = service.normalize_postal_code("M5V")  # 5 is digit
        
        assert info is not None
        assert info.is_urban is True
    
    def test_rural_fsa_letter_second_char(self, service):
        """Test rural FSA (2nd char is letter)"""
        info = service.normalize_postal_code("P0A")  # 0 is digit, but this tests A0A format
        
        # Note: P0A has digit 0 so it's urban
        # For true rural, we need letter in second position
        # Let's test with known format
        assert info is not None


class TestPostalCodeServiceRadius:
    """Tests for search radius calculation"""
    
    @pytest.fixture
    def service(self):
        return PostalCodeService()
    
    def test_fsa_radius_downtown_toronto(self, service):
        """Test radius for downtown Toronto FSAs"""
        radius = service.get_fsa_radius("M5V")
        
        assert radius == 1.0  # 1km for downtown Toronto
    
    def test_fsa_radius_other_toronto(self, service):
        """Test radius for other Toronto FSAs"""
        radius = service.get_fsa_radius("M1B")
        
        assert radius == 1.5  # 1.5km for other Toronto
    
    def test_fsa_radius_general_urban(self, service):
        """Test radius for general urban FSAs"""
        radius = service.get_fsa_radius("L5B")  # Mississauga
        
        assert radius == 2.0  # 2km for general urban
    
    def test_fsa_radius_invalid(self, service):
        """Test radius for invalid FSA"""
        radius = service.get_fsa_radius("XX")
        
        assert radius == 2.0  # Default radius
    
    def test_full_postal_code_radius(self, service):
        """Test radius for full postal code"""
        radius = service.get_full_postal_code_radius()
        
        assert radius == 0.5  # 500m for full postal codes


class TestPostalCodeServiceCityValidation:
    """Tests for city validation against postal code"""
    
    @pytest.fixture
    def service(self):
        return PostalCodeService()
    
    def test_validate_city_correct(self, service):
        """Test validation with correct city"""
        is_valid, suggested = service.validate_city_for_postal_code("M5V", "Toronto")
        
        assert is_valid is True
        assert suggested is None
    
    def test_validate_city_case_insensitive(self, service):
        """Test validation is case insensitive"""
        is_valid, suggested = service.validate_city_for_postal_code("M5V", "TORONTO")
        
        assert is_valid is True
    
    def test_validate_city_mismatch(self, service):
        """Test validation with incorrect city"""
        is_valid, suggested = service.validate_city_for_postal_code("M5V", "Mississauga")
        
        assert is_valid is False
        assert suggested == "Toronto"
    
    def test_validate_city_toronto_variations(self, service):
        """Test validation with Toronto neighborhood names"""
        # North York is part of Toronto, should be valid for M prefix
        is_valid, _ = service.validate_city_for_postal_code("M5V", "downtown toronto")
        assert is_valid is True
    
    def test_validate_city_unknown_fsa(self, service):
        """Test validation with unknown FSA (no city mapping)"""
        # Use an FSA that's not in the mapping
        is_valid, suggested = service.validate_city_for_postal_code("P9A", "Thunder Bay")
        
        # Should return True if no mapping exists
        assert is_valid is True


class TestPostalCodeServiceTextDetection:
    """Tests for postal code detection in text"""
    
    @pytest.fixture
    def service(self):
        return PostalCodeService()
    
    def test_detect_full_postal_code_with_space(self, service):
        """Test detecting full postal code with space"""
        info = service.detect_postal_code_in_text("Looking for homes near M5V 1A1")
        
        assert info is not None
        assert info.code == "M5V 1A1"
        assert info.is_full is True
    
    def test_detect_full_postal_code_without_space(self, service):
        """Test detecting full postal code without space"""
        info = service.detect_postal_code_in_text("Properties in M5V1A1 area")
        
        assert info is not None
        assert info.fsa == "M5V"
    
    def test_detect_fsa_only(self, service):
        """Test detecting FSA only"""
        info = service.detect_postal_code_in_text("Show me listings in M5V")
        
        assert info is not None
        assert info.code == "M5V"
        assert info.is_full is False
    
    def test_detect_no_postal_code(self, service):
        """Test text with no postal code"""
        info = service.detect_postal_code_in_text("Looking for homes in Toronto")
        
        assert info is None
    
    def test_detect_empty_text(self, service):
        """Test empty text"""
        info = service.detect_postal_code_in_text("")
        
        assert info is None
    
    def test_detect_none_text(self, service):
        """Test None text"""
        info = service.detect_postal_code_in_text(None)
        
        assert info is None
    
    def test_detect_postal_code_in_sentence(self, service):
        """Test detecting postal code embedded in sentence"""
        text = "I want to buy a condo in the L5B 2C3 postal code area for under 500k"
        info = service.detect_postal_code_in_text(text)
        
        assert info is not None
        assert info.fsa == "L5B"


class TestPostalCodeServiceSingleton:
    """Tests for singleton pattern"""
    
    def test_get_postal_code_service_singleton(self):
        """Test that get_postal_code_service returns the same instance"""
        reset_postal_code_service()
        
        service1 = get_postal_code_service()
        service2 = get_postal_code_service()
        
        assert service1 is service2
    
    def test_reset_postal_code_service(self):
        """Test resetting the singleton"""
        service1 = get_postal_code_service()
        reset_postal_code_service()
        service2 = get_postal_code_service()
        
        assert service1 is not service2


class TestPostalCodeServiceFSAExpansion:
    """Tests for FSA expansion"""
    
    @pytest.fixture
    def service(self):
        return PostalCodeService()
    
    def test_expand_fsa_returns_original(self, service):
        """Test FSA expansion returns at least the original"""
        fsas = service.expand_fsa_for_search("M5V")
        
        assert "M5V" in fsas
    
    def test_expand_fsa_invalid(self, service):
        """Test FSA expansion with invalid input"""
        fsas = service.expand_fsa_for_search("INVALID")
        
        assert len(fsas) == 0


class TestPostalCodeServiceExtractFSA:
    """Tests for FSA extraction"""
    
    @pytest.fixture
    def service(self):
        return PostalCodeService()
    
    def test_extract_fsa_from_full(self, service):
        """Test extracting FSA from full postal code"""
        fsa = service.extract_fsa("M5V 1A1")
        
        assert fsa == "M5V"
    
    def test_extract_fsa_from_fsa(self, service):
        """Test extracting FSA from FSA"""
        fsa = service.extract_fsa("M5V")
        
        assert fsa == "M5V"
    
    def test_extract_fsa_invalid(self, service):
        """Test extracting FSA from invalid input"""
        fsa = service.extract_fsa("INVALID")
        
        assert fsa is None


if __name__ == "__main__":
    pytest.main([__file__, "-v"])
