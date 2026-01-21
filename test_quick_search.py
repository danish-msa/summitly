#!/usr/bin/env python3
"""
Quick test to verify business type extraction and cross-contamination fixes.
Run this after restarting the server.
"""

import requests
import json

BASE_URL = "http://localhost:5050"

def test_query(query: str, expected_type: str = None, forbidden_types: list = None):
    """Test a single query"""
    print(f"\n{'='*60}")
    print(f"Query: '{query}'")
    print(f"Expected: {expected_type or 'any'}")
    if forbidden_types:
        print(f"Forbidden: {forbidden_types}")
    print("-" * 60)
    
    try:
        response = requests.post(
            f"{BASE_URL}/api/chat",
            json={"message": query, "session_id": f"test-{hash(query) % 100000}"},
            timeout=60
        )
        
        data = response.json()
        # The API returns 'criteria' not 'filters', and 'results' not 'properties'
        filters = data.get("criteria", data.get("filters", {}))
        properties = data.get("results", data.get("properties", []))
        extracted = data.get("extracted_fields", {})
        
        print(f"Intent: {data.get('intent', data.get('status'))}")
        print(f"Criteria: {json.dumps(filters, indent=2)}")
        print(f"Extracted: {json.dumps(extracted, indent=2)}")
        print(f"Properties found: {len(properties)}")
        
        if properties:
            violations = []
            for i, prop in enumerate(properties[:5]):
                # Handle different property structures
                addr = prop.get("address", {})
                if isinstance(addr, str):
                    addr = {}
                
                commercial = prop.get("commercial", {})
                if isinstance(commercial, str):
                    commercial = {}
                    
                details = prop.get("details", {})
                if isinstance(details, str):
                    details = {}
                
                biz_type = (commercial.get("businessType") or details.get("businessType") or "N/A").lower()
                street = addr.get("streetName", "")
                city = addr.get("city", "")
                price = prop.get("listPrice", 0)
                mls = prop.get("mlsNumber", "")
                
                print(f"  {i+1}. MLS {mls}: {biz_type}")
                print(f"     {street} - {city} - ${price:,}")
                
                # Check for forbidden types
                if forbidden_types:
                    for ft in forbidden_types:
                        if ft.lower() in biz_type:
                            violations.append(f"MLS {mls} has forbidden type '{ft}' in '{biz_type}'")
            
            if violations:
                print(f"\n❌ VIOLATIONS FOUND:")
                for v in violations:
                    print(f"   • {v}")
                return False
            else:
                print(f"\n✅ No violations")
                return True
        else:
            print("⚠️ No properties returned")
            return None
            
    except Exception as e:
        print(f"Error: {e}")
        return False

def main():
    print("="*60)
    print("QUICK COMMERCIAL SEARCH TEST")
    print("="*60)
    
    # Check server health
    try:
        health = requests.get(f"{BASE_URL}/health", timeout=5)
        if health.status_code != 200:
            print(f"⚠️ Server health check returned {health.status_code}")
    except:
        print(f"❌ Server not reachable at {BASE_URL}")
        return
    
    results = []
    
    # Test 1: Spa search - should NOT return food types
    results.append(("Spa search", test_query(
        "spa for sale in Ottawa",
        expected_type="spa",
        forbidden_types=["shawarma", "restaurant", "pizza", "food", "cafe", "bakery"]
    )))
    
    # Test 2: Shawarma search - should NOT return personal service types
    results.append(("Shawarma search", test_query(
        "shawarma restaurant in Toronto",
        expected_type="shawarma",
        forbidden_types=["spa", "salon", "wellness", "beauty", "gym"]
    )))
    
    # Test 3: Restaurant search
    results.append(("Restaurant search", test_query(
        "restaurant in Toronto",
        expected_type="restaurant",
        forbidden_types=["spa", "salon", "car wash"]
    )))
    
    # Test 4: Salon search
    results.append(("Salon search", test_query(
        "salon for sale in Ottawa",
        expected_type="salon",
        forbidden_types=["restaurant", "shawarma", "pizza", "food"]
    )))
    
    # Test 5: Car wash search
    results.append(("Car wash search", test_query(
        "car wash in Mississauga",
        expected_type="car wash",
        forbidden_types=["restaurant", "spa", "food"]
    )))
    
    # Test 6: Pizza search
    results.append(("Pizza search", test_query(
        "pizza place for sale",
        expected_type="pizza",
        forbidden_types=["spa", "salon", "car wash"]
    )))
    
    # Summary
    print("\n" + "="*60)
    print("SUMMARY")
    print("="*60)
    
    passed = 0
    failed = 0
    no_results = 0
    
    for name, result in results:
        if result is True:
            print(f"✅ {name}: PASSED")
            passed += 1
        elif result is False:
            print(f"❌ {name}: FAILED")
            failed += 1
        else:
            print(f"⚠️ {name}: NO RESULTS")
            no_results += 1
    
    print(f"\nTotal: {passed} passed, {failed} failed, {no_results} no results")
    
    if failed == 0:
        print("\n🎉 All tests passed! No cross-contamination detected.")
    else:
        print(f"\n⚠️ {failed} tests failed - cross-contamination detected!")

if __name__ == "__main__":
    main()
