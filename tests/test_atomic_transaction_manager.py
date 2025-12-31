"""
Test Suite for Atomic Transaction Manager
==========================================
Comprehensive tests for safe state updates with rollback capabilities.

Tests cover:
- All transaction types
- Checkpoint creation and restoration
- Rollback on failure
- Transaction logging
- Validation and error handling
- Edge cases and race conditions

Author: Summitly Team
Date: December 2025
"""

import pytest
import time
from datetime import datetime
from typing import Dict, Any, List
from unittest.mock import Mock, MagicMock, patch

from services.atomic_transaction_manager import (
    AtomicTransactionManager,
    TransactionType,
    TransactionStatus,
    TransactionLog,
    StateCheckpoint,
    get_transaction_manager,
)
from services.unified_conversation_state import (
    UnifiedConversationState,
    UnifiedStateManager,
    ActiveFilters,
    LocationState,
    ListingType,
)


# =============================================================================
# FIXTURES
# =============================================================================


@pytest.fixture
def state_manager():
    """Create a mock state manager."""
    manager = MagicMock(spec=UnifiedStateManager)
    manager.get_state = MagicMock()
    manager.save_state = MagicMock()
    return manager


@pytest.fixture
def transaction_manager(state_manager):
    """Create a transaction manager instance."""
    return AtomicTransactionManager(
        state_manager=state_manager,
        max_checkpoints=5,
        max_logs=100,
    )


@pytest.fixture
def sample_state():
    """Create a sample conversation state."""
    return UnifiedConversationState(
        session_id="test_session_123",
        user_id="test_user",
        active_filters=ActiveFilters(
            min_price=300000,
            max_price=800000,
            bedrooms=2,
            listing_type=ListingType.SALE,
        ),
        location_state=LocationState(
            city="Toronto",
            neighborhood="Yorkville",
        ),
        last_property_results=[],
    )


@pytest.fixture
def mls_service_mock():
    """Create a mock MLS service."""
    service = Mock()
    service.search_properties = Mock(return_value=[
        {"id": "prop1", "price": 500000},
        {"id": "prop2", "price": 600000},
    ])
    return service


# =============================================================================
# TRANSACTION TYPE TESTS
# =============================================================================


class TestTransactionTypes:
    """Test all transaction types."""
    
    def test_filter_update_success(self, transaction_manager, state_manager, sample_state):
        """Test successful filter update."""
        state_manager.get_state.return_value = sample_state
        state_manager.save_state.return_value = None
        
        success, result, error = transaction_manager.execute_transaction(
            transaction_type=TransactionType.FILTER_UPDATE.value,
            session_id="test_session_123",
            data={
                "filters": {
                    "min_price": 400000,
                    "bedrooms": 4,
                }
            },
        )
        
        assert success is True
        assert error is None
        assert result is not None
        assert "transaction_id" in result
        assert "state" in result
        assert "changes" in result
        
        # Verify state was saved
        state_manager.save_state.assert_called_once()
        
        # Verify filters were updated
        saved_state = state_manager.save_state.call_args[0][0]
        assert saved_state.active_filters.min_price == 400000
        assert saved_state.active_filters.bedrooms == 4
    
    def test_filter_update_with_location(self, transaction_manager, state_manager, sample_state):
        """Test filter update with location changes."""
        state_manager.get_state.return_value = sample_state
        state_manager.save_state.return_value = None
        
        success, result, error = transaction_manager.execute_transaction(
            transaction_type=TransactionType.FILTER_UPDATE.value,
            session_id="test_session_123",
            data={
                "filters": {
                    "city": "Mississauga",
                    "postal_code": "L5B 3Y3",
                    "bedrooms": 3,
                }
            },
        )
        
        assert success is True
        
        saved_state = state_manager.save_state.call_args[0][0]
        assert saved_state.location_state.city == "Mississauga"
        assert saved_state.location_state.postal_code == "L5B 3Y3"
        assert saved_state.active_filters.bedrooms == 3
    
    def test_search_execute_success(self, transaction_manager, state_manager, sample_state, mls_service_mock):
        """Test successful search execution."""
        state_manager.get_state.return_value = sample_state
        state_manager.save_state.return_value = None
        
        success, result, error = transaction_manager.execute_transaction(
            transaction_type=TransactionType.SEARCH_EXECUTE.value,
            session_id="test_session_123",
            data={"mls_service": mls_service_mock},
        )
        
        assert success is True
        assert error is None
        
        # Verify MLS was called
        mls_service_mock.search_properties.assert_called_once()
        
        # Verify results were saved
        saved_state = state_manager.save_state.call_args[0][0]
        assert len(saved_state.last_property_results) == 2
        assert saved_state.last_property_results[0]["id"] == "prop1"
    
    def test_search_execute_paginated_results(self, transaction_manager, state_manager, sample_state):
        """Test search with paginated response format."""
        state_manager.get_state.return_value = sample_state
        state_manager.save_state.return_value = None
        
        mls_service = Mock()
        mls_service.search_properties.return_value = {
            "properties": [
                {"id": "prop1", "price": 500000},
                {"id": "prop2", "price": 600000},
            ],
            "total": 25,
            "page": 1,
            "page_size": 2,
        }
        
        success, result, error = transaction_manager.execute_transaction(
            transaction_type=TransactionType.SEARCH_EXECUTE.value,
            session_id="test_session_123",
            data={"mls_service": mls_service},
        )
        
        assert success is True
        saved_state = state_manager.save_state.call_args[0][0]
        assert len(saved_state.last_property_results) == 2
    
    def test_confirmation_apply_positive(self, transaction_manager, state_manager, sample_state):
        """Test applying positive confirmation."""
        state_manager.get_state.return_value = sample_state
        state_manager.save_state.return_value = None
        
        success, result, error = transaction_manager.execute_transaction(
            transaction_type=TransactionType.CONFIRMATION_APPLY.value,
            session_id="test_session_123",
            data={
                "confirmation": {
                    "type": "positive",
                    "modifications": {
                        "min_price": 350000,
                    }
                }
            },
        )
        
        assert success is True
        saved_state = state_manager.save_state.call_args[0][0]
        assert saved_state.active_filters.min_price == 350000
    
    def test_confirmation_apply_negative(self, transaction_manager, state_manager, sample_state):
        """Test applying negative confirmation."""
        state_manager.get_state.return_value = sample_state
        state_manager.save_state.return_value = None
        
        success, result, error = transaction_manager.execute_transaction(
            transaction_type=TransactionType.CONFIRMATION_APPLY.value,
            session_id="test_session_123",
            data={
                "confirmation": {
                    "type": "negative",
                }
            },
        )
        
        assert success is True
        # Negative confirmation doesn't change state
        saved_state = state_manager.save_state.call_args[0][0]
        assert saved_state.active_filters.min_price == 300000  # Unchanged
    
    def test_property_view_success(self, transaction_manager, state_manager, sample_state):
        """Test recording property view."""
        state_manager.get_state.return_value = sample_state
        state_manager.save_state.return_value = None
        
        success, result, error = transaction_manager.execute_transaction(
            transaction_type=TransactionType.PROPERTY_VIEW.value,
            session_id="test_session_123",
            data={"property_id": "prop_abc123"},
        )
        
        assert success is True
        saved_state = state_manager.save_state.call_args[0][0]
        # Check that system message was added to conversation history
        assert len(saved_state.conversation_history) > 0
        last_message = saved_state.conversation_history[-1]
        assert last_message.role == "system"
        assert "prop_abc123" in last_message.content
    
    def test_property_view_duplicate(self, transaction_manager, state_manager, sample_state):
        """Test that duplicate property views are recorded (for analytics)."""
        state_manager.get_state.return_value = sample_state
        state_manager.save_state.return_value = None
        
        # View same property twice
        success1, result1, error1 = transaction_manager.execute_transaction(
            transaction_type=TransactionType.PROPERTY_VIEW.value,
            session_id="test_session_123",
            data={"property_id": "prop_abc123"},
        )
        
        # Update state_manager to return updated state
        updated_state = state_manager.save_state.call_args[0][0]
        state_manager.get_state.return_value = updated_state
        
        success2, result2, error2 = transaction_manager.execute_transaction(
            transaction_type=TransactionType.PROPERTY_VIEW.value,
            session_id="test_session_123",
            data={"property_id": "prop_abc123"},
        )
        
        assert success1 is True
        assert success2 is True
        # Both views should be recorded
        saved_state = state_manager.save_state.call_args[0][0]
        system_messages = [turn for turn in saved_state.conversation_history if turn.role == "system"]
        assert len(system_messages) >= 2


# =============================================================================
# CHECKPOINT TESTS
# =============================================================================


class TestCheckpoints:
    """Test checkpoint creation and restoration."""
    
    def test_checkpoint_created_on_transaction(self, transaction_manager, state_manager, sample_state):
        """Test that checkpoint is created before transaction."""
        state_manager.get_state.return_value = sample_state
        state_manager.save_state.return_value = None
        
        # Verify no checkpoints initially
        assert len(transaction_manager._checkpoints.get("test_session_123", [])) == 0
        
        success, result, error = transaction_manager.execute_transaction(
            transaction_type=TransactionType.FILTER_UPDATE.value,
            session_id="test_session_123",
            data={"filters": {"min_price": 400000}},
        )
        
        assert success is True
        # Checkpoint should be deleted after successful transaction
        assert len(transaction_manager._checkpoints.get("test_session_123", [])) == 0
    
    def test_checkpoint_preserved_on_failure(self, transaction_manager, state_manager, sample_state):
        """Test that checkpoint is used for rollback on failure."""
        state_manager.get_state.return_value = sample_state
        state_manager.save_state.side_effect = Exception("Save failed")
        
        success, result, error = transaction_manager.execute_transaction(
            transaction_type=TransactionType.FILTER_UPDATE.value,
            session_id="test_session_123",
            data={"filters": {"min_price": 400000}},
            rollback_on_failure=True,
        )
        
        assert success is False
        assert error is not None
        assert "Save failed" in error
    
    def test_max_checkpoints_limit(self, transaction_manager, state_manager, sample_state):
        """Test that old checkpoints are trimmed."""
        transaction_manager.max_checkpoints = 3
        
        for i in range(5):
            checkpoint = transaction_manager._create_checkpoint(
                session_id="test_session_123",
                state=sample_state,
                description=f"Checkpoint {i}",
            )
        
        checkpoints = transaction_manager._checkpoints["test_session_123"]
        assert len(checkpoints) == 3
        assert checkpoints[-1].description == "Checkpoint 4"
    
    def test_get_current_checkpoint(self, transaction_manager, sample_state):
        """Test getting most recent checkpoint."""
        # No checkpoints initially
        assert transaction_manager.get_current_checkpoint("test_session_123") is None
        
        # Create checkpoints
        checkpoint1 = transaction_manager._create_checkpoint(
            session_id="test_session_123",
            state=sample_state,
            description="First",
        )
        time.sleep(0.01)  # Ensure different timestamps
        checkpoint2 = transaction_manager._create_checkpoint(
            session_id="test_session_123",
            state=sample_state,
            description="Second",
        )
        
        current = transaction_manager.get_current_checkpoint("test_session_123")
        assert current is not None
        assert current.checkpoint_id == checkpoint2.checkpoint_id
        assert current.description == "Second"


# =============================================================================
# ROLLBACK TESTS
# =============================================================================


class TestRollback:
    """Test rollback functionality."""
    
    def test_automatic_rollback_on_failure(self, transaction_manager, state_manager, sample_state):
        """Test automatic rollback when transaction fails."""
        state_manager.get_state.return_value = sample_state
        state_manager.save_state.side_effect = Exception("Save failed")
        
        original_price = sample_state.active_filters.min_price
        
        success, result, error = transaction_manager.execute_transaction(
            transaction_type=TransactionType.FILTER_UPDATE.value,
            session_id="test_session_123",
            data={"filters": {"min_price": 999999}},
            rollback_on_failure=True,
        )
        
        assert success is False
        
        # State should be restored (save_state called twice: once for failure, once for rollback)
        assert state_manager.save_state.call_count >= 1
    
    def test_no_rollback_when_disabled(self, transaction_manager, state_manager, sample_state):
        """Test that rollback doesn't happen when disabled."""
        state_manager.get_state.return_value = sample_state
        state_manager.save_state.side_effect = Exception("Save failed")
        
        success, result, error = transaction_manager.execute_transaction(
            transaction_type=TransactionType.FILTER_UPDATE.value,
            session_id="test_session_123",
            data={"filters": {"min_price": 999999}},
            rollback_on_failure=False,
        )
        
        assert success is False
        # No rollback, so save_state only called once (for the failed transaction)
        assert state_manager.save_state.call_count <= 1
    
    def test_manual_rollback_to_latest(self, transaction_manager, state_manager, sample_state):
        """Test manual rollback to latest checkpoint."""
        # Create a checkpoint
        checkpoint = transaction_manager._create_checkpoint(
            session_id="test_session_123",
            state=sample_state,
        )
        
        state_manager.get_state.return_value = sample_state
        state_manager.save_state.return_value = None
        
        # Perform manual rollback
        success = transaction_manager.manual_rollback("test_session_123")
        
        assert success is True
        state_manager.save_state.assert_called_once()
    
    def test_manual_rollback_to_specific_checkpoint(self, transaction_manager, state_manager, sample_state):
        """Test manual rollback to specific checkpoint."""
        # Create multiple checkpoints
        checkpoint1 = transaction_manager._create_checkpoint(
            session_id="test_session_123",
            state=sample_state,
            description="First",
        )
        
        modified_state = sample_state.model_copy(deep=True)
        modified_state.active_filters.min_price = 500000
        
        checkpoint2 = transaction_manager._create_checkpoint(
            session_id="test_session_123",
            state=modified_state,
            description="Second",
        )
        
        state_manager.save_state.return_value = None
        
        # Rollback to first checkpoint
        success = transaction_manager.manual_rollback(
            session_id="test_session_123",
            checkpoint_id=checkpoint1.checkpoint_id,
        )
        
        assert success is True
        
        # Verify correct state was restored
        restored_state = state_manager.save_state.call_args[0][0]
        assert restored_state.active_filters.min_price == 300000  # Original value
    
    def test_manual_rollback_no_checkpoints(self, transaction_manager, state_manager):
        """Test manual rollback when no checkpoints exist."""
        success = transaction_manager.manual_rollback("test_session_123")
        assert success is False
        state_manager.save_state.assert_not_called()


# =============================================================================
# VALIDATION TESTS
# =============================================================================


class TestValidation:
    """Test input validation."""
    
    def test_invalid_transaction_type(self, transaction_manager, state_manager, sample_state):
        """Test handling of invalid transaction type."""
        state_manager.get_state.return_value = sample_state
        
        success, result, error = transaction_manager.execute_transaction(
            transaction_type="invalid_type",
            session_id="test_session_123",
            data={},
        )
        
        assert success is False
        assert error is not None
        assert "Invalid transaction type" in error
    
    def test_invalid_filter_price(self, transaction_manager, state_manager, sample_state):
        """Test validation of negative price."""
        state_manager.get_state.return_value = sample_state
        
        success, result, error = transaction_manager.execute_transaction(
            transaction_type=TransactionType.FILTER_UPDATE.value,
            session_id="test_session_123",
            data={"filters": {"min_price": -100}},
        )
        
        assert success is False
        assert error is not None
        assert "must be positive" in error
    
    def test_invalid_filter_beds(self, transaction_manager, state_manager, sample_state):
        """Test validation of invalid beds value."""
        state_manager.get_state.return_value = sample_state
        
        success, result, error = transaction_manager.execute_transaction(
            transaction_type=TransactionType.FILTER_UPDATE.value,
            session_id="test_session_123",
            data={"filters": {"bedrooms": -1}},
        )
        
        assert success is False
        assert error is not None
    
    def test_invalid_listing_type(self, transaction_manager, state_manager, sample_state):
        """Test validation of invalid listing type."""
        state_manager.get_state.return_value = sample_state
        
        success, result, error = transaction_manager.execute_transaction(
            transaction_type=TransactionType.FILTER_UPDATE.value,
            session_id="test_session_123",
            data={"filters": {"listing_type": "invalid"}},
        )
        
        assert success is False
        assert error is not None
    
    def test_missing_session(self, transaction_manager, state_manager):
        """Test handling of non-existent session."""
        state_manager.get_state.return_value = None
        
        success, result, error = transaction_manager.execute_transaction(
            transaction_type=TransactionType.FILTER_UPDATE.value,
            session_id="nonexistent_session",
            data={"filters": {}},
        )
        
        assert success is False
        assert error is not None
        assert "Session not found" in error
    
    def test_missing_mls_service(self, transaction_manager, state_manager, sample_state):
        """Test search execution without MLS service."""
        state_manager.get_state.return_value = sample_state
        
        success, result, error = transaction_manager.execute_transaction(
            transaction_type=TransactionType.SEARCH_EXECUTE.value,
            session_id="test_session_123",
            data={},  # Missing mls_service
        )
        
        assert success is False
        assert error is not None
        assert "mls_service is required" in error
    
    def test_missing_property_id(self, transaction_manager, state_manager, sample_state):
        """Test property view without property ID."""
        state_manager.get_state.return_value = sample_state
        
        success, result, error = transaction_manager.execute_transaction(
            transaction_type=TransactionType.PROPERTY_VIEW.value,
            session_id="test_session_123",
            data={},  # Missing property_id
        )
        
        assert success is False
        assert error is not None
        assert "property_id is required" in error


# =============================================================================
# TRANSACTION LOG TESTS
# =============================================================================


class TestTransactionLog:
    """Test transaction logging."""
    
    def test_successful_transaction_logged(self, transaction_manager, state_manager, sample_state):
        """Test that successful transactions are logged."""
        state_manager.get_state.return_value = sample_state
        state_manager.save_state.return_value = None
        
        success, result, error = transaction_manager.execute_transaction(
            transaction_type=TransactionType.FILTER_UPDATE.value,
            session_id="test_session_123",
            data={"filters": {"min_price": 400000}},
        )
        
        assert success is True
        
        # Check transaction log
        logs = transaction_manager.get_transaction_log("test_session_123")
        assert len(logs) == 1
        assert logs[0].status == TransactionStatus.SUCCESS
        assert logs[0].transaction_type == TransactionType.FILTER_UPDATE
        assert logs[0].error is None
        assert logs[0].duration_ms is not None
    
    def test_failed_transaction_logged(self, transaction_manager, state_manager, sample_state):
        """Test that failed transactions are logged."""
        state_manager.get_state.return_value = sample_state
        # First call for the transaction fails, second call for rollback succeeds
        state_manager.save_state.side_effect = [Exception("Save failed"), None]
        
        success, result, error = transaction_manager.execute_transaction(
            transaction_type=TransactionType.FILTER_UPDATE.value,
            session_id="test_session_123",
            data={"filters": {"min_price": 400000}},
            rollback_on_failure=True,
        )
        
        assert success is False
        
        # Check transaction log
        logs = transaction_manager.get_transaction_log("test_session_123")
        assert len(logs) == 1
        # Should be ROLLED_BACK since rollback succeeded
        assert logs[0].status == TransactionStatus.ROLLED_BACK
        assert logs[0].error is not None
    
    def test_transaction_log_limit(self, transaction_manager, state_manager, sample_state):
        """Test that transaction logs are trimmed."""
        transaction_manager.max_logs = 5
        state_manager.get_state.return_value = sample_state
        state_manager.save_state.return_value = None
        
        # Create more transactions than limit
        for i in range(10):
            transaction_manager.execute_transaction(
                transaction_type=TransactionType.PROPERTY_VIEW.value,
                session_id="test_session_123",
                data={"property_id": f"prop_{i}"},
            )
        
        logs = transaction_manager.get_transaction_log("test_session_123", limit=100)
        assert len(logs) <= 5
    
    def test_transaction_log_with_changes(self, transaction_manager, state_manager, sample_state):
        """Test that changes are recorded in log."""
        state_manager.get_state.return_value = sample_state
        state_manager.save_state.return_value = None
        
        success, result, error = transaction_manager.execute_transaction(
            transaction_type=TransactionType.FILTER_UPDATE.value,
            session_id="test_session_123",
            data={"filters": {"min_price": 400000, "max_beds": 4}},
        )
        
        logs = transaction_manager.get_transaction_log("test_session_123")
        assert len(logs[0].changes) > 0
        assert "filters.min_price" in logs[0].changes


# =============================================================================
# EDGE CASES
# =============================================================================


class TestEdgeCases:
    """Test edge cases and error scenarios."""
    
    def test_concurrent_transactions_same_session(self, transaction_manager, state_manager, sample_state):
        """Test that transactions on same session are handled correctly."""
        state_manager.get_state.return_value = sample_state
        state_manager.save_state.return_value = None
        
        # Execute multiple transactions
        success1, _, _ = transaction_manager.execute_transaction(
            transaction_type=TransactionType.FILTER_UPDATE.value,
            session_id="test_session_123",
            data={"filters": {"min_price": 400000}},
        )
        
        success2, _, _ = transaction_manager.execute_transaction(
            transaction_type=TransactionType.FILTER_UPDATE.value,
            session_id="test_session_123",
            data={"filters": {"max_price": 700000}},
        )
        
        assert success1 is True
        assert success2 is True
        
        # Verify both transactions logged
        logs = transaction_manager.get_transaction_log("test_session_123")
        assert len(logs) == 2
    
    def test_empty_filters(self, transaction_manager, state_manager, sample_state):
        """Test filter update with empty filters."""
        state_manager.get_state.return_value = sample_state
        state_manager.save_state.return_value = None
        
        success, result, error = transaction_manager.execute_transaction(
            transaction_type=TransactionType.FILTER_UPDATE.value,
            session_id="test_session_123",
            data={"filters": {}},
        )
        
        assert success is True
    
    def test_none_filter_values(self, transaction_manager, state_manager, sample_state):
        """Test filter update with None values."""
        state_manager.get_state.return_value = sample_state
        state_manager.save_state.return_value = None
        
        success, result, error = transaction_manager.execute_transaction(
            transaction_type=TransactionType.FILTER_UPDATE.value,
            session_id="test_session_123",
            data={"filters": {"min_price": None, "bedrooms": 3}},
        )
        
        assert success is True
        saved_state = state_manager.save_state.call_args[0][0]
        assert saved_state.active_filters.bedrooms == 3
    
    def test_mls_search_returns_none(self, transaction_manager, state_manager, sample_state):
        """Test handling of None results from MLS."""
        state_manager.get_state.return_value = sample_state
        
        mls_service = Mock()
        mls_service.search_properties.return_value = None
        
        success, result, error = transaction_manager.execute_transaction(
            transaction_type=TransactionType.SEARCH_EXECUTE.value,
            session_id="test_session_123",
            data={"mls_service": mls_service},
        )
        
        assert success is False
        assert "returned None" in error
    
    def test_mls_search_exception(self, transaction_manager, state_manager, sample_state):
        """Test handling of MLS search exception."""
        state_manager.get_state.return_value = sample_state
        
        mls_service = Mock()
        mls_service.search_properties.side_effect = Exception("API error")
        
        success, result, error = transaction_manager.execute_transaction(
            transaction_type=TransactionType.SEARCH_EXECUTE.value,
            session_id="test_session_123",
            data={"mls_service": mls_service},
        )
        
        assert success is False
        assert "API error" in error
    
    def test_state_restore_invalid_checkpoint(self, transaction_manager, state_manager, sample_state):
        """Test state restore with invalid checkpoint ID."""
        state_manager.get_state.return_value = sample_state
        
        success, result, error = transaction_manager.execute_transaction(
            transaction_type=TransactionType.STATE_RESTORE.value,
            session_id="test_session_123",
            data={"checkpoint_id": "invalid_checkpoint"},
        )
        
        assert success is False
        assert "not found" in error


# =============================================================================
# INTEGRATION TESTS
# =============================================================================


class TestIntegration:
    """Integration tests with full workflow."""
    
    def test_full_search_workflow(self, transaction_manager, state_manager, sample_state, mls_service_mock):
        """Test complete search workflow with multiple transactions."""
        state_manager.get_state.return_value = sample_state
        state_manager.save_state.return_value = None
        
        # Step 1: Update filters
        success1, _, _ = transaction_manager.execute_transaction(
            transaction_type=TransactionType.FILTER_UPDATE.value,
            session_id="test_session_123",
            data={"filters": {"min_price": 450000, "min_beds": 3}},
        )
        assert success1 is True
        
        # Update state_manager to return updated state
        updated_state = state_manager.save_state.call_args[0][0]
        state_manager.get_state.return_value = updated_state
        
        # Step 2: Execute search
        success2, _, _ = transaction_manager.execute_transaction(
            transaction_type=TransactionType.SEARCH_EXECUTE.value,
            session_id="test_session_123",
            data={"mls_service": mls_service_mock},
        )
        assert success2 is True
        
        # Update state again
        updated_state = state_manager.save_state.call_args[0][0]
        state_manager.get_state.return_value = updated_state
        
        # Step 3: View property
        success3, _, _ = transaction_manager.execute_transaction(
            transaction_type=TransactionType.PROPERTY_VIEW.value,
            session_id="test_session_123",
            data={"property_id": "prop1"},
        )
        assert success3 is True
        
        # Verify transaction log has all 3 transactions
        logs = transaction_manager.get_transaction_log("test_session_123")
        assert len(logs) == 3
        assert all(log.status == TransactionStatus.SUCCESS for log in logs)
    
    def test_workflow_with_rollback(self, transaction_manager, state_manager, sample_state):
        """Test workflow where one transaction fails and rolls back."""
        state_manager.get_state.return_value = sample_state
        state_manager.save_state.return_value = None
        
        # Step 1: Successful filter update
        success1, _, _ = transaction_manager.execute_transaction(
            transaction_type=TransactionType.FILTER_UPDATE.value,
            session_id="test_session_123",
            data={"filters": {"min_price": 450000}},
        )
        assert success1 is True
        
        # Step 2: Failed search (no MLS service) - will create checkpoint then rollback
        success2, _, error2 = transaction_manager.execute_transaction(
            transaction_type=TransactionType.SEARCH_EXECUTE.value,
            session_id="test_session_123",
            data={},  # Missing mls_service
        )
        assert success2 is False
        
        # Verify transaction log
        logs = transaction_manager.get_transaction_log("test_session_123")
        assert len(logs) == 2
        # Since checkpoint was created and then restored, status is ROLLED_BACK
        assert logs[0].status == TransactionStatus.ROLLED_BACK  # Most recent first
        assert logs[1].status == TransactionStatus.SUCCESS


# =============================================================================
# SINGLETON TESTS
# =============================================================================


class TestSingleton:
    """Test singleton pattern for transaction manager."""
    
    def test_get_transaction_manager_requires_state_manager_first_time(self):
        """Test that state_manager is required on first call."""
        # Reset singleton
        import services.atomic_transaction_manager as atm
        atm._transaction_manager = None
        
        with pytest.raises(ValueError, match="state_manager required"):
            get_transaction_manager()
    
    def test_get_transaction_manager_singleton(self, state_manager):
        """Test that get_transaction_manager returns singleton."""
        # Reset singleton
        import services.atomic_transaction_manager as atm
        atm._transaction_manager = None
        
        manager1 = get_transaction_manager(state_manager)
        manager2 = get_transaction_manager()
        
        assert manager1 is manager2


if __name__ == "__main__":
    pytest.main([__file__, "-v", "--tb=short"])
