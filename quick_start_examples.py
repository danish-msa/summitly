#!/usr/bin/env python3
"""
ChatGPT-Style Chatbot - Quick Start Example
===========================================
Copy this file and run it to see the chatbot in action!

Author: Summitly Team
Date: December 12, 2025
"""

import os
import sys

# Ensure parent directory is in path
sys.path.insert(0, os.path.abspath(os.path.dirname(__file__)))

# Set OpenAI API key (replace with your key)
# os.environ['OPENAI_API_KEY'] = 'your-key-here'


def example_1_basic_conversation():
    """
    Example 1: Basic conversation with context preservation
    """
    print("\n" + "="*70)
    print("EXAMPLE 1: Basic Conversation with Context")
    print("="*70 + "\n")
    
    from services.chatbot_orchestrator import chatbot
    
    session_id = "demo_user_1"
    
    messages = [
        "Show me 2 bedroom condos in Toronto under 600k",
        "What about 3 bedrooms?",
        "Show me rentals instead",
    ]
    
    for msg in messages:
        print(f"\n{'User:':>10} {msg}")
        result = chatbot.process_message(msg, session_id)
        print(f"{'Bot:':>10} {result['response'][:100]}...")
        print(f"{'State:':>10} {result['state_summary']}")
        print(f"{'Suggestions:':>10}")
        for suggestion in result['suggestions']:
            print(f"           • {suggestion}")


def example_2_progressive_refinement():
    """
    Example 2: Progressive search refinement
    """
    print("\n" + "="*70)
    print("EXAMPLE 2: Progressive Search Refinement")
    print("="*70 + "\n")
    
    from services.chatbot_orchestrator import chatbot
    
    session_id = "demo_user_2"
    
    messages = [
        "Find condos in Toronto",
        "With 2 bedrooms",
        "Under 700k",
        "With pool and gym",
    ]
    
    for msg in messages:
        print(f"\n{'User:':>10} {msg}")
        result = chatbot.process_message(msg, session_id)
        print(f"{'State:':>10} {result['state_summary']}")
        print(f"{'Properties:':>10} {result['property_count']} found")


def example_3_api_usage():
    """
    Example 3: Using the REST API
    """
    print("\n" + "="*70)
    print("EXAMPLE 3: REST API Usage")
    print("="*70 + "\n")
    
    from flask import Flask
    from services.chatbot_api import register_chatbot_blueprint
    
    # Create Flask app
    app = Flask(__name__)
    
    # Register chatbot blueprint
    register_chatbot_blueprint(app)
    
    print("✓ Flask app created with chatbot API")
    print("✓ Available endpoints:")
    print("  - POST /api/chat")
    print("  - POST /api/chat/reset")
    print("  - GET /api/chat/session/<id>")
    print("  - GET /api/chat/health")
    
    print("\nTest with curl:")
    print("""
    curl -X POST http://localhost:5000/api/chat \\
      -H "Content-Type: application/json" \\
      -d '{
        "message": "Show me 2 bedroom condos in Toronto",
        "session_id": "user_123"
      }'
    """)
    
    # To run the server:
    # app.run(debug=True, port=5000)


def example_4_direct_module_usage():
    """
    Example 4: Using individual modules directly
    """
    print("\n" + "="*70)
    print("EXAMPLE 4: Direct Module Usage")
    print("="*70 + "\n")
    
    # Test NLP Parser
    print("--- NLP Parser ---")
    from services.nlp_parser import nlp_parser
    
    message = "Show me 2 bedroom condos in Toronto under 600k with pool"
    parsed = nlp_parser.parse_message(message)
    print(f"Message: {message}")
    print(f"Parsed: {parsed}\n")
    
    # Test ConversationState
    print("--- Conversation State ---")
    from services.conversation_state import ConversationState
    
    state = ConversationState(session_id="test")
    state.update_from_dict(parsed)
    print(f"State: {state.get_summary()}")
    print(f"Active Filters: {state.get_active_filters()}\n")
    
    # Test GPT-4 Service
    print("--- GPT-4 Service ---")
    from services.chatgpt_service import chatgpt_service
    
    suggestions = chatgpt_service.generate_follow_up_suggestions(state.to_dict())
    print(f"Follow-up suggestions:")
    for i, suggestion in enumerate(suggestions, 1):
        print(f"  {i}. {suggestion}")


def example_5_contextual_understanding():
    """
    Example 5: Demonstrating contextual understanding
    """
    print("\n" + "="*70)
    print("EXAMPLE 5: Contextual Understanding")
    print("="*70 + "\n")
    
    from services.chatbot_orchestrator import chatbot
    
    session_id = "demo_user_5"
    
    # Conversation showing context preservation
    conversations = [
        ("Show me houses in Mississauga", "Initial search"),
        ("With 3 bedrooms", "Adding criteria (preserves location & type)"),
        ("In that area but condos", "Reference + type change"),
        ("Show me those under 500k", "Reference + price filter"),
        ("Actually make it 2 bedrooms", "Modification"),
    ]
    
    for msg, explanation in conversations:
        print(f"\n{'User:':>15} {msg}")
        print(f"{'Explanation:':>15} {explanation}")
        result = chatbot.process_message(msg, session_id)
        print(f"{'Final State:':>15} {result['state_summary']}")


def example_6_error_handling():
    """
    Example 6: Error handling and edge cases
    """
    print("\n" + "="*70)
    print("EXAMPLE 6: Error Handling")
    print("="*70 + "\n")
    
    from services.chatbot_orchestrator import chatbot
    
    session_id = "demo_user_6"
    
    # Test various scenarios
    test_cases = [
        ("What's the weather?", "Irrelevant question"),
        ("Show me properties", "Vague request"),
        ("Reset my search", "Reset command"),
        ("Tell me about Toronto neighborhoods", "General question"),
    ]
    
    for msg, scenario in test_cases:
        print(f"\n{'Scenario:':>15} {scenario}")
        print(f"{'User:':>15} {msg}")
        result = chatbot.process_message(msg, session_id)
        print(f"{'Response:':>15} {result['response'][:80]}...")


def example_7_frontend_integration():
    """
    Example 7: Frontend integration example
    """
    print("\n" + "="*70)
    print("EXAMPLE 7: Frontend Integration Example")
    print("="*70 + "\n")
    
    print("""
JavaScript Example:
==================

// Initialize session
const sessionId = generateUUID();

// Send message
async function sendMessage(message) {
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
    
    // Display suggestions as clickable buttons
    displaySuggestions(data.suggestions);
    
    // Display properties if any
    if (data.properties && data.properties.length > 0) {
        displayProperties(data.properties);
    }
    
    // Show current search state
    displaySearchState(data.state_summary);
}

// Handle suggestion click
function onSuggestionClick(suggestion) {
    sendMessage(suggestion);
}

React Example:
=============

import React, { useState } from 'react';

function Chatbot() {
    const [messages, setMessages] = useState([]);
    const [input, setInput] = useState('');
    const [sessionId] = useState(generateUUID());
    const [suggestions, setSuggestions] = useState([]);
    
    const sendMessage = async () => {
        const response = await fetch('/api/chat', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
                message: input,
                session_id: sessionId
            })
        });
        
        const data = await response.json();
        
        setMessages([...messages, 
            { role: 'user', content: input },
            { role: 'bot', content: data.response }
        ]);
        
        setSuggestions(data.suggestions);
        setInput('');
    };
    
    return (
        <div>
            <div className="messages">
                {messages.map((m, i) => (
                    <div key={i} className={m.role}>
                        {m.content}
                    </div>
                ))}
            </div>
            
            <div className="suggestions">
                {suggestions.map((s, i) => (
                    <button key={i} onClick={() => setInput(s)}>
                        {s}
                    </button>
                ))}
            </div>
            
            <input 
                value={input}
                onChange={e => setInput(e.target.value)}
                onKeyPress={e => e.key === 'Enter' && sendMessage()}
            />
        </div>
    );
}
    """)


def main():
    """Run all examples"""
    print("\n" + "="*70)
    print("CHATGPT-STYLE CHATBOT - QUICK START EXAMPLES")
    print("="*70)
    
    examples = [
        ("Basic Conversation", example_1_basic_conversation),
        ("Progressive Refinement", example_2_progressive_refinement),
        ("API Usage", example_3_api_usage),
        ("Direct Module Usage", example_4_direct_module_usage),
        ("Contextual Understanding", example_5_contextual_understanding),
        ("Error Handling", example_6_error_handling),
        ("Frontend Integration", example_7_frontend_integration),
    ]
    
    print("\nAvailable examples:")
    for i, (name, _) in enumerate(examples, 1):
        print(f"  {i}. {name}")
    
    print("\nRun specific example: python quick_start_examples.py <number>")
    print("Run all examples: python quick_start_examples.py all\n")
    
    # Check command line arguments
    if len(sys.argv) > 1:
        arg = sys.argv[1].lower()
        
        if arg == 'all':
            for name, func in examples:
                try:
                    func()
                except Exception as e:
                    print(f"\n❌ Error in {name}: {e}")
        else:
            try:
                idx = int(arg) - 1
                if 0 <= idx < len(examples):
                    examples[idx][1]()
                else:
                    print(f"Invalid example number. Choose 1-{len(examples)}")
            except ValueError:
                print("Invalid argument. Use a number or 'all'")
    else:
        # Run first example by default
        example_1_basic_conversation()
        
        print("\n" + "="*70)
        print("Run 'python quick_start_examples.py all' to see all examples")
        print("="*70 + "\n")


if __name__ == "__main__":
    main()
