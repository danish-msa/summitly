"""
Integration Tests for OpenAI Wrapper with Chatbot Orchestrator
================================================================

These tests verify that the OpenAI wrapper integrates correctly with
the chatbot_orchestrator.py and handles real conversation flows.

Tests cover:
1. Interpreter call flow
2. Summarizer optimization
3. Location extraction integration
4. Filter refinement across multiple turns
5. Error handling and fallbacks

Run with: pytest tests/test_openai_integration.py -v
"""

import pytest
import json
import os
from unittest.mock import Mock, patch, MagicMock

# Add parent directory to path
import sys
from pathlib import Path
sys.path.insert(0, str(Path(__file__).parent.parent))


# =============================================================================
# TEST FIXTURES
# =============================================================================

@pytest.fixture
def mock_interpreter_response():
    """Create a mock interpreter response."""
    def _create(intent="search", filters=None, merge=False):
        if filters is None:
            filters = {}
        return json.dumps({
            "intent": intent,
            "filters": filters,
            "merge_with_previous": merge,
            "clarifying_question": None
        })
    return _create


@pytest.fixture
def mock_summarizer_response():
    """Create a mock summarizer response."""
    def _create(summary="Here are 5 properties matching your criteria."):
        return summary
    return _create


@pytest.fixture
def mock_openai_client():
    """Create a mock OpenAI client."""
    mock = Mock()
    mock.chat.completions.create = Mock()
    return mock


# =============================================================================
# INTERPRETER INTEGRATION TESTS
# =============================================================================

class TestInterpreterIntegration:
    """Test interpreter integration with wrapper."""
    
    def test_interpreter_returns_parsed_json(self, mock_interpreter_response):
        """Test that interpreter returns properly parsed JSON."""
        from services.openai_wrapper import call_openai, reset_wrapper_state
        
        reset_wrapper_state()
        
        response_content = mock_interpreter_response(
            intent="search",
            filters={"location": "Toronto", "bedrooms": 2}
        )
        
        mock_response = Mock()
        mock_response.choices = [Mock()]
        mock_response.choices[0].message.content = response_content
        mock_response.usage = Mock()
        mock_response.usage.prompt_tokens = 100
        mock_response.usage.completion_tokens = 50
        
        with patch('openai.OpenAI') as MockOpenAI:
            mock_client = Mock()
            mock_client.chat.completions.create.return_value = mock_response
            MockOpenAI.return_value = mock_client
            
            result = call_openai(
                [{"role": "user", "content": "Show me 2 bedroom homes in Toronto"}],
                parse_json=True,
                temperature=0.0
            )
            
            assert result.success == True
            assert result.parsed_json["intent"] == "search"
            assert result.parsed_json["filters"]["location"] == "Toronto"
            assert result.parsed_json["filters"]["bedrooms"] == 2
    
    def test_interpreter_handles_refinement(self, mock_interpreter_response):
        """Test that interpreter correctly handles refinement requests."""
        from services.openai_wrapper import call_openai, reset_wrapper_state
        
        reset_wrapper_state()
        
        response_content = mock_interpreter_response(
            intent="refine",
            filters={"amenities": ["parking", "pool"]},
            merge=True
        )
        
        mock_response = Mock()
        mock_response.choices = [Mock()]
        mock_response.choices[0].message.content = response_content
        mock_response.usage = Mock()
        mock_response.usage.prompt_tokens = 100
        mock_response.usage.completion_tokens = 50
        
        with patch('openai.OpenAI') as MockOpenAI:
            mock_client = Mock()
            mock_client.chat.completions.create.return_value = mock_response
            MockOpenAI.return_value = mock_client
            
            result = call_openai(
                [{"role": "user", "content": "Add parking and a pool"}],
                parse_json=True,
                temperature=0.0
            )
            
            assert result.success == True
            assert result.parsed_json["intent"] == "refine"
            assert result.parsed_json["merge_with_previous"] == True
            assert "parking" in result.parsed_json["filters"]["amenities"]
    
    def test_interpreter_handles_reset_intent(self, mock_interpreter_response):
        """Test that interpreter correctly handles reset requests."""
        from services.openai_wrapper import call_openai, reset_wrapper_state
        
        reset_wrapper_state()
        
        response_content = mock_interpreter_response(
            intent="reset",
            filters={},
            merge=False
        )
        
        mock_response = Mock()
        mock_response.choices = [Mock()]
        mock_response.choices[0].message.content = response_content
        mock_response.usage = Mock()
        mock_response.usage.prompt_tokens = 100
        mock_response.usage.completion_tokens = 50
        
        with patch('openai.OpenAI') as MockOpenAI:
            mock_client = Mock()
            mock_client.chat.completions.create.return_value = mock_response
            MockOpenAI.return_value = mock_client
            
            result = call_openai(
                [{"role": "user", "content": "Reset everything"}],
                parse_json=True,
                temperature=0.0
            )
            
            assert result.success == True
            assert result.parsed_json["intent"] == "reset"


# =============================================================================
# SUMMARIZER INTEGRATION TESTS
# =============================================================================

class TestSummarizerIntegration:
    """Test summarizer optimization with wrapper."""
    
    def test_small_results_skip_summarizer(self):
        """Test that small result sets skip the summarizer."""
        from services.openai_wrapper import should_call_summarizer
        
        # Small result set (3 properties) - should NOT call summarizer
        should_call, reason = should_call_summarizer(
            properties_count=3,
            user_message="Show me condos in Toronto"
        )
        
        assert should_call == False  # Skip summarizer for small results
        assert "local_template" in reason or "<=5" in reason or reason == "use_local_template"
    
    def test_large_results_use_summarizer(self):
        """Test that large result sets use the summarizer."""
        from services.openai_wrapper import should_call_summarizer
        
        # Large result set (25 properties) - should call summarizer
        should_call, reason = should_call_summarizer(
            properties_count=25,
            user_message="Show me condos in Toronto"
        )
        
        assert should_call == True  # Use summarizer for large results
        assert "25" in reason or ">5" in reason
    
    def test_explanation_requests_use_summarizer(self):
        """Test that explanation requests always use summarizer."""
        from services.openai_wrapper import should_call_summarizer
        
        # Explanation request - should call summarizer even with small results
        should_call, reason = should_call_summarizer(
            properties_count=2,
            user_message="Explain the pricing in Toronto"
        )
        
        assert should_call == True  # Always use summarizer for explanations
        assert "explanation" in reason.lower()


# =============================================================================
# LOCATION EXTRACTION INTEGRATION TESTS
# =============================================================================

class TestLocationIntegration:
    """Test location extraction integration."""
    
    def test_location_extracted_from_search(self, mock_interpreter_response):
        """Test that location is correctly extracted from search requests."""
        from services.openai_wrapper import call_openai, reset_wrapper_state
        
        reset_wrapper_state()
        
        response_content = mock_interpreter_response(
            intent="search",
            filters={
                "location": "Vancouver",
                "min_price": 2000000,
                "max_price": 3000000
            }
        )
        
        mock_response = Mock()
        mock_response.choices = [Mock()]
        mock_response.choices[0].message.content = response_content
        mock_response.usage = Mock()
        mock_response.usage.prompt_tokens = 100
        mock_response.usage.completion_tokens = 50
        
        with patch('openai.OpenAI') as MockOpenAI:
            mock_client = Mock()
            mock_client.chat.completions.create.return_value = mock_response
            MockOpenAI.return_value = mock_client
            
            result = call_openai(
                [{"role": "user", "content": "Between $2 and $3 million in Vancouver"}],
                parse_json=True,
                temperature=0.0
            )
            
            assert result.success == True
            assert result.parsed_json["filters"]["location"] == "Vancouver"
            assert result.parsed_json["filters"]["min_price"] == 2000000


# =============================================================================
# MULTI-TURN CONVERSATION TESTS
# =============================================================================

class TestMultiTurnConversation:
    """Test multi-turn conversation handling."""
    
    def test_context_preserved_across_calls(self, mock_interpreter_response):
        """Test that conversation context is preserved."""
        from services.openai_wrapper import call_openai, reset_wrapper_state
        
        reset_wrapper_state()
        
        # First call - initial search
        response1 = mock_interpreter_response(
            intent="search",
            filters={"location": "Toronto", "property_type": "condo"}
        )
        
        mock_response1 = Mock()
        mock_response1.choices = [Mock()]
        mock_response1.choices[0].message.content = response1
        mock_response1.usage = Mock()
        mock_response1.usage.prompt_tokens = 100
        mock_response1.usage.completion_tokens = 50
        
        # Second call - refinement
        response2 = mock_interpreter_response(
            intent="refine",
            filters={"bedrooms": 2},
            merge=True
        )
        
        mock_response2 = Mock()
        mock_response2.choices = [Mock()]
        mock_response2.choices[0].message.content = response2
        mock_response2.usage = Mock()
        mock_response2.usage.prompt_tokens = 150
        mock_response2.usage.completion_tokens = 50
        
        with patch('openai.OpenAI') as MockOpenAI:
            mock_client = Mock()
            mock_client.chat.completions.create.side_effect = [mock_response1, mock_response2]
            MockOpenAI.return_value = mock_client
            
            # First turn
            result1 = call_openai(
                [{"role": "user", "content": "Show me condos in Toronto"}],
                parse_json=True,
                temperature=0.0
            )
            
            # Second turn - with conversation history
            result2 = call_openai(
                [
                    {"role": "user", "content": "Show me condos in Toronto"},
                    {"role": "assistant", "content": "Here are condos in Toronto..."},
                    {"role": "user", "content": "Only 2 bedrooms please"}
                ],
                parse_json=True,
                temperature=0.0
            )
            
            assert result1.success == True
            assert result1.parsed_json["intent"] == "search"
            
            assert result2.success == True
            assert result2.parsed_json["intent"] == "refine"
            assert result2.parsed_json["merge_with_previous"] == True


# =============================================================================
# ERROR HANDLING INTEGRATION TESTS
# =============================================================================

class TestErrorHandlingIntegration:
    """Test error handling in integration scenarios."""
    
    def test_malformed_json_is_repaired(self):
        """Test that malformed JSON from OpenAI is repaired."""
        from services.openai_wrapper import call_openai, reset_wrapper_state
        
        reset_wrapper_state()
        
        # Malformed JSON with trailing comma
        malformed_response = '{"intent": "search", "filters": {"location": "Toronto",}}'
        
        mock_response = Mock()
        mock_response.choices = [Mock()]
        mock_response.choices[0].message.content = malformed_response
        mock_response.usage = Mock()
        mock_response.usage.prompt_tokens = 100
        mock_response.usage.completion_tokens = 50
        
        with patch('openai.OpenAI') as MockOpenAI:
            mock_client = Mock()
            mock_client.chat.completions.create.return_value = mock_response
            MockOpenAI.return_value = mock_client
            
            result = call_openai(
                [{"role": "user", "content": "Toronto homes"}],
                parse_json=True,
                temperature=0.0
            )
            
            assert result.success == True
            assert result.json_repaired == True
            assert result.parsed_json["intent"] == "search"
    
    def test_markdown_wrapped_json_extracted(self):
        """Test that JSON wrapped in markdown is extracted."""
        from services.openai_wrapper import call_openai, reset_wrapper_state
        
        reset_wrapper_state()
        
        # JSON wrapped in markdown code block
        markdown_response = '```json\n{"intent": "search", "filters": {}}\n```'
        
        mock_response = Mock()
        mock_response.choices = [Mock()]
        mock_response.choices[0].message.content = markdown_response
        mock_response.usage = Mock()
        mock_response.usage.prompt_tokens = 100
        mock_response.usage.completion_tokens = 50
        
        with patch('openai.OpenAI') as MockOpenAI:
            mock_client = Mock()
            mock_client.chat.completions.create.return_value = mock_response
            MockOpenAI.return_value = mock_client
            
            result = call_openai(
                [{"role": "user", "content": "Hi"}],
                parse_json=True,
                temperature=0.0
            )
            
            assert result.success == True
            assert result.parsed_json["intent"] == "search"
    
    def test_circuit_breaker_protects_service(self):
        """Test that circuit breaker protects against cascading failures."""
        from services.openai_wrapper import call_openai, circuit_breaker, reset_wrapper_state
        
        reset_wrapper_state()
        
        # Trip the circuit breaker
        for _ in range(5):
            circuit_breaker.record_failure()
        
        result = call_openai(
            [{"role": "user", "content": "Test"}],
            parse_json=True,
            temperature=0.0
        )
        
        assert result.success == False
        assert "circuit breaker" in result.error_message.lower()


# =============================================================================
# CACHING INTEGRATION TESTS
# =============================================================================

class TestCachingIntegration:
    """Test caching behavior in integration scenarios."""
    
    def test_identical_requests_cached(self):
        """Test that identical requests are cached."""
        from services.openai_wrapper import call_openai, response_cache, reset_wrapper_state
        
        reset_wrapper_state()
        
        response_content = '{"intent": "search", "filters": {"location": "Toronto"}}'
        
        mock_response = Mock()
        mock_response.choices = [Mock()]
        mock_response.choices[0].message.content = response_content
        mock_response.usage = Mock()
        mock_response.usage.prompt_tokens = 100
        mock_response.usage.completion_tokens = 50
        
        messages = [{"role": "user", "content": "Toronto condos"}]
        
        with patch('openai.OpenAI') as MockOpenAI:
            mock_client = Mock()
            mock_client.chat.completions.create.return_value = mock_response
            MockOpenAI.return_value = mock_client
            
            # First call - cache miss
            result1 = call_openai(messages, parse_json=True, temperature=0.0)
            
            # Second call - cache hit
            result2 = call_openai(messages, parse_json=True, temperature=0.0)
            
            assert result1.success == True
            assert result1.cache_hit == False
            
            assert result2.success == True
            assert result2.cache_hit == True
            
            # OpenAI should only be called once
            assert mock_client.chat.completions.create.call_count == 1
    
    def test_different_requests_not_cached(self):
        """Test that different requests are not cached."""
        from services.openai_wrapper import call_openai, reset_wrapper_state
        
        reset_wrapper_state()
        
        response1 = '{"intent": "search", "filters": {"location": "Toronto"}}'
        response2 = '{"intent": "search", "filters": {"location": "Vancouver"}}'
        
        mock_response1 = Mock()
        mock_response1.choices = [Mock()]
        mock_response1.choices[0].message.content = response1
        mock_response1.usage = Mock()
        mock_response1.usage.prompt_tokens = 100
        mock_response1.usage.completion_tokens = 50
        
        mock_response2 = Mock()
        mock_response2.choices = [Mock()]
        mock_response2.choices[0].message.content = response2
        mock_response2.usage = Mock()
        mock_response2.usage.prompt_tokens = 100
        mock_response2.usage.completion_tokens = 50
        
        with patch('openai.OpenAI') as MockOpenAI:
            mock_client = Mock()
            mock_client.chat.completions.create.side_effect = [mock_response1, mock_response2]
            MockOpenAI.return_value = mock_client
            
            result1 = call_openai(
                [{"role": "user", "content": "Toronto condos"}],
                parse_json=True,
                temperature=0.0
            )
            
            result2 = call_openai(
                [{"role": "user", "content": "Vancouver condos"}],
                parse_json=True,
                temperature=0.0
            )
            
            assert result1.parsed_json["filters"]["location"] == "Toronto"
            assert result2.parsed_json["filters"]["location"] == "Vancouver"
            
            # Both calls should hit OpenAI
            assert mock_client.chat.completions.create.call_count == 2


if __name__ == "__main__":
    pytest.main([__file__, "-v"])
