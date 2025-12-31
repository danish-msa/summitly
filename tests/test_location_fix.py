#!/usr/bin/env python3
"""
Quick test to verify location_state persistence fix
"""

import sys
from pathlib import Path
sys.path.insert(0, str(Path(__file__).parent.parent))

from services.conversation_state import ConversationState
from services.location_extractor import LocationState

def test_location_state_persistence():
    """Test that location_state persists correctly"""
    print("\n" + "="*60)
    print("TEST: Location State Persistence Fix")
    print("="*60)
    
    # Create a conversation state
    state = ConversationState(session_id="test123")
    print(f"\n1. Initial state:")
    print(f"   location_state: {state.location_state.get_summary()}")
    
    # Update with location_state (as LocationState object)
    york_location = LocationState(city="Toronto", neighborhood="Yorkville")
    updates = {"location_state": york_location}
    
    print(f"\n2. Applying updates: {list(updates.keys())}")
    print(f"   location_state value: {york_location.get_summary()}")
    
    state.update_from_dict(updates)
    
    print(f"\n3. After update:")
    print(f"   location_state: {state.location_state.get_summary()}")
    print(f"   location: {state.location}")
    
    # Verify it persisted
    if state.location_state.neighborhood == "Yorkville":
        print(f"\n✅ SUCCESS: location_state persisted correctly!")
        return True
    else:
        print(f"\n❌ FAILURE: location_state NOT persisted!")
        print(f"   Expected neighborhood: Yorkville")
        print(f"   Got: {state.location_state.neighborhood}")
        return False

def test_location_state_merging():
    """Test that location_state merges correctly"""
    print("\n" + "="*60)
    print("TEST: Location State Merging")
    print("="*60)
    
    state = ConversationState(session_id="test456")
    
    # First update: city
    print(f"\n1. Set city to Toronto")
    state.update_from_dict({"location_state": LocationState(city="Toronto")})
    print(f"   Result: {state.location_state.get_summary()}")
    
    # Second update: add neighborhood (should preserve city)
    print(f"\n2. Add neighborhood Yorkville (should preserve city)")
    state.update_from_dict({"location_state": LocationState(neighborhood="Yorkville")})
    print(f"   Result: {state.location_state.get_summary()}")
    
    # Verify both are preserved
    if state.location_state.city == "Toronto" and state.location_state.neighborhood == "Yorkville":
        print(f"\n✅ SUCCESS: Merging preserved existing fields!")
        return True
    else:
        print(f"\n❌ FAILURE: Merging did not preserve fields!")
        print(f"   Expected: Yorkville, Toronto")
        print(f"   Got: {state.location_state.get_summary()}")
        return False

if __name__ == "__main__":
    test1 = test_location_state_persistence()
    test2 = test_location_state_merging()
    
    print("\n" + "="*60)
    if test1 and test2:
        print("✅ ALL TESTS PASSED!")
    else:
        print("❌ SOME TESTS FAILED!")
    print("="*60)
    
    sys.exit(0 if (test1 and test2) else 1)
