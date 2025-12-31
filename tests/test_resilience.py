"""
Comprehensive tests for Resilience Layer
Tests circuit breaker, cache, and fallback chain functionality
"""
import pytest
import time
from datetime import datetime, timedelta
from unittest.mock import Mock, patch, MagicMock

from services.resilience_layer import (
    CircuitBreaker,
    CacheLayer,
    ResilientPropertyService,
    circuit_breaker_decorator
)


class TestCircuitBreaker:
    """Test circuit breaker functionality"""
    
    def test_circuit_breaker_closed_state_allows_calls(self):
        """Verify circuit breaker allows calls in closed state"""
        breaker = CircuitBreaker(failure_threshold=3, name="test")
        
        def successful_function():
            return "success"
        
        result = breaker.call(successful_function)
        assert result == "success"
        assert breaker.state == 'closed'
        assert breaker.success_count == 1
    
    def test_circuit_breaker_opens_after_failures(self):
        """Verify circuit opens after threshold failures"""
        breaker = CircuitBreaker(failure_threshold=3, name="test")
        
        def failing_function():
            raise Exception("API Error")
        
        # Should fail 3 times then open
        for i in range(3):
            try:
                breaker.call(failing_function)
            except Exception:
                pass
        
        assert breaker.state == 'open'
        assert breaker.failure_count == 3
        
        # Next call should fail immediately without calling function
        with pytest.raises(Exception) as exc_info:
            breaker.call(failing_function)
        
        assert "Circuit breaker OPEN" in str(exc_info.value)
    
    def test_circuit_breaker_half_open_transition(self):
        """Verify circuit transitions to half-open after recovery timeout"""
        breaker = CircuitBreaker(
            failure_threshold=2, 
            recovery_timeout=1,  # 1 second for testing
            name="test"
        )
        
        def failing_function():
            raise Exception("API Error")
        
        # Open the circuit
        for i in range(2):
            try:
                breaker.call(failing_function)
            except Exception:
                pass
        
        assert breaker.state == 'open'
        
        # Wait for recovery timeout
        time.sleep(1.5)
        
        # Should transition to half-open
        def successful_function():
            return "recovered"
        
        result = breaker.call(successful_function)
        assert result == "recovered"
        assert breaker.state == 'closed'  # Success in half-open closes circuit
    
    def test_circuit_breaker_success_rate(self):
        """Verify success rate calculation"""
        breaker = CircuitBreaker(failure_threshold=5, name="test")
        
        def success():
            return "ok"
        
        def failure():
            raise Exception("fail")
        
        # 3 successes
        for _ in range(3):
            breaker.call(success)
        
        # 2 failures
        for _ in range(2):
            try:
                breaker.call(failure)
            except Exception:
                pass
        
        # 3 successes out of 5 total = 60%
        assert breaker.success_count == 3
        assert breaker.total_calls == 5
        assert breaker.get_success_rate() == 0.6
    
    def test_circuit_breaker_get_state(self):
        """Verify state reporting"""
        breaker = CircuitBreaker(failure_threshold=3, name="test_breaker")
        
        state = breaker.get_state()
        assert state['name'] == 'test_breaker'
        assert state['state'] == 'closed'
        assert state['failure_count'] == 0
        assert state['success_count'] == 0
        assert state['total_calls'] == 0
    
    def test_circuit_breaker_reset(self):
        """Verify manual reset functionality"""
        breaker = CircuitBreaker(failure_threshold=2, name="test")
        
        def failing_function():
            raise Exception("API Error")
        
        # Open the circuit
        for i in range(2):
            try:
                breaker.call(failing_function)
            except Exception:
                pass
        
        assert breaker.state == 'open'
        
        # Reset manually
        breaker.reset()
        
        assert breaker.state == 'closed'
        assert breaker.failure_count == 0
    
    def test_circuit_breaker_decorator(self):
        """Verify decorator works correctly"""
        breaker = CircuitBreaker(failure_threshold=2, name="test")
        
        @circuit_breaker_decorator(breaker)
        def my_function(x):
            if x < 0:
                raise ValueError("Negative value")
            return x * 2
        
        # Should work
        assert my_function(5) == 10
        
        # Should fail and count
        for _ in range(2):
            try:
                my_function(-1)
            except ValueError:
                pass
        
        # Circuit should be open
        assert breaker.state == 'open'


class TestCacheLayer:
    """Test cache layer functionality"""
    
    def test_cache_set_and_get(self):
        """Verify basic cache set/get operations"""
        cache = CacheLayer(ttl_seconds=60, name="test")
        
        cache.set('key1', 'value1')
        assert cache.get('key1') == 'value1'
        assert cache.stats['sets'] == 1
        assert cache.stats['hits'] == 1
    
    def test_cache_miss(self):
        """Verify cache miss behavior"""
        cache = CacheLayer(ttl_seconds=60, name="test")
        
        result = cache.get('nonexistent_key')
        assert result is None
        assert cache.stats['misses'] == 1
    
    def test_cache_respects_ttl(self):
        """Verify cache expires after TTL"""
        cache = CacheLayer(ttl_seconds=1, name="test")  # 1 second TTL
        
        cache.set('test_key', 'test_value')
        assert cache.get('test_key') == 'test_value'
        
        # Wait for expiration
        time.sleep(1.5)
        
        assert cache.get('test_key') is None  # Expired
        assert cache.stats['misses'] == 1  # Second get was a miss
    
    def test_cache_invalidate(self):
        """Verify single key invalidation"""
        cache = CacheLayer(ttl_seconds=60, name="test")
        
        cache.set('key1', 'value1')
        assert cache.get('key1') == 'value1'
        
        # Invalidate
        result = cache.invalidate('key1')
        assert result is True
        assert cache.get('key1') is None
        assert cache.stats['invalidations'] == 1
    
    def test_cache_invalidate_pattern(self):
        """Verify pattern-based invalidation"""
        cache = CacheLayer(ttl_seconds=60, name="test")
        
        cache.set('toronto_1', 'value1')
        cache.set('toronto_2', 'value2')
        cache.set('mississauga_1', 'value3')
        
        # Invalidate all Toronto entries
        count = cache.invalidate_pattern('toronto')
        assert count == 2
        
        assert cache.get('toronto_1') is None
        assert cache.get('toronto_2') is None
        assert cache.get('mississauga_1') == 'value3'  # Should remain
    
    def test_cache_clear(self):
        """Verify clearing all cache entries"""
        cache = CacheLayer(ttl_seconds=60, name="test")
        
        cache.set('key1', 'value1')
        cache.set('key2', 'value2')
        cache.set('key3', 'value3')
        
        count = cache.clear()
        assert count == 3
        assert len(cache.cache) == 0
    
    def test_cache_get_stats(self):
        """Verify cache statistics"""
        cache = CacheLayer(ttl_seconds=60, name="test_cache")
        
        cache.set('key1', 'value1')
        cache.get('key1')  # Hit
        cache.get('key2')  # Miss
        
        stats = cache.get_stats()
        assert stats['name'] == 'test_cache'
        assert stats['hits'] == 1
        assert stats['misses'] == 1
        assert stats['sets'] == 1
        assert stats['hit_rate'] == 0.5  # 1 hit out of 2 requests
    
    def test_cache_get_age(self):
        """Verify getting age of cached entries"""
        cache = CacheLayer(ttl_seconds=60, name="test")
        
        cache.set('key1', 'value1')
        time.sleep(0.5)
        
        age = cache.get_age('key1')
        assert age is not None
        assert age >= 0.5
        assert age < 1.0
        
        # Non-existent key
        assert cache.get_age('nonexistent') is None


class TestResilientPropertyService:
    """Test resilient property service and fallback chain"""
    
    def test_primary_source_success(self):
        """Verify primary source (Repliers) is used when available"""
        service = ResilientPropertyService()
        
        # Mock successful Repliers API response
        with patch('services.resilience_layer.listings_service') as mock_listings:
            mock_listings.search_listings.return_value = {
                'success': True,
                'listings': [
                    {'id': '1', 'address': '123 Test St', 'price': 500000},
                    {'id': '2', 'address': '456 Test Ave', 'price': 600000}
                ],
                'count': 2
            }
            
            result = service.search_properties('Toronto', limit=10)
            
            assert result['source'] == 'repliers_api'
            assert len(result['properties']) == 2
            assert result['total_found'] == 2
            assert service.fallback_stats['primary_success'] == 1
    
    def test_warm_cache_fallback(self):
        """Verify warm cache is used when primary fails"""
        service = ResilientPropertyService()
        
        # Pre-populate cache
        cached_result = {
            'properties': [{'id': 'cached', 'address': 'Cached Property'}],
            'total_found': 1,
            'source': 'repliers_api'
        }
        cache_key = service._generate_cache_key('Toronto', {'limit': 10})
        service.cache.set(cache_key, cached_result)
        
        # Mock Repliers API to fail
        with patch('services.resilience_layer.listings_service') as mock_listings:
            mock_listings.search_listings.side_effect = Exception("API Down")
            
            result = service.search_properties('Toronto', limit=10)
            
            assert result['source'] == 'warm_cache'
            assert len(result['properties']) == 1
            assert service.fallback_stats['warm_cache'] == 1
    
    def test_historical_cache_fallback(self):
        """Verify historical cache is used when warm cache misses"""
        service = ResilientPropertyService()
        
        # Pre-populate only historical cache
        cached_result = {
            'properties': [{'id': 'old', 'address': 'Old Property'}],
            'total_found': 1,
            'source': 'repliers_api'
        }
        cache_key = service._generate_cache_key('Toronto', {'limit': 10})
        service.historical_cache.set(cache_key, cached_result)
        
        # Mock Repliers API to fail
        with patch('services.resilience_layer.listings_service') as mock_listings:
            mock_listings.search_listings.side_effect = Exception("API Down")
            
            result = service.search_properties('Toronto', limit=10)
            
            assert result['source'] == 'historical_cache'
            assert len(result['properties']) == 1
            assert service.fallback_stats['historical_cache'] == 1
    
    def test_statistical_model_fallback(self):
        """Verify statistical model is used when all caches miss"""
        service = ResilientPropertyService()
        
        # Mock Repliers API to fail
        with patch('services.resilience_layer.listings_service') as mock_listings:
            mock_listings.search_listings.side_effect = Exception("API Down")
            
            result = service.search_properties('Toronto', limit=10)
            
            assert result['source'] == 'statistical_model'
            assert len(result['properties']) > 0
            assert 'warning' in result
            assert service.fallback_stats['statistical_model'] == 1
    
    def test_cache_key_generation(self):
        """Verify consistent cache key generation"""
        service = ResilientPropertyService()
        
        filters1 = {'limit': 10, 'max_price': 800000, 'bedrooms': 3}
        filters2 = {'bedrooms': 3, 'limit': 10, 'max_price': 800000}  # Different order
        
        key1 = service._generate_cache_key('Toronto', filters1)
        key2 = service._generate_cache_key('Toronto', filters2)
        
        # Should generate same key regardless of order
        assert key1 == key2
    
    def test_circuit_breaker_integration(self):
        """Verify circuit breaker prevents repeated API calls"""
        service = ResilientPropertyService()
        
        # Mock Repliers API to always fail
        with patch('services.resilience_layer.listings_service') as mock_listings:
            mock_listings.search_listings.side_effect = Exception("API Down")
            
            # Fail 5 times to open circuit
            for _ in range(5):
                try:
                    service.search_properties('Toronto', limit=10)
                except:
                    pass
            
            # Circuit should be open
            assert service.repliers_breaker.state == 'open'
            
            # Next call should use fallback immediately
            result = service.search_properties('Toronto', limit=10)
            assert result['source'] in ['warm_cache', 'historical_cache', 'statistical_model']
    
    def test_get_health_status(self):
        """Verify health status reporting"""
        service = ResilientPropertyService()
        
        health = service.get_health_status()
        
        assert 'circuit_breakers' in health
        assert 'repliers' in health['circuit_breakers']
        assert 'exa' in health['circuit_breakers']
        
        assert 'caches' in health
        assert 'warm' in health['caches']
        assert 'historical' in health['caches']
        
        assert 'fallback_stats' in health
        assert 'timestamp' in health
    
    def test_reset_circuit_breakers(self):
        """Verify manual circuit breaker reset"""
        service = ResilientPropertyService()
        
        # Open a circuit
        for _ in range(5):
            try:
                service.repliers_breaker.call(lambda: 1/0)  # Force error
            except:
                pass
        
        assert service.repliers_breaker.state == 'open'
        
        # Reset
        service.reset_circuit_breakers()
        
        assert service.repliers_breaker.state == 'closed'
        assert service.exa_breaker.state == 'closed'
    
    def test_clear_caches(self):
        """Verify cache clearing"""
        service = ResilientPropertyService()
        
        # Populate caches
        service.cache.set('key1', 'value1')
        service.cache.set('key2', 'value2')
        service.historical_cache.set('key3', 'value3')
        
        # Clear
        service.clear_caches()
        
        assert len(service.cache.cache) == 0
        assert len(service.historical_cache.cache) == 0


class TestIntegration:
    """Integration tests for full workflow"""
    
    def test_successful_search_caches_result(self):
        """Verify successful searches populate both caches"""
        service = ResilientPropertyService()
        
        # Mock successful API
        with patch('services.resilience_layer.listings_service') as mock_listings:
            mock_listings.search_listings.return_value = {
                'success': True,
                'listings': [{'id': '1', 'price': 500000}],
                'count': 1
            }
            
            result = service.search_properties('Toronto', limit=10)
            
            # Check result
            assert result['source'] == 'repliers_api'
            
            # Verify both caches populated
            cache_key = service._generate_cache_key('Toronto', {'limit': 10})
            assert service.cache.get(cache_key) is not None
            assert service.historical_cache.get(cache_key) is not None
    
    def test_fallback_chain_progression(self):
        """Verify fallback chain progresses through all levels"""
        service = ResilientPropertyService()
        
        # Mock API to fail
        with patch('services.resilience_layer.listings_service') as mock_listings:
            mock_listings.search_listings.side_effect = Exception("API Down")
            
            # First call - should use statistical model (no cache)
            result1 = service.search_properties('NewCity', limit=5)
            assert result1['source'] == 'statistical_model'
            
            # Second call - should use statistical model again (same params)
            result2 = service.search_properties('NewCity', limit=5)
            assert result2['source'] == 'statistical_model'


if __name__ == '__main__':
    pytest.main([__file__, '-v'])
