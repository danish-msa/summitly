"""
Test Location Hierarchy and Fresh Search Logic

This test verifies that when users specify a NEW location type (like neighborhood),
the system correctly CLEARS more specific location types (like street address)
instead of merging them together.

Example issue:
User: "10 York Street" → streetNumber=10, streetName="York Street"
User: "condos in King West" → Should clear street address, search King West only
Bug: Was keeping both → streetNumber=10, streetName="York Street", neighborhood="King West"
"""

import sys
import os
sys.path.insert(0, os.path.abspath(os.path.join(os.path.dirname(__file__), '..')))

from services.conversation_state import ConversationState, LocationState

def test_neighborhood_clears_street_address():
    """Test that specifying a neighborhood clears old street address"""
    print("\n" + "="*70)
    print("TEST 1: Neighborhood search should clear old street address")
    print("="*70)
    
    state = ConversationState(session_id='test_hierarchy_1')
    
    # Step 1: Search specific address
    print("\nStep 1: User searches '10 York Street'")
    location1 = LocationState(
        city='Toronto',
        streetName='York Street',
        streetNumber='10'
    )
    state.update_location_state(location1, merge=True)
    
    print(f"   Result: {state.location_state.get_summary()}")
    assert state.location_state.streetNumber == '10'
    assert state.location_state.streetName == 'York Street'
    assert state.location_state.neighborhood is None
    print("   ✅ Street address stored correctly")
    
    # Step 2: Search neighborhood
    print("\nStep 2: User searches 'condos in King West'")
    location2 = LocationState(
        city='Toronto',
        neighborhood='King West'
    )
    state.update_location_state(location2, merge=True)
    
    print(f"   Result: {state.location_state.get_summary()}")
    assert state.location_state.neighborhood == 'King West'
    assert state.location_state.streetNumber is None, f"ERROR: streetNumber should be None, got {state.location_state.streetNumber}"
    assert state.location_state.streetName is None, f"ERROR: streetName should be None, got {state.location_state.streetName}"
    assert state.location_state.city == 'Toronto'
    print("   ✅ PASS: Street address cleared, neighborhood set")
    
    return True

def test_city_clears_all_specifics():
    """Test that specifying just a city clears all specific location details"""
    print("\n" + "="*70)
    print("TEST 2: City-only search should clear all specific details")
    print("="*70)
    
    state = ConversationState(session_id='test_hierarchy_2')
    
    # Step 1: Search specific address (street address takes priority over neighborhood)
    print("\nStep 1: User searches '123 King Street West'")
    location1 = LocationState(
        city='Toronto',
        streetName='King Street West',
        streetNumber='123'
    )
    state.update_location_state(location1, merge=True)
    
    print(f"   Result: {state.location_state.get_summary()}")
    assert state.location_state.streetNumber == '123'
    assert state.location_state.streetName == 'King Street West'
    print("   ✅ Detailed location stored")
    
    # Step 2: Search just city
    print("\nStep 2: User searches 'properties in Toronto'")
    location2 = LocationState(city='Toronto')
    state.update_location_state(location2, merge=True)
    
    print(f"   Result: {state.location_state.get_summary()}")
    assert state.location_state.city == 'Toronto'
    assert state.location_state.streetNumber is None, f"ERROR: streetNumber should be cleared"
    assert state.location_state.streetName is None, f"ERROR: streetName should be cleared"
    assert state.location_state.neighborhood is None, f"ERROR: neighborhood should be cleared"
    print("   ✅ PASS: All specific details cleared, city-only search")
    
    return True

def test_street_name_clears_street_number():
    """Test that specifying just street name clears old street number"""
    print("\n" + "="*70)
    print("TEST 3: Street name search should clear old street number")
    print("="*70)
    
    state = ConversationState(session_id='test_hierarchy_3')
    
    # Step 1: Search specific address
    print("\nStep 1: User searches '123 King Street West'")
    location1 = LocationState(
        city='Toronto',
        streetName='King Street West',
        streetNumber='123'
    )
    state.update_location_state(location1, merge=True)
    
    print(f"   Result: {state.location_state.get_summary()}")
    assert state.location_state.streetNumber == '123'
    print("   ✅ Specific address stored")
    
    # Step 2: Search just street name
    print("\nStep 2: User searches 'properties on Yonge Street'")
    location2 = LocationState(
        city='Toronto',
        streetName='Yonge Street'
    )
    state.update_location_state(location2, merge=True)
    
    print(f"   Result: {state.location_state.get_summary()}")
    assert state.location_state.streetName == 'Yonge Street'
    assert state.location_state.streetNumber is None, f"ERROR: streetNumber should be cleared"
    assert state.location_state.city == 'Toronto'
    print("   ✅ PASS: Street number cleared, street name updated")
    
    return True

def test_street_address_keeps_city():
    """Test that street address search preserves city"""
    print("\n" + "="*70)
    print("TEST 4: Street address search should keep city from context")
    print("="*70)
    
    state = ConversationState(session_id='test_hierarchy_4')
    
    # Step 1: Set city context
    print("\nStep 1: User searches 'properties in Mississauga'")
    location1 = LocationState(city='Mississauga')
    state.update_location_state(location1, merge=True)
    
    print(f"   Result: {state.location_state.get_summary()}")
    assert state.location_state.city == 'Mississauga'
    print("   ✅ City context set")
    
    # Step 2: Search street address without mentioning city
    print("\nStep 2: User searches '50 Absolute Avenue' (no city mentioned)")
    location2 = LocationState(
        streetName='Absolute Avenue',
        streetNumber='50'
    )
    state.update_location_state(location2, merge=True)
    
    print(f"   Result: {state.location_state.get_summary()}")
    assert state.location_state.streetName == 'Absolute Avenue'
    assert state.location_state.streetNumber == '50'
    assert state.location_state.city == 'Mississauga', f"ERROR: City should be preserved from context"
    print("   ✅ PASS: City context preserved with new street address")
    
    return True

def test_real_world_scenario():
    """Test the exact scenario from the bug report"""
    print("\n" + "="*70)
    print("TEST 5: Real-world scenario - Multiple location searches")
    print("="*70)
    
    state = ConversationState(session_id='test_realworld')
    
    # Simulate the exact user flow from the bug
    searches = [
        ("properties in Yonge Street", LocationState(city='Toronto', streetName='Yonge Street')),
        ("123 King Street West", LocationState(city='Toronto', streetName='King Street West', streetNumber='123')),
        ("1 Bloor Street East", LocationState(city='Toronto', streetName='Bloor Street East', streetNumber='1')),
        ("properties in 88 Scott Street", LocationState(city='Toronto', streetName='Scott Street', streetNumber='88')),
        ("condos in King West", LocationState(city='Toronto', neighborhood='King West'))
    ]
    
    for i, (query, location) in enumerate(searches, 1):
        print(f"\nSearch {i}: '{query}'")
        state.update_location_state(location, merge=True)
        print(f"   Result: {state.location_state.get_summary()}")
        
        if i == 5:  # Last search: "condos in King West"
            # Should NOT have street address from previous searches
            assert state.location_state.neighborhood == 'King West'
            assert state.location_state.streetNumber is None, \
                f"ERROR: Should not keep streetNumber '88' from previous search"
            assert state.location_state.streetName is None, \
                f"ERROR: Should not keep streetName 'Scott Street' from previous search"
            print("   ✅ PASS: King West neighborhood search (no old street address)")
    
    return True

if __name__ == '__main__':
    print("\n" + "="*70)
    print("TESTING LOCATION HIERARCHY & FRESH SEARCH LOGIC")
    print("="*70)
    
    tests = [
        test_neighborhood_clears_street_address,
        test_city_clears_all_specifics,
        test_street_name_clears_street_number,
        test_street_address_keeps_city,
        test_real_world_scenario
    ]
    
    passed = 0
    failed = 0
    
    for test_func in tests:
        try:
            if test_func():
                passed += 1
        except AssertionError as e:
            print(f"\n   ❌ FAILED: {e}")
            failed += 1
        except Exception as e:
            print(f"\n   ❌ ERROR: {e}")
            failed += 1
    
    print("\n" + "="*70)
    print(f"RESULTS: {passed}/{len(tests)} tests passed")
    if failed == 0:
        print("✅ ALL TESTS PASSED!")
    else:
        print(f"❌ {failed} tests failed")
    print("="*70 + "\n")
