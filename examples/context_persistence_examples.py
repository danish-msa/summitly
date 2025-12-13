"""
Conversation Context Persistence - Usage Examples
Practical examples showing how to use the context manager in real scenarios
"""

from services.conversation_context_manager import ConversationContextManager
import json

# Initialize context manager
context_manager = ConversationContextManager()


# ========================================
# EXAMPLE 1: Basic Conversation Flow
# ========================================

def example_basic_conversation():
    """Simple conversation with context tracking"""
    print("=" * 60)
    print("EXAMPLE 1: Basic Conversation Flow")
    print("=" * 60)
    
    user_id = "buyer_001"
    
    # User starts conversation
    context_manager.add_to_conversation(
        user_id,
        "I'm looking for properties in Toronto",
        'user',
        intent='search'
    )
    
    # Bot responds
    context_manager.add_to_conversation(
        user_id,
        "Great! What's your budget?",
        'assistant'
    )
    
    # User provides budget
    context_manager.add_to_conversation(
        user_id,
        "Around $600k",
        'user'
    )
    
    # Extract preferences
    preferences = context_manager.extract_preferences_from_conversation(user_id)
    
    print(f"Extracted Preferences: {json.dumps(preferences, indent=2)}")
    print(f"Locations: {preferences['locations']}")
    print(f"Price Range: {preferences['price_ranges']}")


# ========================================
# EXAMPLE 2: Search Context Tracking
# ========================================

def example_search_tracking():
    """Track user searches and build search history"""
    print("\n" + "=" * 60)
    print("EXAMPLE 2: Search Context Tracking")
    print("=" * 60)
    
    user_id = "buyer_002"
    
    # User performs first search
    search_results_1 = [
        {'id': 'prop1', 'address': '123 King St', 'price': 550000},
        {'id': 'prop2', 'address': '456 Queen St', 'price': 580000}
    ]
    
    context_manager.update_search_context(
        user_id,
        "Toronto condos under $600k",
        search_results_1
    )
    
    # User performs second search
    search_results_2 = [
        {'id': 'prop3', 'address': '789 Bay St', 'price': 620000}
    ]
    
    context_manager.update_search_context(
        user_id,
        "3 bedroom condos downtown",
        search_results_2
    )
    
    # Get session info
    session = context_manager.get_or_create_session(user_id)
    
    print(f"Total searches: {session['behavioral_signals']['search_count']}")
    print(f"Search history: {json.dumps(session['search_history'], indent=2)}")


# ========================================
# EXAMPLE 3: Property View Tracking
# ========================================

def example_property_views():
    """Track which properties user views"""
    print("\n" + "=" * 60)
    print("EXAMPLE 3: Property View Tracking")
    print("=" * 60)
    
    user_id = "buyer_003"
    
    # User views multiple properties
    properties = [
        {'id': 'prop1', 'address': '123 Main St', 'price': 550000, 'bedrooms': 2},
        {'id': 'prop2', 'address': '456 Oak Ave', 'price': 600000, 'bedrooms': 3},
        {'id': 'prop3', 'address': '789 Elm Rd', 'price': 580000, 'bedrooms': 2}
    ]
    
    for prop in properties:
        context_manager.update_property_view(user_id, prop['id'], prop)
    
    session = context_manager.get_or_create_session(user_id)
    
    print(f"Properties viewed: {session['behavioral_signals']['property_views_count']}")
    print(f"Currently viewing: {session['current_context']['currently_viewing_property']}")


# ========================================
# EXAMPLE 4: Engagement Level Tracking
# ========================================

def example_engagement_tracking():
    """Monitor user engagement over time"""
    print("\n" + "=" * 60)
    print("EXAMPLE 4: Engagement Level Tracking")
    print("=" * 60)
    
    user_id = "buyer_004"
    
    # Simulate user activity
    print("Starting engagement: 0")
    
    # Add conversations
    for i in range(5):
        context_manager.add_to_conversation(user_id, f"Question {i}", 'user')
    
    session = context_manager.get_or_create_session(user_id)
    print(f"After 5 messages: {session['behavioral_signals']['engagement_level']}")
    
    # Add searches
    for i in range(3):
        context_manager.update_search_context(user_id, f"Query {i}", [])
    
    session = context_manager.get_or_create_session(user_id)
    print(f"After 3 searches: {session['behavioral_signals']['engagement_level']}")
    
    # Add property views
    for i in range(5):
        context_manager.update_property_view(user_id, f"prop{i}")
    
    session = context_manager.get_or_create_session(user_id)
    print(f"After 5 property views: {session['behavioral_signals']['engagement_level']}")
    
    # Engagement interpretation
    engagement = session['behavioral_signals']['engagement_level']
    if engagement >= 8:
        print("🔥 HIGH ENGAGEMENT - User is ready to buy!")
    elif engagement >= 5:
        print("👍 MEDIUM ENGAGEMENT - User is seriously interested")
    else:
        print("👀 LOW ENGAGEMENT - User is just browsing")


# ========================================
# EXAMPLE 5: Preference Extraction
# ========================================

def example_preference_extraction():
    """Extract user preferences from natural language"""
    print("\n" + "=" * 60)
    print("EXAMPLE 5: Preference Extraction")
    print("=" * 60)
    
    user_id = "buyer_005"
    
    # Complex user messages
    messages = [
        "I'm looking for a 3 bedroom condo in Toronto",
        "Budget is between $500k and $800k",
        "Prefer downtown or midtown areas",
        "Must have parking and a pool",
        "This is my first time buying a home",
        "Need to move in ASAP"
    ]
    
    for msg in messages:
        context_manager.add_to_conversation(user_id, msg, 'user')
    
    # Extract all preferences
    preferences = context_manager.extract_preferences_from_conversation(user_id)
    
    print("\nExtracted Preferences:")
    print(f"  Locations: {preferences['locations']}")
    print(f"  Property Types: {preferences['property_types']}")
    print(f"  Price Ranges: {preferences['price_ranges']}")
    print(f"  Bedrooms: {preferences['bedrooms_ranges']}")
    print(f"  Features: {preferences['features']}")
    print(f"  First-Time Buyer: {preferences['first_time_buyer']}")
    print(f"  Timeline: {preferences['timeline']}")


# ========================================
# EXAMPLE 6: Investor Detection
# ========================================

def example_investor_detection():
    """Detect if user is an investor vs. home buyer"""
    print("\n" + "=" * 60)
    print("EXAMPLE 6: Investor Detection")
    print("=" * 60)
    
    # Investor user
    investor_id = "investor_001"
    investor_messages = [
        "Looking for investment properties",
        "What's the ROI on this building?",
        "Cash flow is important",
        "Good rental income potential"
    ]
    
    for msg in investor_messages:
        context_manager.add_to_conversation(investor_id, msg, 'user')
    
    investor_prefs = context_manager.extract_preferences_from_conversation(investor_id)
    
    # Home buyer user
    homebuyer_id = "homebuyer_001"
    homebuyer_messages = [
        "Looking for a family home",
        "Need good schools nearby",
        "Safe neighborhood important",
        "This is my first home purchase"
    ]
    
    for msg in homebuyer_messages:
        context_manager.add_to_conversation(homebuyer_id, msg, 'user')
    
    homebuyer_prefs = context_manager.extract_preferences_from_conversation(homebuyer_id)
    
    print(f"Investor detected: {investor_prefs['investor']}")
    print(f"Home buyer detected: {homebuyer_prefs['first_time_buyer']}")


# ========================================
# EXAMPLE 7: Next Question Predictions
# ========================================

def example_predictions():
    """Generate contextual next question predictions"""
    print("\n" + "=" * 60)
    print("EXAMPLE 7: Next Question Predictions")
    print("=" * 60)
    
    user_id = "buyer_007"
    
    # Scenario 1: User just viewed a property
    context_manager.update_property_view(
        user_id,
        'prop123',
        {'address': '123 Main St', 'price': 550000}
    )
    
    predictions = context_manager.predict_next_questions(user_id)
    print("\nPredictions after property view:")
    for i, pred in enumerate(predictions, 1):
        print(f"  {i}. {pred}")
    
    # Scenario 2: User performed a search
    context_manager.update_search_context(user_id, "Toronto condos", [])
    
    predictions = context_manager.predict_next_questions(user_id)
    print("\nPredictions after search:")
    for i, pred in enumerate(predictions, 1):
        print(f"  {i}. {pred}")
    
    # Scenario 3: High engagement user
    for i in range(10):
        context_manager.add_to_conversation(user_id, f"Message {i}", 'user')
        context_manager.update_property_view(user_id, f"prop{i}")
    
    predictions = context_manager.predict_next_questions(user_id)
    print("\nPredictions for highly engaged user:")
    for i, pred in enumerate(predictions, 1):
        print(f"  {i}. {pred}")


# ========================================
# EXAMPLE 8: Conversation Summary
# ========================================

def example_conversation_summary():
    """Generate AI-consumable conversation summaries"""
    print("\n" + "=" * 60)
    print("EXAMPLE 8: Conversation Summary")
    print("=" * 60)
    
    user_id = "buyer_008"
    
    # Simulate a conversation
    context_manager.add_to_conversation(user_id, "Looking for condos in Toronto", 'user')
    context_manager.add_to_conversation(user_id, "What's your budget?", 'assistant')
    context_manager.add_to_conversation(user_id, "$600k max", 'user')
    context_manager.add_to_conversation(user_id, "3 bedrooms preferred", 'user')
    
    # Extract preferences
    context_manager.extract_preferences_from_conversation(user_id)
    
    # Generate summary
    summary = context_manager.generate_conversation_summary(user_id)
    
    print(f"\nConversation Summary:\n{summary}")


# ========================================
# EXAMPLE 9: Comparison List Management
# ========================================

def example_comparison_list():
    """Manage user's property comparison list"""
    print("\n" + "=" * 60)
    print("EXAMPLE 9: Comparison List Management")
    print("=" * 60)
    
    user_id = "buyer_009"
    
    # User adds properties to comparison
    properties = ['prop1', 'prop2', 'prop3', 'prop4']
    
    for prop_id in properties:
        context_manager.add_to_comparison(user_id, prop_id)
    
    session = context_manager.get_or_create_session(user_id)
    
    print(f"Properties in comparison: {session['current_context']['comparison_list']}")
    print(f"Total properties: {len(session['current_context']['comparison_list'])}")


# ========================================
# EXAMPLE 10: Complete Workflow
# ========================================

def example_complete_workflow():
    """End-to-end example of context-aware conversation"""
    print("\n" + "=" * 60)
    print("EXAMPLE 10: Complete Workflow")
    print("=" * 60)
    
    user_id = "buyer_010"
    
    # Day 1: Initial conversation
    print("\n--- Day 1: 9:00 AM ---")
    context_manager.add_to_conversation(user_id, "Looking for properties", 'user')
    context_manager.add_to_conversation(user_id, "What area are you interested in?", 'assistant')
    context_manager.add_to_conversation(user_id, "Toronto, budget around $600k", 'user')
    
    # Extract preferences
    prefs = context_manager.extract_preferences_from_conversation(user_id)
    print(f"Extracted: {prefs['locations']}, Budget: {prefs['price_ranges']}")
    
    # Day 1: User searches
    print("\n--- Day 1: 10:00 AM ---")
    context_manager.update_search_context(user_id, "Toronto condos $600k", [
        {'id': 'prop1', 'price': 550000},
        {'id': 'prop2', 'price': 580000}
    ])
    
    # Day 1: User views properties
    print("\n--- Day 1: 11:00 AM ---")
    context_manager.update_property_view(user_id, 'prop1', {'address': '123 King St'})
    context_manager.update_property_view(user_id, 'prop2', {'address': '456 Queen St'})
    
    # Get predictions
    predictions = context_manager.predict_next_questions(user_id)
    print(f"Suggested questions: {predictions[:2]}")
    
    # Day 2: User returns
    print("\n--- Day 2: 3:00 PM ---")
    context = context_manager.get_context_for_ai(user_id)
    print(f"Context summary: {context['summary'][:100]}...")
    print(f"Engagement level: {context['engagement_level']}")
    
    # Get session stats
    stats = context_manager.get_session_stats(user_id)
    print(f"\nSession Stats:")
    print(f"  Conversations: {stats['conversation_length']}")
    print(f"  Searches: {stats['search_count']}")
    print(f"  Property views: {stats['property_views']}")
    print(f"  Engagement: {stats['engagement_level']}/10")


# ========================================
# EXAMPLE 11: Flask API Integration
# ========================================

def example_flask_integration():
    """Example Flask route using context manager"""
    print("\n" + "=" * 60)
    print("EXAMPLE 11: Flask API Integration")
    print("=" * 60)
    
    print("""
# Flask route example:

from flask import Flask, request, jsonify
from services.conversation_context_manager import ConversationContextManager

app = Flask(__name__)
context_manager = ConversationContextManager()

@app.route('/api/chat', methods=['POST'])
def chat():
    user_id = request.json['user_id']
    message = request.json['message']
    
    # Add to conversation
    context_manager.add_to_conversation(user_id, message, 'user')
    
    # Get context for AI
    context = context_manager.get_context_for_ai(user_id)
    
    # Generate response (using your AI service)
    response = generate_ai_response(message, context)
    
    # Save AI response
    context_manager.add_to_conversation(user_id, response, 'assistant')
    
    # Get predictions
    predictions = context_manager.predict_next_questions(user_id)
    
    return jsonify({
        'response': response,
        'predicted_questions': predictions,
        'engagement_level': context['engagement_level'],
        'preferences': context['preferences']
    })

# Test with curl:
# curl -X POST http://localhost:5050/api/chat \\
#   -H "Content-Type: application/json" \\
#   -d '{"user_id": "test_user", "message": "Looking for condos in Toronto"}'
""")


# ========================================
# Run All Examples
# ========================================

if __name__ == '__main__':
    print("\n" + "=" * 60)
    print("CONVERSATION CONTEXT PERSISTENCE - USAGE EXAMPLES")
    print("=" * 60)
    
    example_basic_conversation()
    example_search_tracking()
    example_property_views()
    example_engagement_tracking()
    example_preference_extraction()
    example_investor_detection()
    example_predictions()
    example_conversation_summary()
    example_comparison_list()
    example_complete_workflow()
    example_flask_integration()
    
    print("\n" + "=" * 60)
    print("✅ All examples completed successfully!")
    print("=" * 60)
