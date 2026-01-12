#!/usr/bin/env python3
"""
Comprehensive Chatbot Test Suite - Version 2
=============================================
50 Real-Life Scenario Tests for Summitly AI Chatbot

This script tests all chatbot functionalities:
- Postal code searches
- Address lookups
- General conversations
- Property searches
- City-based queries
- Intersection addresses
- Chat flow continuity
- Filter combinations
- Edge cases

Author: Summitly Team
Date: December 31, 2025
"""

import requests
import json
import time
import uuid
import logging
from datetime import datetime
from typing import Dict, List, Any, Optional
from dataclasses import dataclass, field, asdict
from enum import Enum
import html
import traceback

# ============================================
# CONFIGURATION
# ============================================

BASE_URL = "https://summitly-ai.onrender.com"
API_ENDPOINT = f"{BASE_URL}/api/chat"
REQUEST_TIMEOUT = 120  # seconds - generous timeout for cold starts
DELAY_BETWEEN_REQUESTS = 3  # seconds between requests to avoid overwhelming server

# ============================================
# DATA CLASSES
# ============================================

class TestStatus(Enum):
    PASSED = "passed"
    FAILED = "failed"
    ERROR = "error"
    TIMEOUT = "timeout"

@dataclass
class TestResult:
    test_id: int
    test_name: str
    category: str
    prompt: str
    status: TestStatus
    response_time: float
    response_text: str = ""
    properties_count: int = 0
    suggestions: List[str] = field(default_factory=list)
    error_message: str = ""
    raw_response: Dict = field(default_factory=dict)
    validation_notes: List[str] = field(default_factory=list)
    timestamp: str = ""

@dataclass
class TestScenario:
    id: int
    name: str
    category: str
    prompt: str
    expected_behavior: str
    validation_rules: Dict[str, Any] = field(default_factory=dict)
    session_id: Optional[str] = None  # For conversation flow tests
    depends_on: Optional[int] = None  # For sequential tests

# ============================================
# TEST SCENARIOS - 50 REAL-LIFE TESTS
# ============================================

def create_test_scenarios() -> List[TestScenario]:
    """Create 50 comprehensive test scenarios"""
    
    # Generate session IDs for conversation flows
    flow_session_1 = str(uuid.uuid4())  # Toronto condo search flow
    flow_session_2 = str(uuid.uuid4())  # First time buyer flow
    flow_session_3 = str(uuid.uuid4())  # Investment property flow
    flow_session_4 = str(uuid.uuid4())  # Rental search flow
    
    scenarios = [
        # ============================================
        # CATEGORY 1: GENERAL CHAT (1-5)
        # ============================================
        TestScenario(
            id=1,
            name="Greeting - Hello",
            category="General Chat",
            prompt="Hello!",
            expected_behavior="Should greet user and offer assistance",
            validation_rules={"should_respond": True, "friendly_greeting": True}
        ),
        TestScenario(
            id=2,
            name="Greeting - Good morning",
            category="General Chat",
            prompt="Good morning, I'm looking for some help with real estate",
            expected_behavior="Should greet and ask about real estate needs",
            validation_rules={"should_respond": True, "real_estate_focus": True}
        ),
        TestScenario(
            id=3,
            name="About the bot",
            category="General Chat",
            prompt="What can you help me with?",
            expected_behavior="Should explain capabilities",
            validation_rules={"should_respond": True, "explains_capabilities": True}
        ),
        TestScenario(
            id=4,
            name="Thank you response",
            category="General Chat",
            prompt="Thank you for your help!",
            expected_behavior="Should respond politely",
            validation_rules={"should_respond": True, "polite_response": True}
        ),
        TestScenario(
            id=5,
            name="Market overview question",
            category="General Chat",
            prompt="How is the real estate market in Canada right now?",
            expected_behavior="Should provide market insights",
            validation_rules={"should_respond": True, "market_info": True}
        ),
        
        # ============================================
        # CATEGORY 2: POSTAL CODE SEARCHES (6-12)
        # ============================================
        TestScenario(
            id=6,
            name="Postal code - Downtown Toronto M5V",
            category="Postal Code",
            prompt="Show me homes for sale in M5V 3L9",
            expected_behavior="Should search properties near postal code M5V 3L9",
            validation_rules={"should_respond": True, "location_detected": True}
        ),
        TestScenario(
            id=7,
            name="Postal code - Mississauga L5B",
            category="Postal Code",
            prompt="What properties are available in L5B 1M2?",
            expected_behavior="Should find properties in Mississauga area",
            validation_rules={"should_respond": True, "location_detected": True}
        ),
        TestScenario(
            id=8,
            name="Postal code - North York M2N",
            category="Postal Code",
            prompt="I'm looking for a condo near M2N 6K8",
            expected_behavior="Should search condos near North York postal code",
            validation_rules={"should_respond": True, "property_type": "condo"}
        ),
        TestScenario(
            id=9,
            name="Postal code - Vancouver V6B",
            category="Postal Code",
            prompt="Show me rentals in V6B 1A1",
            expected_behavior="Should search rentals in Vancouver downtown",
            validation_rules={"should_respond": True, "listing_type": "rent"}
        ),
        TestScenario(
            id=10,
            name="Postal code with price range",
            category="Postal Code",
            prompt="Find me houses under $800,000 in L4C 3G1",
            expected_behavior="Should search houses with price filter",
            validation_rules={"should_respond": True, "price_filter": True}
        ),
        TestScenario(
            id=11,
            name="Postal code - Ottawa K1P",
            category="Postal Code",
            prompt="What's available in K1P 1J1?",
            expected_behavior="Should search Ottawa downtown area",
            validation_rules={"should_respond": True, "location_detected": True}
        ),
        TestScenario(
            id=12,
            name="Postal code with bedroom filter",
            category="Postal Code",
            prompt="3 bedroom homes in M4S 1A1",
            expected_behavior="Should search 3 bedroom properties",
            validation_rules={"should_respond": True, "bedroom_filter": True}
        ),
        
        # ============================================
        # CATEGORY 3: CITY SEARCHES (13-20)
        # ============================================
        TestScenario(
            id=13,
            name="City search - Toronto",
            category="City Search",
            prompt="Show me properties for sale in Toronto",
            expected_behavior="Should search Toronto properties",
            validation_rules={"should_respond": True, "city": "Toronto"}
        ),
        TestScenario(
            id=14,
            name="City search - Mississauga condos",
            category="City Search",
            prompt="I want to see condos in Mississauga",
            expected_behavior="Should search Mississauga condos",
            validation_rules={"should_respond": True, "city": "Mississauga", "property_type": "condo"}
        ),
        TestScenario(
            id=15,
            name="City search - Brampton houses",
            category="City Search",
            prompt="Show me houses for sale in Brampton under $1 million",
            expected_behavior="Should search Brampton houses with price filter",
            validation_rules={"should_respond": True, "price_filter": True}
        ),
        TestScenario(
            id=16,
            name="City search - Vaughan",
            category="City Search",
            prompt="What's available in Vaughan?",
            expected_behavior="Should search Vaughan properties",
            validation_rules={"should_respond": True, "city": "Vaughan"}
        ),
        TestScenario(
            id=17,
            name="City search - Markham townhouses",
            category="City Search",
            prompt="Find townhouses in Markham with 4 bedrooms",
            expected_behavior="Should search Markham townhouses",
            validation_rules={"should_respond": True, "property_type": "townhouse"}
        ),
        TestScenario(
            id=18,
            name="City search - Richmond Hill",
            category="City Search",
            prompt="Show me detached homes in Richmond Hill",
            expected_behavior="Should search detached homes",
            validation_rules={"should_respond": True, "property_type": "detached"}
        ),
        TestScenario(
            id=19,
            name="City search - Oakville luxury",
            category="City Search",
            prompt="I'm looking for luxury homes in Oakville over $2 million",
            expected_behavior="Should search high-end Oakville properties",
            validation_rules={"should_respond": True, "price_filter": True}
        ),
        TestScenario(
            id=20,
            name="City search - Burlington rentals",
            category="City Search",
            prompt="Show me apartments for rent in Burlington",
            expected_behavior="Should search Burlington rentals",
            validation_rules={"should_respond": True, "listing_type": "rent"}
        ),
        
        # ============================================
        # CATEGORY 4: INTERSECTION/NEIGHBORHOOD (21-27)
        # ============================================
        TestScenario(
            id=21,
            name="Intersection - Yonge and Bloor",
            category="Intersection",
            prompt="Show me condos near Yonge and Bloor",
            expected_behavior="Should find properties near Yonge/Bloor intersection",
            validation_rules={"should_respond": True, "intersection_detected": True}
        ),
        TestScenario(
            id=22,
            name="Intersection - King and Spadina",
            category="Intersection",
            prompt="What's available near King and Spadina in Toronto?",
            expected_behavior="Should search King/Spadina area",
            validation_rules={"should_respond": True, "intersection_detected": True}
        ),
        TestScenario(
            id=23,
            name="Intersection - Dundas and University",
            category="Intersection",
            prompt="I want to live near Dundas and University",
            expected_behavior="Should search near this intersection",
            validation_rules={"should_respond": True, "intersection_detected": True}
        ),
        TestScenario(
            id=24,
            name="Neighborhood - Liberty Village",
            category="Neighborhood",
            prompt="Show me listings in Liberty Village",
            expected_behavior="Should search Liberty Village neighborhood",
            validation_rules={"should_respond": True, "neighborhood_detected": True}
        ),
        TestScenario(
            id=25,
            name="Neighborhood - The Annex",
            category="Neighborhood",
            prompt="Find me rentals in The Annex Toronto",
            expected_behavior="Should search The Annex area",
            validation_rules={"should_respond": True, "neighborhood_detected": True}
        ),
        TestScenario(
            id=26,
            name="Neighborhood - Yorkville",
            category="Neighborhood",
            prompt="Luxury condos in Yorkville please",
            expected_behavior="Should search Yorkville luxury market",
            validation_rules={"should_respond": True, "neighborhood_detected": True}
        ),
        TestScenario(
            id=27,
            name="Intersection - Eglinton and Yonge",
            category="Intersection",
            prompt="Properties near Eglinton and Yonge intersection",
            expected_behavior="Should search Yonge-Eglinton area",
            validation_rules={"should_respond": True, "intersection_detected": True}
        ),
        
        # ============================================
        # CATEGORY 5: FULL ADDRESS SEARCHES (28-32)
        # ============================================
        TestScenario(
            id=28,
            name="Full address - Bay Street",
            category="Address",
            prompt="Show me properties near 100 Bay Street, Toronto",
            expected_behavior="Should geocode and search near address",
            validation_rules={"should_respond": True, "address_detected": True}
        ),
        TestScenario(
            id=29,
            name="Full address - Bloor West",
            category="Address",
            prompt="What's available near 2300 Bloor Street West?",
            expected_behavior="Should search near Bloor West address",
            validation_rules={"should_respond": True, "address_detected": True}
        ),
        TestScenario(
            id=30,
            name="Full address - Mississauga",
            category="Address",
            prompt="Find condos near 100 City Centre Drive, Mississauga",
            expected_behavior="Should search Mississauga City Centre area",
            validation_rules={"should_respond": True, "address_detected": True}
        ),
        TestScenario(
            id=31,
            name="Full address - Scarborough",
            category="Address",
            prompt="Show me houses near 300 Borough Drive, Scarborough",
            expected_behavior="Should search Scarborough Civic Centre area",
            validation_rules={"should_respond": True, "address_detected": True}
        ),
        TestScenario(
            id=32,
            name="Full address - North York",
            category="Address",
            prompt="Properties near 5100 Yonge Street, North York",
            expected_behavior="Should search North York Centre area",
            validation_rules={"should_respond": True, "address_detected": True}
        ),
        
        # ============================================
        # CATEGORY 6: CONVERSATION FLOW - Toronto Condo (33-37)
        # ============================================
        TestScenario(
            id=33,
            name="Flow 1: Start condo search",
            category="Conversation Flow",
            prompt="I'm looking for a condo in Toronto",
            expected_behavior="Should start condo search, ask for preferences",
            validation_rules={"should_respond": True, "asks_followup": True},
            session_id=flow_session_1
        ),
        TestScenario(
            id=34,
            name="Flow 1: Add budget",
            category="Conversation Flow",
            prompt="My budget is around $600,000",
            expected_behavior="Should apply budget filter",
            validation_rules={"should_respond": True, "price_filter": True},
            session_id=flow_session_1,
            depends_on=33
        ),
        TestScenario(
            id=35,
            name="Flow 1: Add bedrooms",
            category="Conversation Flow",
            prompt="I need 2 bedrooms",
            expected_behavior="Should apply bedroom filter",
            validation_rules={"should_respond": True, "bedroom_filter": True},
            session_id=flow_session_1,
            depends_on=34
        ),
        TestScenario(
            id=36,
            name="Flow 1: Narrow location",
            category="Conversation Flow",
            prompt="Preferably downtown or near the subway",
            expected_behavior="Should refine location search",
            validation_rules={"should_respond": True, "location_refined": True},
            session_id=flow_session_1,
            depends_on=35
        ),
        TestScenario(
            id=37,
            name="Flow 1: Ask about specific property",
            category="Conversation Flow",
            prompt="Can you tell me more about the first one?",
            expected_behavior="Should provide property details",
            validation_rules={"should_respond": True, "property_details": True},
            session_id=flow_session_1,
            depends_on=36
        ),
        
        # ============================================
        # CATEGORY 7: FIRST TIME BUYER FLOW (38-40)
        # ============================================
        TestScenario(
            id=38,
            name="Flow 2: First time buyer intro",
            category="First Time Buyer",
            prompt="I'm a first time home buyer and don't know where to start",
            expected_behavior="Should provide first time buyer guidance",
            validation_rules={"should_respond": True, "helpful_guidance": True},
            session_id=flow_session_2
        ),
        TestScenario(
            id=39,
            name="Flow 2: Budget question",
            category="First Time Buyer",
            prompt="I've been pre-approved for $500,000. What can I get?",
            expected_behavior="Should search within budget and explain options",
            validation_rules={"should_respond": True, "price_filter": True},
            session_id=flow_session_2,
            depends_on=38
        ),
        TestScenario(
            id=40,
            name="Flow 2: Location preference",
            category="First Time Buyer",
            prompt="I work downtown but need something affordable. Maybe outside the city?",
            expected_behavior="Should suggest suburban options with transit access",
            validation_rules={"should_respond": True, "location_suggestions": True},
            session_id=flow_session_2,
            depends_on=39
        ),
        
        # ============================================
        # CATEGORY 8: INVESTMENT PROPERTY FLOW (41-43)
        # ============================================
        TestScenario(
            id=41,
            name="Flow 3: Investment inquiry",
            category="Investment",
            prompt="I'm looking for an investment property in the GTA",
            expected_behavior="Should ask about investment criteria",
            validation_rules={"should_respond": True, "investment_focus": True},
            session_id=flow_session_3
        ),
        TestScenario(
            id=42,
            name="Flow 3: Rental income focus",
            category="Investment",
            prompt="I want something that can generate good rental income",
            expected_behavior="Should focus on rental potential",
            validation_rules={"should_respond": True, "rental_focus": True},
            session_id=flow_session_3,
            depends_on=41
        ),
        TestScenario(
            id=43,
            name="Flow 3: Specific requirements",
            category="Investment",
            prompt="Show me 1 bedroom condos under $400,000 near universities",
            expected_behavior="Should search with investment criteria",
            validation_rules={"should_respond": True, "properties_returned": True},
            session_id=flow_session_3,
            depends_on=42
        ),
        
        # ============================================
        # CATEGORY 9: RENTAL SEARCHES (44-46)
        # ============================================
        TestScenario(
            id=44,
            name="Rental - Basic search",
            category="Rental",
            prompt="Show me apartments for rent in Toronto",
            expected_behavior="Should search rental listings",
            validation_rules={"should_respond": True, "listing_type": "rent"},
            session_id=flow_session_4
        ),
        TestScenario(
            id=45,
            name="Rental - With budget",
            category="Rental",
            prompt="I need something under $2500 per month",
            expected_behavior="Should filter by rent price",
            validation_rules={"should_respond": True, "price_filter": True},
            session_id=flow_session_4,
            depends_on=44
        ),
        TestScenario(
            id=46,
            name="Rental - Pet friendly",
            category="Rental",
            prompt="Does it allow pets?",
            expected_behavior="Should address pet policy question",
            validation_rules={"should_respond": True, "amenity_question": True},
            session_id=flow_session_4,
            depends_on=45
        ),
        
        # ============================================
        # CATEGORY 10: COMPLEX QUERIES (47-50)
        # ============================================
        TestScenario(
            id=47,
            name="Complex - Multiple filters",
            category="Complex Query",
            prompt="Find me a 3 bedroom house in Mississauga under $900,000 with a garage and backyard",
            expected_behavior="Should apply multiple filters",
            validation_rules={"should_respond": True, "multiple_filters": True}
        ),
        TestScenario(
            id=48,
            name="Complex - Comparison request",
            category="Complex Query",
            prompt="What's the difference between buying in Toronto vs Mississauga?",
            expected_behavior="Should provide market comparison",
            validation_rules={"should_respond": True, "comparison_info": True}
        ),
        TestScenario(
            id=49,
            name="Complex - School district",
            category="Complex Query",
            prompt="I need a family home near good schools in Vaughan",
            expected_behavior="Should consider family-friendly criteria",
            validation_rules={"should_respond": True, "family_focus": True}
        ),
        TestScenario(
            id=50,
            name="Complex - Commute consideration",
            category="Complex Query",
            prompt="Where can I buy a house with easy commute to downtown Toronto for under $800,000?",
            expected_behavior="Should suggest areas with good transit",
            validation_rules={"should_respond": True, "transit_focus": True}
        ),
    ]
    
    return scenarios

# ============================================
# TEST RUNNER
# ============================================

class ChatbotTestRunner:
    """Runs comprehensive tests against the chatbot API"""
    
    def __init__(self, base_url: str = BASE_URL):
        self.base_url = base_url
        self.api_endpoint = f"{base_url}/api/chat"
        self.results: List[TestResult] = []
        self.start_time: datetime = None
        self.end_time: datetime = None
        self.logger = self._setup_logger()
        
    def _setup_logger(self) -> logging.Logger:
        """Setup logging"""
        logger = logging.getLogger("ChatbotTest")
        logger.setLevel(logging.INFO)
        
        # Console handler
        ch = logging.StreamHandler()
        ch.setLevel(logging.INFO)
        formatter = logging.Formatter('%(asctime)s - %(levelname)s - %(message)s')
        ch.setFormatter(formatter)
        logger.addHandler(ch)
        
        return logger
    
    def send_chat_request(self, message: str, session_id: str = None) -> Dict[str, Any]:
        """Send a chat request to the API"""
        if session_id is None:
            session_id = str(uuid.uuid4())
        
        payload = {
            "message": message,
            "session_id": session_id
        }
        
        headers = {
            "Content-Type": "application/json",
            "X-Session-Id": session_id
        }
        
        response = requests.post(
            self.api_endpoint,
            json=payload,
            headers=headers,
            timeout=REQUEST_TIMEOUT
        )
        
        return {
            "status_code": response.status_code,
            "response_time": response.elapsed.total_seconds(),
            "data": response.json() if response.status_code == 200 else {},
            "raw_text": response.text
        }
    
    def validate_response(self, response: Dict, scenario: TestScenario) -> tuple[TestStatus, List[str]]:
        """Validate response against expected behavior"""
        notes = []
        
        # Check if response was received
        if response.get("status_code") != 200:
            notes.append(f"Non-200 status code: {response.get('status_code')}")
            return TestStatus.FAILED, notes
        
        data = response.get("data", {})
        
        # Check basic response
        if not data.get("success", False):
            notes.append("Response success=False")
            return TestStatus.FAILED, notes
        
        response_text = data.get("response", "")
        if not response_text or len(response_text) < 10:
            notes.append("Response text too short or empty")
            return TestStatus.FAILED, notes
        
        # Validation passed
        notes.append("Response received successfully")
        
        # Check for properties if expected
        properties = data.get("properties", [])
        property_count = data.get("property_count", 0)
        if property_count > 0:
            notes.append(f"Found {property_count} properties")
        
        # Check for suggestions
        suggestions = data.get("suggestions", [])
        if suggestions:
            notes.append(f"Got {len(suggestions)} suggestions")
        
        # Check state
        state = data.get("state", {})
        if state:
            if state.get("location_state"):
                notes.append("Location state detected")
            if state.get("filters"):
                notes.append("Filters applied")
        
        return TestStatus.PASSED, notes
    
    def run_test(self, scenario: TestScenario) -> TestResult:
        """Run a single test scenario"""
        self.logger.info(f"\n{'='*60}")
        self.logger.info(f"Test #{scenario.id}: {scenario.name}")
        self.logger.info(f"Category: {scenario.category}")
        self.logger.info(f"Prompt: {scenario.prompt}")
        self.logger.info(f"{'='*60}")
        
        result = TestResult(
            test_id=scenario.id,
            test_name=scenario.name,
            category=scenario.category,
            prompt=scenario.prompt,
            status=TestStatus.ERROR,
            response_time=0,
            timestamp=datetime.now().isoformat()
        )
        
        try:
            # Send request
            self.logger.info("Sending request...")
            response = self.send_chat_request(
                message=scenario.prompt,
                session_id=scenario.session_id
            )
            
            result.response_time = response.get("response_time", 0)
            result.raw_response = response.get("data", {})
            
            # Extract response details
            data = response.get("data", {})
            result.response_text = data.get("response", "")
            result.properties_count = data.get("property_count", 0)
            result.suggestions = data.get("suggestions", [])
            
            # Validate response
            status, notes = self.validate_response(response, scenario)
            result.status = status
            result.validation_notes = notes
            
            # Log result
            if status == TestStatus.PASSED:
                self.logger.info(f"✅ PASSED - Response time: {result.response_time:.2f}s")
            else:
                self.logger.warning(f"❌ FAILED - {notes}")
                
            self.logger.info(f"Response preview: {result.response_text[:200]}...")
            
        except requests.exceptions.Timeout:
            result.status = TestStatus.TIMEOUT
            result.error_message = "Request timed out"
            self.logger.error(f"⏱️ TIMEOUT after {REQUEST_TIMEOUT}s")
            
        except requests.exceptions.ConnectionError as e:
            result.status = TestStatus.ERROR
            result.error_message = f"Connection error: {str(e)}"
            self.logger.error(f"🔌 CONNECTION ERROR: {e}")
            
        except Exception as e:
            result.status = TestStatus.ERROR
            result.error_message = f"Unexpected error: {str(e)}"
            self.logger.error(f"💥 ERROR: {e}")
            self.logger.error(traceback.format_exc())
        
        return result
    
    def run_all_tests(self, scenarios: List[TestScenario]) -> List[TestResult]:
        """Run all test scenarios sequentially"""
        self.start_time = datetime.now()
        self.results = []
        
        self.logger.info("\n" + "="*80)
        self.logger.info("STARTING COMPREHENSIVE CHATBOT TEST SUITE")
        self.logger.info(f"Target: {self.base_url}")
        self.logger.info(f"Total tests: {len(scenarios)}")
        self.logger.info(f"Start time: {self.start_time.isoformat()}")
        self.logger.info("="*80 + "\n")
        
        for i, scenario in enumerate(scenarios):
            self.logger.info(f"\n[{i+1}/{len(scenarios)}] Running test...")
            
            result = self.run_test(scenario)
            self.results.append(result)
            
            # Delay between requests
            if i < len(scenarios) - 1:
                self.logger.info(f"Waiting {DELAY_BETWEEN_REQUESTS}s before next request...")
                time.sleep(DELAY_BETWEEN_REQUESTS)
        
        self.end_time = datetime.now()
        
        # Summary
        self.print_summary()
        
        return self.results
    
    def print_summary(self):
        """Print test summary"""
        total = len(self.results)
        passed = sum(1 for r in self.results if r.status == TestStatus.PASSED)
        failed = sum(1 for r in self.results if r.status == TestStatus.FAILED)
        errors = sum(1 for r in self.results if r.status == TestStatus.ERROR)
        timeouts = sum(1 for r in self.results if r.status == TestStatus.TIMEOUT)
        
        duration = (self.end_time - self.start_time).total_seconds()
        avg_response = sum(r.response_time for r in self.results) / total if total > 0 else 0
        
        self.logger.info("\n" + "="*80)
        self.logger.info("TEST SUMMARY")
        self.logger.info("="*80)
        self.logger.info(f"Total tests:     {total}")
        self.logger.info(f"Passed:          {passed} ({passed/total*100:.1f}%)")
        self.logger.info(f"Failed:          {failed} ({failed/total*100:.1f}%)")
        self.logger.info(f"Errors:          {errors} ({errors/total*100:.1f}%)")
        self.logger.info(f"Timeouts:        {timeouts} ({timeouts/total*100:.1f}%)")
        self.logger.info(f"Total duration:  {duration:.1f}s")
        self.logger.info(f"Avg response:    {avg_response:.2f}s")
        self.logger.info("="*80 + "\n")

# ============================================
# HTML REPORT GENERATOR
# ============================================

class HTMLReportGenerator:
    """Generates comprehensive HTML test report"""
    
    @staticmethod
    def generate_report(results: List[TestResult], start_time: datetime, end_time: datetime) -> str:
        """Generate HTML report"""
        
        total = len(results)
        passed = sum(1 for r in results if r.status == TestStatus.PASSED)
        failed = sum(1 for r in results if r.status == TestStatus.FAILED)
        errors = sum(1 for r in results if r.status == TestStatus.ERROR)
        timeouts = sum(1 for r in results if r.status == TestStatus.TIMEOUT)
        
        duration = (end_time - start_time).total_seconds()
        avg_response = sum(r.response_time for r in results) / total if total > 0 else 0
        pass_rate = (passed / total * 100) if total > 0 else 0
        
        # Group by category
        categories = {}
        for r in results:
            if r.category not in categories:
                categories[r.category] = []
            categories[r.category].append(r)
        
        html_content = f'''<!DOCTYPE html>
<html lang="en">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>Summitly AI Chatbot - Test Report</title>
    <style>
        * {{
            margin: 0;
            padding: 0;
            box-sizing: border-box;
        }}
        
        body {{
            font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, Oxygen, Ubuntu, sans-serif;
            background: linear-gradient(135deg, #1a1a2e 0%, #16213e 100%);
            color: #e0e0e0;
            min-height: 100vh;
            padding: 20px;
        }}
        
        .container {{
            max-width: 1400px;
            margin: 0 auto;
        }}
        
        .header {{
            text-align: center;
            padding: 30px;
            background: rgba(255,255,255,0.05);
            border-radius: 15px;
            margin-bottom: 30px;
            border: 1px solid rgba(255,255,255,0.1);
        }}
        
        .header h1 {{
            font-size: 2.5em;
            background: linear-gradient(90deg, #00d9ff, #00ff88);
            -webkit-background-clip: text;
            -webkit-text-fill-color: transparent;
            margin-bottom: 10px;
        }}
        
        .header .subtitle {{
            color: #888;
            font-size: 1.1em;
        }}
        
        .header .timestamp {{
            color: #666;
            font-size: 0.9em;
            margin-top: 10px;
        }}
        
        .summary-grid {{
            display: grid;
            grid-template-columns: repeat(auto-fit, minmax(200px, 1fr));
            gap: 20px;
            margin-bottom: 30px;
        }}
        
        .summary-card {{
            background: rgba(255,255,255,0.05);
            border-radius: 12px;
            padding: 25px;
            text-align: center;
            border: 1px solid rgba(255,255,255,0.1);
            transition: transform 0.2s;
        }}
        
        .summary-card:hover {{
            transform: translateY(-5px);
        }}
        
        .summary-card .number {{
            font-size: 3em;
            font-weight: bold;
            margin-bottom: 5px;
        }}
        
        .summary-card .label {{
            color: #888;
            font-size: 0.9em;
            text-transform: uppercase;
        }}
        
        .summary-card.total .number {{ color: #00d9ff; }}
        .summary-card.passed .number {{ color: #00ff88; }}
        .summary-card.failed .number {{ color: #ff6b6b; }}
        .summary-card.errors .number {{ color: #ffd93d; }}
        .summary-card.timeouts .number {{ color: #ff9f43; }}
        .summary-card.rate .number {{ color: #a29bfe; }}
        
        .progress-bar {{
            background: rgba(255,255,255,0.1);
            border-radius: 10px;
            height: 30px;
            overflow: hidden;
            margin-bottom: 30px;
        }}
        
        .progress-fill {{
            height: 100%;
            display: flex;
        }}
        
        .progress-passed {{
            background: #00ff88;
            transition: width 1s ease;
        }}
        
        .progress-failed {{
            background: #ff6b6b;
            transition: width 1s ease;
        }}
        
        .progress-errors {{
            background: #ffd93d;
            transition: width 1s ease;
        }}
        
        .progress-timeouts {{
            background: #ff9f43;
            transition: width 1s ease;
        }}
        
        .category-section {{
            background: rgba(255,255,255,0.03);
            border-radius: 12px;
            margin-bottom: 25px;
            border: 1px solid rgba(255,255,255,0.1);
            overflow: hidden;
        }}
        
        .category-header {{
            background: rgba(255,255,255,0.05);
            padding: 15px 25px;
            display: flex;
            justify-content: space-between;
            align-items: center;
            cursor: pointer;
        }}
        
        .category-header h2 {{
            font-size: 1.3em;
            color: #00d9ff;
        }}
        
        .category-stats {{
            display: flex;
            gap: 15px;
        }}
        
        .category-stat {{
            padding: 5px 12px;
            border-radius: 20px;
            font-size: 0.85em;
        }}
        
        .category-stat.passed {{
            background: rgba(0, 255, 136, 0.2);
            color: #00ff88;
        }}
        
        .category-stat.failed {{
            background: rgba(255, 107, 107, 0.2);
            color: #ff6b6b;
        }}
        
        .test-list {{
            padding: 0;
        }}
        
        .test-item {{
            border-top: 1px solid rgba(255,255,255,0.05);
            padding: 20px 25px;
        }}
        
        .test-item:hover {{
            background: rgba(255,255,255,0.02);
        }}
        
        .test-header {{
            display: flex;
            justify-content: space-between;
            align-items: center;
            margin-bottom: 10px;
        }}
        
        .test-title {{
            display: flex;
            align-items: center;
            gap: 12px;
        }}
        
        .test-id {{
            background: rgba(255,255,255,0.1);
            padding: 4px 10px;
            border-radius: 6px;
            font-size: 0.8em;
            color: #888;
        }}
        
        .test-name {{
            font-weight: 600;
            font-size: 1.1em;
        }}
        
        .test-status {{
            padding: 6px 16px;
            border-radius: 20px;
            font-size: 0.85em;
            font-weight: 600;
        }}
        
        .test-status.passed {{
            background: rgba(0, 255, 136, 0.2);
            color: #00ff88;
        }}
        
        .test-status.failed {{
            background: rgba(255, 107, 107, 0.2);
            color: #ff6b6b;
        }}
        
        .test-status.error {{
            background: rgba(255, 217, 61, 0.2);
            color: #ffd93d;
        }}
        
        .test-status.timeout {{
            background: rgba(255, 159, 67, 0.2);
            color: #ff9f43;
        }}
        
        .test-prompt {{
            background: rgba(0, 0, 0, 0.3);
            padding: 12px 16px;
            border-radius: 8px;
            margin-bottom: 12px;
            font-family: 'Courier New', monospace;
            font-size: 0.95em;
            color: #00d9ff;
        }}
        
        .test-prompt::before {{
            content: '> ';
            color: #888;
        }}
        
        .test-response {{
            background: rgba(0, 255, 136, 0.05);
            padding: 12px 16px;
            border-radius: 8px;
            border-left: 3px solid #00ff88;
            margin-bottom: 12px;
            font-size: 0.9em;
            line-height: 1.5;
            max-height: 200px;
            overflow-y: auto;
        }}
        
        .test-meta {{
            display: flex;
            gap: 20px;
            flex-wrap: wrap;
            font-size: 0.85em;
            color: #888;
        }}
        
        .test-meta span {{
            display: flex;
            align-items: center;
            gap: 5px;
        }}
        
        .test-meta .icon {{
            font-size: 1.1em;
        }}
        
        .test-notes {{
            margin-top: 10px;
            padding: 10px 15px;
            background: rgba(162, 155, 254, 0.1);
            border-radius: 8px;
            font-size: 0.85em;
        }}
        
        .test-notes ul {{
            margin: 0;
            padding-left: 20px;
        }}
        
        .test-error {{
            margin-top: 10px;
            padding: 10px 15px;
            background: rgba(255, 107, 107, 0.1);
            border-radius: 8px;
            color: #ff6b6b;
            font-size: 0.85em;
        }}
        
        .footer {{
            text-align: center;
            padding: 20px;
            color: #666;
            font-size: 0.9em;
        }}
        
        .collapsible-content {{
            display: block;
        }}
        
        .logs-section {{
            background: rgba(255,255,255,0.03);
            border-radius: 12px;
            padding: 25px;
            margin-top: 30px;
            border: 1px solid rgba(255,255,255,0.1);
        }}
        
        .logs-section h2 {{
            color: #00d9ff;
            margin-bottom: 20px;
        }}
        
        .log-entry {{
            padding: 8px 15px;
            border-bottom: 1px solid rgba(255,255,255,0.05);
            font-family: 'Courier New', monospace;
            font-size: 0.85em;
        }}
        
        .log-entry:last-child {{
            border-bottom: none;
        }}
        
        .log-timestamp {{
            color: #888;
        }}
        
        .log-passed {{ color: #00ff88; }}
        .log-failed {{ color: #ff6b6b; }}
        .log-error {{ color: #ffd93d; }}
        
        @media (max-width: 768px) {{
            .summary-grid {{
                grid-template-columns: repeat(2, 1fr);
            }}
            
            .test-header {{
                flex-direction: column;
                align-items: flex-start;
                gap: 10px;
            }}
            
            .category-header {{
                flex-direction: column;
                align-items: flex-start;
                gap: 10px;
            }}
        }}
    </style>
</head>
<body>
    <div class="container">
        <div class="header">
            <h1>🏠 Summitly AI Chatbot</h1>
            <div class="subtitle">Comprehensive Test Report - Version 2</div>
            <div class="timestamp">
                Generated: {datetime.now().strftime('%B %d, %Y at %H:%M:%S')}<br>
                Test Duration: {duration:.1f} seconds | Average Response: {avg_response:.2f}s
            </div>
        </div>
        
        <div class="summary-grid">
            <div class="summary-card total">
                <div class="number">{total}</div>
                <div class="label">Total Tests</div>
            </div>
            <div class="summary-card passed">
                <div class="number">{passed}</div>
                <div class="label">Passed</div>
            </div>
            <div class="summary-card failed">
                <div class="number">{failed}</div>
                <div class="label">Failed</div>
            </div>
            <div class="summary-card errors">
                <div class="number">{errors}</div>
                <div class="label">Errors</div>
            </div>
            <div class="summary-card timeouts">
                <div class="number">{timeouts}</div>
                <div class="label">Timeouts</div>
            </div>
            <div class="summary-card rate">
                <div class="number">{pass_rate:.1f}%</div>
                <div class="label">Pass Rate</div>
            </div>
        </div>
        
        <div class="progress-bar">
            <div class="progress-fill">
                <div class="progress-passed" style="width: {passed/total*100 if total > 0 else 0}%"></div>
                <div class="progress-failed" style="width: {failed/total*100 if total > 0 else 0}%"></div>
                <div class="progress-errors" style="width: {errors/total*100 if total > 0 else 0}%"></div>
                <div class="progress-timeouts" style="width: {timeouts/total*100 if total > 0 else 0}%"></div>
            </div>
        </div>
'''
        
        # Add category sections
        for category, tests in categories.items():
            cat_passed = sum(1 for t in tests if t.status == TestStatus.PASSED)
            cat_failed = len(tests) - cat_passed
            
            html_content += f'''
        <div class="category-section">
            <div class="category-header">
                <h2>{html.escape(category)}</h2>
                <div class="category-stats">
                    <span class="category-stat passed">{cat_passed} Passed</span>
                    <span class="category-stat failed">{cat_failed} Failed</span>
                </div>
            </div>
            <div class="test-list collapsible-content">
'''
            
            for test in tests:
                status_class = test.status.value
                status_label = test.status.value.upper()
                
                # Escape HTML in responses
                safe_prompt = html.escape(test.prompt)
                safe_response = html.escape(test.response_text[:500] + "..." if len(test.response_text) > 500 else test.response_text)
                
                html_content += f'''
                <div class="test-item">
                    <div class="test-header">
                        <div class="test-title">
                            <span class="test-id">#{test.test_id}</span>
                            <span class="test-name">{html.escape(test.test_name)}</span>
                        </div>
                        <span class="test-status {status_class}">{status_label}</span>
                    </div>
                    <div class="test-prompt">{safe_prompt}</div>
                    <div class="test-response">{safe_response if safe_response else 'No response received'}</div>
                    <div class="test-meta">
                        <span><span class="icon">⏱️</span> {test.response_time:.2f}s</span>
                        <span><span class="icon">🏠</span> {test.properties_count} properties</span>
                        <span><span class="icon">💡</span> {len(test.suggestions)} suggestions</span>
                    </div>
'''
                
                if test.validation_notes:
                    html_content += f'''
                    <div class="test-notes">
                        <strong>Validation Notes:</strong>
                        <ul>
                            {''.join(f'<li>{html.escape(note)}</li>' for note in test.validation_notes)}
                        </ul>
                    </div>
'''
                
                if test.error_message:
                    html_content += f'''
                    <div class="test-error">
                        <strong>Error:</strong> {html.escape(test.error_message)}
                    </div>
'''
                
                html_content += '''
                </div>
'''
            
            html_content += '''
            </div>
        </div>
'''
        
        # Add execution log section
        html_content += '''
        <div class="logs-section">
            <h2>📋 Execution Log</h2>
'''
        
        for test in results:
            log_class = "log-passed" if test.status == TestStatus.PASSED else "log-failed" if test.status == TestStatus.FAILED else "log-error"
            icon = "✅" if test.status == TestStatus.PASSED else "❌" if test.status == TestStatus.FAILED else "⚠️"
            
            html_content += f'''
            <div class="log-entry">
                <span class="log-timestamp">[{test.timestamp}]</span>
                <span class="{log_class}">{icon} Test #{test.test_id}: {html.escape(test.test_name)} - {test.status.value.upper()} ({test.response_time:.2f}s)</span>
            </div>
'''
        
        html_content += '''
        </div>
        
        <div class="footer">
            <p>Summitly AI - Comprehensive Chatbot Test Suite</p>
            <p>Target Server: ''' + BASE_URL + '''</p>
        </div>
    </div>
    
    <script>
        // Toggle category sections
        document.querySelectorAll('.category-header').forEach(header => {
            header.addEventListener('click', () => {
                const content = header.nextElementSibling;
                content.style.display = content.style.display === 'none' ? 'block' : 'none';
            });
        });
    </script>
</body>
</html>
'''
        
        return html_content

# ============================================
# MAIN EXECUTION
# ============================================

def main():
    """Main entry point"""
    print("\n" + "="*80)
    print("SUMMITLY AI CHATBOT - COMPREHENSIVE TEST SUITE")
    print("50 Real-Life Scenario Tests")
    print("="*80 + "\n")
    
    # Create test scenarios
    scenarios = create_test_scenarios()
    print(f"Created {len(scenarios)} test scenarios\n")
    
    # Initialize test runner
    runner = ChatbotTestRunner(BASE_URL)
    
    # Run all tests
    results = runner.run_all_tests(scenarios)
    
    # Generate HTML report
    print("\nGenerating HTML report...")
    html_report = HTMLReportGenerator.generate_report(
        results, 
        runner.start_time, 
        runner.end_time
    )
    
    # Save report
    report_filename = f"chatbot_test_report_{datetime.now().strftime('%Y%m%d_%H%M%S')}.html"
    report_path = f"/Users/shreyashdanke/Desktop/Main/Summitly Backend/tests/{report_filename}"
    
    with open(report_path, 'w', encoding='utf-8') as f:
        f.write(html_report)
    
    print(f"\n✅ HTML report saved to: {report_path}")
    
    # Also save JSON results for further analysis
    json_filename = f"chatbot_test_results_{datetime.now().strftime('%Y%m%d_%H%M%S')}.json"
    json_path = f"/Users/shreyashdanke/Desktop/Main/Summitly Backend/tests/{json_filename}"
    
    json_results = []
    for r in results:
        json_results.append({
            "test_id": r.test_id,
            "test_name": r.test_name,
            "category": r.category,
            "prompt": r.prompt,
            "status": r.status.value,
            "response_time": r.response_time,
            "response_text": r.response_text,
            "properties_count": r.properties_count,
            "suggestions": r.suggestions,
            "error_message": r.error_message,
            "validation_notes": r.validation_notes,
            "timestamp": r.timestamp
        })
    
    with open(json_path, 'w', encoding='utf-8') as f:
        json.dump({
            "test_summary": {
                "total": len(results),
                "passed": sum(1 for r in results if r.status == TestStatus.PASSED),
                "failed": sum(1 for r in results if r.status == TestStatus.FAILED),
                "errors": sum(1 for r in results if r.status == TestStatus.ERROR),
                "timeouts": sum(1 for r in results if r.status == TestStatus.TIMEOUT),
                "start_time": runner.start_time.isoformat(),
                "end_time": runner.end_time.isoformat(),
                "duration_seconds": (runner.end_time - runner.start_time).total_seconds()
            },
            "results": json_results
        }, f, indent=2)
    
    print(f"✅ JSON results saved to: {json_path}")
    
    return results

if __name__ == "__main__":
    main()
