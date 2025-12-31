"""
ChatFlow Test Runner
====================
Core test execution engine for automated chatflow testing.
Handles multi-turn conversations, state tracking, and assertion validation.

ZERO FUNCTIONAL CHANGES: This module is read-only and does not modify
any production code, chat flow, or APIs.

Features:
- Multi-turn conversation replay
- State tracking and verification
- UX quality assertions
- Deterministic test replay
- Comprehensive error reporting

Author: Summitly QA Team
Date: December 31, 2025
"""

import hashlib
import json
import logging
import os
import re
import sys
import time
import traceback
import uuid
from datetime import datetime
from pathlib import Path
from typing import Any, Dict, List, Optional, Tuple

import requests

# Add parent directory to path for imports
sys.path.insert(0, str(Path(__file__).parent.parent.parent))

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

logger = logging.getLogger(__name__)


# =============================================================================
# CONFIGURATION
# =============================================================================

# Default server configuration
DEFAULT_LOCAL_SERVER = "http://localhost:5050"
DEFAULT_LIVE_SERVER = "https://summitly-ai.onrender.com"

# Endpoints
CHAT_ENDPOINT = "/api/chat"
CHAT_GPT4_ENDPOINT = "/api/chat-gpt4"

# Timeouts
REQUEST_TIMEOUT = 60  # seconds
RETRY_COUNT = 2
RETRY_DELAY = 2  # seconds

# Request pacing
DELAY_BETWEEN_TURNS = 1.0  # seconds
DELAY_BETWEEN_TESTS = 2.0  # seconds

# UX thresholds
MAX_RESPONSE_LENGTH = 2000
MIN_RESPONSE_LENGTH = 5
RESPONSE_TIME_WARN_MS = 3000
RESPONSE_TIME_CRITICAL_MS = 10000


# =============================================================================
# ROBOTIC LANGUAGE PATTERNS
# =============================================================================

ROBOTIC_PATTERNS = [
    r"^I am an AI",
    r"^As an AI",
    r"^I don't have access",
    r"^I cannot access",
    r"Error:",
    r"Exception:",
    r"undefined",
    r"null",
    r"\{.*\}",  # Raw JSON in response
    r"^\[.*\]",  # Raw array in response
]

RUDE_PATTERNS = [
    r"\bstupid\b",
    r"\bidiot\b",
    r"\bdumb\b",
    r"\bwrong\b.*\!",
    r"\bobviously\b",
    r"\bclearly you\b",
]

# Questions that should not be asked again if already answered
DUPLICATE_QUESTION_PATTERNS = {
    "budget": [
        r"what.*budget",
        r"how much.*spend",
        r"price range",
        r"what.*afford",
    ],
    "location": [
        r"which (city|location|area)",
        r"where.*looking",
        r"what (city|location|area)",
    ],
    "bedrooms": [
        r"how many.*bed",
        r"number of.*bed",
        r"bedroom.*need",
    ],
    "property_type": [
        r"what.*type.*property",
        # Match "condo or house" patterns but not "condos in Toronto"
        r"(condo|house|townhouse)\s+or\s+(condo|house|townhouse)",
        r"(condo|house|townhouse)\?",
        r"prefer.*(condo|house|townhouse)",
    ],
}


# =============================================================================
# HTTP CLIENT
# =============================================================================

class ChatbotClient:
    """HTTP client for chatbot API with retry logic."""
    
    def __init__(
        self,
        base_url: str = DEFAULT_LOCAL_SERVER,
        timeout: int = REQUEST_TIMEOUT,
        use_gpt4_endpoint: bool = True
    ):
        self.base_url = base_url.rstrip('/')
        self.timeout = timeout
        self.endpoint = CHAT_GPT4_ENDPOINT if use_gpt4_endpoint else CHAT_ENDPOINT
        self.session = requests.Session()
        
        # Set common headers
        self.session.headers.update({
            'Content-Type': 'application/json',
            'Accept': 'application/json',
        })
    
    def send_message(
        self,
        message: str,
        session_id: str,
        context: Optional[Dict[str, Any]] = None
    ) -> Dict[str, Any]:
        """
        Send a message to the chatbot and return the response.
        
        Args:
            message: User message
            session_id: Session identifier
            context: Optional additional context
            
        Returns:
            Dictionary with response data and metadata
        """
        url = f"{self.base_url}{self.endpoint}"
        
        payload = {
            "message": message,
            "session_id": session_id,
        }
        if context:
            payload["context"] = context
        
        start_time = time.time()
        last_error = None
        
        for attempt in range(RETRY_COUNT + 1):
            try:
                response = self.session.post(
                    url,
                    json=payload,
                    timeout=self.timeout,
                    headers={'X-Session-Id': session_id}
                )
                
                elapsed_ms = (time.time() - start_time) * 1000
                
                if response.status_code == 200:
                    data = response.json()
                    return {
                        "success": True,
                        "response_time_ms": elapsed_ms,
                        "http_status": response.status_code,
                        "data": data,
                        "error": None
                    }
                else:
                    return {
                        "success": False,
                        "response_time_ms": elapsed_ms,
                        "http_status": response.status_code,
                        "data": {},
                        "error": f"HTTP {response.status_code}: {response.text[:200]}"
                    }
                    
            except requests.exceptions.Timeout as e:
                last_error = f"Timeout after {self.timeout}s"
                logger.warning(f"Request timeout (attempt {attempt + 1}/{RETRY_COUNT + 1})")
                
            except requests.exceptions.ConnectionError as e:
                last_error = f"Connection error: {str(e)}"
                logger.warning(f"Connection error (attempt {attempt + 1}/{RETRY_COUNT + 1}): {e}")
                
            except requests.exceptions.RequestException as e:
                last_error = f"Request error: {str(e)}"
                logger.warning(f"Request error (attempt {attempt + 1}/{RETRY_COUNT + 1}): {e}")
            
            if attempt < RETRY_COUNT:
                time.sleep(RETRY_DELAY)
        
        elapsed_ms = (time.time() - start_time) * 1000
        return {
            "success": False,
            "response_time_ms": elapsed_ms,
            "http_status": 0,
            "data": {},
            "error": last_error
        }
    
    def health_check(self) -> bool:
        """Check if the server is healthy."""
        try:
            response = self.session.get(
                f"{self.base_url}/health",
                timeout=10
            )
            return response.status_code == 200
        except Exception:
            return False


# =============================================================================
# ASSERTION ENGINE
# =============================================================================

class AssertionEngine:
    """Engine for validating chatflow assertions."""
    
    def __init__(self):
        self.passed_assertions: List[str] = []
        self.failed_assertions: List[str] = []
        self.warnings: List[str] = []
    
    def reset(self):
        """Reset assertion state for new test."""
        self.passed_assertions = []
        self.failed_assertions = []
        self.warnings = []
    
    def assert_equals(
        self,
        actual: Any,
        expected: Any,
        description: str
    ) -> bool:
        """Assert that actual equals expected."""
        if actual == expected:
            self.passed_assertions.append(f"✓ {description}")
            return True
        else:
            self.failed_assertions.append(
                f"✗ {description}: expected '{expected}', got '{actual}'"
            )
            return False
    
    def assert_contains(
        self,
        text: str,
        substring: str,
        description: str,
        case_sensitive: bool = False
    ) -> bool:
        """Assert that text contains substring."""
        if not case_sensitive:
            text = text.lower()
            substring = substring.lower()
        
        if substring in text:
            self.passed_assertions.append(f"✓ {description}")
            return True
        else:
            self.failed_assertions.append(
                f"✗ {description}: '{substring}' not found in response"
            )
            return False
    
    def assert_not_contains(
        self,
        text: str,
        substring: str,
        description: str,
        case_sensitive: bool = False
    ) -> bool:
        """Assert that text does NOT contain substring."""
        if not case_sensitive:
            text = text.lower()
            substring = substring.lower()
        
        if substring not in text:
            self.passed_assertions.append(f"✓ {description}")
            return True
        else:
            self.failed_assertions.append(
                f"✗ {description}: forbidden string '{substring}' found in response"
            )
            return False
    
    def assert_in_range(
        self,
        value: float,
        min_val: float,
        max_val: float,
        description: str
    ) -> bool:
        """Assert that value is within range [min_val, max_val]."""
        if min_val <= value <= max_val:
            self.passed_assertions.append(f"✓ {description}")
            return True
        else:
            self.failed_assertions.append(
                f"✗ {description}: {value} not in range [{min_val}, {max_val}]"
            )
            return False
    
    def assert_not_none(
        self,
        value: Any,
        description: str
    ) -> bool:
        """Assert that value is not None."""
        if value is not None:
            self.passed_assertions.append(f"✓ {description}")
            return True
        else:
            self.failed_assertions.append(f"✗ {description}: value is None")
            return False
    
    def assert_true(
        self,
        condition: bool,
        description: str
    ) -> bool:
        """Assert that condition is True."""
        if condition:
            self.passed_assertions.append(f"✓ {description}")
            return True
        else:
            self.failed_assertions.append(f"✗ {description}")
            return False
    
    def assert_false(
        self,
        condition: bool,
        description: str
    ) -> bool:
        """Assert that condition is False."""
        if not condition:
            self.passed_assertions.append(f"✓ {description}")
            return True
        else:
            self.failed_assertions.append(f"✗ {description}")
            return False
    
    def add_warning(self, warning: str):
        """Add a non-fatal warning."""
        self.warnings.append(f"⚠ {warning}")


# =============================================================================
# UX QUALITY CHECKER
# =============================================================================

class UXQualityChecker:
    """
    Checks UX quality of chatbot responses.
    
    Validates:
    - Response length appropriateness
    - Polite, non-robotic language
    - No duplicate clarification questions
    - Clear next actions suggested
    """
    
    def __init__(self):
        self.robotic_patterns = [re.compile(p, re.IGNORECASE) for p in ROBOTIC_PATTERNS]
        self.rude_patterns = [re.compile(p, re.IGNORECASE) for p in RUDE_PATTERNS]
        self.duplicate_patterns = {
            field: [re.compile(p, re.IGNORECASE) for p in patterns]
            for field, patterns in DUPLICATE_QUESTION_PATTERNS.items()
        }
    
    def check_response_length(
        self,
        response: str,
        min_length: int = MIN_RESPONSE_LENGTH,
        max_length: int = MAX_RESPONSE_LENGTH
    ) -> Tuple[bool, str]:
        """Check if response length is within acceptable range."""
        length = len(response)
        
        if length < min_length:
            return False, f"Response too short: {length} chars (min: {min_length})"
        elif length > max_length:
            return False, f"Response too long: {length} chars (max: {max_length})"
        
        return True, f"Response length OK: {length} chars"
    
    def check_is_polite(self, response: str) -> Tuple[bool, str]:
        """Check if response is polite (no rude language)."""
        for pattern in self.rude_patterns:
            if pattern.search(response):
                return False, f"Response contains rude pattern: {pattern.pattern}"
        
        return True, "Response is polite"
    
    def check_is_natural(self, response: str) -> Tuple[bool, str]:
        """Check if response is natural (not robotic)."""
        for pattern in self.robotic_patterns:
            if pattern.search(response):
                return False, f"Response contains robotic pattern: {pattern.pattern}"
        
        return True, "Response is natural"
    
    def check_has_next_action(self, response: str) -> Tuple[bool, str]:
        """Check if response suggests a clear next action."""
        next_action_indicators = [
            "would you like",
            "let me know",
            "you can",
            "try",
            "how about",
            "shall i",
            "want me to",
            "?",  # Questions often suggest next action
        ]
        
        response_lower = response.lower()
        has_action = any(indicator in response_lower for indicator in next_action_indicators)
        
        if has_action:
            return True, "Response suggests next action"
        
        return False, "Response does not suggest a clear next action"
    
    def check_duplicate_question(
        self,
        response: str,
        already_answered_fields: List[str]
    ) -> Tuple[bool, List[str]]:
        """
        Check if response asks for information that was already provided.
        
        Args:
            response: Bot response to check
            already_answered_fields: List of fields already answered (e.g., ['budget', 'location'])
            
        Returns:
            Tuple of (has_duplicate, list of duplicate fields)
        """
        duplicates = []
        response_lower = response.lower()
        
        for field in already_answered_fields:
            if field in self.duplicate_patterns:
                for pattern in self.duplicate_patterns[field]:
                    if pattern.search(response_lower):
                        duplicates.append(field)
                        break
        
        return len(duplicates) > 0, duplicates
    
    def calculate_ux_score(
        self,
        response: str,
        response_time_ms: float,
        has_duplicate: bool,
        already_answered_fields: List[str]
    ) -> float:
        """
        Calculate overall UX quality score (0-100).
        
        Scoring breakdown:
        - Response length: 20 points
        - Politeness: 15 points
        - Naturalness: 20 points
        - Next action suggestion: 15 points
        - No duplicate questions: 20 points
        - Response time: 10 points
        """
        score = 0.0
        
        # Response length (20 points)
        length = len(response)
        if MIN_RESPONSE_LENGTH <= length <= MAX_RESPONSE_LENGTH:
            score += 20.0
        elif length < MIN_RESPONSE_LENGTH:
            score += 10.0
        else:
            # Too long, partial credit
            score += 15.0
        
        # Politeness (15 points)
        is_polite, _ = self.check_is_polite(response)
        if is_polite:
            score += 15.0
        
        # Naturalness (20 points)
        is_natural, _ = self.check_is_natural(response)
        if is_natural:
            score += 20.0
        
        # Next action (15 points)
        has_action, _ = self.check_has_next_action(response)
        if has_action:
            score += 15.0
        
        # No duplicate questions (20 points)
        if not has_duplicate:
            score += 20.0
        
        # Response time (10 points)
        if response_time_ms < RESPONSE_TIME_WARN_MS:
            score += 10.0
        elif response_time_ms < RESPONSE_TIME_CRITICAL_MS:
            score += 5.0
        
        return score


# =============================================================================
# FORBIDDEN BEHAVIOR DETECTOR
# =============================================================================

class ForbiddenBehaviorDetector:
    """Detects forbidden behaviors in chatbot responses."""
    
    def detect_ask_again(
        self,
        response: str,
        field: str,
        already_provided: bool
    ) -> bool:
        """
        Check if bot is asking for a field that was already provided.
        
        Args:
            response: Bot response text
            field: Field name (budget, location, etc.)
            already_provided: Whether this field was already provided
            
        Returns:
            True if forbidden behavior detected
        """
        if not already_provided:
            return False
        
        patterns = DUPLICATE_QUESTION_PATTERNS.get(field, [])
        response_lower = response.lower()
        
        for pattern_str in patterns:
            pattern = re.compile(pattern_str, re.IGNORECASE)
            if pattern.search(response_lower):
                return True
        
        return False
    
    def detect_reset_filters(
        self,
        previous_state: Dict[str, Any],
        current_state: Dict[str, Any],
        expected_preserved: List[str]
    ) -> List[str]:
        """
        Detect if filters were unexpectedly reset.
        
        Args:
            previous_state: State before the current turn
            current_state: State after the current turn
            expected_preserved: Fields that should be preserved
            
        Returns:
            List of fields that were unexpectedly reset
        """
        reset_fields = []
        
        for field in expected_preserved:
            prev_value = previous_state.get(field)
            curr_value = current_state.get(field)
            
            # If field was set and is now None, it was reset
            if prev_value is not None and curr_value is None:
                reset_fields.append(field)
        
        return reset_fields
    
    def detect_ignore_context(
        self,
        response: str,
        context_items: List[str]
    ) -> bool:
        """
        Detect if bot ignored important context items.
        
        Args:
            response: Bot response text
            context_items: Important context items that should be referenced
            
        Returns:
            True if context was ignored
        """
        # For now, just check if any context item is mentioned
        response_lower = response.lower()
        
        for item in context_items:
            if item.lower() in response_lower:
                return False
        
        return len(context_items) > 0
    
    def detect_mls_trigger(
        self,
        response_data: Dict[str, Any]
    ) -> bool:
        """
        Detect if MLS search was triggered.
        
        Args:
            response_data: Full response data from API
            
        Returns:
            True if MLS search was triggered (properties returned)
        """
        property_count = response_data.get("property_count", 0)
        properties = response_data.get("properties", [])
        
        return property_count > 0 or len(properties) > 0


# =============================================================================
# MAIN TEST RUNNER
# =============================================================================

class ChatFlowTestRunner:
    """
    Main test runner for chatflow testing.
    
    Handles:
    - Multi-turn conversation execution
    - State tracking between turns
    - Assertion validation
    - UX quality checks
    - Deterministic replay support
    """
    
    def __init__(
        self,
        server_url: str = DEFAULT_LOCAL_SERVER,
        use_gpt4_endpoint: bool = True,
        verbose: bool = True
    ):
        self.client = ChatbotClient(
            base_url=server_url,
            use_gpt4_endpoint=use_gpt4_endpoint
        )
        self.server_url = server_url
        self.verbose = verbose
        
        self.assertion_engine = AssertionEngine()
        self.ux_checker = UXQualityChecker()
        self.forbidden_detector = ForbiddenBehaviorDetector()
        
        # State tracking
        self.answered_fields: List[str] = []
        self.previous_state: Dict[str, Any] = {}
        
    def log(self, message: str, level: str = "info"):
        """Log message if verbose mode is enabled."""
        if self.verbose:
            timestamp = datetime.now().strftime("%H:%M:%S.%f")[:-3]
            print(f"[{timestamp}] {message}")
    
    def generate_session_id(self, test_id: str) -> str:
        """Generate unique session ID for test."""
        timestamp = int(time.time() * 1000)
        return f"chatflow_test_{test_id}_{timestamp}"
    
    def extract_state_from_response(
        self,
        response_data: Dict[str, Any]
    ) -> Dict[str, Any]:
        """
        Extract conversation state from API response.
        
        Args:
            response_data: Full response data from API
            
        Returns:
            Dictionary of state fields
        """
        state = {}
        
        # Extract filters
        filters = response_data.get("filters", response_data.get("active_filters", {}))
        if isinstance(filters, dict):
            state["location"] = filters.get("location")
            state["city"] = filters.get("city")
            state["bedrooms"] = filters.get("bedrooms")
            state["bathrooms"] = filters.get("bathrooms")
            state["property_type"] = filters.get("property_type")
            state["listing_type"] = filters.get("listing_type")
            state["min_price"] = filters.get("min_price")
            state["max_price"] = filters.get("max_price")
        
        # Extract location state if present
        location_state = response_data.get("location_state", {})
        if isinstance(location_state, dict):
            state["city"] = state.get("city") or location_state.get("city")
            state["neighborhood"] = location_state.get("neighborhood")
            state["postal_code"] = location_state.get("postal_code")
        
        # Extract metadata
        metadata = response_data.get("metadata", {})
        if isinstance(metadata, dict):
            state["intent"] = metadata.get("intent")
            state["confidence"] = metadata.get("confidence")
        
        return state
    
    def track_answered_fields(self, user_message: str):
        """Track which fields the user has answered based on their message."""
        message_lower = user_message.lower()
        
        # Budget indicators
        if any(x in message_lower for x in ['$', 'k', 'budget', 'under', 'max', 'afford']):
            if 'budget' not in self.answered_fields:
                self.answered_fields.append('budget')
        
        # Location indicators
        cities = ['toronto', 'mississauga', 'vancouver', 'ottawa', 'calgary', 
                  'edmonton', 'montreal', 'brampton', 'markham', 'richmond hill']
        if any(city in message_lower for city in cities) or re.search(r'[A-Z]\d[A-Z]', user_message):
            if 'location' not in self.answered_fields:
                self.answered_fields.append('location')
        
        # Bedroom indicators
        if re.search(r'\d+\s*(bed|br|bedroom)', message_lower):
            if 'bedrooms' not in self.answered_fields:
                self.answered_fields.append('bedrooms')
        
        # Property type indicators
        if any(pt in message_lower for pt in ['condo', 'house', 'townhouse', 'detached', 'apartment']):
            if 'property_type' not in self.answered_fields:
                self.answered_fields.append('property_type')
    
    def run_single_test(
        self,
        test_case: ChatFlowTestCase
    ) -> TestCaseResult:
        """
        Execute a single chatflow test case.
        
        Args:
            test_case: The test case to execute
            
        Returns:
            TestCaseResult with all details
        """
        self.log(f"\n{'='*70}")
        self.log(f"🧪 TEST: {test_case.test_id}")
        self.log(f"   {test_case.description}")
        self.log(f"   Category: {test_case.category.value}")
        self.log(f"{'='*70}")
        
        # Reset state
        self.assertion_engine.reset()
        self.answered_fields = []
        self.previous_state = {}
        
        session_id = self.generate_session_id(test_case.test_id)
        started_at = datetime.now()
        turn_results: List[TurnResult] = []
        
        try:
            # Execute each turn in the conversation
            for turn_num, turn in enumerate(test_case.conversation):
                if turn.role != 'user':
                    continue  # Skip assistant turns in input
                
                self.log(f"\n📤 Turn {turn_num + 1}: \"{turn.message}\"")
                
                # Track answered fields
                self.track_answered_fields(turn.message)
                
                # Send message
                result = self.client.send_message(
                    message=turn.message,
                    session_id=session_id
                )
                
                if not result["success"]:
                    self.log(f"❌ Request failed: {result['error']}")
                    return self._create_error_result(
                        test_case, session_id, started_at,
                        f"Request failed at turn {turn_num + 1}: {result['error']}"
                    )
                
                response_data = result["data"]
                response_text = response_data.get("response", response_data.get("agent_response", ""))
                
                self.log(f"📥 Response: {response_text[:150]}...")
                self.log(f"   Time: {result['response_time_ms']:.0f}ms")
                
                # Extract state
                current_state = self.extract_state_from_response(response_data)
                
                # Run turn-level assertions
                turn_result = self._validate_turn(
                    turn_num=turn_num,
                    turn=turn,
                    response_text=response_text,
                    response_data=response_data,
                    result=result,
                    current_state=current_state,
                    test_case=test_case
                )
                
                turn_results.append(turn_result)
                
                # Update previous state for next turn
                self.previous_state = current_state.copy()
                
                # Delay between turns
                if turn_num < len(test_case.conversation) - 1:
                    time.sleep(DELAY_BETWEEN_TURNS)
            
            # Run overall test assertions
            self._validate_overall(test_case, turn_results)
            
            # Calculate scores
            completed_at = datetime.now()
            total_duration_ms = (completed_at - started_at).total_seconds() * 1000
            
            all_passed = len(self.assertion_engine.failed_assertions) == 0
            status = TestStatus.PASSED if all_passed else TestStatus.FAILED
            
            # Calculate aggregate scores
            context_score = self._calculate_context_retention_score(turn_results, test_case)
            followup_score = self._calculate_followup_score(turn_results, test_case)
            nlp_score = self._calculate_nlp_accuracy_score(turn_results, test_case)
            ux_score = self._calculate_aggregate_ux_score(turn_results)
            
            self.log(f"\n{'='*50}")
            self.log(f"📊 RESULT: {status.value.upper()}")
            self.log(f"   Passed: {len(self.assertion_engine.passed_assertions)}")
            self.log(f"   Failed: {len(self.assertion_engine.failed_assertions)}")
            self.log(f"   Context Score: {context_score:.1f}/100")
            self.log(f"   Follow-up Score: {followup_score:.1f}/100")
            self.log(f"   NLP Score: {nlp_score:.1f}/100")
            self.log(f"   UX Score: {ux_score:.1f}/100")
            
            return TestCaseResult(
                test_id=test_case.test_id,
                description=test_case.description,
                category=test_case.category,
                status=status,
                session_id=session_id,
                started_at=started_at,
                completed_at=completed_at,
                total_duration_ms=total_duration_ms,
                turn_results=turn_results,
                all_assertions_passed=all_passed,
                passed_assertions=self.assertion_engine.passed_assertions,
                failed_assertions=self.assertion_engine.failed_assertions,
                forbidden_behavior_violations=[],
                context_retention_score=context_score,
                followup_correctness_score=followup_score,
                nlp_extraction_accuracy=nlp_score,
                ux_quality_score=ux_score
            )
            
        except Exception as e:
            self.log(f"❌ Test error: {str(e)}")
            return self._create_error_result(
                test_case, session_id, started_at,
                str(e), traceback.format_exc()
            )
    
    def _validate_turn(
        self,
        turn_num: int,
        turn: ConversationTurn,
        response_text: str,
        response_data: Dict[str, Any],
        result: Dict[str, Any],
        current_state: Dict[str, Any],
        test_case: ChatFlowTestCase
    ) -> TurnResult:
        """Validate a single conversation turn."""
        
        passed = []
        failed = []
        
        # Check expected intent
        if turn.expected_intent:
            actual_intent = current_state.get("intent", "")
            expected = turn.expected_intent.value
            
            if actual_intent == expected:
                passed.append(f"Intent matches: {expected}")
            else:
                failed.append(f"Intent mismatch: expected '{expected}', got '{actual_intent}'")
        
        # Check response contains
        if turn.response_should_contain:
            for substring in turn.response_should_contain:
                if substring.lower() in response_text.lower():
                    passed.append(f"Contains: '{substring}'")
                else:
                    failed.append(f"Missing: '{substring}'")
        
        # Check response should not contain
        if turn.response_should_not_contain:
            for substring in turn.response_should_not_contain:
                if substring.lower() not in response_text.lower():
                    passed.append(f"Does not contain: '{substring}'")
                else:
                    failed.append(f"Forbidden string found: '{substring}'")
        
        # Check property count
        property_count = response_data.get("property_count", 0)
        
        if turn.should_have_properties is not None:
            has_props = property_count > 0
            if turn.should_have_properties == has_props:
                passed.append(f"Properties presence: {has_props}")
            else:
                failed.append(
                    f"Properties presence: expected {turn.should_have_properties}, got {has_props}"
                )
        
        if turn.property_count_range:
            min_c, max_c = turn.property_count_range
            if min_c <= property_count <= max_c:
                passed.append(f"Property count in range: {property_count}")
            else:
                failed.append(
                    f"Property count out of range: {property_count} not in [{min_c}, {max_c}]"
                )
        
        # Check for forbidden behaviors - especially for non-property tests
        if test_case.is_non_property_test or test_case.should_not_trigger_search:
            if self.forbidden_detector.detect_mls_trigger(response_data):
                failed.append("MLS search was triggered for non-property test")
            else:
                passed.append("MLS search correctly not triggered")
        
        # Check duplicate questions
        has_dup, dup_fields = self.ux_checker.check_duplicate_question(
            response_text, self.answered_fields
        )
        if has_dup:
            failed.append(f"Duplicate question for: {', '.join(dup_fields)}")
        
        # UX quality checks
        is_polite, _ = self.ux_checker.check_is_polite(response_text)
        is_natural, _ = self.ux_checker.check_is_natural(response_text)
        has_action, _ = self.ux_checker.check_has_next_action(response_text)
        
        return TurnResult(
            turn_number=turn_num,
            user_message=turn.message,
            bot_response=response_text,
            response_time_ms=result["response_time_ms"],
            intent_detected=current_state.get("intent"),
            confidence=current_state.get("confidence"),
            entities_extracted=current_state,
            property_count=property_count,
            properties=response_data.get("properties", [])[:5],  # Limit to 5
            state_snapshot=current_state,
            passed_assertions=passed,
            failed_assertions=failed,
            response_length=len(response_text),
            is_polite=is_polite,
            is_natural=is_natural,
            has_next_action=has_action,
            has_duplicate_question=has_dup
        )
    
    def _validate_overall(
        self,
        test_case: ChatFlowTestCase,
        turn_results: List[TurnResult]
    ):
        """Validate overall test assertions after all turns complete."""
        
        # Check final intent
        if test_case.expected_intent and turn_results:
            last_turn = turn_results[-1]
            actual = last_turn.intent_detected
            expected = test_case.expected_intent.value
            
            self.assertion_engine.assert_equals(
                actual, expected,
                f"Final intent: expected '{expected}'"
            )
        
        # Check forbidden behaviors
        if test_case.forbidden_behaviors:
            for behavior in test_case.forbidden_behaviors:
                self._check_forbidden_behavior(behavior, turn_results)
        
        # Check non-property test requirements
        if test_case.should_not_trigger_search:
            total_properties = sum(tr.property_count for tr in turn_results)
            self.assertion_engine.assert_equals(
                total_properties, 0,
                "No properties should be returned for non-property test"
            )
    
    def _check_forbidden_behavior(
        self,
        behavior: ForbiddenBehavior,
        turn_results: List[TurnResult]
    ):
        """Check if a specific forbidden behavior occurred."""
        
        if behavior == ForbiddenBehavior.TRIGGER_MLS_SEARCH:
            for tr in turn_results:
                if tr.property_count > 0:
                    self.assertion_engine.failed_assertions.append(
                        f"✗ Forbidden: MLS search triggered at turn {tr.turn_number + 1}"
                    )
                    return
            self.assertion_engine.passed_assertions.append(
                "✓ MLS search not triggered (as expected)"
            )
        
        elif behavior == ForbiddenBehavior.PROVIDE_PROPERTY_DATA:
            for tr in turn_results:
                if tr.properties:
                    self.assertion_engine.failed_assertions.append(
                        f"✗ Forbidden: Property data provided at turn {tr.turn_number + 1}"
                    )
                    return
            self.assertion_engine.passed_assertions.append(
                "✓ No property data provided (as expected)"
            )
        
        elif behavior == ForbiddenBehavior.DUPLICATE_QUESTION:
            for tr in turn_results:
                if tr.has_duplicate_question:
                    self.assertion_engine.failed_assertions.append(
                        f"✗ Forbidden: Duplicate question at turn {tr.turn_number + 1}"
                    )
                    return
            self.assertion_engine.passed_assertions.append(
                "✓ No duplicate questions asked"
            )
    
    def _calculate_context_retention_score(
        self,
        turn_results: List[TurnResult],
        test_case: ChatFlowTestCase
    ) -> float:
        """Calculate context retention score (0-100)."""
        if len(turn_results) < 2:
            return 100.0  # Single turn, full score
        
        total_checks = 0
        passed_checks = 0
        
        for i in range(1, len(turn_results)):
            prev_state = turn_results[i-1].state_snapshot or {}
            curr_state = turn_results[i].state_snapshot or {}
            
            # Check important fields are preserved
            for field in ['location', 'city', 'bedrooms', 'property_type']:
                if prev_state.get(field):
                    total_checks += 1
                    if curr_state.get(field) == prev_state.get(field):
                        passed_checks += 1
        
        if total_checks == 0:
            return 100.0
        
        return (passed_checks / total_checks) * 100
    
    def _calculate_followup_score(
        self,
        turn_results: List[TurnResult],
        test_case: ChatFlowTestCase
    ) -> float:
        """Calculate follow-up correctness score (0-100)."""
        if not turn_results:
            return 100.0
        
        total = 0
        passed = 0
        
        for tr in turn_results:
            total += len(tr.passed_assertions) + len(tr.failed_assertions)
            passed += len(tr.passed_assertions)
        
        if total == 0:
            return 100.0
        
        return (passed / total) * 100
    
    def _calculate_nlp_accuracy_score(
        self,
        turn_results: List[TurnResult],
        test_case: ChatFlowTestCase
    ) -> float:
        """Calculate NLP extraction accuracy score (0-100)."""
        total_checks = 0
        passed_checks = 0
        
        for i, turn in enumerate(test_case.conversation):
            if i >= len(turn_results):
                break
            
            tr = turn_results[i]
            
            # Check intent accuracy
            if turn.expected_intent:
                total_checks += 1
                if tr.intent_detected == turn.expected_intent.value:
                    passed_checks += 1
            
            # Check entity accuracy
            if turn.expected_entities:
                for field, expected_value in turn.expected_entities.items():
                    total_checks += 1
                    actual_value = (tr.entities_extracted or {}).get(field)
                    if actual_value == expected_value:
                        passed_checks += 1
        
        if total_checks == 0:
            return 100.0
        
        return (passed_checks / total_checks) * 100
    
    def _calculate_aggregate_ux_score(
        self,
        turn_results: List[TurnResult]
    ) -> float:
        """Calculate aggregate UX quality score (0-100)."""
        if not turn_results:
            return 100.0
        
        scores = []
        for tr in turn_results:
            score = self.ux_checker.calculate_ux_score(
                response=tr.bot_response,
                response_time_ms=tr.response_time_ms,
                has_duplicate=tr.has_duplicate_question,
                already_answered_fields=self.answered_fields
            )
            scores.append(score)
        
        return sum(scores) / len(scores)
    
    def _create_error_result(
        self,
        test_case: ChatFlowTestCase,
        session_id: str,
        started_at: datetime,
        error_message: str,
        error_traceback: Optional[str] = None
    ) -> TestCaseResult:
        """Create a test result for an error case."""
        completed_at = datetime.now()
        return TestCaseResult(
            test_id=test_case.test_id,
            description=test_case.description,
            category=test_case.category,
            status=TestStatus.ERROR,
            session_id=session_id,
            started_at=started_at,
            completed_at=completed_at,
            total_duration_ms=(completed_at - started_at).total_seconds() * 1000,
            turn_results=[],
            all_assertions_passed=False,
            passed_assertions=[],
            failed_assertions=[f"ERROR: {error_message}"],
            error_message=error_message,
            error_traceback=error_traceback
        )
    
    def run_test_suite(
        self,
        test_cases: List[ChatFlowTestCase],
        suite_name: str = "ChatFlow Test Suite"
    ) -> TestSuiteResult:
        """
        Run a complete test suite.
        
        Args:
            test_cases: List of test cases to execute
            suite_name: Name of the test suite
            
        Returns:
            TestSuiteResult with all details
        """
        self.log(f"\n{'='*80}")
        self.log(f"🚀 STARTING TEST SUITE: {suite_name}")
        self.log(f"   Total tests: {len(test_cases)}")
        self.log(f"   Server: {self.server_url}")
        self.log(f"{'='*80}\n")
        
        started_at = datetime.now()
        test_results: List[TestCaseResult] = []
        
        # Check server health
        if not self.client.health_check():
            self.log("⚠️  Warning: Server health check failed")
        
        # Run each test
        for i, test_case in enumerate(test_cases):
            self.log(f"\n[{i+1}/{len(test_cases)}] Running: {test_case.test_id}")
            
            result = self.run_single_test(test_case)
            test_results.append(result)
            
            # Delay between tests
            if i < len(test_cases) - 1:
                time.sleep(DELAY_BETWEEN_TESTS)
        
        completed_at = datetime.now()
        total_duration = (completed_at - started_at).total_seconds()
        
        # Calculate summary
        passed = sum(1 for r in test_results if r.status == TestStatus.PASSED)
        failed = sum(1 for r in test_results if r.status == TestStatus.FAILED)
        errors = sum(1 for r in test_results if r.status == TestStatus.ERROR)
        skipped = sum(1 for r in test_results if r.status == TestStatus.SKIPPED)
        
        pass_rate = (passed / len(test_results) * 100) if test_results else 0
        
        # Category breakdown
        category_results = {}
        for r in test_results:
            cat = r.category.value
            if cat not in category_results:
                category_results[cat] = {"passed": 0, "failed": 0, "errors": 0}
            
            if r.status == TestStatus.PASSED:
                category_results[cat]["passed"] += 1
            elif r.status == TestStatus.FAILED:
                category_results[cat]["failed"] += 1
            else:
                category_results[cat]["errors"] += 1
        
        # Latency metrics
        response_times = []
        for r in test_results:
            for tr in r.turn_results:
                response_times.append(tr.response_time_ms)
        
        avg_time = sum(response_times) / len(response_times) if response_times else 0
        min_time = min(response_times) if response_times else 0
        max_time = max(response_times) if response_times else 0
        
        # P95 calculation
        if response_times:
            sorted_times = sorted(response_times)
            p95_idx = int(len(sorted_times) * 0.95)
            p95_time = sorted_times[min(p95_idx, len(sorted_times) - 1)]
        else:
            p95_time = 0
        
        # Aggregate scores
        avg_context = sum(r.context_retention_score for r in test_results) / len(test_results) if test_results else 0
        avg_followup = sum(r.followup_correctness_score for r in test_results) / len(test_results) if test_results else 0
        avg_nlp = sum(r.nlp_extraction_accuracy for r in test_results) / len(test_results) if test_results else 0
        avg_ux = sum(r.ux_quality_score for r in test_results) / len(test_results) if test_results else 0
        
        # Failures summary
        failures = []
        for r in test_results:
            if r.status in (TestStatus.FAILED, TestStatus.ERROR):
                failures.append({
                    "test_id": r.test_id,
                    "category": r.category.value,
                    "status": r.status.value,
                    "failed_assertions": r.failed_assertions[:5],
                    "error_message": r.error_message
                })
        
        self.log(f"\n{'='*80}")
        self.log(f"📊 TEST SUITE COMPLETE")
        self.log(f"   Total: {len(test_results)} | Passed: {passed} | Failed: {failed} | Errors: {errors}")
        self.log(f"   Pass Rate: {pass_rate:.1f}%")
        self.log(f"   Duration: {total_duration:.1f}s")
        self.log(f"{'='*80}\n")
        
        return TestSuiteResult(
            suite_name=suite_name,
            server_url=self.server_url,
            started_at=started_at,
            completed_at=completed_at,
            total_duration_seconds=total_duration,
            total_tests=len(test_results),
            passed=passed,
            failed=failed,
            errors=errors,
            skipped=skipped,
            pass_rate=pass_rate,
            category_results=category_results,
            avg_context_retention_score=avg_context,
            avg_followup_correctness_score=avg_followup,
            avg_nlp_extraction_accuracy=avg_nlp,
            avg_ux_quality_score=avg_ux,
            avg_response_time_ms=avg_time,
            min_response_time_ms=min_time,
            max_response_time_ms=max_time,
            p95_response_time_ms=p95_time,
            test_results=test_results,
            failures=failures,
            environment={
                "server_url": self.server_url,
                "python_version": sys.version,
                "timestamp": datetime.now().isoformat()
            }
        )
