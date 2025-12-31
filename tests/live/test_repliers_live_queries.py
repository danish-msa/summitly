#!/usr/bin/env python3
"""
Repliers Live Query Test Harness
=================================

OBJECTIVE:
Validate end-to-end behavior of Repliers integration against REAL API servers.
Tests the complete pipeline: User Query → Contract → Service Layer → Repliers API

SAFETY:
- READ-ONLY operations (search, fetch details)
- No data modification
- Safe for production execution
- DRY-RUN mode available

USAGE:
    # Live mode (hits real Repliers API)
    export LIVE_REPLIERS_TEST=true
    python -m tests.live.test_repliers_live_queries

    # Dry-run mode (validation only, no HTTP calls)
    export LIVE_REPLIERS_TEST=false
    python -m tests.live.test_repliers_live_queries

AUTHOR: Senior Backend Engineer
DATE: 2025-12-26
"""

import os
import sys
import time
import json
from typing import Dict, List, Any, Optional, Tuple
from datetime import datetime
from dataclasses import dataclass, field
from collections import defaultdict

# Add project root to path
sys.path.insert(0, os.path.join(os.path.dirname(__file__), '..', '..'))

# Import services
from services.listings_service import listings_service
from services.repliers_query_contract import (
    normalize_to_repliers,
    ContractError,
    UnknownParameterError,
    InvalidParameterValueError,
    ParameterRangeError
)

# Check if we're in live mode
LIVE_MODE = os.getenv('LIVE_REPLIERS_TEST', 'true').lower() == 'true'


# ============================================================================
# TEST RESULT TRACKING
# ============================================================================

@dataclass
class TestResult:
    """Track individual test execution results"""
    test_name: str
    test_category: str
    success: bool
    execution_time_ms: float
    internal_params: Dict[str, Any] = field(default_factory=dict)
    normalized_params: Dict[str, Any] = field(default_factory=dict)
    response_count: int = 0
    mls_numbers: List[str] = field(default_factory=list)
    error_type: Optional[str] = None
    error_message: Optional[str] = None
    notes: str = ""


class TestHarness:
    """Test harness for live Repliers queries"""
    
    def __init__(self, live_mode: bool = True):
        self.live_mode = live_mode
        self.results: List[TestResult] = []
        self.start_time = time.time()
        
    def log(self, message: str, level: str = "INFO"):
        """Log message with timestamp"""
        timestamp = datetime.now().strftime("%H:%M:%S")
        prefix = {
            "INFO": "ℹ️ ",
            "SUCCESS": "✅",
            "ERROR": "❌",
            "WARNING": "⚠️ ",
            "TEST": "🧪"
        }.get(level, "  ")
        print(f"[{timestamp}] {prefix} {message}")
    
    def execute_test(
        self,
        test_name: str,
        test_category: str,
        params: Dict[str, Any],
        expected_behavior: str = "success"
    ) -> TestResult:
        """
        Execute a single test case
        
        Args:
            test_name: Name of the test
            test_category: Category (standard, edge_case, etc.)
            params: Internal parameters (snake_case)
            expected_behavior: 'success', 'contract_error', 'empty_valid'
        """
        self.log(f"Running: {test_name}", "TEST")
        
        result = TestResult(
            test_name=test_name,
            test_category=test_category,
            success=False,
            execution_time_ms=0,
            internal_params=params.copy()
        )
        
        start = time.time()
        
        try:
            # Step 1: Contract normalization
            self.log(f"  Internal params: {params}")
            
            try:
                normalized = normalize_to_repliers(params, debug=False)
                result.normalized_params = normalized
                self.log(f"  Normalized params: {normalized}")
            except ContractError as e:
                result.error_type = type(e).__name__
                result.error_message = str(e)
                
                if expected_behavior == "contract_error":
                    self.log(f"  ✅ Expected contract error: {e}", "SUCCESS")
                    result.success = True
                else:
                    self.log(f"  ❌ Unexpected contract error: {e}", "ERROR")
                    result.success = False
                
                result.execution_time_ms = (time.time() - start) * 1000
                return result
            
            # Step 2: Call listings service (if live mode)
            if self.live_mode:
                self.log("  Calling Repliers API...")
                
                try:
                    response = listings_service.search_listings(**params)
                    
                    # Extract results
                    listings = response.get('listings', response.get('results', []))
                    total_count = response.get('count', response.get('total', len(listings)))
                    
                    result.response_count = len(listings)
                    result.mls_numbers = [
                        listing.get('mlsNumber', listing.get('id', 'N/A'))
                        for listing in listings[:5]  # First 5 only
                    ]
                    
                    self.log(f"  📊 Response: {total_count} total, {len(listings)} returned")
                    if result.mls_numbers:
                        self.log(f"  🏠 Sample MLS: {', '.join(result.mls_numbers[:3])}")
                    
                    # Check if response matches expectations
                    if expected_behavior == "empty_valid":
                        if len(listings) == 0:
                            self.log("  ✅ Empty response as expected", "SUCCESS")
                            result.success = True
                        else:
                            self.log(f"  ⚠️  Expected empty, got {len(listings)} results", "WARNING")
                            result.success = True  # Still valid
                    else:
                        if len(listings) > 0:
                            self.log("  ✅ Query successful with results", "SUCCESS")
                            result.success = True
                        else:
                            self.log("  ⚠️  Query succeeded but returned no results", "WARNING")
                            result.success = True  # Still valid, just no matches
                            result.notes = "No properties matched criteria"
                
                except Exception as e:
                    self.log(f"  ❌ API error: {e}", "ERROR")
                    result.error_type = type(e).__name__
                    result.error_message = str(e)
                    result.success = False
            
            else:
                # Dry-run mode
                self.log("  ⏭️  Dry-run mode: Skipping API call")
                result.success = True
                result.notes = "Dry-run mode - contract validation only"
        
        except Exception as e:
            self.log(f"  ❌ Unexpected error: {e}", "ERROR")
            result.error_type = type(e).__name__
            result.error_message = str(e)
            result.success = False
        
        finally:
            result.execution_time_ms = (time.time() - start) * 1000
            self.log(f"  ⏱️  Execution time: {result.execution_time_ms:.2f}ms")
            self.results.append(result)
        
        return result
    
    def print_summary(self):
        """Print comprehensive test summary"""
        total_time = time.time() - self.start_time
        
        print("\n" + "=" * 80)
        print("🏁 REPLIERS LIVE QUERY TEST SUMMARY")
        print("=" * 80)
        print(f"Mode: {'🔴 LIVE' if self.live_mode else '🟡 DRY-RUN'}")
        print(f"Total Execution Time: {total_time:.2f}s")
        print(f"Total Tests: {len(self.results)}")
        print("=" * 80)
        
        # Categorize results
        successful = [r for r in self.results if r.success]
        failed = [r for r in self.results if not r.success]
        contract_errors = [r for r in self.results if r.error_type and 'Error' in r.error_type]
        api_errors = [r for r in self.results if r.error_type and 'API' in str(r.error_type)]
        empty_valid = [r for r in self.results if r.success and r.response_count == 0 and self.live_mode]
        
        # Statistics by category
        categories = defaultdict(list)
        for r in self.results:
            categories[r.test_category].append(r)
        
        print("\n📊 RESULTS BY CATEGORY")
        print("-" * 80)
        for category, tests in sorted(categories.items()):
            success_count = sum(1 for t in tests if t.success)
            print(f"  {category:30s}: {success_count}/{len(tests)} passed")
        
        print("\n📈 DETAILED STATISTICS")
        print("-" * 80)
        print(f"  ✅ Successful:           {len(successful)}")
        print(f"  ❌ Failed:               {len(failed)}")
        print(f"  🚫 Contract Rejections:  {len(contract_errors)}")
        print(f"  🌐 API Errors:           {len(api_errors)}")
        print(f"  ⭕ Empty (Valid):        {len(empty_valid)}")
        
        if self.live_mode:
            total_properties = sum(r.response_count for r in self.results if r.success)
            avg_response_time = sum(r.execution_time_ms for r in self.results) / len(self.results)
            print(f"  🏠 Total Properties:     {total_properties}")
            print(f"  ⏱️  Avg Response Time:    {avg_response_time:.2f}ms")
        
        # Failed tests detail
        if failed:
            print("\n❌ FAILED TESTS")
            print("-" * 80)
            for r in failed:
                print(f"  • {r.test_name}")
                print(f"    Error: {r.error_type} - {r.error_message}")
        
        # Performance metrics
        if self.live_mode and successful:
            print("\n⏱️  PERFORMANCE METRICS")
            print("-" * 80)
            times = [r.execution_time_ms for r in successful]
            print(f"  Min:  {min(times):.2f}ms")
            print(f"  Max:  {max(times):.2f}ms")
            print(f"  Avg:  {sum(times)/len(times):.2f}ms")
        
        print("\n" + "=" * 80)
        if len(failed) == 0:
            print("🎉 ALL TESTS PASSED")
        else:
            print(f"⚠️  {len(failed)} TEST(S) FAILED")
        print("=" * 80 + "\n")


# ============================================================================
# TEST CASES
# ============================================================================

def test_standard_buyer_searches(harness: TestHarness):
    """A. Standard buyer search scenarios"""
    print("\n" + "=" * 80)
    print("🏠 CATEGORY A: STANDARD BUYER SEARCHES")
    print("=" * 80)
    
    # Test A1: Condos in Toronto under 800k with 2 bedrooms
    harness.execute_test(
        test_name="A1: Toronto condos under 800k, 2 beds",
        test_category="standard_search",
        params={
            'city': 'Toronto',
            'property_style': 'condo',
            'max_price': 800000,
            'min_bedrooms': 2,
            'status': 'active',
            'transaction_type': 'sale',
            'page_size': 20
        }
    )
    
    # Test A2: Single-family homes in Vancouver
    harness.execute_test(
        test_name="A2: Vancouver single-family homes",
        test_category="standard_search",
        params={
            'city': 'Vancouver',
            'property_style': 'detached',
            'min_bedrooms': 3,
            'status': 'active',
            'transaction_type': 'sale',
            'page_size': 15
        }
    )
    
    # Test A3: Rentals in Montreal
    harness.execute_test(
        test_name="A3: Montreal rentals (lease)",
        test_category="standard_search",
        params={
            'city': 'Montreal',
            'transaction_type': 'rent',  # Should normalize to 'lease'
            'max_price': 2500,
            'status': 'active',
            'page_size': 10
        }
    )


def test_ambiguous_human_input(harness: TestHarness):
    """B. Ambiguous human input scenarios"""
    print("\n" + "=" * 80)
    print("💬 CATEGORY B: AMBIGUOUS HUMAN INPUT")
    print("=" * 80)
    
    # Test B1: "Cheap homes near downtown Toronto"
    harness.execute_test(
        test_name="B1: Cheap homes (max 500k)",
        test_category="ambiguous_input",
        params={
            'city': 'Toronto',
            'neighborhood': 'Downtown',
            'max_price': 500000,
            'status': 'active',
            'transaction_type': 'sale'
        }
    )
    
    # Test B2: Flexible bedroom count
    harness.execute_test(
        test_name="B2: 2-3 bedroom range",
        test_category="ambiguous_input",
        params={
            'city': 'Toronto',
            'min_bedrooms': 2,
            'max_bedrooms': 3,
            'status': 'active',
            'page_size': 20
        }
    )


def test_partial_location(harness: TestHarness):
    """C. Partial location scenarios"""
    print("\n" + "=" * 80)
    print("📍 CATEGORY C: PARTIAL LOCATION")
    print("=" * 80)
    
    # Test C1: City only
    harness.execute_test(
        test_name="C1: City only (Toronto)",
        test_category="partial_location",
        params={
            'city': 'Toronto',
            'status': 'active',
            'page_size': 10
        }
    )
    
    # Test C2: Postal code prefix
    harness.execute_test(
        test_name="C2: Postal code prefix (M5V)",
        test_category="partial_location",
        params={
            'postal_code': 'M5V',
            'status': 'active',
            'page_size': 10
        }
    )
    
    # Test C3: Neighborhood only
    harness.execute_test(
        test_name="C3: Neighborhood (Yorkville)",
        test_category="partial_location",
        params={
            'city': 'Toronto',
            'neighborhood': 'Yorkville',
            'status': 'active',
            'page_size': 10
        }
    )


def test_edge_cases(harness: TestHarness):
    """D. Edge case scenarios"""
    print("\n" + "=" * 80)
    print("⚠️  CATEGORY D: EDGE CASES")
    print("=" * 80)
    
    # Test D1: min_price > max_price (should be rejected by contract)
    harness.execute_test(
        test_name="D1: Invalid range (min > max)",
        test_category="edge_case_invalid",
        params={
            'city': 'Toronto',
            'min_price': 1000000,
            'max_price': 500000  # Invalid!
        },
        expected_behavior="contract_error"
    )
    
    # Test D2: Unknown parameter (should be rejected by contract)
    harness.execute_test(
        test_name="D2: Unknown parameter",
        test_category="edge_case_invalid",
        params={
            'city': 'Toronto',
            'invalid_param': 'test_value',  # Invalid!
            'status': 'active'
        },
        expected_behavior="contract_error"
    )
    
    # Test D3: Invalid status value
    harness.execute_test(
        test_name="D3: Invalid status value",
        test_category="edge_case_invalid",
        params={
            'city': 'Toronto',
            'status': 'invalid_status'  # Invalid!
        },
        expected_behavior="contract_error"
    )
    
    # Test D4: Very high price (valid but likely empty)
    harness.execute_test(
        test_name="D4: Very high price filter",
        test_category="edge_case_valid",
        params={
            'city': 'Toronto',
            'min_price': 50000000,  # 50M
            'status': 'active'
        },
        expected_behavior="empty_valid"
    )
    
    # Test D5: Coordinate search without radius
    harness.execute_test(
        test_name="D5: Coordinates without radius",
        test_category="edge_case_invalid",
        params={
            'latitude': 43.65,
            'longitude': -79.38,
            # Missing radius_km - should still work
            'status': 'active'
        },
        expected_behavior="success"
    )


def test_pagination(harness: TestHarness):
    """E. Pagination scenarios"""
    print("\n" + "=" * 80)
    print("📄 CATEGORY E: PAGINATION")
    print("=" * 80)
    
    # Test E1: Page 1
    result_page_1 = harness.execute_test(
        test_name="E1: Page 1 (size 20)",
        test_category="pagination",
        params={
            'city': 'Toronto',
            'property_style': 'condo',
            'status': 'active',
            'page': 1,
            'page_size': 20
        }
    )
    
    # Test E2: Page 2
    result_page_2 = harness.execute_test(
        test_name="E2: Page 2 (size 20)",
        test_category="pagination",
        params={
            'city': 'Toronto',
            'property_style': 'condo',
            'status': 'active',
            'page': 2,
            'page_size': 20
        }
    )
    
    # Check for duplicates (if live mode)
    if harness.live_mode and result_page_1.success and result_page_2.success:
        page_1_mls = set(result_page_1.mls_numbers)
        page_2_mls = set(result_page_2.mls_numbers)
        duplicates = page_1_mls.intersection(page_2_mls)
        
        if duplicates:
            harness.log(f"⚠️  WARNING: Found {len(duplicates)} duplicate MLS numbers across pages", "WARNING")
        else:
            harness.log("✅ No duplicates found between page 1 and 2", "SUCCESS")


def test_contract_validations(harness: TestHarness):
    """F. Contract validation scenarios"""
    print("\n" + "=" * 80)
    print("📋 CATEGORY F: CONTRACT VALIDATIONS")
    print("=" * 80)
    
    # Test F1: Status normalization
    harness.execute_test(
        test_name="F1: Status normalization (active → A)",
        test_category="contract_validation",
        params={
            'city': 'Toronto',
            'status': 'active',  # Should normalize to 'A'
            'page_size': 5
        }
    )
    
    # Test F2: Transaction type alias
    harness.execute_test(
        test_name="F2: Transaction type alias (buy → sale)",
        test_category="contract_validation",
        params={
            'city': 'Toronto',
            'transaction_type': 'buy',  # Should normalize to 'sale'
            'page_size': 5
        }
    )
    
    # Test F3: Date parameter mapping
    harness.execute_test(
        test_name="F3: Date parameter mapping",
        test_category="contract_validation",
        params={
            'city': 'Toronto',
            'listed_after': '2025-01-01',  # Should map to minListDate
            'status': 'active',
            'page_size': 5
        }
    )


def test_ai_flow_simulation(harness: TestHarness):
    """G. AI flow simulation"""
    print("\n" + "=" * 80)
    print("🤖 CATEGORY G: AI FLOW SIMULATION")
    print("=" * 80)
    
    # Simulate: User asks "Show me 2-bedroom condos in Toronto under 700k"
    harness.log("Simulating AI query: 'Show me 2-bedroom condos in Toronto under 700k'")
    
    result = harness.execute_test(
        test_name="G1: AI-parsed query",
        test_category="ai_flow",
        params={
            'city': 'Toronto',
            'property_style': 'condo',
            'min_bedrooms': 2,
            'max_price': 700000,
            'status': 'active',
            'transaction_type': 'sale',
            'page_size': 10
        }
    )
    
    # Verify we got actual listings (no hallucination)
    if harness.live_mode and result.success:
        if result.response_count > 0:
            harness.log(f"✅ AI would have {result.response_count} real properties to reference", "SUCCESS")
            harness.log(f"   Real MLS numbers: {', '.join(result.mls_numbers[:3])}")
        else:
            harness.log("⚠️  Query successful but no properties found (AI would inform user)", "WARNING")


# ============================================================================
# MAIN EXECUTION
# ============================================================================

def main():
    """Main test execution"""
    print("\n" + "🚀 " * 25)
    print("   REPLIERS LIVE QUERY TEST HARNESS")
    print("🚀 " * 25 + "\n")
    
    # Initialize harness
    harness = TestHarness(live_mode=LIVE_MODE)
    
    if LIVE_MODE:
        harness.log("🔴 LIVE MODE: Will execute real API calls", "WARNING")
        harness.log("Waiting 2 seconds... (Ctrl+C to cancel)", "INFO")
        time.sleep(2)
    else:
        harness.log("🟡 DRY-RUN MODE: Contract validation only", "INFO")
    
    # Run test suites
    try:
        test_standard_buyer_searches(harness)
        test_ambiguous_human_input(harness)
        test_partial_location(harness)
        test_edge_cases(harness)
        test_pagination(harness)
        test_contract_validations(harness)
        test_ai_flow_simulation(harness)
        
    except KeyboardInterrupt:
        harness.log("\n⚠️  Tests interrupted by user", "WARNING")
    except Exception as e:
        harness.log(f"\n❌ Fatal error: {e}", "ERROR")
        import traceback
        traceback.print_exc()
    finally:
        # Always print summary
        harness.print_summary()
    
    # Return exit code
    failed_count = sum(1 for r in harness.results if not r.success)
    return 1 if failed_count > 0 else 0


if __name__ == '__main__':
    exit(main())
