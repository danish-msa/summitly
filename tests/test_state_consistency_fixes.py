"""
State Consistency & Intent Refinement Fixes - Test Suite
==========================================================

Tests for critical state synchronization and intent classification improvements:
1. Location confirmation state synchronization (location_state + active_filters)
2. Listing type refinement intent classification
3. Confirmation response GPT short-circuit

Author: Summitly Team
Date: December 26, 2025
"""

import pytest
import sys
import os
from unittest.mock import Mock, patch, MagicMock
from typing import Dict, Any

# Add project root to path
project_root = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))
sys.path.insert(0, project_root)

from services.confirmation_manager import ConfirmationManager, ConfirmationType, ConfirmationResult
from services.unified_conversation_state import UnifiedConversationState, LocationState as UnifiedLocationState, ActiveFilters
from services.hybrid_intent_classifier import HybridIntentClassifier, UserIntent
from services.chatbot_orchestrator import ChatGPTChatbot


class TestLocationConfirmationSync:
    """
    Test 1: Location Confirmation State Synchronization
    
    Scenario: User confirms location change from Mississauga to Ottawa
    Expected: BOTH location_state AND active_filters['location'] updated to Ottawa
    """
    
    @pytest.fixture
    def confirmation_manager(self):
        """Create confirmation manager"""
        return ConfirmationManager()
    
    @pytest.fixture
    def state_with_mississauga(self):
        """Create state with Mississauga location"""
        state = UnifiedConversationState(session_id="test-location-sync-001")
        state.location_state = UnifiedLocationState(city="Mississauga")
        state.active_filters = ActiveFilters(location="Mississauga", bedrooms=3)
        return state
    
    def test_location_confirmation_synchronizes_both_fields(self, confirmation_manager, state_with_mississauga):
        """
        Given: Active search in Mississauga
        When: User confirms location change to Ottawa
        Then: location_state.city == "Ottawa" AND active_filters.location == "Ottawa"
        """
        # Create location change confirmation
        confirmation_id = confirmation_manager.create_confirmation(
            session_id="test-location-sync-001",
            confirmation_type=ConfirmationType.LOCATION_CHANGE,
            message="Change location to Ottawa?",
            payload={
                "old_location": "Mississauga",
                "new_location": "Ottawa",
                "new_location_state": {"city": "Ottawa"}
            }
        )
        
        assert confirmation_id is not None, "Confirmation should be created"
        
        # Apply confirmation (user says "yes")
        result: ConfirmationResult = confirmation_manager.apply_confirmation(
            session_id="test-location-sync-001",
            response="yes",
            state=state_with_mississauga
        )
        
        # Assert: Confirmation applied successfully
        assert result.success, "Confirmation should apply successfully"
        assert result.applied, "Confirmation should be marked as applied"
        
        # Assert: location_state.city updated
        assert state_with_mississauga.location_state.city == "Ottawa", \
            "location_state.city should be updated to Ottawa"
        
        # Assert: active_filters.location updated (THIS IS THE CRITICAL FIX)
        assert state_with_mississauga.active_filters.location == "Ottawa", \
            "active_filters.location should be synchronized to Ottawa"
        
        # Assert: Other filters preserved
        assert state_with_mississauga.active_filters.bedrooms == 3, \
            "Other filters (bedrooms) should be preserved"
    
    def test_location_state_and_filters_start_in_sync(self, state_with_mississauga):
        """
        Verify: Initial state has location_state and active_filters in sync
        """
        assert state_with_mississauga.location_state.city == "Mississauga"
        assert state_with_mississauga.active_filters.location == "Mississauga"
    
    def test_location_sync_with_rejection(self, confirmation_manager):
        """
        Given: Location change confirmation pending
        When: User rejects with "no"
        Then: Location should revert to previous (sync preserved)
        """
        state = UnifiedConversationState(session_id="test-location-sync-002")
        state.location_state = UnifiedLocationState(city="Hamilton")
        state.active_filters = ActiveFilters(location="Hamilton")
        
        # Create confirmation for location change
        confirmation_manager.create_confirmation(
            session_id="test-location-sync-002",
            confirmation_type=ConfirmationType.LOCATION_CHANGE,
            message="Change to Toronto?",
            payload={
                "old_location": "Hamilton",
                "new_location": "Toronto",
                "new_location_state": {"city": "Toronto"},
                "previous_location_state": {"city": "Hamilton"}
            }
        )
        
        # User rejects
        result = confirmation_manager.apply_confirmation(
            session_id="test-location-sync-002",
            response="no",
            state=state
        )
        
        assert result.success
        # Location should remain Hamilton (both fields)
        assert state.location_state.city == "Hamilton"
        assert state.active_filters.location == "Hamilton"


class TestListingTypeRefinement:
    """
    Test 2: Listing Type Refinement Intent Classification
    
    Scenario: User says "show me only rentals" during active search
    Expected: intent = PROPERTY_REFINEMENT (not GENERAL_QUESTION)
    """
    
    @pytest.fixture
    def classifier(self):
        """Create hybrid intent classifier"""
        return HybridIntentClassifier()
    
    @pytest.fixture
    def active_filters(self):
        """Filters for an active search"""
        return {
            "location": "Ottawa",
            "bedrooms": 2,
            "max_price": 800000
        }
    
    @pytest.fixture
    def context_with_results(self):
        """Context showing user has viewed results"""
        return {
            "has_previous_results": True,
            "conversation_stage": "viewing"
        }
    
    def test_only_rentals_is_refinement(self, classifier, active_filters, context_with_results):
        """
        Given: Active search in Ottawa
        When: User says "show me only rentals"
        Then: intent == PROPERTY_REFINEMENT, confidence >= 0.85
        """
        user_message = "show me only rentals"
        
        intent, metadata = classifier.classify(
            user_message=user_message,
            current_filters=active_filters,
            context=context_with_results
        )
        
        assert intent == UserIntent.PROPERTY_REFINEMENT, \
            "Intent should be PROPERTY_REFINEMENT, not GENERAL_QUESTION"
        assert metadata['confidence'] >= 0.85, \
            f"Confidence should be >= 0.85, got {metadata['confidence']}"
        assert "listing type" in metadata['reason'].lower() or "rent" in metadata['reason'].lower(), \
            f"Reason should mention listing type, got: {metadata['reason']}"
    
    def test_rentals_only_is_refinement(self, classifier, active_filters, context_with_results):
        """Test: "rentals only" pattern"""
        intent, metadata = classifier.classify(
            user_message="rentals only",
            current_filters=active_filters,
            context=context_with_results
        )
        
        assert intent == UserIntent.PROPERTY_REFINEMENT
        assert metadata['confidence'] >= 0.85
    
    def test_for_rent_is_refinement(self, classifier, active_filters, context_with_results):
        """Test: "for rent" pattern"""
        intent, metadata = classifier.classify(
            user_message="only for rent",
            current_filters=active_filters,
            context=context_with_results
        )
        
        assert intent == UserIntent.PROPERTY_REFINEMENT
        assert metadata['confidence'] >= 0.85
    
    def test_change_to_rentals_is_refinement(self, classifier, active_filters, context_with_results):
        """Test: "change to rentals" pattern"""
        intent, metadata = classifier.classify(
            user_message="change to rentals",
            current_filters=active_filters,
            context=context_with_results
        )
        
        assert intent == UserIntent.PROPERTY_REFINEMENT
        assert metadata['confidence'] >= 0.85
    
    def test_rentals_instead_is_refinement(self, classifier, active_filters, context_with_results):
        """Test: "rentals instead" pattern"""
        intent, metadata = classifier.classify(
            user_message="rentals instead",
            current_filters=active_filters,
            context=context_with_results
        )
        
        assert intent == UserIntent.PROPERTY_REFINEMENT
        assert metadata['confidence'] >= 0.85
    
    def test_rental_without_context_not_forced(self, classifier):
        """
        Given: NO active search, NO previous results
        When: User says "rentals"
        Then: Should NOT be forced to PROPERTY_REFINEMENT
        """
        intent, metadata = classifier.classify(
            user_message="rentals",
            current_filters={},
            context={"has_previous_results": False}
        )
        
        # Without context, it may be GENERAL_QUESTION or PROPERTY_SEARCH
        # Should NOT be PROPERTY_REFINEMENT without active search
        assert intent != UserIntent.PROPERTY_REFINEMENT or metadata['confidence'] < 0.85, \
            "Without active search, rental mention should not be high-confidence refinement"


class TestConfirmationGPTShortCircuit:
    """
    Test 3: Confirmation Response GPT Short-Circuit
    
    Scenario: User says "yes" to pending location change confirmation
    Expected: GPT interpreter is NOT called
    """
    
    @pytest.fixture
    def orchestrator(self):
        """Create chatbot orchestrator with mocked dependencies"""
        return ChatGPTChatbot()
    
    @pytest.fixture
    def state_with_pending_confirmation(self, orchestrator):
        """Create state with pending location change confirmation"""
        session_id = "test-gpt-skip-001"
        state = UnifiedConversationState(session_id=session_id)
        state.location_state = UnifiedLocationState(city="Toronto")
        state.active_filters = ActiveFilters(location="Toronto")
        
        # Create pending confirmation
        orchestrator.confirmation_manager.create_confirmation(
            session_id=session_id,
            confirmation_type=ConfirmationType.LOCATION_CHANGE,
            message="Change to Ottawa?",
            payload={
                "old_location": "Toronto",
                "new_location": "Ottawa",
                "new_location_state": {"city": "Ottawa"}
            }
        )
        
        return state
    
    def test_yes_response_skips_gpt(self, orchestrator, state_with_pending_confirmation):
        """
        Given: Pending location change confirmation
        When: User says "yes"
        Then: GPT interpreter is NOT called
        """
        session_id = "test-gpt-skip-001"
        user_message = "yes"
        
        # Mock GPT interpreter to track if it's called
        gpt_called = False
        
        def mock_gpt_interpreter(*args, **kwargs):
            nonlocal gpt_called
            gpt_called = True
            return {"intent": "property_search", "filters": {}}
        
        with patch('services.chatbot_orchestrator.ask_gpt_interpreter', side_effect=mock_gpt_interpreter):
            # Mock other dependencies
            with patch.object(orchestrator, 'enhanced_mls_service') as mock_mls:
                mock_mls.search_properties.return_value = {
                    'success': True,
                    'properties': [],
                    'total_count': 0
                }
                
                with patch.object(orchestrator, '_save_state_with_error_handling'):
                    # Execute
                    result = orchestrator.process_message(
                        user_message=user_message,
                        session_id=session_id
                    )
                    
                    # Assert: GPT was NOT called
                    assert not gpt_called, \
                        "GPT interpreter should NOT be called for binary confirmation response"
                    
                    # Assert: Response successful
                    assert result.get('success'), \
                        "Confirmation should be processed successfully"
    
    def test_no_response_skips_gpt(self, orchestrator):
        """
        Given: Pending confirmation
        When: User says "no"
        Then: GPT interpreter is NOT called
        """
        session_id = "test-gpt-skip-002"
        state = UnifiedConversationState(session_id=session_id)
        
        orchestrator.confirmation_manager.create_confirmation(
            session_id=session_id,
            confirmation_type=ConfirmationType.LOCATION_CHANGE,
            message="Change location?",
            payload={"old_location": "Toronto", "new_location": "Ottawa"}
        )
        
        gpt_called = False
        
        def mock_gpt(*args, **kwargs):
            nonlocal gpt_called
            gpt_called = True
            return {"intent": "property_search", "filters": {}}
        
        with patch('services.chatbot_orchestrator.ask_gpt_interpreter', side_effect=mock_gpt):
            with patch.object(orchestrator, '_save_state_with_error_handling'):
                result = orchestrator._handle_confirmation_response(
                    session_id=session_id,
                    user_message="no",
                    unified_state=state
                )
                
                # GPT should NOT be called
                assert not gpt_called, \
                    "GPT should not be called for 'no' confirmation"


class TestEndToEndStateConsistency:
    """
    Integration tests for state consistency across the full flow
    """
    
    def test_location_change_end_to_end(self):
        """
        Full flow test:
        1. Search in Toronto
        2. Ask to change to Ottawa
        3. Confirm "yes"
        4. Verify state consistency
        """
        orchestrator = ChatGPTChatbot()
        session_id = "test-e2e-location-001"
        
        # Step 1: Initial search in Toronto
        with patch.object(orchestrator, 'enhanced_mls_service') as mock_mls:
            mock_mls.search_properties.return_value = {
                'success': True,
                'properties': [{'mls_number': 'W1234567'}],
                'total_count': 1
            }
            
            with patch.object(orchestrator, '_save_state_with_error_handling'):
                # User searches Toronto
                result1 = orchestrator.process_message(
                    user_message="Show me 2-bedroom condos in Toronto",
                    session_id=session_id
                )
                
                assert result1.get('success')
                
                # Get state
                state = orchestrator.state_manager.get_or_create(session_id)
                assert state.location_state.city == "Toronto"
                assert state.active_filters.location == "Toronto"
                
                # Step 2: Request location change
                result2 = orchestrator.process_message(
                    user_message="Show me properties in Ottawa instead",
                    session_id=session_id
                )
                
                # Should ask for confirmation
                assert "ottawa" in result2.get('response', '').lower()
                
                # Step 3: Confirm
                result3 = orchestrator.process_message(
                    user_message="yes",
                    session_id=session_id
                )
                
                # Verify state consistency
                state_after = orchestrator.state_manager.get_or_create(session_id)
                assert state_after.location_state.city == "Ottawa", \
                    "location_state should be Ottawa"
                assert state_after.active_filters.location == "Ottawa", \
                    "active_filters.location should be Ottawa (SYNCHRONIZED)"


# ==============================================================================
# Test Execution
# ==============================================================================

if __name__ == "__main__":
    """
    Run tests with:
    python -m pytest tests/test_state_consistency_fixes.py -v
    
    Or run specific test:
    python -m pytest tests/test_state_consistency_fixes.py::TestLocationConfirmationSync::test_location_confirmation_synchronizes_both_fields -v
    """
    pytest.main([__file__, '-v', '--tb=short'])
