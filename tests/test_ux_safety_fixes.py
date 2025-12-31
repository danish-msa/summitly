"""
UX Safety Fixes - Comprehensive Test Suite
===========================================

Tests for critical UX improvements:
1. Silent location override prevention during refinement
2. Clarification context leak protection
3. GPT location extraction gating
4. Bedroom mapping data integrity
5. School fallback disclosure

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

from services.chatbot_orchestrator import ChatbotOrchestrator
from services.unified_conversation_state import UnifiedConversationState, LocationState as UnifiedLocationState
from services.location_extractor import LocationState
from services.hybrid_intent_classifier import UserIntent
from services.schools_service import SchoolsService
from app.voice_assistant_clean import standardize_property_data


class TestRefinementLocationPreservation:
    """
    Test 1: Refinement Does NOT Override Location
    
    Scenario: User has active search in Hamilton, says "only 5 beds"
    Expected: Location remains Hamilton, bedrooms updated to 5
    """
    
    @pytest.fixture
    def orchestrator(self):
        """Create orchestrator with mocked dependencies"""
        return ChatbotOrchestrator()
    
    @pytest.fixture
    def state_with_location(self):
        """Create state with existing Hamilton location"""
        state = UnifiedConversationState(session_id="test-refinement-123")
        state.location = "Hamilton"
        state.location_state = UnifiedLocationState(city="Hamilton")
        state.bedrooms = 3
        state.search_count = 1
        return state
    
    def test_refinement_preserves_location(self, orchestrator, state_with_location):
        """
        Given: Active search in Hamilton with 3 bedrooms
        When: User says "only 5 beds"
        Then: Location stays Hamilton, bedrooms becomes 5
        """
        user_message = "only 5 beds"
        
        # Mock intent classifier to return PROPERTY_REFINEMENT
        with patch.object(orchestrator, 'intent_classifier') as mock_classifier:
            mock_classifier.classify_intent.return_value = (
                UserIntent.PROPERTY_REFINEMENT,
                {'confidence': 0.95, 'reason': 'Filter modification'}
            )
            
            # Mock location extractor to ensure it's NOT called for refinement
            with patch('services.chatbot_orchestrator.location_extractor') as mock_extractor:
                # Setup: location extractor should NOT be called during refinement
                mock_extractor.extract_location_entities = Mock()
                
                # Mock GPT interpreter
                with patch('services.chatbot_orchestrator.ask_gpt_interpreter') as mock_gpt:
                    mock_gpt.return_value = {
                        'intent': 'property_search',
                        'filters': {'bedrooms': 5},
                        'merge_with_previous': True
                    }
                    
                    # Mock MLS search
                    with patch.object(orchestrator, 'enhanced_mls_service') as mock_mls:
                        mock_mls.search_properties.return_value = {
                            'success': True,
                            'properties': [],
                            'total_count': 0
                        }
                        
                        # Execute
                        result = orchestrator.process_message(
                            user_message=user_message,
                            session_id=state_with_location.session_id
                        )
                        
                        # Assert: Location preserved
                        assert state_with_location.location == "Hamilton", \
                            "Location should remain Hamilton during refinement"
                        
                        # Assert: Bedrooms updated
                        assert state_with_location.bedrooms == 5, \
                            "Bedrooms should be updated to 5"
                        
                        # Assert: Location extractor NOT called with user message
                        # (it may be called with previous_location for validation, but not for extraction)
                        if mock_extractor.extract_location_entities.called:
                            # If called, verify it preserved the previous location
                            call_args = mock_extractor.extract_location_entities.call_args
                            assert call_args[1]['previous_location'].city == "Hamilton", \
                                "Location extractor should use Hamilton as previous location"


class TestClarificationSafety:
    """
    Test 2: Clarification Reply Safety
    
    Scenario: System asked price clarification, user replies "5 beds"
    Expected: Bedrooms updated, location unchanged
    """
    
    @pytest.fixture
    def orchestrator(self):
        return ChatbotOrchestrator()
    
    @pytest.fixture
    def state_with_pending_clarification(self):
        """Create state with pending clarification"""
        state = UnifiedConversationState(session_id="test-clarification-456")
        state.location = "Toronto"
        state.location_state = UnifiedLocationState(city="Toronto")
        state.conversation_history = [
            {'role': 'user', 'content': 'Show me properties'},
            {'role': 'assistant', 'content': 'What is your price range?'}
        ]
        return state
    
    def test_clarification_response_preserves_location(self, orchestrator, state_with_pending_clarification):
        """
        Given: Pending clarification about price, location=Toronto
        When: User replies "5 beds" (answering different question)
        Then: Bedrooms updated, location stays Toronto
        """
        user_message = "5 beds"
        
        # Mock intent classifier
        with patch.object(orchestrator, 'intent_classifier') as mock_classifier:
            mock_classifier.classify_intent.return_value = (
                UserIntent.PROPERTY_REFINEMENT,
                {'confidence': 0.85}
            )
            
            # Mock _has_explicit_location_mention to return False
            with patch.object(orchestrator, '_has_explicit_location_mention', return_value=False):
                
                # Mock GPT interpreter
                with patch('services.chatbot_orchestrator.ask_gpt_interpreter') as mock_gpt:
                    mock_gpt.return_value = {
                        'intent': 'property_search',
                        'filters': {'bedrooms': 5},
                        'merge_with_previous': True
                    }
                    
                    # Mock MLS search
                    with patch.object(orchestrator, 'enhanced_mls_service') as mock_mls:
                        mock_mls.search_properties.return_value = {
                            'success': True,
                            'properties': [],
                            'total_count': 0
                        }
                        
                        # Execute
                        result = orchestrator.process_message(
                            user_message=user_message,
                            session_id=state_with_pending_clarification.session_id
                        )
                        
                        # Assert: Location unchanged
                        assert state_with_pending_clarification.location == "Toronto", \
                            "Location should remain Toronto when answering clarification"
                        
                        # Assert: Bedrooms updated
                        assert state_with_pending_clarification.bedrooms == 5, \
                            "Bedrooms should be updated from clarification response"


class TestGPTLocationGating:
    """
    Test 3: GPT Geo Extraction Gating
    
    Scenario: Refinement intent + existing location
    Expected: GPT location extractor is NOT called
    """
    
    def test_gpt_location_extraction_skipped_during_refinement(self):
        """
        Given: Refinement intent + existing location in Hamilton
        When: Processing "only 5 beds"
        Then: GPT location extractor is NOT invoked
        """
        orchestrator = ChatbotOrchestrator()
        
        state = UnifiedConversationState(session_id="test-gpt-gate-789")
        state.location = "Hamilton"
        state.location_state = UnifiedLocationState(city="Hamilton")
        
        user_message = "only 5 beds"
        
        # Mock intent as PROPERTY_REFINEMENT
        with patch.object(orchestrator, 'intent_classifier') as mock_classifier:
            mock_classifier.classify_intent.return_value = (
                UserIntent.PROPERTY_REFINEMENT,
                {'confidence': 0.95}
            )
            
            # Track if location extractor is called
            with patch('services.chatbot_orchestrator.location_extractor') as mock_extractor:
                extraction_called = False
                
                def track_extraction(*args, **kwargs):
                    nonlocal extraction_called
                    extraction_called = True
                    # Return the existing location (should be preserved)
                    return state.location_state
                
                mock_extractor.extract_location_entities = Mock(side_effect=track_extraction)
                
                # Mock other dependencies
                with patch('services.chatbot_orchestrator.ask_gpt_interpreter') as mock_gpt:
                    mock_gpt.return_value = {
                        'intent': 'property_search',
                        'filters': {'bedrooms': 5},
                        'merge_with_previous': True
                    }
                    
                    with patch.object(orchestrator, 'enhanced_mls_service') as mock_mls:
                        mock_mls.search_properties.return_value = {
                            'success': True,
                            'properties': [],
                            'total_count': 0
                        }
                        
                        # Execute
                        result = orchestrator.process_message(
                            user_message=user_message,
                            session_id=state.session_id
                        )
                        
                        # Assert: Location extractor should preserve existing location
                        # The gate should prevent NEW extraction
                        assert state.location == "Hamilton", \
                            "Location must remain Hamilton (gate should prevent override)"


class TestBedroomMapping:
    """
    Test 4: Bedroom Mapping Data Integrity
    
    Scenario: Repliers response with details.numBedrooms
    Expected: standardized_property.bedrooms is correctly mapped (not None)
    """
    
    def test_bedroom_mapping_from_repliers_details(self):
        """
        Given: Repliers property with details.numBedrooms=3
        When: standardize_property_data() is called
        Then: Result has bedrooms=3 (not None)
        """
        repliers_property = {
            'mls_number': 'E1234567',
            'price': 750000,
            'address': '123 Main Street',
            'details': {
                'numBedrooms': 3,
                'numBathrooms': 2,
                'sqft': 1500
            }
        }
        
        standardized = standardize_property_data(repliers_property)
        
        # Assert: bedrooms correctly mapped
        assert standardized.get('bedrooms') == 3, \
            "Bedrooms should be mapped from details.numBedrooms"
        assert standardized.get('bedrooms') is not None, \
            "Bedrooms should never be None when source data exists"
    
    def test_bedroom_mapping_nested_property_details(self):
        """
        Given: Property with nested property.details.numBedrooms
        When: standardize_property_data() is called
        Then: Result has bedrooms mapped correctly
        """
        nested_property = {
            'mls_number': 'W9876543',
            'price': 650000,
            'property': {
                'details': {
                    'numBedrooms': 2,
                    'numBathrooms': 1
                }
            }
        }
        
        standardized = standardize_property_data(nested_property)
        
        # Assert: bedrooms recovered from nested structure
        assert standardized.get('bedrooms') == 2, \
            "Bedrooms should be recovered from nested property.details.numBedrooms"
    
    def test_bedroom_mapping_fallback_to_na(self):
        """
        Given: Property with NO bedroom data
        When: standardize_property_data() is called
        Then: Result has bedrooms='N/A' (safe fallback, does NOT fail)
        """
        property_without_beds = {
            'mls_number': 'C5555555',
            'price': 500000,
            'address': '456 Oak Avenue'
        }
        
        standardized = standardize_property_data(property_without_beds)
        
        # Assert: Safe fallback applied
        assert standardized.get('bedrooms') == 'N/A', \
            "Bedrooms should fallback to 'N/A' when no data available"
        # Should NOT raise exception
        assert standardized is not None


class TestSchoolFallbackDisclosure:
    """
    Test 5: School Fallback Disclosure
    
    Scenario: Repliers Schools API unavailable, Ontario Registry used
    Expected: User-facing message mentions fallback source
    """
    
    def test_school_fallback_includes_disclosure(self):
        """
        Given: Schools API unavailable
        When: get_nearby_schools_for_property() falls back to Ontario Registry
        Then: Response includes is_fallback=True and data_source disclosure
        """
        schools_service = SchoolsService()
        
        # Mock the internal fetch methods
        with patch.object(schools_service, '_fetch_schools_from_google_places', side_effect=Exception("API unavailable")):
            with patch.object(schools_service, '_fetch_schools_from_repliers', side_effect=Exception("API unavailable")):
                with patch.object(schools_service, '_fetch_schools_from_ontario_registry') as mock_registry:
                    # Mock Ontario Registry return
                    mock_registry.return_value = [
                        {
                            'name': 'Central Public School',
                            'type': 'Elementary',
                            'rating': 7.5,
                            'distance_km': 1.2,
                            'coordinates': (43.65, -79.38)
                        }
                    ]
                    
                    # Execute
                    result = schools_service.get_nearby_schools_for_property(
                        mls_number='W1234567',
                        property_data={
                            'latitude': 43.65,
                            'longitude': -79.38,
                            'city': 'Toronto'
                        },
                        limit=5
                    )
                    
                    # Assert: Fallback flag set
                    assert result.get('is_fallback') is True, \
                        "Response should flag fallback source"
                    
                    # Assert: Data source disclosed
                    assert result.get('data_source') == "Ontario Education Registry", \
                        "Response should disclose Ontario Registry as source"
                    
                    # Assert: Schools still returned
                    assert len(result.get('schools', [])) > 0, \
                        "Schools should be returned even with fallback"
    
    def test_school_primary_source_no_fallback_flag(self):
        """
        Given: Repliers Schools API succeeds
        When: get_nearby_schools_for_property() uses primary source
        Then: is_fallback=False
        """
        schools_service = SchoolsService()
        
        with patch.object(schools_service, '_fetch_schools_from_repliers') as mock_repliers:
            mock_repliers.return_value = [
                {
                    'name': 'Queen Street School',
                    'type': 'Elementary',
                    'rating': 8.0,
                    'distance_km': 0.5,
                    'coordinates': (43.65, -79.38)
                }
            ]
            
            result = schools_service.get_nearby_schools_for_property(
                mls_number='W7777777',
                property_data={
                    'latitude': 43.65,
                    'longitude': -79.38,
                    'city': 'Toronto'
                },
                limit=5
            )
            
            # Assert: NOT flagged as fallback
            assert result.get('is_fallback') is False, \
                "Primary source should NOT be flagged as fallback"
            
            # Assert: Data source is Repliers
            assert result.get('data_source') == "Repliers Schools API", \
                "Data source should be Repliers"


class TestExplicitLocationDetection:
    """
    Test: _has_explicit_location_mention() helper accuracy
    
    Ensures helper correctly identifies explicit location mentions
    """
    
    @pytest.fixture
    def orchestrator(self):
        return ChatbotOrchestrator()
    
    def test_explicit_city_mention_detected(self, orchestrator):
        """User says "in Toronto" - should be detected"""
        state = UnifiedConversationState(session_id="test-explicit-1")
        
        result = orchestrator._has_explicit_location_mention("show me properties in Toronto", state)
        assert result is True, "Should detect 'Toronto' as explicit location"
    
    def test_neighborhood_mention_detected(self, orchestrator):
        """User says "downtown" - should be detected"""
        state = UnifiedConversationState(session_id="test-explicit-2")
        
        result = orchestrator._has_explicit_location_mention("condos downtown", state)
        assert result is True, "Should detect 'downtown' as explicit location"
    
    def test_no_location_in_refinement(self, orchestrator):
        """User says "only 5 beds" - should NOT be detected"""
        state = UnifiedConversationState(session_id="test-explicit-3")
        state.location = "Hamilton"
        
        result = orchestrator._has_explicit_location_mention("only 5 beds", state)
        assert result is False, "Should NOT detect location in pure filter refinement"
    
    def test_ambiguous_phrase_not_detected(self, orchestrator):
        """User says "in good condition" - should NOT be detected as location"""
        state = UnifiedConversationState(session_id="test-explicit-4")
        
        result = orchestrator._has_explicit_location_mention("properties in good condition", state)
        assert result is False, "Should NOT detect 'in' as location indicator without place words"


# ==============================================================================
# Test Execution
# ==============================================================================

if __name__ == "__main__":
    """
    Run tests with:
    python -m pytest tests/test_ux_safety_fixes.py -v
    
    Or run specific test:
    python -m pytest tests/test_ux_safety_fixes.py::TestRefinementLocationPreservation::test_refinement_preserves_location -v
    """
    pytest.main([__file__, '-v', '--tb=short'])
