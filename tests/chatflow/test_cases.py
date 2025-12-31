"""
ChatFlow Test Case Definitions
==============================
Comprehensive test case definitions for automated chatflow testing.
Covers all test categories including:
- Yes/No follow-up tests
- Partial answer tests
- Location switch tests
- Interruption tests
- Multi-intent tests
- Edge case tests
- Non-property related question tests (OFF-TOPIC)

ZERO FUNCTIONAL CHANGES: This module is read-only and does not modify
any production code, chat flow, or APIs.

Author: Summitly QA Team
Date: December 31, 2025
"""

from typing import List

from tests.chatflow.test_schemas import (
    ChatFlowTestCase,
    ConversationTurn,
    ExpectedIntent,
    ExpectedStateAfterTurn,
    ForbiddenBehavior,
    TestCategory,
    UXAssertion,
)


# =============================================================================
# YES/NO FOLLOW-UP TESTS
# =============================================================================
# Tests for yes/no responses after property search.
# NOTE: "yes"/"no" without a pending confirmation will return general_chat.
# The key UX tests are: filters preserved, no duplicate questions.

YES_NO_FOLLOWUP_TESTS: List[ChatFlowTestCase] = [
    ChatFlowTestCase(
        test_id="yes_no_001",
        description="Test 'yes' after property search - filters should be preserved",
        category=TestCategory.YES_NO_FOLLOWUP,
        conversation=[
            ConversationTurn(
                message="Show me condos in Toronto under 500k",
                expected_intent=ExpectedIntent.PROPERTY_SEARCH,
            ),
            ConversationTurn(
                message="yes",
                # Without pending confirmation, this is general_chat (correct behavior)
                expected_intent=ExpectedIntent.GENERAL_CHAT,
                response_should_not_contain=["what", "which location"],
            ),
        ],
        expected_intent=ExpectedIntent.GENERAL_CHAT,
        forbidden_behaviors=[
            ForbiddenBehavior.ASK_LOCATION_AGAIN,
            ForbiddenBehavior.ASK_BUDGET_AGAIN,
            ForbiddenBehavior.RESET_FILTERS,
        ],
        ux_assertions=UXAssertion(
            no_duplicate_clarification=True,
            no_redundant_questions=True,
        ),
        priority=1,
        tags=["confirmation", "yes_no", "filter_persistence"],
    ),
    
    ChatFlowTestCase(
        test_id="yes_no_002",
        description="Test 'no' after property search - filters should be preserved",
        category=TestCategory.YES_NO_FOLLOWUP,
        conversation=[
            ConversationTurn(
                message="Show me houses in Mississauga",
                expected_intent=ExpectedIntent.PROPERTY_SEARCH,
            ),
            ConversationTurn(
                message="no",
                # Without pending confirmation, this is general_chat (correct behavior)
                expected_intent=ExpectedIntent.GENERAL_CHAT,
            ),
        ],
        expected_intent=ExpectedIntent.GENERAL_CHAT,
        forbidden_behaviors=[
            ForbiddenBehavior.RESET_FILTERS,
            ForbiddenBehavior.IGNORE_CONTEXT,
        ],
        ux_assertions=UXAssertion(
            must_have_next_action=True,
        ),
        priority=1,
        tags=["confirmation", "yes_no", "filter_persistence"],
    ),
    
    ChatFlowTestCase(
        test_id="yes_no_003",
        description="Test 'sure' after property search - filters should be preserved",
        category=TestCategory.YES_NO_FOLLOWUP,
        conversation=[
            ConversationTurn(
                message="2 bedroom rentals in downtown Toronto",
                expected_intent=ExpectedIntent.PROPERTY_SEARCH,
            ),
            ConversationTurn(
                message="sure",
                expected_intent=ExpectedIntent.GENERAL_CHAT,
            ),
        ],
        expected_intent=ExpectedIntent.GENERAL_CHAT,
        forbidden_behaviors=[
            ForbiddenBehavior.ASK_BEDROOMS_AGAIN,
            ForbiddenBehavior.ASK_LOCATION_AGAIN,
            ForbiddenBehavior.RESET_FILTERS,
        ],
        priority=2,
        tags=["confirmation", "colloquial", "filter_persistence"],
    ),
    
    ChatFlowTestCase(
        test_id="yes_no_004",
        description="Test 'sounds good' after property search - filters preserved",
        category=TestCategory.YES_NO_FOLLOWUP,
        conversation=[
            ConversationTurn(
                message="Show me properties in Vancouver",
                expected_intent=ExpectedIntent.PROPERTY_SEARCH,
            ),
            ConversationTurn(
                message="sounds good",
                expected_intent=ExpectedIntent.GENERAL_CHAT,
            ),
        ],
        expected_intent=ExpectedIntent.GENERAL_CHAT,
        forbidden_behaviors=[
            ForbiddenBehavior.ASK_LOCATION_AGAIN,
            ForbiddenBehavior.RESET_FILTERS,
        ],
        priority=2,
        tags=["confirmation", "colloquial", "filter_persistence"],
    ),
    
    ChatFlowTestCase(
        test_id="yes_no_005",
        description="Test 'nope' after property search - filters preserved",
        category=TestCategory.YES_NO_FOLLOWUP,
        conversation=[
            ConversationTurn(
                message="Condos in Ottawa",
                expected_intent=ExpectedIntent.PROPERTY_SEARCH,
            ),
            ConversationTurn(
                message="nope",
                expected_intent=ExpectedIntent.GENERAL_CHAT,
            ),
        ],
        expected_intent=ExpectedIntent.GENERAL_CHAT,
        forbidden_behaviors=[
            ForbiddenBehavior.RESET_FILTERS,
        ],
        priority=2,
        tags=["confirmation", "colloquial", "filter_persistence"],
    ),
]


# =============================================================================
# PARTIAL ANSWER TESTS
# =============================================================================
# Tests for handling partial information from users

PARTIAL_ANSWER_TESTS: List[ChatFlowTestCase] = [
    ChatFlowTestCase(
        test_id="partial_001",
        description="Test budget-only response - should preserve previous location",
        category=TestCategory.PARTIAL_ANSWER,
        conversation=[
            ConversationTurn(
                message="Show me condos in Toronto",
                expected_intent=ExpectedIntent.PROPERTY_SEARCH,
            ),
            ConversationTurn(
                message="under 600k",
                expected_intent=ExpectedIntent.PROPERTY_REFINEMENT,
                expected_entities={"max_price": 600000},
            ),
        ],
        expected_state_after_each_turn=[
            ExpectedStateAfterTurn(
                turn_number=0,
                location="Toronto",
                property_type="condo",
            ),
            ExpectedStateAfterTurn(
                turn_number=1,
                location="Toronto",
                property_type="condo",
                max_price=600000,
                should_preserve_previous=["location", "property_type"],
            ),
        ],
        forbidden_behaviors=[
            ForbiddenBehavior.ASK_LOCATION_AGAIN,
            ForbiddenBehavior.RESET_FILTERS,
        ],
        priority=1,
        tags=["partial", "budget", "context_preservation"],
    ),
    
    ChatFlowTestCase(
        test_id="partial_002",
        description="Test bedroom count only - should preserve location and type",
        category=TestCategory.PARTIAL_ANSWER,
        conversation=[
            ConversationTurn(
                message="Houses in Brampton under 800k",
                expected_intent=ExpectedIntent.PROPERTY_SEARCH,
            ),
            ConversationTurn(
                message="3 bedrooms",
                expected_intent=ExpectedIntent.PROPERTY_REFINEMENT,
                expected_entities={"bedrooms": 3},
            ),
        ],
        expected_state_after_each_turn=[
            ExpectedStateAfterTurn(
                turn_number=0,
                location="Brampton",
                property_type="house",
                max_price=800000,
            ),
            ExpectedStateAfterTurn(
                turn_number=1,
                bedrooms=3,
                should_preserve_previous=["location", "property_type", "max_price"],
            ),
        ],
        forbidden_behaviors=[
            ForbiddenBehavior.ASK_LOCATION_AGAIN,
            ForbiddenBehavior.ASK_BUDGET_AGAIN,
        ],
        priority=1,
        tags=["partial", "bedrooms", "context_preservation"],
    ),
    
    ChatFlowTestCase(
        test_id="partial_003",
        description="Test property type change only",
        category=TestCategory.PARTIAL_ANSWER,
        conversation=[
            ConversationTurn(
                message="2 bed condos in Markham under 700k",
                expected_intent=ExpectedIntent.PROPERTY_SEARCH,
            ),
            ConversationTurn(
                message="actually townhouses",
                expected_intent=ExpectedIntent.PROPERTY_REFINEMENT,
                expected_entities={"property_type": "townhouse"},
            ),
        ],
        expected_state_after_each_turn=[
            ExpectedStateAfterTurn(
                turn_number=0,
                location="Markham",
                property_type="condo",
                bedrooms=2,
                max_price=700000,
            ),
            ExpectedStateAfterTurn(
                turn_number=1,
                property_type="townhouse",
                should_preserve_previous=["location", "bedrooms", "max_price"],
            ),
        ],
        forbidden_behaviors=[
            ForbiddenBehavior.ASK_LOCATION_AGAIN,
            ForbiddenBehavior.ASK_BEDROOMS_AGAIN,
            ForbiddenBehavior.ASK_BUDGET_AGAIN,
        ],
        priority=1,
        tags=["partial", "property_type", "context_preservation"],
    ),
]


# =============================================================================
# LOCATION SWITCH TESTS
# =============================================================================
# Tests for handling location changes mid-conversation

LOCATION_SWITCH_TESTS: List[ChatFlowTestCase] = [
    ChatFlowTestCase(
        test_id="location_001",
        description="Test 'What about Mississauga?' - should switch location",
        category=TestCategory.LOCATION_SWITCH,
        conversation=[
            ConversationTurn(
                message="Show me 2 bedroom condos in Toronto",
                expected_intent=ExpectedIntent.PROPERTY_SEARCH,
            ),
            ConversationTurn(
                message="What about Mississauga?",
                expected_intent=ExpectedIntent.PROPERTY_SEARCH,
                expected_entities={"location": "Mississauga"},
            ),
        ],
        expected_state_after_each_turn=[
            ExpectedStateAfterTurn(
                turn_number=0,
                location="Toronto",
                bedrooms=2,
                property_type="condo",
            ),
            ExpectedStateAfterTurn(
                turn_number=1,
                location="Mississauga",
                bedrooms=2,
                property_type="condo",
                should_preserve_previous=["bedrooms", "property_type"],
                should_change=["location"],
            ),
        ],
        forbidden_behaviors=[
            ForbiddenBehavior.ASK_BEDROOMS_AGAIN,
            ForbiddenBehavior.ASK_PROPERTY_TYPE_AGAIN,
        ],
        priority=1,
        tags=["location_switch", "context_mutation", "critical"],
    ),
    
    ChatFlowTestCase(
        test_id="location_002",
        description="Test explicit location change with 'instead'",
        category=TestCategory.LOCATION_SWITCH,
        conversation=[
            ConversationTurn(
                message="Condos in Vancouver under 800k",
                expected_intent=ExpectedIntent.PROPERTY_SEARCH,
            ),
            ConversationTurn(
                message="How about Toronto instead?",
                expected_intent=ExpectedIntent.PROPERTY_SEARCH,
                expected_entities={"location": "Toronto"},
            ),
        ],
        expected_state_after_each_turn=[
            ExpectedStateAfterTurn(
                turn_number=0,
                location="Vancouver",
                property_type="condo",
                max_price=800000,
            ),
            ExpectedStateAfterTurn(
                turn_number=1,
                location="Toronto",
                property_type="condo",
                max_price=800000,
                should_preserve_previous=["property_type", "max_price"],
            ),
        ],
        forbidden_behaviors=[
            ForbiddenBehavior.ASK_BUDGET_AGAIN,
            ForbiddenBehavior.ASK_PROPERTY_TYPE_AGAIN,
        ],
        priority=1,
        tags=["location_switch", "context_mutation"],
    ),
    
    ChatFlowTestCase(
        test_id="location_003",
        description="Test multiple location changes",
        category=TestCategory.LOCATION_SWITCH,
        conversation=[
            ConversationTurn(
                message="3 bed houses in Toronto",
                expected_intent=ExpectedIntent.PROPERTY_SEARCH,
            ),
            ConversationTurn(
                message="What about Brampton?",
                expected_intent=ExpectedIntent.PROPERTY_SEARCH,
            ),
            ConversationTurn(
                message="And Mississauga?",
                expected_intent=ExpectedIntent.PROPERTY_SEARCH,
            ),
        ],
        expected_state_after_each_turn=[
            ExpectedStateAfterTurn(
                turn_number=0,
                location="Toronto",
                bedrooms=3,
                property_type="house",
            ),
            ExpectedStateAfterTurn(
                turn_number=1,
                location="Brampton",
                bedrooms=3,
                property_type="house",
            ),
            ExpectedStateAfterTurn(
                turn_number=2,
                location="Mississauga",
                bedrooms=3,
                property_type="house",
            ),
        ],
        forbidden_behaviors=[
            ForbiddenBehavior.ASK_BEDROOMS_AGAIN,
            ForbiddenBehavior.ASK_PROPERTY_TYPE_AGAIN,
        ],
        priority=2,
        tags=["location_switch", "multi_turn"],
    ),
]


# =============================================================================
# INTERRUPTION TESTS
# =============================================================================
# Tests for handling interruptions in the flow

INTERRUPTION_TESTS: List[ChatFlowTestCase] = [
    ChatFlowTestCase(
        test_id="interrupt_001",
        description="Test interruption with new search while previous is processing",
        category=TestCategory.INTERRUPTION,
        conversation=[
            ConversationTurn(
                message="Show me condos in Toronto",
                expected_intent=ExpectedIntent.PROPERTY_SEARCH,
            ),
            ConversationTurn(
                message="Actually, forget that. I want houses in Vancouver",
                expected_intent=ExpectedIntent.PROPERTY_SEARCH,
                expected_entities={
                    "location": "Vancouver",
                    "property_type": "house",
                },
            ),
        ],
        forbidden_behaviors=[
            ForbiddenBehavior.IGNORE_CONTEXT,
        ],
        priority=2,
        tags=["interruption", "context_reset"],
    ),
    
    ChatFlowTestCase(
        test_id="interrupt_002",
        description="Test 'start over' interruption",
        category=TestCategory.INTERRUPTION,
        conversation=[
            ConversationTurn(
                message="2 bed condos in Markham under 600k",
                expected_intent=ExpectedIntent.PROPERTY_SEARCH,
            ),
            ConversationTurn(
                message="start over",
                expected_intent=ExpectedIntent.RESET,
                response_should_contain=["cleared", "fresh", "help", "looking for"],
            ),
        ],
        expected_intent=ExpectedIntent.RESET,
        priority=2,
        tags=["interruption", "reset"],
    ),
    
    ChatFlowTestCase(
        test_id="interrupt_003",
        description="Test mid-conversation topic change",
        category=TestCategory.INTERRUPTION,
        conversation=[
            ConversationTurn(
                message="Show me houses in Ottawa",
                expected_intent=ExpectedIntent.PROPERTY_SEARCH,
            ),
            ConversationTurn(
                message="Wait, I need rentals not houses for sale",
                expected_intent=ExpectedIntent.PROPERTY_REFINEMENT,
                expected_entities={"listing_type": "rent"},
            ),
        ],
        expected_state_after_each_turn=[
            ExpectedStateAfterTurn(
                turn_number=0,
                location="Ottawa",
                property_type="house",
            ),
            ExpectedStateAfterTurn(
                turn_number=1,
                location="Ottawa",
                listing_type="rent",
                should_preserve_previous=["location"],
            ),
        ],
        priority=2,
        tags=["interruption", "listing_type_change"],
    ),
]


# =============================================================================
# MULTI-INTENT TESTS
# =============================================================================
# Tests for messages that contain multiple intents

MULTI_INTENT_TESTS: List[ChatFlowTestCase] = [
    ChatFlowTestCase(
        test_id="multi_001",
        description="Test combined location + budget + bedrooms in one message",
        category=TestCategory.MULTI_INTENT,
        conversation=[
            ConversationTurn(
                message="Show me 3 bedroom condos in Toronto under 700k",
                expected_intent=ExpectedIntent.PROPERTY_SEARCH,
                expected_entities={
                    "location": "Toronto",
                    "bedrooms": 3,
                    "property_type": "condo",
                    "max_price": 700000,
                },
                should_have_properties=True,
            ),
        ],
        priority=1,
        tags=["multi_intent", "comprehensive_search"],
    ),
    
    ChatFlowTestCase(
        test_id="multi_002",
        description="Test location comparison request",
        category=TestCategory.MULTI_INTENT,
        conversation=[
            ConversationTurn(
                message="Compare condos in Toronto vs Mississauga under 600k",
                expected_intent=ExpectedIntent.PROPERTY_SEARCH,
                response_should_contain=["Toronto", "Mississauga"],
            ),
        ],
        priority=2,
        tags=["multi_intent", "comparison"],
    ),
    
    ChatFlowTestCase(
        test_id="multi_003",
        description="Test refinement with multiple new criteria",
        category=TestCategory.MULTI_INTENT,
        conversation=[
            ConversationTurn(
                message="Properties in Toronto",
                expected_intent=ExpectedIntent.PROPERTY_SEARCH,
            ),
            ConversationTurn(
                message="I want 2 beds, under 500k, and it must be a condo",
                expected_intent=ExpectedIntent.PROPERTY_REFINEMENT,
                expected_entities={
                    "bedrooms": 2,
                    "max_price": 500000,
                    "property_type": "condo",
                },
            ),
        ],
        expected_state_after_each_turn=[
            ExpectedStateAfterTurn(
                turn_number=0,
                location="Toronto",
            ),
            ExpectedStateAfterTurn(
                turn_number=1,
                location="Toronto",
                bedrooms=2,
                max_price=500000,
                property_type="condo",
                should_preserve_previous=["location"],
            ),
        ],
        priority=1,
        tags=["multi_intent", "refinement"],
    ),
]


# =============================================================================
# OFF-TOPIC / NON-PROPERTY TESTS
# =============================================================================
# Tests for handling questions unrelated to real estate

OFF_TOPIC_TESTS: List[ChatFlowTestCase] = [
    ChatFlowTestCase(
        test_id="offtopic_001",
        description="Test weather question - should redirect gracefully",
        category=TestCategory.OFF_TOPIC,
        conversation=[
            ConversationTurn(
                message="What's the weather like today?",
                expected_intent=ExpectedIntent.OFF_TOPIC,
                response_should_contain=["properties", "real estate", "help"],
                response_should_not_contain=["sunny", "rain", "temperature", "degrees"],
                should_have_properties=False,
            ),
        ],
        expected_intent=ExpectedIntent.OFF_TOPIC,
        is_non_property_test=True,
        should_not_trigger_search=True,
        expected_response_type="redirect_to_property",
        forbidden_behaviors=[
            ForbiddenBehavior.TRIGGER_MLS_SEARCH,
            ForbiddenBehavior.PROVIDE_PROPERTY_DATA,
        ],
        ux_assertions=UXAssertion(
            must_be_polite=True,
            must_have_next_action=True,
        ),
        priority=1,
        tags=["off_topic", "weather", "graceful_redirect", "critical"],
    ),
    
    ChatFlowTestCase(
        test_id="offtopic_002",
        description="Test food/recipe question - should not trigger search",
        category=TestCategory.OFF_TOPIC,
        conversation=[
            ConversationTurn(
                message="How do I make paneer butter masala?",
                expected_intent=ExpectedIntent.OFF_TOPIC,
                response_should_contain=["property", "real estate", "help"],
                response_should_not_contain=["recipe", "ingredients", "cook", "paneer"],
                should_have_properties=False,
            ),
        ],
        expected_intent=ExpectedIntent.OFF_TOPIC,
        is_non_property_test=True,
        should_not_trigger_search=True,
        expected_response_type="redirect_to_property",
        forbidden_behaviors=[
            ForbiddenBehavior.TRIGGER_MLS_SEARCH,
            ForbiddenBehavior.PROVIDE_PROPERTY_DATA,
        ],
        priority=1,
        tags=["off_topic", "food", "graceful_redirect"],
    ),
    
    ChatFlowTestCase(
        test_id="offtopic_003",
        description="Test sports question - should redirect to property help",
        category=TestCategory.OFF_TOPIC,
        conversation=[
            ConversationTurn(
                message="Who won the hockey game last night?",
                expected_intent=ExpectedIntent.OFF_TOPIC,
                response_should_contain=["property", "real estate", "help"],
                response_should_not_contain=["score", "won", "hockey", "game"],
                should_have_properties=False,
            ),
        ],
        expected_intent=ExpectedIntent.OFF_TOPIC,
        is_non_property_test=True,
        should_not_trigger_search=True,
        forbidden_behaviors=[
            ForbiddenBehavior.TRIGGER_MLS_SEARCH,
        ],
        priority=1,
        tags=["off_topic", "sports", "graceful_redirect"],
    ),
    
    ChatFlowTestCase(
        test_id="offtopic_004",
        description="Test movie question - should not provide movie info",
        category=TestCategory.OFF_TOPIC,
        conversation=[
            ConversationTurn(
                message="What are the best movies of 2024?",
                expected_intent=ExpectedIntent.OFF_TOPIC,
                response_should_contain=["property", "real estate", "help"],
                response_should_not_contain=["movie", "film", "actor", "director"],
                should_have_properties=False,
            ),
        ],
        expected_intent=ExpectedIntent.OFF_TOPIC,
        is_non_property_test=True,
        should_not_trigger_search=True,
        forbidden_behaviors=[
            ForbiddenBehavior.TRIGGER_MLS_SEARCH,
        ],
        priority=1,
        tags=["off_topic", "movies", "graceful_redirect"],
    ),
    
    ChatFlowTestCase(
        test_id="offtopic_005",
        description="Test political question - should redirect gracefully",
        category=TestCategory.OFF_TOPIC,
        conversation=[
            ConversationTurn(
                message="What do you think about the election?",
                expected_intent=ExpectedIntent.OFF_TOPIC,
                response_should_contain=["property", "real estate", "help"],
                response_should_not_contain=["vote", "election", "political", "party"],
                should_have_properties=False,
            ),
        ],
        expected_intent=ExpectedIntent.OFF_TOPIC,
        is_non_property_test=True,
        should_not_trigger_search=True,
        forbidden_behaviors=[
            ForbiddenBehavior.TRIGGER_MLS_SEARCH,
        ],
        priority=1,
        tags=["off_topic", "politics", "graceful_redirect"],
    ),
    
    ChatFlowTestCase(
        test_id="offtopic_006",
        description="Test travel question - should redirect to property",
        category=TestCategory.OFF_TOPIC,
        conversation=[
            ConversationTurn(
                message="What are the best vacation spots in Europe?",
                expected_intent=ExpectedIntent.OFF_TOPIC,
                response_should_contain=["property", "real estate", "help"],
                response_should_not_contain=["vacation", "travel", "Europe", "tourist"],
                should_have_properties=False,
            ),
        ],
        expected_intent=ExpectedIntent.OFF_TOPIC,
        is_non_property_test=True,
        should_not_trigger_search=True,
        forbidden_behaviors=[
            ForbiddenBehavior.TRIGGER_MLS_SEARCH,
        ],
        priority=2,
        tags=["off_topic", "travel", "graceful_redirect"],
    ),
    
    ChatFlowTestCase(
        test_id="offtopic_007",
        description="Test music question - currently handled as general question (not redirected)",
        category=TestCategory.OFF_TOPIC,
        conversation=[
            ConversationTurn(
                message="What's the best song by Taylor Swift?",
                expected_intent=ExpectedIntent.GENERAL_QUESTION,  # Server classifies this as general_question, not off_topic
                # Note: Server currently answers this instead of redirecting
                should_have_properties=False,
            ),
        ],
        expected_intent=ExpectedIntent.GENERAL_QUESTION,
        is_non_property_test=True,
        should_not_trigger_search=True,
        forbidden_behaviors=[
            ForbiddenBehavior.TRIGGER_MLS_SEARCH,
        ],
        priority=2,
        tags=["off_topic", "music", "general_question"],
    ),
    
    ChatFlowTestCase(
        test_id="offtopic_008",
        description="Test gaming question - should redirect to property",
        category=TestCategory.OFF_TOPIC,
        conversation=[
            ConversationTurn(
                message="What's the best strategy in Fortnite?",
                expected_intent=ExpectedIntent.OFF_TOPIC,
                response_should_contain=["property", "real estate", "help"],
                should_have_properties=False,
            ),
        ],
        expected_intent=ExpectedIntent.OFF_TOPIC,
        is_non_property_test=True,
        should_not_trigger_search=True,
        forbidden_behaviors=[
            ForbiddenBehavior.TRIGGER_MLS_SEARCH,
        ],
        priority=2,
        tags=["off_topic", "gaming", "graceful_redirect"],
    ),
    
    ChatFlowTestCase(
        test_id="offtopic_009",
        description="Test off-topic after property search - should handle gracefully",
        category=TestCategory.OFF_TOPIC,
        conversation=[
            ConversationTurn(
                message="Show me condos in Toronto",
                expected_intent=ExpectedIntent.PROPERTY_SEARCH,
                should_have_properties=True,
            ),
            ConversationTurn(
                message="What is the best pizza restaurant around here?",
                expected_intent=ExpectedIntent.OFF_TOPIC,
                response_should_contain=["property", "real estate", "help"],
                should_have_properties=False,
            ),
        ],
        forbidden_behaviors=[
            ForbiddenBehavior.RESET_FILTERS,
        ],
        priority=1,
        tags=["off_topic", "mid_conversation", "context_preservation"],
    ),
    
    ChatFlowTestCase(
        test_id="offtopic_010",
        description="Test random greeting followed by joke request - server handles gracefully",
        category=TestCategory.OFF_TOPIC,
        conversation=[
            ConversationTurn(
                message="Hello!",
                expected_intent=ExpectedIntent.GENERAL_CHAT,
            ),
            ConversationTurn(
                message="Tell me a joke",
                expected_intent=ExpectedIntent.GENERAL_QUESTION,  # Server classifies as general_question
                # Note: Server currently tells jokes instead of redirecting
                should_have_properties=False,
            ),
        ],
        is_non_property_test=True,
        should_not_trigger_search=True,
        forbidden_behaviors=[
            ForbiddenBehavior.TRIGGER_MLS_SEARCH,
        ],
        priority=2,
        tags=["off_topic", "joke", "general_question"],
    ),
]


# =============================================================================
# GENERAL QUESTION TESTS
# =============================================================================
# Tests for general real estate related questions

GENERAL_QUESTION_TESTS: List[ChatFlowTestCase] = [
    ChatFlowTestCase(
        test_id="general_001",
        description="Test general market question - should provide info without search",
        category=TestCategory.GENERAL_QUESTION,
        conversation=[
            ConversationTurn(
                message="Is Toronto a good place to invest in real estate?",
                expected_intent=ExpectedIntent.GENERAL_QUESTION,
                response_should_contain=["Toronto", "market", "invest"],
            ),
        ],
        expected_intent=ExpectedIntent.GENERAL_QUESTION,
        priority=2,
        tags=["general", "market_info"],
    ),
    
    ChatFlowTestCase(
        test_id="general_002",
        description="Test mortgage question - should provide helpful info",
        category=TestCategory.GENERAL_QUESTION,
        conversation=[
            ConversationTurn(
                message="How does a mortgage work in Canada?",
                expected_intent=ExpectedIntent.GENERAL_QUESTION,
                response_should_contain=["mortgage", "Canada"],
            ),
        ],
        expected_intent=ExpectedIntent.GENERAL_QUESTION,
        priority=2,
        tags=["general", "mortgage"],
    ),
    
    ChatFlowTestCase(
        test_id="general_003",
        description="Test first-time buyer question",
        category=TestCategory.GENERAL_QUESTION,
        conversation=[
            ConversationTurn(
                message="What should first-time buyers know?",
                expected_intent=ExpectedIntent.GENERAL_QUESTION,
                response_should_contain=["first", "buy"],
            ),
        ],
        expected_intent=ExpectedIntent.GENERAL_QUESTION,
        priority=2,
        tags=["general", "first_time_buyer"],
    ),
]


# =============================================================================
# EDGE CASE TESTS
# =============================================================================
# Tests for edge cases and unusual inputs

EDGE_CASE_TESTS: List[ChatFlowTestCase] = [
    ChatFlowTestCase(
        test_id="edge_001",
        description="Test minimal input handling - should get helpful response",
        category=TestCategory.EDGE_CASE,
        conversation=[
            ConversationTurn(
                message="hi",  # Minimal valid input
                response_should_not_contain=["error", "exception", "undefined"],
            ),
        ],
        ux_assertions=UXAssertion(
            must_be_polite=True,
        ),
        priority=1,
        tags=["edge_case", "minimal_input"],
    ),
    
    ChatFlowTestCase(
        test_id="edge_002",
        description="Test very long message handling",
        category=TestCategory.EDGE_CASE,
        conversation=[
            ConversationTurn(
                message="I'm looking for a property " + "with many features " * 50 + "in Toronto",
                response_should_not_contain=["error", "exception"],
            ),
        ],
        priority=2,
        tags=["edge_case", "long_input"],
    ),
    
    ChatFlowTestCase(
        test_id="edge_003",
        description="Test special characters handling",
        category=TestCategory.EDGE_CASE,
        conversation=[
            ConversationTurn(
                message="Condos in Toronto @ $500k!!! #bestdeals",
                expected_intent=ExpectedIntent.PROPERTY_SEARCH,
            ),
        ],
        priority=2,
        tags=["edge_case", "special_chars"],
    ),
    
    ChatFlowTestCase(
        test_id="edge_004",
        description="Test typo handling",
        category=TestCategory.EDGE_CASE,
        conversation=[
            ConversationTurn(
                message="condos in tornto undr 500k",
                expected_intent=ExpectedIntent.PROPERTY_SEARCH,
                expected_entities={"location": "Toronto"},
            ),
        ],
        priority=2,
        tags=["edge_case", "typo"],
    ),
    
    ChatFlowTestCase(
        test_id="edge_005",
        description="Test mixed language input",
        category=TestCategory.EDGE_CASE,
        conversation=[
            ConversationTurn(
                message="Je cherche condos in Toronto",
                expected_intent=ExpectedIntent.PROPERTY_SEARCH,
            ),
        ],
        priority=3,
        tags=["edge_case", "mixed_language"],
    ),
]


# =============================================================================
# UX QUALITY TESTS
# =============================================================================
# Tests specifically for UX quality validation

UX_QUALITY_TESTS: List[ChatFlowTestCase] = [
    ChatFlowTestCase(
        test_id="ux_001",
        description="Test response should not be robotic",
        category=TestCategory.UX_QUALITY,
        conversation=[
            ConversationTurn(
                message="Hello, I'm looking for a condo",
                response_should_not_contain=[
                    "I am an AI",
                    "As an AI",
                    "Error:",
                    "undefined",
                ],
            ),
        ],
        ux_assertions=UXAssertion(
            must_be_natural=True,
            must_be_polite=True,
        ),
        priority=1,
        tags=["ux", "natural_language"],
    ),
    
    ChatFlowTestCase(
        test_id="ux_002",
        description="Test no duplicate questions asked",
        category=TestCategory.UX_QUALITY,
        conversation=[
            ConversationTurn(
                message="Show me condos in Toronto under 500k",
                expected_intent=ExpectedIntent.PROPERTY_SEARCH,
            ),
            ConversationTurn(
                message="What about those with 2 bedrooms?",
                expected_intent=ExpectedIntent.PROPERTY_REFINEMENT,
                response_should_not_contain=["what's your budget", "which location"],
            ),
        ],
        forbidden_behaviors=[
            ForbiddenBehavior.DUPLICATE_QUESTION,
            ForbiddenBehavior.ASK_BUDGET_AGAIN,
            ForbiddenBehavior.ASK_LOCATION_AGAIN,
        ],
        ux_assertions=UXAssertion(
            no_duplicate_clarification=True,
            no_redundant_questions=True,
        ),
        priority=1,
        tags=["ux", "no_redundancy"],
    ),
    
    ChatFlowTestCase(
        test_id="ux_003",
        description="Test response provides clear next action",
        category=TestCategory.UX_QUALITY,
        conversation=[
            ConversationTurn(
                message="Show me condos in Toronto",
                expected_intent=ExpectedIntent.PROPERTY_SEARCH,
                response_should_contain=["would you like", "how about", "?"],
            ),
        ],
        ux_assertions=UXAssertion(
            must_have_next_action=True,
        ),
        priority=2,
        tags=["ux", "next_action"],
    ),
]


# =============================================================================
# FOLLOW-UP HANDLING TESTS - 50 Real-Life Scenarios
# =============================================================================
# Critical tests for filter/budget/location persistence after user responses.
# These tests verify that filters are KEPT or REMOVED correctly based on UX expectations.
# Focus areas:
# 1. Price/budget filters should persist unless user explicitly changes
# 2. Location should persist unless user explicitly mentions a new location
# 3. Property type should persist during refinements
# 4. Bedrooms/bathrooms should persist during refinements

FOLLOW_UP_HANDLING_TESTS: List[ChatFlowTestCase] = [
    # ==========================================================================
    # PRICE/BUDGET PERSISTENCE TESTS (1-15)
    # ==========================================================================
    
    ChatFlowTestCase(
        test_id="followup_001",
        description="Budget persists after bedroom refinement",
        category=TestCategory.YES_NO_FOLLOWUP,
        conversation=[
            ConversationTurn(
                message="Show me condos in Toronto under 500k",
                expected_intent=ExpectedIntent.PROPERTY_SEARCH,
            ),
            ConversationTurn(
                message="Make it 2 bedrooms",
                expected_intent=ExpectedIntent.PROPERTY_REFINEMENT,
            ),
        ],
        expected_state_after_each_turn=[
            ExpectedStateAfterTurn(
                turn_number=0,
                location="Toronto",
                max_price=500000,
                property_type="condo",
            ),
            ExpectedStateAfterTurn(
                turn_number=1,
                location="Toronto",
                max_price=500000,  # Should persist
                property_type="condo",  # Should persist
                bedrooms=2,
                should_preserve_previous=["max_price", "location", "property_type"],
            ),
        ],
        forbidden_behaviors=[
            ForbiddenBehavior.RESET_FILTERS,
            ForbiddenBehavior.ASK_BUDGET_AGAIN,
        ],
        priority=1,
        tags=["filter_persistence", "price", "critical"],
    ),
    
    ChatFlowTestCase(
        test_id="followup_002",
        description="Budget persists after property type change",
        category=TestCategory.YES_NO_FOLLOWUP,
        conversation=[
            ConversationTurn(
                message="Houses in Mississauga under 800k",
                expected_intent=ExpectedIntent.PROPERTY_SEARCH,
            ),
            ConversationTurn(
                message="Actually show me townhouses instead",
                expected_intent=ExpectedIntent.PROPERTY_REFINEMENT,
            ),
        ],
        expected_state_after_each_turn=[
            ExpectedStateAfterTurn(
                turn_number=0,
                location="Mississauga",
                max_price=800000,
                property_type="house",
            ),
            ExpectedStateAfterTurn(
                turn_number=1,
                location="Mississauga",
                max_price=800000,  # Should persist
                property_type="townhouse",  # Changed
                should_preserve_previous=["max_price", "location"],
            ),
        ],
        forbidden_behaviors=[
            ForbiddenBehavior.RESET_FILTERS,
        ],
        priority=1,
        tags=["filter_persistence", "price", "property_type"],
    ),
    
    ChatFlowTestCase(
        test_id="followup_003",
        description="Budget persists after adding bathroom filter",
        category=TestCategory.YES_NO_FOLLOWUP,
        conversation=[
            ConversationTurn(
                message="3 bed homes in Ottawa under 600k",
                expected_intent=ExpectedIntent.PROPERTY_SEARCH,
            ),
            ConversationTurn(
                message="With at least 2 bathrooms",
                expected_intent=ExpectedIntent.PROPERTY_REFINEMENT,
            ),
        ],
        expected_state_after_each_turn=[
            ExpectedStateAfterTurn(
                turn_number=0,
                location="Ottawa",
                max_price=600000,
                bedrooms=3,
            ),
            ExpectedStateAfterTurn(
                turn_number=1,
                location="Ottawa",
                max_price=600000,  # Should persist
                bedrooms=3,  # Should persist
                bathrooms=2,
                should_preserve_previous=["max_price", "location", "bedrooms"],
            ),
        ],
        priority=1,
        tags=["filter_persistence", "price", "bathrooms"],
    ),
    
    ChatFlowTestCase(
        test_id="followup_004",
        description="Budget updates when user explicitly changes it",
        category=TestCategory.YES_NO_FOLLOWUP,
        conversation=[
            ConversationTurn(
                message="Condos in Toronto under 500k",
                expected_intent=ExpectedIntent.PROPERTY_SEARCH,
            ),
            ConversationTurn(
                message="Actually I can go up to 700k",
                expected_intent=ExpectedIntent.PROPERTY_REFINEMENT,
            ),
        ],
        expected_state_after_each_turn=[
            ExpectedStateAfterTurn(
                turn_number=0,
                location="Toronto",
                max_price=500000,
            ),
            ExpectedStateAfterTurn(
                turn_number=1,
                location="Toronto",  # Should persist
                max_price=700000,  # Should update
                should_preserve_previous=["location"],
            ),
        ],
        priority=1,
        tags=["filter_persistence", "price_change", "explicit"],
    ),
    
    ChatFlowTestCase(
        test_id="followup_005",
        description="Budget range persists with 'show me more'",
        category=TestCategory.YES_NO_FOLLOWUP,
        conversation=[
            ConversationTurn(
                message="Properties between 400k and 600k in Vancouver",
                expected_intent=ExpectedIntent.PROPERTY_SEARCH,
            ),
            ConversationTurn(
                message="Show me more options",
                expected_intent=ExpectedIntent.GENERAL_CHAT,
            ),
        ],
        expected_state_after_each_turn=[
            ExpectedStateAfterTurn(
                turn_number=0,
                location="Vancouver",
                min_price=400000,
                max_price=600000,
            ),
            ExpectedStateAfterTurn(
                turn_number=1,
                location="Vancouver",
                min_price=400000,  # Should persist
                max_price=600000,  # Should persist
                should_preserve_previous=["min_price", "max_price", "location"],
            ),
        ],
        priority=1,
        tags=["filter_persistence", "price_range", "pagination"],
    ),
    
    ChatFlowTestCase(
        test_id="followup_006",
        description="Budget persists after 'cheaper' request",
        category=TestCategory.YES_NO_FOLLOWUP,
        conversation=[
            ConversationTurn(
                message="Houses in Brampton under 900k",
                expected_intent=ExpectedIntent.PROPERTY_SEARCH,
            ),
            ConversationTurn(
                message="Show me something cheaper",
                expected_intent=ExpectedIntent.PROPERTY_REFINEMENT,
            ),
        ],
        expected_state_after_each_turn=[
            ExpectedStateAfterTurn(
                turn_number=0,
                location="Brampton",
                max_price=900000,
            ),
            ExpectedStateAfterTurn(
                turn_number=1,
                location="Brampton",  # Should persist
                should_preserve_previous=["location"],
            ),
        ],
        priority=1,
        tags=["filter_persistence", "price_relative", "cheaper"],
    ),
    
    ChatFlowTestCase(
        test_id="followup_007",
        description="Budget persists after asking for more bedrooms",
        category=TestCategory.YES_NO_FOLLOWUP,
        conversation=[
            ConversationTurn(
                message="2 bed condos under 550k in downtown Toronto",
                expected_intent=ExpectedIntent.PROPERTY_SEARCH,
            ),
            ConversationTurn(
                message="I need 3 bedrooms actually",
                expected_intent=ExpectedIntent.PROPERTY_REFINEMENT,
            ),
        ],
        expected_state_after_each_turn=[
            ExpectedStateAfterTurn(
                turn_number=0,
                location="Toronto",
                max_price=550000,
                bedrooms=2,
            ),
            ExpectedStateAfterTurn(
                turn_number=1,
                location="Toronto",
                max_price=550000,  # Should persist
                bedrooms=3,  # Updated
                should_preserve_previous=["max_price", "location"],
            ),
        ],
        priority=1,
        tags=["filter_persistence", "price", "bedrooms_change"],
    ),
    
    ChatFlowTestCase(
        test_id="followup_008",
        description="Budget persists when switching to rentals",
        category=TestCategory.YES_NO_FOLLOWUP,
        conversation=[
            ConversationTurn(
                message="Condos in Etobicoke under 500k",
                expected_intent=ExpectedIntent.PROPERTY_SEARCH,
            ),
            ConversationTurn(
                message="Actually show me rentals instead",
                expected_intent=ExpectedIntent.PROPERTY_REFINEMENT,
            ),
        ],
        expected_state_after_each_turn=[
            ExpectedStateAfterTurn(
                turn_number=0,
                location="Etobicoke",
                max_price=500000,
                listing_type="sale",
            ),
            ExpectedStateAfterTurn(
                turn_number=1,
                location="Etobicoke",  # Should persist
                listing_type="rent",  # Changed
                should_preserve_previous=["location"],
            ),
        ],
        priority=1,
        tags=["filter_persistence", "listing_type_change"],
    ),
    
    ChatFlowTestCase(
        test_id="followup_009",
        description="Budget persists after asking about specific amenity",
        category=TestCategory.YES_NO_FOLLOWUP,
        conversation=[
            ConversationTurn(
                message="Houses under 700k in Scarborough",
                expected_intent=ExpectedIntent.PROPERTY_SEARCH,
            ),
            ConversationTurn(
                message="Do any have a pool?",
                expected_intent=ExpectedIntent.GENERAL_QUESTION,
            ),
        ],
        expected_state_after_each_turn=[
            ExpectedStateAfterTurn(
                turn_number=0,
                location="Scarborough",
                max_price=700000,
            ),
            ExpectedStateAfterTurn(
                turn_number=1,
                location="Scarborough",
                max_price=700000,  # Should persist
                should_preserve_previous=["max_price", "location"],
            ),
        ],
        priority=2,
        tags=["filter_persistence", "amenity_question"],
    ),
    
    ChatFlowTestCase(
        test_id="followup_010",
        description="Budget persists after asking about neighborhood",
        category=TestCategory.YES_NO_FOLLOWUP,
        conversation=[
            ConversationTurn(
                message="Condos under 600k in North York",
                expected_intent=ExpectedIntent.PROPERTY_SEARCH,
            ),
            ConversationTurn(
                message="Is this a good area for families?",
                expected_intent=ExpectedIntent.GENERAL_QUESTION,
            ),
        ],
        expected_state_after_each_turn=[
            ExpectedStateAfterTurn(
                turn_number=0,
                location="North York",
                max_price=600000,
            ),
            ExpectedStateAfterTurn(
                turn_number=1,
                location="North York",
                max_price=600000,  # Should persist
                should_preserve_previous=["max_price", "location"],
            ),
        ],
        priority=2,
        tags=["filter_persistence", "neighborhood_question"],
    ),
    
    ChatFlowTestCase(
        test_id="followup_011",
        description="Min and max price both persist",
        category=TestCategory.YES_NO_FOLLOWUP,
        conversation=[
            ConversationTurn(
                message="Condos between 300k and 500k in Toronto",
                expected_intent=ExpectedIntent.PROPERTY_SEARCH,
            ),
            ConversationTurn(
                message="Only 2 bedrooms please",
                expected_intent=ExpectedIntent.PROPERTY_REFINEMENT,
            ),
        ],
        expected_state_after_each_turn=[
            ExpectedStateAfterTurn(
                turn_number=0,
                location="Toronto",
                min_price=300000,
                max_price=500000,
            ),
            ExpectedStateAfterTurn(
                turn_number=1,
                location="Toronto",
                min_price=300000,  # Should persist
                max_price=500000,  # Should persist
                bedrooms=2,
                should_preserve_previous=["min_price", "max_price", "location"],
            ),
        ],
        priority=1,
        tags=["filter_persistence", "price_range", "critical"],
    ),
    
    ChatFlowTestCase(
        test_id="followup_012",
        description="Budget cleared when starting completely new search in different city",
        category=TestCategory.YES_NO_FOLLOWUP,
        conversation=[
            ConversationTurn(
                message="Condos under 500k in Toronto",
                expected_intent=ExpectedIntent.PROPERTY_SEARCH,
            ),
            ConversationTurn(
                message="Show me houses in Calgary",
                expected_intent=ExpectedIntent.PROPERTY_SEARCH,
            ),
        ],
        expected_state_after_each_turn=[
            ExpectedStateAfterTurn(
                turn_number=0,
                location="Toronto",
                max_price=500000,
            ),
            ExpectedStateAfterTurn(
                turn_number=1,
                location="Calgary",  # New location
                # Price should NOT persist for different city search
            ),
        ],
        priority=1,
        tags=["filter_clear", "new_city", "fresh_search"],
    ),
    
    ChatFlowTestCase(
        test_id="followup_013",
        description="Budget persists when refining within same neighborhood",
        category=TestCategory.YES_NO_FOLLOWUP,
        conversation=[
            ConversationTurn(
                message="Properties under 400k in Liberty Village",
                expected_intent=ExpectedIntent.PROPERTY_SEARCH,
            ),
            ConversationTurn(
                message="Only show condos",
                expected_intent=ExpectedIntent.PROPERTY_REFINEMENT,
            ),
        ],
        expected_state_after_each_turn=[
            ExpectedStateAfterTurn(
                turn_number=0,
                location="Liberty Village",
                max_price=400000,
            ),
            ExpectedStateAfterTurn(
                turn_number=1,
                location="Liberty Village",
                max_price=400000,  # Should persist
                property_type="condo",
                should_preserve_previous=["max_price", "location"],
            ),
        ],
        priority=1,
        tags=["filter_persistence", "neighborhood", "price"],
    ),
    
    ChatFlowTestCase(
        test_id="followup_014",
        description="Budget persists after 'any parking?' question",
        category=TestCategory.YES_NO_FOLLOWUP,
        conversation=[
            ConversationTurn(
                message="2 bed condos under 550k near subway",
                expected_intent=ExpectedIntent.PROPERTY_SEARCH,
            ),
            ConversationTurn(
                message="Do they come with parking?",
                expected_intent=ExpectedIntent.GENERAL_QUESTION,
            ),
        ],
        expected_state_after_each_turn=[
            ExpectedStateAfterTurn(
                turn_number=0,
                max_price=550000,
                bedrooms=2,
            ),
            ExpectedStateAfterTurn(
                turn_number=1,
                max_price=550000,  # Should persist
                bedrooms=2,  # Should persist
                should_preserve_previous=["max_price", "bedrooms"],
            ),
        ],
        priority=2,
        tags=["filter_persistence", "amenity_question"],
    ),
    
    ChatFlowTestCase(
        test_id="followup_015",
        description="Budget persists through multi-turn refinement",
        category=TestCategory.YES_NO_FOLLOWUP,
        conversation=[
            ConversationTurn(
                message="Condos in Toronto under 600k",
                expected_intent=ExpectedIntent.PROPERTY_SEARCH,
            ),
            ConversationTurn(
                message="2 bedrooms",
                expected_intent=ExpectedIntent.PROPERTY_REFINEMENT,
            ),
            ConversationTurn(
                message="Near a subway station",
                expected_intent=ExpectedIntent.PROPERTY_REFINEMENT,
            ),
        ],
        expected_state_after_each_turn=[
            ExpectedStateAfterTurn(
                turn_number=0,
                location="Toronto",
                max_price=600000,
            ),
            ExpectedStateAfterTurn(
                turn_number=1,
                location="Toronto",
                max_price=600000,  # Should persist
                bedrooms=2,
                should_preserve_previous=["max_price", "location"],
            ),
            ExpectedStateAfterTurn(
                turn_number=2,
                location="Toronto",
                max_price=600000,  # Should persist
                bedrooms=2,  # Should persist
                should_preserve_previous=["max_price", "location", "bedrooms"],
            ),
        ],
        priority=1,
        tags=["filter_persistence", "multi_turn", "critical"],
    ),
    
    # ==========================================================================
    # LOCATION PERSISTENCE TESTS (16-30)
    # ==========================================================================
    
    ChatFlowTestCase(
        test_id="followup_016",
        description="Location persists after adding bedroom filter",
        category=TestCategory.YES_NO_FOLLOWUP,
        conversation=[
            ConversationTurn(
                message="Show me properties in Mississauga",
                expected_intent=ExpectedIntent.PROPERTY_SEARCH,
            ),
            ConversationTurn(
                message="3 bedrooms please",
                expected_intent=ExpectedIntent.PROPERTY_REFINEMENT,
            ),
        ],
        expected_state_after_each_turn=[
            ExpectedStateAfterTurn(
                turn_number=0,
                location="Mississauga",
            ),
            ExpectedStateAfterTurn(
                turn_number=1,
                location="Mississauga",  # Should persist
                bedrooms=3,
                should_preserve_previous=["location"],
            ),
        ],
        forbidden_behaviors=[
            ForbiddenBehavior.ASK_LOCATION_AGAIN,
        ],
        priority=1,
        tags=["filter_persistence", "location", "critical"],
    ),
    
    ChatFlowTestCase(
        test_id="followup_017",
        description="Location persists after adding price filter",
        category=TestCategory.YES_NO_FOLLOWUP,
        conversation=[
            ConversationTurn(
                message="Condos in downtown Toronto",
                expected_intent=ExpectedIntent.PROPERTY_SEARCH,
            ),
            ConversationTurn(
                message="Under 700k",
                expected_intent=ExpectedIntent.PROPERTY_REFINEMENT,
            ),
        ],
        expected_state_after_each_turn=[
            ExpectedStateAfterTurn(
                turn_number=0,
                location="Toronto",
            ),
            ExpectedStateAfterTurn(
                turn_number=1,
                location="Toronto",  # Should persist
                max_price=700000,
                should_preserve_previous=["location"],
            ),
        ],
        forbidden_behaviors=[
            ForbiddenBehavior.ASK_LOCATION_AGAIN,
        ],
        priority=1,
        tags=["filter_persistence", "location", "price"],
    ),
    
    ChatFlowTestCase(
        test_id="followup_018",
        description="Location explicitly changed when user mentions new city",
        category=TestCategory.YES_NO_FOLLOWUP,
        conversation=[
            ConversationTurn(
                message="Condos in Toronto under 500k",
                expected_intent=ExpectedIntent.PROPERTY_SEARCH,
            ),
            ConversationTurn(
                message="What about in Ottawa?",
                expected_intent=ExpectedIntent.PROPERTY_SEARCH,
            ),
        ],
        expected_state_after_each_turn=[
            ExpectedStateAfterTurn(
                turn_number=0,
                location="Toronto",
                max_price=500000,
            ),
            ExpectedStateAfterTurn(
                turn_number=1,
                location="Ottawa",  # Changed
            ),
        ],
        priority=1,
        tags=["filter_persistence", "location_change", "explicit"],
    ),
    
    ChatFlowTestCase(
        test_id="followup_019",
        description="Location persists when asking about schools",
        category=TestCategory.YES_NO_FOLLOWUP,
        conversation=[
            ConversationTurn(
                message="Homes in Oakville",
                expected_intent=ExpectedIntent.PROPERTY_SEARCH,
            ),
            ConversationTurn(
                message="What schools are nearby?",
                expected_intent=ExpectedIntent.GENERAL_QUESTION,
            ),
        ],
        expected_state_after_each_turn=[
            ExpectedStateAfterTurn(
                turn_number=0,
                location="Oakville",
            ),
            ExpectedStateAfterTurn(
                turn_number=1,
                location="Oakville",  # Should persist
                should_preserve_previous=["location"],
            ),
        ],
        priority=2,
        tags=["filter_persistence", "location", "schools"],
    ),
    
    ChatFlowTestCase(
        test_id="followup_020",
        description="Location persists after property type change",
        category=TestCategory.YES_NO_FOLLOWUP,
        conversation=[
            ConversationTurn(
                message="Condos in Richmond Hill",
                expected_intent=ExpectedIntent.PROPERTY_SEARCH,
            ),
            ConversationTurn(
                message="Show me townhouses instead",
                expected_intent=ExpectedIntent.PROPERTY_REFINEMENT,
            ),
        ],
        expected_state_after_each_turn=[
            ExpectedStateAfterTurn(
                turn_number=0,
                location="Richmond Hill",
                property_type="condo",
            ),
            ExpectedStateAfterTurn(
                turn_number=1,
                location="Richmond Hill",  # Should persist
                property_type="townhouse",  # Changed
                should_preserve_previous=["location"],
            ),
        ],
        priority=1,
        tags=["filter_persistence", "location", "property_type"],
    ),
    
    ChatFlowTestCase(
        test_id="followup_021",
        description="Neighborhood context persists",
        category=TestCategory.YES_NO_FOLLOWUP,
        conversation=[
            ConversationTurn(
                message="Condos in the Distillery District",
                expected_intent=ExpectedIntent.PROPERTY_SEARCH,
            ),
            ConversationTurn(
                message="Only 1 bedrooms",
                expected_intent=ExpectedIntent.PROPERTY_REFINEMENT,
            ),
        ],
        expected_state_after_each_turn=[
            ExpectedStateAfterTurn(
                turn_number=0,
                location="Distillery District",
            ),
            ExpectedStateAfterTurn(
                turn_number=1,
                location="Distillery District",  # Should persist
                bedrooms=1,
                should_preserve_previous=["location"],
            ),
        ],
        priority=2,
        tags=["filter_persistence", "neighborhood"],
    ),
    
    ChatFlowTestCase(
        test_id="followup_022",
        description="Location persists when changing to rentals",
        category=TestCategory.YES_NO_FOLLOWUP,
        conversation=[
            ConversationTurn(
                message="Properties in Hamilton",
                expected_intent=ExpectedIntent.PROPERTY_SEARCH,
            ),
            ConversationTurn(
                message="Show only rentals",
                expected_intent=ExpectedIntent.PROPERTY_REFINEMENT,
            ),
        ],
        expected_state_after_each_turn=[
            ExpectedStateAfterTurn(
                turn_number=0,
                location="Hamilton",
                listing_type="sale",
            ),
            ExpectedStateAfterTurn(
                turn_number=1,
                location="Hamilton",  # Should persist
                listing_type="rent",  # Changed
                should_preserve_previous=["location"],
            ),
        ],
        priority=1,
        tags=["filter_persistence", "location", "listing_type"],
    ),
    
    ChatFlowTestCase(
        test_id="followup_023",
        description="Location persists after 'show me bigger units'",
        category=TestCategory.YES_NO_FOLLOWUP,
        conversation=[
            ConversationTurn(
                message="1 bed condos in Markham",
                expected_intent=ExpectedIntent.PROPERTY_SEARCH,
            ),
            ConversationTurn(
                message="Show me bigger units",
                expected_intent=ExpectedIntent.PROPERTY_REFINEMENT,
            ),
        ],
        expected_state_after_each_turn=[
            ExpectedStateAfterTurn(
                turn_number=0,
                location="Markham",
                bedrooms=1,
            ),
            ExpectedStateAfterTurn(
                turn_number=1,
                location="Markham",  # Should persist
                should_preserve_previous=["location"],
            ),
        ],
        priority=2,
        tags=["filter_persistence", "location", "size"],
    ),
    
    ChatFlowTestCase(
        test_id="followup_024",
        description="Postal code area persists",
        category=TestCategory.YES_NO_FOLLOWUP,
        conversation=[
            ConversationTurn(
                message="Condos near M5V",
                expected_intent=ExpectedIntent.PROPERTY_SEARCH,
            ),
            ConversationTurn(
                message="2 bedrooms please",
                expected_intent=ExpectedIntent.PROPERTY_REFINEMENT,
            ),
        ],
        expected_state_after_each_turn=[
            ExpectedStateAfterTurn(
                turn_number=0,
            ),
            ExpectedStateAfterTurn(
                turn_number=1,
                bedrooms=2,
            ),
        ],
        priority=2,
        tags=["filter_persistence", "postal_code"],
    ),
    
    ChatFlowTestCase(
        test_id="followup_025",
        description="Location persists after asking about transit",
        category=TestCategory.YES_NO_FOLLOWUP,
        conversation=[
            ConversationTurn(
                message="Condos in Yonge and Eglinton area",
                expected_intent=ExpectedIntent.PROPERTY_SEARCH,
            ),
            ConversationTurn(
                message="How's the transit access?",
                expected_intent=ExpectedIntent.GENERAL_QUESTION,
            ),
        ],
        expected_state_after_each_turn=[
            ExpectedStateAfterTurn(
                turn_number=0,
            ),
            ExpectedStateAfterTurn(
                turn_number=1,
            ),
        ],
        priority=2,
        tags=["filter_persistence", "location", "transit"],
    ),
    
    ChatFlowTestCase(
        test_id="followup_026",
        description="Location changes with 'switch to' phrase",
        category=TestCategory.YES_NO_FOLLOWUP,
        conversation=[
            ConversationTurn(
                message="Properties in Scarborough",
                expected_intent=ExpectedIntent.PROPERTY_SEARCH,
            ),
            ConversationTurn(
                message="Switch to North York",
                expected_intent=ExpectedIntent.PROPERTY_REFINEMENT,
            ),
        ],
        expected_state_after_each_turn=[
            ExpectedStateAfterTurn(
                turn_number=0,
                location="Scarborough",
            ),
            ExpectedStateAfterTurn(
                turn_number=1,
                location="North York",  # Changed
            ),
        ],
        priority=1,
        tags=["filter_persistence", "location_change"],
    ),
    
    ChatFlowTestCase(
        test_id="followup_027",
        description="Location persists when asking 'is there parking'",
        category=TestCategory.YES_NO_FOLLOWUP,
        conversation=[
            ConversationTurn(
                message="Condos in King West",
                expected_intent=ExpectedIntent.PROPERTY_SEARCH,
            ),
            ConversationTurn(
                message="Is there parking included?",
                expected_intent=ExpectedIntent.GENERAL_QUESTION,
            ),
        ],
        expected_state_after_each_turn=[
            ExpectedStateAfterTurn(
                turn_number=0,
                location="King West",
            ),
            ExpectedStateAfterTurn(
                turn_number=1,
                location="King West",  # Should persist
                should_preserve_previous=["location"],
            ),
        ],
        priority=2,
        tags=["filter_persistence", "location", "parking"],
    ),
    
    ChatFlowTestCase(
        test_id="followup_028",
        description="Location persists after adding sqft filter",
        category=TestCategory.YES_NO_FOLLOWUP,
        conversation=[
            ConversationTurn(
                message="Houses in Vaughan",
                expected_intent=ExpectedIntent.PROPERTY_SEARCH,
            ),
            ConversationTurn(
                message="At least 2000 square feet",
                expected_intent=ExpectedIntent.PROPERTY_REFINEMENT,
            ),
        ],
        expected_state_after_each_turn=[
            ExpectedStateAfterTurn(
                turn_number=0,
                location="Vaughan",
            ),
            ExpectedStateAfterTurn(
                turn_number=1,
                location="Vaughan",  # Should persist
                should_preserve_previous=["location"],
            ),
        ],
        priority=2,
        tags=["filter_persistence", "location", "sqft"],
    ),
    
    ChatFlowTestCase(
        test_id="followup_029",
        description="Location persists asking about condo fees",
        category=TestCategory.YES_NO_FOLLOWUP,
        conversation=[
            ConversationTurn(
                message="Condos in CityPlace",
                expected_intent=ExpectedIntent.PROPERTY_SEARCH,
            ),
            ConversationTurn(
                message="What are the condo fees like?",
                expected_intent=ExpectedIntent.GENERAL_QUESTION,
            ),
        ],
        expected_state_after_each_turn=[
            ExpectedStateAfterTurn(
                turn_number=0,
                location="CityPlace",
            ),
            ExpectedStateAfterTurn(
                turn_number=1,
                location="CityPlace",  # Should persist
                should_preserve_previous=["location"],
            ),
        ],
        priority=2,
        tags=["filter_persistence", "location", "fees"],
    ),
    
    ChatFlowTestCase(
        test_id="followup_030",
        description="Location persists through 3-turn conversation",
        category=TestCategory.YES_NO_FOLLOWUP,
        conversation=[
            ConversationTurn(
                message="Properties in Ajax",
                expected_intent=ExpectedIntent.PROPERTY_SEARCH,
            ),
            ConversationTurn(
                message="Under 600k",
                expected_intent=ExpectedIntent.PROPERTY_REFINEMENT,
            ),
            ConversationTurn(
                message="3 bedrooms",
                expected_intent=ExpectedIntent.PROPERTY_REFINEMENT,
            ),
        ],
        expected_state_after_each_turn=[
            ExpectedStateAfterTurn(
                turn_number=0,
                location="Ajax",
            ),
            ExpectedStateAfterTurn(
                turn_number=1,
                location="Ajax",  # Should persist
                max_price=600000,
                should_preserve_previous=["location"],
            ),
            ExpectedStateAfterTurn(
                turn_number=2,
                location="Ajax",  # Should persist
                max_price=600000,  # Should persist
                bedrooms=3,
                should_preserve_previous=["location", "max_price"],
            ),
        ],
        priority=1,
        tags=["filter_persistence", "location", "multi_turn"],
    ),
    
    # ==========================================================================
    # PROPERTY TYPE PERSISTENCE TESTS (31-40)
    # ==========================================================================
    
    ChatFlowTestCase(
        test_id="followup_031",
        description="Property type persists after adding bedrooms",
        category=TestCategory.YES_NO_FOLLOWUP,
        conversation=[
            ConversationTurn(
                message="Townhouses in Pickering",
                expected_intent=ExpectedIntent.PROPERTY_SEARCH,
            ),
            ConversationTurn(
                message="4 bedrooms",
                expected_intent=ExpectedIntent.PROPERTY_REFINEMENT,
            ),
        ],
        expected_state_after_each_turn=[
            ExpectedStateAfterTurn(
                turn_number=0,
                location="Pickering",
                property_type="townhouse",
            ),
            ExpectedStateAfterTurn(
                turn_number=1,
                location="Pickering",
                property_type="townhouse",  # Should persist
                bedrooms=4,
                should_preserve_previous=["location", "property_type"],
            ),
        ],
        priority=1,
        tags=["filter_persistence", "property_type"],
    ),
    
    ChatFlowTestCase(
        test_id="followup_032",
        description="Property type changes when explicitly specified",
        category=TestCategory.YES_NO_FOLLOWUP,
        conversation=[
            ConversationTurn(
                message="Condos in Waterloo",
                expected_intent=ExpectedIntent.PROPERTY_SEARCH,
            ),
            ConversationTurn(
                message="Actually, show me detached houses",
                expected_intent=ExpectedIntent.PROPERTY_REFINEMENT,
            ),
        ],
        expected_state_after_each_turn=[
            ExpectedStateAfterTurn(
                turn_number=0,
                location="Waterloo",
                property_type="condo",
            ),
            ExpectedStateAfterTurn(
                turn_number=1,
                location="Waterloo",  # Should persist
                property_type="detached",  # Changed
                should_preserve_previous=["location"],
            ),
        ],
        priority=1,
        tags=["filter_persistence", "property_type_change"],
    ),
    
    ChatFlowTestCase(
        test_id="followup_033",
        description="Property type persists when asking about price",
        category=TestCategory.YES_NO_FOLLOWUP,
        conversation=[
            ConversationTurn(
                message="Semi-detached homes in Guelph",
                expected_intent=ExpectedIntent.PROPERTY_SEARCH,
            ),
            ConversationTurn(
                message="What's the price range?",
                expected_intent=ExpectedIntent.GENERAL_QUESTION,
            ),
        ],
        expected_state_after_each_turn=[
            ExpectedStateAfterTurn(
                turn_number=0,
                location="Guelph",
                property_type="semi-detached",
            ),
            ExpectedStateAfterTurn(
                turn_number=1,
                location="Guelph",
                property_type="semi-detached",  # Should persist
                should_preserve_previous=["location", "property_type"],
            ),
        ],
        priority=2,
        tags=["filter_persistence", "property_type", "price_question"],
    ),
    
    ChatFlowTestCase(
        test_id="followup_034",
        description="Property type persists with location change",
        category=TestCategory.YES_NO_FOLLOWUP,
        conversation=[
            ConversationTurn(
                message="Condos in downtown Toronto",
                expected_intent=ExpectedIntent.PROPERTY_SEARCH,
            ),
            ConversationTurn(
                message="What about in Liberty Village?",
                expected_intent=ExpectedIntent.PROPERTY_REFINEMENT,
            ),
        ],
        expected_state_after_each_turn=[
            ExpectedStateAfterTurn(
                turn_number=0,
                location="Toronto",
                property_type="condo",
            ),
            ExpectedStateAfterTurn(
                turn_number=1,
                location="Liberty Village",
                property_type="condo",  # Should persist
                should_preserve_previous=["property_type"],
            ),
        ],
        priority=1,
        tags=["filter_persistence", "property_type", "neighborhood_change"],
    ),
    
    ChatFlowTestCase(
        test_id="followup_035",
        description="Property type cleared for fresh search in new city",
        category=TestCategory.YES_NO_FOLLOWUP,
        conversation=[
            ConversationTurn(
                message="Townhouses in Oakville",
                expected_intent=ExpectedIntent.PROPERTY_SEARCH,
            ),
            ConversationTurn(
                message="Show me homes in Montreal",
                expected_intent=ExpectedIntent.PROPERTY_SEARCH,
            ),
        ],
        expected_state_after_each_turn=[
            ExpectedStateAfterTurn(
                turn_number=0,
                location="Oakville",
                property_type="townhouse",
            ),
            ExpectedStateAfterTurn(
                turn_number=1,
                location="Montreal",  # New city - fresh search
            ),
        ],
        priority=2,
        tags=["filter_clear", "new_city", "property_type"],
    ),
    
    ChatFlowTestCase(
        test_id="followup_036",
        description="Property type persists after adding price filter",
        category=TestCategory.YES_NO_FOLLOWUP,
        conversation=[
            ConversationTurn(
                message="Bungalows in Barrie",
                expected_intent=ExpectedIntent.PROPERTY_SEARCH,
            ),
            ConversationTurn(
                message="Under 500k",
                expected_intent=ExpectedIntent.PROPERTY_REFINEMENT,
            ),
        ],
        expected_state_after_each_turn=[
            ExpectedStateAfterTurn(
                turn_number=0,
                location="Barrie",
                property_type="bungalow",
            ),
            ExpectedStateAfterTurn(
                turn_number=1,
                location="Barrie",
                property_type="bungalow",  # Should persist
                max_price=500000,
                should_preserve_previous=["location", "property_type"],
            ),
        ],
        priority=2,
        tags=["filter_persistence", "property_type", "price"],
    ),
    
    ChatFlowTestCase(
        test_id="followup_037",
        description="Property type persists when switching listing type",
        category=TestCategory.YES_NO_FOLLOWUP,
        conversation=[
            ConversationTurn(
                message="Studio apartments in Toronto",
                expected_intent=ExpectedIntent.PROPERTY_SEARCH,
            ),
            ConversationTurn(
                message="Show me rentals instead",
                expected_intent=ExpectedIntent.PROPERTY_REFINEMENT,
            ),
        ],
        expected_state_after_each_turn=[
            ExpectedStateAfterTurn(
                turn_number=0,
                location="Toronto",
                property_type="apartment",
                listing_type="sale",
            ),
            ExpectedStateAfterTurn(
                turn_number=1,
                location="Toronto",
                property_type="apartment",  # Should persist
                listing_type="rent",  # Changed
                should_preserve_previous=["location", "property_type"],
            ),
        ],
        priority=1,
        tags=["filter_persistence", "property_type", "listing_type"],
    ),
    
    ChatFlowTestCase(
        test_id="followup_038",
        description="Property type persists with bathroom filter",
        category=TestCategory.YES_NO_FOLLOWUP,
        conversation=[
            ConversationTurn(
                message="Detached houses in Burlington",
                expected_intent=ExpectedIntent.PROPERTY_SEARCH,
            ),
            ConversationTurn(
                message="At least 3 bathrooms",
                expected_intent=ExpectedIntent.PROPERTY_REFINEMENT,
            ),
        ],
        expected_state_after_each_turn=[
            ExpectedStateAfterTurn(
                turn_number=0,
                location="Burlington",
                property_type="detached",
            ),
            ExpectedStateAfterTurn(
                turn_number=1,
                location="Burlington",
                property_type="detached",  # Should persist
                bathrooms=3,
                should_preserve_previous=["location", "property_type"],
            ),
        ],
        priority=2,
        tags=["filter_persistence", "property_type", "bathrooms"],
    ),
    
    ChatFlowTestCase(
        test_id="followup_039",
        description="Property type persists asking about HOA",
        category=TestCategory.YES_NO_FOLLOWUP,
        conversation=[
            ConversationTurn(
                message="Lofts in the Distillery",
                expected_intent=ExpectedIntent.PROPERTY_SEARCH,
            ),
            ConversationTurn(
                message="What are the maintenance fees?",
                expected_intent=ExpectedIntent.GENERAL_QUESTION,
            ),
        ],
        expected_state_after_each_turn=[
            ExpectedStateAfterTurn(
                turn_number=0,
                location="Distillery",
                property_type="loft",
            ),
            ExpectedStateAfterTurn(
                turn_number=1,
                location="Distillery",
                property_type="loft",  # Should persist
                should_preserve_previous=["location", "property_type"],
            ),
        ],
        priority=2,
        tags=["filter_persistence", "property_type", "fees"],
    ),
    
    ChatFlowTestCase(
        test_id="followup_040",
        description="Property type persists through filtering flow",
        category=TestCategory.YES_NO_FOLLOWUP,
        conversation=[
            ConversationTurn(
                message="Penthouses in Yorkville",
                expected_intent=ExpectedIntent.PROPERTY_SEARCH,
            ),
            ConversationTurn(
                message="Over 2000 sqft",
                expected_intent=ExpectedIntent.PROPERTY_REFINEMENT,
            ),
            ConversationTurn(
                message="With a terrace",
                expected_intent=ExpectedIntent.PROPERTY_REFINEMENT,
            ),
        ],
        expected_state_after_each_turn=[
            ExpectedStateAfterTurn(
                turn_number=0,
                location="Yorkville",
                property_type="penthouse",
            ),
            ExpectedStateAfterTurn(
                turn_number=1,
                location="Yorkville",
                property_type="penthouse",  # Should persist
                should_preserve_previous=["location", "property_type"],
            ),
            ExpectedStateAfterTurn(
                turn_number=2,
                location="Yorkville",
                property_type="penthouse",  # Should persist
                should_preserve_previous=["location", "property_type"],
            ),
        ],
        priority=2,
        tags=["filter_persistence", "property_type", "multi_turn"],
    ),
    
    # ==========================================================================
    # LISTING TYPE (RENT/SALE) PERSISTENCE TESTS (41-50)
    # ==========================================================================
    
    ChatFlowTestCase(
        test_id="followup_041",
        description="Rental search persists after adding bedrooms",
        category=TestCategory.YES_NO_FOLLOWUP,
        conversation=[
            ConversationTurn(
                message="Rentals in downtown Toronto",
                expected_intent=ExpectedIntent.PROPERTY_SEARCH,
            ),
            ConversationTurn(
                message="2 bedrooms",
                expected_intent=ExpectedIntent.PROPERTY_REFINEMENT,
            ),
        ],
        expected_state_after_each_turn=[
            ExpectedStateAfterTurn(
                turn_number=0,
                location="Toronto",
                listing_type="rent",
            ),
            ExpectedStateAfterTurn(
                turn_number=1,
                location="Toronto",
                listing_type="rent",  # Should persist
                bedrooms=2,
                should_preserve_previous=["location", "listing_type"],
            ),
        ],
        priority=1,
        tags=["filter_persistence", "listing_type", "rental"],
    ),
    
    ChatFlowTestCase(
        test_id="followup_042",
        description="Rental changes to sale when explicitly requested",
        category=TestCategory.YES_NO_FOLLOWUP,
        conversation=[
            ConversationTurn(
                message="1 bed rental in Scarborough",
                expected_intent=ExpectedIntent.PROPERTY_SEARCH,
            ),
            ConversationTurn(
                message="Show me for sale instead",
                expected_intent=ExpectedIntent.PROPERTY_REFINEMENT,
            ),
        ],
        expected_state_after_each_turn=[
            ExpectedStateAfterTurn(
                turn_number=0,
                location="Scarborough",
                listing_type="rent",
                bedrooms=1,
            ),
            ExpectedStateAfterTurn(
                turn_number=1,
                location="Scarborough",  # Should persist
                listing_type="sale",  # Changed
                bedrooms=1,  # Should persist
                should_preserve_previous=["location", "bedrooms"],
            ),
        ],
        priority=1,
        tags=["filter_persistence", "listing_type_change"],
    ),
    
    ChatFlowTestCase(
        test_id="followup_043",
        description="Sale persists after adding property type",
        category=TestCategory.YES_NO_FOLLOWUP,
        conversation=[
            ConversationTurn(
                message="Properties for sale in Etobicoke",
                expected_intent=ExpectedIntent.PROPERTY_SEARCH,
            ),
            ConversationTurn(
                message="Only townhouses",
                expected_intent=ExpectedIntent.PROPERTY_REFINEMENT,
            ),
        ],
        expected_state_after_each_turn=[
            ExpectedStateAfterTurn(
                turn_number=0,
                location="Etobicoke",
                listing_type="sale",
            ),
            ExpectedStateAfterTurn(
                turn_number=1,
                location="Etobicoke",
                listing_type="sale",  # Should persist
                property_type="townhouse",
                should_preserve_previous=["location", "listing_type"],
            ),
        ],
        priority=1,
        tags=["filter_persistence", "listing_type", "sale"],
    ),
    
    ChatFlowTestCase(
        test_id="followup_044",
        description="Rental persists after price range added",
        category=TestCategory.YES_NO_FOLLOWUP,
        conversation=[
            ConversationTurn(
                message="Apartment rentals in North York",
                expected_intent=ExpectedIntent.PROPERTY_SEARCH,
            ),
            ConversationTurn(
                message="Under $2500 per month",
                expected_intent=ExpectedIntent.PROPERTY_REFINEMENT,
            ),
        ],
        expected_state_after_each_turn=[
            ExpectedStateAfterTurn(
                turn_number=0,
                location="North York",
                listing_type="rent",
            ),
            ExpectedStateAfterTurn(
                turn_number=1,
                location="North York",
                listing_type="rent",  # Should persist
                max_price=2500,
                should_preserve_previous=["location", "listing_type"],
            ),
        ],
        priority=1,
        tags=["filter_persistence", "listing_type", "rental_price"],
    ),
    
    ChatFlowTestCase(
        test_id="followup_045",
        description="Rental persists when asking about lease terms",
        category=TestCategory.YES_NO_FOLLOWUP,
        conversation=[
            ConversationTurn(
                message="1 bed rentals near UofT",
                expected_intent=ExpectedIntent.PROPERTY_SEARCH,
            ),
            ConversationTurn(
                message="Are these short-term leases?",
                expected_intent=ExpectedIntent.GENERAL_QUESTION,
            ),
        ],
        expected_state_after_each_turn=[
            ExpectedStateAfterTurn(
                turn_number=0,
                listing_type="rent",
                bedrooms=1,
            ),
            ExpectedStateAfterTurn(
                turn_number=1,
                listing_type="rent",  # Should persist
                bedrooms=1,  # Should persist
                should_preserve_previous=["listing_type", "bedrooms"],
            ),
        ],
        priority=2,
        tags=["filter_persistence", "listing_type", "lease_question"],
    ),
    
    ChatFlowTestCase(
        test_id="followup_046",
        description="Rental persists through multiple refinements",
        category=TestCategory.YES_NO_FOLLOWUP,
        conversation=[
            ConversationTurn(
                message="Rentals in Mississauga",
                expected_intent=ExpectedIntent.PROPERTY_SEARCH,
            ),
            ConversationTurn(
                message="2 bedrooms",
                expected_intent=ExpectedIntent.PROPERTY_REFINEMENT,
            ),
            ConversationTurn(
                message="Pet-friendly",
                expected_intent=ExpectedIntent.PROPERTY_REFINEMENT,
            ),
        ],
        expected_state_after_each_turn=[
            ExpectedStateAfterTurn(
                turn_number=0,
                location="Mississauga",
                listing_type="rent",
            ),
            ExpectedStateAfterTurn(
                turn_number=1,
                location="Mississauga",
                listing_type="rent",  # Should persist
                bedrooms=2,
                should_preserve_previous=["location", "listing_type"],
            ),
            ExpectedStateAfterTurn(
                turn_number=2,
                location="Mississauga",
                listing_type="rent",  # Should persist
                bedrooms=2,  # Should persist
                should_preserve_previous=["location", "listing_type", "bedrooms"],
            ),
        ],
        priority=1,
        tags=["filter_persistence", "listing_type", "multi_turn"],
    ),
    
    ChatFlowTestCase(
        test_id="followup_047",
        description="Sale context persists asking about mortgage",
        category=TestCategory.YES_NO_FOLLOWUP,
        conversation=[
            ConversationTurn(
                message="Condos for sale in Hamilton under 400k",
                expected_intent=ExpectedIntent.PROPERTY_SEARCH,
            ),
            ConversationTurn(
                message="What would the monthly mortgage be?",
                expected_intent=ExpectedIntent.GENERAL_QUESTION,
            ),
        ],
        expected_state_after_each_turn=[
            ExpectedStateAfterTurn(
                turn_number=0,
                location="Hamilton",
                listing_type="sale",
                max_price=400000,
            ),
            ExpectedStateAfterTurn(
                turn_number=1,
                location="Hamilton",
                listing_type="sale",  # Should persist
                max_price=400000,  # Should persist
                should_preserve_previous=["location", "listing_type", "max_price"],
            ),
        ],
        priority=2,
        tags=["filter_persistence", "listing_type", "mortgage"],
    ),
    
    ChatFlowTestCase(
        test_id="followup_048",
        description="Lease search persists with neighborhood change",
        category=TestCategory.YES_NO_FOLLOWUP,
        conversation=[
            ConversationTurn(
                message="Apartments for lease in Yorkville",
                expected_intent=ExpectedIntent.PROPERTY_SEARCH,
            ),
            ConversationTurn(
                message="What about Forest Hill?",
                expected_intent=ExpectedIntent.PROPERTY_REFINEMENT,
            ),
        ],
        expected_state_after_each_turn=[
            ExpectedStateAfterTurn(
                turn_number=0,
                location="Yorkville",
                listing_type="rent",
            ),
            ExpectedStateAfterTurn(
                turn_number=1,
                location="Forest Hill",  # Changed
                listing_type="rent",  # Should persist
                should_preserve_previous=["listing_type"],
            ),
        ],
        priority=1,
        tags=["filter_persistence", "listing_type", "neighborhood_change"],
    ),
    
    ChatFlowTestCase(
        test_id="followup_049",
        description="Sale persists when asking about closing costs",
        category=TestCategory.YES_NO_FOLLOWUP,
        conversation=[
            ConversationTurn(
                message="Houses for sale in Brampton",
                expected_intent=ExpectedIntent.PROPERTY_SEARCH,
            ),
            ConversationTurn(
                message="What are typical closing costs?",
                expected_intent=ExpectedIntent.GENERAL_QUESTION,
            ),
        ],
        expected_state_after_each_turn=[
            ExpectedStateAfterTurn(
                turn_number=0,
                location="Brampton",
                listing_type="sale",
            ),
            ExpectedStateAfterTurn(
                turn_number=1,
                location="Brampton",
                listing_type="sale",  # Should persist
                should_preserve_previous=["location", "listing_type"],
            ),
        ],
        priority=2,
        tags=["filter_persistence", "listing_type", "closing_costs"],
    ),
    
    ChatFlowTestCase(
        test_id="followup_050",
        description="Full filter set persists after general question",
        category=TestCategory.YES_NO_FOLLOWUP,
        conversation=[
            ConversationTurn(
                message="3 bed townhouse rentals in Markham under 3000/month",
                expected_intent=ExpectedIntent.PROPERTY_SEARCH,
            ),
            ConversationTurn(
                message="Is this area safe for families?",
                expected_intent=ExpectedIntent.GENERAL_QUESTION,
            ),
        ],
        expected_state_after_each_turn=[
            ExpectedStateAfterTurn(
                turn_number=0,
                location="Markham",
                listing_type="rent",
                bedrooms=3,
                property_type="townhouse",
                max_price=3000,
            ),
            ExpectedStateAfterTurn(
                turn_number=1,
                location="Markham",
                listing_type="rent",  # Should persist
                bedrooms=3,  # Should persist
                property_type="townhouse",  # Should persist
                max_price=3000,  # Should persist
                should_preserve_previous=["location", "listing_type", "bedrooms", "property_type", "max_price"],
            ),
        ],
        priority=1,
        tags=["filter_persistence", "full_context", "critical"],
    ),
]


# =============================================================================
# ALL TEST CASES AGGREGATED
# =============================================================================

ALL_TEST_CASES: List[ChatFlowTestCase] = (
    YES_NO_FOLLOWUP_TESTS +
    PARTIAL_ANSWER_TESTS +
    LOCATION_SWITCH_TESTS +
    INTERRUPTION_TESTS +
    MULTI_INTENT_TESTS +
    OFF_TOPIC_TESTS +
    GENERAL_QUESTION_TESTS +
    EDGE_CASE_TESTS +
    UX_QUALITY_TESTS +
    FOLLOW_UP_HANDLING_TESTS
)


def get_tests_by_category(category: TestCategory) -> List[ChatFlowTestCase]:
    """Get all test cases for a specific category."""
    return [tc for tc in ALL_TEST_CASES if tc.category == category]


def get_tests_by_tag(tag: str) -> List[ChatFlowTestCase]:
    """Get all test cases with a specific tag."""
    return [tc for tc in ALL_TEST_CASES if tc.tags and tag in tc.tags]


def get_critical_tests() -> List[ChatFlowTestCase]:
    """Get all critical (priority 1) test cases."""
    return [tc for tc in ALL_TEST_CASES if tc.priority == 1]


def get_non_property_tests() -> List[ChatFlowTestCase]:
    """Get all non-property related test cases."""
    return [tc for tc in ALL_TEST_CASES if tc.is_non_property_test]
