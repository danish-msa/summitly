#!/usr/bin/env python3
"""
Test: Fix for "any properties work for me" not clearing filters
Issue: User says "any properties" but system keeps 4 bed/2 bath filters
Expected: Should clear restrictive filters and show broader results
"""

import sys
from pathlib import Path
sys.path.insert(0, str(Path(__file__).parent.parent))

from services.chatbot_orchestrator import ChatGPTChatbot
from services.conversation_state import ConversationState

def test_any_properties_clears_filters():
    """Test that 'any properties' phrase clears restrictive filters"""
    print("\n" + "="*60)
    print("TEST: Any Properties Clears Restrictive Filters")
    print("="*60)
    
    orchestrator = ChatGPTChatbot()
    
    # Simulate conversation state with restrictive filters
    state = ConversationState(session_id="test_any_props")
    state.location = "Mississauga"
    state.bedrooms = 4
    state.bathrooms = 2
    state.property_type = "condo"
    state.listing_type = "rent"
    
    print("\n📊 BEFORE: Current state with restrictive filters:")
    print(f"   Location: {state.location}")
    print(f"   Bedrooms: {state.bedrooms}")
    print(f"   Bathrooms: {state.bathrooms}")
    print(f"   Property Type: {state.property_type}")
    print(f"   Listing Type: {state.listing_type}")
    
    # Simulate GPT interpreter response (what it would return)
    filters_from_gpt = {
        "location": "Mississauga",
        "bedrooms": None,  # Should be cleared
        "bathrooms": None,  # Should be cleared
        "property_type": None,  # Should be cleared
        "listing_type": "rent"  # Should keep
    }
    
    # Process "any properties work for me" message
    user_message = "any properties work for me"
    print(f"\n💬 USER: '{user_message}'")
    
    # Use the internal method to normalize filters
    updates = orchestrator._normalize_filters_for_state(
        filters_from_gpt, 
        merge=False,  # Fresh search
        user_message=user_message,
        current_state=state
    )
    
    print("\n🔧 UPDATES generated:")
    for key, value in updates.items():
        print(f"   {key}: {value}")
    
    # Verify broad search pattern detected
    assert updates.get("bedrooms") is None, "❌ Bedrooms should be cleared"
    assert updates.get("bathrooms") is None, "❌ Bathrooms should be cleared"
    assert updates.get("property_type") is None, "❌ Property type should be cleared"
    assert updates.get("price_range") == (None, None), "❌ Price range should be cleared"
    assert updates.get("sqft_range") == (None, None), "❌ Sqft range should be cleared"
    
    print("\n✅ TEST PASSED: All restrictive filters cleared!")
    print("   User can now see ANY properties in Mississauga for rent")
    
    return True

def test_location_persistence_with_any_properties():
    """Test that location persists when user says 'any properties'"""
    print("\n" + "="*60)
    print("TEST: Location Persists with 'Any Properties'")
    print("="*60)
    
    orchestrator = ChatGPTChatbot()
    
    # Simulate: User searched "Show me properties in Mississauga instead"
    # Then: "any properties work for me"
    state = ConversationState(session_id="test_location_persist")
    state.location = "Mississauga"
    state.bedrooms = 4
    state.bathrooms = 2
    
    print("\n📊 Context: User just searched 'Show me properties in Mississauga instead'")
    print(f"   Current location: {state.location}")
    print(f"   Current bedrooms: {state.bedrooms}")
    print(f"   Current bathrooms: {state.bathrooms}")
    
    # User now says "any properties work for me"
    user_message = "any properties work for me"
    print(f"\n💬 USER: '{user_message}'")
    
    # GPT should NOT extract "Annex" from previous conversation
    # It should keep Mississauga and clear filters
    filters_from_gpt = {
        "location": "Mississauga",  # Should keep the LAST mentioned location
        "bedrooms": None,
        "bathrooms": None,
        "property_type": None
    }
    
    updates = orchestrator._normalize_filters_for_state(
        filters_from_gpt,
        merge=False,
        user_message=user_message,
        current_state=state
    )
    
    print("\n🔧 UPDATES generated:")
    for key, value in updates.items():
        print(f"   {key}: {value}")
    
    # Verify location kept, filters cleared
    assert updates.get("location") == "Mississauga", "❌ Should keep Mississauga location"
    assert updates.get("bedrooms") is None, "❌ Bedrooms should be cleared"
    assert updates.get("bathrooms") is None, "❌ Bathrooms should be cleared"
    
    print("\n✅ TEST PASSED: Location persisted, filters cleared!")
    print("   Will search ANY properties in Mississauga (not Annex)")
    
    return True

def test_different_any_properties_phrases():
    """Test various phrasings of 'any properties'"""
    print("\n" + "="*60)
    print("TEST: Different 'Any Properties' Phrasings")
    print("="*60)
    
    orchestrator = ChatGPTChatbot()
    state = ConversationState(session_id="test_phrases")
    state.bedrooms = 3
    state.bathrooms = 2
    state.price_range = (500000, 800000)
    
    test_phrases = [
        "any properties work for me",
        "anything works",
        "whatever you have",
        "show me anything",
        "any property works",
        "anything is fine"
    ]
    
    print(f"\n📊 Testing {len(test_phrases)} different phrasings...")
    
    passed = 0
    for phrase in test_phrases:
        filters_from_gpt = {
            "bedrooms": None,
            "bathrooms": None
        }
        
        updates = orchestrator._normalize_filters_for_state(
            filters_from_gpt,
            merge=False,
            user_message=phrase,
            current_state=state
        )
        
        # Check if broad search detected
        filters_cleared = (
            updates.get("bedrooms") is None and
            updates.get("bathrooms") is None and
            updates.get("price_range") == (None, None)
        )
        
        if filters_cleared:
            print(f"   ✅ '{phrase}' → Filters cleared")
            passed += 1
        else:
            print(f"   ❌ '{phrase}' → Filters NOT cleared")
    
    print(f"\n{'✅' if passed == len(test_phrases) else '⚠️'} RESULT: {passed}/{len(test_phrases)} phrases detected correctly")
    
    return passed == len(test_phrases)

if __name__ == "__main__":
    print("\n" + "🔧 TESTING: 'Any Properties' Filter Clearing Fix" + "\n")
    
    try:
        test1 = test_any_properties_clears_filters()
        test2 = test_location_persistence_with_any_properties()
        test3 = test_different_any_properties_phrases()
        
        print("\n" + "="*60)
        if test1 and test2 and test3:
            print("✅ ALL TESTS PASSED!")
        else:
            print("⚠️ SOME TESTS FAILED")
        print("="*60 + "\n")
        
    except Exception as e:
        print(f"\n❌ TEST ERROR: {e}")
        import traceback
        traceback.print_exc()
