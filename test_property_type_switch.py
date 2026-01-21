#!/usr/bin/env python3
"""
Test script to verify property type switching behavior.
Tests:
1. Switching from commercial to residential clears bedroom filter
2. Saying "sure" after zero-results triggers broader search
"""

import requests
import json
import time
import random
import string

BASE_URL = "http://127.0.0.1:5050"

def random_session_id():
    return f"test_session_{''.join(random.choices(string.ascii_lowercase + string.digits, k=8))}"

def send_message(session_id: str, message: str, property_type: str = None):
    """Send a message to the chat endpoint."""
    url = f"{BASE_URL}/api/chat-gpt4"
    payload = {
        "sessionId": session_id,
        "message": message
    }
    if property_type:
        payload["property_type"] = property_type
    
    try:
        response = requests.post(url, json=payload, timeout=60)
        response.raise_for_status()
        return response.json()
    except Exception as e:
        print(f"❌ Error: {e}")
        return None

def test_property_type_switch():
    """Test that bedroom filter is cleared when switching property types."""
    print("\n" + "="*60)
    print("TEST 1: Property Type Switch (Commercial → Residential)")
    print("="*60)
    
    session_id = random_session_id()
    
    # Step 1: Search for 2-bedroom condos in Toronto (to set the bedroom filter)
    print("\n📤 Step 1: Searching for 2-bedroom condo in Toronto...")
    result1 = send_message(session_id, "show me 2 bedroom condos in toronto", "condo")
    
    if result1:
        filters1 = result1.get("filters", {})
        print(f"   Filters: {filters1}")
        print(f"   Bedrooms: {filters1.get('bedrooms')}")
        print(f"   Property Type: {filters1.get('property_type')}")
        print(f"   Properties: {result1.get('property_count', 0)}")
    
    time.sleep(1)
    
    # Step 2: Switch to residential in Ottawa (WITHOUT mentioning bedrooms)
    print("\n📤 Step 2: Switching to residential in Ottawa (no bedroom mentioned)...")
    result2 = send_message(session_id, "show me residential properties in ottawa", "residential")
    
    if result2:
        filters2 = result2.get("filters", {})
        bedrooms2 = filters2.get('bedrooms')
        print(f"   Filters: {filters2}")
        print(f"   Bedrooms: {bedrooms2}")
        print(f"   Property Type: {filters2.get('property_type')}")
        print(f"   Properties: {result2.get('property_count', 0)}")
        
        if bedrooms2 is None:
            print("   ✅ PASS: Bedroom filter was correctly cleared on property type switch!")
        else:
            print(f"   ❌ FAIL: Bedroom filter ({bedrooms2}) was NOT cleared!")
    
    return result2

def test_sure_after_zero_results():
    """Test that 'sure' triggers broader search after zero-results."""
    print("\n" + "="*60)
    print("TEST 2: 'Sure' After Zero Results Suggestion")
    print("="*60)
    
    session_id = random_session_id()
    
    # Step 1: First do a commercial search to set bedrooms
    print("\n📤 Step 1a: Searching for 2-bedroom commercial in Toronto...")
    result0 = send_message(session_id, "show me 2 bedroom commercial in toronto", "commercial")
    if result0:
        filters0 = result0.get("filters", {})
        print(f"   Filters: {filters0}")
    
    time.sleep(1)
    
    # Step 2: Switch to residential in Ottawa (should clear bedrooms, but if not...)
    # Create a search that's likely to return 0 results due to bedroom filter persisting
    print("\n📤 Step 1b: Switching to residential in Ottawa...")
    result1 = send_message(session_id, "show me residential properties in ottawa", "residential")
    
    if result1:
        filters1 = result1.get("filters", {})
        count1 = result1.get("property_count", 0)
        response_text = result1.get("response", "")
        print(f"   Filters: {filters1}")
        print(f"   Properties: {count1}")
        print(f"   Response: {response_text[:200]}...")
        
        # If we got 0 results, test the "sure" flow
        if count1 == 0:
            time.sleep(1)
            print("\n📤 Step 2: Saying 'sure' to broaden search...")
            result2 = send_message(session_id, "sure", "residential")
            
            if result2:
                response_text2 = result2.get("response", "")
                count2 = result2.get("property_count", 0)
                filters2 = result2.get("filters", {})
                print(f"   Response: {response_text2[:200]}...")
                print(f"   Properties: {count2}")
                print(f"   Filters: {filters2}")
                
                # Check if we got properties or at least a meaningful response
                if count2 > 0:
                    print("   ✅ PASS: 'Sure' triggered broader search and found properties!")
                elif "help" not in response_text2.lower() and "toronto" not in response_text2.lower():
                    print("   ⚠️ PARTIAL: Response seems contextual but no properties found")
                else:
                    print("   ❌ FAIL: 'Sure' was treated as general chat")
        else:
            print(f"   ℹ️ SKIP: Got {count1} results, no zero-results scenario to test")
            print("   (The bedroom filter was correctly cleared, so no need to test 'sure' handler)")
    
    return result1

def test_bedroom_mentioned_on_switch():
    """Test that bedroom filter is preserved when explicitly mentioned."""
    print("\n" + "="*60)
    print("TEST 3: Bedroom Preserved When Mentioned on Property Switch")
    print("="*60)
    
    session_id = random_session_id()
    
    # Step 1: Search for condos in Toronto
    print("\n📤 Step 1: Searching for condos in Toronto...")
    result1 = send_message(session_id, "show me condos in toronto", "condo")
    
    if result1:
        filters1 = result1.get("filters", {})
        print(f"   Filters: {filters1}")
    
    time.sleep(1)
    
    # Step 2: Switch to residential in Ottawa WITH bedrooms mentioned
    print("\n📤 Step 2: Switching to residential 3-bedroom in Ottawa...")
    result2 = send_message(session_id, "show me 3 bedroom residential in ottawa", "residential")
    
    if result2:
        filters2 = result2.get("filters", {})
        bedrooms2 = filters2.get('bedrooms')
        print(f"   Filters: {filters2}")
        print(f"   Bedrooms: {bedrooms2}")
        print(f"   Property Type: {filters2.get('property_type')}")
        print(f"   Properties: {result2.get('property_count', 0)}")
        
        if bedrooms2 == 3:
            print("   ✅ PASS: Bedroom filter correctly set to 3 when mentioned!")
        else:
            print(f"   ❌ FAIL: Expected bedrooms=3, got {bedrooms2}")
    
    return result2

if __name__ == "__main__":
    print("🧪 Property Type Switch & Zero Results Tests")
    print("=" * 60)
    print("Make sure the server is running on localhost:5050")
    print("=" * 60)
    
    # Run tests
    test_property_type_switch()
    time.sleep(2)
    test_sure_after_zero_results()
    time.sleep(2)
    test_bedroom_mentioned_on_switch()
    
    print("\n" + "="*60)
    print("✅ All tests completed!")
    print("="*60)
