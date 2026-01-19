#!/usr/bin/env python3
"""
Condo Assistant Flask API
Flask endpoints for condo property search and management
Integrates with voice_assistant_clean.py architecture
"""

from flask import Flask, request, jsonify, Blueprint
from flask_cors import CORS
import logging
import os
import sys

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

# Create Blueprint
condo_api = Blueprint('condo_api', __name__, url_prefix='/api/condo')

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
