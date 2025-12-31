"""
Test Exact Address Fallback - Verify graceful retry when no exact match

When a user searches for "999 Fake Street" (doesn't exist), the system should:
1. Try exact address first (streetNumber + streetName)
2. Get 0 results
3. Automatically retry with just the street name
4. Show nearby properties with clear fallback message
"""

import os
import sys
sys.path.insert(0, os.path.abspath(os.path.join(os.path.dirname(__file__), '..')))

os.environ.setdefault('ENV', 'development')

from services.chatbot_orchestrator import chatbot


def test_exact_address_fallback():
    """Test that exact address searches fall back gracefully"""
    
    print("\n" + "="*70)
    print("TEST: Exact Address Fallback")
    print("="*70)
    print("\nScenario: User searches for non-existent address")
    print("Expected: System retries with street name only and shows message")
    print()
    
    session_id = 'test_fallback_123'
    
    # Search for address that likely doesn't exist
    print("Searching for: '9999 Yonge Street'")
    response = chatbot.process_message(
        user_message="9999 Yonge Street",
        session_id=session_id
    )
    
    properties = response.get('properties', [])
    response_text = response.get('response', '')
    
    print(f"\n📊 Results:")
    print(f"  Properties returned: {len(properties)}")
    print(f"  Response contains 'No exact match': {'No exact match' in response_text}")
    print(f"  Response contains 'Showing': {'Showing' in response_text or 'showing' in response_text}")
    
    print(f"\n📝 Response text:")
    print(f"  {response_text[:200]}...")
    
    # Check if fallback worked
    if len(properties) > 0 and ('No exact match' in response_text or 'showing' in response_text.lower()):
        print("\n✅ PASS: Exact address fallback working!")
        print(f"   - System found {len(properties)} properties on Yonge Street")
        print(f"   - Clear fallback message provided to user")
        return True
    elif len(properties) == 0:
        print("\n⚠️  PARTIAL: No properties found (Yonge Street should have listings)")
        print("   This might be a Repliers API limitation")
        return False
    else:
        print("\n❌ FAIL: Fallback logic may not be working correctly")
        return False


if __name__ == "__main__":
    test_exact_address_fallback()
