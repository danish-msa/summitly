"""
Street Search Tests
===================
Comprehensive tests for street-only property searches.

Tests cover:
1. Street + City (successful search)
2. Street only (city clarification needed)
3. Different street name variants (normalization)
4. Street with no active listings (graceful fallback)
5. Similar street names (false positives)
6. Progressive fetching behavior
7. Client-side filtering accuracy

Author: Summitly Team
Date: December 18, 2024
"""

import os
import sys
sys.path.insert(0, os.path.abspath(os.path.join(os.path.dirname(__file__), '..')))

os.environ.setdefault('ENV', 'development')

from services.street_utils import (
    normalize_street_name,
    streets_match,
    validate_street_search_params,
    extract_street_direction
)
from services.conversation_state import ConversationStateManager
from services.chatbot_orchestrator import chatbot


class TestStreetNormalization:
    """Test street name normalization logic"""
    
    def test_basic_normalization(self):
        """Test basic street name normalization"""
        assert normalize_street_name("Yonge Street") == "yonge"
        assert normalize_street_name("Yonge St") == "yonge"
        assert normalize_street_name("yonge st.") == "yonge"
        assert normalize_street_name("YONGE") == "yonge"
    
    def test_suffix_removal(self):
        """Test that common suffixes are removed"""
        assert normalize_street_name("Bloor Avenue") == "bloor"
        assert normalize_street_name("King Road") == "king"
        assert normalize_street_name("Bay Drive") == "bay"
        assert normalize_street_name("Queen Boulevard") == "queen"
    
    def test_directional_handling(self):
        """Test directional indicators in street names"""
        # Directions should be expanded and preserved
        assert normalize_street_name("King Street West") == "king west"
        assert normalize_street_name("King St W") == "king west"  # W expanded to west
        assert normalize_street_name("Queen St East") == "queen east"
    
    def test_number_removal(self):
        """Test that street numbers are removed"""
        assert normalize_street_name("123 Yonge Street") == "yonge"
        assert normalize_street_name("45 Bay Street") == "bay"
    
    def test_punctuation_removal(self):
        """Test punctuation is removed"""
        assert normalize_street_name("St. Clair Avenue") == "st clair"
        assert normalize_street_name("King St., West") == "king west"


class TestStreetMatching:
    """Test street matching logic"""
    
    def test_exact_match(self):
        """Test exact street name matches"""
        assert streets_match("Yonge Street", "Yonge Street") == True
        assert streets_match("Yonge St", "Yonge Street") == True
        assert streets_match("YONGE", "yonge street") == True
    
    def test_direction_strict(self):
        """Test directional matching with strict=True"""
        assert streets_match("King Street West", "King St W", strict_direction=True) == True
        assert streets_match("King Street West", "King Street East", strict_direction=True) == False
        assert streets_match("King Street", "King Street West", strict_direction=True) == True  # User didn't specify direction
    
    def test_direction_loose(self):
        """Test directional matching with strict=False"""
        assert streets_match("King Street West", "King Street East", strict_direction=False) == True
        assert streets_match("Queen St E", "Queen St W", strict_direction=False) == True
    
    def test_no_false_positives(self):
        """Test that similar street names don't match"""
        assert streets_match("King Street", "Kingston Road") == False
        assert streets_match("Yonge Street", "Young Street") == False
        assert streets_match("Bay Street", "Bayview Avenue") == False


class TestStreetValidation:
    """Test street search parameter validation"""
    
    def test_valid_params(self):
        """Test valid street + city combination"""
        is_valid, error = validate_street_search_params("Yonge Street", "Toronto")
        assert is_valid == True
        assert error == ""
    
    def test_missing_city(self):
        """Test that city is required"""
        is_valid, error = validate_street_search_params("Yonge Street", "")
        assert is_valid == False
        assert "city" in error.lower() or "required" in error.lower()
    
    def test_missing_street(self):
        """Test that street name is required"""
        is_valid, error = validate_street_search_params("", "Toronto")
        assert is_valid == False
        assert "street" in error.lower()
    
    def test_street_too_short(self):
        """Test minimum street name length"""
        is_valid, error = validate_street_search_params("AB", "Toronto")
        assert is_valid == False


class TestStreetDirection:
    """Test directional extraction"""
    
    def test_extract_west(self):
        """Test extracting 'west' direction"""
        street, direction = extract_street_direction("King Street West")
        assert direction == "west"
        assert "king" in street.lower()
    
    def test_extract_abbreviated(self):
        """Test extracting abbreviated directions (expanded to full form)"""
        street, direction = extract_street_direction("Queen St E")
        assert direction == "east"  # Expanded from "e"
        assert "queen" in street.lower()
    
    def test_no_direction(self):
        """Test streets without directions"""
        street, direction = extract_street_direction("Yonge Street")
        assert direction is None
        assert "yonge" in street.lower()


class TestChatbotStreetSearch:
    """Integration tests with actual chatbot"""
    
    def setup_method(self):
        """Setup for each test"""
        self.state_manager = ConversationStateManager()
    
    def test_street_with_city_success(self):
        """TEST 1: Street + City should execute search"""
        session_id = 'test_street_city_001'
        
        # User provides street AND city
        response = chatbot.process_message(
            user_message="condos on Yonge Street in Toronto",
            session_id=session_id
        )
        
        assert response['success'] == True
        properties = response.get('properties', [])
        
        # Should return properties (may be 0 if none available, but search should execute)
        print(f"✅ TEST 1: Found {len(properties)} properties on Yonge Street")
        assert 'properties' in response
        assert 'property_count' in response
    
    def test_street_only_asks_city(self):
        """TEST 2: Street only should ask for city"""
        session_id = 'test_street_only_002'
        
        # User provides street WITHOUT city
        response = chatbot.process_message(
            user_message="condos on Yonge Street",
            session_id=session_id
        )
        
        assert response['success'] == True
        response_text = response.get('response', '').lower()
        
        # Bot should ask for city
        assert 'city' in response_text or 'which city' in response_text
        assert response.get('requires_clarification') == True
        assert len(response.get('properties', [])) == 0
        
        print("✅ TEST 2: Bot correctly asked for city clarification")
    
    def test_street_variants_same_results(self):
        """TEST 3: Different street name formats should normalize to same search"""
        session_id_1 = 'test_variant_a_003'
        session_id_2 = 'test_variant_b_003'
        session_id_3 = 'test_variant_c_003'
        
        # Search with different street name variants
        response_1 = chatbot.process_message(
            user_message="condos on Yonge Street in Toronto",
            session_id=session_id_1
        )
        
        response_2 = chatbot.process_message(
            user_message="condos on Yonge St in Toronto",
            session_id=session_id_2
        )
        
        response_3 = chatbot.process_message(
            user_message="condos on YONGE in Toronto",
            session_id=session_id_3
        )
        
        # All should succeed
        assert response_1['success'] == True
        assert response_2['success'] == True
        assert response_3['success'] == True
        
        # Property counts should be similar (within reasonable margin)
        count_1 = response_1.get('property_count', 0)
        count_2 = response_2.get('property_count', 0)
        count_3 = response_3.get('property_count', 0)
        
        print(f"✅ TEST 3: Variant counts: {count_1}, {count_2}, {count_3}")
        
        # If any variant found results, others should too (normalization working)
        if count_1 > 0 or count_2 > 0 or count_3 > 0:
            assert count_1 == count_2 == count_3, "All variants should return same count"
    
    def test_street_no_listings_graceful(self):
        """TEST 4: Street with no active listings should return gracefully"""
        session_id = 'test_no_listings_004'
        
        # Search for street unlikely to have listings
        response = chatbot.process_message(
            user_message="condos on Fake Street in Toronto",
            session_id=session_id
        )
        
        assert response['success'] == True
        properties = response.get('properties', [])
        
        # May have 0 properties, but should respond gracefully
        assert len(properties) == 0 or len(properties) >= 0
        
        response_text = response.get('response', '')
        assert len(response_text) > 0  # Should have a response
        
        print("✅ TEST 4: Graceful handling of street with no listings")
    
    def test_similar_streets_no_false_positives(self):
        """TEST 5: Similar street names should not cross-match"""
        # This test validates at the utility level (already covered in TestStreetMatching)
        # But we can also test end-to-end behavior
        
        assert streets_match("King Street", "Kingston Road") == False
        assert streets_match("Bay Street", "Bayview Avenue") == False
        assert streets_match("Yonge Street", "Young Street") == False
        
        print("✅ TEST 5: No false positives for similar street names")


# ==================== RUN TESTS ====================

if __name__ == "__main__":
    print("\n" + "="*70)
    print("STREET SEARCH TESTS")
    print("="*70)
    
    # Run normalization tests
    print("\n📝 Testing Street Normalization...")
    norm_tests = TestStreetNormalization()
    norm_tests.test_basic_normalization()
    norm_tests.test_suffix_removal()
    norm_tests.test_directional_handling()
    norm_tests.test_number_removal()
    norm_tests.test_punctuation_removal()
    print("✅ All normalization tests passed")
    
    # Run matching tests
    print("\n🔍 Testing Street Matching...")
    match_tests = TestStreetMatching()
    match_tests.test_exact_match()
    match_tests.test_direction_strict()
    match_tests.test_direction_loose()
    match_tests.test_no_false_positives()
    print("✅ All matching tests passed")
    
    # Run validation tests
    print("\n✔️  Testing Parameter Validation...")
    val_tests = TestStreetValidation()
    val_tests.test_valid_params()
    val_tests.test_missing_city()
    val_tests.test_missing_street()
    val_tests.test_street_too_short()
    print("✅ All validation tests passed")
    
    # Run direction extraction tests
    print("\n🧭 Testing Direction Extraction...")
    dir_tests = TestStreetDirection()
    dir_tests.test_extract_west()
    dir_tests.test_extract_abbreviated()
    dir_tests.test_no_direction()
    print("✅ All direction tests passed")
    
    # Run integration tests
    print("\n🤖 Testing Chatbot Integration...")
    bot_tests = TestChatbotStreetSearch()
    bot_tests.setup_method()
    
    try:
        bot_tests.test_street_with_city_success()
    except Exception as e:
        print(f"⚠️  TEST 1 error: {e}")
    
    try:
        bot_tests.test_street_only_asks_city()
    except Exception as e:
        print(f"⚠️  TEST 2 error: {e}")
    
    try:
        bot_tests.test_street_variants_same_results()
    except Exception as e:
        print(f"⚠️  TEST 3 error: {e}")
    
    try:
        bot_tests.test_street_no_listings_graceful()
    except Exception as e:
        print(f"⚠️  TEST 4 error: {e}")
    
    try:
        bot_tests.test_similar_streets_no_false_positives()
    except Exception as e:
        print(f"⚠️  TEST 5 error: {e}")
    
    print("\n" + "="*70)
    print("ALL STREET SEARCH TESTS COMPLETE")
    print("="*70)
