"""
Test Response Contract Enforcement

This test ensures that the response_text is ALWAYS present when properties exist,
preventing chat UX breakage from summarizer failures.

Test Coverage:
1. Properties exist + empty response_text → Fallback generated
2. Properties exist + valid response_text → No modification
3. No properties + empty response_text → No fallback (expected)
"""

import pytest
from unittest.mock import MagicMock, patch
from services.chatbot_orchestrator import enforce_response_contract


class TestResponseContractEnforcement:
    """Test suite for response contract enforcement"""
    
    def test_contract_violation_generates_fallback(self):
        """
        TEST: When properties exist but response_text is empty,
        enforce_response_contract generates a fallback response.
        """
        # GIVEN: Properties exist but summarizer returned empty response_text
        summarizer_result = {
            "response_text": "",  # Empty - contract violation
            "suggestions": []
        }
        
        properties = [
            {"mls_number": "12345", "price": "$500,000", "address": "123 Main St"},
            {"mls_number": "67890", "price": "$600,000", "address": "456 Oak Ave"}
        ]
        
        active_filters = {
            "location": "Toronto"
        }
        
        # WHEN: Enforce response contract
        result = enforce_response_contract(summarizer_result, properties, active_filters)
        
        # THEN: Fallback response should be generated
        assert result["response_text"], "response_text should not be empty"
        assert "2 properties" in result["response_text"], "Should mention property count"
        assert "Toronto" in result["response_text"], "Should mention location"
        assert "Want to refine?" in result["response_text"], "Should suggest refinement"
        
        # THEN: Suggestions should be populated
        assert len(result["suggestions"]) > 0, "Should have fallback suggestions"
    
    def test_contract_violation_with_none_response(self):
        """
        TEST: When properties exist but response_text is None,
        enforce_response_contract generates a fallback response.
        """
        # GIVEN: Properties exist but response_text is None
        summarizer_result = {
            "response_text": None,  # None - contract violation
            "suggestions": ["Some suggestion"]
        }
        
        properties = [
            {"mls_number": "11111", "price": "$450,000", "address": "789 Elm St"}
        ]
        
        active_filters = {
            "city": "Mississauga"
        }
        
        # WHEN: Enforce response contract
        result = enforce_response_contract(summarizer_result, properties, active_filters)
        
        # THEN: Fallback response should be generated
        assert result["response_text"], "response_text should not be None"
        assert "1 property" in result["response_text"], "Should use singular 'property'"
        assert "Mississauga" in result["response_text"], "Should extract city from filters"
        
        # THEN: Original suggestions should be preserved
        assert "Some suggestion" in result["suggestions"], "Should keep original suggestions"
    
    def test_valid_response_unchanged(self):
        """
        TEST: When properties exist AND response_text is valid,
        enforce_response_contract does NOT modify the response.
        """
        # GIVEN: Valid response with properties
        original_response = "Here are some great properties I found for you!"
        summarizer_result = {
            "response_text": original_response,
            "suggestions": ["View details", "Refine search"]
        }
        
        properties = [
            {"mls_number": "22222", "price": "$700,000", "address": "321 Pine Rd"}
        ]
        
        active_filters = {"location": "Ottawa"}
        
        # WHEN: Enforce response contract
        result = enforce_response_contract(summarizer_result, properties, active_filters)
        
        # THEN: Original response should be unchanged
        assert result["response_text"] == original_response, "Should not modify valid response"
        assert len(result["suggestions"]) == 2, "Should keep original suggestions"
    
    def test_no_properties_no_fallback(self):
        """
        TEST: When NO properties exist and response_text is empty,
        enforce_response_contract does NOT generate a fallback.
        (Empty response is valid when there are no properties)
        """
        # GIVEN: No properties and empty response
        summarizer_result = {
            "response_text": "",
            "suggestions": []
        }
        
        properties = []  # No properties
        active_filters = {"location": "Vancouver"}
        
        # WHEN: Enforce response contract
        result = enforce_response_contract(summarizer_result, properties, active_filters)
        
        # THEN: Response should remain empty (no contract violation)
        # The summarizer should handle "no results" messaging separately
        assert result["response_text"] == "", "Should not generate fallback when no properties"
    
    def test_fallback_with_location_state(self):
        """
        TEST: Fallback response correctly extracts location from location_state
        """
        # GIVEN: Contract violation with location in location_state
        summarizer_result = {
            "response_text": "",
            "suggestions": []
        }
        
        properties = [
            {"mls_number": "33333", "price": "$800,000", "address": "555 Cedar St"}
        ]
        
        active_filters = {
            "location_state": {
                "city": "North York",
                "postal_code": "M2N"
            }
        }
        
        # WHEN: Enforce response contract
        result = enforce_response_contract(summarizer_result, properties, active_filters)
        
        # THEN: Should extract city from location_state
        assert "North York" in result["response_text"], "Should extract location from location_state"
    
    def test_fallback_with_default_location(self):
        """
        TEST: Fallback uses "your search area" when no location is available
        """
        # GIVEN: Contract violation with no location in filters
        summarizer_result = {
            "response_text": "",
            "suggestions": []
        }
        
        properties = [
            {"mls_number": "44444", "price": "$550,000", "address": "999 Maple Ave"}
        ]
        
        active_filters = {}  # No location
        
        # WHEN: Enforce response contract
        result = enforce_response_contract(summarizer_result, properties, active_filters)
        
        # THEN: Should use default location text
        assert "your search area" in result["response_text"], "Should use default location when none provided"
    
    def test_whitespace_response_treated_as_empty(self):
        """
        TEST: Response with only whitespace is treated as empty
        """
        # GIVEN: Response with only whitespace
        summarizer_result = {
            "response_text": "   \n\t  ",  # Only whitespace
            "suggestions": []
        }
        
        properties = [
            {"mls_number": "55555", "price": "$900,000", "address": "777 Birch Ln"}
        ]
        
        active_filters = {"location": "Brampton"}
        
        # WHEN: Enforce response contract
        result = enforce_response_contract(summarizer_result, properties, active_filters)
        
        # THEN: Fallback should be generated (whitespace = empty)
        assert result["response_text"].strip(), "Whitespace should trigger fallback"
        assert "Brampton" in result["response_text"], "Should generate proper fallback"


class TestResponseContractIntegration:
    """Integration test with the full chatbot orchestrator"""
    
    @pytest.mark.integration
    @patch('services.chatbot_orchestrator.enhanced_mls_service.search_properties')
    @patch('services.chatbot_orchestrator.ask_gpt_summarizer')
    def test_orchestrator_enforces_contract(
        self,
        mock_summarizer,
        mock_mls_search
    ):
        """
        INTEGRATION TEST: Verify orchestrator enforces contract in full pipeline
        """
        from services.chatbot_orchestrator import ChatGPTChatbot
        
        # GIVEN: MLS returns properties but summarizer fails (empty response)
        mock_mls_search.return_value = {
            'success': True,
            'results': [
                {"mls_number": "TEST123", "price": "$400,000", "address": "123 Test St"}
            ],
            'total': 1
        }
        
        # Summarizer returns empty response (contract violation)
        mock_summarizer.return_value = {
            "response_text": "",  # Empty - should trigger fallback
            "suggestions": []
        }
        
        # WHEN: Process a search message
        chatbot = ChatGPTChatbot()
        result = chatbot.process_message(
            user_message="Show me properties in Toronto",
            session_id="test_session_contract_enforcement"
        )
        
        # THEN: Response should have fallback text (contract enforced)
        assert result["success"], "Request should succeed"
        assert result["response"], "Response should not be empty"
        assert "1 property" in result["response"] or "properties" in result["response"], \
            "Response should mention properties found"
        assert len(result["properties"]) == 1, "Should return the property"
        
        # THEN: Should not be the original empty response
        assert result["response"] != "", "Contract enforcement should prevent empty response"


if __name__ == "__main__":
    pytest.main([__file__, "-v", "--tb=short"])
