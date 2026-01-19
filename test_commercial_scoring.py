#!/usr/bin/env python3
"""
COMMERCIAL SEARCH TEST SCRIPT
=============================
Tests the new residential-style scoring with "spa space in toronto"

Expected behavior:
- Properties should score 0-100 based on actual field matches
- NOT all 55 points (GENERIC)
- Spa properties should score 80-100
- Hair salons might score 60-75 (same category)
- Offices should score 20-40 (convertible)
"""

import sys
import os

# Add project root to path
project_root = os.path.abspath(os.path.join(os.path.dirname(__file__), '..'))
sys.path.insert(0, project_root)

from app.commercialapp import (
    find_business_type_from_query,
    calculate_property_score,
    UNIFIED_BUSINESS_REGISTRY
)

def test_spa_search():
    """Test scoring for 'spa space in toronto' query"""
    
    print("=" * 80)
    print("🧪 TESTING: Spa Space Search - Residential-Style Scoring")
    print("=" * 80)
    
    # Test 1: Business type detection
    print("\n📋 TEST 1: Business Type Detection")
    query = "spa space in toronto"
    detected = find_business_type_from_query(query)
    print(f"   Query: '{query}'")
    print(f"   Detected: {detected}")
    print(f"   ✅ PASS" if detected == "Spa" else f"   ❌ FAIL (expected 'Spa')")
    
    # Test 2: Scoring different property types
    print("\n📋 TEST 2: Property Scoring (Field-by-Field Matching)")
    
    criteria = {
        "business_type": "Spa",
        "location": "Toronto",
        "user_query": "spa space in toronto"
    }
    
    test_properties = [
        {
            "name": "Spa on Bay Street",
            "mlsNumber": "TEST001",
            "listPrice": 500000,
            "details": {
                "businessType": "Spa",
                "description": "Fully equipped spa with treatment rooms",
                "sqft": 1500
            },
            "commercial": {
                "businessType": "Spa"
            },
            "address": {
                "streetName": "Bay Street",
                "city": "Toronto",
                "postalCode": "M5H 2Y4"
            }
        },
        {
            "name": "Hair Salon on Queen Street",
            "mlsNumber": "TEST002",
            "listPrice": 450000,
            "details": {
                "businessType": "Hair Salon",
                "description": "Modern hair salon with spa services",
                "sqft": 1200
            },
            "commercial": {
                "businessType": "Hair Salon"
            },
            "address": {
                "streetName": "Queen Street",
                "city": "Toronto",
                "postalCode": "M5H 3M7"
            }
        },
        {
            "name": "Office Space on King Street",
            "mlsNumber": "TEST003",
            "listPrice": 600000,
            "details": {
                "businessType": "Office",
                "description": "Commercial office space, flexible layout",
                "sqft": 2000
            },
            "commercial": {
                "businessType": "Office"
            },
            "address": {
                "streetName": "King Street",
                "city": "Toronto",
                "postalCode": "M5H 1A1"
            }
        },
        {
            "name": "Restaurant on Yonge Street",
            "mlsNumber": "TEST004",
            "listPrice": 700000,
            "details": {
                "businessType": "Restaurant",
                "description": "Full service restaurant space",
                "sqft": 2500
            },
            "commercial": {
                "businessType": "Restaurant"
            },
            "address": {
                "streetName": "Yonge Street",
                "city": "Toronto",
                "postalCode": "M5E 1G3"
            }
        }
    ]
    
    print("\n🎯 SCORING RESULTS:")
    print("-" * 80)
    
    for prop in test_properties:
        score, field_scores = calculate_property_score(prop, criteria)
        
        print(f"\n📍 {prop['name']} (MLS: {prop['mlsNumber']})")
        print(f"   Business Type: {prop['details']['businessType']}")
        print(f"   Score: {score}/100")
        print(f"   Field Scores: {field_scores}")
        
        # Determine expected range
        biz_type = prop['details']['businessType']
        if biz_type == "Spa":
            expected = "80-100 (EXACT match)"
            passes = score >= 80
        elif biz_type == "Hair Salon":
            expected = "60-80 (Same category - personal_service)"
            passes = 60 <= score < 85
        elif biz_type == "Office":
            expected = "20-50 (Convertible)"
            passes = 20 <= score < 60
        elif biz_type == "Restaurant":
            expected = "5-30 (Generic/Different category)"
            passes = 5 <= score < 40
        else:
            expected = "Unknown"
            passes = False
        
        print(f"   Expected: {expected}")
        print(f"   {'✅ PASS' if passes else '❌ FAIL'}")
    
    # Test 3: Verify score differentiation
    print("\n📋 TEST 3: Score Differentiation Check")
    scores = [calculate_property_score(prop, criteria)[0] for prop in test_properties]
    unique_scores = len(set(scores))
    
    print(f"   Scores: {scores}")
    print(f"   Unique scores: {unique_scores}/4")
    print(f"   All 55 points? {all(s == 55 for s in scores)}")
    print(f"   {'✅ PASS (differentiated scoring)' if unique_scores >= 3 and not all(s == 55 for s in scores) else '❌ FAIL (uniform scoring)'}")
    
    # Test 4: Unified registry check
    print("\n📋 TEST 4: Unified Business Registry")
    print(f"   Registry entries: {len(UNIFIED_BUSINESS_REGISTRY)}")
    print(f"   Has 'Spa': {'Spa' in UNIFIED_BUSINESS_REGISTRY}")
    if "Spa" in UNIFIED_BUSINESS_REGISTRY:
        spa_data = UNIFIED_BUSINESS_REGISTRY["Spa"]
        print(f"   Spa keywords: {spa_data.get('keywords', [])}")
        print(f"   Spa category: {spa_data.get('category', 'N/A')}")
        print(f"   ✅ PASS")
    else:
        print(f"   ❌ FAIL (Spa not in registry)")
    
    print("\n" + "=" * 80)
    print("🏁 TEST COMPLETE")
    print("=" * 80)

if __name__ == "__main__":
    try:
        test_spa_search()
    except Exception as e:
        print(f"\n❌ TEST FAILED WITH ERROR:")
        print(f"   {type(e).__name__}: {e}")
        import traceback
        traceback.print_exc()
        sys.exit(1)
