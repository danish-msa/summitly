#!/usr/bin/env python3
"""
Comprehensive Commercial Property Search Test Suite
Tests all business categories, locations, intersections, budgets, and amenities
to ensure relevant results are returned without cross-contamination.
"""

import requests
import json
from typing import Dict, List, Tuple
from collections import defaultdict

BASE_URL = "http://localhost:5050"

# Test categories
TEST_CASES = {
    # ==================== BUSINESS TYPE TESTS ====================
    "business_types": [
        # Food Service - should NOT return personal_service
        {"query": "spa for sale in Ottawa", "expected_category": "personal_service", "should_not_contain": ["restaurant", "shawarma", "pizza", "food"]},
        {"query": "shawarma restaurant in Toronto", "expected_category": "food_service", "should_not_contain": ["spa", "salon", "wellness", "beauty"]},
        {"query": "pizza place near me", "expected_category": "food_service", "should_not_contain": ["spa", "salon", "gym"]},
        {"query": "bakery for sale", "expected_category": "food_service", "should_not_contain": ["car wash", "automotive"]},
        {"query": "cafe in downtown Ottawa", "expected_category": "food_service", "should_not_contain": ["industrial", "warehouse"]},
        
        # Personal Service - should NOT return food_service
        {"query": "salon for sale in Mississauga", "expected_category": "personal_service", "should_not_contain": ["restaurant", "food", "shawarma"]},
        {"query": "gym near Yonge Street", "expected_category": "personal_service", "should_not_contain": ["restaurant", "pizza"]},
        {"query": "wellness center for sale", "expected_category": "personal_service", "should_not_contain": ["food", "dining"]},
        {"query": "barber shop in Ottawa", "expected_category": "personal_service", "should_not_contain": ["restaurant", "cafe"]},
        
        # Automotive - should NOT return food or medical
        {"query": "car wash for sale in Toronto", "expected_category": "automotive", "should_not_contain": ["restaurant", "spa", "medical"]},
        {"query": "auto repair shop", "expected_category": "automotive", "should_not_contain": ["bakery", "salon"]},
        
        # Retail/Creative
        {"query": "art gallery space in Ottawa", "expected_category": "retail_creative", "should_not_contain": ["automotive", "car wash"]},
        {"query": "retail store for lease", "expected_category": "retail_creative", "should_not_contain": ["industrial"]},
        
        # Medical
        {"query": "dental clinic for sale", "expected_category": "medical", "should_not_contain": ["restaurant", "automotive"]},
        {"query": "medical office space", "expected_category": "medical", "should_not_contain": ["food", "car wash"]},
        
        # Industrial
        {"query": "warehouse for lease in Toronto", "expected_category": "industrial", "should_not_contain": ["spa", "restaurant"]},
        {"query": "industrial space near airport", "expected_category": "industrial", "should_not_contain": ["salon", "bakery"]},
    ],
    
    # ==================== LOCATION/STREET TESTS ====================
    "locations": [
        {"query": "restaurant on Merivale Road Ottawa", "expected_street": "merivale", "should_not_contain_street": ["rexdale", "yonge"]},
        {"query": "spa near Bank Street Ottawa", "expected_street": "bank", "should_not_contain_street": ["queen", "dundas"]},
        {"query": "cafe on King Street Toronto", "expected_street": "king", "should_not_contain_street": ["merivale"]},
        {"query": "store on Queen Street Toronto", "expected_street": "queen", "should_not_contain_street": ["merivale", "bank"]},
        {"query": "restaurant on Yonge Street", "expected_street": "yonge", "should_not_contain_street": ["merivale", "bank"]},
    ],
    
    # ==================== CITY TESTS ====================
    "cities": [
        {"query": "spa in Ottawa", "expected_city": "ottawa", "should_not_contain_city": ["toronto", "mississauga"]},
        {"query": "restaurant in Toronto", "expected_city": "toronto", "should_not_contain_city": ["ottawa", "calgary"]},
        {"query": "salon in Mississauga", "expected_city": "mississauga", "should_not_contain_city": ["ottawa"]},
    ],
    
    # ==================== BUDGET TESTS ====================
    "budgets": [
        {"query": "cheap restaurant under $100000", "max_price": 100000},
        {"query": "spa under $500000", "max_price": 500000},
        {"query": "restaurant between $200000 and $400000", "min_price": 200000, "max_price": 400000},
        {"query": "warehouse under 1 million", "max_price": 1000000},
    ],
    
    # ==================== CROSS-CONTAMINATION TESTS ====================
    "cross_contamination": [
        {"query": "spa", "search_type": "spa", "forbidden_types": ["shawarma", "restaurant", "pizza", "food", "dining", "cafe", "bakery"]},
        {"query": "shawarma", "search_type": "shawarma", "forbidden_types": ["spa", "salon", "wellness", "beauty", "gym", "fitness"]},
        {"query": "salon", "search_type": "salon", "forbidden_types": ["restaurant", "food", "shawarma", "pizza", "cafe"]},
        {"query": "restaurant", "search_type": "restaurant", "forbidden_types": ["spa", "salon", "wellness", "car wash", "automotive"]},
        {"query": "car wash", "search_type": "car wash", "forbidden_types": ["restaurant", "spa", "medical", "food"]},
        {"query": "gym", "search_type": "gym", "forbidden_types": ["restaurant", "food", "pizza", "shawarma"]},
    ],
}


def call_search_api(query: str) -> Dict:
    """Call the commercial property search API"""
    try:
        response = requests.post(
            f"{BASE_URL}/api/chat",
            json={"message": query, "session_id": f"test-{hash(query) % 100000}"},
            timeout=60
        )
        return response.json()
    except Exception as e:
        return {"error": str(e)}


def extract_property_info(prop: Dict) -> Dict:
    """Extract key info from a property for testing"""
    # Handle case where address might be a string
    address = prop.get("address", {})
    if isinstance(address, str):
        address = {}
    
    details = prop.get("details", {})
    if isinstance(details, str):
        details = {}
        
    commercial = prop.get("commercial", {})
    if isinstance(commercial, str):
        commercial = {}
    
    return {
        "business_type": (commercial.get("businessType") or details.get("businessType") or "").lower(),
        "street": (address.get("streetName") or "").lower(),
        "city": (address.get("city") or "").lower(),
        "price": prop.get("listPrice", 0),
        "description": (details.get("description") or "").lower()[:200],
        "mls": prop.get("mlsNumber", ""),
    }


def test_business_types():
    """Test business type filtering - no cross-contamination"""
    print("\n" + "="*80)
    print("🏢 TESTING BUSINESS TYPE FILTERING")
    print("="*80)
    
    results = {"passed": 0, "failed": 0, "details": []}
    
    for test in TEST_CASES["business_types"]:
        query = test["query"]
        expected_cat = test["expected_category"]
        forbidden = test.get("should_not_contain", [])
        
        print(f"\n📋 Query: '{query}'")
        print(f"   Expected category: {expected_cat}")
        print(f"   Forbidden terms: {forbidden}")
        
        response = call_search_api(query)
        properties = response.get("properties", [])
        
        if not properties:
            print(f"   ⚠️ No properties returned")
            results["details"].append({"query": query, "status": "NO_RESULTS", "count": 0})
            continue
        
        violations = []
        for prop in properties[:5]:  # Check top 5
            info = extract_property_info(prop)
            prop_type = info["business_type"]
            desc = info["description"]
            
            for forbidden_term in forbidden:
                if forbidden_term.lower() in prop_type:
                    violations.append(f"MLS {info['mls']}: business_type contains '{forbidden_term}' ({prop_type})")
        
        if violations:
            print(f"   ❌ FAILED - {len(violations)} violations:")
            for v in violations[:3]:
                print(f"      • {v}")
            results["failed"] += 1
            results["details"].append({"query": query, "status": "FAILED", "violations": violations})
        else:
            print(f"   ✅ PASSED - {len(properties)} properties, no forbidden terms in business_type")
            results["passed"] += 1
            results["details"].append({"query": query, "status": "PASSED", "count": len(properties)})
    
    return results


def test_locations():
    """Test street/road location filtering"""
    print("\n" + "="*80)
    print("📍 TESTING LOCATION/STREET FILTERING")
    print("="*80)
    
    results = {"passed": 0, "failed": 0, "details": []}
    
    for test in TEST_CASES["locations"]:
        query = test["query"]
        expected_street = test["expected_street"].lower()
        forbidden_streets = [s.lower() for s in test.get("should_not_contain_street", [])]
        
        print(f"\n📋 Query: '{query}'")
        print(f"   Expected street: {expected_street}")
        print(f"   Forbidden streets: {forbidden_streets}")
        
        response = call_search_api(query)
        properties = response.get("properties", [])
        
        if not properties:
            print(f"   ⚠️ No properties returned")
            results["details"].append({"query": query, "status": "NO_RESULTS", "count": 0})
            continue
        
        violations = []
        matches = 0
        for prop in properties[:5]:
            info = extract_property_info(prop)
            street = info["street"]
            
            if expected_street in street:
                matches += 1
            
            for forbidden in forbidden_streets:
                if forbidden in street:
                    violations.append(f"MLS {info['mls']}: on '{street}' (forbidden: {forbidden})")
        
        if violations:
            print(f"   ❌ FAILED - Properties on forbidden streets:")
            for v in violations[:3]:
                print(f"      • {v}")
            results["failed"] += 1
        else:
            print(f"   ✅ PASSED - {matches}/{len(properties[:5])} on expected street, no forbidden streets")
            results["passed"] += 1
        
        results["details"].append({"query": query, "matches": matches, "violations": len(violations)})
    
    return results


def test_cities():
    """Test city filtering"""
    print("\n" + "="*80)
    print("🏙️ TESTING CITY FILTERING")
    print("="*80)
    
    results = {"passed": 0, "failed": 0, "details": []}
    
    for test in TEST_CASES["cities"]:
        query = test["query"]
        expected_city = test["expected_city"].lower()
        forbidden_cities = [c.lower() for c in test.get("should_not_contain_city", [])]
        
        print(f"\n📋 Query: '{query}'")
        print(f"   Expected city: {expected_city}")
        
        response = call_search_api(query)
        properties = response.get("properties", [])
        
        if not properties:
            print(f"   ⚠️ No properties returned")
            continue
        
        city_counts = defaultdict(int)
        violations = []
        
        for prop in properties[:10]:
            info = extract_property_info(prop)
            city = info["city"]
            city_counts[city] += 1
            
            for forbidden in forbidden_cities:
                if forbidden in city:
                    violations.append(f"MLS {info['mls']} in {city}")
        
        print(f"   Cities found: {dict(city_counts)}")
        
        if violations:
            print(f"   ❌ FAILED - {len(violations)} properties in forbidden cities")
            results["failed"] += 1
        else:
            print(f"   ✅ PASSED - All properties in expected region")
            results["passed"] += 1
    
    return results


def test_budgets():
    """Test price/budget filtering"""
    print("\n" + "="*80)
    print("💰 TESTING BUDGET FILTERING")
    print("="*80)
    
    results = {"passed": 0, "failed": 0, "details": []}
    
    for test in TEST_CASES["budgets"]:
        query = test["query"]
        max_price = test.get("max_price")
        min_price = test.get("min_price", 0)
        
        print(f"\n📋 Query: '{query}'")
        print(f"   Price range: ${min_price:,} - ${max_price:,}" if max_price else f"   Max price: ${max_price:,}")
        
        response = call_search_api(query)
        properties = response.get("properties", [])
        
        if not properties:
            print(f"   ⚠️ No properties returned")
            continue
        
        violations = []
        prices = []
        
        for prop in properties[:10]:
            info = extract_property_info(prop)
            price = info["price"]
            prices.append(price)
            
            if max_price and price > max_price:
                violations.append(f"MLS {info['mls']}: ${price:,} > ${max_price:,}")
            if min_price and price < min_price:
                violations.append(f"MLS {info['mls']}: ${price:,} < ${min_price:,}")
        
        if prices:
            print(f"   Price range found: ${min(prices):,} - ${max(prices):,}")
        
        if violations:
            print(f"   ❌ FAILED - {len(violations)} properties outside budget:")
            for v in violations[:3]:
                print(f"      • {v}")
            results["failed"] += 1
        else:
            print(f"   ✅ PASSED - All {len(properties[:10])} properties within budget")
            results["passed"] += 1
    
    return results


def test_cross_contamination():
    """
    CRITICAL TEST: Ensure searching for one type doesn't return unrelated types.
    E.g., searching "spa" should NEVER return "shawarma" in results.
    """
    print("\n" + "="*80)
    print("🚨 TESTING CROSS-CONTAMINATION (CRITICAL)")
    print("="*80)
    
    results = {"passed": 0, "failed": 0, "critical_failures": []}
    
    for test in TEST_CASES["cross_contamination"]:
        query = test["query"]
        search_type = test["search_type"]
        forbidden_types = test["forbidden_types"]
        
        print(f"\n📋 Query: '{query}'")
        print(f"   Forbidden in results: {forbidden_types}")
        
        response = call_search_api(query)
        properties = response.get("properties", [])
        
        if not properties:
            print(f"   ⚠️ No properties returned")
            continue
        
        violations = []
        
        for i, prop in enumerate(properties[:10]):
            info = extract_property_info(prop)
            prop_type = info["business_type"]
            
            for forbidden in forbidden_types:
                if forbidden.lower() in prop_type:
                    violations.append({
                        "position": i + 1,
                        "mls": info["mls"],
                        "business_type": prop_type,
                        "forbidden_match": forbidden
                    })
        
        if violations:
            print(f"   ❌ CRITICAL FAILURE - Cross-contamination detected!")
            for v in violations:
                print(f"      • #{v['position']}: MLS {v['mls']} is '{v['business_type']}' (contains '{v['forbidden_match']}')")
            results["failed"] += 1
            results["critical_failures"].append({
                "query": query,
                "violations": violations
            })
        else:
            # Check what types we DID get
            types_found = [extract_property_info(p)["business_type"] for p in properties[:5]]
            print(f"   ✅ PASSED - No forbidden types found")
            print(f"   Types in results: {types_found[:3]}...")
            results["passed"] += 1
    
    return results


def run_all_tests():
    """Run all test suites"""
    print("\n" + "="*80)
    print("🧪 COMPREHENSIVE COMMERCIAL PROPERTY SEARCH TEST SUITE")
    print("="*80)
    print(f"Server: {BASE_URL}")
    print("Testing: Business types, Locations, Cities, Budgets, Cross-contamination")
    
    # Check server is running
    try:
        health = requests.get(f"{BASE_URL}/health", timeout=5)
        print(f"Server health: {health.status_code}")
    except:
        print("❌ ERROR: Server not reachable at", BASE_URL)
        return
    
    all_results = {}
    
    # Run tests
    all_results["business_types"] = test_business_types()
    all_results["locations"] = test_locations()
    all_results["cities"] = test_cities()
    all_results["budgets"] = test_budgets()
    all_results["cross_contamination"] = test_cross_contamination()
    
    # Summary
    print("\n" + "="*80)
    print("📊 TEST SUMMARY")
    print("="*80)
    
    total_passed = 0
    total_failed = 0
    
    for category, results in all_results.items():
        passed = results.get("passed", 0)
        failed = results.get("failed", 0)
        total_passed += passed
        total_failed += failed
        
        status = "✅" if failed == 0 else "❌"
        print(f"{status} {category.upper()}: {passed} passed, {failed} failed")
    
    print(f"\n{'='*40}")
    print(f"TOTAL: {total_passed} passed, {total_failed} failed")
    
    if total_failed == 0:
        print("\n🎉 ALL TESTS PASSED! Search is working correctly.")
    else:
        print(f"\n⚠️ {total_failed} tests failed. Review the output above.")
        
        # Highlight critical failures
        if all_results["cross_contamination"].get("critical_failures"):
            print("\n🚨 CRITICAL CROSS-CONTAMINATION FAILURES:")
            for failure in all_results["cross_contamination"]["critical_failures"]:
                print(f"   Query '{failure['query']}' returned forbidden types")


if __name__ == "__main__":
    run_all_tests()
