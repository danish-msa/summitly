"""
Voice Assistant with Repliers API Integration
This file shows how to integrate Repliers services into your voice assistant
"""
from flask import Flask, request, jsonify
from flask_cors import CORS
import logging

# Import Repliers services
from repliers_config import config
from listings_service import listings_service
from nlp_service import nlp_service
from saved_search_service import saved_search_service
from estimates_service import estimates_service
from chatbot_formatter import chatbot_formatter
from webhook_handler import webhook_handler

# Configure logging
logging.basicConfig(level=logging.INFO)
logger = logging.getLogger(__name__)

app = Flask(__name__)
CORS(app)

# Store user conversation contexts
user_contexts = {}


@app.route('/chat', methods=['POST'])
def chat():
    """
    Main chat endpoint - processes user queries and returns responses
    Integrates with Repliers NLP service for natural language property search
    """
    try:
        data = request.json
        user_query = data.get('message', '')
        user_id = data.get('user_id', 'default_user')
        
        logger.info(f"User {user_id} query: {user_query}")
        
        # Check if query is property-related using NLP service
        nlp_result = nlp_service.process_query(
            prompt=user_query,
            user_id=user_id,
            execute_search=True
        )
        
        # Handle irrelevant queries
        if nlp_result.get('error') == 'irrelevant_prompt':
            return jsonify({
                'response': nlp_result['message'],
                'type': 'error'
            })
        
        # Format response based on results
        response_parts = []
        
        # Add NLP summary
        if nlp_result.get('summary'):
            response_parts.append(chatbot_formatter.format_nlp_summary(nlp_result))
        
        # Add search results
        if nlp_result.get('results'):
            formatted_results = chatbot_formatter.format_search_results(
                nlp_result['results'],
                max_listings=5
            )
            response_parts.append(formatted_results)
        
        return jsonify({
            'response': '\n\n'.join(response_parts),
            'type': 'property_search',
            'results_count': nlp_result.get('results_count', 0),
            'nlp_id': nlp_result.get('nlp_id')
        })
    
    except Exception as e:
        logger.error(f"Error processing chat: {str(e)}")
        error_message = chatbot_formatter.format_error(e, user_friendly=True)
        return jsonify({
            'response': error_message,
            'type': 'error'
        }), 500


@app.route('/listing/<listing_id>', methods=['GET'])
def get_listing_details(listing_id):
    """
    Get detailed information about a specific property
    """
    try:
        logger.info(f"Fetching details for listing: {listing_id}")
        
        # Get listing details from Repliers
        listing = listings_service.get_listing_details(
            listing_id=listing_id,
            include_address_history=True
        )
        
        # Format for chatbot display
        formatted = chatbot_formatter.format_property_details(listing)
        
        # Generate quick reply buttons
        quick_replies = chatbot_formatter.format_quick_replies(listing)
        
        return jsonify({
            'response': formatted,
            'type': 'property_details',
            'listing': listing,
            'quick_replies': quick_replies
        })
    
    except Exception as e:
        logger.error(f"Error fetching listing: {str(e)}")
        error_message = chatbot_formatter.format_error(e, user_friendly=True)
        return jsonify({
            'response': error_message,
            'type': 'error'
        }), 404


@app.route('/listing/<listing_id>/similar', methods=['GET'])
def get_similar_listings(listing_id):
    """
    Find similar properties based on a reference listing
    """
    try:
        logger.info(f"Finding similar listings for: {listing_id}")
        
        similar = listings_service.find_similar_listings(
            listing_id=listing_id,
            limit=10
        )
        
        formatted = chatbot_formatter.format_similar_listings(similar)
        
        return jsonify({
            'response': formatted,
            'type': 'similar_listings',
            'count': len(similar.get('listings', []))
        })
    
    except Exception as e:
        logger.error(f"Error finding similar listings: {str(e)}")
        error_message = chatbot_formatter.format_error(e, user_friendly=True)
        return jsonify({
            'response': error_message,
            'type': 'error'
        }), 500


@app.route('/estimate', methods=['POST'])
def get_property_estimate():
    """
    Get AI-powered property valuation (RESTimate)
    """
    try:
        data = request.json
        address = data.get('address')
        listing_id = data.get('listing_id')
        
        if listing_id:
            logger.info(f"Getting estimate for listing: {listing_id}")
            estimate = estimates_service.get_estimate_by_listing(
                listing_id=listing_id,
                include_comparables=True
            )
        elif address:
            logger.info(f"Getting estimate for address: {address}")
            estimate = estimates_service.get_estimate_by_address(
                address=address,
                bedrooms=data.get('bedrooms'),
                bathrooms=data.get('bathrooms'),
                sqft=data.get('sqft'),
                include_comparables=True
            )
        else:
            return jsonify({
                'response': "Please provide either an address or listing ID",
                'type': 'error'
            }), 400
        
        # Format response
        formatted = estimates_service.format_estimate_response(estimate)
        
        return jsonify({
            'response': formatted,
            'type': 'property_estimate',
            'estimate': estimate
        })
    
    except Exception as e:
        logger.error(f"Error getting estimate: {str(e)}")
        error_message = chatbot_formatter.format_error(e, user_friendly=True)
        return jsonify({
            'response': error_message,
            'type': 'error'
        }), 500


@app.route('/saved-search', methods=['POST'])
def create_saved_search():
    """
    Create a saved search with alert preferences
    """
    try:
        data = request.json
        
        logger.info(f"Creating saved search for: {data.get('client_email')}")
        
        search = saved_search_service.create_saved_search(
            client_email=data.get('client_email'),
            client_name=data.get('client_name'),
            client_phone=data.get('client_phone'),
            search_name=data.get('search_name'),
            city=data.get('city'),
            neighborhood=data.get('neighborhood'),
            min_price=data.get('min_price'),
            max_price=data.get('max_price'),
            property_style=data.get('property_style'),
            min_bedrooms=data.get('min_bedrooms'),
            min_bathrooms=data.get('min_bathrooms'),
            alert_frequency=data.get('alert_frequency', 'instant'),
            alert_email=data.get('alert_email', True),
            alert_sms=data.get('alert_sms', False),
            alert_on_new=True,
            alert_on_price_change=True
        )
        
        # Format response
        formatted = chatbot_formatter.format_saved_search(search)
        
        return jsonify({
            'response': f"✅ Saved search created!\n\n{formatted}",
            'type': 'saved_search_created',
            'search': search
        })
    
    except Exception as e:
        logger.error(f"Error creating saved search: {str(e)}")
        error_message = chatbot_formatter.format_error(e, user_friendly=True)
        return jsonify({
            'response': error_message,
            'type': 'error'
        }), 500


@app.route('/saved-searches', methods=['GET'])
def get_saved_searches():
    """
    Get all saved searches for a client
    """
    try:
        client_email = request.args.get('client_email')
        
        if not client_email:
            return jsonify({
                'response': "Please provide client_email parameter",
                'type': 'error'
            }), 400
        
        logger.info(f"Fetching saved searches for: {client_email}")
        
        searches = saved_search_service.get_client_searches(client_email)
        
        if not searches:
            return jsonify({
                'response': "You don't have any saved searches yet. Create one to get instant alerts!",
                'type': 'no_results'
            })
        
        # Format each search
        formatted_searches = []
        for search in searches:
            formatted_searches.append(chatbot_formatter.format_saved_search(search))
        
        response = f"📋 **Your Saved Searches** ({len(searches)} total)\n\n"
        response += "\n\n".join(formatted_searches)
        
        return jsonify({
            'response': response,
            'type': 'saved_searches',
            'searches': searches
        })
    
    except Exception as e:
        logger.error(f"Error fetching saved searches: {str(e)}")
        error_message = chatbot_formatter.format_error(e, user_friendly=True)
        return jsonify({
            'response': error_message,
            'type': 'error'
        }), 500


@app.route('/address-history', methods=['POST'])
def get_address_history():
    """
    Get historical listing data for an address
    """
    try:
        data = request.json
        address = data.get('address')
        city = data.get('city')
        
        if not address:
            return jsonify({
                'response': "Please provide an address",
                'type': 'error'
            }), 400
        
        logger.info(f"Fetching history for: {address}")
        
        history = listings_service.get_address_history(
            address=address,
            city=city,
            state=data.get('state'),
            postal_code=data.get('postal_code')
        )
        
        # Format response
        history_items = history.get('history', [])
        
        if not history_items:
            return jsonify({
                'response': f"No historical data found for {address}",
                'type': 'no_results'
            })
        
        response = f"📜 **Address History for {address}**\n\n"
        
        for item in history_items[:10]:  # Show last 10 events
            date = item.get('date', 'N/A')
            event_type = item.get('type', 'N/A')
            price = item.get('price', {}).get('amount', 0)
            
            response += f"• {date}: {event_type}"
            if price:
                response += f" - ${price:,}"
            response += "\n"
        
        return jsonify({
            'response': response,
            'type': 'address_history',
            'history': history
        })
    
    except Exception as e:
        logger.error(f"Error fetching address history: {str(e)}")
        error_message = chatbot_formatter.format_error(e, user_friendly=True)
        return jsonify({
            'response': error_message,
            'type': 'error'
        }), 500


# Set up webhook endpoint
webhook_handler.create_flask_endpoint(app, path='/webhooks/repliers')

# Register webhook event handlers
def handle_new_listing(payload):
    """Handle new listing webhook events"""
    listing_data = payload.get('data', {})
    logger.info(f"New listing webhook: {listing_data.get('id')}")
    
    # TODO: Implement your business logic
    # - Check against saved searches
    # - Send notifications to matching clients
    # - Update your database
    # - Trigger alerts

def handle_price_change(payload):
    """Handle price change webhook events"""
    listing_data = payload.get('data', {})
    changes = payload.get('changes', {})
    logger.info(f"Price change webhook: {listing_data.get('id')}")
    
    # TODO: Implement your business logic
    # - Notify clients watching this property
    # - Update saved search matches
    # - Send price drop alerts

# Register handlers
webhook_handler.register_event_handler('listing.created', handle_new_listing)
webhook_handler.register_event_handler('listing.price_changed', handle_price_change)


@app.route('/health', methods=['GET'])
def health_check():
    """Health check endpoint"""
    return jsonify({
        'status': 'healthy',
        'repliers_api': 'connected'
    })


if __name__ == '__main__':
    logger.info("🚀 Starting Voice Assistant with Repliers Integration...")
    logger.info(f"📡 Webhook endpoint: /webhooks/repliers")
    logger.info(f"💬 Chat endpoint: /chat")
    
    # Validate Repliers configuration
    validation = config.validate_config()
    if validation['valid']:
        logger.info("✅ Repliers API configuration valid")
    else:
        logger.error("❌ Configuration errors:")
        for error in validation['errors']:
            logger.error(f"  - {error}")
    
    if validation['warnings']:
        logger.warning("⚠️  Configuration warnings:")
        for warning in validation['warnings']:
            logger.warning(f"  - {warning}")
    
    # Start Flask server
    app.run(host='0.0.0.0', port=5000, debug=False)
