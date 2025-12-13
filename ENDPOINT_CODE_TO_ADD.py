"""
FLASK ENDPOINT CODE TO ADD TO voice_assistant_clean.py
========================================================

Add this code to your app/voice_assistant_clean.py file,
preferably near the other /api/ endpoints (around line 4800-5000)

This creates a new /api/chat-gpt4 endpoint that uses the enhanced
GPT-4 chatbot orchestrator with improved rental/sale detection,
amenity extraction, and contextual understanding.
"""

# ==================== ENHANCED GPT-4 CHATBOT ENDPOINT ====================
@app.route('/api/chat-gpt4', methods=['POST', 'OPTIONS'])
def chat_gpt4():
    """
    Enhanced GPT-4 chatbot endpoint with:
    - Improved rental/sale detection (fixes rental filtering bug)
    - Contextual understanding ("how about with a pool?")
    - Amenity detection (pool, gym, parking, etc.)
    - ChatGPT-style responses with follow-up suggestions
    
    Request Body:
    {
        "message": "Show me 2 bedroom condos in Toronto",
        "session_id": "optional-session-id"
    }
    
    Response:
    {
        "success": true,
        "response": "I found 15 properties...",
        "agent_response": "I found 15 properties...",
        "suggestions": ["Show rentals", "Add pool filter", "Change location"],
        "properties": [...],
        "property_count": 15,
        "state_summary": "2 bedroom condo in Toronto for sale",
        "filters": {...},
        "session_id": "abc123"
    }
    """
    # Handle CORS preflight
    if request.method == 'OPTIONS':
        response = jsonify({"status": "ok"})
        response.headers.add('Access-Control-Allow-Origin', '*')
        response.headers.add('Access-Control-Allow-Headers', 'Content-Type')
        response.headers.add('Access-Control-Allow-Methods', 'POST, OPTIONS')
        return response, 200
    
    try:
        data = request.json
        message = data.get('message', '').strip()
        session_id = data.get('session_id', str(uuid.uuid4()))
        
        if not message:
            return jsonify({
                "success": False,
                "error": "Message is required"
            }), 400
        
        print(f"📨 GPT-4 Chat Request: session={session_id}, message='{message[:60]}...'")
        
        # Import the enhanced orchestrator
        from services.chatbot_orchestrator import process_user_message
        
        # Process message through GPT-4 pipeline
        result = process_user_message(message, session_id)
        
        # Transform response for frontend compatibility
        # (supports both old and new frontend formats)
        response_data = {
            "success": result.get("success", True),
            "agent_response": result.get("response", ""),  # Old frontend format
            "response": result.get("response", ""),         # New frontend format
            "suggestions": result.get("suggestions", []),
            "properties": result.get("properties", []),
            "property_count": result.get("property_count", 0),
            "state_summary": result.get("state_summary", ""),
            "filters": result.get("filters", {}),
            "session_id": session_id
        }
        
        print(f"✅ GPT-4 Response: {result.get('property_count', 0)} properties, {len(result.get('suggestions', []))} suggestions")
        
        return jsonify(response_data)
        
    except Exception as e:
        print(f"❌ Error in /api/chat-gpt4: {e}")
        import traceback
        traceback.print_exc()
        return jsonify({
            "success": False,
            "error": str(e),
            "agent_response": "I encountered an issue. Let me help you search for properties!",
            "response": "I encountered an issue. Let me help you search for properties!"
        }), 500


# Optional: Add a health check endpoint for the GPT-4 chatbot
@app.route('/api/chat-gpt4/health', methods=['GET'])
def chat_gpt4_health():
    """
    Health check for GPT-4 chatbot service.
    Tests that all components are loaded correctly.
    """
    try:
        from services.chatbot_orchestrator import chatbot
        from services.conversation_state import conversation_state_manager
        from services.nlp_parser import nlp_parser
        from services.enhanced_mls_service import enhanced_mls_service
        
        return jsonify({
            "status": "healthy",
            "components": {
                "orchestrator": "loaded",
                "conversation_state": "loaded",
                "nlp_parser": "loaded",
                "mls_service": "loaded"
            },
            "openai_configured": bool(os.getenv("OPENAI_API_KEY"))
        })
    except Exception as e:
        return jsonify({
            "status": "unhealthy",
            "error": str(e)
        }), 500


# ==================== END OF ENDPOINT CODE ====================

"""
INSTALLATION INSTRUCTIONS:
==========================

1. Open: app/voice_assistant_clean.py

2. Find a good location to add the endpoint (around line 4800-5000, 
   near other /api/ endpoints like /api/text-chat)

3. Copy the @app.route('/api/chat-gpt4', ...) function above

4. Paste it into voice_assistant_clean.py

5. Save the file

6. Restart your Flask server:
   python app/voice_assistant_clean.py

7. Test the endpoint:
   curl -X POST http://localhost:5001/api/chat-gpt4 \
     -H "Content-Type: application/json" \
     -d '{"message": "Show me rentals in Toronto", "session_id": "test_001"}'

8. You should see a JSON response with:
   - response: ChatGPT-style message
   - suggestions: Array of follow-up questions
   - properties: Array of property results
   - filters: Current search filters

That's it! The endpoint is now ready to use.
"""
