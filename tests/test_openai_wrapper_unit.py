"""
Unit tests for OpenAI Wrapper - services/openai_wrapper.py

Tests cover:
1. Timeout behavior (30s default)
2. Retry logic with exponential backoff
3. Circuit breaker (5 failures, 60s reset)
4. Response caching (LRU + Redis fallback)
5. JSON repair for malformed responses
6. Model safety fallback (GPT-5 -> gpt-4o-mini)
7. Metrics collection
8. Feature flag toggles

Run with: pytest tests/test_openai_wrapper_unit.py -v
"""

import pytest
import time
import json
import os
import sys
from unittest.mock import Mock, patch, MagicMock
from datetime import datetime

# Add app directory to path
sys.path.insert(0, os.path.join(os.path.dirname(__file__), '..'))

# Import mocks
from tests.mocks.openai_mocks import (
    create_mock_openai_response,
    create_empty_response,
    create_none_content_response,
    MockInterpreterResponse,
    MalformedResponses,
    MockOpenAIClient,
    UX_TEST_PROMPTS,
    assert_latency_under,
)


class TestCircuitBreaker:
    """Test circuit breaker pattern implementation."""
    
    def test_circuit_opens_after_threshold_failures(self):
        """Circuit should open after 5 consecutive failures."""
        from services.openai_wrapper import CircuitBreaker
        
        cb = CircuitBreaker(failure_threshold=5, reset_timeout=60)
        
        # Record 5 failures
        for _ in range(5):
            cb.record_failure()
        
        assert cb.is_open == True
    
    def test_circuit_stays_closed_below_threshold(self):
        """Circuit should remain closed with fewer than 5 failures."""
        from services.openai_wrapper import CircuitBreaker
        
        cb = CircuitBreaker(failure_threshold=5, reset_timeout=60)
        
        # Record 4 failures
        for _ in range(4):
            cb.record_failure()
        
        assert cb.is_open == False
    
    def test_success_resets_failure_count(self):
        """A successful call should reset the failure counter."""
        from services.openai_wrapper import CircuitBreaker
        
        cb = CircuitBreaker(failure_threshold=5, reset_timeout=60)
        
        # Record 4 failures, then 1 success
        for _ in range(4):
            cb.record_failure()
        cb.record_success()
        
        # Record 4 more failures
        for _ in range(4):
            cb.record_failure()
        
        assert cb.is_open == False  # Should not be open (4 < 5)
    
    def test_circuit_resets_after_timeout(self):
        """Circuit should move to half-open after timeout."""
        from services.openai_wrapper import CircuitBreaker
        
        cb = CircuitBreaker(failure_threshold=5, reset_timeout=0.1)  # 100ms timeout
        
        # Open the circuit
        for _ in range(5):
            cb.record_failure()
        assert cb.is_open == True
        
        # Wait for reset timeout
        time.sleep(0.15)
        
        # Circuit should be half-open (allow one request)
        assert cb.should_allow_request() == True
    
    def test_circuit_closes_on_success_after_half_open(self):
        """Circuit should close after successful request in half-open state."""
        from services.openai_wrapper import CircuitBreaker
        
        cb = CircuitBreaker(failure_threshold=5, reset_timeout=0.1)
        
        # Open the circuit
        for _ in range(5):
            cb.record_failure()
        
        # Wait for reset timeout
        time.sleep(0.15)
        
        # Record success
        cb.record_success()
        
        assert cb.is_open == False


class TestResponseCache:
    """Test caching behavior with LRU and optional Redis."""
    
    def test_cache_hit_returns_cached_response(self):
        """Identical requests should return cached response."""
        from services.openai_wrapper import ResponseCache
        
        cache = ResponseCache(max_size=100, ttl_seconds=3600)
        
        # Create cache key
        key = cache.generate_key(
            model="gpt-4o-mini",
            messages=[{"role": "user", "content": "Hello"}],
            temperature=0.0
        )
        
        # Store in cache
        cache.set(key, {"response": "cached"})
        
        # Retrieve from cache
        result = cache.get(key)
        
        assert result == {"response": "cached"}
    
    def test_cache_miss_returns_none(self):
        """Non-existent keys should return None."""
        from services.openai_wrapper import ResponseCache
        
        cache = ResponseCache(max_size=100, ttl_seconds=3600)
        
        result = cache.get("nonexistent_key")
        
        assert result is None
    
    def test_cache_respects_ttl(self):
        """Cache entries should expire after TTL."""
        from services.openai_wrapper import ResponseCache
        
        cache = ResponseCache(max_size=100, ttl_seconds=0.1)  # 100ms TTL
        
        key = cache.generate_key(
            model="gpt-4o-mini",
            messages=[{"role": "user", "content": "Hello"}],
            temperature=0.0
        )
        
        cache.set(key, {"response": "cached"})
        
        # Wait for TTL to expire
        time.sleep(0.15)
        
        result = cache.get(key)
        
        assert result is None
    
    def test_cache_only_for_zero_temperature(self):
        """Non-zero temperature requests should not be cached."""
        from services.openai_wrapper import ResponseCache
        
        cache = ResponseCache(max_size=100, ttl_seconds=3600)
        
        # Generate key with non-zero temperature
        key = cache.generate_key(
            model="gpt-4o-mini",
            messages=[{"role": "user", "content": "Hello"}],
            temperature=0.7
        )
        
        # Should return None for non-zero temperature
        assert key is None or cache.should_cache(temperature=0.7) == False
    
    def test_lru_eviction_when_full(self):
        """Oldest entries should be evicted when cache is full."""
        from services.openai_wrapper import ResponseCache
        
        cache = ResponseCache(max_size=3, ttl_seconds=3600)
        
        # Fill cache
        for i in range(4):
            key = f"key_{i}"
            cache.set(key, {"response": f"value_{i}"})
        
        # First key should be evicted
        assert cache.get("key_0") is None
        assert cache.get("key_3") == {"response": "value_3"}


class TestJSONRepair:
    """Test JSON parsing and repair capabilities."""
    
    def test_valid_json_parses_correctly(self):
        """Valid JSON should parse without modification."""
        from services.openai_wrapper import parse_json_response
        
        valid_json = '{"action": "search", "filters": {"city": "Toronto"}}'
        
        result = parse_json_response(valid_json)
        
        assert result == {"action": "search", "filters": {"city": "Toronto"}}
    
    def test_json_with_code_fences_extracted(self):
        """JSON wrapped in markdown code fences should be extracted."""
        from services.openai_wrapper import parse_json_response
        
        wrapped_json = '''```json
{"action": "search", "filters": {"city": "Toronto"}}
```'''
        
        result = parse_json_response(wrapped_json)
        
        assert result == {"action": "search", "filters": {"city": "Toronto"}}
    
    def test_json_with_trailing_comma_repaired(self):
        """Trailing commas should be repaired."""
        from services.openai_wrapper import parse_json_response
        
        bad_json = '{"action": "search", "filters": {"city": "Toronto",}}'
        
        result = parse_json_response(bad_json)
        
        assert result is not None
        assert result.get("action") == "search"
    
    def test_json_with_single_quotes_repaired(self):
        """Single quotes should be converted to double quotes."""
        from services.openai_wrapper import parse_json_response
        
        bad_json = "{'action': 'search', 'city': 'Toronto'}"
        
        result = parse_json_response(bad_json)
        
        assert result is not None
        assert result.get("action") == "search"
    
    def test_json_with_unquoted_keys_repaired(self):
        """Unquoted keys should be quoted."""
        from services.openai_wrapper import parse_json_response
        
        bad_json = '{action: "search", city: "Toronto"}'
        
        result = parse_json_response(bad_json)
        
        assert result is not None
    
    def test_json_embedded_in_text_extracted(self):
        """JSON embedded in text should be extracted."""
        from services.openai_wrapper import parse_json_response
        
        text_with_json = '''Sure! Here's the response:
{"action": "search", "filters": {"city": "Toronto"}}
Let me know if you need anything else.'''
        
        result = parse_json_response(text_with_json)
        
        assert result is not None
        assert result.get("action") == "search"
    
    def test_completely_invalid_returns_none(self):
        """Completely invalid input should return None."""
        from services.openai_wrapper import parse_json_response
        
        result = parse_json_response("This is not JSON at all")
        
        assert result is None
    
    def test_malformed_nested_json_repair(self):
        """Nested malformed JSON should be repaired when possible."""
        from services.openai_wrapper import parse_json_response
        
        bad_nested = '''{"action": "search", "filters": {'city': "Toronto", "bedrooms": 2,}}'''
        
        result = parse_json_response(bad_nested)
        
        assert result is not None


class TestModelSafety:
    """Test model fallback for experimental/unstable models."""
    
    def test_gpt4o_mini_not_modified(self):
        """gpt-4o-mini should not be modified."""
        from services.openai_wrapper import get_safe_model
        
        result = get_safe_model("gpt-4o-mini")
        
        assert result == "gpt-4o-mini"
    
    def test_gpt4o_not_modified(self):
        """gpt-4o should not be modified."""
        from services.openai_wrapper import get_safe_model
        
        result = get_safe_model("gpt-4o")
        
        assert result == "gpt-4o"
    
    def test_gpt4_turbo_not_modified(self):
        """gpt-4-turbo should not be modified."""
        from services.openai_wrapper import get_safe_model
        
        result = get_safe_model("gpt-4-turbo")
        
        assert result == "gpt-4-turbo"
    
    def test_gpt5_falls_back_to_gpt4o_mini(self):
        """gpt-5 should fallback to gpt-4o-mini."""
        from services.openai_wrapper import get_safe_model
        
        # Without experimental flag
        result = get_safe_model("gpt-5", allow_experimental=False)
        
        assert result == "gpt-4o-mini"
    
    def test_gpt5_allowed_with_experimental_flag(self):
        """gpt-5 should be allowed with experimental flag."""
        from services.openai_wrapper import get_safe_model
        
        result = get_safe_model("gpt-5", allow_experimental=True)
        
        assert result == "gpt-5"
    
    def test_unknown_model_falls_back(self):
        """Unknown models should fallback to default."""
        from services.openai_wrapper import get_safe_model
        
        result = get_safe_model("unknown-model-xyz")
        
        assert result == "gpt-4o-mini"


class TestRetryLogic:
    """Test retry behavior with exponential backoff."""
    
    @patch('time.sleep')  # Mock sleep to speed up tests
    def test_retry_on_rate_limit(self, mock_sleep):
        """Should retry on rate limit (429) errors."""
        from services.openai_wrapper import OpenAIWrapper
        from openai import RateLimitError
        
        wrapper = OpenAIWrapper(max_retries=3)
        
        # Mock client that fails twice then succeeds
        mock_client = MockOpenAIClient(
            error_on_calls=[1, 2],
            error_type="rate_limit"
        )
        wrapper.client = mock_client
        
        # Should eventually succeed
        result = wrapper.call(
            messages=[{"role": "user", "content": "Hello"}],
            model="gpt-4o-mini"
        )
        
        assert result is not None
        assert mock_client.call_count == 3
    
    @patch('time.sleep')
    def test_no_retry_on_auth_error(self, mock_sleep):
        """Should NOT retry on authentication errors."""
        from services.openai_wrapper import OpenAIWrapper
        
        wrapper = OpenAIWrapper(max_retries=3)
        
        mock_client = MockOpenAIClient(
            error_on_calls=[1],
            error_type="auth"
        )
        wrapper.client = mock_client
        
        result = wrapper.call(
            messages=[{"role": "user", "content": "Hello"}],
            model="gpt-4o-mini"
        )
        
        # Should fail immediately without retry
        assert mock_client.call_count == 1
    
    @patch('time.sleep')
    def test_exponential_backoff_timing(self, mock_sleep):
        """Backoff should be exponential: 1s, 2s, 4s..."""
        from services.openai_wrapper import OpenAIWrapper
        
        wrapper = OpenAIWrapper(max_retries=3, base_delay=1.0)
        
        mock_client = MockOpenAIClient(
            error_on_calls=[1, 2, 3],
            error_type="rate_limit"
        )
        wrapper.client = mock_client
        
        wrapper.call(
            messages=[{"role": "user", "content": "Hello"}],
            model="gpt-4o-mini"
        )
        
        # Check sleep was called with exponential values
        sleep_calls = [call[0][0] for call in mock_sleep.call_args_list]
        
        # Should be approximately 1, 2, 4 (with some jitter)
        assert len(sleep_calls) >= 2
        assert sleep_calls[0] <= 2  # First delay ~1s
        assert sleep_calls[1] <= 4  # Second delay ~2s


class TestMetrics:
    """Test metrics collection."""
    
    def test_metrics_track_total_calls(self):
        """Metrics should count total calls."""
        from services.openai_wrapper import OpenAIWrapper
        
        wrapper = OpenAIWrapper()
        wrapper.client = MockOpenAIClient()
        
        initial_calls = wrapper.metrics.total_calls
        
        wrapper.call(messages=[{"role": "user", "content": "Hello"}])
        wrapper.call(messages=[{"role": "user", "content": "World"}])
        
        assert wrapper.metrics.total_calls == initial_calls + 2
    
    def test_metrics_track_cache_hits(self):
        """Metrics should count cache hits."""
        from services.openai_wrapper import OpenAIWrapper
        
        wrapper = OpenAIWrapper(enable_cache=True)
        wrapper.client = MockOpenAIClient()
        
        # First call - cache miss
        wrapper.call(
            messages=[{"role": "user", "content": "Hello"}],
            temperature=0.0
        )
        
        # Second call - cache hit
        wrapper.call(
            messages=[{"role": "user", "content": "Hello"}],
            temperature=0.0
        )
        
        assert wrapper.metrics.cache_hits >= 1
    
    def test_metrics_track_failures(self):
        """Metrics should count failures."""
        from services.openai_wrapper import OpenAIWrapper
        
        wrapper = OpenAIWrapper(max_retries=1)
        wrapper.client = MockOpenAIClient(
            error_on_calls=[1],
            error_type="auth"
        )
        
        wrapper.call(messages=[{"role": "user", "content": "Hello"}])
        
        assert wrapper.metrics.failures >= 1
    
    def test_metrics_track_latency(self):
        """Metrics should track average latency."""
        from services.openai_wrapper import OpenAIWrapper
        
        wrapper = OpenAIWrapper()
        wrapper.client = MockOpenAIClient(delay=0.1)
        
        wrapper.call(messages=[{"role": "user", "content": "Hello"}])
        
        assert wrapper.metrics.avg_latency_ms > 0


class TestTimeout:
    """Test timeout behavior."""
    
    def test_timeout_raises_after_threshold(self):
        """Long-running calls should timeout."""
        from services.openai_wrapper import OpenAIWrapper
        from concurrent.futures import TimeoutError
        
        wrapper = OpenAIWrapper(timeout=0.5)  # 500ms timeout
        wrapper.client = MockOpenAIClient(delay=2.0)  # 2s delay
        
        # Should timeout
        with pytest.raises(TimeoutError):
            wrapper.call(
                messages=[{"role": "user", "content": "Hello"}],
                timeout=0.5
            )
    
    def test_fast_calls_complete_successfully(self):
        """Fast calls should complete before timeout."""
        from services.openai_wrapper import OpenAIWrapper
        
        wrapper = OpenAIWrapper(timeout=5.0)
        wrapper.client = MockOpenAIClient(delay=0.1)
        
        result = wrapper.call(messages=[{"role": "user", "content": "Hello"}])
        
        assert result is not None


class TestFeatureFlags:
    """Test feature flag toggles."""
    
    def test_wrapper_disabled_bypasses_wrapper(self):
        """OPENAI_ENABLE_WRAPPER=false should bypass wrapper."""
        with patch.dict(os.environ, {'OPENAI_ENABLE_WRAPPER': 'false'}):
            from services.openai_wrapper import is_wrapper_enabled
            
            assert is_wrapper_enabled() == False
    
    def test_wrapper_enabled_uses_wrapper(self):
        """OPENAI_ENABLE_WRAPPER=true should use wrapper."""
        with patch.dict(os.environ, {'OPENAI_ENABLE_WRAPPER': 'true'}):
            from services.openai_wrapper import is_wrapper_enabled
            
            assert is_wrapper_enabled() == True
    
    def test_cache_disabled_skips_caching(self):
        """OPENAI_ENABLE_CACHE=false should skip caching."""
        with patch.dict(os.environ, {'OPENAI_ENABLE_CACHE': 'false'}):
            from services.openai_wrapper import OpenAIWrapper
            
            wrapper = OpenAIWrapper()
            
            assert wrapper.enable_cache == False
    
    def test_circuit_breaker_disabled(self):
        """OPENAI_ENABLE_CIRCUIT_BREAKER=false should disable CB."""
        with patch.dict(os.environ, {'OPENAI_ENABLE_CIRCUIT_BREAKER': 'false'}):
            from services.openai_wrapper import OpenAIWrapper
            
            wrapper = OpenAIWrapper()
            
            assert wrapper.enable_circuit_breaker == False


class TestEmptyAndNullResponses:
    """Test handling of edge cases in responses."""
    
    def test_empty_content_handled_gracefully(self):
        """Empty content in response should not crash."""
        from services.openai_wrapper import parse_response_content
        
        mock_response = create_empty_response()
        
        result = parse_response_content(mock_response)
        
        assert result == "" or result is None
    
    def test_none_content_handled_gracefully(self):
        """None content in response should not crash."""
        from services.openai_wrapper import parse_response_content
        
        mock_response = create_none_content_response()
        
        result = parse_response_content(mock_response)
        
        assert result is None or result == ""
    
    def test_malformed_choices_handled(self):
        """Malformed choices array should not crash."""
        from services.openai_wrapper import parse_response_content
        
        mock_response = MagicMock()
        mock_response.choices = []
        
        result = parse_response_content(mock_response)
        
        assert result is None or result == ""


class TestCombinedInterpreter:
    """Test combined interpreter + location extraction."""
    
    def test_combined_call_extracts_both(self):
        """Combined call should extract intent and location."""
        from services.openai_wrapper import OpenAIWrapper
        
        wrapper = OpenAIWrapper()
        wrapper.client = MockOpenAIClient(
            response_content=json.dumps({
                "action": "search",
                "filters": {
                    "city": "Toronto",
                    "bedrooms": 2,
                    "max_price": 750000
                },
                "location": {
                    "city": "Toronto",
                    "province": "ON"
                }
            })
        )
        
        result = wrapper.call_combined_interpreter(
            messages=[{"role": "user", "content": "Show me 2 bedroom condos in Toronto under $750k"}]
        )
        
        assert result is not None
        assert result.get("filters", {}).get("city") == "Toronto"


class TestSummarizerOptimization:
    """Test summarizer call optimization."""
    
    def test_skip_summarizer_for_simple_response(self):
        """Short, complete responses should skip summarizer."""
        from services.openai_wrapper import should_call_summarizer
        
        simple_response = "Found 5 properties matching your criteria."
        
        assert should_call_summarizer(simple_response, property_count=5) == False
    
    def test_call_summarizer_for_long_list(self):
        """Long property lists should use summarizer."""
        from services.openai_wrapper import should_call_summarizer
        
        long_response = "Here are 25 properties..." + "Property " * 100
        
        assert should_call_summarizer(long_response, property_count=25) == True


if __name__ == "__main__":
    pytest.main([__file__, "-v", "--tb=short"])
