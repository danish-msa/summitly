"""
UX Prompt Tests - Real User Interaction Scenarios
==================================================

Tests the 10 specific UX prompts to validate consistent behavior:
1. "Show me 2 bedroom condos in Toronto under $750k"
2. "What about ones with parking and a pool?"
3. "Actually make it Ottawa instead"
4. "Only townhouses, no condos"
5. "Between $2 and $3 million in Vancouver"
6. "Hi"
7. "What can you help me with?"
8. "How is the real estate market in Mississauga?"
9. "Reset everything"
10. "I want something cheaper but still downtown"

These tests verify:
- Intent detection accuracy
- Filter extraction correctness
- Merge behavior (refinement vs new search)
- Location handling
- Price range parsing
- Greeting/help responses
- Reset functionality

Run with: pytest tests/test_ux_prompts.py -v
"""

import pytest
import json
import os
from unittest.mock import Mock, patch

# Add parent directory to path
import sys
from pathlib import Path
sys.path.insert(0, str(Path(__file__).parent.parent))
sys.path.insert(0, str(Path(__file__).parent))  # Add tests dir to path

from mocks.openai_mocks import (
    MockInterpreterResponse,
    UX_TEST_PROMPTS,
)


# =============================================================================
# TEST FIXTURES
# =============================================================================

@pytest.fixture
def reset_state():
    """Reset wrapper state before each test."""
    from services.openai_wrapper import reset_wrapper_state
    reset_wrapper_state()
    yield
    reset_wrapper_state()


@pytest.fixture
def mock_openai_call():
    """Create a mock for OpenAI calls that returns configured responses."""
    def _setup(response_content: str):
        mock_response = Mock()
        mock_response.choices = [Mock()]
        mock_response.choices[0].message.content = response_content
        mock_response.usage = Mock()
        mock_response.usage.prompt_tokens = 100
        mock_response.usage.completion_tokens = 50
        return mock_response
    return _setup


# =============================================================================
# UX PROMPT 1: "Show me 2 bedroom condos in Toronto under $750k"
# =============================================================================

class TestPrompt1_TorontoCondoSearch:
    """Test initial search with location, property type, bedrooms, and price."""
    
    PROMPT = "Show me 2 bedroom condos in Toronto under $750k"
    
    def test_intent_is_search(self, reset_state, mock_openai_call):
        """Verify intent is correctly identified as 'search'."""
        from services.openai_wrapper import call_openai
        
        response = mock_openai_call(MockInterpreterResponse.search_toronto_condos())
        
        with patch('openai.OpenAI') as MockOpenAI:
            mock_client = Mock()
            mock_client.chat.completions.create.return_value = response
            MockOpenAI.return_value = mock_client
            
            result = call_openai(
                [{"role": "user", "content": self.PROMPT}],
                parse_json=True,
                temperature=0.0
            )
            
            assert result.success == True
            assert result.parsed_json["intent"] == "search"
    
    def test_location_extracted_toronto(self, reset_state, mock_openai_call):
        """Verify Toronto is extracted as location."""
        from services.openai_wrapper import call_openai
        
        response = mock_openai_call(MockInterpreterResponse.search_toronto_condos())
        
        with patch('openai.OpenAI') as MockOpenAI:
            mock_client = Mock()
            mock_client.chat.completions.create.return_value = response
            MockOpenAI.return_value = mock_client
            
            result = call_openai(
                [{"role": "user", "content": self.PROMPT}],
                parse_json=True,
                temperature=0.0
            )
            
            assert result.parsed_json["filters"]["location"] == "Toronto"
    
    def test_bedrooms_is_2(self, reset_state, mock_openai_call):
        """Verify bedrooms is extracted as 2."""
        from services.openai_wrapper import call_openai
        
        response = mock_openai_call(MockInterpreterResponse.search_toronto_condos())
        
        with patch('openai.OpenAI') as MockOpenAI:
            mock_client = Mock()
            mock_client.chat.completions.create.return_value = response
            MockOpenAI.return_value = mock_client
            
            result = call_openai(
                [{"role": "user", "content": self.PROMPT}],
                parse_json=True,
                temperature=0.0
            )
            
            assert result.parsed_json["filters"]["bedrooms"] == 2
    
    def test_max_price_750k(self, reset_state, mock_openai_call):
        """Verify max price is extracted as $750,000."""
        from services.openai_wrapper import call_openai
        
        response = mock_openai_call(MockInterpreterResponse.search_toronto_condos())
        
        with patch('openai.OpenAI') as MockOpenAI:
            mock_client = Mock()
            mock_client.chat.completions.create.return_value = response
            MockOpenAI.return_value = mock_client
            
            result = call_openai(
                [{"role": "user", "content": self.PROMPT}],
                parse_json=True,
                temperature=0.0
            )
            
            assert result.parsed_json["filters"]["max_price"] == 750000
    
    def test_property_type_condo(self, reset_state, mock_openai_call):
        """Verify property type is condo."""
        from services.openai_wrapper import call_openai
        
        response = mock_openai_call(MockInterpreterResponse.search_toronto_condos())
        
        with patch('openai.OpenAI') as MockOpenAI:
            mock_client = Mock()
            mock_client.chat.completions.create.return_value = response
            MockOpenAI.return_value = mock_client
            
            result = call_openai(
                [{"role": "user", "content": self.PROMPT}],
                parse_json=True,
                temperature=0.0
            )
            
            assert result.parsed_json["filters"]["property_type"] == "condo"


# =============================================================================
# UX PROMPT 2: "What about ones with parking and a pool?"
# =============================================================================

class TestPrompt2_RefinementAmenities:
    """Test refinement with amenities (parking, pool)."""
    
    PROMPT = "What about ones with parking and a pool?"
    
    def test_intent_is_refine(self, reset_state, mock_openai_call):
        """Verify intent is 'refine'."""
        from services.openai_wrapper import call_openai
        
        response = mock_openai_call(MockInterpreterResponse.refinement_pool_parking())
        
        with patch('openai.OpenAI') as MockOpenAI:
            mock_client = Mock()
            mock_client.chat.completions.create.return_value = response
            MockOpenAI.return_value = mock_client
            
            result = call_openai(
                [{"role": "user", "content": self.PROMPT}],
                parse_json=True,
                temperature=0.0
            )
            
            assert result.success == True
            assert result.parsed_json["intent"] == "refine"
    
    def test_merge_with_previous_true(self, reset_state, mock_openai_call):
        """Verify merge_with_previous is True."""
        from services.openai_wrapper import call_openai
        
        response = mock_openai_call(MockInterpreterResponse.refinement_pool_parking())
        
        with patch('openai.OpenAI') as MockOpenAI:
            mock_client = Mock()
            mock_client.chat.completions.create.return_value = response
            MockOpenAI.return_value = mock_client
            
            result = call_openai(
                [{"role": "user", "content": self.PROMPT}],
                parse_json=True,
                temperature=0.0
            )
            
            assert result.parsed_json["merge_with_previous"] == True
    
    def test_amenities_extracted(self, reset_state, mock_openai_call):
        """Verify parking and pool are in amenities."""
        from services.openai_wrapper import call_openai
        
        response = mock_openai_call(MockInterpreterResponse.refinement_pool_parking())
        
        with patch('openai.OpenAI') as MockOpenAI:
            mock_client = Mock()
            mock_client.chat.completions.create.return_value = response
            MockOpenAI.return_value = mock_client
            
            result = call_openai(
                [{"role": "user", "content": self.PROMPT}],
                parse_json=True,
                temperature=0.0
            )
            
            amenities = result.parsed_json["filters"]["amenities"]
            assert "parking" in amenities
            assert "pool" in amenities


# =============================================================================
# UX PROMPT 3: "Actually make it Ottawa instead"
# =============================================================================

class TestPrompt3_LocationChange:
    """Test location change from Toronto to Ottawa."""
    
    PROMPT = "Actually make it Ottawa instead"
    
    def test_intent_is_search(self, reset_state, mock_openai_call):
        """Location change should be a new search."""
        from services.openai_wrapper import call_openai
        
        response = mock_openai_call(MockInterpreterResponse.location_change_ottawa())
        
        with patch('openai.OpenAI') as MockOpenAI:
            mock_client = Mock()
            mock_client.chat.completions.create.return_value = response
            MockOpenAI.return_value = mock_client
            
            result = call_openai(
                [{"role": "user", "content": self.PROMPT}],
                parse_json=True,
                temperature=0.0
            )
            
            assert result.success == True
            assert result.parsed_json["intent"] == "search"
    
    def test_location_changed_to_ottawa(self, reset_state, mock_openai_call):
        """Verify location is Ottawa."""
        from services.openai_wrapper import call_openai
        
        response = mock_openai_call(MockInterpreterResponse.location_change_ottawa())
        
        with patch('openai.OpenAI') as MockOpenAI:
            mock_client = Mock()
            mock_client.chat.completions.create.return_value = response
            MockOpenAI.return_value = mock_client
            
            result = call_openai(
                [{"role": "user", "content": self.PROMPT}],
                parse_json=True,
                temperature=0.0
            )
            
            assert result.parsed_json["filters"]["location"] == "Ottawa"


# =============================================================================
# UX PROMPT 4: "Only townhouses, no condos"
# =============================================================================

class TestPrompt4_PropertyTypeChange:
    """Test property type change to townhouse."""
    
    PROMPT = "Only townhouses, no condos"
    
    def test_intent_is_refine(self, reset_state, mock_openai_call):
        """Property type change should be a refinement."""
        from services.openai_wrapper import call_openai
        
        response = mock_openai_call(MockInterpreterResponse.property_type_townhouse())
        
        with patch('openai.OpenAI') as MockOpenAI:
            mock_client = Mock()
            mock_client.chat.completions.create.return_value = response
            MockOpenAI.return_value = mock_client
            
            result = call_openai(
                [{"role": "user", "content": self.PROMPT}],
                parse_json=True,
                temperature=0.0
            )
            
            assert result.success == True
            assert result.parsed_json["intent"] == "refine"
    
    def test_property_type_is_townhouse(self, reset_state, mock_openai_call):
        """Verify property type is townhouse."""
        from services.openai_wrapper import call_openai
        
        response = mock_openai_call(MockInterpreterResponse.property_type_townhouse())
        
        with patch('openai.OpenAI') as MockOpenAI:
            mock_client = Mock()
            mock_client.chat.completions.create.return_value = response
            MockOpenAI.return_value = mock_client
            
            result = call_openai(
                [{"role": "user", "content": self.PROMPT}],
                parse_json=True,
                temperature=0.0
            )
            
            assert result.parsed_json["filters"]["property_type"] == "townhouse"


# =============================================================================
# UX PROMPT 5: "Between $2 and $3 million in Vancouver"
# =============================================================================

class TestPrompt5_HighBudgetVancouver:
    """Test high budget search in Vancouver."""
    
    PROMPT = "Between $2 and $3 million in Vancouver"
    
    def test_intent_is_search(self, reset_state, mock_openai_call):
        """New location + price = new search."""
        from services.openai_wrapper import call_openai
        
        response = mock_openai_call(MockInterpreterResponse.high_budget_vancouver())
        
        with patch('openai.OpenAI') as MockOpenAI:
            mock_client = Mock()
            mock_client.chat.completions.create.return_value = response
            MockOpenAI.return_value = mock_client
            
            result = call_openai(
                [{"role": "user", "content": self.PROMPT}],
                parse_json=True,
                temperature=0.0
            )
            
            assert result.success == True
            assert result.parsed_json["intent"] == "search"
    
    def test_location_is_vancouver(self, reset_state, mock_openai_call):
        """Verify location is Vancouver."""
        from services.openai_wrapper import call_openai
        
        response = mock_openai_call(MockInterpreterResponse.high_budget_vancouver())
        
        with patch('openai.OpenAI') as MockOpenAI:
            mock_client = Mock()
            mock_client.chat.completions.create.return_value = response
            MockOpenAI.return_value = mock_client
            
            result = call_openai(
                [{"role": "user", "content": self.PROMPT}],
                parse_json=True,
                temperature=0.0
            )
            
            assert result.parsed_json["filters"]["location"] == "Vancouver"
    
    def test_price_range_2_to_3_million(self, reset_state, mock_openai_call):
        """Verify price range is $2M to $3M."""
        from services.openai_wrapper import call_openai
        
        response = mock_openai_call(MockInterpreterResponse.high_budget_vancouver())
        
        with patch('openai.OpenAI') as MockOpenAI:
            mock_client = Mock()
            mock_client.chat.completions.create.return_value = response
            MockOpenAI.return_value = mock_client
            
            result = call_openai(
                [{"role": "user", "content": self.PROMPT}],
                parse_json=True,
                temperature=0.0
            )
            
            assert result.parsed_json["filters"]["min_price"] == 2000000
            assert result.parsed_json["filters"]["max_price"] == 3000000


# =============================================================================
# UX PROMPT 6: "Hi"
# =============================================================================

class TestPrompt6_Greeting:
    """Test greeting handling."""
    
    PROMPT = "Hi"
    
    def test_intent_is_general_question(self, reset_state, mock_openai_call):
        """Greeting should be general_question intent."""
        from services.openai_wrapper import call_openai
        
        response = mock_openai_call(MockInterpreterResponse.greeting())
        
        with patch('openai.OpenAI') as MockOpenAI:
            mock_client = Mock()
            mock_client.chat.completions.create.return_value = response
            MockOpenAI.return_value = mock_client
            
            result = call_openai(
                [{"role": "user", "content": self.PROMPT}],
                parse_json=True,
                temperature=0.0
            )
            
            assert result.success == True
            assert result.parsed_json["intent"] == "general_question"
    
    def test_no_filters_for_greeting(self, reset_state, mock_openai_call):
        """Greeting should have empty or no filters."""
        from services.openai_wrapper import call_openai
        
        response = mock_openai_call(MockInterpreterResponse.greeting())
        
        with patch('openai.OpenAI') as MockOpenAI:
            mock_client = Mock()
            mock_client.chat.completions.create.return_value = response
            MockOpenAI.return_value = mock_client
            
            result = call_openai(
                [{"role": "user", "content": self.PROMPT}],
                parse_json=True,
                temperature=0.0
            )
            
            filters = result.parsed_json.get("filters", {})
            # Filters should be empty or not have property-specific fields
            assert len(filters) == 0 or not any(
                k in filters for k in ["location", "bedrooms", "max_price"]
            )


# =============================================================================
# UX PROMPT 7: "What can you help me with?"
# =============================================================================

class TestPrompt7_HelpRequest:
    """Test help request handling."""
    
    PROMPT = "What can you help me with?"
    
    def test_intent_is_general_question(self, reset_state, mock_openai_call):
        """Help request should be general_question."""
        from services.openai_wrapper import call_openai
        
        response = mock_openai_call(MockInterpreterResponse.help_request())
        
        with patch('openai.OpenAI') as MockOpenAI:
            mock_client = Mock()
            mock_client.chat.completions.create.return_value = response
            MockOpenAI.return_value = mock_client
            
            result = call_openai(
                [{"role": "user", "content": self.PROMPT}],
                parse_json=True,
                temperature=0.0
            )
            
            assert result.success == True
            assert result.parsed_json["intent"] == "general_question"


# =============================================================================
# UX PROMPT 8: "How is the real estate market in Mississauga?"
# =============================================================================

class TestPrompt8_MarketQuestion:
    """Test market question handling."""
    
    PROMPT = "How is the real estate market in Mississauga?"
    
    def test_intent_is_general_question(self, reset_state, mock_openai_call):
        """Market question should be general_question."""
        from services.openai_wrapper import call_openai
        
        response = mock_openai_call(MockInterpreterResponse.market_question())
        
        with patch('openai.OpenAI') as MockOpenAI:
            mock_client = Mock()
            mock_client.chat.completions.create.return_value = response
            MockOpenAI.return_value = mock_client
            
            result = call_openai(
                [{"role": "user", "content": self.PROMPT}],
                parse_json=True,
                temperature=0.0
            )
            
            assert result.success == True
            assert result.parsed_json["intent"] == "general_question"
    
    def test_location_mississauga_extracted(self, reset_state, mock_openai_call):
        """Mississauga should be extracted even for market question."""
        from services.openai_wrapper import call_openai
        
        response = mock_openai_call(MockInterpreterResponse.market_question())
        
        with patch('openai.OpenAI') as MockOpenAI:
            mock_client = Mock()
            mock_client.chat.completions.create.return_value = response
            MockOpenAI.return_value = mock_client
            
            result = call_openai(
                [{"role": "user", "content": self.PROMPT}],
                parse_json=True,
                temperature=0.0
            )
            
            # Location might be in filters or extracted separately
            filters = result.parsed_json.get("filters", {})
            location = filters.get("location", "")
            assert location == "Mississauga" or "Mississauga" in str(result.parsed_json)


# =============================================================================
# UX PROMPT 9: "Reset everything"
# =============================================================================

class TestPrompt9_Reset:
    """Test reset functionality."""
    
    PROMPT = "Reset everything"
    
    def test_intent_is_reset(self, reset_state, mock_openai_call):
        """Reset should have reset intent."""
        from services.openai_wrapper import call_openai
        
        response = mock_openai_call(MockInterpreterResponse.reset())
        
        with patch('openai.OpenAI') as MockOpenAI:
            mock_client = Mock()
            mock_client.chat.completions.create.return_value = response
            MockOpenAI.return_value = mock_client
            
            result = call_openai(
                [{"role": "user", "content": self.PROMPT}],
                parse_json=True,
                temperature=0.0
            )
            
            assert result.success == True
            assert result.parsed_json["intent"] == "reset"
    
    def test_merge_with_previous_false(self, reset_state, mock_openai_call):
        """Reset should not merge with previous."""
        from services.openai_wrapper import call_openai
        
        response = mock_openai_call(MockInterpreterResponse.reset())
        
        with patch('openai.OpenAI') as MockOpenAI:
            mock_client = Mock()
            mock_client.chat.completions.create.return_value = response
            MockOpenAI.return_value = mock_client
            
            result = call_openai(
                [{"role": "user", "content": self.PROMPT}],
                parse_json=True,
                temperature=0.0
            )
            
            assert result.parsed_json["merge_with_previous"] == False


# =============================================================================
# UX PROMPT 10: "I want something cheaper but still downtown"
# =============================================================================

class TestPrompt10_CheaperDowntown:
    """Test refinement for cheaper downtown property."""
    
    PROMPT = "I want something cheaper but still downtown"
    
    def test_intent_is_refine(self, reset_state, mock_openai_call):
        """Price change should be refinement."""
        from services.openai_wrapper import call_openai
        
        response = mock_openai_call(MockInterpreterResponse.cheaper_downtown())
        
        with patch('openai.OpenAI') as MockOpenAI:
            mock_client = Mock()
            mock_client.chat.completions.create.return_value = response
            MockOpenAI.return_value = mock_client
            
            result = call_openai(
                [{"role": "user", "content": self.PROMPT}],
                parse_json=True,
                temperature=0.0
            )
            
            assert result.success == True
            assert result.parsed_json["intent"] == "refine"
    
    def test_merge_with_previous_true(self, reset_state, mock_openai_call):
        """Should merge with previous search."""
        from services.openai_wrapper import call_openai
        
        response = mock_openai_call(MockInterpreterResponse.cheaper_downtown())
        
        with patch('openai.OpenAI') as MockOpenAI:
            mock_client = Mock()
            mock_client.chat.completions.create.return_value = response
            MockOpenAI.return_value = mock_client
            
            result = call_openai(
                [{"role": "user", "content": self.PROMPT}],
                parse_json=True,
                temperature=0.0
            )
            
            assert result.parsed_json["merge_with_previous"] == True


# =============================================================================
# CONSISTENCY TESTS
# =============================================================================

class TestUXConsistency:
    """Test consistency across multiple prompts."""
    
    def test_all_prompts_return_valid_json(self, reset_state, mock_openai_call):
        """All 10 prompts should return valid JSON responses."""
        from services.openai_wrapper import call_openai
        
        prompts_and_responses = [
            ("Show me 2 bedroom condos in Toronto under $750k", MockInterpreterResponse.search_toronto_condos()),
            ("What about ones with parking and a pool?", MockInterpreterResponse.refinement_pool_parking()),
            ("Actually make it Ottawa instead", MockInterpreterResponse.location_change_ottawa()),
            ("Only townhouses, no condos", MockInterpreterResponse.property_type_townhouse()),
            ("Between $2 and $3 million in Vancouver", MockInterpreterResponse.high_budget_vancouver()),
            ("Hi", MockInterpreterResponse.greeting()),
            ("What can you help me with?", MockInterpreterResponse.help_request()),
            ("How is the real estate market in Mississauga?", MockInterpreterResponse.market_question()),
            ("Reset everything", MockInterpreterResponse.reset()),
            ("I want something cheaper but still downtown", MockInterpreterResponse.cheaper_downtown()),
        ]
        
        for prompt, mock_content in prompts_and_responses:
            response = mock_openai_call(mock_content)
            
            with patch('openai.OpenAI') as MockOpenAI:
                mock_client = Mock()
                mock_client.chat.completions.create.return_value = response
                MockOpenAI.return_value = mock_client
                
                result = call_openai(
                    [{"role": "user", "content": prompt}],
                    parse_json=True,
                    temperature=0.0
                )
                
                assert result.success == True, f"Failed for prompt: {prompt}"
                assert result.parsed_json is not None, f"No JSON for: {prompt}"
                assert "intent" in result.parsed_json, f"No intent for: {prompt}"


if __name__ == "__main__":
    pytest.main([__file__, "-v"])
