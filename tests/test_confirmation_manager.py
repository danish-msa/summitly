"""
Unit tests for ConfirmationManager.

Tests all confirmation types, response parsing, and state application logic.
Comprehensive coverage of the new simplified ConfirmationManager API.
"""

import pytest
import time
from datetime import datetime, timedelta
from unittest.mock import Mock, MagicMock
from services.confirmation_manager import (
    ConfirmationManager,
    ConfirmationType,
    ConfirmationStatus,
    PendingConfirmation,
    ConfirmationResult,
    get_confirmation_manager,
    POSITIVE_TOKENS,
    NEGATIVE_TOKENS,
    SKIP_TOKENS
)


@pytest.fixture
def manager():
    """Create a ConfirmationManager instance for testing."""
    mgr = ConfirmationManager(default_timeout_seconds=10)
    # Clear state
    mgr._confirmations.clear()
    mgr._confirmation_history.clear()
    return mgr


@pytest.fixture
def session_id():
    """Test session ID."""
    return "test-session-123"


class TestConfirmationCreation:
    """Test confirmation creation."""
    
    def test_create_basic_confirmation(self, manager, session_id):
        """Test creating a basic confirmation."""
        conf_id = manager.create_confirmation(
            session_id=session_id,
            confirmation_type=ConfirmationType.LOCATION_CHANGE,
            question="Did you mean Toronto?",
            payload={"new_location": "Toronto"}
        )
        
        assert conf_id is not None
        assert len(conf_id) == 36  # UUID length
        
        # Check it's stored
        pending = manager.get_pending_confirmation(session_id)
        assert pending is not None
        assert pending['confirmation_id'] == conf_id
        assert pending['type'] == ConfirmationType.LOCATION_CHANGE.value
        assert pending['question'] == "Did you mean Toronto?"
    
    def test_create_with_custom_timeout(self, manager, session_id):
        """Test creating confirmation with custom timeout."""
        conf_id = manager.create_confirmation(
            session_id=session_id,
            confirmation_type=ConfirmationType.REQUIREMENTS_NEEDED,
            question="Any requirements?",
            payload={},
            timeout_seconds=5
        )
        
        pending = manager.get_pending_confirmation(session_id)
        assert pending is not None
        
        # Check expiration is ~5 seconds from now
        expires_at = datetime.fromisoformat(pending['expires_at'])
        expected_expiry = datetime.utcnow() + timedelta(seconds=5)
        diff = abs((expires_at - expected_expiry).total_seconds())
        assert diff < 2  # Allow 2 second tolerance
    
    def test_create_overwrites_existing(self, manager, session_id):
        """Test that creating a new confirmation overwrites existing one."""
        conf_id1 = manager.create_confirmation(
            session_id=session_id,
            confirmation_type=ConfirmationType.LOCATION_CHANGE,
            question="First question?",
            payload={"data": 1}
        )
        
        conf_id2 = manager.create_confirmation(
            session_id=session_id,
            confirmation_type=ConfirmationType.PROPERTY_REFINEMENT,
            question="Second question?",
            payload={"data": 2}
        )
        
        # Only second one should be active
        pending = manager.get_pending_confirmation(session_id)
        assert pending['confirmation_id'] == conf_id2
        assert pending['question'] == "Second question?"


class TestConfirmationRetrieval:
    """Test confirmation retrieval."""
    
    def test_get_pending_confirmation_exists(self, manager, session_id):
        """Test getting existing pending confirmation."""
        conf_id = manager.create_confirmation(
            session_id=session_id,
            confirmation_type=ConfirmationType.LOCATION_CHANGE,
            question="Test?",
            payload={"test": True}
        )
        
        pending = manager.get_pending_confirmation(session_id)
        assert pending is not None
        assert pending['confirmation_id'] == conf_id
        assert pending['status'] == ConfirmationStatus.PENDING.value
        assert pending['payload'] == {"test": True}
    
    def test_get_pending_confirmation_none(self, manager, session_id):
        """Test getting pending confirmation when none exists."""
        pending = manager.get_pending_confirmation(session_id)
        assert pending is None
    
    def test_has_pending_confirmation(self, manager, session_id):
        """Test has_pending_confirmation method."""
        assert not manager.has_pending_confirmation(session_id)
        
        manager.create_confirmation(
            session_id=session_id,
            confirmation_type=ConfirmationType.LOCATION_CHANGE,
            question="Test?",
            payload={}
        )
        
        assert manager.has_pending_confirmation(session_id)
    
    def test_expired_confirmation_auto_removed(self, manager, session_id):
        """Test that expired confirmations are automatically removed."""
        manager.create_confirmation(
            session_id=session_id,
            confirmation_type=ConfirmationType.LOCATION_CHANGE,
            question="Test?",
            payload={},
            timeout_seconds=1  # 1 second timeout
        )
        
        # Should exist initially
        assert manager.has_pending_confirmation(session_id)
        
        # Wait for expiration
        time.sleep(1.5)
        
        # Should be gone now
        assert not manager.has_pending_confirmation(session_id)


class TestConfirmationResponseDetection:
    """Test confirmation response detection."""
    
    def test_detect_positive_responses(self, manager):
        """Test detection of positive responses."""
        for token in ['yes', 'yeah', 'yep', 'sure', 'ok', 'okay']:
            assert manager.is_confirmation_response(token, None)
    
    def test_detect_negative_responses(self, manager):
        """Test detection of negative responses."""
        for token in ['no', 'nope', 'nah', 'cancel']:
            assert manager.is_confirmation_response(token, None)
    
    def test_detect_skip_responses(self, manager):
        """Test detection of skip responses."""
        for token in ['skip', 'none', 'pass']:
            assert manager.is_confirmation_response(token, None)
    
    def test_detect_short_phrases(self, manager):
        """Test detection of short confirmation phrases."""
        assert manager.is_confirmation_response("yes please", None)
        assert manager.is_confirmation_response("no thanks", None)
        assert manager.is_confirmation_response("sure thing", None)
    
    def test_detect_requirements_response(self, manager):
        """Test that anything is a response for requirements confirmation."""
        pending = {
            'type': ConfirmationType.REQUIREMENTS_NEEDED.value
        }
        
        assert manager.is_confirmation_response("3 bedrooms with pool", pending)
        assert manager.is_confirmation_response("no", pending)
        assert manager.is_confirmation_response("I need parking", pending)
    
    def test_not_confirmation_response(self, manager):
        """Test messages that are not confirmation responses."""
        assert not manager.is_confirmation_response("show me properties in Ottawa", None)
        assert not manager.is_confirmation_response("what about something else", None)
    
    def test_yes_for_filter_adjustment_is_valid(self, manager):
        """Test that plain 'yes' is valid for FILTER_CHANGE confirmation."""
        pending_filter_change = {
            'type': ConfirmationType.FILTER_CHANGE.value
        }
        
        # Plain yes/no should be valid for filter change
        assert manager.is_confirmation_response("yes", pending_filter_change)
        assert manager.is_confirmation_response("no", pending_filter_change)
        assert manager.is_confirmation_response("yeah", pending_filter_change)
        assert manager.is_confirmation_response("nope", pending_filter_change)
    
    def test_yes_for_vague_request_is_invalid(self, manager):
        """Test that plain 'yes/no' is INVALID for VAGUE_REQUEST confirmation."""
        pending_vague = {
            'type': ConfirmationType.VAGUE_REQUEST.value
        }
        
        # Plain yes/no WITHOUT semantic context should be INVALID
        assert not manager.is_confirmation_response("yes", pending_vague)
        assert not manager.is_confirmation_response("no", pending_vague)
        assert not manager.is_confirmation_response("yeah", pending_vague)
        assert not manager.is_confirmation_response("nope", pending_vague)
        
        # But yes/no WITH semantic context should be VALID
        assert manager.is_confirmation_response("yes, update my filters", pending_vague)
        assert manager.is_confirmation_response("no, keep my budget", pending_vague)
        assert manager.is_confirmation_response("yes change the location", pending_vague)
        assert manager.is_confirmation_response("sure, adjust my price range", pending_vague)


class TestLocationChangeConfirmation:
    """Test LOCATION_CHANGE confirmation application."""
    
    def test_location_change_yes(self, manager, session_id):
        """Test accepting location change."""
        manager.create_confirmation(
            session_id=session_id,
            confirmation_type=ConfirmationType.LOCATION_CHANGE,
            question="Switch to Toronto?",
            payload={
                "new_location_state": {
                    "city": "Toronto",
                    "province": "ON"
                },
                "previous_location_state": {
                    "city": "Ottawa",
                    "province": "ON"
                }
            }
        )
        
        result = manager.apply_confirmation(session_id, "yes")
        
        assert result.success
        assert result.applied
        assert result.next_action == 'search'
        assert result.state_update == {"city": "Toronto", "province": "ON"}
    
    def test_location_change_no(self, manager, session_id):
        """Test rejecting location change."""
        manager.create_confirmation(
            session_id=session_id,
            confirmation_type=ConfirmationType.LOCATION_CHANGE,
            question="Switch to Toronto?",
            payload={
                "new_location_state": {
                    "city": "Toronto",
                    "province": "ON"
                },
                "previous_location_state": {
                    "city": "Ottawa",
                    "province": "ON"
                }
            }
        )
        
        result = manager.apply_confirmation(session_id, "no")
        
        assert result.success
        assert result.applied
        assert result.state_update == {"city": "Ottawa", "province": "ON"}
    
    def test_location_change_other(self, manager, session_id):
        """Test providing new location instead."""
        manager.create_confirmation(
            session_id=session_id,
            confirmation_type=ConfirmationType.LOCATION_CHANGE,
            question="Switch to Toronto?",
            payload={}
        )
        
        result = manager.apply_confirmation(session_id, "actually, Montreal")
        
        assert result.success
        assert not result.applied
        assert result.next_action == 'parse_location'
        assert 'location_query' in result.state_update


class TestPropertyRefinementConfirmation:
    """Test PROPERTY_REFINEMENT confirmation application."""
    
    def test_property_refinement_yes(self, manager, session_id):
        """Test accepting property refinement."""
        manager.create_confirmation(
            session_id=session_id,
            confirmation_type=ConfirmationType.PROPERTY_REFINEMENT,
            question="Apply these filters?",
            payload={
                "filters": {
                    "bedrooms": 3,
                    "bathrooms": 2,
                    "price_max": 500000
                }
            }
        )
        
        result = manager.apply_confirmation(session_id, "yes")
        
        assert result.success
        assert result.applied
        assert result.next_action == 'search'
        assert result.state_update == {
            "bedrooms": 3,
            "bathrooms": 2,
            "price_max": 500000
        }
    
    def test_property_refinement_other(self, manager, session_id):
        """Test providing different filters."""
        manager.create_confirmation(
            session_id=session_id,
            confirmation_type=ConfirmationType.PROPERTY_REFINEMENT,
            question="Apply these filters?",
            payload={}
        )
        
        result = manager.apply_confirmation(session_id, "make it 4 bedrooms")
        
        assert result.success
        assert not result.applied
        assert result.next_action == 'parse_filters'
        assert 'filter_query' in result.state_update


class TestRequirementsNeededConfirmation:
    """Test REQUIREMENTS_NEEDED confirmation application."""
    
    def test_requirements_provided(self, manager, session_id):
        """Test providing requirements."""
        manager.create_confirmation(
            session_id=session_id,
            confirmation_type=ConfirmationType.REQUIREMENTS_NEEDED,
            question="Any specific requirements?",
            payload={}
        )
        
        result = manager.apply_confirmation(session_id, "3 beds with garage")
        
        assert result.success
        assert not result.applied
        assert result.next_action == 'parse_requirements'
        assert 'requirements_query' in result.state_update
    
    def test_requirements_skipped(self, manager, session_id):
        """Test skipping requirements."""
        manager.create_confirmation(
            session_id=session_id,
            confirmation_type=ConfirmationType.REQUIREMENTS_NEEDED,
            question="Any specific requirements?",
            payload={}
        )
        
        result = manager.apply_confirmation(session_id, "no")
        
        assert result.success
        assert not result.applied
        assert result.next_action == 'search'
        assert result.state_update == {}


class TestPostalCodeClarification:
    """Test POSTAL_CODE_CLARIFICATION confirmation application."""
    
    def test_postal_code_yes(self, manager, session_id):
        """Test accepting postal code."""
        manager.create_confirmation(
            session_id=session_id,
            confirmation_type=ConfirmationType.POSTAL_CODE_CLARIFICATION,
            question="Search in K1A 0A1?",
            payload={
                "postal_code": "K1A 0A1",
                "city": "Ottawa"
            }
        )
        
        result = manager.apply_confirmation(session_id, "yes")
        
        assert result.success
        assert result.applied
        assert result.next_action == 'search'
        assert result.state_update == {
            "postal_code": "K1A 0A1",
            "use_postal_code": True
        }
    
    def test_postal_code_no(self, manager, session_id):
        """Test using broader area."""
        manager.create_confirmation(
            session_id=session_id,
            confirmation_type=ConfirmationType.POSTAL_CODE_CLARIFICATION,
            question="Search in K1A 0A1?",
            payload={
                "postal_code": "K1A 0A1",
                "city": "Ottawa"
            }
        )
        
        result = manager.apply_confirmation(session_id, "no")
        
        assert result.success
        assert result.applied
        assert result.next_action == 'search'
        assert result.state_update == {
            "city": "Ottawa",
            "use_postal_code": False
        }
    
    def test_postal_code_clarification(self, manager, session_id):
        """Test providing clarification."""
        manager.create_confirmation(
            session_id=session_id,
            confirmation_type=ConfirmationType.POSTAL_CODE_CLARIFICATION,
            question="Search in K1A 0A1?",
            payload={}
        )
        
        result = manager.apply_confirmation(session_id, "use K2P 0A4 instead")
        
        assert result.success
        assert not result.applied
        assert result.next_action == 'parse_location'


class TestConfirmationStateUpdates:
    """Test state updates with confirmation application."""
    
    def test_apply_with_state_object(self, manager, session_id):
        """Test applying confirmation with a state object."""
        # Mock state object
        state = Mock()
        state.city = "Ottawa"
        state.province = "ON"
        
        manager.create_confirmation(
            session_id=session_id,
            confirmation_type=ConfirmationType.LOCATION_CHANGE,
            question="Switch to Toronto?",
            payload={
                "new_location_state": {
                    "city": "Toronto",
                    "province": "ON"
                }
            }
        )
        
        result = manager.apply_confirmation(session_id, "yes", state=state)
        
        assert result.success
        assert result.applied
        assert state.city == "Toronto"
        assert state.province == "ON"


class TestConfirmationDeletion:
    """Test confirmation deletion and cleanup."""
    
    def test_reject_confirmation(self, manager, session_id):
        """Test rejecting a confirmation."""
        manager.create_confirmation(
            session_id=session_id,
            confirmation_type=ConfirmationType.LOCATION_CHANGE,
            question="Test?",
            payload={}
        )
        
        assert manager.has_pending_confirmation(session_id)
        
        manager.reject_confirmation(session_id, "User cancelled")
        
        assert not manager.has_pending_confirmation(session_id)
    
    def test_expire_confirmation(self, manager, session_id):
        """Test expiring a confirmation."""
        manager.create_confirmation(
            session_id=session_id,
            confirmation_type=ConfirmationType.LOCATION_CHANGE,
            question="Test?",
            payload={}
        )
        
        assert manager.has_pending_confirmation(session_id)
        
        manager.expire_confirmation(session_id, "Timeout")
        
        assert not manager.has_pending_confirmation(session_id)
    
    def test_cancel_confirmation(self, manager, session_id):
        """Test cancelling a confirmation."""
        manager.create_confirmation(
            session_id=session_id,
            confirmation_type=ConfirmationType.LOCATION_CHANGE,
            question="Test?",
            payload={}
        )
        
        manager.cancel_confirmation(session_id)
        
        assert not manager.has_pending_confirmation(session_id)
    
    def test_clear_session_confirmations(self, manager, session_id):
        """Test clearing all session confirmations."""
        manager.create_confirmation(
            session_id=session_id,
            confirmation_type=ConfirmationType.LOCATION_CHANGE,
            question="Test?",
            payload={}
        )
        
        manager.clear_session_confirmations(session_id)
        
        assert not manager.has_pending_confirmation(session_id)


class TestConfirmationErrors:
    """Test error handling."""
    
    def test_apply_without_pending(self, manager, session_id):
        """Test applying confirmation when none exists."""
        result = manager.apply_confirmation(session_id, "yes")
        
        assert not result.success
        assert result.error == "No pending confirmation"
    
    def test_apply_after_expiration(self, manager, session_id):
        """Test applying expired confirmation."""
        manager.create_confirmation(
            session_id=session_id,
            confirmation_type=ConfirmationType.LOCATION_CHANGE,
            question="Test?",
            payload={},
            timeout_seconds=1
        )
        
        # Wait for expiration
        time.sleep(1.5)
        
        result = manager.apply_confirmation(session_id, "yes")
        
        assert not result.success
        assert result.error == "No pending confirmation"


class TestConfirmationMetrics:
    """Test metrics tracking."""
    
    def test_creation_metrics(self, manager, session_id):
        """Test that creation increments metrics."""
        initial_metrics = manager.get_metrics()
        initial_created = initial_metrics.get('created', 0)
        
        manager.create_confirmation(
            session_id=session_id,
            confirmation_type=ConfirmationType.LOCATION_CHANGE,
            question="Test?",
            payload={}
        )
        
        metrics = manager.get_metrics()
        assert metrics['created'] == initial_created + 1
        assert metrics['created_location_change'] >= 1
    
    def test_application_metrics(self, manager, session_id):
        """Test that application increments metrics."""
        manager.create_confirmation(
            session_id=session_id,
            confirmation_type=ConfirmationType.LOCATION_CHANGE,
            question="Test?",
            payload={"new_location_state": {}}
        )
        
        initial_metrics = manager.get_metrics()
        initial_applied = initial_metrics.get('applied', 0)
        
        manager.apply_confirmation(session_id, "yes")
        
        metrics = manager.get_metrics()
        assert metrics['applied'] == initial_applied + 1


class TestSingleton:
    """Test singleton pattern."""
    
    def test_get_confirmation_manager_returns_singleton(self):
        """Test that get_confirmation_manager returns singleton."""
        mgr1 = get_confirmation_manager()
        mgr2 = get_confirmation_manager()
        
        assert mgr1 is mgr2


if __name__ == "__main__":
    pytest.main([__file__, "-v"])
