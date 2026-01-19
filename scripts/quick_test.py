#!/usr/bin/env python3
"""
Quick Test Runner - Test postal code fix immediately
Usage: python scripts/quick_test.py
"""

import requests
import json

BASE_URL = "http://localhost:5050"

def test_postal_code_commercial():
    """Test M6B commercial postal code search"""
    print("\n" + "="*80)
    print("🧪 TEST: Commercial Properties Near M6B")
    print("="*80)
    
    response = requests.post(
        f"{BASE_URL}/api/chat-gpt4",
        json={
            "message": "Commercial properties near M6B",
            "property_type": "commercial",
            "session_id": "test_m6b_commercial"
        }
    )
    
    data = response.json()
    
    print(f"\n✅ Response: {data.get('agent_response', '')}")
    print(f"📊 Properties found: {data.get('property_count', 0)}")
    
    properties = data.get('properties', [])
    if properties:
        print(f"\n📋 First 3 properties:")
        for i, prop in enumerate(properties[:3], 1):
            prop_class = prop.get('class', 'Unknown')
            prop_type = prop.get('type', 'Unknown')
            address = prop.get('address', {})
            postal = address.get('postalCode', 'N/A')
            print(f"  {i}. {prop.get('mlsNumber')} - {prop_class} - Postal: {postal}")
            
            # CRITICAL CHECK: Should be commercial only
            if 'commercial' not in prop_class.lower():
                print(f"     ❌ WRONG TYPE! Expected Commercial, got {prop_class}")
            else:
                print(f"     ✅ Correct type: {prop_class}")
    else:
        print("❌ NO PROPERTIES RETURNED")
    
    return data

def test_residential_postal():
    """Test residential postal code search"""
    print("\n" + "="*80)
    print("🧪 TEST: Residential Properties Near M5V")
    print("="*80)
    
    response = requests.post(
        f"{BASE_URL}/api/chat-gpt4",
        json={
            "message": "Residential properties near M5V",
            "property_type": "residential",
            "session_id": "test_m5v_residential"
        }
    )
    
    data = response.json()
    
    print(f"\n✅ Response: {data.get('agent_response', '')}")
    print(f"📊 Properties found: {data.get('property_count', 0)}")
    
    properties = data.get('properties', [])
    if properties:
        print(f"\n📋 First 3 properties:")
        for i, prop in enumerate(properties[:3], 1):
            prop_class = prop.get('class', 'Unknown')
            address = prop.get('address', {})
            postal = address.get('postalCode', 'N/A')
            print(f"  {i}. {prop.get('mlsNumber')} - {prop_class} - Postal: {postal}")
            
            # Check for wrong type
            if 'commercial' in prop_class.lower():
                print(f"     ❌ WRONG TYPE! Expected Residential, got {prop_class}")
            elif 'condo' in prop_class.lower() and 'residential' not in prop_class.lower():
                print(f"     ⚠️ WARNING: Showing condo in residential search")
            else:
                print(f"     ✅ Correct type: {prop_class}")
    
    return data

def test_condo_postal():
    """Test condo postal code search"""
    print("\n" + "="*80)
    print("🧪 TEST: Condo Near M4Y")
    print("="*80)
    
    response = requests.post(
        f"{BASE_URL}/api/chat-gpt4",
        json={
            "message": "Condo near M4Y",
            "property_type": "condo",
            "session_id": "test_m4y_condo"
        }
    )
    
    data = response.json()
    
    print(f"\n✅ Response: {data.get('agent_response', '')}")
    print(f"📊 Properties found: {data.get('property_count', 0)}")
    
    properties = data.get('properties', [])
    if properties:
        print(f"\n📋 First 3 properties:")
        for i, prop in enumerate(properties[:3], 1):
            prop_class = prop.get('class', 'Unknown')
            address = prop.get('address', {})
            postal = address.get('postalCode', 'N/A')
            print(f"  {i}. {prop.get('mlsNumber')} - {prop_class} - Postal: {postal}")
            
            if 'condo' not in prop_class.lower():
                print(f"     ❌ WRONG TYPE! Expected Condo, got {prop_class}")
            else:
                print(f"     ✅ Correct type: {prop_class}")
    
    return data

def test_conversation_flow():
    """Test multi-turn conversation"""
    print("\n" + "="*80)
    print("🧪 TEST: Conversation Flow")
    print("="*80)
    
    session_id = "test_conversation_flow"
    
    # Turn 1: Greeting
    print("\n👤 User: Hello")
    r1 = requests.post(
        f"{BASE_URL}/api/chat-gpt4",
        json={"message": "Hello", "session_id": session_id}
    )
    print(f"🤖 Bot: {r1.json().get('agent_response', '')[:200]}...")
    
    # Turn 2: Vague request
    print("\n👤 User: I want to buy property")
    r2 = requests.post(
        f"{BASE_URL}/api/chat-gpt4",
        json={"message": "I want to buy property", "session_id": session_id}
    )
    print(f"🤖 Bot: {r2.json().get('agent_response', '')[:200]}...")
    
    # Turn 3: Specific request
    print("\n👤 User: Commercial in Toronto under $500,000")
    r3 = requests.post(
        f"{BASE_URL}/api/chat-gpt4",
        json={
            "message": "Commercial in Toronto under $500,000",
            "property_type": "commercial",
            "session_id": session_id
        }
    )
    data3 = r3.json()
    print(f"🤖 Bot: {data3.get('agent_response', '')[:200]}...")
    print(f"📊 Properties: {data3.get('property_count', 0)}")
    
    return data3

if __name__ == "__main__":
    print("\n🚀 QUICK TEST SUITE - Postal Code Fix Verification")
    print("="*80)
    
    try:
        # Test 1: Commercial postal code (main fix)
        test_postal_code_commercial()
        
        # Test 2: Residential postal code
        test_residential_postal()
        
        # Test 3: Condo postal code
        test_condo_postal()
        
        # Test 4: Conversation flow
        test_conversation_flow()
        
        print("\n" + "="*80)
        print("✅ ALL TESTS COMPLETED")
        print("="*80)
        
    except Exception as e:
        print(f"\n❌ TEST FAILED: {e}")
        import traceback
        traceback.print_exc()
