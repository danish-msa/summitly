"""
Test Commercial Property Details Button
========================================
This script tests:
1. Commercial property search returns properties with MLS numbers
2. Property details endpoint works with commercial MLS numbers
3. Frontend button onclick structure is correct
"""

import requests
import json
import time
from typing import Dict, List

# Test Configuration
BASE_URL = "http://localhost:5050"
TEST_SESSION_ID = f"test_user_{int(time.time())}"

def print_header(text: str):
    """Print formatted test section header"""
    print("\n" + "=" * 80)
    print(f"  {text}")
    print("=" * 80)

def print_success(text: str):
    """Print success message"""
    print(f"✅ {text}")

def print_error(text: str):
    """Print error message"""
    print(f"❌ {text}")

def print_info(text: str):
    """Print info message"""
    print(f"ℹ️  {text}")

def test_commercial_search() -> List[Dict]:
    """
    Test 1: Commercial property search returns valid data
    """
    print_header("TEST 1: Commercial Property Search")
    
    try:
        print_info("Sending request to /api/chat-gpt4...")
        response = requests.post(
            f"{BASE_URL}/api/chat-gpt4",
            json={
                "user_id": TEST_SESSION_ID,
                "message": "bakeries in ottawa",
                "property_type": "commercial"
            },
            timeout=120  # 2 minutes max
        )
        
        print_info(f"Response status: {response.status_code}")
        
        if response.status_code != 200:
            print_error(f"API returned status {response.status_code}")
            print_error(f"Response: {response.text[:500]}")
            return []
        
        data = response.json()
        
        # Check if properties exist
        if not data.get("properties"):
            print_error("No 'properties' field in response")
            print_info(f"Response keys: {list(data.keys())}")
            return []
        
        properties = data["properties"]
        print_success(f"Received {len(properties)} properties")
        
        # Analyze first 5 properties
        print_info("\nAnalyzing first 5 properties:")
        for i, prop in enumerate(properties[:5], 1):
            mls = prop.get("mls") or prop.get("mlsNumber") or prop.get("mls_number")
            address = prop.get("address", "Unknown")
            price = prop.get("price_text", prop.get("price", "N/A"))
            match_type = prop.get("match_type", "Unknown")
            
            if mls:
                print_success(f"  Property {i}: MLS={mls}, Address={address}, Price={price}, Type={match_type}")
            else:
                print_error(f"  Property {i}: NO MLS! Address={address}, Available keys: {list(prop.keys())[:10]}")
        
        # Check if ANY property has MLS
        properties_with_mls = [p for p in properties if p.get("mls") or p.get("mlsNumber")]
        if properties_with_mls:
            print_success(f"\n{len(properties_with_mls)}/{len(properties)} properties have MLS numbers")
        else:
            print_error(f"\nNO PROPERTIES HAVE MLS NUMBERS!")
            print_info("Sample property structure:")
            print(json.dumps(properties[0], indent=2)[:1000])
        
        return properties
        
    except requests.Timeout:
        print_error("Request timed out after 120 seconds")
        return []
    except Exception as e:
        print_error(f"Test failed with exception: {e}")
        import traceback
        traceback.print_exc()
        return []

def test_property_details(mls_number: str):
    """
    Test 2: Property details endpoint works with MLS number
    """
    print_header(f"TEST 2: Property Details Endpoint (MLS: {mls_number})")
    
    try:
        print_info(f"Sending request to /api/property-details?mls={mls_number}...")
        response = requests.get(
            f"{BASE_URL}/api/property-details",
            params={"mls": mls_number},
            timeout=30
        )
        
        print_info(f"Response status: {response.status_code}")
        
        if response.status_code == 200:
            data = response.json()
            if data.get("success"):
                print_success("Property details retrieved successfully!")
                
                property_data = data.get("property", {})
                print_info(f"  Address: {property_data.get('address', 'N/A')}")
                print_info(f"  Price: {property_data.get('price_text', property_data.get('price', 'N/A'))}")
                print_info(f"  Business Type: {property_data.get('business_type', 'N/A')}")
                return True
            else:
                print_error(f"API returned success=false: {data.get('error', 'Unknown error')}")
                return False
        else:
            print_error(f"API returned status {response.status_code}")
            print_error(f"Response: {response.text[:500]}")
            return False
            
    except Exception as e:
        print_error(f"Test failed with exception: {e}")
        import traceback
        traceback.print_exc()
        return False

def test_frontend_button_structure():
    """
    Test 3: Verify frontend HTML has correct button structure
    """
    print_header("TEST 3: Frontend Button Structure")
    
    try:
        # Read the HTML file
        html_path = r"c:\PropertyCH\Summitly v2\Summitly-AI-\Frontend\legacy\Summitly_main.html"
        print_info(f"Reading HTML file: {html_path}")
        
        with open(html_path, 'r', encoding='utf-8') as f:
            html_content = f.read()
        
        # Check for the correct button structure
        correct_pattern = 'onclick="viewPropertyDetails'
        wrong_pattern = 'onclick="viewProperty('
        
        # Find button in generatePropertyCards function
        import re
        
        # Look for the button in property card generation
        button_patterns = re.findall(r'<button[^>]*onclick="(view[^"]*)"[^>]*>.*?View Details.*?</button>', html_content, re.IGNORECASE)
        
        print_info(f"Found {len(button_patterns)} 'View Details' buttons")
        
        for i, pattern in enumerate(button_patterns[:5], 1):
            if 'viewPropertyDetails' in pattern and '${propertyId}' in pattern:
                # Check if it passes TWO parameters
                if pattern.count('${') >= 2 or pattern.count("'") >= 4:
                    print_success(f"  Button {i}: {pattern} ✅ (passes 2 parameters)")
                else:
                    print_error(f"  Button {i}: {pattern} ❌ (only passes 1 parameter)")
            elif 'viewProperty(' in pattern:
                print_error(f"  Button {i}: {pattern} ❌ (uses old viewProperty function)")
            else:
                print_info(f"  Button {i}: {pattern}")
        
        # Specific check for commercial property button
        commercial_button_check = "viewPropertyDetails('${propertyId}', '${propertyId}')" in html_content
        if commercial_button_check:
            print_success("\n✅ Commercial property button uses correct structure: viewPropertyDetails(id, mls)")
        else:
            print_error("\n❌ Commercial property button does NOT use correct structure!")
            
        return commercial_button_check
        
    except Exception as e:
        print_error(f"Test failed with exception: {e}")
        import traceback
        traceback.print_exc()
        return False

def run_all_tests():
    """
    Run all tests and provide summary
    """
    print("\n" + "🚀" * 40)
    print(" COMMERCIAL PROPERTY DETAILS BUTTON TEST SUITE")
    print("🚀" * 40)
    
    results = {
        "search": False,
        "details": False,
        "frontend": False
    }
    
    # Test 1: Search returns properties with MLS
    properties = test_commercial_search()
    if properties and any(p.get("mls") or p.get("mlsNumber") for p in properties):
        results["search"] = True
        
        # Test 2: Property details endpoint works
        test_mls = None
        for prop in properties:
            mls = prop.get("mls") or prop.get("mlsNumber")
            if mls:
                test_mls = mls
                break
        
        if test_mls:
            results["details"] = test_property_details(test_mls)
        else:
            print_error("\nSkipping Test 2: No MLS numbers found in search results")
    else:
        print_error("\nSkipping Test 2: Search test failed")
    
    # Test 3: Frontend button structure
    results["frontend"] = test_frontend_button_structure()
    
    # Summary
    print_header("TEST SUMMARY")
    print(f"\n  Test 1 - Commercial Search:      {'✅ PASS' if results['search'] else '❌ FAIL'}")
    print(f"  Test 2 - Property Details API:   {'✅ PASS' if results['details'] else '❌ FAIL'}")
    print(f"  Test 3 - Frontend Button:        {'✅ PASS' if results['frontend'] else '❌ FAIL'}")
    
    all_passed = all(results.values())
    
    if all_passed:
        print("\n" + "🎉" * 40)
        print("  ALL TESTS PASSED! Property details button should work!")
        print("🎉" * 40)
    else:
        print("\n" + "⚠️ " * 40)
        print("  SOME TESTS FAILED! Check errors above.")
        print("⚠️ " * 40)
    
    return all_passed

if __name__ == "__main__":
    print("""
    ╔════════════════════════════════════════════════════════════════════════╗
    ║                                                                        ║
    ║   Commercial Property Details Button Test Suite                       ║
    ║   ────────────────────────────────────────────────────────────────     ║
    ║                                                                        ║
    ║   This test will:                                                     ║
    ║   1. Search for commercial properties (bakeries in ottawa)           ║
    ║   2. Verify properties have MLS numbers                              ║
    ║   3. Test property details API endpoint                              ║
    ║   4. Check frontend button onclick structure                         ║
    ║                                                                        ║
    ║   Make sure the server is running on http://localhost:5050           ║
    ║                                                                        ║
    ╚════════════════════════════════════════════════════════════════════════╝
    """)
    
    input("Press ENTER to start tests...")
    
    try:
        success = run_all_tests()
        exit(0 if success else 1)
    except KeyboardInterrupt:
        print("\n\n❌ Tests interrupted by user")
        exit(1)
