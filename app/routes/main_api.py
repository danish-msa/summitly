"""
Main API routes for property analysis and chat functionality
"""
from flask import Blueprint, request, jsonify
from app.handlers.property_handler import generate_quick_ai_insights
from app.handlers.conversation_handler import process_conversation_stage, generate_contextual_response
from app.models.models import Session
from app.utils.audio_utils import text_to_speech_bytes, speech_to_text
import os
import tempfile
import traceback

main_api = Blueprint('main_api', __name__)

# Session management
sessions = {}

@main_api.route('/api/property-analysis', methods=['POST'])
def property_analysis_endpoint():
    """Property analysis endpoint with multiple modes"""
    try:
        data = request.get_json()
        print(f"🔍 [PROPERTY ANALYSIS] Request received: {data}")
        
        property_data = data.get('property', {})
        mls_number = data.get('mls_number', property_data.get('mls_number', 'Unknown'))
        analysis_mode = data.get('mode', 'quick')  # 'quick', 'full', 'legacy'
        
        print(f"🔍 [PROPERTY ANALYSIS] Mode: {analysis_mode}, MLS: {mls_number}")
        
        if analysis_mode == 'quick':
            # MODE 1: QUICK INSIGHTS
            print("🚀 [PROPERTY ANALYSIS] Using QUICK INSIGHTS mode")
            
            analysis_result = generate_quick_ai_insights(property_data, mls_number)
            
            if analysis_result.get('success'):
                return jsonify({
                    "success": True,
                    "mode": "quick_insights",
                    "mls_number": mls_number,
                    "analysis": analysis_result['insights'],
                    "sources": analysis_result.get('sources', []),
                    "property_data": property_data
                })
            else:
                return jsonify({
                    "success": False,
                    "error": "Quick insights generation failed",
                    "mode": "quick_insights"
                }), 500
                
        elif analysis_mode == 'full':
            # MODE 2: FULL VALUATION
            print("📊 [PROPERTY ANALYSIS] Using FULL VALUATION mode")
            
            try:
                from services.estimates_service import estimates_service
                
                valuation_result = estimates_service.get_comprehensive_analysis(
                    mls_number=mls_number,
                    property_data=property_data
                )
                
                if valuation_result.get('success'):
                    return jsonify({
                        "success": True,
                        "mode": "full_valuation",
                        "mls_number": mls_number,
                        "valuation": valuation_result.get('analysis', {}),
                        "comparables": valuation_result.get('comparables', []),
                        "market_data": valuation_result.get('market_data', {}),
                        "property_data": property_data
                    })
                else:
                    # Fallback to quick insights if full valuation fails
                    print("⚠️ [PROPERTY ANALYSIS] Full valuation failed, falling back to quick insights")
                    analysis_result = generate_quick_ai_insights(property_data, mls_number)
                    
                    return jsonify({
                        "success": True,
                        "mode": "quick_insights_fallback",
                        "mls_number": mls_number,
                        "analysis": analysis_result['insights'],
                        "sources": analysis_result.get('sources', []),
                        "property_data": property_data,
                        "note": "Fell back to quick insights due to full valuation unavailability"
                    })
                    
            except ImportError:
                print("⚠️ [PROPERTY ANALYSIS] Estimates service not available, using quick insights")
                analysis_result = generate_quick_ai_insights(property_data, mls_number)
                
                return jsonify({
                    "success": True,
                    "mode": "quick_insights_fallback",
                    "mls_number": mls_number,
                    "analysis": analysis_result['insights'],
                    "sources": analysis_result.get('sources', []),
                    "property_data": property_data
                })
        
        else:
            # LEGACY MODE (FALLBACK)
            print("⚙️ [PROPERTY ANALYSIS] Using LEGACY mode")
            return jsonify({
                "success": True,
                "mode": "legacy",
                "message": "Basic property information returned",
                "property_data": property_data
            })
        
    except Exception as e:
        print(f"❌ [PROPERTY ANALYSIS] Error: {e}")
        traceback.print_exc()
        return jsonify({
            "success": False,
            "error": str(e),
            "mode": "error"
        }), 500


@main_api.route('/api/property-conversation', methods=['POST'])
def property_conversation_endpoint():
    """Handle natural conversation about properties"""
    try:
        data = request.get_json()
        property_id = data.get('property_id')
        user_message = data.get('message', '')
        history = data.get('history', [])
        
        print(f"💬 [PROPERTY CONVERSATION] Property ID: {property_id}")
        print(f"💬 [PROPERTY CONVERSATION] Message: {user_message}")
        
        response = generate_property_conversation_response(property_id, user_message, history)
        
        return jsonify({
            "success": True,
            "response": response,
            "property_id": property_id
        })
        
    except Exception as e:
        print(f"❌ [PROPERTY CONVERSATION] Error: {e}")
        return jsonify({
            "success": False,
            "error": str(e)
        }), 500


def generate_property_conversation_response(property_id: str, user_message: str, history: list) -> str:
    """Generate natural conversational responses about a property"""
    try:
        # Basic conversational responses about properties
        user_lower = user_message.lower()
        
        if any(word in user_lower for word in ['price', 'cost', 'expensive', 'cheap', 'budget']):
            return "I can provide detailed pricing analysis including market comparables and trends. Would you like me to analyze the current market value for this property?"
        
        elif any(word in user_lower for word in ['neighborhood', 'area', 'location', 'schools', 'amenities']):
            return "This area offers great amenities and community features. I can provide detailed neighborhood insights including schools, transit, shopping, and local market trends."
        
        elif any(word in user_lower for word in ['investment', 'roi', 'rental', 'cash flow']):
            return "From an investment perspective, I can analyze the rental potential, cash flow projections, and long-term appreciation prospects for this property."
        
        elif any(word in user_lower for word in ['mortgage', 'financing', 'down payment', 'monthly']):
            return "I can help you understand the financing options including estimated monthly payments, down payment requirements, and total carrying costs."
        
        else:
            return "I'm here to help with any questions about this property. You can ask about pricing, neighborhood details, investment potential, or financing options."
            
    except Exception as e:
        print(f"❌ Property conversation error: {e}")
        return "I'm having trouble processing that request right now. Could you please try asking in a different way?"


@main_api.route('/api/voice-init', methods=['GET'])
def voice_init():
    """Initialize voice chat session"""
    try:
        session_id = request.args.get('session_id', 'default')
        
        if session_id not in sessions:
            sessions[session_id] = Session()
        
        return jsonify({
            "success": True,
            "session_id": session_id,
            "message": "Voice session initialized"
        })
        
    except Exception as e:
        print(f"❌ Voice init error: {e}")
        return jsonify({
            "success": False,
            "error": str(e)
        }), 500


@main_api.route('/api/voice-chat', methods=['POST', 'OPTIONS'])
def voice_chat():
    """Handle voice chat interactions"""
    if request.method == 'OPTIONS':
        return jsonify({"success": True})
    
    try:
        session_id = request.form.get('session_id', 'default')
        
        if session_id not in sessions:
            sessions[session_id] = Session()
        
        session = sessions[session_id]
        
        # Handle audio file
        if 'audio' in request.files:
            audio_file = request.files['audio']
            
            # Save temporary audio file
            with tempfile.NamedTemporaryFile(delete=False, suffix='.wav') as tmp_file:
                audio_file.save(tmp_file.name)
                
                # Convert speech to text
                user_text = speech_to_text(tmp_file.name)
                
                # Clean up temporary file
                os.unlink(tmp_file.name)
                
                if not user_text:
                    return jsonify({
                        "success": False,
                        "error": "Could not understand audio"
                    }), 400
        else:
            user_text = request.form.get('text', '')
        
        if not user_text:
            return jsonify({
                "success": False,
                "error": "No text or audio provided"
            }), 400
        
        # Process conversation
        response = process_conversation_stage(session, user_text)
        
        # Convert response to speech
        audio_base64 = text_to_speech_bytes(response)
        
        return jsonify({
            "success": True,
            "text_response": response,
            "audio_response": audio_base64,
            "session_stage": session.stage
        })
        
    except Exception as e:
        print(f"❌ Voice chat error: {e}")
        return jsonify({
            "success": False,
            "error": str(e)
        }), 500


@main_api.route('/api/text-chat', methods=['POST'])
def text_chat():
    """Handle text-based chat interactions"""
    try:
        data = request.get_json()
        session_id = data.get('session_id', 'default')
        user_text = data.get('message', '')
        
        if session_id not in sessions:
            sessions[session_id] = Session()
        
        session = sessions[session_id]
        
        if not user_text:
            return jsonify({
                "success": False,
                "error": "No message provided"
            }), 400
        
        # Process conversation
        response = process_conversation_stage(session, user_text)
        
        return jsonify({
            "success": True,
            "response": response,
            "session_stage": session.stage,
            "user_data": session.user_data
        })
        
    except Exception as e:
        print(f"❌ Text chat error: {e}")
        return jsonify({
            "success": False,
            "error": str(e)
        }), 500


@main_api.route('/admin/transactions/<session_id>', methods=['GET'])
def get_transaction_log(session_id: str):
    """
    Get transaction audit log for a session.
    
    Returns complete transaction history including:
    - Transaction type and status
    - Timestamps and duration
    - State changes
    - Checkpoints created
    - Rollback events
    
    Args:
        session_id: Session to get transaction log for
        
    Returns:
        JSON with transaction log array
    """
    try:
        from services.chatbot_orchestrator import chatbot_instance
        
        if not chatbot_instance:
            return jsonify({
                "success": False,
                "error": "Chatbot not initialized"
            }), 500
        
        # Get transaction log from transaction manager
        transaction_log = chatbot_instance.transaction_manager.get_transaction_log(session_id)
        
        # Get checkpoint count
        checkpoint_count = len(chatbot_instance.transaction_manager.get_checkpoints(session_id))
        
        return jsonify({
            "success": True,
            "session_id": session_id,
            "transaction_count": len(transaction_log),
            "checkpoint_count": checkpoint_count,
            "transactions": [log.model_dump() for log in transaction_log]  # ✅ Pydantic v2: model_dump() instead of to_dict()
        })
        
    except Exception as e:
        print(f"❌ Transaction log error: {e}")
        traceback.print_exc()
        return jsonify({
            "success": False,
            "error": str(e)
        }), 500


@main_api.route('/admin/transactions/<session_id>/rollback', methods=['POST'])
def rollback_transaction(session_id: str):
    """
    Rollback session state to a previous checkpoint.
    
    Args:
        session_id: Session to rollback
        
    Request body:
        {
            "checkpoint_id": "checkpoint_uuid"  // Optional, defaults to most recent
        }
        
    Returns:
        JSON with rollback result
    """
    try:
        from services.chatbot_orchestrator import chatbot_instance
        
        if not chatbot_instance:
            return jsonify({
                "success": False,
                "error": "Chatbot not initialized"
            }), 500
        
        data = request.get_json() or {}
        checkpoint_id = data.get('checkpoint_id')
        
        # Get available checkpoints
        checkpoints = chatbot_instance.transaction_manager.get_checkpoints(session_id)
        
        if not checkpoints:
            return jsonify({
                "success": False,
                "error": f"No checkpoints available for session {session_id}"
            }), 404
        
        # Use most recent checkpoint if not specified
        if not checkpoint_id:
            checkpoint_id = checkpoints[-1].checkpoint_id
        
        # Execute rollback
        success = chatbot_instance.transaction_manager.rollback_to_checkpoint(
            session_id=session_id,
            checkpoint_id=checkpoint_id
        )
        
        if success:
            return jsonify({
                "success": True,
                "message": f"Rolled back to checkpoint {checkpoint_id}",
                "checkpoint_id": checkpoint_id
            })
        else:
            return jsonify({
                "success": False,
                "error": "Rollback failed"
            }), 500
        
    except Exception as e:
        print(f"❌ Rollback error: {e}")
        traceback.print_exc()
        return jsonify({
            "success": False,
            "error": str(e)
        }), 500