"""
OpenAI integration API routes
"""
from flask import Blueprint, request, jsonify

openai_api = Blueprint('openai_api', __name__)

@openai_api.route('/api/openai/enhance-description', methods=['POST'])
def openai_enhance_description():
    """Enhance property description using OpenAI"""
    try:
        data = request.get_json()
        property_data = data.get('property', {})
        
        try:
            from services.openai_service import generate_smart_property_description
            
            result = generate_smart_property_description(property_data)
            return jsonify(result)
            
        except ImportError:
            return jsonify({
                "success": False,
                "error": "OpenAI service not available"
            }), 503
            
    except Exception as e:
        return jsonify({
            "success": False,
            "error": str(e)
        }), 500


@openai_api.route('/api/openai/market-analysis', methods=['POST'])
def openai_market_analysis():
    """Generate market analysis using OpenAI"""
    try:
        data = request.get_json()
        location = data.get('location', 'Toronto')
        property_type = data.get('property_type', 'residential')
        
        try:
            from services.openai_service import generate_market_analysis_report
            
            result = generate_market_analysis_report(location, property_type)
            return jsonify(result)
            
        except ImportError:
            return jsonify({
                "success": False,
                "error": "OpenAI service not available"
            }), 503
            
    except Exception as e:
        return jsonify({
            "success": False,
            "error": str(e)
        }), 500


@openai_api.route('/api/openai/investment-analysis', methods=['POST'])
def openai_investment_analysis():
    """Generate investment analysis using OpenAI"""
    try:
        data = request.get_json()
        property_data = data.get('property', {})
        investment_goals = data.get('goals', 'long-term appreciation')
        
        try:
            from services.openai_service import generate_investment_analysis
            
            result = generate_investment_analysis(property_data, investment_goals)
            return jsonify(result)
            
        except ImportError:
            return jsonify({
                "success": False,
                "error": "OpenAI service not available"
            }), 503
            
    except Exception as e:
        return jsonify({
            "success": False,
            "error": str(e)
        }), 500


@openai_api.route('/api/openai/followup-questions', methods=['POST'])
def openai_followup_questions():
    """Generate follow-up questions using OpenAI"""
    try:
        data = request.get_json()
        conversation_context = data.get('context', '')
        user_preferences = data.get('preferences', {})
        
        try:
            from services.openai_service import generate_followup_questions
            
            result = generate_followup_questions(conversation_context, user_preferences)
            return jsonify(result)
            
        except ImportError:
            return jsonify({
                "success": False,
                "error": "OpenAI service not available"
            }), 503
            
    except Exception as e:
        return jsonify({
            "success": False,
            "error": str(e)
        }), 500


@openai_api.route('/api/openai/status', methods=['GET'])
def openai_status():
    """Check OpenAI service status"""
    try:
        try:
            from services.openai_service import is_openai_available, test_openai_connection
            
            is_available = is_openai_available()
            
            if is_available:
                connection_test = test_openai_connection()
                return jsonify({
                    "success": True,
                    "available": True,
                    "connection_test": connection_test
                })
            else:
                return jsonify({
                    "success": True,
                    "available": False,
                    "message": "OpenAI API key not configured"
                })
                
        except ImportError:
            return jsonify({
                "success": True,
                "available": False,
                "message": "OpenAI service not imported"
            })
            
    except Exception as e:
        return jsonify({
            "success": False,
            "error": str(e)
        }), 500