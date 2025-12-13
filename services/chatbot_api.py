"""
ChatGPT-Style Chatbot API Endpoint
==================================
Flask endpoint for the enhanced conversational chatbot.

Usage:
    POST /api/chat
    {
        "message": "Show me 2 bedroom condos in Toronto",
        "session_id": "user_123",
        "context": {}  // optional
    }

Response:
    {
        "success": true,
        "response": "I found 15 condos...",
        "suggestions": ["...", "...", "..."],
        "properties": [...],
        "property_count": 15,
        "state_summary": "2 bedroom condo in Toronto for sale"
    }

Author: Summitly Team
Date: December 12, 2025
"""

from flask import Blueprint, request, jsonify
import logging
import uuid
from datetime import datetime

from services.chatbot_orchestrator import chatbot

logger = logging.getLogger(__name__)

# Create Blueprint
chatbot_bp = Blueprint('chatbot', __name__, url_prefix='/api')


@chatbot_bp.route('/chat', methods=['POST'])
def chat():
    """
    Main chat endpoint - processes conversational messages.
    
    Request:
        {
            "message": str (required) - User's message
            "session_id": str (optional) - Session identifier
            "context": dict (optional) - Additional context
        }
    
    Response:
        {
            "success": bool,
            "response": str - Main response text,
            "suggestions": list - Follow-up suggestions,
            "properties": list - Property results (if any),
            "property_count": int,
            "state_summary": str - Current search criteria,
            "session_id": str
        }
    """
    try:
        # Get request data
        data = request.get_json()
        
        if not data:
            return jsonify({
                'success': False,
                'error': 'No JSON data provided'
            }), 400
        
        # Extract parameters
        user_message = data.get('message', '').strip()
        session_id = data.get('session_id') or str(uuid.uuid4())
        user_context = data.get('context', {})
        
        # Validate message
        if not user_message:
            return jsonify({
                'success': False,
                'error': 'Message is required'
            }), 400
        
        logger.info(f"📨 Chat request - Session: {session_id}, Message: '{user_message[:50]}...'")
        
        # Process message through chatbot
        result = chatbot.process_message(
            user_message=user_message,
            session_id=session_id,
            user_context=user_context
        )
        
        # Add session_id to response
        result['session_id'] = session_id
        result['timestamp'] = datetime.now().isoformat()
        
        logger.info(f"✅ Chat response - {result.get('property_count', 0)} properties")
        
        return jsonify(result), 200
    
    except Exception as e:
        logger.error(f"❌ Chat endpoint error: {e}", exc_info=True)
        return jsonify({
            'success': False,
            'error': str(e),
            'response': "I'm sorry, I encountered an error. Please try again.",
            'suggestions': [
                "Try rephrasing your question",
                "Start a new search",
                "Ask me about real estate"
            ]
        }), 500


@chatbot_bp.route('/chat/reset', methods=['POST'])
def reset_session():
    """
    Reset a conversation session.
    
    Request:
        {
            "session_id": str (required)
        }
    
    Response:
        {
            "success": bool,
            "message": str
        }
    """
    try:
        data = request.get_json()
        session_id = data.get('session_id')
        
        if not session_id:
            return jsonify({
                'success': False,
                'error': 'session_id is required'
            }), 400
        
        # Delete session
        from services.conversation_state import conversation_state_manager
        conversation_state_manager.delete(session_id)
        
        logger.info(f"🔄 Reset session: {session_id}")
        
        return jsonify({
            'success': True,
            'message': f'Session {session_id} has been reset'
        }), 200
    
    except Exception as e:
        logger.error(f"❌ Reset error: {e}")
        return jsonify({
            'success': False,
            'error': str(e)
        }), 500


@chatbot_bp.route('/chat/session/<session_id>', methods=['GET'])
def get_session(session_id):
    """
    Get current session state.
    
    Response:
        {
            "success": bool,
            "state": dict - Conversation state,
            "summary": str - Human-readable summary
        }
    """
    try:
        from services.conversation_state import conversation_state_manager
        
        state = conversation_state_manager.get_or_create(session_id)
        
        return jsonify({
            'success': True,
            'state': state.to_dict(),
            'summary': state.get_summary(),
            'active_filters': state.get_active_filters()
        }), 200
    
    except Exception as e:
        logger.error(f"❌ Get session error: {e}")
        return jsonify({
            'success': False,
            'error': str(e)
        }), 500


@chatbot_bp.route('/chat/health', methods=['GET'])
def health_check():
    """
    Health check endpoint.
    
    Response:
        {
            "status": str,
            "services": dict - Status of each service
        }
    """
    services_status = {}
    
    # Check OpenAI
    try:
        from services.chatgpt_service import chatgpt_service
        services_status['openai'] = 'available' if chatgpt_service.client else 'unavailable'
    except Exception as e:
        services_status['openai'] = f'error: {str(e)}'
    
    # Check MLS
    try:
        from services.enhanced_mls_service import enhanced_mls_service
        services_status['mls'] = 'available'
    except Exception as e:
        services_status['mls'] = f'error: {str(e)}'
    
    # Check NLP
    try:
        from services.nlp_parser import nlp_parser
        services_status['nlp'] = 'available'
    except Exception as e:
        services_status['nlp'] = f'error: {str(e)}'
    
    all_available = all(status == 'available' for status in services_status.values())
    
    return jsonify({
        'status': 'healthy' if all_available else 'degraded',
        'services': services_status,
        'timestamp': datetime.now().isoformat()
    }), 200


# Error handlers
@chatbot_bp.errorhandler(404)
def not_found(error):
    return jsonify({
        'success': False,
        'error': 'Endpoint not found'
    }), 404


@chatbot_bp.errorhandler(500)
def internal_error(error):
    logger.error(f"Internal error: {error}")
    return jsonify({
        'success': False,
        'error': 'Internal server error'
    }), 500


# Register blueprint function
def register_chatbot_blueprint(app):
    """
    Register the chatbot blueprint with Flask app.
    
    Usage:
        from services.chatbot_api import register_chatbot_blueprint
        register_chatbot_blueprint(app)
    """
    app.register_blueprint(chatbot_bp)
    logger.info("✅ Chatbot API blueprint registered")


if __name__ == "__main__":
    # Test the API
    from flask import Flask
    
    app = Flask(__name__)
    register_chatbot_blueprint(app)
    
    print("🧪 Testing Chatbot API...")
    print("Starting Flask server on http://localhost:5000")
    print("\nTest with:")
    print("  curl -X POST http://localhost:5000/api/chat \\")
    print('    -H "Content-Type: application/json" \\')
    print('    -d \'{"message": "Show me 2 bedroom condos in Toronto"}\'')
    
    app.run(debug=True, port=5000)
