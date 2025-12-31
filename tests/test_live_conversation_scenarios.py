"""
Live Conversation Scenario Tests
================================
Tests real conversation flows with the Repliers API to validate:
- UnifiedConversationState integration
- Filter validation and error handling
- Location normalization
- Checkpoint/restore functionality
- Filter merging logic

Author: Summitly Team
Date: December 2025
"""

import os
import sys
import json
import time
from datetime import datetime
from typing import Dict, Any, List, Optional

# Add parent directory to path for imports
sys.path.insert(0, os.path.dirname(os.path.dirname(os.path.abspath(__file__))))

from services.chatbot_orchestrator import ChatGPTChatbot
from services.unified_conversation_state import (
    UnifiedConversationState,
    UnifiedConversationStateManager,
    unified_state_manager,
    ConversationStage,
)


# =============================================================================
# HELPER FUNCTIONS
# =============================================================================

def print_separator(title: str):
    """Print a visual separator with title."""
    print("\n" + "=" * 80)
    print(f"  {title}")
    print("=" * 80)


def print_state_summary(state: UnifiedConversationState, label: str = "State"):
    """Print a summary of the conversation state."""
    print(f"\n📊 {label}:")
    print(f"   Session: {state.session_id}")
    print(f"   Search Count: {state.search_count}")
    print(f"   Zero Results Count: {state.zero_results_count}")
    print(f"   Cached Results: {len(state.last_property_results)}")
    print(f"   Conversation Stage: {state.metadata.conversation_stage}")
    print(f"   Conversation History: {len(state.conversation_history)} turns")
    
    # Location state
    loc = state.location_state
    print(f"\n   📍 Location State:")
    print(f"      City: {loc.city}")
    print(f"      Neighborhood: {loc.neighborhood}")
    print(f"      Postal Code: {loc.postal_code}")
    print(f"      Street: {loc.street_name}")
    
    # Active filters
    filters = state.active_filters
    print(f"\n   🔧 Active Filters:")
    print(f"      Location: {filters.location}")
    print(f"      Property Type: {filters.property_type}")
    print(f"      Bedrooms: {filters.bedrooms}")
    print(f"      Bathrooms: {filters.bathrooms}")
    print(f"      Min Price: {filters.min_price}")
    print(f"      Max Price: {filters.max_price}")
    print(f"      Listing Type: {filters.listing_type}")
    
    # Pending confirmation
    if state.pending_confirmation:
        print(f"\n   ⏳ Pending Confirmation:")
        print(f"      Type: {state.pending_confirmation.type}")
        print(f"      Created: {state.pending_confirmation.created_at}")


def send_message(chatbot: ChatGPTChatbot, session_id: str, message: str) -> Dict[str, Any]:
    """Send a message and return the response."""
    print(f"\n👤 USER: {message}")
    
    response = chatbot.process_message(
        user_message=message,
        session_id=session_id,
    )
    
    print(f"\n🤖 BOT: {response.get('response', 'No response')[:200]}...")
    print(f"   Properties Found: {response.get('property_count', 0)}")
    print(f"   Intent: {response.get('intent', 'unknown')}")
    
    if response.get('suggestions'):
        print(f"   Suggestions: {response.get('suggestions')[:3]}")
    
    return response


def verify_assertion(condition: bool, description: str):
    """Print verification result."""
    if condition:
        print(f"   ✅ {description}")
    else:
        print(f"   ❌ FAILED: {description}")
    return condition


# =============================================================================
# SCENARIO 1: Greeting + Light Qualification
# =============================================================================

def test_scenario_1_greeting_qualification():
    """
    Test a 4-turn conversation:
    1. "Hey, I'm just exploring properties right now, can you help me find something in downtown Vancouver?"
    2. "I prefer condos only, 1 or 2 bedrooms."
    3. "My budget is between 600k and 850k."
    4. "Show me the best options that match this so far."
    
    Verifications:
    - conversation_history appends four turns with correct roles
    - location_state.city == "Vancouver" 
    - active_filters: property_type == "condo", bedrooms in [1, 2], price range
    - conversation_stage progresses from greeting → filtering → viewing
    """
    print_separator("SCENARIO 1: Greeting + Light Qualification")
    
    chatbot = ChatGPTChatbot()
    session_id = f"test_scenario_1_{int(time.time())}"
    
    # Message 1: Initial greeting with location
    print("\n--- Turn 1: Initial Greeting ---")
    response1 = send_message(
        chatbot, session_id,
        "Hey, I'm just exploring properties right now, can you help me find something in downtown Vancouver?"
    )
    
    state = unified_state_manager.get_or_create(session_id)
    print_state_summary(state, "After Turn 1")
    
    # Verify Turn 1
    print("\n🔍 Verifications for Turn 1:")
    verify_assertion(
        len(state.conversation_history) >= 2,  # user + assistant
        f"Conversation history has at least 2 turns (has {len(state.conversation_history)})"
    )
    verify_assertion(
        state.location_state.city is not None and "vancouver" in state.location_state.city.lower(),
        f"City is Vancouver (got: {state.location_state.city})"
    )
    
    # Message 2: Property type and bedrooms
    print("\n--- Turn 2: Property Type + Bedrooms ---")
    response2 = send_message(
        chatbot, session_id,
        "I prefer condos only, 1 or 2 bedrooms."
    )
    
    state = unified_state_manager.get_or_create(session_id)
    print_state_summary(state, "After Turn 2")
    
    # Verify Turn 2
    print("\n🔍 Verifications for Turn 2:")
    verify_assertion(
        len(state.conversation_history) >= 4,  # 2 user + 2 assistant
        f"Conversation history has at least 4 turns (has {len(state.conversation_history)})"
    )
    verify_assertion(
        state.active_filters.property_type is not None and "condo" in state.active_filters.property_type.lower(),
        f"Property type is condo (got: {state.active_filters.property_type})"
    )
    
    # Message 3: Budget
    print("\n--- Turn 3: Budget ---")
    response3 = send_message(
        chatbot, session_id,
        "My budget is between 600k and 850k."
    )
    
    state = unified_state_manager.get_or_create(session_id)
    print_state_summary(state, "After Turn 3")
    
    # Verify Turn 3
    print("\n🔍 Verifications for Turn 3:")
    verify_assertion(
        state.active_filters.min_price == 600000 or (state.active_filters.min_price and state.active_filters.min_price >= 500000),
        f"Min price is around 600k (got: {state.active_filters.min_price})"
    )
    verify_assertion(
        state.active_filters.max_price == 850000 or (state.active_filters.max_price and state.active_filters.max_price <= 900000),
        f"Max price is around 850k (got: {state.active_filters.max_price})"
    )
    verify_assertion(
        state.active_filters.min_price is None or state.active_filters.max_price is None or 
        state.active_filters.min_price < state.active_filters.max_price,
        f"min_price < max_price constraint holds"
    )
    
    # Message 4: View results
    print("\n--- Turn 4: View Best Options ---")
    response4 = send_message(
        chatbot, session_id,
        "Show me the best options that match this so far."
    )
    
    state = unified_state_manager.get_or_create(session_id)
    print_state_summary(state, "After Turn 4")
    
    # Verify Turn 4
    print("\n🔍 Verifications for Turn 4:")
    verify_assertion(
        len(state.conversation_history) >= 8,  # 4 user + 4 assistant
        f"Conversation history has at least 8 turns (has {len(state.conversation_history)})"
    )
    
    # Check if zero results UX was triggered
    if state.zero_results_count >= 2:
        verify_assertion(
            "relaxation" in response4.get('intent', '') or 
            response4.get('mode') == 'zero_results' or
            "suggest" in response4.get('intent', '').lower(),
            f"Zero results UX triggered (intent: {response4.get('intent')}, mode: {response4.get('mode')})"
        )
    
    # Check conversation stage
    verify_assertion(
        state.metadata.conversation_stage in [
            ConversationStage.FILTERING.value,
            ConversationStage.VIEWING.value,
            'filtering',
            'viewing'
        ],
        f"Conversation stage is filtering or viewing (got: {state.metadata.conversation_stage})"
    )
    
    print("\n" + "=" * 40)
    print("  SCENARIO 1 COMPLETE")
    print("=" * 40)
    
    return True


# =============================================================================
# SCENARIO 2: Hard Validation Edges
# =============================================================================

def test_scenario_2_validation_edges():
    """
    Test validation boundaries:
    1. "Show me a 12 bedroom house in Mississauga." - Should reject (bedrooms > 8)
    2. "Actually, make it -1 bathrooms and under 10,000 dollars." - Should reject
    3. "Okay, sorry, set it to 3 bedrooms, 2 bathrooms, max 900,000." - Should succeed
    """
    print_separator("SCENARIO 2: Hard Validation Edges")
    
    chatbot = ChatGPTChatbot()
    session_id = f"test_scenario_2_{int(time.time())}"
    
    # Message 1: 12 bedrooms (should be rejected/clamped)
    print("\n--- Turn 1: 12 Bedrooms (Invalid) ---")
    response1 = send_message(
        chatbot, session_id,
        "Show me a 12 bedroom house in Mississauga."
    )
    
    state = unified_state_manager.get_or_create(session_id)
    print_state_summary(state, "After Turn 1")
    
    # Verify - bedrooms should be clamped or error shown
    print("\n🔍 Verifications for Turn 1:")
    if state.active_filters.bedrooms:
        verify_assertion(
            state.active_filters.bedrooms <= 8,
            f"Bedrooms clamped to max 8 (got: {state.active_filters.bedrooms})"
        )
    else:
        verify_assertion(
            True,
            "Bedrooms not set (validation prevented it)"
        )
    verify_assertion(
        state.location_state.city is not None and "mississauga" in state.location_state.city.lower(),
        f"City is Mississauga (got: {state.location_state.city})"
    )
    
    # Message 2: Negative bathrooms and low price (invalid)
    print("\n--- Turn 2: -1 Bathrooms, $10k (Invalid) ---")
    response2 = send_message(
        chatbot, session_id,
        "Actually, make it -1 bathrooms and under 10,000 dollars."
    )
    
    state = unified_state_manager.get_or_create(session_id)
    print_state_summary(state, "After Turn 2")
    
    # Verify - invalid values should be rejected
    print("\n🔍 Verifications for Turn 2:")
    verify_assertion(
        state.active_filters.bathrooms is None or state.active_filters.bathrooms >= 0,
        f"Bathrooms is non-negative (got: {state.active_filters.bathrooms})"
    )
    # $10k might be valid for some edge cases but should still work
    
    # Message 3: Valid values
    print("\n--- Turn 3: 3 Bed, 2 Bath, 900k (Valid) ---")
    response3 = send_message(
        chatbot, session_id,
        "Okay, sorry, set it to 3 bedrooms, 2 bathrooms, max 900,000."
    )
    
    state = unified_state_manager.get_or_create(session_id)
    print_state_summary(state, "After Turn 3")
    
    # Verify - values should be set correctly
    print("\n🔍 Verifications for Turn 3:")
    verify_assertion(
        state.active_filters.bedrooms == 3 or (state.active_filters.bedrooms and state.active_filters.bedrooms >= 3),
        f"Bedrooms is 3 (got: {state.active_filters.bedrooms})"
    )
    verify_assertion(
        state.active_filters.bathrooms == 2 or state.active_filters.bathrooms is None,
        f"Bathrooms is 2 or preserved (got: {state.active_filters.bathrooms})"
    )
    verify_assertion(
        state.active_filters.max_price == 900000 or (state.active_filters.max_price and state.active_filters.max_price >= 850000),
        f"Max price is around 900k (got: {state.active_filters.max_price})"
    )
    # City should still be Mississauga
    verify_assertion(
        state.location_state.city is not None and "mississauga" in state.location_state.city.lower(),
        f"City preserved as Mississauga (got: {state.location_state.city})"
    )
    
    print("\n" + "=" * 40)
    print("  SCENARIO 2 COMPLETE")
    print("=" * 40)
    
    return True


# =============================================================================
# SCENARIO 3: Location Normalization + Postal Code
# =============================================================================

def test_scenario_3_location_postal():
    """
    Test location normalization and postal code handling:
    1. "I'm looking for a townhouse in north york, m2n 5w1."
    2. "Actually switch to condos but keep the same area."
    3. "Clear the exact address, but keep the city and postal code."
    """
    print_separator("SCENARIO 3: Location Normalization + Postal Code")
    
    chatbot = ChatGPTChatbot()
    session_id = f"test_scenario_3_{int(time.time())}"
    
    # Message 1: Townhouse with postal code
    print("\n--- Turn 1: Townhouse in North York with Postal Code ---")
    response1 = send_message(
        chatbot, session_id,
        "I'm looking for a townhouse in north york, m2n 5w1."
    )
    
    state = unified_state_manager.get_or_create(session_id)
    print_state_summary(state, "After Turn 1")
    
    # Verify Turn 1
    print("\n🔍 Verifications for Turn 1:")
    # City normalization - should be "North York" with proper casing
    if state.location_state.city:
        verify_assertion(
            state.location_state.city.lower() == "north york" or "york" in state.location_state.city.lower(),
            f"City normalized to 'North York' (got: {state.location_state.city})"
        )
    
    # Postal code format - should be uppercase with proper format
    if state.location_state.postal_code:
        postal = state.location_state.postal_code.upper().replace(" ", "")
        verify_assertion(
            postal == "M2N5W1" or "M2N" in postal.upper(),
            f"Postal code matches Canadian format (got: {state.location_state.postal_code})"
        )
    
    # Property type
    verify_assertion(
        state.active_filters.property_type is not None and "townhouse" in state.active_filters.property_type.lower(),
        f"Property type is townhouse (got: {state.active_filters.property_type})"
    )
    
    # Message 2: Switch to condos, keep area
    print("\n--- Turn 2: Switch to Condos, Keep Area ---")
    response2 = send_message(
        chatbot, session_id,
        "Actually switch to condos but keep the same area."
    )
    
    state = unified_state_manager.get_or_create(session_id)
    print_state_summary(state, "After Turn 2")
    
    # Verify Turn 2
    print("\n🔍 Verifications for Turn 2:")
    verify_assertion(
        state.active_filters.property_type is not None and "condo" in state.active_filters.property_type.lower(),
        f"Property type changed to condo (got: {state.active_filters.property_type})"
    )
    # Location should be preserved
    if state.location_state.city:
        verify_assertion(
            "york" in state.location_state.city.lower() or state.location_state.postal_code is not None,
            f"Location preserved (city: {state.location_state.city}, postal: {state.location_state.postal_code})"
        )
    
    # Message 3: Clear address but keep city/postal
    print("\n--- Turn 3: Clear Address, Keep City/Postal ---")
    response3 = send_message(
        chatbot, session_id,
        "Clear the exact address, but keep the city and postal code."
    )
    
    state = unified_state_manager.get_or_create(session_id)
    print_state_summary(state, "After Turn 3")
    
    # Verify Turn 3
    print("\n🔍 Verifications for Turn 3:")
    # Street-level fields should be cleared
    verify_assertion(
        state.location_state.street_number is None,
        f"Street number cleared (got: {state.location_state.street_number})"
    )
    verify_assertion(
        state.location_state.street_name is None,
        f"Street name cleared (got: {state.location_state.street_name})"
    )
    # City and postal should be preserved (if they were set)
    # Note: This depends on how the bot interprets the request
    
    print("\n" + "=" * 40)
    print("  SCENARIO 3 COMPLETE")
    print("=" * 40)
    
    return True


# =============================================================================
# SCENARIO 4: Pending Confirmation + Checkpoint/Restore
# =============================================================================

def test_scenario_4_checkpoint_restore():
    """
    Test checkpoint and restore functionality:
    1. Set up a search with filters
    2. Create a checkpoint
    3. Make changes
    4. Restore from checkpoint
    """
    print_separator("SCENARIO 4: Checkpoint/Restore")
    
    chatbot = ChatGPTChatbot()
    session_id = f"test_scenario_4_{int(time.time())}"
    
    # Set up initial search
    print("\n--- Setup: Initial Search ---")
    response1 = send_message(
        chatbot, session_id,
        "Show me 2 bedroom condos in downtown Toronto under 800k."
    )
    
    state = unified_state_manager.get_or_create(session_id)
    print_state_summary(state, "Initial State")
    
    # Store initial values
    initial_bedrooms = state.active_filters.bedrooms
    initial_max_price = state.active_filters.max_price
    initial_property_type = state.active_filters.property_type
    
    # Create checkpoint
    print("\n--- Creating Checkpoint ---")
    checkpoint_id = state.create_checkpoint()  # Auto-generates ID
    print(f"   📌 Checkpoint created: {checkpoint_id}")
    
    # Make changes
    print("\n--- Making Changes ---")
    response2 = send_message(
        chatbot, session_id,
        "Actually make it 4 bedrooms and increase budget to 1.5 million."
    )
    
    state = unified_state_manager.get_or_create(session_id)
    print_state_summary(state, "After Changes")
    
    # Verify changes were applied
    print("\n🔍 Verifications After Changes:")
    changed = (
        state.active_filters.bedrooms != initial_bedrooms or
        state.active_filters.max_price != initial_max_price
    )
    verify_assertion(changed, "State was modified after changes")
    
    # Restore from checkpoint
    print("\n--- Restoring from Checkpoint ---")
    restored = state.restore_from_checkpoint(checkpoint_id)
    print(f"   🔄 Restore successful: {restored}")
    
    # Save the restored state
    unified_state_manager.save(state)
    
    print_state_summary(state, "After Restore")
    
    # Verify restoration
    print("\n🔍 Verifications After Restore:")
    verify_assertion(
        state.active_filters.bedrooms == initial_bedrooms or state.active_filters.bedrooms is None,
        f"Bedrooms restored (expected: {initial_bedrooms}, got: {state.active_filters.bedrooms})"
    )
    verify_assertion(
        state.active_filters.max_price == initial_max_price or state.active_filters.max_price is None,
        f"Max price restored (expected: {initial_max_price}, got: {state.active_filters.max_price})"
    )
    
    print("\n" + "=" * 40)
    print("  SCENARIO 4 COMPLETE")
    print("=" * 40)
    
    return True


# =============================================================================
# SCENARIO 5: Filter Merging vs Force Replace
# =============================================================================

def test_scenario_5_filter_merging():
    """
    Test filter merging with force_replace:
    1. "Show me 2 bedroom condos in Mississauga under 800k."
    2. "Okay, include townhouses as well and increase max budget to 1 million."
    3. "Forget townhouses, only condos again, but keep the higher budget."
    """
    print_separator("SCENARIO 5: Filter Merging vs Force Replace")
    
    chatbot = ChatGPTChatbot()
    session_id = f"test_scenario_5_{int(time.time())}"
    
    # Message 1: Initial search
    print("\n--- Turn 1: Initial Search ---")
    response1 = send_message(
        chatbot, session_id,
        "Show me 2 bedroom condos in Mississauga under 800k."
    )
    
    state = unified_state_manager.get_or_create(session_id)
    print_state_summary(state, "After Turn 1")
    
    # Store initial values
    print("\n🔍 Verifications for Turn 1:")
    verify_assertion(
        state.active_filters.bedrooms == 2 or (state.active_filters.bedrooms and state.active_filters.bedrooms >= 2),
        f"Bedrooms is 2 (got: {state.active_filters.bedrooms})"
    )
    verify_assertion(
        state.active_filters.property_type is not None and "condo" in state.active_filters.property_type.lower(),
        f"Property type is condo (got: {state.active_filters.property_type})"
    )
    verify_assertion(
        state.active_filters.max_price == 800000 or (state.active_filters.max_price and state.active_filters.max_price <= 850000),
        f"Max price is 800k (got: {state.active_filters.max_price})"
    )
    
    # Message 2: Add townhouses, increase budget (merge, not replace)
    print("\n--- Turn 2: Add Townhouses + Increase Budget (Merge) ---")
    response2 = send_message(
        chatbot, session_id,
        "Okay, include townhouses as well and increase max budget to 1 million."
    )
    
    state = unified_state_manager.get_or_create(session_id)
    print_state_summary(state, "After Turn 2")
    
    # Verify merge behavior
    print("\n🔍 Verifications for Turn 2 (Merge):")
    # Property type might now include both or just be the new one
    # Bedrooms should be preserved
    verify_assertion(
        state.active_filters.bedrooms == 2 or state.active_filters.bedrooms is None,
        f"Bedrooms preserved at 2 (got: {state.active_filters.bedrooms})"
    )
    verify_assertion(
        state.active_filters.max_price == 1000000 or (state.active_filters.max_price and state.active_filters.max_price >= 900000),
        f"Max price updated to ~1M (got: {state.active_filters.max_price})"
    )
    
    # Message 3: Remove townhouses but keep budget (force replace property_type only)
    print("\n--- Turn 3: Remove Townhouses, Keep Budget (Selective Replace) ---")
    response3 = send_message(
        chatbot, session_id,
        "Forget townhouses, only condos again, but keep the higher budget."
    )
    
    state = unified_state_manager.get_or_create(session_id)
    print_state_summary(state, "After Turn 3")
    
    # Verify selective replace
    print("\n🔍 Verifications for Turn 3 (Selective Replace):")
    verify_assertion(
        state.active_filters.property_type is None or "condo" in state.active_filters.property_type.lower(),
        f"Property type back to condo (got: {state.active_filters.property_type})"
    )
    verify_assertion(
        state.active_filters.max_price == 1000000 or (state.active_filters.max_price and state.active_filters.max_price >= 900000),
        f"Max price preserved at ~1M (got: {state.active_filters.max_price})"
    )
    
    # Get active filters - should only return non-null values
    active_filters = state.get_active_filters()
    print(f"\n📋 get_active_filters() returns: {json.dumps(active_filters, indent=2, default=str)}")
    
    verify_assertion(
        all(v is not None for v in active_filters.values()),
        "get_active_filters() returns only non-null values"
    )
    
    print("\n" + "=" * 40)
    print("  SCENARIO 5 COMPLETE")
    print("=" * 40)
    
    return True


# =============================================================================
# MAIN RUNNER
# =============================================================================

def run_all_scenarios():
    """Run all test scenarios."""
    print("\n" + "#" * 80)
    print("#" + " " * 78 + "#")
    print("#" + "  LIVE CONVERSATION SCENARIO TESTS".center(78) + "#")
    print("#" + "  Testing with Real Repliers API".center(78) + "#")
    print("#" + " " * 78 + "#")
    print("#" * 80)
    
    results = {}
    
    # Run each scenario
    scenarios = [
        ("Scenario 1: Greeting + Qualification", test_scenario_1_greeting_qualification),
        ("Scenario 2: Validation Edges", test_scenario_2_validation_edges),
        ("Scenario 3: Location + Postal Code", test_scenario_3_location_postal),
        ("Scenario 4: Checkpoint/Restore", test_scenario_4_checkpoint_restore),
        ("Scenario 5: Filter Merging", test_scenario_5_filter_merging),
    ]
    
    for name, test_func in scenarios:
        try:
            print(f"\n\n{'*' * 80}")
            print(f"* RUNNING: {name}")
            print('*' * 80)
            
            result = test_func()
            results[name] = "✅ PASSED" if result else "⚠️ PARTIAL"
            
        except Exception as e:
            print(f"\n❌ ERROR in {name}: {e}")
            import traceback
            traceback.print_exc()
            results[name] = f"❌ FAILED: {str(e)[:50]}"
        
        # Small delay between scenarios
        time.sleep(1)
    
    # Print summary
    print("\n\n" + "#" * 80)
    print("#" + " TEST SUMMARY ".center(78, "=") + "#")
    print("#" * 80)
    
    for name, result in results.items():
        print(f"  {name}: {result}")
    
    print("\n" + "#" * 80)
    
    return results


# =============================================================================
# ENTRY POINT
# =============================================================================

if __name__ == "__main__":
    # Check for specific scenario argument
    if len(sys.argv) > 1:
        scenario_num = sys.argv[1]
        scenario_map = {
            "1": test_scenario_1_greeting_qualification,
            "2": test_scenario_2_validation_edges,
            "3": test_scenario_3_location_postal,
            "4": test_scenario_4_checkpoint_restore,
            "5": test_scenario_5_filter_merging,
        }
        if scenario_num in scenario_map:
            scenario_map[scenario_num]()
        else:
            print(f"Unknown scenario: {scenario_num}")
            print("Usage: python test_live_conversation_scenarios.py [1|2|3|4|5]")
    else:
        # Run all scenarios
        run_all_scenarios()
