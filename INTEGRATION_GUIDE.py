"""
Integration Guide: ChatGPT-Style Chatbot with Existing System
=============================================================
Step-by-step guide to integrate the new chatbot with voice_assistant_clean.py

Author: Summitly Team
Date: December 12, 2025
"""

# =============================================================================
# OPTION 1: Quick Integration (Recommended for Testing)
# =============================================================================

"""
Add this to voice_assistant_clean.py to enable the new chatbot:
"""

# 1. Add import at the top of voice_assistant_clean.py
from services.chatbot_api import register_chatbot_blueprint

# 2. Register the blueprint after creating Flask app
# Find the line: app = Flask(__name__)
# Add after it:
register_chatbot_blueprint(app)

# That's it! Now you have the new /api/chat endpoint available

# Test with:
# curl -X POST http://localhost:5000/api/chat \
#   -H "Content-Type: application/json" \
#   -d '{"message": "Show me 2 bedroom condos in Toronto under 600k"}'


# =============================================================================
# OPTION 2: Replace Existing Chat Endpoint
# =============================================================================

"""
To replace the existing chat logic with the new ChatGPT-style system:
"""

# 1. Find your existing chat endpoint in voice_assistant_clean.py
# It might look like:
# @app.route('/chat', methods=['POST'])
# def chat():
#     ...existing code...

# 2. Replace it with this:

from services.chatbot_orchestrator import chatbot
import uuid

@app.route('/chat', methods=['POST'])
def chat():
    """
    ChatGPT-style conversational chat endpoint.
    Replaces rigid if-else logic with intelligent context-aware processing.
    """
    try:
        data = request.json
        user_message = data.get('message', '').strip()
        session_id = data.get('session_id') or data.get('user_id') or str(uuid.uuid4())
        
        if not user_message:
            return jsonify({
                'success': False,
                'error': 'Message is required'
            }), 400
        
        # Process through ChatGPT-style pipeline
        result = chatbot.process_message(
            user_message=user_message,
            session_id=session_id
        )
        
        # Ensure backward compatibility with existing frontend
        return jsonify({
            'success': result.get('success', True),
            'message': result.get('response'),  # Map 'response' to 'message' for compatibility
            'response': result.get('response'),
            'suggestions': result.get('suggestions', []),
            'properties': result.get('properties', []),
            'property_count': result.get('property_count', 0),
            'state': result.get('state_summary'),
            'session_id': session_id
        })
    
    except Exception as e:
        logger.error(f"Chat error: {e}", exc_info=True)
        return jsonify({
            'success': False,
            'error': str(e)
        }), 500


# =============================================================================
# OPTION 3: Gradual Migration (Side-by-Side)
# =============================================================================

"""
Run old and new systems side-by-side for testing:
"""

# Keep your existing endpoint at /chat
# Add new endpoint at /api/chat (using Option 1)

# In your frontend, add a toggle:
const USE_NEW_CHATBOT = true;  // or false

const endpoint = USE_NEW_CHATBOT ? '/api/chat' : '/chat';

fetch(endpoint, {
    method: 'POST',
    headers: {'Content-Type': 'application/json'},
    body: JSON.stringify({
        message: userMessage,
        session_id: sessionId
    })
})


# =============================================================================
# OPTION 4: Full Integration with Enhanced Features
# =============================================================================

"""
Integrate with all existing features (voice, lead tracking, etc.):
"""

from services.chatbot_orchestrator import chatbot
from services.conversation_state import conversation_state_manager

@app.route('/enhanced_chat', methods=['POST'])
def enhanced_chat():
    """
    Fully integrated ChatGPT-style chat with all existing features.
    """
    try:
        data = request.json
        user_message = data.get('message', '').strip()
        session_id = data.get('session_id') or str(uuid.uuid4())
        user_email = data.get('email')
        user_phone = data.get('phone')
        
        # Process through ChatGPT pipeline
        result = chatbot.process_message(
            user_message=user_message,
            session_id=session_id
        )
        
        # If properties found, track as lead (existing functionality)
        if result.get('property_count', 0) > 0 and (user_email or user_phone):
            # Use your existing lead tracking
            lead_data = {
                'email': user_email,
                'phone': user_phone,
                'search_criteria': result.get('state_summary'),
                'properties_shown': result.get('property_count'),
                'timestamp': datetime.now()
            }
            # track_lead(lead_data)  # Your existing function
        
        # Add property images (existing functionality)
        properties = result.get('properties', [])
        for prop in properties:
            # Use your existing image processing
            prop['images'] = standardize_property_data(prop).get('images', [])
        
        return jsonify({
            'success': result.get('success', True),
            'response': result.get('response'),
            'suggestions': result.get('suggestions', []),
            'properties': properties,
            'property_count': result.get('property_count', 0),
            'session_id': session_id
        })
    
    except Exception as e:
        logger.error(f"Enhanced chat error: {e}", exc_info=True)
        return jsonify({
            'success': False,
            'error': str(e)
        }), 500


# =============================================================================
# Frontend Integration Examples
# =============================================================================

"""
JavaScript/React Frontend Integration:
"""

# Example 1: Basic Fetch
async function sendMessage(message, sessionId) {
    const response = await fetch('/api/chat', {
        method: 'POST',
        headers: {
            'Content-Type': 'application/json'
        },
        body: JSON.stringify({
            message: message,
            session_id: sessionId
        })
    });
    
    const data = await response.json();
    
    // Display response
    displayMessage(data.response, 'bot');
    
    // Display suggestions
    displaySuggestions(data.suggestions);
    
    // Display properties
    if (data.properties && data.properties.length > 0) {
        displayProperties(data.properties);
    }
    
    return data;
}

# Example 2: React Component
import React, { useState } from 'react';

function ChatGPTChatbot() {
    const [messages, setMessages] = useState([]);
    const [input, setInput] = useState('');
    const [sessionId] = useState(() => generateUUID());
    const [suggestions, setSuggestions] = useState([]);
    const [properties, setProperties] = useState([]);
    
    const sendMessage = async () => {
        // Add user message
        setMessages([...messages, { role: 'user', content: input }]);
        
        // Send to API
        const response = await fetch('/api/chat', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
                message: input,
                session_id: sessionId
            })
        });
        
        const data = await response.json();
        
        // Add bot response
        setMessages(prev => [...prev, { role: 'assistant', content: data.response }]);
        
        // Update suggestions and properties
        setSuggestions(data.suggestions || []);
        setProperties(data.properties || []);
        
        setInput('');
    };
    
    return (
        <div className="chatbot">
            <div className="messages">
                {messages.map((msg, i) => (
                    <div key={i} className={`message ${msg.role}`}>
                        {msg.content}
                    </div>
                ))}
            </div>
            
            {properties.length > 0 && (
                <div className="properties">
                    {properties.map(prop => (
                        <PropertyCard key={prop.id} property={prop} />
                    ))}
                </div>
            )}
            
            {suggestions.length > 0 && (
                <div className="suggestions">
                    {suggestions.map((suggestion, i) => (
                        <button 
                            key={i} 
                            onClick={() => setInput(suggestion)}
                        >
                            {suggestion}
                        </button>
                    ))}
                </div>
            )}
            
            <div className="input">
                <input 
                    value={input}
                    onChange={(e) => setInput(e.target.value)}
                    onKeyPress={(e) => e.key === 'Enter' && sendMessage()}
                    placeholder="Ask me anything..."
                />
                <button onClick={sendMessage}>Send</button>
            </div>
        </div>
    );
}


# =============================================================================
# Testing the Integration
# =============================================================================

"""
Test scripts to verify the integration works:
"""

# Test 1: Basic conversation flow
import requests
import json

def test_conversation():
    session_id = "test_session_123"
    base_url = "http://localhost:5000/api/chat"
    
    # Message 1
    response1 = requests.post(base_url, json={
        "message": "Show me 2 bedroom condos in Toronto under 600k",
        "session_id": session_id
    })
    print("Response 1:", response1.json()['response'])
    print("Suggestions:", response1.json()['suggestions'])
    print("Properties:", response1.json()['property_count'])
    print()
    
    # Message 2 - Follow-up
    response2 = requests.post(base_url, json={
        "message": "What about 3 bedrooms?",
        "session_id": session_id
    })
    print("Response 2:", response2.json()['response'])
    print("State:", response2.json()['state_summary'])
    print()
    
    # Message 3 - Another follow-up
    response3 = requests.post(base_url, json={
        "message": "Show me rentals instead",
        "session_id": session_id
    })
    print("Response 3:", response3.json()['response'])
    print("State:", response3.json()['state_summary'])

if __name__ == "__main__":
    test_conversation()


# =============================================================================
# Environment Setup
# =============================================================================

"""
Required environment variables:
"""

# Add to your .env file or export:
OPENAI_API_KEY=sk-...
OPENAI_MODEL=gpt-4o-mini  # or gpt-4, gpt-4-turbo

# Optional (for production):
REDIS_HOST=localhost
REDIS_PORT=6379
REDIS_DB=0


# =============================================================================
# Troubleshooting
# =============================================================================

"""
Common issues and solutions:
"""

# Issue 1: OpenAI API errors
# Solution: Check your API key and quota
from services.chatgpt_service import chatgpt_service
print("OpenAI available:", chatgpt_service.client is not None)

# Issue 2: No properties returned
# Solution: Check MLS API connection
from services.enhanced_mls_service import enhanced_mls_service
from services.conversation_state import ConversationState

state = ConversationState(session_id="test")
state.update_from_dict({
    'location': 'Toronto',
    'bedrooms': 2,
    'property_type': 'condo'
})
result = enhanced_mls_service.search_properties(state)
print("Search success:", result['success'])
print("Properties found:", result['total'])

# Issue 3: Context not preserved
# Solution: Check session_id is being passed consistently
from services.conversation_state import conversation_state_manager

session_id = "test_123"
state = conversation_state_manager.get_or_create(session_id)
print("Session state:", state.get_summary())

# Issue 4: NLP not extracting criteria
# Solution: Test the parser directly
from services.nlp_parser import nlp_parser

message = "Show me 2 bedroom condos in Toronto under 600k"
parsed = nlp_parser.parse_message(message)
print("Parsed:", parsed)


# =============================================================================
# Production Deployment
# =============================================================================

"""
Production checklist:
"""

# 1. Set environment variables
export OPENAI_API_KEY="sk-..."
export OPENAI_MODEL="gpt-4o-mini"

# 2. Configure Redis (recommended)
import redis
redis_client = redis.Redis(host='your-redis-host', port=6379, db=0)

from services.conversation_state import ConversationStateManager
manager = ConversationStateManager(redis_client=redis_client)

# 3. Enable CORS for your frontend domain
from flask_cors import CORS
CORS(app, resources={
    r"/api/*": {
        "origins": ["https://yourdomain.com"],
        "methods": ["GET", "POST"],
        "allow_headers": ["Content-Type"]
    }
})

# 4. Add rate limiting
from flask_limiter import Limiter
from flask_limiter.util import get_remote_address

limiter = Limiter(
    app,
    key_func=get_remote_address,
    default_limits=["200 per day", "50 per hour"]
)

@limiter.limit("10 per minute")
@app.route('/api/chat', methods=['POST'])
def chat():
    # ... your endpoint code

# 5. Add logging
import logging
logging.basicConfig(
    level=logging.INFO,
    format='%(asctime)s - %(name)s - %(levelname)s - %(message)s',
    handlers=[
        logging.FileHandler('chatbot.log'),
        logging.StreamHandler()
    ]
)

# 6. Monitor API usage
from services.chatgpt_service import chatgpt_service

# Track tokens used
# Log to monitoring service (e.g., DataDog, CloudWatch)


# =============================================================================
# Summary
# =============================================================================

"""
Quick Start Summary:

1. Add one line to voice_assistant_clean.py:
   from services.chatbot_api import register_chatbot_blueprint
   register_chatbot_blueprint(app)

2. Set OPENAI_API_KEY environment variable

3. Test with:
   curl -X POST http://localhost:5000/api/chat \
     -H "Content-Type: application/json" \
     -d '{"message": "Show me 2 bedroom condos in Toronto"}'

4. Update your frontend to use /api/chat endpoint

That's it! You now have a ChatGPT-style real estate chatbot.
"""

print("✅ Integration guide loaded. Follow the examples above to integrate the chatbot.")
