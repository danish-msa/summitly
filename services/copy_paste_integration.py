"""
COPY-PASTE THIS INTO YOUR EXISTING CHATBOT
==========================================

This is a minimal, ready-to-use integration snippet.
Just copy this code into your main chatbot handler file.
"""

# ============================================================================
# STEP 1: ADD THIS IMPORT AT THE TOP OF YOUR CHATBOT FILE
# ============================================================================

from services.chatbot_valuation_integration import process_valuation_request


# ============================================================================
# STEP 2: ADD THIS HELPER FUNCTION
# ============================================================================

def is_valuation_query(user_query: str) -> bool:
    """
    Detect if user is asking about property valuation.
    
    Returns True for queries like:
    - "What's MLS X12345678 worth?"
    - "How much is the house at 123 Main St?"
    - "Is this property a good deal?"
    """
    valuation_keywords = [
        'value', 'worth', 'price', 'valuation', 'appraisal',
        'market value', 'how much', 'estimate', 'mls',
        'good deal', 'fair price', 'overpriced', 'underpriced'
    ]
    
    query_lower = user_query.lower()
    return any(keyword in query_lower for keyword in valuation_keywords)


# ============================================================================
# STEP 3: MODIFY YOUR MAIN CHATBOT HANDLER
# ============================================================================

def handle_user_message(user_query: str, user_id: str, session_id: str) -> str:
    """
    Your main chatbot message handler.
    
    BEFORE: Only used LLaMA + Exa AI
    AFTER: Routes valuation queries to valuation engine
    """
    
    # Build chatbot context
    chatbot_context = {
        'user_id': user_id,
        'session_id': session_id
        # Add any other context your chatbot uses
    }
    
    # NEW: Check if this is a valuation query
    if is_valuation_query(user_query):
        # Route to property valuation system
        return process_valuation_request(user_query, chatbot_context)
    
    # EXISTING: Your original chatbot logic for non-valuation queries
    # (Keep whatever code you already have here)
    # return your_existing_llama_handler(user_query, chatbot_context)
    
    # For this example, just return a placeholder
    return "This would go to your existing LLaMA + Exa AI handler"


# ============================================================================
# ALTERNATIVE: FLASK/FASTAPI ENDPOINT
# ============================================================================

"""
If you're using Flask or FastAPI, add this endpoint:

from flask import Flask, request, jsonify

app = Flask(__name__)

@app.route('/api/chat', methods=['POST'])
def chat_endpoint():
    data = request.json
    user_query = data.get('query')
    user_id = data.get('user_id')
    session_id = data.get('session_id')
    
    chatbot_context = {
        'user_id': user_id,
        'session_id': session_id
    }
    
    if is_valuation_query(user_query):
        response = process_valuation_request(user_query, chatbot_context)
        response_type = 'valuation'
    else:
        response = your_existing_handler(user_query, chatbot_context)
        response_type = 'general'
    
    return jsonify({
        'response': response,
        'type': response_type,
        'format': 'markdown'
    })
"""


# ============================================================================
# EXAMPLE USAGE
# ============================================================================

if __name__ == '__main__':
    # Test queries
    test_queries = [
        "What's the market value of MLS X12506968?",
        "Is MLS X12481568 at $950K a good deal?",
        "How much is 123 Main Street worth?"
    ]
    
    for query in test_queries:
        print(f"\n{'='*80}")
        print(f"Query: {query}")
        print(f"{'='*80}")
        
        if is_valuation_query(query):
            print("✓ Detected as VALUATION query")
            print("→ Would route to: process_valuation_request()")
        else:
            print("✗ Not a valuation query")
            print("→ Would route to: your_existing_handler()")


# ============================================================================
# THAT'S IT! 🎉
# ============================================================================

"""
You've successfully integrated property valuation into your chatbot!

WHAT HAPPENS NOW:
1. User asks "What's MLS X12345678 worth?"
2. is_valuation_query() returns True
3. process_valuation_request() handles it
4. Returns markdown-formatted valuation report
5. Your chatbot displays it to user

FEATURES YOU GET:
✅ Property valuation with 5-8 comparables
✅ AI-generated explanations (LLaMA/Claude/GPT-4)
✅ Market analysis and price comparison
✅ Confidence scoring
✅ 24-hour caching
✅ Error handling
✅ Audit logging

TESTING:
Run this file: python copy_paste_integration.py
Or test in your chatbot: "What's MLS X12506968 worth?"

DOCUMENTATION:
- Quick Reference: INTEGRATION_QUICK_REFERENCE.md
- Full Guide: CHATBOT_INTEGRATION_EXAMPLE.md
- Complete Summary: INTEGRATION_COMPLETE.md

NEED HELP?
Check logs: logs/app.log and logs/valuation_audit.log
"""
