"""
Test Real API Responses - Checking if Repliers API returns properties

This script tests various searches to understand what works with the real API.
"""

import os
import sys
sys.path.insert(0, os.path.abspath(os.path.join(os.path.dirname(__file__), '..')))

os.environ.setdefault('ENV', 'development')

from services.chatbot_orchestrator import chatbot
from services.conversation_state import ConversationStateManager

def test_chat_message(session_id, message):
    """Test a chat message and show results"""
    print(f"\n{'='*70}")
    print(f"USER: '{message}'")
    print(f"{'='*70}")
    
    try:
        response = chatbot.process_message(
            user_message=message,
            session_id=session_id
        )
        
        properties = response.get('properties', [])
        total = len(properties)
        
        print(f"📊 Results: {total} properties returned")
        
        if total > 0:
            print(f"✅ SUCCESS - Found {total} properties!")
            print(f"\nFirst 3 properties:")
            for i, prop in enumerate(properties[:3], 1):
                # PRODUCTION FIX: Use address_components for structured data
                addr_components = prop.get('address_components', {})
                addr_string = prop.get('address', 'No address')
                details = prop.get('details', {})
                
                # Prefer structured components, fallback to string
                if addr_components:
                    print(f"  {i}. {addr_components.get('streetNumber', '')} {addr_components.get('streetName', '')}")
                    print(f"     {addr_components.get('city', '')}, {addr_components.get('neighborhood', 'N/A')}")
                else:
                    print(f"  {i}. {addr_string}")
                
                print(f"     {details.get('propertyType', 'N/A')}, {details.get('numBedrooms', 'N/A')} beds")
            return True
        else:
            print(f"❌ No properties found")
            response_text = response.get('response_text', '')
            print(f"Response: {response_text[:150]}...")
            return False
            
    except Exception as e:
        print(f"❌ Error: {e}")
        import traceback
        traceback.print_exc()
        return False

print("\n" + "="*70)
print("REAL API TESTS - Testing Various Searches")
print("="*70)

# Create a unique session ID
session_id = 'test_real_api_123'

# Get state manager instance
state_manager = ConversationStateManager()

# Test 1: Very broad search
print("\n" + "="*70)
print("TEST 1: Broad Toronto search")
print("="*70)
test_chat_message(session_id, "properties for sale in Toronto")

# Test 2: Toronto condos
print("\n" + "="*70)
print("TEST 2: Toronto condos")
print("="*70)
session_id2 = 'test_real_api_456'
test_chat_message(session_id2, "condos for sale in Toronto")

# Test 3: Downtown condos
print("\n" + "="*70)
print("TEST 3: Downtown Toronto condos")
print("="*70)
session_id3 = 'test_real_api_789'
test_chat_message(session_id3, "condos in downtown Toronto")

# Test 4: Location hierarchy test - street then neighborhood
print("\n" + "="*70)
print("TEST 4: Location Hierarchy Fix")
print("="*70)
session_id4 = 'test_hierarchy_abc'

print("\nStep 1: Search for specific address")
test_chat_message(session_id4, "88 Scott Street")

print("\nStep 2: Search for neighborhood (should clear old address)")
result = test_chat_message(session_id4, "condos in King West")

# Check the actual state
state = state_manager.get_or_create(session_id4)
print(f"\n📍 Final location state: {state.location_state.get_summary()}")

if state.location_state.streetNumber is None and state.location_state.streetName is None:
    print("✅ PASS: Street address correctly cleared!")
else:
    print(f"❌ FAIL: Street address not cleared: {state.location_state.streetNumber} {state.location_state.streetName}")

print("\n" + "="*70)
print("ALL TESTS COMPLETE")
print("="*70)
