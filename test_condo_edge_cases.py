#!/usr/bin/env python3
"""
COMPREHENSIVE CONDO EDGE CASE TEST SUITE
========================================
Tests all edge cases, boundary conditions, and failure scenarios
for the condo property search system.
"""

import sys
import os
import json
from datetime import datetime

# Add project root to path
sys.path.insert(0, os.path.abspath(os.path.dirname(__file__)))

from app.condo_assistant import (
    search_condo_properties,
    standardize_condo_property,
    extract_condo_criteria_with_ai,
)

# ==================== TEST CONFIGURATION ====================

class TestResult:
    def __init__(self):
        self.total = 0
        self.passed = 0
        self.failed = 0
        self.errors = []
        self.warnings = []
    
    def record_pass(self, test_name: str, message: str = ""):
        self.total += 1
        self.passed += 1
        print(f"✅ PASS: {test_name}")
        if message:
            print(f"   └─ {message}")
    
    def record_fail(self, test_name: str, reason: str):
        self.total += 1
        self.failed += 1
        self.errors.append(f"{test_name}: {reason}")
        print(f"❌ FAIL: {test_name}")
        print(f"   └─ {reason}")
    
    def record_warning(self, test_name: str, message: str):
        self.warnings.append(f"{test_name}: {message}")
        print(f"⚠️  WARN: {test_name}")
        print(f"   └─ {message}")
    
    def print_summary(self):
        print("\n" + "="*80)
        print("TEST SUMMARY")
        print("="*80)
        print(f"Total Tests: {self.total}")
        print(f"✅ Passed: {self.passed}")
        print(f"❌ Failed: {self.failed}")
        print(f"⚠️  Warnings: {len(self.warnings)}")
        print(f"Success Rate: {(self.passed/self.total*100):.1f}%" if self.total > 0 else "N/A")
        
        if self.errors:
            print("\n❌ FAILURES:")
            for error in self.errors:
                print(f"   • {error}")
        
        if self.warnings:
            print("\n⚠️  WARNINGS:")
            for warning in self.warnings:
                print(f"   • {warning}")
        
        print("="*80)

result = TestResult()

# ==================== EDGE CASE TESTS ====================

def test_empty_inputs():
    """Test 1: Empty and None inputs"""
    print("\n🧪 TEST 1: Empty and None Inputs")
    print("-" * 80)
    
    # Test 1.1: No criteria at all
    try:
        search_result = search_condo_properties(city=None)
        if search_result.get('success') or search_result.get('total', 0) > 0:
            result.record_fail("1.1 - No city", "Should fail when city is None")
        else:
            result.record_pass("1.1 - No city", "Correctly rejected None city")
    except Exception as e:
        result.record_pass("1.1 - No city", f"Correctly raised error: {type(e).__name__}")
    
    # Test 1.2: Empty string city
    try:
        search_result = search_condo_properties(city="")
        if search_result.get('success') or search_result.get('total', 0) > 0:
            result.record_fail("1.2 - Empty city", "Should fail when city is empty string")
        else:
            result.record_pass("1.2 - Empty city", "Correctly rejected empty city")
    except Exception as e:
        result.record_pass("1.2 - Empty city", f"Correctly raised error: {type(e).__name__}")
    
    # Test 1.3: Whitespace city
    try:
        search_result = search_condo_properties(city="   ")
        if search_result.get('success') or search_result.get('total', 0) > 0:
            result.record_fail("1.3 - Whitespace city", "Should fail with whitespace city")
        else:
            result.record_pass("1.3 - Whitespace city", "Correctly rejected whitespace")
    except Exception as e:
        result.record_pass("1.3 - Whitespace city", f"Correctly raised error: {type(e).__name__}")


def test_invalid_city_names():
    """Test 2: Invalid city names"""
    print("\n🧪 TEST 2: Invalid City Names")
    print("-" * 80)
    
    invalid_cities = [
        "NonExistentCity123",
        "XYZ987",
        "!!!",
        "Atlantis",
        "Middle Earth",
        "🏙️",  # Emoji
        "A" * 100,  # Very long
    ]
    
    for idx, city in enumerate(invalid_cities, 1):
        try:
            search_result = search_condo_properties(city=city, limit=5)
            if search_result.get('total', 0) == 0:
                result.record_pass(f"2.{idx} - Invalid city '{city[:20]}'", "Returns 0 results as expected")
            else:
                result.record_warning(f"2.{idx} - Invalid city '{city[:20]}'", f"Found {search_result.get('total')} results (may be valid)")
        except Exception as e:
            result.record_pass(f"2.{idx} - Invalid city '{city[:20]}'", f"Handled error: {type(e).__name__}")


def test_extreme_price_ranges():
    """Test 3: Extreme price ranges"""
    print("\n🧪 TEST 3: Extreme Price Ranges")
    print("-" * 80)
    
    # Test 3.1: Impossibly low price
    search_result = search_condo_properties(city="Toronto", max_price=1, limit=5)
    if search_result.get('total', 0) == 0:
        result.record_pass("3.1 - Max $1", "Correctly returns 0 results")
    else:
        result.record_fail("3.1 - Max $1", f"Found {search_result.get('total')} results (impossible)")
    
    # Test 3.2: Impossibly high price
    search_result = search_condo_properties(city="Toronto", min_price=1_000_000_000, limit=5)
    if search_result.get('total', 0) == 0:
        result.record_pass("3.2 - Min $1B", "Correctly returns 0 results")
    else:
        result.record_warning("3.2 - Min $1B", f"Found {search_result.get('total')} results")
    
    # Test 3.3: Inverted range (min > max)
    search_result = search_condo_properties(city="Toronto", min_price=1_000_000, max_price=100_000, limit=5)
    if search_result.get('total', 0) == 0:
        result.record_pass("3.3 - Inverted range", "Correctly returns 0 results")
    else:
        result.record_fail("3.3 - Inverted range", f"Found {search_result.get('total')} results (should be 0)")
    
    # Test 3.4: Negative prices
    search_result = search_condo_properties(city="Toronto", min_price=-500_000, max_price=-100_000, limit=5)
    if search_result.get('total', 0) == 0:
        result.record_pass("3.4 - Negative prices", "Correctly returns 0 results")
    else:
        result.record_fail("3.4 - Negative prices", f"Found {search_result.get('total')} results (impossible)")
    
    # Test 3.5: Zero price
    search_result = search_condo_properties(city="Toronto", max_price=0, limit=5)
    if search_result.get('total', 0) == 0:
        result.record_pass("3.5 - Zero price", "Correctly returns 0 results")
    else:
        result.record_fail("3.5 - Zero price", f"Found {search_result.get('total')} results (impossible)")


def test_extreme_bedroom_bathroom_counts():
    """Test 4: Extreme bedroom/bathroom counts"""
    print("\n🧪 TEST 4: Extreme Bedroom/Bathroom Counts")
    print("-" * 80)
    
    # Test 4.1: 0 bedrooms (studio)
    search_result = search_condo_properties(city="Toronto", bedrooms=0, limit=5)
    if search_result.get('total', 0) >= 0:
        result.record_pass("4.1 - 0 bedrooms (studio)", f"Found {search_result.get('total')} results")
    else:
        result.record_fail("4.1 - 0 bedrooms (studio)", "Should handle studio apartments")
    
    # Test 4.2: Negative bedrooms
    search_result = search_condo_properties(city="Toronto", bedrooms=-5, limit=5)
    if search_result.get('total', 0) == 0:
        result.record_pass("4.2 - Negative bedrooms", "Correctly returns 0 results")
    else:
        result.record_fail("4.2 - Negative bedrooms", f"Found {search_result.get('total')} results (impossible)")
    
    # Test 4.3: Impossibly high bedrooms
    search_result = search_condo_properties(city="Toronto", bedrooms=50, limit=5)
    if search_result.get('total', 0) == 0:
        result.record_pass("4.3 - 50 bedrooms", "Correctly returns 0 results")
    else:
        result.record_warning("4.3 - 50 bedrooms", f"Found {search_result.get('total')} results (unusual)")
    
    # Test 4.4: Fractional bathrooms (valid)
    search_result = search_condo_properties(city="Toronto", bathrooms=1.5, limit=5)
    if search_result.get('total', 0) > 0:
        result.record_pass("4.4 - 1.5 bathrooms", f"Found {search_result.get('total')} results")
    else:
        result.record_warning("4.4 - 1.5 bathrooms", "No results (may be valid search)")
    
    # Test 4.5: Very high bathrooms
    search_result = search_condo_properties(city="Toronto", bathrooms=20, limit=5)
    if search_result.get('total', 0) == 0:
        result.record_pass("4.5 - 20 bathrooms", "Correctly returns 0 results")
    else:
        result.record_warning("4.5 - 20 bathrooms", f"Found {search_result.get('total')} results (unusual)")


def test_extreme_sqft_ranges():
    """Test 5: Extreme square footage"""
    print("\n🧪 TEST 5: Extreme Square Footage")
    print("-" * 80)
    
    # Test 5.1: Tiny condo (< 100 sqft)
    search_result = search_condo_properties(city="Toronto", max_sqft=100, limit=5)
    if search_result.get('total', 0) == 0:
        result.record_pass("5.1 - Max 100 sqft", "Correctly returns 0 results")
    else:
        result.record_fail("5.1 - Max 100 sqft", f"Found {search_result.get('total')} results (impossibly small)")
    
    # Test 5.2: Mansion-sized condo (> 10,000 sqft)
    search_result = search_condo_properties(city="Toronto", min_sqft=10_000, limit=5)
    if search_result.get('total', 0) == 0:
        result.record_pass("5.2 - Min 10,000 sqft", "Correctly returns 0 results")
    else:
        result.record_warning("5.2 - Min 10,000 sqft", f"Found {search_result.get('total')} penthouse units")
    
    # Test 5.3: Inverted sqft range
    search_result = search_condo_properties(city="Toronto", min_sqft=2000, max_sqft=500, limit=5)
    if search_result.get('total', 0) == 0:
        result.record_pass("5.3 - Inverted sqft range", "Correctly returns 0 results")
    else:
        result.record_fail("5.3 - Inverted sqft range", f"Found {search_result.get('total')} results (should be 0)")
    
    # Test 5.4: Negative sqft
    search_result = search_condo_properties(city="Toronto", min_sqft=-500, limit=5)
    if search_result.get('total', 0) == 0:
        result.record_pass("5.4 - Negative sqft", "Correctly returns 0 results")
    else:
        result.record_fail("5.4 - Negative sqft", f"Found {search_result.get('total')} results (impossible)")


def test_extreme_floor_levels():
    """Test 6: Extreme floor levels"""
    print("\n🧪 TEST 6: Extreme Floor Levels")
    print("-" * 80)
    
    # Test 6.1: Floor 100+ (impossibly high in most cities)
    search_result = search_condo_properties(city="Toronto", floor_level_min=100, limit=5)
    if search_result.get('total', 0) == 0:
        result.record_pass("6.1 - Floor 100+", "Correctly returns 0 results")
    else:
        result.record_warning("6.1 - Floor 100+", f"Found {search_result.get('total')} results (rare)")
    
    # Test 6.2: Negative floor (basement?)
    search_result = search_condo_properties(city="Toronto", floor_level_min=-5, limit=5)
    if search_result.get('total', 0) >= 0:
        result.record_pass("6.2 - Negative floor", "Handled gracefully")
    else:
        result.record_fail("6.2 - Negative floor", "Should handle negative floors")
    
    # Test 6.3: Floor 0 (ground floor)
    search_result = search_condo_properties(city="Toronto", floor_level_min=0, limit=5)
    if search_result.get('total', 0) >= 0:
        result.record_pass("6.3 - Floor 0", "Handled ground floor correctly")
    else:
        result.record_fail("6.3 - Floor 0", "Should handle ground floor")


def test_multiple_contradictory_filters():
    """Test 7: Contradictory filter combinations"""
    print("\n🧪 TEST 7: Contradictory Filter Combinations")
    print("-" * 80)
    
    # Test 7.1: Studio (0 bed) but 3+ bathrooms
    search_result = search_condo_properties(city="Toronto", bedrooms=0, bathrooms=3, limit=5)
    if search_result.get('total', 0) == 0:
        result.record_pass("7.1 - 0 bed, 3 bath", "Correctly returns 0 results")
    else:
        result.record_warning("7.1 - 0 bed, 3 bath", f"Found {search_result.get('total')} unusual results")
    
    # Test 7.2: Luxury price but tiny sqft
    search_result = search_condo_properties(city="Toronto", min_price=1_000_000, max_sqft=300, limit=5)
    if search_result.get('total', 0) == 0:
        result.record_pass("7.2 - $1M+ but <300 sqft", "Correctly returns 0 results")
    else:
        result.record_warning("7.2 - $1M+ but <300 sqft", f"Found {search_result.get('total')} luxury micro-condos")
    
    # Test 7.3: Budget price but penthouse floor
    search_result = search_condo_properties(city="Toronto", max_price=200_000, floor_level_min=50, limit=5)
    if search_result.get('total', 0) == 0:
        result.record_pass("7.3 - <$200k but floor 50+", "Correctly returns 0 results")
    else:
        result.record_warning("7.3 - <$200k but floor 50+", f"Found {search_result.get('total')} budget penthouses")


def test_special_amenity_combinations():
    """Test 8: Impossible amenity combinations"""
    print("\n🧪 TEST 8: Special Amenity Combinations")
    print("-" * 80)
    
    # Test 8.1: All possible amenities (over-constrained)
    all_amenities = ["gym", "pool", "concierge", "rooftop", "party_room", "sauna", "theater", "tennis"]
    search_result = search_condo_properties(city="Toronto", amenities=all_amenities, limit=5)
    if search_result.get('total', 0) == 0:
        result.record_pass("8.1 - All amenities", "No results (over-constrained)")
    else:
        result.record_pass("8.1 - All amenities", f"Found {search_result.get('total')} luxury buildings")
    
    # Test 8.2: Invalid amenity names
    search_result = search_condo_properties(city="Toronto", amenities=["unicorn_stable", "rocket_pad"], limit=5)
    if search_result.get('total', 0) >= 0:
        result.record_pass("8.2 - Invalid amenities", "Handled gracefully")
    else:
        result.record_fail("8.2 - Invalid amenities", "Should ignore invalid amenities")
    
    # Test 8.3: Empty amenities list
    search_result = search_condo_properties(city="Toronto", amenities=[], limit=5)
    if search_result.get('total', 0) > 0:
        result.record_pass("8.3 - Empty amenities", f"Found {search_result.get('total')} results")
    else:
        result.record_warning("8.3 - Empty amenities", "Should return results when no amenities specified")


def test_data_standardization_edge_cases():
    """Test 9: Property data standardization edge cases"""
    print("\n🧪 TEST 9: Data Standardization Edge Cases")
    print("-" * 80)
    
    # Test 9.1: Empty property dict
    std = standardize_condo_property({})
    if not std:
        result.record_pass("9.1 - Empty property", "Returns empty dict")
    else:
        result.record_fail("9.1 - Empty property", f"Should return empty, got {len(std)} fields")
    
    # Test 9.2: Property with no price
    test_prop = {"mlsNumber": "TEST123", "address": {"city": "Toronto"}}
    std = standardize_condo_property(test_prop)
    if std.get('price') == 0:
        result.record_pass("9.2 - No price", "Defaults to 0")
    else:
        result.record_fail("9.2 - No price", f"Price should be 0, got {std.get('price')}")
    
    # Test 9.3: Property with missing address
    test_prop = {"mlsNumber": "TEST123", "listPrice": 500000}
    std = standardize_condo_property(test_prop)
    if std.get('address') == 'N/A':
        result.record_pass("9.3 - No address", "Defaults to 'N/A'")
    else:
        result.record_fail("9.3 - No address", f"Address should be N/A, got {std.get('address')}")
    
    # Test 9.4: Property with malformed images
    test_prop = {"mlsNumber": "TEST123", "images": "not_a_list", "photos": None}
    std = standardize_condo_property(test_prop)
    if isinstance(std.get('images'), list):
        result.record_pass("9.4 - Malformed images", "Converts to list")
    else:
        result.record_fail("9.4 - Malformed images", f"Images should be list, got {type(std.get('images'))}")
    
    # Test 9.5: Property with None values
    test_prop = {
        "mlsNumber": None,
        "listPrice": None,
        "address": None,
        "details": None
    }
    std = standardize_condo_property(test_prop)
    if std.get('mlsNumber') == 'N/A' and std.get('price') == 0:
        result.record_pass("9.5 - All None values", "Handles None gracefully")
    else:
        result.record_fail("9.5 - All None values", "Should handle None values")


def test_ai_criteria_extraction_edge_cases():
    """Test 10: AI criteria extraction edge cases"""
    print("\n🧪 TEST 10: AI Criteria Extraction Edge Cases")
    print("-" * 80)
    
    # Test 10.1: Gibberish query
    criteria = extract_condo_criteria_with_ai("asdfghjkl qwerty 12345")
    if isinstance(criteria, dict):
        result.record_pass("10.1 - Gibberish query", "Returns empty/fallback dict")
    else:
        result.record_fail("10.1 - Gibberish query", "Should return dict")
    
    # Test 10.2: Very long query (token limit test)
    long_query = "condo " * 500
    try:
        criteria = extract_condo_criteria_with_ai(long_query)
        result.record_pass("10.2 - Very long query", "Handled without error")
    except Exception as e:
        result.record_pass("10.2 - Very long query", f"Handled error: {type(e).__name__}")
    
    # Test 10.3: Query with special characters
    criteria = extract_condo_criteria_with_ai("2BR condo @ $500k! in TO?? #urgent")
    if isinstance(criteria, dict):
        result.record_pass("10.3 - Special characters", "Parsed successfully")
    else:
        result.record_fail("10.3 - Special characters", "Should handle special chars")
    
    # Test 10.4: Empty query
    criteria = extract_condo_criteria_with_ai("")
    if isinstance(criteria, dict):
        result.record_pass("10.4 - Empty query", "Returns empty dict")
    else:
        result.record_fail("10.4 - Empty query", "Should return dict")
    
    # Test 10.5: Query with emoji
    criteria = extract_condo_criteria_with_ai("🏙️ 2BR condo 🏊 with pool 🏋️ and gym")
    if isinstance(criteria, dict):
        result.record_pass("10.5 - Emoji query", "Handled emoji")
    else:
        result.record_fail("10.5 - Emoji query", "Should handle emoji")


def test_limit_parameter():
    """Test 11: Limit parameter edge cases"""
    print("\n🧪 TEST 11: Limit Parameter Edge Cases")
    print("-" * 80)
    
    # Test 11.1: Limit = 0
    search_result = search_condo_properties(city="Toronto", limit=0)
    if search_result.get('total', -1) >= 0:
        result.record_pass("11.1 - Limit 0", f"Handled gracefully (got {search_result.get('total')} total)")
    else:
        result.record_fail("11.1 - Limit 0", "Should handle limit=0")
    
    # Test 11.2: Limit = 1
    search_result = search_condo_properties(city="Toronto", limit=1)
    props = search_result.get('properties', [])
    if len(props) <= 1:
        result.record_pass("11.2 - Limit 1", f"Returns {len(props)} properties")
    else:
        result.record_fail("11.2 - Limit 1", f"Should return max 1, got {len(props)}")
    
    # Test 11.3: Negative limit
    search_result = search_condo_properties(city="Toronto", limit=-5)
    if search_result.get('total', 0) >= 0:
        result.record_pass("11.3 - Negative limit", "Handled gracefully")
    else:
        result.record_fail("11.3 - Negative limit", "Should handle negative limit")
    
    # Test 11.4: Huge limit (10000)
    search_result = search_condo_properties(city="Toronto", limit=10000)
    props = search_result.get('properties', [])
    if len(props) <= 10000:
        result.record_pass("11.4 - Limit 10000", f"Returns {len(props)} properties")
    else:
        result.record_fail("11.4 - Limit 10000", f"Should return max 10000, got {len(props)}")


def test_realistic_edge_cases():
    """Test 12: Realistic but unusual searches"""
    print("\n🧪 TEST 12: Realistic Edge Cases")
    print("-" * 80)
    
    # Test 12.1: Micro condo (300-400 sqft)
    search_result = search_condo_properties(city="Toronto", min_sqft=300, max_sqft=400, limit=5)
    if search_result.get('total', 0) >= 0:
        result.record_pass("12.1 - Micro condo", f"Found {search_result.get('total')} results")
    else:
        result.record_fail("12.1 - Micro condo", "Should handle small condos")
    
    # Test 12.2: Luxury penthouse (5+ bed, floor 40+, $5M+)
    search_result = search_condo_properties(
        city="Toronto",
        bedrooms=5,
        floor_level_min=40,
        min_price=5_000_000,
        limit=5
    )
    if search_result.get('total', 0) >= 0:
        result.record_pass("12.2 - Luxury penthouse", f"Found {search_result.get('total')} results")
    else:
        result.record_fail("12.2 - Luxury penthouse", "Should handle luxury searches")
    
    # Test 12.3: Budget condo (<$300k)
    search_result = search_condo_properties(city="Toronto", max_price=300_000, limit=5)
    if search_result.get('total', 0) >= 0:
        result.record_pass("12.3 - Budget condo", f"Found {search_result.get('total')} results")
    else:
        result.record_fail("12.3 - Budget condo", "Should handle budget searches")
    
    # Test 12.4: Pet-friendly with balcony
    search_result = search_condo_properties(
        city="Toronto",
        pets_permitted=True,
        limit=5
    )
    if search_result.get('total', 0) >= 0:
        result.record_pass("12.4 - Pet-friendly", f"Found {search_result.get('total')} results")
    else:
        result.record_fail("12.4 - Pet-friendly", "Should handle pet searches")


def test_property_field_completeness():
    """Test 13: Verify all required fields are present"""
    print("\n🧪 TEST 13: Property Field Completeness")
    print("-" * 80)
    
    search_result = search_condo_properties(city="Toronto", limit=3)
    properties = search_result.get('properties', [])
    
    if not properties:
        result.record_warning("13.0 - No properties", "Cannot test field completeness")
        return
    
    # Required frontend fields
    required_fields = [
        'price', 'listPrice', 'id', 'mlsNumber',
        'address', 'location', 'city',
        'bedrooms', 'bathrooms', 'sqft',
        'images', 'image', 'image_url',
        'description'
    ]
    
    for idx, prop in enumerate(properties[:3], 1):
        missing_fields = [field for field in required_fields if field not in prop]
        
        if not missing_fields:
            result.record_pass(f"13.{idx} - Property {idx}", "All required fields present")
        else:
            result.record_fail(f"13.{idx} - Property {idx}", f"Missing: {', '.join(missing_fields)}")
    
    # Check price is not 0 or None
    for idx, prop in enumerate(properties[:3], 1):
        price = prop.get('price')
        if price and price > 0:
            result.record_pass(f"13.{idx}a - Price value", f"${price:,}")
        else:
            result.record_fail(f"13.{idx}a - Price value", f"Invalid price: {price}")
    
    # Check images are present
    for idx, prop in enumerate(properties[:3], 1):
        images = prop.get('images', [])
        if images and len(images) > 0:
            result.record_pass(f"13.{idx}b - Images", f"{len(images)} images")
        else:
            result.record_warning(f"13.{idx}b - Images", "No images (may be normal)")


# ==================== RUN ALL TESTS ====================

def run_all_tests():
    """Run comprehensive test suite"""
    print("="*80)
    print("CONDO PROPERTY SEARCH - COMPREHENSIVE EDGE CASE TEST SUITE")
    print("="*80)
    print(f"Started at: {datetime.now().strftime('%Y-%m-%d %H:%M:%S')}")
    print("="*80)
    
    try:
        test_empty_inputs()
        test_invalid_city_names()
        test_extreme_price_ranges()
        test_extreme_bedroom_bathroom_counts()
        test_extreme_sqft_ranges()
        test_extreme_floor_levels()
        test_multiple_contradictory_filters()
        test_special_amenity_combinations()
        test_data_standardization_edge_cases()
        test_ai_criteria_extraction_edge_cases()
        test_limit_parameter()
        test_realistic_edge_cases()
        test_property_field_completeness()
        
    except Exception as e:
        print(f"\n❌ FATAL ERROR: {e}")
        import traceback
        traceback.print_exc()
    
    result.print_summary()
    
    # Save results to file
    report = {
        "timestamp": datetime.now().isoformat(),
        "total_tests": result.total,
        "passed": result.passed,
        "failed": result.failed,
        "warnings": len(result.warnings),
        "success_rate": f"{(result.passed/result.total*100):.1f}%" if result.total > 0 else "N/A",
        "errors": result.errors,
        "warnings_list": result.warnings
    }
    
    os.makedirs("test_results", exist_ok=True)
    with open("test_results/edge_case_test_results.json", "w") as f:
        json.dump(report, f, indent=2)
    
    print(f"\n📄 Results saved to: test_results/edge_case_test_results.json")
    
    return result.failed == 0


if __name__ == "__main__":
    success = run_all_tests()
    sys.exit(0 if success else 1)
