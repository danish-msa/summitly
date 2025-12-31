#!/usr/bin/env python3
"""
Test script for location filtering system
Tests extraction, merging, and API integration
"""

import sys
from pathlib import Path

# Add parent directory to path
sys.path.insert(0, str(Path(__file__).parent.parent))

from services.location_extractor import location_extractor, LocationState
from services.conversation_state import ConversationState

def test_basic_extraction():
    """Test basic location extraction"""
    print("\n" + "="*60)
    print("TEST 1: Basic Location Extraction")
    print("="*60)
    
    test_cases = [
        "Find condos in Toronto",
        "Properties in Yorkville",
        "123 King Street West",
        "properties in M5V 3A8",
        "Show me houses in Mississauga",
    ]
    
    for msg in test_cases:
        loc = location_extractor.extract_location_entities(msg)
        print(f"✓ '{msg}'")
        print(f"  → {loc.get_summary()}")
        print(f"  → {loc.to_dict()}")
        print()

def test_contextual_references():
    """Test contextual references like 'same area', 'this neighborhood'"""
    print("\n" + "="*60)
    print("TEST 2: Contextual References")
    print("="*60)
    
    # Setup: Previous location is Liberty Village, Toronto
    prev = LocationState(city="Toronto", neighborhood="Liberty Village")
    print(f"Previous location: {prev.get_summary()}")
    print()
    
    test_cases = [
        "only in this neighborhood",
        "same area but rentals",
        "on this street",
        "nearby properties",
    ]
    
    for msg in test_cases:
        loc = location_extractor.extract_location_entities(msg, previous_location=prev)
        print(f"✓ '{msg}'")
        print(f"  → {loc.get_summary()}")
        print()

def test_state_merging():
    """Test intelligent state merging"""
    print("\n" + "="*60)
    print("TEST 3: State Merging")
    print("="*60)
    
    state = ConversationState(session_id="test123")
    
    # Step 1: Set city
    print("Step 1: User says 'Find condos in Toronto'")
    loc1 = LocationState(city="Toronto")
    state.update_location_state(loc1, merge=True)
    print(f"  → State: {state.location_state.get_summary()}")
    print()
    
    # Step 2: Add neighborhood
    print("Step 2: User says 'only in Yorkville'")
    loc2 = LocationState(neighborhood="Yorkville")
    state.update_location_state(loc2, merge=True)
    print(f"  → State: {state.location_state.get_summary()}")
    print()
    
    # Step 3: Add street
    print("Step 3: User says 'on King Street'")
    loc3 = LocationState(streetName="King")
    state.update_location_state(loc3, merge=True)
    print(f"  → State: {state.location_state.get_summary()}")
    print()
    
    # Step 4: Change city (fresh search)
    print("Step 4: User says 'Show me properties in Mississauga'")
    loc4 = LocationState(city="Mississauga")
    state.update_location_state(loc4, merge=False, user_explicitly_changed=True)
    print(f"  → State: {state.location_state.get_summary()}")
    print()

def test_location_hierarchy():
    """Test location hierarchy in Repliers API params"""
    print("\n" + "="*60)
    print("TEST 4: Location Hierarchy")
    print("="*60)
    
    from services.repliers_filter_mapper import buildRepliersSearchParams
    
    test_cases = [
        {
            "name": "City only",
            "location_state": LocationState(city="Toronto"),
            "expected": "city=Toronto"
        },
        {
            "name": "City + Neighborhood",
            "location_state": LocationState(city="Toronto", neighborhood="Yorkville"),
            "expected": "city=Toronto, neighborhood=Yorkville"
        },
        {
            "name": "City + Street",
            "location_state": LocationState(city="Toronto", streetName="King"),
            "expected": "streetName=King (city for context)"
        },
        {
            "name": "Full address",
            "location_state": LocationState(
                city="Toronto", 
                streetName="King", 
                streetNumber="123"
            ),
            "expected": "streetNumber=123, streetName=King"
        },
    ]
    
    for case in test_cases:
        print(f"✓ {case['name']}")
        state = ConversationState(session_id="test")
        state.location_state = case['location_state']
        
        params = buildRepliersSearchParams(state, "")
        location_params = {k: v for k, v in params.items() if k in [
            'city', 'community', 'neighborhood', 'postal_code', 
            'street_name', 'street_number'
        ]}
        print(f"  → Params: {location_params}")
        print(f"  → Expected: {case['expected']}")
        print()

def test_conversation_flow():
    """Test a realistic conversation flow"""
    print("\n" + "="*60)
    print("TEST 5: Realistic Conversation Flow")
    print("="*60)
    
    state = ConversationState(session_id="test")
    
    conversation = [
        "Find 2 bedroom condos in Toronto",
        "only in Yorkville",
        "with 2 bathrooms",
        "same area but rentals",
        "under $4000 per month",
        "Show me properties in Mississauga instead",
    ]
    
    for i, msg in enumerate(conversation, 1):
        print(f"User ({i}): {msg}")
        
        # Extract location
        loc = location_extractor.extract_location_entities(
            msg,
            previous_location=state.location_state
        )
        
        # Detect if user is changing cities
        user_changed_city = (
            loc.city is not None and 
            state.location_state.city is not None and
            loc.city != state.location_state.city
        )
        
        # Update state
        if not loc.is_empty():
            state.update_location_state(
                loc,
                merge=not user_changed_city,
                user_explicitly_changed=user_changed_city
            )
        
        print(f"  → Location: {state.location_state.get_summary()}")
        print()

def main():
    """Run all tests"""
    print("🧪 Location Filtering System Test Suite")
    print("=" * 60)
    
    try:
        test_basic_extraction()
        test_contextual_references()
        test_state_merging()
        test_location_hierarchy()
        test_conversation_flow()
        
        print("\n" + "="*60)
        print("✅ All tests completed successfully!")
        print("="*60)
        
    except Exception as e:
        print("\n" + "="*60)
        print(f"❌ Test failed: {e}")
        print("="*60)
        import traceback
        traceback.print_exc()
        sys.exit(1)

if __name__ == "__main__":
    main()
