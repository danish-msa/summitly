#!/usr/bin/env python3
"""
Condo Assistant Flask API
Flask endpoints for condo property search and management
Integrates with voice_assistant_clean.py architecture

ENHANCED FEATURES:
✅ Session management with fresh start on page refresh
✅ Seamless location switching (no confirmation prompts)
✅ AI-powered chatbot endpoint
✅ Smart search ordering (exact → nearby → convertible)
"""

from flask import Flask, request, jsonify, Blueprint
from flask_cors import CORS
import logging
import os
import sys
import uuid
import json
import hashlib
from datetime import datetime, timedelta
from typing import Dict, List, Optional, Any, Tuple

# Add parent directory to path
sys.path.insert(0, os.path.abspath(os.path.join(os.path.dirname(__file__), '..')))

from app.condo_assistant import (
    CONDO_MLS_FIELDS,
    standardize_condo_property,
    search_condo_properties,
    extract_condo_criteria_with_ai,
    filter_by_floor_level,
    filter_by_pets,
    filter_by_amenities
)

# Configure logging
logging.basicConfig(level=logging.INFO)
logger = logging.getLogger(__name__)

# ==================== SESSION MANAGEMENT ====================

class CondoConversationContext:
    """
    Session management for condo chatbot with:
    - Fresh start on page refresh (no cache)
    - Seamless location switching (no confirmation prompts)
    - Smart search result ordering
    """
    
    def __init__(self):
        self.sessions: Dict[str, Dict] = {}
    
    def get_or_create_session(self, session_id: str, force_new: bool = False) -> Dict:
        """
        Get existing session or create new one.
        
        Args:
            session_id: Unique session identifier
            force_new: If True, always create fresh session (for page refresh)
        """
        if force_new or session_id not in self.sessions:
            self.sessions[session_id] = {
                "session_id": session_id,
                "created_at": datetime.now().isoformat(),
                "last_active": datetime.now().isoformat(),
                "location": None,
                "criteria": {},
                "search_results": [],
                "chat_history": [],
                "search_count": 0
            }
            logger.info(f"🆕 New condo session created: {session_id[:8]}...")
        else:
            self.sessions[session_id]["last_active"] = datetime.now().isoformat()
        
        return self.sessions[session_id]
    
    def update_session(self, session_id: str, updates: Dict) -> Dict:
        """Update session with new data, handling location changes seamlessly."""
        session = self.get_or_create_session(session_id)
        
        # Check for location change - switch seamlessly without prompts
        new_location = updates.get("location")
        old_location = session.get("location")
        
        if new_location and old_location and new_location.lower() != old_location.lower():
            logger.info(f"📍 Location switch: {old_location} → {new_location} (seamless)")
            # Clear previous results but keep chat history
            session["search_results"] = []
            session["criteria"] = {}
        
        # Apply updates
        for key, value in updates.items():
            if value is not None:
                session[key] = value
        
        return session
    
    def clear_session(self, session_id: str):
        """Clear a session completely."""
        if session_id in self.sessions:
            del self.sessions[session_id]
            logger.info(f"🗑️ Session cleared: {session_id[:8]}...")
    
    def add_to_history(self, session_id: str, role: str, content: str):
        """Add message to chat history."""
        session = self.get_or_create_session(session_id)
        session["chat_history"].append({
            "role": role,
            "content": content,
            "timestamp": datetime.now().isoformat()
        })


# Global session manager
session_manager = CondoConversationContext()

# Create Blueprint
condo_api = Blueprint('condo_api', __name__, url_prefix='/api/condo')

# ==================== CHAT ENDPOINT ====================

@condo_api.route('/chat', methods=['POST'])
def condo_chat():
    """
    AI-powered condo chatbot endpoint with session management.
    
    POST /api/condo/chat
    Body:
    {
        "message": "Show me 2 bedroom condos in Toronto with a gym",
        "session_id": "optional-session-id",
        "force_new": false  // Set true on page refresh to start fresh
    }
    
    Features:
    - Fresh session on page refresh (force_new=true)
    - Seamless location switching (no confirmation prompts)
    - Smart search ordering: exact matches → nearby → convertible
    """
    try:
        data = request.json or {}
        user_message = data.get("message", "").strip()
        session_id = data.get("session_id") or str(uuid.uuid4())
        force_new = data.get("force_new", False)
        
        if not user_message:
            return jsonify({
                "success": False,
                "error": "Message is required",
                "session_id": session_id
            }), 400
        
        logger.info(f"💬 Chat message: '{user_message[:50]}...' | session: {session_id[:8]}...")
        
        # Get or create session (force_new for page refresh)
        session = session_manager.get_or_create_session(session_id, force_new=force_new)
        
        # Add user message to history
        session_manager.add_to_history(session_id, "user", user_message)
        
        # Extract criteria from natural language using AI
        extracted_criteria = extract_condo_criteria_with_ai(user_message)
        logger.info(f"🤖 Extracted criteria: {extracted_criteria}")
        
        # Check for location in extracted criteria
        new_location = extracted_criteria.get("city") or extracted_criteria.get("location")
        
        # Update session with new criteria (handles location switching seamlessly)
        session = session_manager.update_session(session_id, {
            "location": new_location,
            "criteria": {**session.get("criteria", {}), **extracted_criteria}
        })
        
        # Determine search location
        search_location = new_location or session.get("location")
        
        if not search_location:
            response_text = "I'd love to help you find a condo! Which city would you like to search in? For example: Toronto, Vancouver, Ottawa, or Montreal."
            session_manager.add_to_history(session_id, "assistant", response_text)
            
            return jsonify({
                "success": True,
                "response": response_text,
                "properties": [],
                "total": 0,
                "suggestions": ["Toronto", "Vancouver", "Ottawa", "Montreal"],
                "session_id": session_id,
                "needs_location": True
            })
        
        # Build search criteria
        search_criteria = session.get("criteria", {})
        
        # Execute search
        result = search_condo_properties(
            city=search_location,
            bedrooms=search_criteria.get("bedrooms"),
            bathrooms=search_criteria.get("bathrooms"),
            min_price=search_criteria.get("min_price"),
            max_price=search_criteria.get("max_price"),
            min_sqft=search_criteria.get("min_sqft"),
            max_sqft=search_criteria.get("max_sqft"),
            floor_level_min=search_criteria.get("floor_level_min"),
            pets_permitted=search_criteria.get("pets_permitted"),
            amenities=search_criteria.get("amenities", []),
            listing_type=search_criteria.get("listing_type", "sale"),
            limit=50
        )
        
        properties = result.get("properties", [])
        total = result.get("total", 0)
        
        # Order results: exact matches first, then nearby, then convertible
        ordered_properties = order_search_results(
            properties=properties,
            target_location=search_location,
            criteria=search_criteria
        )
        
        # Store results in session
        session_manager.update_session(session_id, {
            "search_results": ordered_properties,
            "search_count": session.get("search_count", 0) + 1
        })
        
        # Build response
        if total > 0:
            criteria_parts = []
            if search_criteria.get("bedrooms"):
                criteria_parts.append(f"{search_criteria['bedrooms']} bedroom")
            if search_criteria.get("max_price"):
                criteria_parts.append(f"under ${search_criteria['max_price']:,}")
            if search_criteria.get("amenities"):
                criteria_parts.append(f"with {', '.join(search_criteria['amenities'])}")
            
            criteria_str = " ".join(criteria_parts) if criteria_parts else ""
            response_text = f"I found {total} {criteria_str} condos in {search_location}! Here are the best matches."
        else:
            response_text = f"I couldn't find condos matching your criteria in {search_location}. Would you like me to expand the search or adjust the filters?"
        
        session_manager.add_to_history(session_id, "assistant", response_text)
        
        # Generate suggestions
        suggestions = generate_suggestions(search_criteria, total, search_location)
        
        return jsonify({
            "success": True,
            "response": response_text,
            "properties": ordered_properties[:20],  # Return first 20
            "total": total,
            "suggestions": suggestions,
            "session_id": session_id,
            "criteria_used": search_criteria,
            "location": search_location
        })
    
    except Exception as e:
        logger.error(f"Chat error: {e}")
        import traceback
        traceback.print_exc()
        return jsonify({
            "success": False,
            "error": str(e),
            "properties": []
        }), 500


@condo_api.route('/reset', methods=['POST'])
def reset_session():
    """
    Reset/clear a session completely.
    
    POST /api/condo/reset
    Body:
    {
        "session_id": "session-id-to-reset"
    }
    """
    try:
        data = request.json or {}
        session_id = data.get("session_id")
        
        if session_id:
            session_manager.clear_session(session_id)
            return jsonify({
                "success": True,
                "message": "Session cleared successfully"
            })
        else:
            return jsonify({
                "success": False,
                "error": "session_id is required"
            }), 400
    
    except Exception as e:
        logger.error(f"Reset error: {e}")
        return jsonify({
            "success": False,
            "error": str(e)
        }), 500


@condo_api.route('/results', methods=['GET'])
def get_results():
    """
    Get cached search results for a session.
    
    GET /api/condo/results?session_id=xxx&page=1&limit=20
    """
    try:
        session_id = request.args.get("session_id")
        page = int(request.args.get("page", 1))
        limit = int(request.args.get("limit", 20))
        
        if not session_id:
            return jsonify({
                "success": False,
                "error": "session_id is required"
            }), 400
        
        session = session_manager.get_or_create_session(session_id)
        all_results = session.get("search_results", [])
        
        # Paginate
        start_idx = (page - 1) * limit
        end_idx = start_idx + limit
        page_results = all_results[start_idx:end_idx]
        
        return jsonify({
            "success": True,
            "properties": page_results,
            "total": len(all_results),
            "page": page,
            "limit": limit,
            "has_more": end_idx < len(all_results)
        })
    
    except Exception as e:
        logger.error(f"Results error: {e}")
        return jsonify({
            "success": False,
            "error": str(e)
        }), 500


# ==================== HELPER FUNCTIONS ====================

def order_search_results(properties: List[Dict], target_location: str, criteria: Dict) -> List[Dict]:
    """
    Order search results by relevance:
    1. Exact matches from target location
    2. Nearby locations (within 5km if available)
    3. Properties that can be converted/adapted
    4. Matches from other locations
    """
    if not properties:
        return []
    
    exact_matches = []
    nearby_matches = []
    convertible_matches = []
    other_matches = []
    
    target_lower = target_location.lower() if target_location else ""
    
    for prop in properties:
        # Get property location
        prop_city = ""
        if isinstance(prop.get("address"), dict):
            prop_city = prop["address"].get("city", "").lower()
        elif isinstance(prop.get("city"), str):
            prop_city = prop["city"].lower()
        
        # Check criteria match
        criteria_match_score = calculate_match_score(prop, criteria)
        prop["_match_score"] = criteria_match_score
        
        # Categorize by location and match quality
        if prop_city == target_lower:
            if criteria_match_score >= 80:
                exact_matches.append(prop)
            elif criteria_match_score >= 50:
                convertible_matches.append(prop)
            else:
                other_matches.append(prop)
        else:
            # Check if nearby (simplified - in reality would use geo distance)
            nearby_cities = get_nearby_cities(target_location)
            if prop_city in [c.lower() for c in nearby_cities]:
                nearby_matches.append(prop)
            else:
                other_matches.append(prop)
    
    # Sort each category by match score
    exact_matches.sort(key=lambda x: x.get("_match_score", 0), reverse=True)
    nearby_matches.sort(key=lambda x: x.get("_match_score", 0), reverse=True)
    convertible_matches.sort(key=lambda x: x.get("_match_score", 0), reverse=True)
    other_matches.sort(key=lambda x: x.get("_match_score", 0), reverse=True)
    
    # Combine in priority order
    ordered = exact_matches + nearby_matches + convertible_matches + other_matches
    
    logger.info(f"📊 Ordered results: {len(exact_matches)} exact, {len(nearby_matches)} nearby, {len(convertible_matches)} convertible, {len(other_matches)} other")
    
    return ordered


def calculate_match_score(property_data: Dict, criteria: Dict) -> int:
    """Calculate how well a property matches the search criteria (0-100)."""
    if not criteria:
        return 50  # Default score when no criteria
    
    score = 100
    penalties = 0
    
    # Check bedrooms
    if criteria.get("bedrooms"):
        prop_beds = property_data.get("bedrooms", 0)
        if prop_beds != criteria["bedrooms"]:
            penalties += 20
    
    # Check bathrooms
    if criteria.get("bathrooms"):
        prop_baths = property_data.get("bathrooms", 0)
        if prop_baths != criteria["bathrooms"]:
            penalties += 15
    
    # Check price range
    prop_price = property_data.get("listPrice") or property_data.get("price", 0)
    if isinstance(prop_price, str):
        prop_price = int(prop_price.replace("$", "").replace(",", "").strip() or 0)
    
    if criteria.get("max_price") and prop_price > criteria["max_price"]:
        over_budget = (prop_price - criteria["max_price"]) / criteria["max_price"]
        penalties += min(30, int(over_budget * 100))
    
    if criteria.get("min_price") and prop_price < criteria["min_price"]:
        penalties += 10
    
    # Check amenities
    if criteria.get("amenities"):
        prop_amenities = property_data.get("condoAmenities", []) or []
        if isinstance(prop_amenities, str):
            prop_amenities = [prop_amenities]
        prop_amenities_lower = [a.lower() for a in prop_amenities]
        
        for amenity in criteria["amenities"]:
            if amenity.lower() not in prop_amenities_lower:
                penalties += 5
    
    return max(0, score - penalties)


def get_nearby_cities(city: str) -> List[str]:
    """Get list of cities near the target city."""
    nearby_map = {
        "toronto": ["North York", "Scarborough", "Etobicoke", "Mississauga", "Markham", "Vaughan", "Richmond Hill"],
        "vancouver": ["Burnaby", "Richmond", "North Vancouver", "West Vancouver", "Surrey", "Coquitlam"],
        "ottawa": ["Gatineau", "Kanata", "Orleans", "Nepean"],
        "montreal": ["Laval", "Longueuil", "Brossard", "Saint-Laurent"],
        "calgary": ["Airdrie", "Cochrane", "Chestermere"],
        "edmonton": ["Sherwood Park", "St. Albert", "Spruce Grove"]
    }
    return nearby_map.get(city.lower(), [])


def generate_suggestions(criteria: Dict, result_count: int, location: str) -> List[str]:
    """Generate contextual suggestions based on search results."""
    suggestions = []
    
    if result_count == 0:
        suggestions.append("Try expanding the price range")
        suggestions.append("Search nearby areas")
        if criteria.get("bedrooms"):
            suggestions.append(f"Try {criteria['bedrooms'] - 1} or {criteria['bedrooms'] + 1} bedrooms")
    else:
        if not criteria.get("amenities"):
            suggestions.append("Add amenity filters (gym, pool, concierge)")
        if not criteria.get("max_price"):
            suggestions.append("Set a budget range")
        suggestions.append("Show me pet-friendly options")
        suggestions.append(f"What's available for rent in {location}?")
    
    return suggestions[:4]


# ==================== ENDPOINTS ====================

@condo_api.route('/search', methods=['POST'])
def condo_search():
    """
    Search for condo properties
    
    POST /api/condo/search
    Body:
    {
        "query": "2 bedroom condo in Toronto with gym" (optional),
        "city": "Toronto",
        "bedrooms": 2,
        "bathrooms": 2,
        "min_price": 400000,
        "max_price": 600000,
        "min_sqft": 700,
        "max_sqft": 1200,
        "floor_level_min": 10,
        "pets_permitted": true,
        "amenities": ["gym", "pool"],
        "limit": 20
    }
    """
    try:
        data = request.json or {}
        
        # Extract criteria from natural language query if provided
        query = data.get('query')
        if query:
            logger.info(f"Extracting criteria from query: {query}")
            extracted = extract_condo_criteria_with_ai(query)
            # Merge extracted with provided data (provided data takes precedence)
            data = {**extracted, **data}
        
        # Search parameters
        city = data.get('city')
        bedrooms = data.get('bedrooms')
        bathrooms = data.get('bathrooms')
        min_price = data.get('min_price')
        max_price = data.get('max_price')
        min_sqft = data.get('min_sqft')
        max_sqft = data.get('max_sqft')
        floor_level_min = data.get('floor_level_min')
        pets_permitted = data.get('pets_permitted')
        amenities = data.get('amenities', [])
        listing_type = data.get('listing_type', 'sale')
        limit = data.get('limit', 20)
        
        logger.info(f"Searching condos: city={city}, beds={bedrooms}, baths={bathrooms}, listing_type={listing_type}")
        
        # Search
        result = search_condo_properties(
            city=city,
            bedrooms=bedrooms,
            bathrooms=bathrooms,
            min_price=min_price,
            max_price=max_price,
            min_sqft=min_sqft,
            max_sqft=max_sqft,
            floor_level_min=floor_level_min,
            pets_permitted=pets_permitted,
            amenities=amenities,
            listing_type=listing_type,
            limit=limit
        )
        
        if result['success']:
            return jsonify({
                "success": True,
                "properties": result['properties'],
                "total": result['total'],
                "criteria": data,
                "message": f"Found {result['total']} condo properties"
            })
        else:
            return jsonify({
                "success": False,
                "error": result.get('error', 'Search failed'),
                "properties": []
            }), 400
    
    except Exception as e:
        logger.error(f"Search error: {e}")
        return jsonify({
            "success": False,
            "error": str(e),
            "properties": []
        }), 500


@condo_api.route('/fields', methods=['GET'])
def get_mls_fields():
    """
    Get all 60+ condo MLS field definitions
    
    GET /api/condo/fields
    """
    try:
        fields = {}
        for field_name, field_config in CONDO_MLS_FIELDS.items():
            fields[field_name] = {
                "description": field_config.get("description"),
                "type": field_config.get("type"),
                "required": field_config.get("required", False)
            }
        
        return jsonify({
            "success": True,
            "fields": fields,
            "total_fields": len(fields)
        })
    
    except Exception as e:
        logger.error(f"Error retrieving fields: {e}")
        return jsonify({
            "success": False,
            "error": str(e)
        }), 500


@condo_api.route('/extract-criteria', methods=['POST'])
def extract_criteria():
    """
    Extract search criteria from natural language query
    
    POST /api/condo/extract-criteria
    Body:
    {
        "query": "2 bedroom pet-friendly condo in Toronto with gym and pool"
    }
    """
    try:
        data = request.json or {}
        query = data.get('query')
        
        if not query:
            return jsonify({
                "success": False,
                "error": "Query is required"
            }), 400
        
        logger.info(f"Extracting criteria from: {query}")
        
        criteria = extract_condo_criteria_with_ai(query)
        
        return jsonify({
            "success": True,
            "query": query,
            "criteria": criteria,
            "message": f"Extracted {len(criteria)} criteria"
        })
    
    except Exception as e:
        logger.error(f"Extraction error: {e}")
        return jsonify({
            "success": False,
            "error": str(e)
        }), 500


@condo_api.route('/standardize', methods=['POST'])
def standardize_property():
    """
    Standardize a condo property's data
    
    POST /api/condo/standardize
    Body:
    {
        "property": { ... raw property data ... }
    }
    """
    try:
        data = request.json or {}
        property_data = data.get('property')
        
        if not property_data:
            return jsonify({
                "success": False,
                "error": "Property data is required"
            }), 400
        
        standardized = standardize_condo_property(property_data)
        
        return jsonify({
            "success": True,
            "property": standardized,
            "fields_extracted": len([k for k, v in standardized.items() if v is not None])
        })
    
    except Exception as e:
        logger.error(f"Standardization error: {e}")
        return jsonify({
            "success": False,
            "error": str(e)
        }), 500


@condo_api.route('/health', methods=['GET'])
def health_check():
    """
    Health check endpoint
    
    GET /api/condo/health
    """
    return jsonify({
        "success": True,
        "service": "Condo Assistant API",
        "status": "healthy",
        "total_mls_fields": len(CONDO_MLS_FIELDS)
    })


@condo_api.route('/schools/<mls_number>', methods=['GET'])
def get_schools_for_property(mls_number):
    """
    Fetch schools for a condo property.
    
    Query params:
        - mls_number: Property MLS (required)
        - city: Property city (optional)
        - limit: Max schools (default: 5)
    
    Returns: School data for the property location
    """
    try:
        limit = request.args.get('limit', 5, type=int)
        city = request.args.get('city', '')
        
        # Validate MLS number
        if not mls_number or mls_number == 'N/A':
            return jsonify({
                'success': False,
                'error': 'Invalid MLS number',
                'mls_number': mls_number
            }), 400
        
        print(f"🏫 [CONDO SCHOOLS] Fetching schools for MLS: {mls_number}")
        
        # Fetch property data
        property_data = {}
        try:
            from services.listings_service import listings_service
            
            prop_response = listings_service.get_listing_details(mls_number)
            if prop_response:
                property_data = prop_response if isinstance(prop_response, dict) else {}
                print(f"✅ [CONDO SCHOOLS] Got property data for {mls_number}")
        except Exception as e:
            print(f"⚠️ [CONDO SCHOOLS] Could not fetch property data: {e}")
        
        # Import and use schools service
        try:
            from services.schools_service import schools_service
            
            # Get schools data
            schools_result = schools_service.get_nearby_schools_for_property(
                mls_number=mls_number,
                property_data=property_data,
                limit=limit
            )
            
            if schools_result.get('success'):
                response_data = {
                    'success': True,
                    'mls_number': mls_number,
                    'city': schools_result.get('city'),
                    'schools': schools_result.get('schools', []),
                    'count': len(schools_result.get('schools', [])),
                    'fetch_timestamp': schools_result.get('fetch_timestamp')
                }
                
                # Add fallback disclosure if data came from public registry
                if schools_result.get('is_fallback'):
                    response_data['data_source'] = schools_result.get('data_source')
                    response_data['note'] = "School data from Ontario Education Registry (public source)"
                
                print(f"✅ [CONDO SCHOOLS] Found {len(schools_result.get('schools', []))} schools for MLS {mls_number}")
                return jsonify(response_data)
            else:
                return jsonify({
                    'success': False,
                    'error': schools_result.get('error', 'Unknown error'),
                    'mls_number': mls_number,
                    'schools': []
                }), 500
        
        except ImportError as e:
            print(f"❌ [CONDO SCHOOLS] Schools service not available: {e}")
            return jsonify({
                'success': False,
                'error': 'Schools service not available',
                'mls_number': mls_number,
                'schools': []
            }), 503
    
    except Exception as e:
        print(f"❌ [CONDO SCHOOLS] Error: {e}")
        import traceback
        traceback.print_exc()
        return jsonify({
            'success': False,
            'error': str(e),
            'mls_number': mls_number,
            'schools': []
        }), 500


@condo_api.route('/highlights/<mls_number>', methods=['GET'])
def get_highlights_for_property(mls_number):
    """
    Fetch nearby highlights (parks, shopping, transit, dining) for a condo property.
    
    Query params:
        - mls_number: Property MLS (required)
        - city: Property city (optional)
        - neighborhood: Property neighborhood (optional)
    
    Returns: Curated nearby amenities data
    """
    try:
        city = request.args.get('city', '')
        neighborhood = request.args.get('neighborhood', '')
        
        # Validate MLS number
        if not mls_number or mls_number == 'N/A':
            return jsonify({
                'success': False,
                'error': 'Invalid MLS number',
                'mls_number': mls_number
            }), 400
        
        print(f"🌟 [CONDO HIGHLIGHTS] Fetching highlights for MLS: {mls_number}")
        
        # Fetch property data to get location details
        property_data = {}
        try:
            from services.listings_service import listings_service
            
            prop_response = listings_service.get_listing_details(mls_number)
            if prop_response:
                property_data = prop_response if isinstance(prop_response, dict) else {}
                
                # Extract city and neighborhood if not provided
                if not city and property_data.get('City'):
                    city = property_data.get('City')
                if not neighborhood and property_data.get('Neighborhood'):
                    neighborhood = property_data.get('Neighborhood')
        except Exception as e:
            print(f"⚠️ [CONDO HIGHLIGHTS] Could not fetch property data: {e}")
        
        # Import and use nearby highlights service
        try:
            from services.nearby_highlights_service import get_nearby_highlights
            
            # Get highlights data
            highlights_result = get_nearby_highlights(
                city=city or 'Toronto',
                neighborhood=neighborhood,
                property_data=property_data
            )
            
            if highlights_result.get('success'):
                response_data = {
                    'success': True,
                    'mls_number': mls_number,
                    'city': highlights_result.get('city'),
                    'neighborhood': highlights_result.get('neighborhood'),
                    'highlights': highlights_result.get('highlights', {}),
                    'summary': highlights_result.get('summary', ''),
                    'timestamp': highlights_result.get('timestamp')
                }
                
                if highlights_result.get('is_fallback'):
                    response_data['data_source'] = highlights_result.get('data_source')
                    response_data['note'] = highlights_result.get('note', '')
                
                total_highlights = sum(len(v) for v in highlights_result.get('highlights', {}).values())
                print(f"✅ [CONDO HIGHLIGHTS] Returning {total_highlights} highlights for MLS {mls_number}")
                return jsonify(response_data)
            else:
                return jsonify({
                    'success': False,
                    'error': highlights_result.get('error', 'Unknown error'),
                    'mls_number': mls_number,
                    'highlights': {}
                }), 500
        
        except ImportError as e:
            print(f"❌ [CONDO HIGHLIGHTS] Highlights service not available: {e}")
            return jsonify({
                'success': False,
                'error': 'Highlights service not available',
                'mls_number': mls_number,
                'highlights': {}
            }), 503
    
    except Exception as e:
        print(f"❌ [CONDO HIGHLIGHTS] Error: {e}")
        import traceback
        traceback.print_exc()
        return jsonify({
            'success': False,
            'error': str(e),
            'mls_number': mls_number,
            'highlights': {}
        }), 500


# ==================== STANDALONE APP (for testing) ====================

if __name__ == '__main__':
    app = Flask(__name__)
    CORS(app)
    
    # Register blueprint
    app.register_blueprint(condo_api)
    
    @app.route('/')
    def index():
        return jsonify({
            "service": "Condo Assistant API",
            "version": "1.0.0",
            "endpoints": [
                "POST /api/condo/search - Search condo properties",
                "GET /api/condo/fields - Get MLS field definitions",
                "POST /api/condo/extract-criteria - Extract criteria from query",
                "POST /api/condo/standardize - Standardize property data",
                "GET /api/condo/health - Health check"
            ]
        })
    
    print("\n" + "="*80)
    print("CONDO ASSISTANT API")
    print("="*80)
    print("\nStarting server on http://localhost:5051")
    print("\nEndpoints:")
    print("  POST /api/condo/search")
    print("  GET  /api/condo/fields")
    print("  POST /api/condo/extract-criteria")
    print("  POST /api/condo/standardize")
    print("  GET  /api/condo/health")
    print("\n" + "="*80 + "\n")
    
    app.run(host='0.0.0.0', port=5051, debug=True)
