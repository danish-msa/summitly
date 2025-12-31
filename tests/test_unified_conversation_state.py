"""
Unit Tests for UnifiedConversationState
========================================
Tests full conversation flow and validation rules for the Pydantic v2 state manager.

Author: Summitly Team
Date: December 2025
"""

import pytest
import json
from datetime import datetime, timedelta
from typing import Dict, Any

from services.unified_conversation_state import (
    UnifiedConversationState,
    UnifiedConversationStateManager,
    LocationState,
    ActiveFilters,
    ConversationTurn,
    PendingConfirmation,
    ConversationMetadata,
    ConversationStage,
    ListingType,
)


# =============================================================================
# FIXTURES
# =============================================================================


@pytest.fixture
def state_manager():
    """Create a fresh state manager for each test."""
    return UnifiedConversationStateManager()


@pytest.fixture
def basic_state():
    """Create a basic state for testing."""
    return UnifiedConversationState(
        session_id="test_session_001",
        user_id="user_123",
    )


@pytest.fixture
def state_with_filters():
    """Create a state with pre-populated filters."""
    state = UnifiedConversationState(
        session_id="test_session_002",
    )
    state.update_filters(
        location="Toronto",
        property_type="condo",
        bedrooms=2,
        min_price=500000,
        max_price=800000,
        listing_type="sale",
    )
    state.location_state = LocationState(
        city="Toronto",
        neighborhood="Yorkville",
    )
    return state


# =============================================================================
# TEST: STATE CREATION AND INITIALIZATION
# =============================================================================


class TestStateCreation:
    """Tests for state creation and initialization."""
    
    def test_create_state_with_session_id(self):
        """Test creating a state with required session_id."""
        state = UnifiedConversationState(session_id="test_123")
        
        assert state.session_id == "test_123"
        assert state.user_id is None
        assert state.conversation_history == []
        assert state.last_property_results == []
        assert state.search_count == 0
        assert state.metadata.conversation_stage == ConversationStage.GREETING.value
    
    def test_create_state_with_user_id(self):
        """Test creating a state with optional user_id."""
        state = UnifiedConversationState(
            session_id="test_123",
            user_id="user_456",
        )
        
        assert state.session_id == "test_123"
        assert state.user_id == "user_456"
    
    def test_state_has_timestamps(self):
        """Test that created_at and updated_at are set."""
        state = UnifiedConversationState(session_id="test_123")
        
        assert state.created_at is not None
        assert state.updated_at is not None
        assert isinstance(state.created_at, datetime)
        assert isinstance(state.updated_at, datetime)
    
    def test_empty_location_state(self):
        """Test that location_state is empty by default."""
        state = UnifiedConversationState(session_id="test_123")
        
        assert state.location_state.is_empty()
        assert state.location_state.city is None
    
    def test_empty_active_filters(self):
        """Test that active_filters is empty by default."""
        state = UnifiedConversationState(session_id="test_123")
        
        filters = state.get_active_filters()
        # Should only have empty amenities list
        assert filters == {} or filters == {"amenities": []}


# =============================================================================
# TEST: CONVERSATION HISTORY
# =============================================================================


class TestConversationHistory:
    """Tests for conversation history management."""
    
    def test_add_user_turn(self, basic_state):
        """Test adding a user conversation turn."""
        basic_state.add_conversation_turn("user", "Show me condos in Toronto")
        
        assert len(basic_state.conversation_history) == 1
        assert basic_state.conversation_history[0].role == "user"
        assert basic_state.conversation_history[0].content == "Show me condos in Toronto"
    
    def test_add_assistant_turn(self, basic_state):
        """Test adding an assistant conversation turn."""
        basic_state.add_conversation_turn("assistant", "I found 15 condos in Toronto.")
        
        assert len(basic_state.conversation_history) == 1
        assert basic_state.conversation_history[0].role == "assistant"
    
    def test_multiple_turns(self, basic_state):
        """Test adding multiple conversation turns."""
        basic_state.add_conversation_turn("user", "Show me condos")
        basic_state.add_conversation_turn("assistant", "Here are condos...")
        basic_state.add_conversation_turn("user", "With 2 bedrooms")
        
        assert len(basic_state.conversation_history) == 3
    
    def test_turn_has_timestamp(self, basic_state):
        """Test that turns have timestamps."""
        basic_state.add_conversation_turn("user", "Hello")
        
        turn = basic_state.conversation_history[0]
        assert turn.timestamp is not None
        assert isinstance(turn.timestamp, datetime)
    
    def test_invalid_role_rejected(self, basic_state):
        """Test that invalid roles are rejected."""
        with pytest.raises(Exception):  # Pydantic ValidationError
            basic_state.add_conversation_turn("invalid_role", "Hello")


# =============================================================================
# TEST: FILTER VALIDATION
# =============================================================================


class TestFilterValidation:
    """Tests for filter validation rules."""
    
    def test_valid_bedrooms(self, basic_state):
        """Test valid bedroom counts (0-8)."""
        for beds in [0, 1, 2, 3, 4, 5, 6, 7, 8]:
            basic_state.update_filters(bedrooms=beds)
            assert basic_state.active_filters.bedrooms == beds
    
    def test_invalid_bedrooms_negative(self, basic_state):
        """Test that negative bedrooms are rejected."""
        with pytest.raises(ValueError) as exc_info:
            basic_state.update_filters(bedrooms=-1)
        assert "cannot be negative" in str(exc_info.value).lower() or "greater than" in str(exc_info.value).lower()
    
    def test_invalid_bedrooms_excessive(self, basic_state):
        """Test that excessive bedrooms (>8) are rejected."""
        with pytest.raises(ValueError) as exc_info:
            basic_state.update_filters(bedrooms=10)
        assert "8" in str(exc_info.value) or "exceed" in str(exc_info.value).lower()
    
    def test_valid_bathrooms(self, basic_state):
        """Test valid bathroom counts (0-8)."""
        for baths in [0, 1, 2, 3, 4, 5, 6, 7, 8]:
            basic_state.update_filters(bathrooms=baths)
            assert basic_state.active_filters.bathrooms == baths
    
    def test_invalid_bathrooms_negative(self, basic_state):
        """Test that negative bathrooms are rejected."""
        with pytest.raises(ValueError):
            basic_state.update_filters(bathrooms=-1)
    
    def test_valid_positive_price(self, basic_state):
        """Test valid positive prices."""
        basic_state.update_filters(min_price=500000, max_price=1000000)
        assert basic_state.active_filters.min_price == 500000
        assert basic_state.active_filters.max_price == 1000000
    
    def test_invalid_negative_price(self, basic_state):
        """Test that negative prices are rejected."""
        with pytest.raises(ValueError) as exc_info:
            basic_state.update_filters(min_price=-100)
        assert "positive" in str(exc_info.value).lower() or "greater than" in str(exc_info.value).lower()
    
    def test_invalid_zero_price(self, basic_state):
        """Test that zero price is rejected."""
        with pytest.raises(ValueError):
            basic_state.update_filters(max_price=0)
    
    def test_price_min_less_than_max(self, basic_state):
        """Test that min_price must be less than max_price."""
        with pytest.raises(ValueError) as exc_info:
            # Create state with invalid price range
            UnifiedConversationState(
                session_id="test",
                active_filters=ActiveFilters(min_price=1000000, max_price=500000)
            )
        assert "min_price" in str(exc_info.value).lower() or "less than" in str(exc_info.value).lower()
    
    def test_valid_listing_type(self, basic_state):
        """Test valid listing types."""
        basic_state.update_filters(listing_type="sale")
        assert basic_state.active_filters.listing_type == "sale"
        
        basic_state.update_filters(listing_type="rent")
        assert basic_state.active_filters.listing_type == "rent"


# =============================================================================
# TEST: CANADIAN POSTAL CODE VALIDATION
# =============================================================================


class TestPostalCodeValidation:
    """Tests for Canadian postal code validation."""
    
    def test_valid_fsa_format(self):
        """Test valid FSA (3-character) postal codes."""
        loc = LocationState(postal_code="M5V")
        assert loc.postal_code == "M5V"
        
        loc = LocationState(postal_code="m5v")  # lowercase
        assert loc.postal_code == "M5V"  # normalized to uppercase
    
    def test_valid_full_format_with_space(self):
        """Test valid full postal codes with space."""
        loc = LocationState(postal_code="M5V 3A8")
        assert loc.postal_code == "M5V 3A8"
    
    def test_valid_full_format_without_space(self):
        """Test valid full postal codes without space."""
        loc = LocationState(postal_code="M5V3A8")
        assert loc.postal_code == "M5V 3A8"  # normalized with space
    
    def test_invalid_postal_code_format(self):
        """Test that invalid postal codes are rejected."""
        with pytest.raises(ValueError) as exc_info:
            LocationState(postal_code="INVALID")
        assert "Invalid Canadian postal code" in str(exc_info.value)
    
    def test_invalid_postal_code_numbers_only(self):
        """Test that numeric-only postal codes are rejected."""
        with pytest.raises(ValueError):
            LocationState(postal_code="12345")
    
    def test_postal_code_case_normalization(self):
        """Test that postal codes are normalized to uppercase."""
        loc = LocationState(postal_code="m5v 3a8")
        assert loc.postal_code == "M5V 3A8"


# =============================================================================
# TEST: LOCATION NORMALIZATION
# =============================================================================


class TestLocationNormalization:
    """Tests for location string normalization."""
    
    def test_city_capitalization(self):
        """Test that city names are title-cased."""
        loc = LocationState(city="toronto")
        assert loc.city == "Toronto"
        
        loc = LocationState(city="TORONTO")
        assert loc.city == "Toronto"
    
    def test_neighborhood_capitalization(self):
        """Test that neighborhood names are title-cased."""
        loc = LocationState(neighborhood="yorkville")
        assert loc.neighborhood == "Yorkville"
    
    def test_whitespace_stripping(self):
        """Test that whitespace is stripped."""
        loc = LocationState(city="  Toronto  ")
        assert loc.city == "Toronto"
    
    def test_empty_string_becomes_none(self):
        """Test that empty strings become None."""
        loc = LocationState(city="   ")
        assert loc.city is None


# =============================================================================
# TEST: CHECKPOINT AND RESTORE
# =============================================================================


class TestCheckpointRestore:
    """Tests for checkpoint and restore functionality."""
    
    def test_create_checkpoint(self, state_with_filters):
        """Test creating a checkpoint."""
        checkpoint_id = state_with_filters.create_checkpoint()
        
        assert checkpoint_id is not None
        assert checkpoint_id.startswith("ckpt_")
    
    def test_restore_from_checkpoint(self, state_with_filters):
        """Test restoring from a checkpoint."""
        # Create checkpoint
        checkpoint_id = state_with_filters.create_checkpoint()
        
        # Modify state
        state_with_filters.update_filters(bedrooms=5)
        assert state_with_filters.active_filters.bedrooms == 5
        
        # Restore
        state_with_filters.restore_from_checkpoint(checkpoint_id)
        assert state_with_filters.active_filters.bedrooms == 2  # Original value
    
    def test_restore_invalid_checkpoint(self, basic_state):
        """Test restoring from invalid checkpoint raises error."""
        with pytest.raises(ValueError) as exc_info:
            basic_state.restore_from_checkpoint("invalid_checkpoint_id")
        assert "not found" in str(exc_info.value).lower()
    
    def test_multiple_checkpoints(self, basic_state):
        """Test multiple checkpoints."""
        basic_state.update_filters(bedrooms=1)
        cp1 = basic_state.create_checkpoint()
        
        basic_state.update_filters(bedrooms=2)
        cp2 = basic_state.create_checkpoint()
        
        basic_state.update_filters(bedrooms=3)
        
        # Restore to cp1
        basic_state.restore_from_checkpoint(cp1)
        assert basic_state.active_filters.bedrooms == 1
        
        # Restore to cp2
        basic_state.restore_from_checkpoint(cp2)
        assert basic_state.active_filters.bedrooms == 2


# =============================================================================
# TEST: FILTER MERGING
# =============================================================================


class TestFilterMerging:
    """Tests for filter merging behavior."""
    
    def test_merge_without_force(self, state_with_filters):
        """Test merging without force_replace keeps existing values."""
        state_with_filters.merge_filters({"bedrooms": 5}, force_replace=False)
        
        # Should keep original value since bedrooms was already set
        assert state_with_filters.active_filters.bedrooms == 2
    
    def test_merge_with_force(self, state_with_filters):
        """Test merging with force_replace overwrites values."""
        state_with_filters.merge_filters({"bedrooms": 5}, force_replace=True)
        
        # Should use new value
        assert state_with_filters.active_filters.bedrooms == 5
    
    def test_merge_new_field(self, basic_state):
        """Test merging a new field that wasn't set."""
        basic_state.merge_filters({"bedrooms": 3}, force_replace=False)
        
        # Should set the new value
        assert basic_state.active_filters.bedrooms == 3


# =============================================================================
# TEST: STATE SUMMARY
# =============================================================================


class TestStateSummary:
    """Tests for state summary functionality."""
    
    def test_get_summary_structure(self, state_with_filters):
        """Test that get_summary returns expected structure."""
        summary = state_with_filters.get_summary()
        
        assert "session_id" in summary
        assert "user_id" in summary
        assert "conversation_turns" in summary
        assert "location" in summary
        assert "active_filters" in summary
        assert "search_count" in summary
        assert "conversation_stage" in summary
        assert "created_at" in summary
        assert "updated_at" in summary
    
    def test_summary_contains_filter_info(self, state_with_filters):
        """Test that summary contains filter information."""
        summary = state_with_filters.get_summary()
        
        assert summary["active_filters"]["location"] == "Toronto"
        assert summary["active_filters"]["bedrooms"] == 2


# =============================================================================
# TEST: FULL CONVERSATION FLOW
# =============================================================================


class TestFullConversationFlow:
    """Tests for full conversation flow (greeting → filtering → viewing → confirmation)."""
    
    def test_greeting_to_filtering(self, state_manager):
        """Test transition from greeting to filtering stage."""
        state = state_manager.get_or_create("flow_test_1")
        
        # Initial state should be greeting
        assert state.metadata.conversation_stage == ConversationStage.GREETING.value
        
        # User provides initial search criteria
        state.add_conversation_turn("user", "Show me condos in Toronto")
        state.update_filters(location="Toronto", property_type="condo")
        state.set_conversation_stage(ConversationStage.FILTERING)
        
        assert state.metadata.conversation_stage == ConversationStage.FILTERING.value
    
    def test_filtering_to_viewing(self, state_manager):
        """Test transition from filtering to viewing stage."""
        state = state_manager.get_or_create("flow_test_2")
        
        # Set up filters
        state.update_filters(location="Toronto", bedrooms=2)
        state.set_conversation_stage(ConversationStage.FILTERING)
        
        # Simulate search results
        mock_results = [{"id": "1", "address": "123 Main St"}]
        state.update_search_results(mock_results)
        state.set_conversation_stage(ConversationStage.VIEWING)
        
        assert state.metadata.conversation_stage == ConversationStage.VIEWING.value
        assert len(state.last_property_results) == 1
        assert state.search_count == 1
    
    def test_viewing_to_confirmation(self, state_manager):
        """Test transition from viewing to confirmation stage."""
        state = state_manager.get_or_create("flow_test_3")
        
        # Set up with results
        state.update_search_results([{"id": "1"}])
        state.set_conversation_stage(ConversationStage.VIEWING)
        
        # User wants to book viewing - set pending confirmation
        confirmation_id = state.set_pending_confirmation(
            "book_viewing",
            {"property_id": "1"}
        )
        state.set_conversation_stage(ConversationStage.CONFIRMATION)
        
        assert state.metadata.conversation_stage == ConversationStage.CONFIRMATION.value
        assert state.has_pending_confirmation()
        assert state.pending_confirmation.type == "book_viewing"
    
    def test_confirmation_to_done(self, state_manager):
        """Test transition from confirmation to done stage."""
        state = state_manager.get_or_create("flow_test_4")
        
        state.set_pending_confirmation("save_search", {})
        state.set_conversation_stage(ConversationStage.CONFIRMATION)
        
        # User confirms
        state.clear_pending_confirmation()
        state.set_conversation_stage(ConversationStage.DONE)
        
        assert state.metadata.conversation_stage == ConversationStage.DONE.value
        assert not state.has_pending_confirmation()
    
    def test_full_flow_with_summary(self, state_manager):
        """Test full conversation flow with summary verification."""
        state = state_manager.get_or_create("full_flow_test")
        
        # Greeting
        state.add_conversation_turn("user", "Hi, I'm looking for a home")
        state.add_conversation_turn("assistant", "I'd be happy to help! What are you looking for?")
        
        # Filtering
        state.add_conversation_turn("user", "2 bedroom condos in Toronto under 800k")
        state.update_filters(
            location="Toronto",
            property_type="condo",
            bedrooms=2,
            max_price=800000,
            listing_type="sale"
        )
        state.set_conversation_stage(ConversationStage.FILTERING)
        
        # Viewing
        mock_results = [
            {"id": "1", "address": "100 King St", "price": 750000},
            {"id": "2", "address": "200 Queen St", "price": 799000},
        ]
        state.update_search_results(mock_results)
        state.add_conversation_turn("assistant", "I found 2 condos matching your criteria!")
        state.set_conversation_stage(ConversationStage.VIEWING)
        
        # Confirmation
        state.add_conversation_turn("user", "I'd like to save this search")
        state.set_pending_confirmation("save_search", {"filters": state.get_active_filters()})
        state.set_conversation_stage(ConversationStage.CONFIRMATION)
        
        # Done
        state.add_conversation_turn("assistant", "Search saved! Anything else?")
        state.clear_pending_confirmation()
        state.set_conversation_stage(ConversationStage.DONE)
        
        # Verify final state
        summary = state.get_summary()
        
        assert summary["conversation_turns"] == 6  # 3 user + 3 assistant turns
        assert summary["search_count"] == 1
        assert summary["result_count"] == 2
        assert summary["conversation_stage"] == ConversationStage.DONE.value
        assert summary["active_filters"]["location"] == "Toronto"
        assert summary["active_filters"]["bedrooms"] == 2


# =============================================================================
# TEST: STATE MANAGER
# =============================================================================


class TestStateManager:
    """Tests for UnifiedConversationStateManager."""
    
    def test_get_or_create_new_session(self, state_manager):
        """Test creating a new session."""
        state = state_manager.get_or_create("new_session_123")
        
        assert state.session_id == "new_session_123"
        assert state_manager.get_active_session_count() == 1
    
    def test_get_or_create_existing_session(self, state_manager):
        """Test retrieving an existing session."""
        # Create session
        state1 = state_manager.get_or_create("existing_session")
        state1.update_filters(bedrooms=3)
        state_manager.save(state1)
        
        # Retrieve session
        state2 = state_manager.get_or_create("existing_session")
        
        assert state2.session_id == "existing_session"
        assert state2.active_filters.bedrooms == 3
    
    def test_save_and_retrieve(self, state_manager):
        """Test saving and retrieving state."""
        state = state_manager.get_or_create("save_test")
        state.update_filters(location="Vancouver", bedrooms=2)
        state_manager.save(state)
        
        # Create new manager and retrieve
        state2 = state_manager.get_or_create("save_test")
        
        assert state2.active_filters.location == "Vancouver"
        assert state2.active_filters.bedrooms == 2
    
    def test_delete_session(self, state_manager):
        """Test deleting a session."""
        state = state_manager.get_or_create("delete_test")
        assert state_manager.get_active_session_count() >= 1
        
        state_manager.delete("delete_test")
        
        # Creating same session should give fresh state
        state2 = state_manager.get_or_create("delete_test")
        assert state2.conversation_history == []


# =============================================================================
# TEST: LEGACY COMPATIBILITY
# =============================================================================


class TestLegacyCompatibility:
    """Tests for legacy dict format compatibility."""
    
    def test_to_legacy_dict(self, state_with_filters):
        """Test conversion to legacy dict format."""
        legacy = state_with_filters.to_legacy_dict()
        
        assert legacy["session_id"] == "test_session_002"
        assert legacy["location"] == "Toronto"
        assert legacy["bedrooms"] == 2
        assert legacy["property_type"] == "Condo"
        assert legacy["listing_type"] == "sale"
        assert legacy["price_range"] == (500000, 800000)
    
    def test_from_legacy_dict(self):
        """Test creation from legacy dict format."""
        legacy_data = {
            "session_id": "legacy_session",
            "location": "Vancouver",
            "bedrooms": 3,
            "bathrooms": 2,
            "property_type": "detached",
            "price_range": (600000, 1000000),
            "listing_type": "sale",
            "amenities": ["pool", "gym"],
            "conversation_history": [
                {"role": "user", "content": "Hello"},
                {"role": "assistant", "content": "Hi there!"},
            ],
            "search_count": 5,
        }
        
        state = UnifiedConversationState.from_legacy_dict(legacy_data)
        
        assert state.session_id == "legacy_session"
        assert state.active_filters.location == "Vancouver"
        assert state.active_filters.bedrooms == 3
        assert state.active_filters.min_price == 600000
        assert state.active_filters.max_price == 1000000
        assert len(state.conversation_history) == 2
        assert state.search_count == 5


# =============================================================================
# TEST: ZERO RESULTS UX
# =============================================================================


class TestZeroResultsUX:
    """Tests for zero results tracking and UX improvements."""
    
    def test_zero_results_count_initialized_to_zero(self):
        """Test that zero_results_count starts at 0."""
        state = UnifiedConversationState(session_id="test_zero_1")
        assert state.zero_results_count == 0
    
    def test_zero_results_count_increments_on_empty_search(self):
        """Test that zero_results_count increments when search returns 0 results."""
        state = UnifiedConversationState(session_id="test_zero_2")
        state.update_filters(location="Toronto", bedrooms=5, min_price=2000000)
        
        # Simulate first zero-result search
        state.update_search_results([], increment_count=True)
        assert state.zero_results_count == 1
        assert state.search_count == 1
        
        # Simulate second zero-result search
        state.update_search_results([], increment_count=True)
        assert state.zero_results_count == 2
        assert state.search_count == 2
    
    def test_zero_results_count_resets_on_successful_search(self):
        """Test that zero_results_count resets to 0 when results are found."""
        state = UnifiedConversationState(session_id="test_zero_3")
        state.update_filters(location="Toronto", bedrooms=2)
        
        # First search returns nothing
        state.update_search_results([], increment_count=True)
        assert state.zero_results_count == 1
        
        # Second search returns nothing  
        state.update_search_results([], increment_count=True)
        assert state.zero_results_count == 2
        
        # Third search returns results
        state.update_search_results([{"id": 1, "price": 500000}], increment_count=True)
        assert state.zero_results_count == 0
        assert state.search_count == 3
    
    def test_last_successful_filters_stored_on_success(self):
        """Test that last_successful_filters is stored when search returns results."""
        state = UnifiedConversationState(session_id="test_zero_4")
        state.update_filters(location="Toronto", bedrooms=2, max_price=700000)
        
        # Successful search
        state.update_search_results([{"id": 1}], increment_count=True)
        
        assert state.last_successful_filters is not None
        assert state.last_successful_filters.location == "Toronto"
        assert state.last_successful_filters.bedrooms == 2
        assert state.last_successful_filters.max_price == 700000
    
    def test_last_successful_filters_preserved_on_zero_results(self):
        """Test that last_successful_filters is preserved when zero results occur."""
        state = UnifiedConversationState(session_id="test_zero_5")
        
        # First successful search
        state.update_filters(location="Toronto", bedrooms=2)
        state.update_search_results([{"id": 1}], increment_count=True)
        original_filters = state.last_successful_filters.model_copy()
        
        # Now stricter search returns nothing
        state.update_filters(bedrooms=5, min_price=5000000)
        state.update_search_results([], increment_count=True)
        
        # Last successful filters should still be the original
        assert state.last_successful_filters is not None
        assert state.last_successful_filters.bedrooms == 2
    
    def test_is_view_results_request_positive_phrases(self):
        """Test is_view_results_request detects view results phrases."""
        state = UnifiedConversationState(session_id="test_view_1")
        state.search_count = 1  # Must have at least one search
        
        positive_phrases = [
            "Show me the best options",
            "What do you have so far?",
            "show results",
            "What's available?",
            "BEST MATCHES",  # Test case insensitivity
            "show me what you have",
        ]
        
        for phrase in positive_phrases:
            assert state.is_view_results_request(phrase), f"Should detect: '{phrase}'"
    
    def test_is_view_results_request_negative_phrases(self):
        """Test is_view_results_request does NOT match regular messages."""
        state = UnifiedConversationState(session_id="test_view_2")
        state.search_count = 1
        
        negative_phrases = [
            "I want 3 bedrooms",
            "Show me houses in Vancouver",
            "What's the price?",
            "Hello",
            "Change location to Ottawa",
        ]
        
        for phrase in negative_phrases:
            assert not state.is_view_results_request(phrase), f"Should NOT detect: '{phrase}'"
    
    def test_is_view_results_request_requires_prior_search(self):
        """Test that is_view_results_request returns False if no search has been done."""
        state = UnifiedConversationState(session_id="test_view_3")
        assert state.search_count == 0
        
        # Even with matching phrase, should return False
        assert not state.is_view_results_request("Show me the best options")
    
    def test_suggest_filter_relaxation_with_price_filter(self):
        """Test relaxation suggestion when price filter is set."""
        state = UnifiedConversationState(session_id="test_relax_1")
        state.update_filters(location="Toronto", min_price=800000, max_price=1000000)
        state.update_search_results([], increment_count=True)
        
        suggestion = state.suggest_filter_relaxation()
        assert "price" in suggestion.lower()
    
    def test_suggest_filter_relaxation_with_bedroom_filter(self):
        """Test relaxation suggestion when bedroom filter is set."""
        state = UnifiedConversationState(session_id="test_relax_2")
        state.update_filters(location="Toronto", bedrooms=5)
        state.update_search_results([], increment_count=True)
        
        suggestion = state.suggest_filter_relaxation()
        assert "bedroom" in suggestion.lower() or "5" in suggestion
    
    def test_get_relaxation_suggestions_returns_list(self):
        """Test that get_relaxation_suggestions returns a list of suggestions."""
        state = UnifiedConversationState(session_id="test_relax_3")
        state.update_filters(
            location="Toronto",
            bedrooms=4,
            min_price=1000000,
            max_price=1500000,
            property_type="detached"
        )
        state.update_search_results([], increment_count=True)
        
        suggestions = state.get_relaxation_suggestions()
        
        assert isinstance(suggestions, list)
        assert len(suggestions) > 0
    
    def test_consecutive_zero_results_then_view_request_flow(self):
        """
        Integration test: 2 consecutive zero-result searches followed by
        'Show me the best options' should detect view request.
        """
        state = UnifiedConversationState(session_id="test_flow_1")
        
        # Setup filters
        state.update_filters(location="Toronto", bedrooms=5, min_price=3000000)
        
        # First search - zero results
        state.update_search_results([], increment_count=True)
        assert state.zero_results_count == 1
        
        # Second search - zero results
        state.update_search_results([], increment_count=True)
        assert state.zero_results_count == 2
        
        # User asks to view results
        is_view_request = state.is_view_results_request("Show me the best options")
        assert is_view_request
        
        # Should trigger relaxation suggestion path
        assert state.zero_results_count >= 2
    
    def test_cached_results_reuse_flow(self):
        """
        Integration test: Non-empty last_property_results with 'Show me the best options'
        should allow cache reuse (no new MLS call needed).
        """
        state = UnifiedConversationState(session_id="test_flow_2")
        
        # Successful search
        state.update_filters(location="Toronto", bedrooms=2)
        properties = [
            {"id": "1", "price": 500000, "bedrooms": 2},
            {"id": "2", "price": 550000, "bedrooms": 2},
        ]
        state.update_search_results(properties, increment_count=True)
        
        # Verify cached results
        assert len(state.last_property_results) == 2
        assert state.zero_results_count == 0
        
        # User asks to view results
        is_view_request = state.is_view_results_request("What do you have so far?")
        assert is_view_request
        
        # Cache is available
        assert len(state.last_property_results) > 0
    
    def test_legacy_dict_roundtrip_with_zero_results_fields(self):
        """Test that zero_results_count and last_successful_filters survive legacy roundtrip."""
        state = UnifiedConversationState(session_id="test_legacy_zero")
        state.update_filters(location="Ottawa", bedrooms=3)
        
        # Successful search
        state.update_search_results([{"id": "1"}], increment_count=True)
        
        # Then zero result
        state.update_filters(min_price=5000000)
        state.update_search_results([], increment_count=True)
        
        assert state.zero_results_count == 1
        assert state.last_successful_filters is not None
        
        # Convert to legacy and back
        legacy = state.to_legacy_dict()
        restored = UnifiedConversationState.from_legacy_dict(legacy)
        
        assert restored.zero_results_count == 1
        assert restored.last_successful_filters is not None
        assert restored.last_successful_filters.location == "Ottawa"


# =============================================================================
# RUN TESTS
# =============================================================================


if __name__ == "__main__":
    pytest.main([__file__, "-v", "--tb=short"])
