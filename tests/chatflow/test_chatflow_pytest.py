"""
PyTest Integration for ChatFlow Tests
=====================================
Runs chatflow tests through pytest for CI/CD integration.

ZERO FUNCTIONAL CHANGES: This module is read-only and does not modify
any production code, chat flow, or APIs.

Usage:
    # Run all chatflow tests
    pytest tests/chatflow/test_chatflow_pytest.py -v
    
    # Run specific category
    pytest tests/chatflow/test_chatflow_pytest.py -v -k "off_topic"
    
    # Run with markers
    pytest tests/chatflow/test_chatflow_pytest.py -v -m critical

Author: Summitly QA Team
Date: December 31, 2025
"""

import os
import sys
from pathlib import Path

import pytest

# Add parent directory to path for imports
sys.path.insert(0, str(Path(__file__).parent.parent.parent))

from tests.chatflow import (
    ChatFlowTestRunner,
    ALL_TEST_CASES,
    YES_NO_FOLLOWUP_TESTS,
    PARTIAL_ANSWER_TESTS,
    LOCATION_SWITCH_TESTS,
    INTERRUPTION_TESTS,
    MULTI_INTENT_TESTS,
    OFF_TOPIC_TESTS,
    GENERAL_QUESTION_TESTS,
    EDGE_CASE_TESTS,
    UX_QUALITY_TESTS,
    FOLLOW_UP_HANDLING_TESTS,
    TestStatus,
    TestCategory,
    ExpectedIntent,
)


# =============================================================================
# PYTEST CONFIGURATION
# =============================================================================

# Get server URL from environment or use default
SERVER_URL = os.getenv("CHATFLOW_TEST_SERVER", "http://localhost:5050")

# Create a shared test runner
_runner = None

def get_runner():
    """Get or create the test runner (singleton pattern for efficiency)."""
    global _runner
    if _runner is None:
        _runner = ChatFlowTestRunner(
            server_url=SERVER_URL,
            verbose=False  # Less verbose for pytest
        )
    return _runner


# =============================================================================
# PYTEST FIXTURES
# =============================================================================

@pytest.fixture(scope="module")
def runner():
    """Provide a test runner instance."""
    return get_runner()


@pytest.fixture(scope="module")
def skip_if_server_unavailable():
    """Skip tests if server is not available."""
    runner = get_runner()
    if not runner.client.health_check():
        pytest.skip(f"Server not available at {SERVER_URL}")


# =============================================================================
# TEST GENERATORS
# =============================================================================

def generate_test_id(test_case):
    """Generate a pytest-friendly test ID."""
    return f"{test_case.test_id}"


# =============================================================================
# YES/NO FOLLOW-UP TESTS
# =============================================================================

class TestYesNoFollowup:
    """Tests for yes/no confirmation handling."""
    
    @pytest.mark.parametrize(
        "test_case",
        YES_NO_FOLLOWUP_TESTS,
        ids=[tc.test_id for tc in YES_NO_FOLLOWUP_TESTS]
    )
    def test_yes_no_followup(self, test_case, runner, skip_if_server_unavailable):
        """Test yes/no follow-up handling."""
        result = runner.run_single_test(test_case)
        
        assert result.status == TestStatus.PASSED, \
            f"Test {test_case.test_id} failed: {result.failed_assertions}"


# =============================================================================
# PARTIAL ANSWER TESTS
# =============================================================================

class TestPartialAnswer:
    """Tests for partial answer handling."""
    
    @pytest.mark.parametrize(
        "test_case",
        PARTIAL_ANSWER_TESTS,
        ids=[tc.test_id for tc in PARTIAL_ANSWER_TESTS]
    )
    def test_partial_answer(self, test_case, runner, skip_if_server_unavailable):
        """Test partial answer handling."""
        result = runner.run_single_test(test_case)
        
        assert result.status == TestStatus.PASSED, \
            f"Test {test_case.test_id} failed: {result.failed_assertions}"


# =============================================================================
# LOCATION SWITCH TESTS
# =============================================================================

class TestLocationSwitch:
    """Tests for location change handling."""
    
    @pytest.mark.parametrize(
        "test_case",
        LOCATION_SWITCH_TESTS,
        ids=[tc.test_id for tc in LOCATION_SWITCH_TESTS]
    )
    def test_location_switch(self, test_case, runner, skip_if_server_unavailable):
        """Test location switch handling."""
        result = runner.run_single_test(test_case)
        
        assert result.status == TestStatus.PASSED, \
            f"Test {test_case.test_id} failed: {result.failed_assertions}"


# =============================================================================
# INTERRUPTION TESTS
# =============================================================================

class TestInterruption:
    """Tests for conversation interruption handling."""
    
    @pytest.mark.parametrize(
        "test_case",
        INTERRUPTION_TESTS,
        ids=[tc.test_id for tc in INTERRUPTION_TESTS]
    )
    def test_interruption(self, test_case, runner, skip_if_server_unavailable):
        """Test interruption handling."""
        result = runner.run_single_test(test_case)
        
        assert result.status == TestStatus.PASSED, \
            f"Test {test_case.test_id} failed: {result.failed_assertions}"


# =============================================================================
# MULTI-INTENT TESTS
# =============================================================================

class TestMultiIntent:
    """Tests for multi-intent message handling."""
    
    @pytest.mark.parametrize(
        "test_case",
        MULTI_INTENT_TESTS,
        ids=[tc.test_id for tc in MULTI_INTENT_TESTS]
    )
    def test_multi_intent(self, test_case, runner, skip_if_server_unavailable):
        """Test multi-intent handling."""
        result = runner.run_single_test(test_case)
        
        assert result.status == TestStatus.PASSED, \
            f"Test {test_case.test_id} failed: {result.failed_assertions}"


# =============================================================================
# OFF-TOPIC TESTS
# =============================================================================

class TestOffTopic:
    """
    Tests for non-property related question handling.
    
    These tests verify that the chatbot:
    - Does NOT trigger MLS searches for off-topic questions
    - Does NOT provide property data for off-topic questions
    - Gracefully redirects users back to property-related topics
    - Maintains polite and helpful demeanor
    """
    
    @pytest.mark.parametrize(
        "test_case",
        OFF_TOPIC_TESTS,
        ids=[tc.test_id for tc in OFF_TOPIC_TESTS]
    )
    @pytest.mark.off_topic
    def test_off_topic(self, test_case, runner, skip_if_server_unavailable):
        """Test off-topic question handling."""
        result = runner.run_single_test(test_case)
        
        # Check for forbidden behaviors - but only on OFF-TOPIC turns, not property search turns
        # Some tests have a property search first, then off-topic question
        for i, turn in enumerate(test_case.conversation):
            if turn.expected_intent in [ExpectedIntent.OFF_TOPIC, ExpectedIntent.GENERAL_QUESTION]:
                # This turn should NOT trigger MLS search
                if i < len(result.turn_results):
                    tr = result.turn_results[i]
                    assert tr.property_count == 0, \
                        f"Test {test_case.test_id}: MLS search was triggered for off-topic question at turn {i+1}"
        
        assert result.status == TestStatus.PASSED, \
            f"Test {test_case.test_id} failed: {result.failed_assertions}"


# =============================================================================
# GENERAL QUESTION TESTS
# =============================================================================

class TestGeneralQuestion:
    """Tests for general real estate question handling."""
    
    @pytest.mark.parametrize(
        "test_case",
        GENERAL_QUESTION_TESTS,
        ids=[tc.test_id for tc in GENERAL_QUESTION_TESTS]
    )
    def test_general_question(self, test_case, runner, skip_if_server_unavailable):
        """Test general question handling."""
        result = runner.run_single_test(test_case)
        
        assert result.status == TestStatus.PASSED, \
            f"Test {test_case.test_id} failed: {result.failed_assertions}"


# =============================================================================
# EDGE CASE TESTS
# =============================================================================

class TestEdgeCase:
    """Tests for edge case handling."""
    
    @pytest.mark.parametrize(
        "test_case",
        EDGE_CASE_TESTS,
        ids=[tc.test_id for tc in EDGE_CASE_TESTS]
    )
    def test_edge_case(self, test_case, runner, skip_if_server_unavailable):
        """Test edge case handling."""
        result = runner.run_single_test(test_case)
        
        assert result.status == TestStatus.PASSED, \
            f"Test {test_case.test_id} failed: {result.failed_assertions}"


# =============================================================================
# UX QUALITY TESTS
# =============================================================================

class TestUXQuality:
    """Tests for UX quality validation."""
    
    @pytest.mark.parametrize(
        "test_case",
        UX_QUALITY_TESTS,
        ids=[tc.test_id for tc in UX_QUALITY_TESTS]
    )
    def test_ux_quality(self, test_case, runner, skip_if_server_unavailable):
        """Test UX quality."""
        result = runner.run_single_test(test_case)
        
        assert result.status == TestStatus.PASSED, \
            f"Test {test_case.test_id} failed: {result.failed_assertions}"


# =============================================================================
# CRITICAL TESTS (Priority 1)
# =============================================================================

class TestCritical:
    """Critical tests that must pass for deployment."""
    
    @pytest.mark.critical
    def test_all_critical_pass(self, runner, skip_if_server_unavailable):
        """Verify all critical tests pass."""
        critical_tests = [tc for tc in ALL_TEST_CASES if tc.priority == 1]
        
        failures = []
        for test_case in critical_tests:
            result = runner.run_single_test(test_case)
            if result.status != TestStatus.PASSED:
                failures.append({
                    "test_id": test_case.test_id,
                    "failed_assertions": result.failed_assertions
                })
        
        assert len(failures) == 0, \
            f"Critical tests failed: {failures}"


# =============================================================================
# AGGREGATE SCORE TESTS
# =============================================================================

class TestQualityScores:
    """Tests for aggregate quality scores."""
    
    @pytest.mark.slow
    def test_context_retention_score(self, runner, skip_if_server_unavailable):
        """Test that context retention score is above threshold."""
        # Run multi-turn tests only
        multi_turn_tests = [
            tc for tc in ALL_TEST_CASES 
            if len(tc.conversation) > 1
        ][:10]  # Limit for speed
        
        result = runner.run_test_suite(multi_turn_tests, "Context Retention Tests")
        
        assert result.avg_context_retention_score >= 70, \
            f"Context retention score too low: {result.avg_context_retention_score}%"
    
    @pytest.mark.slow
    def test_ux_quality_score(self, runner, skip_if_server_unavailable):
        """Test that UX quality score is above threshold."""
        result = runner.run_test_suite(
            ALL_TEST_CASES[:20],  # Limit for speed
            "UX Quality Tests"
        )
        
        assert result.avg_ux_quality_score >= 60, \
            f"UX quality score too low: {result.avg_ux_quality_score}%"


# =============================================================================
# NON-PROPERTY VALIDATION
# =============================================================================

class TestNonPropertyValidation:
    """
    Comprehensive validation that non-property questions are handled correctly.
    
    This is a focused test suite for validating that OpenAI/the chatbot
    correctly identifies and handles non-property related questions.
    """
    
    @pytest.mark.off_topic
    def test_weather_not_answered(self, runner, skip_if_server_unavailable):
        """Weather questions should not be answered with weather info."""
        from tests.chatflow import ChatFlowTestCase, ConversationTurn, ExpectedIntent, ForbiddenBehavior
        
        test = ChatFlowTestCase(
            test_id="validation_weather",
            description="Validate weather questions are redirected",
            category=TestCategory.OFF_TOPIC,
            conversation=[
                ConversationTurn(
                    message="What's the weather like in Toronto today?",
                    expected_intent=ExpectedIntent.OFF_TOPIC,
                    response_should_not_contain=["sunny", "rain", "degrees", "temperature", "celsius"],
                    should_have_properties=False,
                ),
            ],
            is_non_property_test=True,
            should_not_trigger_search=True,
            forbidden_behaviors=[ForbiddenBehavior.TRIGGER_MLS_SEARCH],
        )
        
        result = runner.run_single_test(test)
        assert result.status == TestStatus.PASSED, result.failed_assertions
    
    @pytest.mark.off_topic
    def test_food_not_answered(self, runner, skip_if_server_unavailable):
        """Food/recipe questions should not be answered with recipes."""
        from tests.chatflow import ChatFlowTestCase, ConversationTurn, ExpectedIntent, ForbiddenBehavior
        
        test = ChatFlowTestCase(
            test_id="validation_food",
            description="Validate food questions are redirected",
            category=TestCategory.OFF_TOPIC,
            conversation=[
                ConversationTurn(
                    message="How do I make butter chicken?",
                    expected_intent=ExpectedIntent.OFF_TOPIC,
                    response_should_not_contain=["recipe", "ingredients", "cook", "marinate", "spices"],
                    should_have_properties=False,
                ),
            ],
            is_non_property_test=True,
            should_not_trigger_search=True,
            forbidden_behaviors=[ForbiddenBehavior.TRIGGER_MLS_SEARCH],
        )
        
        result = runner.run_single_test(test)
        assert result.status == TestStatus.PASSED, result.failed_assertions
    
    @pytest.mark.off_topic
    def test_sports_not_answered(self, runner, skip_if_server_unavailable):
        """Sports questions should not be answered with sports info."""
        from tests.chatflow import ChatFlowTestCase, ConversationTurn, ExpectedIntent, ForbiddenBehavior
        
        test = ChatFlowTestCase(
            test_id="validation_sports",
            description="Validate sports questions are redirected",
            category=TestCategory.OFF_TOPIC,
            conversation=[
                ConversationTurn(
                    message="Who won the Stanley Cup last year?",
                    expected_intent=ExpectedIntent.OFF_TOPIC,
                    response_should_not_contain=["stanley cup", "championship", "scored", "playoffs"],
                    should_have_properties=False,
                ),
            ],
            is_non_property_test=True,
            should_not_trigger_search=True,
            forbidden_behaviors=[ForbiddenBehavior.TRIGGER_MLS_SEARCH],
        )
        
        result = runner.run_single_test(test)
        assert result.status == TestStatus.PASSED, result.failed_assertions
    
    @pytest.mark.off_topic
    def test_politics_not_answered(self, runner, skip_if_server_unavailable):
        """Political questions should not be answered."""
        from tests.chatflow import ChatFlowTestCase, ConversationTurn, ExpectedIntent, ForbiddenBehavior
        
        test = ChatFlowTestCase(
            test_id="validation_politics",
            description="Validate political questions are redirected",
            category=TestCategory.OFF_TOPIC,
            conversation=[
                ConversationTurn(
                    message="Who should I vote for in the election?",
                    expected_intent=ExpectedIntent.OFF_TOPIC,
                    response_should_not_contain=["vote", "liberal", "conservative", "election", "party"],
                    should_have_properties=False,
                ),
            ],
            is_non_property_test=True,
            should_not_trigger_search=True,
            forbidden_behaviors=[ForbiddenBehavior.TRIGGER_MLS_SEARCH],
        )
        
        result = runner.run_single_test(test)
        assert result.status == TestStatus.PASSED, result.failed_assertions
    
    @pytest.mark.off_topic  
    def test_entertainment_not_answered(self, runner, skip_if_server_unavailable):
        """Entertainment questions should not be answered."""
        from tests.chatflow import ChatFlowTestCase, ConversationTurn, ExpectedIntent, ForbiddenBehavior
        
        test = ChatFlowTestCase(
            test_id="validation_entertainment",
            description="Validate entertainment questions are redirected",
            category=TestCategory.OFF_TOPIC,
            conversation=[
                ConversationTurn(
                    message="What are the best Netflix shows right now?",
                    expected_intent=ExpectedIntent.OFF_TOPIC,
                    response_should_not_contain=["netflix", "show", "watch", "streaming", "series"],
                    should_have_properties=False,
                ),
            ],
            is_non_property_test=True,
            should_not_trigger_search=True,
            forbidden_behaviors=[ForbiddenBehavior.TRIGGER_MLS_SEARCH],
        )
        
        result = runner.run_single_test(test)
        assert result.status == TestStatus.PASSED, result.failed_assertions
    
    @pytest.mark.off_topic
    def test_off_topic_redirects_to_property(self, runner, skip_if_server_unavailable):
        """Off-topic responses should redirect to property assistance."""
        from tests.chatflow import ChatFlowTestCase, ConversationTurn, ExpectedIntent, ForbiddenBehavior
        
        test = ChatFlowTestCase(
            test_id="validation_redirect",
            description="Validate off-topic responses redirect to property help",
            category=TestCategory.OFF_TOPIC,
            conversation=[
                ConversationTurn(
                    message="What's the meaning of life?",
                    expected_intent=ExpectedIntent.OFF_TOPIC,
                    response_should_contain=["property", "real estate", "help"],
                    should_have_properties=False,
                ),
            ],
            is_non_property_test=True,
            should_not_trigger_search=True,
            forbidden_behaviors=[ForbiddenBehavior.TRIGGER_MLS_SEARCH],
        )
        
        result = runner.run_single_test(test)
        assert result.status == TestStatus.PASSED, result.failed_assertions


# =============================================================================
# FOLLOW-UP HANDLING TESTS (50 Real-Life Scenarios)
# =============================================================================

class TestFollowUpHandling:
    """
    Tests for filter/budget/location persistence after user responses.
    
    These tests verify that:
    - Price/budget filters persist unless user explicitly changes
    - Location persists unless user explicitly mentions a new location
    - Property type persists during refinements
    - Bedrooms/bathrooms persist during refinements
    - Full filter context is maintained through multi-turn conversations
    """
    
    @pytest.mark.parametrize(
        "test_case",
        FOLLOW_UP_HANDLING_TESTS,
        ids=[tc.test_id for tc in FOLLOW_UP_HANDLING_TESTS]
    )
    @pytest.mark.critical
    def test_follow_up_handling(self, test_case, runner, skip_if_server_unavailable):
        """Test follow-up handling and filter persistence."""
        result = runner.run_single_test(test_case)
        
        # Log detailed state info for debugging
        if result.status != TestStatus.PASSED:
            for tr in result.turn_results:
                print(f"Turn {tr.turn_number}: {tr.user_message}")
                print(f"  State: {tr.state_snapshot}")
                print(f"  Failed: {tr.failed_assertions}")
        
        assert result.status == TestStatus.PASSED, \
            f"Test {test_case.test_id} failed: {result.failed_assertions}"


# =============================================================================
# PYTEST MARKERS CONFIGURATION
# =============================================================================

def pytest_configure(config):
    """Configure pytest markers."""
    config.addinivalue_line(
        "markers", "off_topic: Tests for off-topic/non-property questions"
    )
    config.addinivalue_line(
        "markers", "critical: Critical tests that must pass for deployment"
    )
    config.addinivalue_line(
        "markers", "slow: Slow running tests"
    )
    config.addinivalue_line(
        "markers", "filter_persistence: Tests for filter/state persistence"
    )
