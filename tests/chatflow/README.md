# ChatFlow Test Framework

## Overview

The ChatFlow Test Framework is an automated testing system for validating the Summitly AI Real Estate Assistant's conversational behavior. It provides comprehensive multi-turn conversation testing with state tracking, UX quality assertions, and deterministic replay support.

**ZERO FUNCTIONAL CHANGES**: This framework is read-only and does not modify any production code, chat flow, or APIs.

## Features

- ✅ **Multi-turn Conversation Testing**: Test complete conversation flows with context preservation
- ✅ **Yes/No Follow-up Handling**: Validate confirmation responses
- ✅ **Context Preservation**: Ensure filters are preserved across turns
- ✅ **Location Switch Testing**: Test "What about Mississauga?" type queries
- ✅ **Off-Topic Detection**: Verify non-property questions are handled gracefully
- ✅ **UX Quality Assertions**: Check for polite, natural, non-robotic responses
- ✅ **Forbidden Behavior Detection**: Catch duplicate questions and filter resets
- ✅ **Deterministic Replay**: Reproduce test results consistently
- ✅ **HTML Report Generation**: Beautiful reports with scores and metrics

## Installation

The framework uses standard Python dependencies already present in the Summitly Backend:

```bash
# Required dependencies (already in requirements.txt)
pip install pydantic requests
```

## Quick Start

### Run All Tests

```bash
# Run against localhost
python run_chatflow_tests.py

# Run against production server
python run_chatflow_tests.py --server https://summitly-ai.onrender.com
```

### Run Specific Categories

```bash
# Run off-topic/non-property tests only
python run_chatflow_tests.py --category off_topic

# Run only non-property related tests
python run_chatflow_tests.py --non-property

# Run critical tests only
python run_chatflow_tests.py --critical

# Run tests with specific tag
python run_chatflow_tests.py --tag graceful_redirect
```

### List Available Tests

```bash
# List all test categories
python run_chatflow_tests.py --list-categories

# List all tests
python run_chatflow_tests.py --list

# List tests in a category
python run_chatflow_tests.py --list --category off_topic
```

## Test Categories

| Category | Description | Count |
|----------|-------------|-------|
| `yes_no_followup` | Yes/No confirmation handling | 5 |
| `partial_answer` | Partial information handling | 3 |
| `location_switch` | Location change handling | 3 |
| `interruption` | Conversation interruption handling | 3 |
| `multi_intent` | Multi-intent message handling | 3 |
| `off_topic` | Non-property question handling | 10 |
| `general_question` | General real estate questions | 3 |
| `edge_case` | Edge case handling | 5 |
| `ux_quality` | UX quality validation | 3 |

## Test Schema

Each test case is defined using the `ChatFlowTestCase` schema:

```python
from tests.chatflow import ChatFlowTestCase, ConversationTurn, ExpectedIntent, ForbiddenBehavior

test = ChatFlowTestCase(
    test_id="offtopic_001",
    description="Test weather question - should redirect gracefully",
    category=TestCategory.OFF_TOPIC,
    conversation=[
        ConversationTurn(
            message="What's the weather like today?",
            expected_intent=ExpectedIntent.OFF_TOPIC,
            response_should_contain=["properties", "real estate", "help"],
            response_should_not_contain=["sunny", "rain", "temperature"],
            should_have_properties=False,
        ),
    ],
    is_non_property_test=True,
    should_not_trigger_search=True,
    forbidden_behaviors=[
        ForbiddenBehavior.TRIGGER_MLS_SEARCH,
        ForbiddenBehavior.PROVIDE_PROPERTY_DATA,
    ],
    priority=1,
    tags=["off_topic", "weather", "graceful_redirect"],
)
```

## Quality Scores

The framework calculates four quality scores (0-100):

### Context Retention Score
Measures how well the bot preserves context across conversation turns. Checks that previously provided information (location, budget, bedrooms) is not lost.

### Follow-up Correctness Score
Measures the accuracy of follow-up handling. Validates that the bot correctly interprets yes/no confirmations and partial answers.

### NLP Extraction Accuracy
Measures the accuracy of intent classification and entity extraction. Compares detected intents and entities against expected values.

### UX Quality Score
Measures overall user experience quality:
- Response length appropriateness
- Polite, non-robotic language
- Clear next action suggestions
- No duplicate clarification questions

## Forbidden Behaviors

Tests can specify behaviors that MUST NOT occur:

| Behavior | Description |
|----------|-------------|
| `ASK_BUDGET_AGAIN` | Don't ask for budget if already provided |
| `ASK_LOCATION_AGAIN` | Don't ask for location if already provided |
| `ASK_PROPERTY_TYPE_AGAIN` | Don't ask for property type if already provided |
| `ASK_BEDROOMS_AGAIN` | Don't ask for bedrooms if already provided |
| `RESET_FILTERS` | Don't reset filters unexpectedly |
| `IGNORE_CONTEXT` | Don't ignore previously discussed topics |
| `DUPLICATE_QUESTION` | Don't ask the same question twice |
| `ROBOTIC_RESPONSE` | Don't give robotic/template responses |
| `TRIGGER_MLS_SEARCH` | Don't trigger MLS search (for off-topic tests) |
| `PROVIDE_PROPERTY_DATA` | Don't provide property data (for off-topic tests) |

## HTML Reports

Reports are generated in `tests/chatflow/reports/` and include:

- **Summary Cards**: Total tests, passed, failed, errors, pass rate
- **Quality Scores**: Visual bars for all four quality metrics
- **Response Time Metrics**: Avg, min, max, P95 latency
- **Category Breakdown**: Per-category pass/fail counts
- **Failed Tests Section**: Detailed failure information
- **Full Test Results Table**: Expandable rows with conversation details

## Writing New Tests

### Adding a Test Case

1. Open `tests/chatflow/test_cases.py`
2. Add your test to the appropriate category list
3. Use the `ChatFlowTestCase` schema

```python
ChatFlowTestCase(
    test_id="your_test_001",  # Unique ID
    description="Clear description of what this tests",
    category=TestCategory.YOUR_CATEGORY,
    conversation=[
        ConversationTurn(
            message="User message",
            expected_intent=ExpectedIntent.EXPECTED_INTENT,
            response_should_contain=["expected", "words"],
            response_should_not_contain=["forbidden", "words"],
            should_have_properties=True,  # or False
        ),
        # Add more turns for multi-turn conversations
    ],
    forbidden_behaviors=[
        ForbiddenBehavior.RELEVANT_BEHAVIOR,
    ],
    priority=1,  # 1=critical, 2=high, 3=medium, 4=low
    tags=["relevant", "tags"],
)
```

### Multi-Turn Conversation Test

```python
ChatFlowTestCase(
    test_id="multi_turn_001",
    description="Test context preservation across turns",
    category=TestCategory.CONTEXT_PRESERVATION,
    conversation=[
        ConversationTurn(
            message="Show me condos in Toronto under 500k",
            expected_intent=ExpectedIntent.PROPERTY_SEARCH,
        ),
        ConversationTurn(
            message="What about 3 bedrooms?",
            expected_intent=ExpectedIntent.PROPERTY_REFINEMENT,
            response_should_not_contain=["what's your budget", "which location"],
        ),
    ],
    expected_state_after_each_turn=[
        ExpectedStateAfterTurn(
            turn_number=0,
            location="Toronto",
            property_type="condo",
            max_price=500000,
        ),
        ExpectedStateAfterTurn(
            turn_number=1,
            location="Toronto",
            property_type="condo",
            max_price=500000,
            bedrooms=3,
            should_preserve_previous=["location", "property_type", "max_price"],
        ),
    ],
    forbidden_behaviors=[
        ForbiddenBehavior.ASK_LOCATION_AGAIN,
        ForbiddenBehavior.ASK_BUDGET_AGAIN,
    ],
)
```

## Programmatic Usage

```python
from tests.chatflow import (
    run_chatflow_tests,
    ChatFlowTestRunner,
    ALL_TEST_CASES,
    get_non_property_tests,
)

# Run all tests
result = run_chatflow_tests()
print(f"Pass rate: {result.pass_rate}%")

# Run specific tests
runner = ChatFlowTestRunner(server_url="http://localhost:5050")
result = runner.run_test_suite(get_non_property_tests(), suite_name="Off-Topic Tests")

# Generate report
from tests.chatflow import generate_chatflow_report
report_path = generate_chatflow_report(result)
print(f"Report: {report_path}")
```

## Test Output

### Console Output

```
================================================================================
🤖 SUMMITLY CHATFLOW TEST RUNNER
================================================================================
  Server: http://localhost:5050
  Category: off_topic
  Non-property only: True
================================================================================

======================================================================
🧪 TEST: offtopic_001
   Test weather question - should redirect gracefully
   Category: off_topic
======================================================================

📤 Turn 1: "What's the weather like today?"
📥 Response: I'm here to help you find properties and learn about real estate...
   Time: 1234ms

📊 RESULT: PASSED
   Passed: 5
   Failed: 0
   Context Score: 100.0/100
   Follow-up Score: 100.0/100
   NLP Score: 100.0/100
   UX Score: 85.0/100

================================================================================
📊 TEST SUMMARY
================================================================================
  Total Tests: 10
  ✅ Passed:   9
  ❌ Failed:   1
  ⚠️  Errors:   0
  📈 Pass Rate: 90.0%
================================================================================
```

## Best Practices

1. **Use unique test IDs**: Follow the pattern `{category}_{number}` (e.g., `offtopic_001`)
2. **Write clear descriptions**: Describe what the test validates
3. **Use appropriate priorities**: Critical tests (priority 1) should catch breaking changes
4. **Add relevant tags**: Tags help filter and organize tests
5. **Test both positive and negative cases**: Verify what should and should NOT happen
6. **Include forbidden behaviors**: Explicitly specify what must not occur
7. **Use state assertions for multi-turn**: Verify state is preserved correctly

## Troubleshooting

### Tests Failing Due to Server Connection
```bash
# Check if server is running
curl http://localhost:5050/health

# Start the server
python -m app.voice_assistant_clean
```

### Tests Failing Due to Import Errors
```bash
# Ensure you're in the correct directory
cd /path/to/Summitly\ Backend

# Run with Python path set
PYTHONPATH=$PYTHONPATH:. python run_chatflow_tests.py
```

### Debugging a Specific Test
```python
from tests.chatflow import ChatFlowTestRunner, ALL_TEST_CASES

runner = ChatFlowTestRunner(server_url="http://localhost:5050", verbose=True)

# Find and run specific test
test = next(tc for tc in ALL_TEST_CASES if tc.test_id == "offtopic_001")
result = runner.run_single_test(test)
print(result)
```

## Contributing

When adding new tests:

1. Follow the existing test patterns in `test_cases.py`
2. Ensure tests are deterministic (same results on each run)
3. Add appropriate tags for discoverability
4. Update the category counts in this README if adding new categories
5. Run the full test suite before submitting changes

---

**Author**: Summitly QA Team  
**Date**: December 31, 2025  
**Version**: 1.0.0
