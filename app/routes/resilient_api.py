"""
Resilient API Routes - Property search with intelligent fallback
"""
from flask import Blueprint, request, jsonify
from services.resilience_layer import resilient_property_service
import logging

logger = logging.getLogger(__name__)

resilient_api = Blueprint('resilient_api', __name__)


@resilient_api.route('/api/search-properties', methods=['POST'])
def search_properties_resilient():
    """
    Property search with automatic fallback chain
    
    Request body:
    {
        "location": "Toronto",
        "min_price": 500000,
        "max_price": 1000000,
        "bedrooms": 3,
        "bathrooms": 2,
        "property_type": "residential",
        "limit": 10
    }
    
    Response includes:
    - properties: List of property objects
    - data_source: Which source provided the data
    - is_live: Boolean indicating if data is from live API
    - cache_status: Information about caching
    """
    try:
        data = request.json
        
        # Validate required fields
        if not data or 'location' not in data:
            return jsonify({
                'success': False,
                'error': 'Location is required'
            }), 400
        
        # Extract search parameters
        location = data.get('location')
        min_price = data.get('min_price')
        max_price = data.get('max_price')
        bedrooms = data.get('bedrooms')
        bathrooms = data.get('bathrooms')
        property_type = data.get('property_type')
        limit = data.get('limit', 10)
        
        # Additional filters
        kwargs = {}
        for key in ['neighborhood', 'postal_code', 'keywords', 'has_pool', 'has_garage']:
            if key in data:
                kwargs[key] = data[key]
        
        logger.info(f"Search request: {location}, price: {min_price}-{max_price}, beds: {bedrooms}")
        
        # Execute resilient search
        result = resilient_property_service.search_properties(
            location=location,
            min_price=min_price,
            max_price=max_price,
            bedrooms=bedrooms,
            bathrooms=bathrooms,
            property_type=property_type,
            limit=limit,
            **kwargs
        )
        
        # Build response with metadata
        response = {
            'success': True,
            'properties': result.get('properties', []),
            'total_found': result.get('total_found', 0),
            'data_source': result.get('source', 'unknown'),
            'is_live': result.get('source') == 'repliers_api',
            'timestamp': result.get('timestamp'),
        }
        
        # Add cache information if applicable
        if 'cache_age_seconds' in result:
            response['cache_age_seconds'] = result['cache_age_seconds']
            response['cache_age_minutes'] = round(result['cache_age_seconds'] / 60, 1)
        
        # Add warning/notice for fallback sources
        if result.get('source') != 'repliers_api':
            response['notice'] = _get_fallback_message(result.get('source'))
        
        if 'warning' in result:
            response['warning'] = result['warning']
        
        logger.info(
            f"Search completed: {len(response['properties'])} properties, "
            f"source: {response['data_source']}"
        )
        
        return jsonify(response)
        
    except Exception as e:
        logger.error(f"Search properties error: {str(e)}", exc_info=True)
        return jsonify({
            'success': False,
            'error': f'Search failed: {str(e)}'
        }), 500


@resilient_api.route('/api/search-properties/health', methods=['GET'])
def get_health_status():
    """
    Get health status of resilience layer components
    
    Returns circuit breaker states, cache statistics, and fallback usage
    """
    try:
        health = resilient_property_service.get_health_status()
        return jsonify({
            'success': True,
            'health': health
        })
    except Exception as e:
        logger.error(f"Health status error: {str(e)}", exc_info=True)
        return jsonify({
            'success': False,
            'error': str(e)
        }), 500


@resilient_api.route('/api/search-properties/cache/clear', methods=['POST'])
def clear_caches():
    """
    Clear all caches (admin endpoint)
    
    Use with caution - will force all requests to hit primary API
    """
    try:
        resilient_property_service.clear_caches()
        return jsonify({
            'success': True,
            'message': 'All caches cleared'
        })
    except Exception as e:
        logger.error(f"Cache clear error: {str(e)}", exc_info=True)
        return jsonify({
            'success': False,
            'error': str(e)
        }), 500


@resilient_api.route('/api/search-properties/circuit-breakers/reset', methods=['POST'])
def reset_circuit_breakers():
    """
    Reset all circuit breakers (admin endpoint)
    
    Use to manually recover from circuit breaker open state
    """
    try:
        resilient_property_service.reset_circuit_breakers()
        return jsonify({
            'success': True,
            'message': 'All circuit breakers reset'
        })
    except Exception as e:
        logger.error(f"Circuit breaker reset error: {str(e)}", exc_info=True)
        return jsonify({
            'success': False,
            'error': str(e)
        }), 500


def _get_fallback_message(source: str) -> str:
    """
    Get user-friendly message for fallback sources
    
    Args:
        source: Data source identifier
        
    Returns:
        User-friendly message
    """
    messages = {
        'warm_cache': 'Showing recently cached results',
        'historical_cache': 'Showing cached results - may not reflect latest listings',
        'statistical_model': 'Showing representative data based on market trends',
        'synthetic_fallback': 'System temporarily unavailable - showing example data'
    }
    return messages.get(source, 'Using alternative data source')


# Export blueprint
__all__ = ['resilient_api']
