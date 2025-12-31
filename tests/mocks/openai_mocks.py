"""
Mock Utilities for Open AI Testing
===================================

Shared mock factories and utilities for testing Open AI wrapper and chatbot orchestrator.
These mocks prevent any real API calls during testing.

Author: Summitly Team
Date: December 26, 2025
"""

import json
from typing import Dict, Any, Optional, List
from unittest.mock import Mock, MagicMock, patch
from dataclasses import dataclass


# =============================================================================
# MOCK RESPONSE FACTORIES
# =============================================================================

def create_mock_openai_response(
    content: str,
    prompt_tokens: int = 100,
    completion_tokens: int = 50,
    model: str = "gpt-4o-mini"
) -> Mock:
    """
    Create a mock OpenAI API response object.
    
    Args:
        content: The response content (usually JSON string)
        prompt_tokens: Token count for prompt
        completion_tokens: Token count for completion
        model: Model name
        
    Returns:
        Mock object simulating openai.ChatCompletion response
    """
    mock_response = Mock()
    mock_response.choices = [Mock()]
    mock_response.choices[0].message = Mock()
    mock_response.choices[0].message.content = content
    mock_response.usage = Mock()
    mock_response.usage.prompt_tokens = prompt_tokens
    mock_response.usage.completion_tokens = completion_tokens
    mock_response.model = model
    return mock_response


def create_empty_response() -> Mock:
    """Create a mock with empty content (simulates GPT-5 empty response issue)."""
    mock_response = Mock()
    mock_response.choices = [Mock()]
    mock_response.choices[0].message = Mock()
    mock_response.choices[0].message.content = ""
    mock_response.usage = Mock()
    mock_response.usage.prompt_tokens = 0
    mock_response.usage.completion_tokens = 0
    return mock_response


def create_none_content_response() -> Mock:
    """Create a mock with None content."""
    mock_response = Mock()
    mock_response.choices = [Mock()]
    mock_response.choices[0].message = Mock()
    mock_response.choices[0].message.content = None
    mock_response.usage = Mock()
    mock_response.usage.prompt_tokens = 0
    mock_response.usage.completion_tokens = 0
    return mock_response


# =============================================================================
# MOCK INTERPRETER RESPONSES
# =============================================================================

@dataclass
class MockInterpreterResponse:
    """Pre-built interpreter responses for testing."""
    
    @staticmethod
    def search_toronto_condos() -> str:
        """Response for: 'Show me 2 bedroom condos in Toronto under $750k'"""
        return json.dumps({
            "intent": "search",
            "filters": {
                "location": "Toronto",
                "property_type": "condo",
                "bedrooms": 2,
                "bathrooms": None,
                "min_price": None,
                "max_price": 750000,
                "listing_type": "sale",
                "amenities": []
            },
            "merge_with_previous": False,
            "clarifying_question": None
        })
    
    @staticmethod
    def refinement_pool_parking() -> str:
        """Response for: 'What about ones with parking and a pool?'"""
        return json.dumps({
            "intent": "refine",
            "filters": {
                "amenities": ["parking", "pool"]
            },
            "merge_with_previous": True,
            "clarifying_question": None
        })
    
    @staticmethod
    def location_change_ottawa() -> str:
        """Response for: 'Actually make it Ottawa instead'"""
        return json.dumps({
            "intent": "search",
            "filters": {
                "location": "Ottawa"
            },
            "merge_with_previous": False,
            "clarifying_question": None
        })
    
    @staticmethod
    def property_type_townhouse() -> str:
        """Response for: 'Only townhouses, no condos'"""
        return json.dumps({
            "intent": "refine",
            "filters": {
                "property_type": "townhouse"
            },
            "merge_with_previous": True,
            "clarifying_question": None
        })
    
    @staticmethod
    def high_budget_vancouver() -> str:
        """Response for: 'Between $2 and $3 million in Vancouver'"""
        return json.dumps({
            "intent": "search",
            "filters": {
                "location": "Vancouver",
                "min_price": 2000000,
                "max_price": 3000000,
                "listing_type": "sale"
            },
            "merge_with_previous": False,
            "clarifying_question": None
        })
    
    @staticmethod
    def greeting() -> str:
        """Response for: 'Hi'"""
        return json.dumps({
            "intent": "general_question",
            "filters": {},
            "merge_with_previous": True,
            "clarifying_question": None
        })
    
    @staticmethod
    def help_request() -> str:
        """Response for: 'What can you help me with?'"""
        return json.dumps({
            "intent": "general_question",
            "filters": {},
            "merge_with_previous": True,
            "clarifying_question": None
        })
    
    @staticmethod
    def market_question() -> str:
        """Response for: 'How is the real estate market in Mississauga?'"""
        return json.dumps({
            "intent": "general_question",
            "filters": {
                "location": "Mississauga"
            },
            "merge_with_previous": True,
            "clarifying_question": None
        })
    
    @staticmethod
    def reset() -> str:
        """Response for: 'Reset everything'"""
        return json.dumps({
            "intent": "reset",
            "filters": {},
            "merge_with_previous": False,
            "clarifying_question": None
        })
    
    @staticmethod
    def cheaper_downtown() -> str:
        """Response for: 'I want something cheaper but still downtown'"""
        return json.dumps({
            "intent": "refine",
            "filters": {
                "community": "Downtown Core"
            },
            "merge_with_previous": True,
            "clarifying_question": "What's your maximum budget?"
        })


# =============================================================================
# MOCK SUMMARIZER RESPONSES
# =============================================================================

@dataclass
class MockSummarizerResponse:
    """Pre-built summarizer responses for testing."""
    
    @staticmethod
    def found_properties(count: int = 15) -> str:
        """Response when properties are found."""
        return json.dumps({
            "response_text": f"I found {count} properties matching your criteria in Toronto! Here are some great options for you to explore.",
            "suggestions": [
                "Filter by price range",
                "Show only with parking",
                "View on map"
            ],
            "properties_summary": [],
            "enhanced_mode": True
        })
    
    @staticmethod
    def no_properties() -> str:
        """Response when no properties are found."""
        return json.dumps({
            "response_text": "I couldn't find any properties matching those exact criteria. Try adjusting your filters or expanding your search area.",
            "suggestions": [
                "Increase budget range",
                "Try a different location",
                "Consider other property types"
            ],
            "properties_summary": [],
            "enhanced_mode": True
        })
    
    @staticmethod
    def greeting_response() -> str:
        """Response for greetings."""
        return json.dumps({
            "response_text": "Hello! 👋 I'm your Canadian real estate assistant. I can help you find properties in Toronto, the GTA, and across Canada. What kind of property are you looking for today?",
            "suggestions": [
                "Find condos in Toronto",
                "Search houses in Mississauga",
                "Show me rentals"
            ],
            "properties_summary": [],
            "enhanced_mode": True
        })
    
    @staticmethod
    def help_response() -> str:
        """Response for help requests."""
        return json.dumps({
            "response_text": "I can help you with:\n• Finding properties for sale or rent\n• Property valuations\n• Market insights\n• Neighborhood information\n\nJust tell me what you're looking for!",
            "suggestions": [
                "Search for condos",
                "Get a property valuation",
                "Learn about Toronto neighborhoods"
            ],
            "properties_summary": [],
            "enhanced_mode": True
        })


# =============================================================================
# MOCK LOCATION EXTRACTOR RESPONSES
# =============================================================================

@dataclass
class MockLocationResponse:
    """Pre-built location extractor responses."""
    
    @staticmethod
    def toronto() -> str:
        return json.dumps({
            "city": "Toronto",
            "community": None,
            "neighborhood": None,
            "postalCode": None,
            "streetName": None,
            "streetNumber": None
        })
    
    @staticmethod
    def ottawa() -> str:
        return json.dumps({
            "city": "Ottawa",
            "community": None,
            "neighborhood": None,
            "postalCode": None,
            "streetName": None,
            "streetNumber": None
        })
    
    @staticmethod
    def downtown_toronto() -> str:
        return json.dumps({
            "city": "Toronto",
            "community": "Downtown Core",
            "neighborhood": None,
            "postalCode": None,
            "streetName": None,
            "streetNumber": None
        })


# =============================================================================
# MALFORMED RESPONSE FACTORIES
# =============================================================================

class MalformedResponses:
    """Factory for creating malformed responses for error handling tests."""
    
    @staticmethod
    def markdown_wrapped_json() -> str:
        """JSON wrapped in markdown code block."""
        return '```json\n{"intent": "search", "filters": {"location": "Toronto"}}\n```'
    
    @staticmethod
    def truncated_json() -> str:
        """JSON truncated mid-object."""
        return '{"intent": "search", "filters": {"location": "Toronto", "bedrooms": 2'
    
    @staticmethod
    def with_trailing_comma() -> str:
        """JSON with trailing comma."""
        return '{"intent": "search", "filters": {},}'
    
    @staticmethod
    def with_extra_text() -> str:
        """JSON surrounded by explanation text."""
        return 'Here is the result:\n{"intent": "search"}\nHope this helps!'
    
    @staticmethod
    def completely_invalid() -> str:
        """Not JSON at all."""
        return "I'm sorry, I don't understand the question."
    
    @staticmethod
    def unclosed_string() -> str:
        """JSON with unclosed string."""
        return '{"intent": "search", "response": "Hello'
    
    @staticmethod
    def nested_truncation() -> str:
        """Deeply nested truncated JSON."""
        return '{"intent": "search", "filters": {"location": "Toronto", "nested": {"deep": {"value": 1'


# =============================================================================
# MOCK OPENAI CLIENT CONTEXT MANAGER
# =============================================================================

class MockOpenAIClient:
    """
    Context manager for mocking OpenAI client in tests.
    
    Usage:
        with MockOpenAIClient(response_content='{"intent": "search"}') as mock:
            result = call_openai(messages)
            assert mock.call_count == 1
    """
    
    def __init__(
        self,
        response_content: str = '{"intent": "search"}',
        fail_count: int = 0,
        fail_exception: Exception = None
    ):
        """
        Args:
            response_content: JSON string to return
            fail_count: Number of times to fail before succeeding
            fail_exception: Exception to raise on failure
        """
        self.response_content = response_content
        self.fail_count = fail_count
        self.fail_exception = fail_exception or Exception("API Error")
        self._patch = None
        self._mock_client = None
        self._call_count = 0
    
    def __enter__(self):
        mock_response = create_mock_openai_response(self.response_content)
        
        self._mock_client = Mock()
        
        if self.fail_count > 0:
            # Create side effects: fail N times, then succeed
            effects = [self.fail_exception] * self.fail_count + [mock_response]
            self._mock_client.chat.completions.create.side_effect = effects
        else:
            self._mock_client.chat.completions.create.return_value = mock_response
        
        self._patch = patch('services.openai_wrapper.OpenAI', return_value=self._mock_client)
        self._patch.start()
        
        return self
    
    def __exit__(self, exc_type, exc_val, exc_tb):
        self._patch.stop()
        return False
    
    @property
    def call_count(self) -> int:
        """Number of times the API was called."""
        return self._mock_client.chat.completions.create.call_count
    
    @property
    def last_call_args(self) -> tuple:
        """Arguments from the last API call."""
        return self._mock_client.chat.completions.create.call_args


# =============================================================================
# TEST PROPERTY DATA
# =============================================================================

def get_mock_properties(count: int = 5) -> List[Dict[str, Any]]:
    """Generate mock property data for testing."""
    properties = []
    for i in range(count):
        properties.append({
            "id": f"MLS{100000 + i}",
            "mls_number": f"C{100000 + i}",
            "address": f"{100 + i} King Street West, Toronto, ON",
            "full_address": f"{100 + i} King Street West, Toronto, ON M5V 1K4",
            "price": f"${650000 + i * 50000:,}",
            "bedrooms": 2 + (i % 3),
            "bathrooms": 1 + (i % 2),
            "sqft": f"{800 + i * 100:,}",
            "property_type": ["Condo", "Townhouse", "Detached"][i % 3],
            "listing_type": "sale",
            "images": [f"https://cdn.repliers.io/IMG-MLS{100000 + i}_1.jpg"],
            "image": f"https://cdn.repliers.io/IMG-MLS{100000 + i}_1.jpg"
        })
    return properties


# =============================================================================
# SAMPLE MESSAGES FOR TESTING
# =============================================================================

def get_sample_messages(user_message: str = "Show me condos in Toronto") -> List[Dict[str, str]]:
    """Create sample message list for testing."""
    return [
        {"role": "system", "content": "You are a Canadian real estate assistant."},
        {"role": "user", "content": user_message}
    ]


# =============================================================================
# UX TEST PROMPTS
# =============================================================================

UX_TEST_PROMPTS = [
    {
        "id": 1,
        "prompt": "Show me 2 bedroom condos in Toronto under $750k",
        "expected_intent": "search",
        "expected_filters": {"location": "Toronto", "bedrooms": 2, "property_type": "condo", "max_price": 750000},
        "should_call_mls": True,
        "merge_with_previous": False
    },
    {
        "id": 2,
        "prompt": "What about ones with parking and a pool?",
        "expected_intent": "refine",
        "expected_filters": {"amenities": ["parking", "pool"]},
        "should_call_mls": True,
        "merge_with_previous": True
    },
    {
        "id": 3,
        "prompt": "Actually make it Ottawa instead",
        "expected_intent": "search",
        "expected_filters": {"location": "Ottawa"},
        "should_call_mls": True,
        "merge_with_previous": False
    },
    {
        "id": 4,
        "prompt": "Only townhouses, no condos",
        "expected_intent": "refine",
        "expected_filters": {"property_type": "townhouse"},
        "should_call_mls": True,
        "merge_with_previous": True
    },
    {
        "id": 5,
        "prompt": "Between $2 and $3 million in Vancouver",
        "expected_intent": "search",
        "expected_filters": {"location": "Vancouver", "min_price": 2000000, "max_price": 3000000},
        "should_call_mls": True,
        "merge_with_previous": False
    },
    {
        "id": 6,
        "prompt": "Hi",
        "expected_intent": "general_question",
        "expected_filters": {},
        "should_call_mls": False,
        "merge_with_previous": True
    },
    {
        "id": 7,
        "prompt": "What can you help me with?",
        "expected_intent": "general_question",
        "expected_filters": {},
        "should_call_mls": False,
        "merge_with_previous": True
    },
    {
        "id": 8,
        "prompt": "How is the real estate market in Mississauga?",
        "expected_intent": "general_question",
        "expected_filters": {"location": "Mississauga"},
        "should_call_mls": False,
        "merge_with_previous": True
    },
    {
        "id": 9,
        "prompt": "Reset everything",
        "expected_intent": "reset",
        "expected_filters": {},
        "should_call_mls": False,
        "merge_with_previous": False
    },
    {
        "id": 10,
        "prompt": "I want something cheaper but still downtown",
        "expected_intent": "refine",
        "expected_filters": {},
        "should_call_mls": True,
        "merge_with_previous": True
    }
]


# =============================================================================
# METRIC ASSERTION HELPERS
# =============================================================================

def assert_openai_call_count(metrics: Dict[str, Any], expected_count: int, message: str = ""):
    """Assert that OpenAI was called the expected number of times."""
    actual = metrics.get("total_calls", 0)
    assert actual == expected_count, f"{message}Expected {expected_count} OpenAI calls, got {actual}"


def assert_cache_hit(metrics: Dict[str, Any], expected: bool, message: str = ""):
    """Assert cache hit/miss status."""
    if expected:
        assert metrics.get("cache_hits", 0) > 0, f"{message}Expected cache hit but got miss"
    else:
        # Last call should be a miss
        assert metrics.get("cache_misses", 0) > 0 or metrics.get("total_calls", 0) == 0, \
            f"{message}Expected cache miss"


def assert_no_circuit_breaker_trip(metrics: Dict[str, Any], message: str = ""):
    """Assert circuit breaker didn't trip."""
    trips = metrics.get("circuit_breaker_trips", 0)
    assert trips == 0, f"{message}Circuit breaker tripped {trips} times"


def assert_latency_under(metrics: Dict[str, Any], max_ms: float, message: str = ""):
    """Assert average latency is under threshold."""
    avg = metrics.get("avg_latency_ms", 0)
    assert avg < max_ms, f"{message}Average latency {avg}ms exceeds max {max_ms}ms"
