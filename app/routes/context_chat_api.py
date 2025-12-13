"""
Context-Aware Chat API Routes
Maintains conversation context across sessions
"""
from flask import Blueprint, request, jsonify
from services.conversation_context_manager import context_manager
from services import openai_service
from typing import Dict, List, Optional
import logging
import uuid
import sys
import os

# Add parent directory to path to import from app
sys.path.insert(0, os.path.dirname(os.path.dirname(os.path.abspath(__file__))))

# Import property data processing and AI insights generation
from app.utils.property_utils import (
    standardize_property_data,
    generate_quick_ai_insights,
    REPLIERS_INTEGRATION_AVAILABLE
)

logger = logging.getLogger(__name__)

context_chat_api = Blueprint('context_chat_api', __name__)


@context_chat_api.route('/api/chat/context', methods=['POST'])
def chat_with_context():
    """
    Chat endpoint that maintains conversation context
    
    Request:
    {
        "user_id": "unique_user_id",  # Optional - generates if not provided
        "message": "Show me condos in Toronto under $800k"
    }
    
    Response:
    {
        "success": true,
        "response": "AI response text",
        "user_id": "unique_user_id",
        "predicted_questions": ["...", "..."],
        "suggested_actions": ["...", "..."],
        "context_summary": "..."
    }
    """
    try:
        data = request.json
        
        # Get or generate user_id
        user_id = data.get('user_id') or str(uuid.uuid4())
        message = data.get('message', '').strip()
        
        if not message:
            return jsonify({
                'success': False,
                'error': 'Message is required'
            }), 400
        
        logger.info(f"Chat request from user {user_id[:8]}...: {message[:50]}...")
        
        # Initialize standardized_properties at the start to avoid reference errors
        standardized_properties = []
        
        # Load or create session
        session = context_manager.get_or_create_session(user_id)
        
        # Add user message to history
        intent = _detect_intent(message)
        context_manager.add_to_conversation(user_id, message, 'user', intent)
        
        # Extract preferences from the conversation immediately
        context_manager.extract_preferences_from_conversation(user_id)
        
        # Get context for AI
        ai_context = context_manager.get_context_for_ai(user_id)
        
        # Generate AI response WITH context
        ai_prompt = _build_contextual_prompt(message, ai_context)
        
        # Get AI response using OpenAI service
        try:
            # Check if this is a property search request
            # Include conversational refinements like "what about", "how about"
            search_keywords = ['properties', 'show me', 'find', 'search', 'looking for', 'condos', 'houses', 'townhouse', 'condo', 'house', 'apartment']
            refinement_patterns = ['what about', 'how about', 'what if', 'show', 'bedroom', 'bathroom', 'price']
            
            has_search_keyword = any(word in message.lower() for word in search_keywords)
            has_refinement = any(word in message.lower() for word in refinement_patterns)
            has_existing_context = bool(ai_context.get('preferences', {}).get('locations'))
            
            # Trigger search if: direct keyword OR (refinement phrase AND existing location context)
            is_property_search = has_search_keyword or (has_refinement and has_existing_context)
            
            property_results = None
            if is_property_search:
                # Search for ACTUAL properties using context
                property_results = _search_properties_from_context(ai_context, message)
                
                if property_results and property_results.get('properties'):
                    # Use ACTUAL search parameters from the result, not stored context
                    search_params = property_results.get('search_params', {})
                    location_str = search_params.get('location') or "your area"
                    type_str = search_params.get('property_type') or "properties"
                    
                    # Standardize properties (but skip AI insights for search lists to improve performance)
                    generate_insights = len(property_results.get('properties', [])) <= 3  # Only for small result sets
                    
                    for prop in property_results.get('properties', []):
                        try:
                            # Always standardize property data to fix field name mismatches
                            standardized_prop = standardize_property_data(prop)
                            
                            # Only generate AI insights for small result sets or when specifically requested
                            if generate_insights:
                                mls_number = standardized_prop.get('mls_number') or standardized_prop.get('id')
                                try:
                                    logger.info(f"Generating insights for property {mls_number} (small result set)")
                                    insights_data = generate_quick_ai_insights(standardized_prop, mls_number)
                                    # Fix: Use 'insights' key (not 'quick_insights') from generate_quick_ai_insights response
                                    standardized_prop['quick_insights'] = insights_data.get('insights')
                                    standardized_prop['sources'] = insights_data.get('sources', [])
                                    standardized_prop['mls_number'] = mls_number  # Ensure MLS number is available
                                except Exception as insight_error:
                                    # Don't let one property's insight failure break the whole list
                                    standardized_prop['quick_insights'] = None
                                    standardized_prop['sources'] = []
                                    logger.warning(f"Failed to generate insights for property {mls_number}: {insight_error}")
                            else:
                                # For large result sets, skip insights to improve performance
                                standardized_prop['quick_insights'] = None
                                standardized_prop['sources'] = []
                                standardized_prop['insights_available'] = True  # Flag that insights can be generated on demand
                            
                            standardized_properties.append(standardized_prop)
                            
                        except Exception as prop_error:
                            logger.error(f"Failed to process property: {prop_error}")
                            # Still include the property even if processing failed
                            standardized_properties.append(prop)
                    
                    # Create informative response based on insights generation
                    if generate_insights:
                        ai_response = f"I found {len(standardized_properties)} {type_str} in {location_str} with detailed AI insights!"
                    else:
                        ai_response = f"I found {len(standardized_properties)} {type_str} in {location_str}! Click on any property for detailed AI analysis and valuation."
                elif property_results:
                    # No properties found, but we have search params
                    search_params = property_results.get('search_params', {})
                    location_str = search_params.get('location') or "your area"
                    type_str = search_params.get('property_type') or "properties"
                    max_price = search_params.get('max_price')
                    price_str = f"under ${max_price:,}" if max_price else ""
                    
                    ai_response = f"I searched for {type_str} in {location_str} {price_str}, but couldn't find any matching properties. Try adjusting your criteria!"
                else:
                    # Fallback if search completely failed
                    ai_response = _generate_property_search_response(ai_context, message)
            else:
                # Try OpenAI for regular conversational response
                if openai_service.is_openai_available():
                    ai_response = openai_service.enhance_conversational_response(
                        user_message=ai_prompt,
                        context={'summary': ai_context.get('summary'), 'preferences': ai_context.get('preferences')},
                        conversation_history=session.get('conversation_history', [])[-5:]
                    )
                    
                    if not ai_response:
                        ai_response = _generate_fallback_response(message, ai_context)
                else:
                    ai_response = _generate_fallback_response(message, ai_context)
                    
        except Exception as e:
            logger.warning(f"AI service failed: {e}, using context-aware fallback")
            ai_response = _generate_fallback_response(message, ai_context)
            # Keep standardized_properties intact even if AI service fails
        
        # Add AI response to history
        context_manager.add_to_conversation(user_id, ai_response, 'assistant')
        
        # Get next predicted questions
        predicted_questions = context_manager.predict_next_questions(user_id)
        
        # Get suggested actions
        suggested_actions = _get_suggested_actions(session)
        
        # Get context summary
        context_summary = context_manager.generate_conversation_summary(user_id)
        
        # Build response with property results if available
        response_data = {
            'success': True,
            'response': ai_response,
            'user_id': user_id,
            'predicted_questions': predicted_questions,
            'suggested_actions': suggested_actions,
            'context_summary': context_summary,
            'engagement_level': session['behavioral_signals']['engagement_level']
        }
        
        # Add property results if found
        if standardized_properties:
            response_data['properties'] = standardized_properties
            response_data['total_found'] = len(standardized_properties)
            response_data['search_context'] = ai_context.get('preferences', {})
        
        return jsonify(response_data)
        
    except Exception as e:
        logger.error(f"Chat with context error: {str(e)}", exc_info=True)
        return jsonify({
            'success': False,
            'error': f'Chat failed: {str(e)}'
        }), 500


@context_chat_api.route('/api/chat/session/<user_id>', methods=['GET'])
def get_session_info(user_id: str):
    """
    Get session information for a user
    
    Response:
    {
        "success": true,
        "session": {...},
        "stats": {...},
        "preferences": {...}
    }
    """
    try:
        session = context_manager.get_or_create_session(user_id)
        stats = context_manager.get_session_stats(user_id)
        preferences = context_manager.extract_preferences_from_conversation(user_id)
        
        return jsonify({
            'success': True,
            'session': {
                'created_at': session['created_at'],
                'last_updated': session['last_updated'],
                'conversation_length': len(session['conversation_history']),
                'search_count': session['behavioral_signals']['search_count']
            },
            'stats': stats,
            'preferences': preferences
        })
        
    except Exception as e:
        logger.error(f"Get session error: {str(e)}", exc_info=True)
        return jsonify({
            'success': False,
            'error': str(e)
        }), 500


@context_chat_api.route('/api/chat/history/<user_id>', methods=['GET'])
def get_conversation_history(user_id: str):
    """
    Get conversation history for a user
    
    Query params:
    - limit: Number of messages to return (default: 20)
    """
    try:
        limit = int(request.args.get('limit', 20))
        
        session = context_manager.get_or_create_session(user_id)
        history = session['conversation_history'][-limit:]
        
        return jsonify({
            'success': True,
            'history': history,
            'total_messages': len(session['conversation_history'])
        })
        
    except Exception as e:
        logger.error(f"Get history error: {str(e)}", exc_info=True)
        return jsonify({
            'success': False,
            'error': str(e)
        }), 500


@context_chat_api.route('/api/chat/search-update', methods=['POST'])
def update_search_context():
    """
    Update search context after a property search
    
    Request:
    {
        "user_id": "unique_user_id",
        "query": "3 bedroom condos in Toronto",
        "results": [...],  # Property results
        "filters": {...}   # Search filters used
    }
    """
    try:
        data = request.json
        user_id = data.get('user_id')
        query = data.get('query')
        results = data.get('results', [])
        filters = data.get('filters')
        
        if not user_id or not query:
            return jsonify({
                'success': False,
                'error': 'user_id and query are required'
            }), 400
        
        context_manager.update_search_context(user_id, query, results, filters)
        
        return jsonify({
            'success': True,
            'message': 'Search context updated'
        })
        
    except Exception as e:
        logger.error(f"Update search context error: {str(e)}", exc_info=True)
        return jsonify({
            'success': False,
            'error': str(e)
        }), 500


@context_chat_api.route('/api/chat/property-view', methods=['POST'])
def track_property_view():
    """
    Track when user views a property
    
    Request:
    {
        "user_id": "unique_user_id",
        "property_id": "prop123",
        "property_data": {...}  # Optional property details
    }
    """
    try:
        data = request.json
        user_id = data.get('user_id')
        property_id = data.get('property_id')
        property_data = data.get('property_data')
        
        if not user_id or not property_id:
            return jsonify({
                'success': False,
                'error': 'user_id and property_id are required'
            }), 400
        
        context_manager.update_property_view(user_id, property_id, property_data)
        
        # Get updated predictions after viewing
        predictions = context_manager.predict_next_questions(user_id)
        
        return jsonify({
            'success': True,
            'message': 'Property view tracked',
            'predicted_questions': predictions
        })
        
    except Exception as e:
        logger.error(f"Track property view error: {str(e)}", exc_info=True)
        return jsonify({
            'success': False,
            'error': str(e)
        }), 500


@context_chat_api.route('/api/chat/predictions/<user_id>', methods=['GET'])
def get_predictions(user_id: str):
    """
    Get predicted next questions for user
    """
    try:
        predictions = context_manager.predict_next_questions(user_id)
        summary = context_manager.generate_conversation_summary(user_id)
        
        return jsonify({
            'success': True,
            'predictions': predictions,
            'summary': summary
        })
        
    except Exception as e:
        logger.error(f"Get predictions error: {str(e)}", exc_info=True)
        return jsonify({
            'success': False,
            'error': str(e)
        }), 500


@context_chat_api.route('/api/chat/property-insights', methods=['POST'])
def generate_property_insights():
    """
    Generate AI insights for a specific property on demand
    
    Request:
    {
        "mls_number": "E12628742",
        "property_data": {...}  # Optional - if not provided, will fetch from MLS
    }
    
    Response:
    {
        "success": true,
        "mls_number": "E12628742",
        "quick_insights": {...},
        "sources": [...],
        "standardized_property": {...}
    }
    """
    try:
        data = request.json
        mls_number = data.get('mls_number')
        property_data = data.get('property_data')
        
        if not mls_number:
            return jsonify({
                'success': False,
                'error': 'mls_number is required'
            }), 400
        
        logger.info(f"Generating on-demand insights for MLS: {mls_number}")
        
        # Use provided property data or fetch it
        if property_data:
            standardized_prop = standardize_property_data(property_data)
        else:
            # You would need to implement a function to fetch property by MLS
            # For now, return error if no property data provided
            return jsonify({
                'success': False,
                'error': 'property_data is required when not cached'
            }), 400
        
        # Generate AI insights
        try:
            insights_data = generate_quick_ai_insights(standardized_prop, mls_number)
            
            # Log the complete data structure for debugging
            logger.info(f"Complete insights data structure for {mls_number}: {insights_data}")
            
            # Ensure walkability value is properly formatted for frontend
            insights = insights_data.get('insights', {})
            if 'neighborhood' in insights and 'walkability' in insights['neighborhood']:
                walkability = insights['neighborhood']['walkability']
                # Ensure it's a number, not string, and provide multiple format options
                if isinstance(walkability, (int, float)) and walkability > 0:
                    insights['neighborhood']['walkability_score'] = f"{walkability}%"
                    insights['neighborhood']['walkability_value'] = int(walkability)
                    insights['neighborhood']['walkability_display'] = f"{int(walkability)}%"
                    insights['neighborhood']['walkability_text'] = f"Walkability: {int(walkability)}%"
                else:
                    # Fallback if walkability is missing or invalid
                    insights['neighborhood']['walkability'] = 75  # Default for Toronto
                    insights['neighborhood']['walkability_score'] = "75%"
                    insights['neighborhood']['walkability_value'] = 75
                    insights['neighborhood']['walkability_display'] = "75%"
                    insights['neighborhood']['walkability_text'] = "Walkability: 75%"
            
            return jsonify({
                'success': True,
                'mls_number': mls_number,
                'quick_insights': insights,  # Use processed insights
                'sources': insights_data.get('sources', []),
                'standardized_property': standardized_prop,
                'debug_info': {
                    'walkability_raw': insights.get('neighborhood', {}).get('walkability'),
                    'safety_score': insights.get('neighborhood', {}).get('safety_score'),
                    'total_sources': len(insights_data.get('sources', [])),
                    'has_pros_cons': 'pros' in insights and 'cons' in insights
                }
            })
            
        except Exception as insight_error:
            logger.error(f"Failed to generate insights for MLS {mls_number}: {insight_error}")
            return jsonify({
                'success': False,
                'error': f'Failed to generate insights: {str(insight_error)}'
            }), 500
        
    except Exception as e:
        logger.error(f"Property insights error: {str(e)}", exc_info=True)
        return jsonify({
            'success': False,
            'error': str(e)
        }), 500


@context_chat_api.route('/api/chat/comparison/<user_id>', methods=['POST'])
def add_to_comparison(user_id: str):
    """
    Add property to comparison list
    
    Request:
    {
        "property_id": "prop123"
    }
    """
    try:
        data = request.json
        property_id = data.get('property_id')
        
        if not property_id:
            return jsonify({
                'success': False,
                'error': 'property_id is required'
            }), 400
        
        context_manager.add_to_comparison(user_id, property_id)
        
        session = context_manager.get_or_create_session(user_id)
        
        return jsonify({
            'success': True,
            'message': 'Added to comparison',
            'comparison_list': session['current_context']['comparison_list']
        })
        
    except Exception as e:
        logger.error(f"Add to comparison error: {str(e)}", exc_info=True)
        return jsonify({
            'success': False,
            'error': str(e)
        }), 500


# Helper functions

def _detect_intent(message: str) -> str:
    """Detect user intent from message"""
    message_lower = message.lower()
    
    # Search intent
    if any(word in message_lower for word in ['show', 'find', 'search', 'looking for']):
        return 'search'
    
    # Question intent
    if message_lower.startswith(('what', 'how', 'why', 'when', 'where', 'who', 'can')):
        return 'question'
    
    # Comparison intent
    if any(word in message_lower for word in ['compare', 'difference', 'vs', 'versus']):
        return 'comparison'
    
    # Valuation intent
    if any(word in message_lower for word in ['worth', 'value', 'price', 'cost']):
        return 'valuation'
    
    # Feedback intent
    if any(word in message_lower for word in ['thanks', 'thank you', 'great', 'perfect']):
        return 'feedback'
    
    return 'general'


def _build_contextual_prompt(message: str, context: Dict) -> str:
    """Build AI prompt with conversation context"""
    
    prompt_parts = []
    
    # Add context summary
    if context['summary']:
        prompt_parts.append(f"Context about this user: {context['summary']}")
    
    # Add recent conversation
    if context['recent_conversation']:
        prompt_parts.append(f"\nRecent conversation:\n{context['recent_conversation']}")
    
    # Add current question
    prompt_parts.append(f"\nUser's current message: {message}")
    
    # Add instructions
    prompt_parts.append(
        "\nRespond naturally and helpfully, building on what you know about the user. "
        "Be conversational and personalized. If you have relevant information from their "
        "preferences or history, use it to make better suggestions."
    )
    
    return '\n'.join(prompt_parts)


def _search_properties_from_context(context: Dict, message: str) -> Optional[Dict]:
    """
    Search for actual properties using context preferences
    Returns property listings from Repliers API
    """
    try:
        # Import the search function from voice_assistant_clean
        from voice_assistant_clean import search_repliers_properties
        
        preferences = context.get('preferences', {})
        locations = preferences.get('locations', [])
        property_types = preferences.get('property_types', [])
        price_ranges = preferences.get('price_ranges', [])
        bedrooms_list = preferences.get('bedrooms_ranges', [])  # Changed from 'bedrooms' to 'bedrooms_ranges'
        bathrooms_list = preferences.get('bathrooms', [])
        
        # Extract search parameters from CURRENT MESSAGE first (overrides stored context)
        import re
        message_lower = message.lower()
        
        # Extract location from current message (prioritize over stored context)
        location = None
        canadian_cities = [
            'toronto', 'mississauga', 'brampton', 'markham', 'vaughan', 'richmond hill',
            'oakville', 'burlington', 'milton', 'ajax', 'pickering', 'whitby', 'oshawa',
            'newmarket', 'aurora', 'king city', 'stouffville', 'caledon', 'georgetown',
            'vancouver', 'surrey', 'burnaby', 'richmond', 'coquitlam', 'langley',
            'montreal', 'laval', 'longueuil', 'calgary', 'edmonton', 'ottawa', 'gatineau',
            'winnipeg', 'quebec city', 'hamilton', 'kitchener', 'london', 'victoria',
            'halifax', 'windsor', 'saskatoon', 'regina', 'barrie', 'kelowna', 'abbotsford'
        ]
        
        for city in canadian_cities:
            if city in message_lower:
                location = city.title()
                logger.info(f"📍 Extracted location from message: {location}")
                break
        
        # Track if this is a new location (fresh search) or refinement
        is_new_location = location is not None and locations and location != locations[0]
        is_fresh_search = is_new_location  # If new location specified, treat as fresh search
        
        # If no location in message, use stored context
        if not location and locations:
            location = locations[0]
            logger.info(f"📍 Using stored location from context: {location}")
        
        # Extract property type from current message (prioritize over stored context)
        property_type = None
        property_type_keywords = {
            'condo': ['condo', 'condominium', 'apartment'],
            'townhouse': ['townhouse', 'townhome', 'town house'],
            'detached': ['detached', 'single family', 'house'],
            'semi-detached': ['semi-detached', 'semi detached'],
            'duplex': ['duplex'],
            'triplex': ['triplex']
        }
        
        for ptype, keywords in property_type_keywords.items():
            if any(keyword in message_lower for keyword in keywords):
                property_type = ptype
                logger.info(f"🏠 Extracted property type from message: {property_type}")
                break
        
        # If no type in message, only use stored context if not a fresh search
        if not property_type and property_types and not is_fresh_search:
            property_type = property_types[0]
            logger.info(f"🏠 Using stored property type from context: {property_type}")
        elif not property_type and is_fresh_search:
            logger.info(f"🏠 Fresh search detected - not using stored property type")
        
        # Extract bedrooms from current message
        bedrooms = None
        bedroom_patterns = [
            r'(\d+)\s*(?:bed|bedroom)',  # "3 bedroom", "2 bed"
            r'(\d+)br',  # "3br"
            r'(\d+)\s*\+\s*(?:bed|bedroom)'  # "3+ bedroom"
        ]
        for pattern in bedroom_patterns:
            match = re.search(pattern, message_lower)
            if match:
                bedrooms = int(match.group(1))
                logger.info(f"🛏️ Extracted bedrooms from message: {bedrooms}")
                break
        
        # If no bedrooms in message, only use stored context if not a fresh search
        if bedrooms is None and bedrooms_list and not is_fresh_search:
            bedrooms = bedrooms_list[0]
            logger.info(f"🛏️ Using stored bedrooms from context: {bedrooms}")
        elif bedrooms is None and is_fresh_search:
            logger.info(f"🛏️ Fresh search - not using stored bedrooms")
        
        # Extract bathrooms from current message
        bathrooms = None
        bathroom_patterns = [
            r'(\d+)\s*(?:bath|bathroom)',  # "2 bathroom", "1 bath"
            r'(\d+)ba'  # "2ba"
        ]
        for pattern in bathroom_patterns:
            match = re.search(pattern, message_lower)
            if match:
                bathrooms = int(match.group(1))
                logger.info(f"🚿 Extracted bathrooms from message: {bathrooms}")
                break
        
        # If no bathrooms in message, only use stored context if not a fresh search
        if bathrooms is None and bathrooms_list and not is_fresh_search:
            bathrooms = bathrooms_list[0]
            logger.info(f"🚿 Using stored bathrooms from context: {bathrooms}")
        elif bathrooms is None and is_fresh_search:
            logger.info(f"🚿 Fresh search - not using stored bathrooms")
        
        # Extract price from CURRENT MESSAGE first (overrides stored context)
        max_price = None
        
        # Check current message for price mentions like "$1 million", "1M", "$800k", "800000"
        price_patterns = [
            r'\$?\s*(\d+(?:\.\d+)?)\s*million',  # "$1 million", "1.5 million"
            r'\$?\s*(\d+(?:\.\d+)?)\s*m\b',       # "$1M", "1.5m"
            r'\$?\s*(\d+(?:\.\d+)?)\s*k\b',       # "$800k", "800K"
            r'under\s*\$?\s*(\d+(?:\.\d+)?)\s*(?:million|m)',  # "under $1 million"
            r'under\s*\$?\s*(\d+(?:\.\d+)?)\s*(?:thousand|k)',  # "under $800k"
            r'\$\s*(\d{6,})',  # "$800000", "$1000000"
        ]
        
        for pattern in price_patterns:
            matches = re.search(pattern, message_lower)
            if matches:
                value = float(matches.group(1))
                # Determine multiplier based on pattern
                if 'million' in pattern or r'\s*m\b' in pattern:
                    max_price = int(value * 1000000)
                elif 'thousand' in pattern or r'\s*k\b' in pattern:
                    max_price = int(value * 1000)
                else:  # Raw number
                    max_price = int(value)
                logger.info(f"💰 Extracted price from message: ${max_price:,}")
                break
        
        # If no price in current message, check if this is a refinement or new search
        if max_price is None:
            # Check if this looks like a refinement (using stored context) or a fresh search
            refinement_keywords = ['what about', 'how about', 'show me more', 'any other', 'also show', 'what if']
            is_refinement = any(keyword in message_lower for keyword in refinement_keywords)
            
            # Only use stored price if:
            # 1. NOT a fresh search (new location specified), AND
            # 2. Either: this is a refinement query OR location matches stored
            stored_location_match = not location or (locations and location == locations[0])
            
            if not is_fresh_search and (is_refinement or stored_location_match) and price_ranges:
                price_range = price_ranges[0]
                logger.info(f"📊 Using stored price_range for refinement: {price_range}")
                
                if isinstance(price_range, dict):
                    max_price = price_range.get('max')
                    # Sanity check - if price is too high, it might be in wrong format
                    if max_price and max_price > 100000000:  # Over 100 million seems wrong
                        logger.warning(f"⚠️ Price {max_price} seems too high, dividing by 1000")
                        max_price = int(max_price / 1000)
                elif isinstance(price_range, str):
                    # Try to extract number from string like "under 600k" or "$800K"
                    numbers = re.findall(r'(\d+(?:\.\d+)?)\s*([km])?', price_range.lower())
                    if numbers:
                        value, unit = numbers[0]
                        value = float(value)
                        if unit == 'k':
                            max_price = int(value * 1000)
                        elif unit == 'm':
                            max_price = int(value * 1000000)
                        else:
                            max_price = int(value)
            else:
                logger.info(f"🆕 New search detected - not using stored price (is_refinement={is_refinement}, location_match={stored_location_match})")
        
        logger.info(f"🔍 Searching properties: location={location}, type={property_type}, bedrooms={bedrooms}, max_price={max_price}")
        
        # Call the property search API
        result = search_repliers_properties(
            location=location,
            property_type=property_type,
            max_price=max_price,
            bedrooms=bedrooms,
            bathrooms=bathrooms,
            limit=6
        )
        
        if result.get('success') and result.get('properties'):
            logger.info(f"✅ Found {len(result['properties'])} properties")
            # Add actual search parameters to result for response generation
            result['search_params'] = {
                'location': location,
                'property_type': property_type,
                'bedrooms': bedrooms,
                'bathrooms': bathrooms,
                'max_price': max_price
            }
            return result
        
        logger.warning(f"⚠️ No properties found: {result.get('message', 'Unknown error')}")
        # Still return search params even if no results
        return {
            'success': False,
            'properties': [],
            'search_params': {
                'location': location,
                'property_type': property_type,
                'bedrooms': bedrooms,
                'bathrooms': bathrooms,
                'max_price': max_price
            }
        }
        
    except ImportError as e:
        logger.error(f"❌ Cannot import search function: {e}")
        return None
    except Exception as e:
        logger.error(f"❌ Property search failed: {e}")
        return None


def _generate_property_search_response(context: Dict, message: str) -> str:
    """Generate intelligent property search response using context preferences"""
    
    preferences = context.get('preferences', {})
    locations = preferences.get('locations', [])
    property_types = preferences.get('property_types', [])
    price_ranges = preferences.get('price_ranges', [])
    
    response_parts = []
    
    # Build contextual search message
    if locations:
        location_str = ', '.join(locations[:2])
        response_parts.append(f"I can help you find properties in {location_str}")
    else:
        response_parts.append("I can help you search for properties")
    
    # Add property type if available
    if property_types:
        type_str = ', '.join(property_types[:2])
        response_parts.append(f"looking for {type_str}")
    
    # Add price range if available
    if price_ranges:
        price_str = price_ranges[0]
        response_parts.append(f"in the {price_str} range")
    
    # Combine into natural sentence
    base_response = ' '.join(response_parts)
    
    return f"{base_response}. Let me search for available properties that match your criteria!"


def _generate_fallback_response(message: str, context: Dict) -> str:
    """Generate context-aware fallback response when AI service unavailable"""
    
    message_lower = message.lower()
    preferences = context.get('preferences', {})
    locations = preferences.get('locations', [])
    property_types = preferences.get('property_types', [])
    price_ranges = preferences.get('price_ranges', [])
    
    # Search responses with context
    if any(word in message_lower for word in ['show', 'find', 'search', 'properties']):
        if locations:
            location_str = ' and '.join(locations[:2])
            if property_types:
                type_str = ' or '.join(property_types[:2])
                return f"I can help you find {type_str} in {location_str}! Let me pull up matching properties for you."
            return f"Looking at properties in {location_str}! I'll search for options that match your preferences."
        return "I can help you search for properties! Tell me which area interests you and I'll find matching listings."
    
    # Question responses with context
    if message_lower.startswith(('what', 'how', 'why', 'when', 'where')):
        if locations:
            location_str = locations[0]
            return f"Great question about the {location_str} area! I'd be happy to provide information. Could you be more specific?"
        return "That's a great question! I'd be happy to help you with that. What specific information are you looking for?"
    
    # Comparison responses
    if 'compare' in message_lower:
        return (
            "I can help you compare properties! Add properties to your comparison list "
            "and I'll highlight the key differences to help you make the best decision."
        )
    
    # Location-aware default response
    if locations:
        location_str = ', '.join(locations[:2])
        context_parts = [f"properties in {location_str}"]
        
        if property_types:
            context_parts.append(f"focusing on {', '.join(property_types[:2])}")
        
        if price_ranges:
            # Format price range nicely
            price_range = price_ranges[0]
            if isinstance(price_range, dict):
                max_price = price_range.get('max', 0)
                if max_price > 0:
                    price_str = f"under ${max_price/1000000:.1f}M" if max_price >= 1000000 else f"under ${max_price/1000:.0f}k"
                    context_parts.append(f"{price_str}")
            else:
                context_parts.append(f"in the {price_range} range")
        
        context_str = ' '.join(context_parts)
        return f"I'm here to help you explore {context_str}. What would you like to know?"
    
    return (
        "I'm here to help you find the perfect property! "
        "Tell me what you're looking for and I'll guide you through the search."
    )


def _get_suggested_actions(session: Dict) -> List[str]:
    """Get contextual action buttons based on session context"""
    actions = []
    
    try:
        # If they have search results
        if session.get('current_context', {}).get('last_search_results'):
            actions.append('View More Properties')
            actions.append('Refine Search')
        
        # If they're viewing a property
        if session.get('current_context', {}).get('currently_viewing_property'):
            actions.append('Add to Comparison')
            actions.append('Get Property Report')
            actions.append('Schedule Viewing')
        
        # If highly engaged
        if session.get('behavioral_signals', {}).get('engagement_level', 0) > 7:
            actions.append('Connect with Agent')
            actions.append('Get Pre-Approved')
        
        # If they have comparison list
        comparison_list = session.get('current_context', {}).get('comparison_list', [])
        if len(comparison_list) > 1:
            actions.append('Compare Properties')
        
        # If investor
        if session.get('preferences', {}).get('investor'):
            actions.append('Calculate ROI')
            actions.append('See Rental Rates')
        
        # If first-time buyer
        if session.get('preferences', {}).get('first_time_buyer'):
            actions.append('Learn About Buying Process')
            actions.append('Calculate Affordability')
        
        # Default suggestions if no specific actions found
        if not actions:
            actions.extend(['New Search', 'Save Search', 'Get Help', 'View Saved Properties'])
        
    except Exception as e:
        logger.error(f"Error generating suggested actions: {e}")
        # Fallback to basic actions
        actions = ['New Search', 'Save Search']
    
    return actions[:4]  # Return top 4 actions


# Export blueprint
__all__ = ['context_chat_api']
