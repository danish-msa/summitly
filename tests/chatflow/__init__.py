"""
ChatFlow Test Framework
=======================
Automated chatflow testing framework for the Summitly AI Real Estate Assistant.

This package provides comprehensive multi-turn conversation testing with:
- Schema-based test case definitions
- Multi-turn conversation execution
- State tracking and verification
- UX quality assertions
- Deterministic replay support
- HTML report generation

ZERO FUNCTIONAL CHANGES: This package is read-only and does not modify
any production code, chat flow, or APIs.

Modules:
- test_schemas: Pydantic schemas for test case definitions
- test_runner: Core test execution engine
- test_cases: Pre-defined test case collections
- report_generator: HTML report generation

Usage:
    from tests.chatflow import run_chatflow_tests
    
    # Run all tests
    result = run_chatflow_tests()
    
    # Run specific category
    result = run_chatflow_tests(category="off_topic")
    
    # Run with custom server
    result = run_chatflow_tests(server_url="http://localhost:5050")

Author: Summitly QA Team
Date: December 31, 2025
"""

from tests.chatflow.test_schemas import (
    ChatFlowTestCase,
    ConversationTurn,
    ExpectedIntent,
    ExpectedStateAfterTurn,
    ForbiddenBehavior,
    TestCategory,
    TestCaseResult,
    TestStatus,
    TestSuiteResult,
    TurnResult,
    UXAssertion,
)

from tests.chatflow.test_runner import (
    ChatFlowTestRunner,
    ChatbotClient,
    AssertionEngine,
    UXQualityChecker,
    ForbiddenBehaviorDetector,
)

from tests.chatflow.test_cases import (
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
    get_tests_by_category,
    get_tests_by_tag,
    get_critical_tests,
    get_non_property_tests,
)

from tests.chatflow.report_generator import (
    ChatFlowReportGenerator,
    generate_chatflow_report,
)


__version__ = "1.0.0"
__all__ = [
    # Schemas
    "ChatFlowTestCase",
    "ConversationTurn",
    "ExpectedIntent",
    "ExpectedStateAfterTurn",
    "ForbiddenBehavior",
    "TestCategory",
    "TestCaseResult",
    "TestStatus",
    "TestSuiteResult",
    "TurnResult",
    "UXAssertion",
    # Runner
    "ChatFlowTestRunner",
    "ChatbotClient",
    "AssertionEngine",
    "UXQualityChecker",
    "ForbiddenBehaviorDetector",
    # Test cases
    "ALL_TEST_CASES",
    "YES_NO_FOLLOWUP_TESTS",
    "PARTIAL_ANSWER_TESTS",
    "LOCATION_SWITCH_TESTS",
    "INTERRUPTION_TESTS",
    "MULTI_INTENT_TESTS",
    "OFF_TOPIC_TESTS",
    "GENERAL_QUESTION_TESTS",
    "EDGE_CASE_TESTS",
    "UX_QUALITY_TESTS",
    "FOLLOW_UP_HANDLING_TESTS",
    "get_tests_by_category",
    "get_tests_by_tag",
    "get_critical_tests",
    "get_non_property_tests",
    # Report
    "ChatFlowReportGenerator",
    "generate_chatflow_report",
    # Main function
    "run_chatflow_tests",
]


def run_chatflow_tests(
    server_url: str = "http://localhost:5050",
    category: str = None,
    tag: str = None,
    critical_only: bool = False,
    non_property_only: bool = False,
    verbose: bool = True,
    generate_report: bool = True,
    report_dir: str = "tests/chatflow/reports"
) -> TestSuiteResult:
    """
    Run chatflow tests with the specified configuration.
    
    Args:
        server_url: Base URL of the chatbot server
        category: Filter by test category (e.g., "off_topic", "yes_no_followup")
        tag: Filter by tag (e.g., "critical", "graceful_redirect")
        critical_only: Only run priority 1 (critical) tests
        non_property_only: Only run non-property related tests
        verbose: Print detailed output during test execution
        generate_report: Generate HTML report after tests complete
        report_dir: Directory for HTML report output
        
    Returns:
        TestSuiteResult with all test results and metrics
    
    Example:
        >>> result = run_chatflow_tests()
        >>> print(f"Pass rate: {result.pass_rate}%")
        
        >>> result = run_chatflow_tests(category="off_topic")
        >>> print(f"Off-topic tests: {result.total_tests}")
    """
    # Select test cases based on filters
    test_cases = ALL_TEST_CASES.copy()
    
    if category:
        try:
            cat_enum = TestCategory(category)
            test_cases = get_tests_by_category(cat_enum)
        except ValueError:
            print(f"Warning: Unknown category '{category}', running all tests")
    
    if tag:
        test_cases = [tc for tc in test_cases if tc.tags and tag in tc.tags]
    
    if critical_only:
        test_cases = [tc for tc in test_cases if tc.priority == 1]
    
    if non_property_only:
        test_cases = [tc for tc in test_cases if tc.is_non_property_test]
    
    if not test_cases:
        print("No test cases match the specified filters")
        return None
    
    # Create runner and execute tests
    runner = ChatFlowTestRunner(
        server_url=server_url,
        verbose=verbose
    )
    
    suite_name = "ChatFlow Test Suite"
    if category:
        suite_name = f"ChatFlow Tests - {category.replace('_', ' ').title()}"
    elif non_property_only:
        suite_name = "ChatFlow Tests - Non-Property Questions"
    elif critical_only:
        suite_name = "ChatFlow Tests - Critical"
    
    result = runner.run_test_suite(test_cases, suite_name=suite_name)
    
    # Generate HTML report
    if generate_report:
        report_path = generate_chatflow_report(result, output_dir=report_dir)
        print(f"\n📊 HTML Report generated: {report_path}")
    
    return result
