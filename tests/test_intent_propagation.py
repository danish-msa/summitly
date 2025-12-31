"""
Test Intent Propagation

This test ensures that the intent from hybrid_intent_classifier
is properly stored and propagated through the entire system.

The classifier is the SINGLE source of truth for intent detection.
"""

import pytest
from unittest.mock import MagicMock, patch
from services.chatbot_orchestrator import ChatGPTChatbot
from services.hybrid_intent_classifier import UserIntent


class TestIntentPropagation:
    """Test that intent from classifier propagates correctly"""
    
    def setup_method(self):
        """Clean up Redis sessions before each test"""
        from services.chatbot_orchestrator import state_manager
        # Clear any existing sessions to avoid cache hits
        test_sessions = [
            "test_intent_prop_123",
            "test_intent_state_456",
            "test_off_topic_789",
            "test_no_overwrite_321",
            "test_persistence_654"
        ]
        for session_id in test_sessions:
            try:
                state_manager._redis.delete(f"session:{session_id}")
            except:
                pass  # If Redis isn't available, tests will use in-memory
    
    @patch('services.chatbot_orchestrator.enhanced_mls_service.search_properties')
    @patch('services.chatbot_orchestrator.ask_gpt_summarizer')
    @patch('services.chatbot_orchestrator.ask_gpt_interpreter')
    @patch('services.chatbot_orchestrator.intent_classifier.classify')
    def test_detected_intent_matches_classifier(
        self,
        mock_classify,
        mock_interpreter,
        mock_summarizer,
        mock_mls_search
    ):
        """
        TEST: detected_intent in API response matches hybrid_intent_classifier output
        """
        # GIVEN: Classifier returns PROPERTY_SEARCH intent
        mock_classify.return_value = (
            UserIntent.PROPERTY_SEARCH,
            {
                'confidence': 0.95,
                'reason': 'explicit_search_keywords',
                'cache_hit': False,
                'used_gpt_fallback': False
            }
        )
        
        # Mock interpreter (should not affect detected_intent)
        mock_interpreter.return_value = {
            'intent': 'valuation',  # Different from classifier - should be IGNORED
            'filters': {'location': 'Toronto'}
        }
        
        # Mock MLS search
        mock_mls_search.return_value = {
            'success': True,
            'results': [
                {'mls_number': '12345', 'price': '$500,000', 'address': '123 Main St'}
            ],
            'total': 1
        }
        
        # Mock summarizer
        mock_summarizer.return_value = {
            'response_text': 'Found properties in Toronto',
            'suggestions': ['Refine search']
        }
        
        # WHEN: Process a property search message
        chatbot = ChatGPTChatbot()
        result = chatbot.process_message(
            user_message="Show me properties in Toronto",
            session_id="test_intent_prop_123"
        )
        
        # THEN: detected_intent should match classifier output (PROPERTY_SEARCH)
        assert result['success'], "Request should succeed"
        assert result['detected_intent'] == 'property_search', \
            f"detected_intent should be 'property_search', got: {result.get('detected_intent')}"
        
        # THEN: metadata.intent should also match
        assert result['metadata']['intent'] == 'property_search', \
            "metadata.intent should match classifier"
        
        # THEN: It should NOT be 'valuation' (from GPT interpreter)
        assert result['detected_intent'] != 'valuation', \
            "detected_intent should NOT come from GPT interpreter"
    
    @patch('services.chatbot_orchestrator.enhanced_mls_service.search_properties')
    @patch('services.chatbot_orchestrator.ask_gpt_summarizer')
    @patch('services.chatbot_orchestrator.ask_gpt_interpreter')
    @patch('services.chatbot_orchestrator.intent_classifier.classify')
    def test_intent_stored_in_unified_state(
        self,
        mock_classify,
        mock_interpreter,
        mock_summarizer,
        mock_mls_search
    ):
        """
        TEST: Intent is stored in unified_state.metadata.detected_intent
        """
        # GIVEN: Classifier returns PROPERTY_REFINEMENT intent
        mock_classify.return_value = (
            UserIntent.PROPERTY_REFINEMENT,
            {
                'confidence': 0.88,
                'reason': 'refinement_keywords',
                'cache_hit': True,
                'used_gpt_fallback': False
            }
        )
        
        mock_interpreter.return_value = {
            'intent': 'search',
            'filters': {'bedrooms': 2}
        }
        
        mock_mls_search.return_value = {
            'success': True,
            'results': [],
            'total': 0
        }
        
        mock_summarizer.return_value = {
            'response_text': 'Updated search for 2 bedrooms',
            'suggestions': []
        }
        
        # WHEN: Process a refinement message
        chatbot = ChatGPTChatbot()
        session_id = "test_intent_state_456"
        result = chatbot.process_message(
            user_message="Show me 2 bedroom units",
            session_id=session_id
        )
        
        # THEN: Check unified state has the intent stored
        from services.chatbot_orchestrator import state_manager
        unified_state = state_manager.get_or_create(session_id)
        
        assert unified_state is not None, "State should exist"
        assert unified_state.metadata.detected_intent == 'property_refinement', \
            f"unified_state.metadata.detected_intent should be 'property_refinement', got: {unified_state.metadata.detected_intent}"
    
    @patch('services.chatbot_orchestrator.intent_classifier.classify')
    def test_off_topic_intent_propagates(
        self,
        mock_classify
    ):
        """
        TEST: OFF_TOPIC intent is properly handled and propagated
        """
        # GIVEN: Classifier returns OFF_TOPIC intent
        mock_classify.return_value = (
            UserIntent.OFF_TOPIC,
            {
                'confidence': 0.99,
                'reason': 'non_real_estate_topic',
                'cache_hit': False,
                'used_gpt_fallback': False
            }
        )
        
        # WHEN: Process an off-topic message
        chatbot = ChatGPTChatbot()
        result = chatbot.process_message(
            user_message="What's the weather like today?",
            session_id="test_off_topic_789"
        )
        
        # THEN: detected_intent should be 'off_topic'
        assert result['detected_intent'] == 'off_topic', \
            f"detected_intent should be 'off_topic', got: {result.get('detected_intent')}"
        
        # THEN: No property search should be triggered
        assert result['property_count'] == 0, "No properties should be returned for off-topic"
    
    @patch('services.chatbot_orchestrator.enhanced_mls_service.search_properties')
    @patch('services.chatbot_orchestrator.ask_gpt_summarizer')
    @patch('services.chatbot_orchestrator.ask_gpt_interpreter')
    @patch('services.chatbot_orchestrator.intent_classifier.classify')
    def test_gpt_interpreter_does_not_overwrite_intent(
        self,
        mock_classify,
        mock_interpreter,
        mock_summarizer,
        mock_mls_search
    ):
        """
        TEST: GPT interpreter output does NOT overwrite classifier intent
        """
        # GIVEN: Classifier and interpreter return DIFFERENT intents
        mock_classify.return_value = (
            UserIntent.PROPERTY_SEARCH,
            {
                'confidence': 0.92,
                'reason': 'search_with_location',
                'cache_hit': False,
                'used_gpt_fallback': False
            }
        )
        
        # Interpreter returns a DIFFERENT intent
        mock_interpreter.return_value = {
            'intent': 'general_question',  # Different from classifier
            'filters': {'location': 'Mississauga'}
        }
        
        mock_mls_search.return_value = {
            'success': True,
            'results': [{'mls_number': '99999', 'price': '$600,000', 'address': '456 Test St, Mississauga'}],
            'total': 1
        }
        
        mock_summarizer.return_value = {
            'response_text': 'Found properties',
            'suggestions': []
        }
        
        # WHEN: Process message
        chatbot = ChatGPTChatbot()
        result = chatbot.process_message(
            user_message="Find condos in Mississauga",
            session_id="test_no_overwrite_321"
        )
        
        # THEN: detected_intent should be from CLASSIFIER (property_search)
        assert result['detected_intent'] == 'property_search', \
            f"Classifier intent should win, got: {result.get('detected_intent')}"
        
        # THEN: NOT from GPT interpreter (general_question)
        assert result['detected_intent'] != 'general_question', \
            "GPT interpreter should not overwrite classifier intent"
    
    @patch('services.chatbot_orchestrator.intent_classifier.classify')
    def test_intent_persistence_across_turns(
        self,
        mock_classify
    ):
        """
        TEST: Intent is persisted in state across conversation turns
        """
        chatbot = ChatGPTChatbot()
        session_id = "test_persistence_654"
        
        # TURN 1: Initial search
        mock_classify.return_value = (
            UserIntent.PROPERTY_SEARCH,
            {'confidence': 0.95, 'reason': 'search', 'cache_hit': False, 'used_gpt_fallback': False}
        )
        
        with patch('services.chatbot_orchestrator.ask_gpt_interpreter') as mock_interp, \
             patch('services.chatbot_orchestrator.enhanced_mls_service.search_properties') as mock_mls, \
             patch('services.chatbot_orchestrator.ask_gpt_summarizer') as mock_summ:
            
            mock_interp.return_value = {'intent': 'search', 'filters': {'location': 'Toronto'}}
            mock_mls.return_value = {'success': True, 'results': [], 'total': 0}
            mock_summ.return_value = {'response_text': 'Searching...', 'suggestions': []}
            
            result1 = chatbot.process_message("Show me Toronto properties", session_id)
        
        # TURN 2: Refinement
        mock_classify.return_value = (
            UserIntent.PROPERTY_REFINEMENT,
            {'confidence': 0.88, 'reason': 'refinement', 'cache_hit': False, 'used_gpt_fallback': False}
        )
        
        with patch('services.chatbot_orchestrator.ask_gpt_interpreter') as mock_interp, \
             patch('services.chatbot_orchestrator.enhanced_mls_service.search_properties') as mock_mls, \
             patch('services.chatbot_orchestrator.ask_gpt_summarizer') as mock_summ:
            
            mock_interp.return_value = {'intent': 'refine', 'filters': {'bedrooms': 3}}
            mock_mls.return_value = {'success': True, 'results': [], 'total': 0}
            mock_summ.return_value = {'response_text': 'Refining...', 'suggestions': []}
            
            result2 = chatbot.process_message("Make it 3 bedrooms", session_id)
        
        # THEN: Second turn should have property_refinement intent
        assert result2['detected_intent'] == 'property_refinement', \
            f"Turn 2 should have refinement intent, got: {result2.get('detected_intent')}"
        
        # THEN: Check state has updated intent
        from services.chatbot_orchestrator import state_manager
        unified_state = state_manager.get_or_create(session_id)
        assert unified_state.metadata.detected_intent == 'property_refinement', \
            "State should store most recent intent"


if __name__ == "__main__":
    pytest.main([__file__, "-v", "--tb=short"])
