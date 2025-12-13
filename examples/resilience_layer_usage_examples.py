"""
Example: Using the Resilience Layer in Your Code

This file shows practical examples of how to use the Smart API Resilience Layer
throughout the Summitly codebase.
"""

# =============================================================================
# EXAMPLE 1: Basic Property Search (Most Common Use Case)
# =============================================================================

from services.resilience_layer import resilient_property_service

def search_properties_example():
    """Basic property search with automatic resilience"""
    
    result = resilient_property_service.search_properties(
        location='Toronto',
        max_price=1000000,
        bedrooms=3,
        limit=10
    )
    
    # Result includes properties and metadata
    properties = result['properties']
    data_source = result['source']  # Where the data came from
    is_live = result['source'] == 'repliers_api'  # Is it live data?
    
    print(f"Found {len(properties)} properties")
    print(f"Data source: {data_source}")
    print(f"Live data: {is_live}")
    
    return properties


# =============================================================================
# EXAMPLE 2: Using in Flask Routes
# =============================================================================

from flask import Flask, request, jsonify
from services.resilience_layer import resilient_property_service

app = Flask(__name__)

@app.route('/api/my-search', methods=['POST'])
def my_custom_search():
    """Custom search endpoint using resilience layer"""
    
    data = request.json
    
    try:
        # Use resilient service - it handles all failures automatically
        result = resilient_property_service.search_properties(
            location=data.get('location'),
            min_price=data.get('min_price'),
            max_price=data.get('max_price'),
            bedrooms=data.get('bedrooms'),
            limit=data.get('limit', 10)
        )
        
        # Build response
        return jsonify({
            'success': True,
            'properties': result['properties'],
            'data_source': result['source'],
            'is_live': result['source'] == 'repliers_api',
            'total_found': result.get('total_found', 0)
        })
        
    except Exception as e:
        # This should rarely happen - resilience layer handles most errors
        return jsonify({
            'success': False,
            'error': str(e)
        }), 500


# =============================================================================
# EXAMPLE 3: Monitoring Circuit Breaker Health
# =============================================================================

from services.resilience_layer import resilient_property_service

def check_system_health():
    """Check if resilience layer is healthy"""
    
    health = resilient_property_service.get_health_status()
    
    # Check circuit breaker states
    repliers_breaker = health['circuit_breakers']['repliers']
    
    if repliers_breaker['state'] == 'open':
        print("⚠️ WARNING: Repliers circuit breaker is OPEN")
        print(f"   Failed {repliers_breaker['failure_count']} times")
        print(f"   Last failure: {repliers_breaker['last_failure']}")
        # Send alert to monitoring system
        
    # Check cache performance
    warm_cache = health['caches']['warm']
    hit_rate = warm_cache['hit_rate']
    
    print(f"Cache hit rate: {hit_rate:.1%}")
    if hit_rate < 0.4:
        print("⚠️ WARNING: Cache hit rate is low")
        
    # Check fallback usage
    fallback_stats = health['fallback_stats']
    total_requests = sum(fallback_stats.values())
    
    if total_requests > 0:
        primary_rate = fallback_stats.get('primary_success', 0) / total_requests
        print(f"Primary API success rate: {primary_rate:.1%}")
        
        if primary_rate < 0.9:
            print("⚠️ WARNING: High fallback usage detected")
    
    return health


# =============================================================================
# EXAMPLE 4: Using Circuit Breaker for Other APIs
# =============================================================================

from services.resilience_layer import CircuitBreaker, circuit_breaker_decorator

# Create a circuit breaker for a different API
my_api_breaker = CircuitBreaker(
    failure_threshold=3,
    recovery_timeout=180,
    name="my_custom_api"
)

# Option 1: Using decorator
@circuit_breaker_decorator(my_api_breaker)
def call_my_api(param1, param2):
    """Call external API with circuit breaker protection"""
    import requests
    
    response = requests.get(
        f"https://api.example.com/endpoint",
        params={'param1': param1, 'param2': param2},
        timeout=5
    )
    
    if not response.ok:
        raise Exception(f"API Error: {response.status_code}")
    
    return response.json()


# Option 2: Using call method directly
def call_another_api():
    """Alternative way to use circuit breaker"""
    
    def api_call():
        import requests
        response = requests.get("https://api.example.com/data")
        return response.json()
    
    try:
        result = my_api_breaker.call(api_call)
        return result
    except Exception as e:
        print(f"API call failed or circuit open: {e}")
        return None


# =============================================================================
# EXAMPLE 5: Using Cache Layer for Custom Data
# =============================================================================

from services.resilience_layer import CacheLayer

# Create a cache for your custom data
my_cache = CacheLayer(ttl_seconds=1800, name="my_custom_cache")  # 30 min TTL

def get_market_data(city):
    """Get market data with caching"""
    
    cache_key = f"market_data_{city}"
    
    # Try cache first
    cached_data = my_cache.get(cache_key)
    if cached_data:
        print(f"✅ Cache HIT for {city}")
        return cached_data
    
    # Cache miss - fetch from API
    print(f"⚠️ Cache MISS for {city} - fetching from API")
    
    try:
        # Fetch from external API
        import requests
        response = requests.get(f"https://api.market-data.com/{city}")
        data = response.json()
        
        # Store in cache
        my_cache.set(cache_key, data)
        
        return data
        
    except Exception as e:
        print(f"❌ Failed to fetch market data: {e}")
        return None


# =============================================================================
# EXAMPLE 6: Chatbot Integration
# =============================================================================

from services.resilience_layer import resilient_property_service

def chatbot_search_properties(user_message):
    """Use resilience layer in chatbot responses"""
    
    # Parse user message (simplified)
    location = "Toronto"  # Extract from NLP
    bedrooms = 3  # Extract from NLP
    
    # Search with resilience
    result = resilient_property_service.search_properties(
        location=location,
        bedrooms=bedrooms,
        limit=5
    )
    
    properties = result['properties']
    data_source = result['source']
    
    # Build chatbot response
    if data_source == 'repliers_api':
        response = f"Found {len(properties)} live properties in {location}:"
    elif data_source == 'warm_cache':
        response = f"Found {len(properties)} recently updated properties in {location}:"
    elif data_source == 'historical_cache':
        response = f"Found {len(properties)} properties in {location} (cached data):"
    else:
        response = f"Here are {len(properties)} representative properties in {location}:"
    
    # Add property details to response
    for prop in properties:
        response += f"\n• {prop['address']} - ${prop['price']:,}"
    
    return response


# =============================================================================
# EXAMPLE 7: Scheduled Tasks / Background Jobs
# =============================================================================

from services.resilience_layer import resilient_property_service

def refresh_cache_for_popular_cities():
    """Background job to pre-populate cache for popular searches"""
    
    popular_cities = ['Toronto', 'Vancouver', 'Calgary', 'Montreal']
    
    for city in popular_cities:
        print(f"Refreshing cache for {city}...")
        
        try:
            result = resilient_property_service.search_properties(
                location=city,
                limit=20
            )
            
            if result['source'] == 'repliers_api':
                print(f"✅ {city}: Cached {len(result['properties'])} properties")
            else:
                print(f"⚠️ {city}: Used fallback - {result['source']}")
                
        except Exception as e:
            print(f"❌ {city}: Failed - {e}")


# =============================================================================
# EXAMPLE 8: Admin Dashboard Integration
# =============================================================================

from services.resilience_layer import resilient_property_service
from flask import jsonify

@app.route('/admin/resilience-status', methods=['GET'])
def admin_resilience_status():
    """Admin endpoint to view resilience layer status"""
    
    health = resilient_property_service.get_health_status()
    
    # Format for admin dashboard
    status = {
        'overall_health': 'healthy',
        'circuit_breakers': [],
        'cache_stats': [],
        'recommendations': []
    }
    
    # Check circuit breakers
    for name, breaker in health['circuit_breakers'].items():
        cb_status = {
            'name': name,
            'state': breaker['state'],
            'success_rate': f"{breaker['success_rate']:.1%}",
            'status_icon': '🟢' if breaker['state'] == 'closed' else '🔴'
        }
        status['circuit_breakers'].append(cb_status)
        
        if breaker['state'] == 'open':
            status['overall_health'] = 'degraded'
            status['recommendations'].append(
                f"Circuit breaker '{name}' is open. Check external API status."
            )
    
    # Check caches
    for name, cache in health['caches'].items():
        cache_status = {
            'name': name,
            'size': cache['size'],
            'hit_rate': f"{cache['hit_rate']:.1%}"
        }
        status['cache_stats'].append(cache_status)
        
        if cache['hit_rate'] < 0.4 and cache['size'] > 0:
            status['recommendations'].append(
                f"Cache '{name}' has low hit rate. Consider increasing TTL."
            )
    
    return jsonify(status)


# =============================================================================
# EXAMPLE 9: Testing Resilience in Development
# =============================================================================

def test_all_fallback_tiers():
    """Test each tier of the fallback chain manually"""
    
    print("Testing Fallback Chain...")
    print("=" * 60)
    
    # Test 1: Primary API (should work normally)
    print("\n1. Testing PRIMARY API:")
    result = resilient_property_service.search_properties('Toronto', limit=3)
    print(f"   Source: {result['source']}")
    print(f"   Properties: {len(result['properties'])}")
    
    # Test 2: Warm Cache (second call should hit cache)
    print("\n2. Testing WARM CACHE:")
    result = resilient_property_service.search_properties('Toronto', limit=3)
    print(f"   Source: {result['source']}")
    print(f"   Cache age: {result.get('cache_age_seconds', 'N/A')}s")
    
    # Test 3: Circuit Breaker
    print("\n3. Testing CIRCUIT BREAKER:")
    breaker = resilient_property_service.repliers_breaker
    print(f"   State: {breaker.state}")
    print(f"   Success rate: {breaker.get_success_rate():.1%}")
    
    # Test 4: Health Status
    print("\n4. Testing HEALTH STATUS:")
    health = resilient_property_service.get_health_status()
    print(f"   Repliers breaker: {health['circuit_breakers']['repliers']['state']}")
    print(f"   Warm cache hit rate: {health['caches']['warm']['hit_rate']:.1%}")
    
    print("\n" + "=" * 60)
    print("✅ Fallback chain test complete!")


# =============================================================================
# EXAMPLE 10: Error Handling Best Practices
# =============================================================================

from services.resilience_layer import resilient_property_service

def robust_property_search(location, filters):
    """
    Example of proper error handling with resilience layer
    
    Note: The resilience layer handles most errors internally,
    but you should still catch exceptions for unexpected cases.
    """
    
    try:
        result = resilient_property_service.search_properties(
            location=location,
            **filters
        )
        
        # Check what tier provided the data
        if result['source'] == 'repliers_api':
            # Best case - live data
            return {
                'status': 'success',
                'data': result['properties'],
                'message': 'Showing live properties',
                'quality': 'high'
            }
            
        elif result['source'] in ['warm_cache', 'historical_cache']:
            # Good case - cached data
            age = result.get('cache_age_seconds', 0)
            return {
                'status': 'success',
                'data': result['properties'],
                'message': f'Showing cached properties (updated {age//60} min ago)',
                'quality': 'medium'
            }
            
        else:
            # Fallback case - model or synthetic
            return {
                'status': 'success',
                'data': result['properties'],
                'message': 'Showing representative properties',
                'quality': 'low',
                'warning': result.get('warning', 'Using alternative data source')
            }
            
    except Exception as e:
        # This should rarely happen - resilience layer has its own fallbacks
        print(f"❌ Unexpected error in resilient search: {e}")
        
        return {
            'status': 'error',
            'data': [],
            'message': 'Search temporarily unavailable',
            'quality': 'none'
        }


# =============================================================================
# USAGE IN YOUR CODE
# =============================================================================

if __name__ == '__main__':
    print("Smart API Resilience Layer - Usage Examples\n")
    
    # Example 1: Basic search
    print("EXAMPLE 1: Basic Search")
    properties = search_properties_example()
    print(f"Found {len(properties)} properties\n")
    
    # Example 2: Check health
    print("EXAMPLE 2: System Health")
    check_system_health()
    print()
    
    # Example 3: Test fallbacks
    print("EXAMPLE 3: Fallback Chain Test")
    test_all_fallback_tiers()
    
    print("\n✅ All examples completed!")
    print("\nSee individual example functions above for implementation details.")
