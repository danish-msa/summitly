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
from datetime import datetime

from services.chatbot_orchestrator import chatbot
from services.input_validator import get_input_validator

logger = logging.getLogger(__name__)

# Create Blueprint
chatbot_bp = Blueprint('chatbot', __name__, url_prefix='/api')

# Initialize input validator
validator = get_input_validator()


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
        
        # === INPUT VALIDATION ===
        # Validate complete request payload
        is_valid, cleaned_data, validation_errors = validator.validate_chat_request(data)
        
        if not is_valid:
            logger.warning(f"❌ Validation failed: {'; '.join(validation_errors)}")
            return jsonify({
                'success': False,
                'error': 'Invalid request data',
                'validation_errors': validation_errors
            }), 400
        
        # Extract validated and cleaned data
        user_message = cleaned_data.get('message')
        user_context = cleaned_data.get('context', {})
        
        # Session ID lookup priority:
        # 1. X-Session-Id header
        # 2. Validated session_id from request body
        # 3. session_id from cookie
        # 4. session_id from query param
        # 5. Generate new UUID
        session_id = (
            request.headers.get('X-Session-Id') or
            cleaned_data.get('session_id') or
            request.cookies.get('session_id') or
            request.args.get('session_id') or
            str(uuid.uuid4())
        )
        
        # Validate session_id from headers/cookies/query if not already validated
        if session_id not in cleaned_data:
            is_valid_session, error = validator.validate_session_id(session_id)
            if not is_valid_session:
                # If invalid, generate a new one
                logger.warning(f"Invalid session_id from header/cookie/query: {error}")
                session_id = str(uuid.uuid4())
        
        # Also check for user_id in headers (JWT/auth token)
        if request.headers.get('X-User-Id'):
            user_context['user_id'] = request.headers.get('X-User-Id')
        
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
        
        # Add full state object for frontend (location_state + filters)
        # This provides the frontend with all the context it needs
        try:
            from services.chatbot_orchestrator import state_manager
            unified_state = state_manager.get_or_create(session_id)
            
            # Build location_state dict if available
            location_state_dict = None
            if unified_state.location_state:
                loc = unified_state.location_state
                location_state_dict = {
                    "latitude": getattr(loc, 'latitude', None),
                    "longitude": getattr(loc, 'longitude', None),
                    "radius_m": getattr(loc, 'radius_m', None),
                    "confidence": getattr(loc, 'confidence', None),
                    "city": getattr(loc, 'city', None),
                    "postal_code": getattr(loc, 'postal_code', None),
                    "address": getattr(loc, 'address', None),
                    "neighborhood": getattr(loc, 'neighborhood', None),
                    "community": getattr(loc, 'community', None),
                    "location_type": getattr(loc, 'location_type', None),
                    "source": getattr(loc, 'source', None),
                    "location_name": getattr(loc, 'address', None) or getattr(loc, 'city', None),
                }
            
            # Build filters dict
            filters_dict = None
            if unified_state.active_filters:
                af = unified_state.active_filters
                filters_dict = {
                    "property_type": getattr(af, 'property_type', None),
                    "listing_type": getattr(af, 'listing_type', None),
                    "price_min": getattr(af, 'price_min', None),
                    "price_max": getattr(af, 'price_max', None),
                    "bedrooms": getattr(af, 'bedrooms', None),
                    "bathrooms": getattr(af, 'bathrooms', None),
                    "location": getattr(af, 'location', None),
                }
            
            # Add state object to response
            result['state'] = {
                "location_state": location_state_dict,
                "filters": filters_dict,
                "search_count": unified_state.search_count,
                "zero_results_count": unified_state.zero_results_count,
            }
        except Exception as state_error:
            logger.warning(f"⚠️ Failed to build state object: {state_error}")
            result['state'] = None
        
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
        
        # Validate session_id
        is_valid, error = validator.validate_session_id(session_id)
        if not is_valid:
            return jsonify({
                'success': False,
                'error': f'Invalid session_id: {error}'
            }), 400
        
        # Delete session from UnifiedStateManager (primary store)
        from services.chatbot_orchestrator import state_manager
        deleted = state_manager.delete(session_id)
        
        # Also delete from legacy state manager for backwards compatibility
        from services.conversation_state import conversation_state_manager
        conversation_state_manager.delete(session_id)
        
        logger.info(f"🔄 Session deleted | session_id={session_id} | deleted={deleted}")
        
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
        # Validate session_id from URL parameter
        is_valid, error = validator.validate_session_id(session_id)
        if not is_valid:
            return jsonify({
                'success': False,
                'error': f'Invalid session_id: {error}'
            }), 400
        
        # Use UnifiedStateManager as primary source
        from services.chatbot_orchestrator import state_manager
        
        unified_state = state_manager.get_or_create(session_id)
        
        return jsonify({
            'success': True,
            'state': unified_state.model_dump(),
            'summary': unified_state.get_summary(),
            'active_filters': unified_state.get_active_filters(),
            'session_id': session_id,
            'backend': state_manager.backend
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


@chatbot_bp.route('/admin/chat-analytics', methods=['GET'])
def chat_analytics():
    """
    Admin endpoint to get chat session analytics.
    
    Returns session statistics including active sessions, 
    average conversation length, and recently active sessions.
    
    Response:
        {
            "success": bool,
            "session_count": int,
            "average_conversation_length": float,
            "active_sessions_last_15_min": list,
            "backend": str,
            "timestamp": str
        }
    
    Note: This endpoint should be protected by authentication in production.
    """
    try:
        # Import state_manager from orchestrator
        from services.chatbot_orchestrator import state_manager
        
        # Get analytics data
        analytics = {
            "success": True,
            "session_count": state_manager.get_session_count(),
            "average_conversation_length": round(state_manager.get_average_conversation_length(), 2),
            "active_sessions_last_15_min": state_manager.get_active_sessions_in_last_n_minutes(15),
            "active_sessions_last_5_min": state_manager.get_active_sessions_in_last_n_minutes(5),
            "backend": state_manager.backend,
            "redis_available": state_manager.is_redis_available,
            "timestamp": datetime.now().isoformat()
        }
        
        # Add full analytics summary if available
        try:
            analytics["full_summary"] = state_manager.get_analytics_summary()
        except Exception:
            pass
        
        logger.info(f"📊 Analytics requested | session_count={analytics['session_count']}")
        
        return jsonify(analytics), 200
    
    except Exception as e:
        logger.error(f"❌ Analytics error: {e}")
        return jsonify({
            'success': False,
            'error': str(e)
        }), 500


@chatbot_bp.route('/admin/intent-stats', methods=['GET'])
def intent_classifier_stats():
    """
    Admin endpoint to get HybridIntentClassifier performance statistics.
    
    Returns cache hit rate and performance metrics for intent classification.
    
    Response:
        {
            "success": bool,
            "cache_hit_rate": float,
            "cache_hit_rate_percent": str,
            "description": str,
            "local_first": str,
            "gpt_fallback": str
        }
    
    Note: This endpoint should be protected by authentication in production.
    """
    try:
        # Import chatbot from orchestrator
        from services.chatbot_orchestrator import chatbot
        
        # Get intent classifier stats
        stats = chatbot.get_intent_classifier_stats()
        
        logger.info(f"📊 Intent stats requested | cache_hit_rate={stats.get('cache_hit_rate_percent', 'N/A')}")
        
        return jsonify(stats), 200
    
    except Exception as e:
        logger.error(f"❌ Intent stats error: {e}")
        return jsonify({
            'success': False,
            'error': str(e)
        }), 500


@chatbot_bp.route('/admin/session/<session_id>/checkpoint', methods=['POST'])
def create_session_checkpoint(session_id):
    """
    Create a checkpoint for a specific session.
    
    Response:
        {
            "success": bool,
            "checkpoint_id": str,
            "session_id": str
        }
    """
    try:
        from services.chatbot_orchestrator import state_manager
        
        # Get the current state
        state = state_manager.get_or_create(session_id)
        
        # Create checkpoint
        checkpoint_id = state_manager.create_checkpoint(state)
        
        logger.info(f"📸 Checkpoint created | session_id={session_id} | checkpoint_id={checkpoint_id}")
        
        return jsonify({
            'success': True,
            'checkpoint_id': checkpoint_id,
            'session_id': session_id
        }), 200
    
    except Exception as e:
        logger.error(f"❌ Checkpoint creation error: {e}")
        return jsonify({
            'success': False,
            'error': str(e)
        }), 500


@chatbot_bp.route('/admin/checkpoint/<checkpoint_id>', methods=['GET'])
def get_checkpoint(checkpoint_id):
    """
    Get a checkpoint state by ID.
    
    Response:
        {
            "success": bool,
            "state": dict,
            "checkpoint_id": str
        }
    """
    try:
        from services.chatbot_orchestrator import state_manager
        
        # Get checkpoint
        checkpoint_state = state_manager.get_checkpoint(checkpoint_id)
        
        if checkpoint_state is None:
            return jsonify({
                'success': False,
                'error': 'Checkpoint not found'
            }), 404
        
        return jsonify({
            'success': True,
            'state': checkpoint_state.model_dump(),
            'checkpoint_id': checkpoint_id,
            'session_id': checkpoint_state.session_id
        }), 200
    
    except Exception as e:
        logger.error(f"❌ Get checkpoint error: {e}")
        return jsonify({
            'success': False,
            'error': str(e)
        }), 500


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
