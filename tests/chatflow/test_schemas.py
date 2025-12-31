"""
ChatFlow Test Schemas
=====================
Pydantic-based schemas for defining chatflow test cases.
Provides type-safe, validated test case definitions for the Summitly AI
Real Estate Assistant chatflow testing framework.

ZERO FUNCTIONAL CHANGES: This module is read-only and does not modify
any production code, chat flow, or APIs.

Author: Summitly QA Team
Date: December 31, 2025
"""

from __future__ import annotations

import re
from datetime import datetime
from enum import Enum
from typing import Any, Dict, List, Optional, Union

from pydantic import (
    BaseModel,
    ConfigDict,
    Field,
    field_validator,
    model_validator,
)


# =============================================================================
# ENUMS
# =============================================================================


class TestCategory(str, Enum):
    """Test categories for organizing chatflow tests."""
    
    # Follow-up tests
    YES_NO_FOLLOWUP = "yes_no_followup"
    PARTIAL_ANSWER = "partial_answer"
    
    # Context tests
    LOCATION_SWITCH = "location_switch"
    CONTEXT_PRESERVATION = "context_preservation"
    CONTEXT_MUTATION = "context_mutation"
    
    # Intent tests
    MULTI_INTENT = "multi_intent"
    INTERRUPTION = "interruption"
    
    # Edge cases
    EDGE_CASE = "edge_case"
    ERROR_HANDLING = "error_handling"
    
    # Non-property related
    OFF_TOPIC = "off_topic"
    GENERAL_QUESTION = "general_question"
    
    # UX quality
    UX_QUALITY = "ux_quality"
    RESPONSE_QUALITY = "response_quality"


class ExpectedIntent(str, Enum):
    """Expected intent classifications."""
    
    PROPERTY_SEARCH = "property_search"
    PROPERTY_REFINEMENT = "property_refinement"
    PROPERTY_CHANGE_REQUEST = "property_change_request"
    CONFIRMATION_NEEDED = "confirmation_needed"
    CONFIRMATION = "confirmation"
    OFF_TOPIC = "off_topic"
    GENERAL_CHAT = "general_chat"
    GENERAL_QUESTION = "general_question"
    VALUATION = "valuation"
    DETAILS = "details"
    RESET = "reset"


class ForbiddenBehavior(str, Enum):
    """Behaviors that should NOT occur during the test."""
    
    ASK_BUDGET_AGAIN = "ask_budget_again"
    ASK_LOCATION_AGAIN = "ask_location_again"
    ASK_PROPERTY_TYPE_AGAIN = "ask_property_type_again"
    ASK_BEDROOMS_AGAIN = "ask_bedrooms_again"
    RESET_FILTERS = "reset_filters"
    IGNORE_CONTEXT = "ignore_context"
    DUPLICATE_QUESTION = "duplicate_question"
    ROBOTIC_RESPONSE = "robotic_response"
    TRIGGER_MLS_SEARCH = "trigger_mls_search"  # For off-topic tests
    PROVIDE_PROPERTY_DATA = "provide_property_data"  # For off-topic tests


class TestStatus(str, Enum):
    """Status of a test execution."""
    
    PASSED = "passed"
    FAILED = "failed"
    SKIPPED = "skipped"
    ERROR = "error"
    TIMEOUT = "timeout"


# =============================================================================
# NESTED MODELS
# =============================================================================


class ConversationTurn(BaseModel):
    """A single turn in a multi-turn conversation test."""
    
    model_config = ConfigDict(
        validate_assignment=True,
        str_strip_whitespace=True,
    )
    
    # Required fields
    role: str = Field(
        default="user",
        description="Role of the speaker: 'user' or 'assistant'"
    )
    message: str = Field(
        ...,
        description="The message content",
        min_length=0,  # Empty message is valid for edge case testing
        max_length=5000
    )
    
    # Expected state after this turn
    expected_intent: Optional[ExpectedIntent] = Field(
        default=None,
        description="Expected intent classification for this turn"
    )
    expected_entities: Optional[Dict[str, Any]] = Field(
        default=None,
        description="Expected extracted entities (location, bedrooms, etc.)"
    )
    expected_state_fields: Optional[Dict[str, Any]] = Field(
        default=None,
        description="Expected state field values after this turn"
    )
    
    # Assertions for this turn
    response_should_contain: Optional[List[str]] = Field(
        default=None,
        description="Strings that MUST appear in the bot response"
    )
    response_should_not_contain: Optional[List[str]] = Field(
        default=None,
        description="Strings that MUST NOT appear in the bot response"
    )
    should_have_properties: Optional[bool] = Field(
        default=None,
        description="Whether the response should include properties"
    )
    property_count_range: Optional[tuple] = Field(
        default=None,
        description="Expected property count range (min, max)"
    )
    
    @field_validator('role')
    @classmethod
    def validate_role(cls, v: str) -> str:
        """Validate role is either 'user' or 'assistant'."""
        if v.lower() not in ('user', 'assistant'):
            raise ValueError("Role must be 'user' or 'assistant'")
        return v.lower()


class ExpectedStateAfterTurn(BaseModel):
    """Expected conversation state after a specific turn."""
    
    model_config = ConfigDict(
        validate_assignment=True,
    )
    
    turn_number: int = Field(
        ...,
        description="The turn number (0-indexed)",
        ge=0
    )
    
    # Location state
    location: Optional[str] = Field(default=None)
    city: Optional[str] = Field(default=None)
    neighborhood: Optional[str] = Field(default=None)
    postal_code: Optional[str] = Field(default=None)
    
    # Filters
    bedrooms: Optional[int] = Field(default=None)
    bathrooms: Optional[int] = Field(default=None)
    property_type: Optional[str] = Field(default=None)
    listing_type: Optional[str] = Field(default=None)
    min_price: Optional[int] = Field(default=None)
    max_price: Optional[int] = Field(default=None)
    
    # Flags
    should_preserve_previous: Optional[List[str]] = Field(
        default=None,
        description="State fields that MUST be preserved from previous turn"
    )
    should_change: Optional[List[str]] = Field(
        default=None,
        description="State fields that SHOULD change in this turn"
    )
    should_not_reset: Optional[List[str]] = Field(
        default=None,
        description="State fields that MUST NOT be reset to None/default"
    )


class UXAssertion(BaseModel):
    """UX quality assertions for response validation."""
    
    model_config = ConfigDict(
        validate_assignment=True,
    )
    
    # Response quality
    max_response_length: Optional[int] = Field(
        default=1000,
        description="Maximum acceptable response length in characters"
    )
    min_response_length: Optional[int] = Field(
        default=10,
        description="Minimum acceptable response length"
    )
    
    # Language quality
    must_be_polite: bool = Field(
        default=True,
        description="Response must not contain rude or dismissive language"
    )
    must_be_natural: bool = Field(
        default=True,
        description="Response must not sound robotic or template-like"
    )
    must_have_next_action: bool = Field(
        default=False,
        description="Response must suggest a clear next action"
    )
    
    # Clarification quality
    no_duplicate_clarification: bool = Field(
        default=True,
        description="Must not ask the same clarification question again"
    )
    no_redundant_questions: bool = Field(
        default=True,
        description="Must not ask for information already provided"
    )
    
    # Context awareness
    must_reference_prior_context: bool = Field(
        default=False,
        description="Response must reference previously discussed topics"
    )


# =============================================================================
# MAIN TEST CASE SCHEMA
# =============================================================================


class ChatFlowTestCase(BaseModel):
    """
    Complete test case definition for chatflow testing.
    
    This schema defines all aspects of a multi-turn conversation test,
    including expected state, assertions, and forbidden behaviors.
    
    Example:
        >>> test_case = ChatFlowTestCase(
        ...     test_id="yes_no_001",
        ...     description="Test 'yes' follow-up after budget confirmation",
        ...     category=TestCategory.YES_NO_FOLLOWUP,
        ...     conversation=[
        ...         ConversationTurn(message="Show me condos under 500k"),
        ...         ConversationTurn(message="yes", expected_intent=ExpectedIntent.CONFIRMATION)
        ...     ],
        ...     expected_intent=ExpectedIntent.CONFIRMATION,
        ...     forbidden_behaviors=[ForbiddenBehavior.ASK_BUDGET_AGAIN]
        ... )
    """
    
    model_config = ConfigDict(
        validate_assignment=True,
        str_strip_whitespace=True,
    )
    
    # Identification
    test_id: str = Field(
        ...,
        description="Unique test identifier",
        min_length=1,
        max_length=100,
        pattern=r'^[a-zA-Z0-9_-]+$'
    )
    description: str = Field(
        ...,
        description="Human-readable test description",
        min_length=10,
        max_length=500
    )
    category: TestCategory = Field(
        ...,
        description="Test category for grouping and filtering"
    )
    
    # Conversation flow
    conversation: List[ConversationTurn] = Field(
        ...,
        description="Multi-turn conversation to simulate",
        min_length=1
    )
    
    # Expected outcomes (after full conversation)
    expected_intent: Optional[ExpectedIntent] = Field(
        default=None,
        description="Expected final intent classification"
    )
    expected_entities: Optional[Dict[str, Any]] = Field(
        default=None,
        description="Expected extracted entities at end of conversation"
    )
    expected_state_after_each_turn: Optional[List[ExpectedStateAfterTurn]] = Field(
        default=None,
        description="Expected state after each turn in the conversation"
    )
    
    # Behavioral assertions
    forbidden_behaviors: Optional[List[ForbiddenBehavior]] = Field(
        default=None,
        description="Behaviors that MUST NOT occur during the test"
    )
    
    # UX quality assertions
    ux_assertions: Optional[UXAssertion] = Field(
        default=None,
        description="UX quality assertions for the test"
    )
    
    # Non-property test specific
    is_non_property_test: bool = Field(
        default=False,
        description="Whether this tests non-property related questions (off-topic, general)"
    )
    should_not_trigger_search: bool = Field(
        default=False,
        description="Whether MLS search should NOT be triggered"
    )
    expected_response_type: Optional[str] = Field(
        default=None,
        description="Expected type of response: 'redirect_to_property', 'general_info', 'off_topic_graceful'"
    )
    
    # Determinism
    is_deterministic: bool = Field(
        default=True,
        description="Whether test results should be identical across runs"
    )
    allowed_variance_fields: Optional[List[str]] = Field(
        default=None,
        description="Fields allowed to vary between runs (for non-deterministic tests)"
    )
    
    # Metadata
    priority: int = Field(
        default=2,
        description="Test priority: 1=critical, 2=high, 3=medium, 4=low",
        ge=1,
        le=4
    )
    tags: Optional[List[str]] = Field(
        default=None,
        description="Tags for filtering and grouping tests"
    )
    created_at: Optional[datetime] = Field(
        default_factory=datetime.now
    )
    
    @field_validator('conversation')
    @classmethod
    def validate_conversation(cls, v: List[ConversationTurn]) -> List[ConversationTurn]:
        """Ensure at least one user message in conversation."""
        user_turns = [turn for turn in v if turn.role == 'user']
        if not user_turns:
            raise ValueError("Conversation must have at least one user message")
        return v
    
    @model_validator(mode='after')
    def validate_non_property_test(self):
        """Validate non-property test configurations."""
        if self.is_non_property_test:
            # Ensure forbidden behaviors include property-related ones
            if self.forbidden_behaviors is None:
                self.forbidden_behaviors = []
            if ForbiddenBehavior.TRIGGER_MLS_SEARCH not in self.forbidden_behaviors:
                self.forbidden_behaviors.append(ForbiddenBehavior.TRIGGER_MLS_SEARCH)
        return self


# =============================================================================
# TEST RESULT SCHEMAS
# =============================================================================


class TurnResult(BaseModel):
    """Result of a single conversation turn."""
    
    model_config = ConfigDict(
        validate_assignment=True,
    )
    
    turn_number: int
    user_message: str
    bot_response: str
    
    # Response metadata
    response_time_ms: float
    intent_detected: Optional[str] = None
    confidence: Optional[float] = None
    entities_extracted: Optional[Dict[str, Any]] = None
    
    # Property results
    property_count: int = 0
    properties: Optional[List[Dict[str, Any]]] = None
    
    # State after turn
    state_snapshot: Optional[Dict[str, Any]] = None
    
    # Assertions
    passed_assertions: List[str] = Field(default_factory=list)
    failed_assertions: List[str] = Field(default_factory=list)
    
    # UX metrics
    response_length: int = 0
    is_polite: bool = True
    is_natural: bool = True
    has_next_action: bool = False
    has_duplicate_question: bool = False


class TestCaseResult(BaseModel):
    """Complete result of a chatflow test case execution."""
    
    model_config = ConfigDict(
        validate_assignment=True,
    )
    
    # Test identification
    test_id: str
    description: str
    category: TestCategory
    
    # Execution info
    status: TestStatus
    session_id: str
    started_at: datetime
    completed_at: datetime
    total_duration_ms: float
    
    # Turn-by-turn results
    turn_results: List[TurnResult] = Field(default_factory=list)
    
    # Overall assertions
    all_assertions_passed: bool
    passed_assertions: List[str] = Field(default_factory=list)
    failed_assertions: List[str] = Field(default_factory=list)
    
    # Forbidden behavior violations
    forbidden_behavior_violations: List[str] = Field(default_factory=list)
    
    # UX scores (0-100)
    context_retention_score: float = 0.0
    followup_correctness_score: float = 0.0
    nlp_extraction_accuracy: float = 0.0
    ux_quality_score: float = 0.0
    
    # Error info
    error_message: Optional[str] = None
    error_traceback: Optional[str] = None
    
    # Determinism check
    is_deterministic_pass: bool = True
    determinism_variance: Optional[Dict[str, Any]] = None


class TestSuiteResult(BaseModel):
    """Result of running a complete test suite."""
    
    model_config = ConfigDict(
        validate_assignment=True,
    )
    
    # Suite info
    suite_name: str
    version: str = "1.0.0"
    server_url: str
    
    # Execution info
    started_at: datetime
    completed_at: datetime
    total_duration_seconds: float
    
    # Summary counts
    total_tests: int
    passed: int
    failed: int
    errors: int
    skipped: int
    pass_rate: float
    
    # Category breakdown
    category_results: Dict[str, Dict[str, int]] = Field(default_factory=dict)
    
    # Aggregate scores (0-100)
    avg_context_retention_score: float = 0.0
    avg_followup_correctness_score: float = 0.0
    avg_nlp_extraction_accuracy: float = 0.0
    avg_ux_quality_score: float = 0.0
    
    # Latency metrics
    avg_response_time_ms: float = 0.0
    min_response_time_ms: float = 0.0
    max_response_time_ms: float = 0.0
    p95_response_time_ms: float = 0.0
    
    # Individual results
    test_results: List[TestCaseResult] = Field(default_factory=list)
    
    # Failures summary
    failures: List[Dict[str, Any]] = Field(default_factory=list)
    
    # Environment
    environment: Dict[str, str] = Field(default_factory=dict)
