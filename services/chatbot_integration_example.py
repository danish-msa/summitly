"""
Simple example showing how to use the chatbot valuation integration
in your existing real estate chatbot.
"""

from services.chatbot_valuation_integration import process_valuation_request


def simple_chatbot_example():
    """
    Minimal example of integrating valuation into your chatbot.
    """
    
    # Example 1: Basic valuation query
    print("=" * 80)
    print("EXAMPLE 1: Basic Valuation Query")
    print("=" * 80)
    
    user_query = "What's the market value of MLS X12506968?"
    
    chatbot_context = {
        'user_id': 'user_123',
        'session_id': 'session_456'
    }
    
    response = process_valuation_request(user_query, chatbot_context)
    print(response)
    
    
    # Example 2: Query with asking price comparison
    print("\n\n" + "=" * 80)
    print("EXAMPLE 2: Valuation with Price Comparison")
    print("=" * 80)
    
    user_query = "Is MLS X12481568 listed at $950,000 a good deal?"
    
    chatbot_context = {
        'user_id': 'user_123',
        'session_id': 'session_456',
        'property_data': {
            'asking_price': 950000
        }
    }
    
    response = process_valuation_request(user_query, chatbot_context)
    print(response)
    
    
    # Example 3: Address-based query (simplified)
    print("\n\n" + "=" * 80)
    print("EXAMPLE 3: Address Query Pattern")
    print("=" * 80)
    
    # Note: Address search requires additional implementation
    # For now, show the pattern
    user_query = "What's the value of 123 Main Street, Toronto?"
    
    print("User query:", user_query)
    print("\nNOTE: Address-only search requires additional Exa AI integration.")
    print("Currently, the system works best with MLS IDs.")
    print("You can enhance this by:")
    print("1. Using Exa AI to find MLS ID from address")
    print("2. Passing MLS ID to process_valuation_request()")


def integration_in_existing_chatbot():
    """
    Example showing how to integrate into your existing chatbot flow.
    """
    
    print("\n\n" + "=" * 80)
    print("INTEGRATION PATTERN")
    print("=" * 80)
    
    code_example = """
# In your existing chatbot code:

from services.chatbot_valuation_integration import process_valuation_request

def handle_user_message(user_query: str, context: dict) -> str:
    '''Your main chatbot handler.'''
    
    # Detect valuation intent
    valuation_keywords = ['value', 'worth', 'price', 'mls', 'appraisal']
    
    if any(keyword in user_query.lower() for keyword in valuation_keywords):
        # Route to valuation system
        return process_valuation_request(user_query, context)
    
    # Otherwise use your existing LLaMA + Exa flow
    return your_existing_handler(user_query, context)
    """
    
    print(code_example)


if __name__ == '__main__':
    print("\n")
    print("╔" + "=" * 78 + "╗")
    print("║" + " " * 78 + "║")
    print("║" + "    CHATBOT VALUATION INTEGRATION - USAGE EXAMPLES".center(78) + "║")
    print("║" + " " * 78 + "║")
    print("╚" + "=" * 78 + "╝")
    
    # Show simple examples
    # simple_chatbot_example()  # Commented out - requires valid MLS ID
    
    # Show integration pattern
    integration_in_existing_chatbot()
    
    print("\n\n" + "=" * 80)
    print("KEY FEATURES")
    print("=" * 80)
    print("""
✓ Automatic property identifier extraction (MLS ID or address)
✓ 24-hour caching for instant repeat queries
✓ Complete valuation with 5-8 comparable properties
✓ AI-generated explanations (LLaMA/Claude/GPT-4)
✓ Markdown-formatted responses ready for display
✓ Graceful error handling and fallbacks
✓ Comprehensive audit logging
✓ Price comparison and market analysis
✓ Confidence scoring and value ranges

USAGE:
------
1. Import: from services.chatbot_valuation_integration import process_valuation_request
2. Detect valuation queries in your chatbot
3. Call: response = process_valuation_request(user_query, context)
4. Display: Show the markdown response to user

SUPPORTED QUERIES:
-----------------
• "What's the value of MLS X12345678?"
• "How much is MLS# X12506968 worth?"
• "Is MLS X12481568 listed at $950,000 a good deal?"
• "Appraise property X12515894"

REQUIREMENTS:
------------
• Valid MLS ID from Repliers API
• Repliers API key configured (already done)
• Python 3.10+ with required packages
• Optional: Claude/GPT-4 API keys for enhanced explanations

INTEGRATION STEPS:
-----------------
1. Add valuation intent detection to your chatbot router
2. Pass user query + context to process_valuation_request()
3. Return formatted response to user
4. Optional: Customize markdown formatting for your UI

See CHATBOT_INTEGRATION_EXAMPLE.md for complete documentation.
    """)
    
    print("\n" + "=" * 80)
    print("READY TO INTEGRATE!")
    print("=" * 80)
