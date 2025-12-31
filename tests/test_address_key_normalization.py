"""
Test suite for address key normalization functionality.

Tests the conversion of user address input into Repliers-compatible 
addressKey format with proper normalization rules.

Author: Summitly Team
Date: December 20, 2025
"""

import logging
import sys
import os

# Add the parent directory to Python path
sys.path.insert(0, os.path.dirname(os.path.dirname(os.path.abspath(__file__))))

from services.address_key_normalizer import get_address_key_normalizer
from services.address_intent_detector import AddressComponents


# Test cases for address normalization
TEST_NORMALIZATION_CASES = [
    {
        'description': 'Complete address with unit',
        'components': AddressComponents(
            street_number='55',
            street_name='Bamburgh',
            street_suffix='Circle',
            unit_number='1209',
            city='Toronto'
        ),
        'expected_exact_key': '120955bamburghcircletoronto',
        'expected_street_key': 'bamburghcircletoronto',
        'expected_confidence': 1.0
    },
    {
        'description': 'Address without unit',
        'components': AddressComponents(
            street_number='123',
            street_name='Main',
            street_suffix='Street',
            city='Toronto'
        ),
        'expected_exact_key': '123mainstreettoronto',
        'expected_street_key': 'mainstreettoronto',
        'expected_confidence': 0.8
    },
    {
        'description': 'Street-level only',
        'components': AddressComponents(
            street_name='King',
            street_suffix='St',
            city='Toronto'
        ),
        'expected_exact_key': None,
        'expected_street_key': 'kingstreettoronto',
        'expected_confidence': 0.5
    },
    {
        'description': 'Complex street name',
        'components': AddressComponents(
            street_number='789',
            street_name='Queen Street',
            street_suffix='West',
            city='Toronto'
        ),
        'expected_exact_key': '789queenstreetwesttoronto',
        'expected_street_key': 'queenstreetwesttoronto',
        'expected_confidence': 0.8
    },
    {
        'description': 'Different city',
        'components': AddressComponents(
            street_number='456',
            street_name='Dundas',
            street_suffix='St',
            city='Mississauga'
        ),
        'expected_exact_key': '456dundasstreetmississauga',
        'expected_street_key': 'dundasstreetmississauga',
        'expected_confidence': 0.8
    }
]

USER_INPUT_TEST_CASES = [
    {
        'input': '55 Bamburgh Circle unit 1209',
        'current_location': 'Toronto',
        'expected_exact_key': '120955bamburghcircletoronto',
        'expected_street_key': 'bamburghcircletoronto'
    },
    {
        'input': 'properties on King Street',
        'current_location': 'Toronto', 
        'expected_exact_key': None,
        'expected_street_key': 'kingstreettoronto'
    },
    {
        'input': '123 Main Ave apartment 4B',
        'current_location': 'Mississauga',
        'expected_exact_key': '4b123mainavenuemississauga',
        'expected_street_key': 'mainavenuemississauga'
    }
]


class TestAddressKeyNormalizer:
    """Test suite for address key normalization."""
    
    def setup_method(self):
        """Setup for each test method."""
        self.normalizer = get_address_key_normalizer()
    
    def test_address_component_normalization(self):
        """Test normalization of AddressComponents objects."""
        for case in TEST_NORMALIZATION_CASES:
            result = self.normalizer.normalize_address(case['components'])
            
            # Test exact address key
            if case['expected_exact_key']:
                assert result.exact_address_key == case['expected_exact_key'], \
                       f"Wrong exact key for {case['description']}"
            else:
                assert result.exact_address_key is None, \
                       f"Should not have exact key for {case['description']}"
            
            # Test street address key
            if case['expected_street_key']:
                assert result.street_address_key == case['expected_street_key'], \
                       f"Wrong street key for {case['description']}"
            else:
                assert result.street_address_key is None, \
                       f"Should not have street key for {case['description']}"
            
            # Test confidence
            assert result.confidence >= case['expected_confidence'] - 0.1, \
                   f"Low confidence for {case['description']}: {result.confidence}"
    
    def test_city_normalization(self):
        """Test city name normalization."""
        city_tests = [
            ('Toronto', 'toronto'),
            ('toronto', 'toronto'),
            ('Mississauga', 'mississauga'),
            ('Richmond Hill', 'richmondhill'),
            ('Halton Hills', 'haltonhills'),
            ('King City', 'kingcity'),
            ('Unknown City', 'unknowncity')  # Fallback case
        ]
        
        for input_city, expected_normalized in city_tests:
            result = self.normalizer._normalize_city(input_city)
            assert result == expected_normalized, \
                   f"City normalization failed: {input_city} -> {result} (expected {expected_normalized})"
    
    def test_street_suffix_normalization(self):
        """Test street suffix normalization."""
        suffix_tests = [
            ('Street', 'street'),
            ('St', 'street'),
            ('Avenue', 'avenue'),
            ('Ave', 'avenue'),
            ('Road', 'road'),
            ('Rd', 'road'),
            ('Drive', 'drive'),
            ('Dr', 'drive'),
            ('Circle', 'circle'),
            ('Cir', 'circle'),
            ('Boulevard', 'boulevard'),
            ('Blvd', 'boulevard'),
            ('Crescent', 'crescent'),
            ('Cr', 'crescent'),
            ('Court', 'court'),
            ('Ct', 'court'),
            ('Lane', 'lane'),
            ('Ln', 'lane')
        ]
        
        for input_suffix, expected_normalized in suffix_tests:
            result = self.normalizer._normalize_street_suffix(input_suffix)
            assert result == expected_normalized, \
                   f"Suffix normalization failed: {input_suffix} -> {result} (expected {expected_normalized})"
    
    def test_street_name_normalization(self):
        """Test street name normalization."""
        name_tests = [
            ('Main', 'main'),
            ('King Street', 'kingstreet'),
            ('Queen St E', 'queenste'),  # E becomes lowercase e, then removed by regex - just 'te' remains
            ('Bay-Adelaide', 'bayadelaide'),  # Hyphens removed
            ('St. Clair', 'stclair'),  # Periods removed
            ('O\'Connor', 'oconnor')  # Apostrophes removed
        ]
        
        for input_name, expected_normalized in name_tests:
            result = self.normalizer._normalize_street_name(input_name)
            assert result == expected_normalized, \
                   f"Street name normalization failed: {input_name} -> {result} (expected {expected_normalized})"
    
    def test_unit_normalization(self):
        """Test unit number normalization."""
        unit_tests = [
            ('1209', '1209'),
            ('4B', '4b'),
            ('2A', '2a'),
            ('PH-1', 'ph1'),  # Hyphen removed
            ('Suite 305', 'suite305')  # Spaces removed
        ]
        
        for input_unit, expected_normalized in unit_tests:
            result = self.normalizer._normalize_unit(input_unit)
            assert result == expected_normalized, \
                   f"Unit normalization failed: {input_unit} -> {result} (expected {expected_normalized})"
    
    def test_user_input_normalization(self):
        """Test normalization directly from user input."""
        for case in USER_INPUT_TEST_CASES:
            result = self.normalizer.normalize_from_user_input(
                case['input'],
                case['current_location']
            )
            
            # Test exact address key
            if case['expected_exact_key']:
                assert result.exact_address_key == case['expected_exact_key'], \
                       f"Wrong exact key for input: {case['input']}"
            else:
                assert result.exact_address_key is None, \
                       f"Should not have exact key for input: {case['input']}"
            
            # Test street address key
            if case['expected_street_key']:
                assert result.street_address_key == case['expected_street_key'], \
                       f"Wrong street key for input: {case['input']}"
    
    def test_search_query_generation(self):
        """Test search query fallback generation."""
        components = AddressComponents(
            street_number='55',
            street_name='Bamburgh',
            street_suffix='Circle',
            unit_number='1209'
        )
        
        query = self.normalizer._create_search_query(components)
        expected = "55 Bamburgh Circle"
        assert query == expected, f"Wrong search query: {query} (expected {expected})"
    
    def test_confidence_calculation(self):
        """Test confidence score calculation."""
        # High confidence: complete address with unit
        high_conf_components = AddressComponents(
            street_number='55',
            street_name='Bamburgh',
            street_suffix='Circle',
            unit_number='1209'
        )
        result = self.normalizer.normalize_address(high_conf_components)
        assert result.confidence >= 0.9, f"Should have high confidence: {result.confidence}"
        
        # Also high confidence: address without unit (has exact address key)
        med_conf_components = AddressComponents(
            street_number='55',
            street_name='Bamburgh', 
            street_suffix='Circle'
        )
        result = self.normalizer.normalize_address(med_conf_components)
        assert result.confidence >= 0.8, f"Should have high confidence for exact address: {result.confidence}"
        
        # Lower confidence: street only
        low_conf_components = AddressComponents(
            street_name='Bamburgh',
            street_suffix='Circle'
        )
        result = self.normalizer.normalize_address(low_conf_components)
        assert result.confidence <= 0.7, f"Should have lower confidence for street only: {result.confidence}"
    
    def test_edge_cases(self):
        """Test edge cases and error handling."""
        # Empty components
        empty_components = AddressComponents()
        result = self.normalizer.normalize_address(empty_components)
        assert result.confidence == 0.0, "Empty components should have zero confidence"
        assert result.exact_address_key is None, "Empty components should not have exact key"
        assert result.street_address_key is None, "Empty components should not have street key"
        
        # Missing required fields
        incomplete_components = AddressComponents(street_name='Main')  # Missing suffix
        result = self.normalizer.normalize_address(incomplete_components)
        assert result.confidence == 0.0, "Incomplete components should have zero confidence"
        
        # Special characters in components
        special_components = AddressComponents(
            street_number='55-A',
            street_name='St. Clair',
            street_suffix='Ave',
            unit_number='PH-1'
        )
        result = self.normalizer.normalize_address(special_components, force_city='Toronto')
        assert result.exact_address_key is not None, "Should handle special characters"
        assert 'ph1' in result.exact_address_key, "Should normalize unit with special chars"
        assert 'stclair' in result.exact_address_key, "Should normalize street name with special chars"
    
    def test_force_city_override(self):
        """Test forcing city in normalization."""
        components = AddressComponents(
            street_number='55',
            street_name='Main',
            street_suffix='St',
            city='Original'
        )
        
        result = self.normalizer.normalize_address(components, force_city='Toronto')
        assert 'toronto' in result.exact_address_key, "Should use forced city"
        assert 'original' not in result.exact_address_key, "Should not use original city"


if __name__ == "__main__":
    # Run tests
    import sys
    sys.path.insert(0, "/Users/shreyashdanke/Desktop/Main/Summitly Backend")
    
    # Configure logging
    logging.basicConfig(level=logging.INFO)
    
    # Run specific tests
    test_suite = TestAddressKeyNormalizer()
    test_suite.setup_method()
    
    print("🧪 Running Address Key Normalization Tests...")
    
    try:
        test_suite.test_address_component_normalization()
        print("✅ Address component normalization tests passed")
        
        test_suite.test_city_normalization()
        print("✅ City normalization tests passed")
        
        test_suite.test_street_suffix_normalization()
        print("✅ Street suffix normalization tests passed")
        
        test_suite.test_street_name_normalization()
        print("✅ Street name normalization tests passed")
        
        test_suite.test_unit_normalization()
        print("✅ Unit normalization tests passed")
        
        test_suite.test_user_input_normalization()
        print("✅ User input normalization tests passed")
        
        test_suite.test_search_query_generation()
        print("✅ Search query generation tests passed")
        
        test_suite.test_confidence_calculation()
        print("✅ Confidence calculation tests passed")
        
        test_suite.test_edge_cases()
        print("✅ Edge case tests passed")
        
        test_suite.test_force_city_override()
        print("✅ Force city override tests passed")
        
        print("\n🎉 All address key normalization tests passed!")
        
    except AssertionError as e:
        print(f"❌ Test failed: {e}")
        sys.exit(1)
    except Exception as e:
        print(f"❌ Unexpected error: {e}")
        sys.exit(1)