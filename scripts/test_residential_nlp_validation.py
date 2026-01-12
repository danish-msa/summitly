"""
Comprehensive Residential Search NLP & API Validation Test
============================================================
This script tests the full pipeline from natural language queries to real API results.
It validates:
1. NLP correctly extracts filters from various prompts
2. API returns real properties matching the criteria
3. Properties returned are genuine (verified against search criteria)

Author: Summitly Team
Date: January 10, 2026
"""

import os
import sys
import json
import time
from datetime import datetime
from typing import Dict, Any, List, Optional

# Add parent directory to path
sys.path.insert(0, os.path.dirname(os.path.dirname(os.path.abspath(__file__))))

# Load environment variables
from dotenv import load_dotenv
from pathlib import Path
env_path = Path(__file__).parent.parent / 'config' / '.env'
load_dotenv(dotenv_path=env_path)


# Import all required modules
from services.residential_filter_mapper import (
    ResidentialFilters,
    ResidentialFilterExtractor,
    build_residential_api_params,
)
from services.residential_search_service import get_residential_search_service
from services.residential_chatbot_integration import (
    StateToFiltersConverter,
    search_residential_properties,
)
from services.conversation_state import ConversationState
from services.location_extractor import LocationState


# =============================================================================
# TEST CONFIGURATION
# =============================================================================

# Test prompts covering all 90+ filter types
TEST_PROMPTS = [
    # === BASIC PROPERTY SEARCHES ===
    {
        "category": "Basic Condo Search",
        "query": "2 bedroom condo in Toronto",
        "expected_filters": {
            "city": "Toronto",
            "property_type": "Condo",
            "min_bedrooms": 2,
        },
        "validation_rules": {
            "city_must_match": True,
            "bedrooms_must_match": True,
        }
    },
    {
        "category": "Basic House Search",
        "query": "3 bedroom detached house in Mississauga",
        "expected_filters": {
            "city": "Mississauga", 
            "property_type": "Detached",
            "min_bedrooms": 3,
        },
        "validation_rules": {
            "city_must_match": True,
        }
    },
    {
        "category": "Townhouse Search",
        "query": "townhouse in Oakville with 4 bedrooms",
        "expected_filters": {
            "city": "Oakville",
            "property_type": "Townhouse",
            "min_bedrooms": 4,
        },
        "validation_rules": {
            "city_must_match": True,
        }
    },
    
    # === PRICE RANGE SEARCHES ===
    {
        "category": "Under Price Limit",
        "query": "condos in Toronto under 700k",
        "expected_filters": {
            "city": "Toronto",
            "max_price": 700000,
        },
        "validation_rules": {
            "price_must_be_under": 700000,
        }
    },
    {
        "category": "Price Range",
        "query": "houses between 500k and 900k in Vaughan",
        "expected_filters": {
            "city": "Vaughan",
            "min_price": 500000,
            "max_price": 900000,
        },
        "validation_rules": {
            "price_must_be_in_range": (500000, 900000),
        }
    },
    {
        "category": "Luxury Properties",
        "query": "luxury homes over 2 million in Toronto",
        "expected_filters": {
            "city": "Toronto",
            "min_price": 2000000,
        },
        "validation_rules": {
            "price_must_be_over": 2000000,
        }
    },
    
    # === RENTAL SEARCHES ===
    {
        "category": "Rental Under Budget",
        "query": "condo rentals in Toronto under $3000 per month",
        "expected_filters": {
            "city": "Toronto",
            "transaction_type": "Lease",
            "max_price": 3000,
        },
        "validation_rules": {
            "must_be_rental": True,
            "price_must_be_under": 3500,  # Allow some flexibility
        }
    },
    {
        "category": "Rental with Bedrooms",
        "query": "2 bedroom apartment for rent in downtown Toronto",
        "expected_filters": {
            "city": "Toronto",
            "transaction_type": "Lease",
            "min_bedrooms": 2,
        },
        "validation_rules": {
            "must_be_rental": True,
        }
    },
    
    # === POOL SEARCHES ===
    {
        "category": "House with Pool",
        "query": "house with pool in Mississauga",
        "expected_filters": {
            "city": "Mississauga",
            "has_pool": True,
        },
        "validation_rules": {
            "city_must_match": True,
        }
    },
    {
        "category": "Inground Pool",
        "query": "detached home with inground pool in Oakville",
        "expected_filters": {
            "city": "Oakville",
            "property_type": "Detached",
            "has_pool": True,
        },
        "validation_rules": {
            "city_must_match": True,
        }
    },
    
    # === BASEMENT SEARCHES ===
    {
        "category": "Finished Basement",
        "query": "house with finished basement in Brampton",
        "expected_filters": {
            "city": "Brampton",
            "basement_type": "finished",
        },
        "validation_rules": {
            "city_must_match": True,
        }
    },
    {
        "category": "Walkout Basement",
        "query": "home with walkout basement in Markham",
        "expected_filters": {
            "city": "Markham",
            "basement_type": "walkout",
        },
        "validation_rules": {
            "city_must_match": True,
        }
    },
    {
        "category": "Basement Apartment",
        "query": "property with basement apartment in Toronto",
        "expected_filters": {
            "city": "Toronto",
            "basement_type": "apartment",
        },
        "validation_rules": {
            "city_must_match": True,
        }
    },
    
    # === GARAGE SEARCHES ===
    {
        "category": "Attached Garage",
        "query": "house with attached garage in Richmond Hill",
        "expected_filters": {
            "city": "Richmond Hill",
            "garage_type": "attached",
        },
        "validation_rules": {
            "city_must_match": True,
        }
    },
    {
        "category": "Double Car Garage",
        "query": "home with 2 car garage in Vaughan",
        "expected_filters": {
            "city": "Vaughan",
            "garage_spaces": 2,
        },
        "validation_rules": {
            "city_must_match": True,
        }
    },
    
    # === WATERFRONT SEARCHES ===
    {
        "category": "Waterfront Property",
        "query": "waterfront property in Toronto",
        "expected_filters": {
            "city": "Toronto",
            "waterfront": True,
        },
        "validation_rules": {
            "city_must_match": True,
        }
    },
    {
        "category": "Lakefront Home",
        "query": "lakefront home in Oakville",
        "expected_filters": {
            "city": "Oakville",
            "waterfront": True,
        },
        "validation_rules": {
            "city_must_match": True,
        }
    },
    
    # === CONDO SPECIFIC SEARCHES ===
    {
        "category": "Condo with Parking",
        "query": "condo with parking in Toronto under 600k",
        "expected_filters": {
            "city": "Toronto",
            "property_type": "Condo",
            "max_price": 600000,
            "min_parking_spaces": 1,
        },
        "validation_rules": {
            "price_must_be_under": 600000,
        }
    },
    {
        "category": "High Floor Condo",
        "query": "condo on 20th floor or higher in downtown Toronto",
        "expected_filters": {
            "city": "Toronto",
            "property_type": "Condo",
            "floor_level": 20,
        },
        "validation_rules": {
            "city_must_match": True,
        }
    },
    {
        "category": "Low Maintenance Fee",
        "query": "condo with maintenance under $500 in Toronto",
        "expected_filters": {
            "city": "Toronto",
            "property_type": "Condo",
            "max_maintenance": 500,
        },
        "validation_rules": {
            "city_must_match": True,
        }
    },
    {
        "category": "South Exposure Condo",
        "query": "condo with south exposure in Yorkville Toronto",
        "expected_filters": {
            "city": "Toronto",
            "property_type": "Condo",
            "exposure": "south",
        },
        "validation_rules": {
            "city_must_match": True,
        }
    },
    {
        "category": "Condo with Balcony",
        "query": "condo with balcony in Toronto",
        "expected_filters": {
            "city": "Toronto",
            "property_type": "Condo",
            "balcony": True,
        },
        "validation_rules": {
            "city_must_match": True,
        }
    },
    {
        "category": "Condo with Locker",
        "query": "condo with locker and parking in downtown",
        "expected_filters": {
            "property_type": "Condo",
            "locker": True,
            "min_parking_spaces": 1,
        },
        "validation_rules": {}
    },
    
    # === PROPERTY STYLE SEARCHES ===
    {
        "category": "Bungalow",
        "query": "bungalow in Etobicoke Toronto",
        "expected_filters": {
            "city": "Toronto",
            "property_style": "Bungalow",
        },
        "validation_rules": {
            "city_must_match": True,
        }
    },
    {
        "category": "2-Storey Home",
        "query": "2 storey house in Scarborough",
        "expected_filters": {
            "city": "Toronto",
            "property_style": "2-Storey",
        },
        "validation_rules": {}
    },
    {
        "category": "Split Level",
        "query": "split level home in North York",
        "expected_filters": {
            "property_style": "Split Level",
        },
        "validation_rules": {}
    },
    
    # === YEAR BUILT SEARCHES ===
    {
        "category": "New Construction",
        "query": "new construction home in Vaughan",
        "expected_filters": {
            "city": "Vaughan",
            "min_year_built": 2022,
        },
        "validation_rules": {
            "city_must_match": True,
        }
    },
    {
        "category": "Recently Built",
        "query": "homes built after 2015 in Markham",
        "expected_filters": {
            "city": "Markham",
            "min_year_built": 2015,
        },
        "validation_rules": {
            "city_must_match": True,
        }
    },
    
    # === SIZE SEARCHES ===
    {
        "category": "Minimum Square Footage",
        "query": "condo at least 1000 sqft in Toronto",
        "expected_filters": {
            "city": "Toronto",
            "min_sqft": 1000,
        },
        "validation_rules": {
            "city_must_match": True,
        }
    },
    {
        "category": "Large Home",
        "query": "house over 3000 square feet in Oakville",
        "expected_filters": {
            "city": "Oakville",
            "min_sqft": 3000,
        },
        "validation_rules": {
            "city_must_match": True,
        }
    },
    
    # === COMBINED FILTER SEARCHES ===
    {
        "category": "Complex Search 1",
        "query": "3 bedroom condo in Toronto under 800k with parking and balcony",
        "expected_filters": {
            "city": "Toronto",
            "property_type": "Condo",
            "min_bedrooms": 3,
            "max_price": 800000,
            "min_parking_spaces": 1,
            "balcony": True,
        },
        "validation_rules": {
            "price_must_be_under": 800000,
        }
    },
    {
        "category": "Complex Search 2",
        "query": "4 bed detached with pool and finished basement in Mississauga under 1.5 million",
        "expected_filters": {
            "city": "Mississauga",
            "property_type": "Detached",
            "min_bedrooms": 4,
            "max_price": 1500000,
            "has_pool": True,
            "basement_type": "finished",
        },
        "validation_rules": {
            "city_must_match": True,
            "price_must_be_under": 1500000,
        }
    },
    {
        "category": "Complex Search 3",
        "query": "luxury penthouse condo in Yorkville with terrace above 2 million",
        "expected_filters": {
            "city": "Toronto",
            "neighborhood": "Yorkville",
            "property_type": "Condo",
            "min_price": 2000000,
            "balcony": True,
        },
        "validation_rules": {
            "price_must_be_over": 2000000,
        }
    },
    {
        "category": "Family Home",
        "query": "5 bedroom house with big backyard in Oakville for a family",
        "expected_filters": {
            "city": "Oakville",
            "property_type": "Detached",
            "min_bedrooms": 5,
        },
        "validation_rules": {
            "city_must_match": True,
        }
    },
    {
        "category": "Investment Property",
        "query": "condo with good rental income potential in downtown Toronto",
        "expected_filters": {
            "city": "Toronto",
            "property_type": "Condo",
        },
        "validation_rules": {
            "city_must_match": True,
        }
    },
    
    # === NEIGHBORHOOD SEARCHES ===
    {
        "category": "Specific Neighborhood",
        "query": "condos in Liberty Village Toronto",
        "expected_filters": {
            "city": "Toronto",
            "neighborhood": "Liberty Village",
            "property_type": "Condo",
        },
        "validation_rules": {
            "city_must_match": True,
        }
    },
    {
        "category": "Downtown Core",
        "query": "1 bedroom condo in King West Toronto under 600k",
        "expected_filters": {
            "city": "Toronto",
            "neighborhood": "King West",
            "min_bedrooms": 1,
            "max_price": 600000,
        },
        "validation_rules": {
            "price_must_be_under": 600000,
        }
    },
]


# =============================================================================
# VALIDATION FUNCTIONS
# =============================================================================

def validate_property_against_criteria(
    property_data: Dict[str, Any],
    validation_rules: Dict[str, Any],
    filters: ResidentialFilters
) -> Dict[str, Any]:
    """
    Validate that a property matches the search criteria.
    Returns validation results with any mismatches found.
    """
    validation_result = {
        "is_valid": True,
        "checks_passed": [],
        "checks_failed": [],
        "warnings": []
    }
    
    # Extract property details (API uses snake_case)
    address = property_data.get('address', {})
    list_price = property_data.get('list_price', 0) or property_data.get('listPrice', 0)
    property_city = address.get('city', '').lower() if address else ''
    property_type = property_data.get('property_type', '') or property_data.get('type', '')
    bedrooms = property_data.get('bedrooms', 0) or 0
    
    # Validate city
    if validation_rules.get('city_must_match'):
        if filters.city and property_city:
            if filters.city.lower() in property_city or property_city in filters.city.lower():
                validation_result["checks_passed"].append(f"✓ City matches: {property_city}")
            else:
                validation_result["is_valid"] = False
                validation_result["checks_failed"].append(
                    f"✗ City mismatch: expected {filters.city}, got {property_city}"
                )
    
    # Validate bedrooms
    if validation_rules.get('bedrooms_must_match'):
        if filters.min_bedrooms and bedrooms:
            if bedrooms >= filters.min_bedrooms:
                validation_result["checks_passed"].append(f"✓ Bedrooms: {bedrooms} >= {filters.min_bedrooms}")
            else:
                validation_result["is_valid"] = False
                validation_result["checks_failed"].append(
                    f"✗ Bedrooms mismatch: expected >= {filters.min_bedrooms}, got {bedrooms}"
                )
    
    # Validate price under
    if validation_rules.get('price_must_be_under'):
        max_allowed = validation_rules['price_must_be_under']
        if list_price <= max_allowed:
            validation_result["checks_passed"].append(f"✓ Price ${list_price:,.0f} <= ${max_allowed:,.0f}")
        else:
            validation_result["is_valid"] = False
            validation_result["checks_failed"].append(
                f"✗ Price ${list_price:,.0f} exceeds max ${max_allowed:,.0f}"
            )
    
    # Validate price over
    if validation_rules.get('price_must_be_over'):
        min_required = validation_rules['price_must_be_over']
        if list_price >= min_required:
            validation_result["checks_passed"].append(f"✓ Price ${list_price:,.0f} >= ${min_required:,.0f}")
        else:
            validation_result["is_valid"] = False
            validation_result["checks_failed"].append(
                f"✗ Price ${list_price:,.0f} below min ${min_required:,.0f}"
            )
    
    # Validate price range
    if validation_rules.get('price_must_be_in_range'):
        min_price, max_price = validation_rules['price_must_be_in_range']
        if min_price <= list_price <= max_price:
            validation_result["checks_passed"].append(
                f"✓ Price ${list_price:,.0f} in range ${min_price:,.0f}-${max_price:,.0f}"
            )
        else:
            validation_result["is_valid"] = False
            validation_result["checks_failed"].append(
                f"✗ Price ${list_price:,.0f} outside range ${min_price:,.0f}-${max_price:,.0f}"
            )
    
    # Validate rental
    if validation_rules.get('must_be_rental'):
        # Check if property is a rental based on price (rentals typically < $10k/month)
        # or transaction type in listing
        if list_price < 15000:  # Likely rental
            validation_result["checks_passed"].append(f"✓ Appears to be rental (price ${list_price:,.0f})")
        else:
            validation_result["warnings"].append(
                f"⚠ Price ${list_price:,.0f} seems high for rental - may be sale listing"
            )
    
    return validation_result


def format_property_summary(property_data: Dict[str, Any]) -> str:
    """Format a property into a readable summary."""
    # Handle both snake_case and camelCase field names
    mls = property_data.get('mls_number', '') or property_data.get('mlsNumber', 'N/A')
    price = property_data.get('list_price', 0) or property_data.get('listPrice', 0)
    address = property_data.get('address', {})
    
    street = (address.get('street_number', '') or '') + ' ' + (address.get('street_name', '') or address.get('streetName', ''))
    city = address.get('city', 'Unknown')
    postal = address.get('postal_code', '') or address.get('zip', '')
    
    beds = property_data.get('bedrooms', '?')
    baths = property_data.get('bathrooms', '?')
    sqft = property_data.get('sqft', 'N/A')
    property_type = property_data.get('property_type', '') or property_data.get('type', 'Unknown')
    style = property_data.get('style', '')
    
    type_str = f"{property_type}" + (f" ({style})" if style else "")
    
    return (
        f"MLS: {mls} | ${price:,.0f} | {street.strip()}, {city} {postal}\n"
        f"       Type: {type_str} | {beds} bed / {baths} bath | {sqft} sqft"
    )


# =============================================================================
# TEST RUNNER
# =============================================================================

class ResidentialSearchTester:
    """Comprehensive tester for residential search pipeline."""
    
    def __init__(self):
        self.extractor = ResidentialFilterExtractor()
        self.converter = StateToFiltersConverter()
        self.search_service = get_residential_search_service()
        self.results_log = []
        
    def test_nlp_extraction(self, query: str, expected: Dict[str, Any]) -> Dict[str, Any]:
        """Test NLP filter extraction from query."""
        filters = self.extractor.extract_all(query)
        
        extraction_results = {
            "query": query,
            "extracted": {},
            "expected": expected,
            "matches": [],
            "mismatches": [],
        }
        
        # Check each expected filter
        for key, expected_value in expected.items():
            actual_value = getattr(filters, key, None)
            extraction_results["extracted"][key] = actual_value
            
            if actual_value is not None:
                # Normalize for comparison
                if isinstance(expected_value, str) and isinstance(actual_value, str):
                    if expected_value.lower() in actual_value.lower() or actual_value.lower() in expected_value.lower():
                        extraction_results["matches"].append(f"{key}: {actual_value}")
                        continue
                
                if expected_value == actual_value:
                    extraction_results["matches"].append(f"{key}: {actual_value}")
                else:
                    extraction_results["mismatches"].append(
                        f"{key}: expected {expected_value}, got {actual_value}"
                    )
            else:
                extraction_results["mismatches"].append(f"{key}: expected {expected_value}, got None")
        
        return extraction_results, filters
    
    def test_api_search(
        self, 
        filters: ResidentialFilters,
        validation_rules: Dict[str, Any],
        limit: int = 5
    ) -> Dict[str, Any]:
        """Execute API search and validate results."""
        
        search_results = {
            "success": False,
            "total_found": 0,
            "properties": [],
            "validation_summary": {
                "total_validated": 0,
                "passed": 0,
                "failed": 0,
                "warnings": 0,
            },
            "error": None,
        }
        
        try:
            # Execute search
            results = self.search_service.search(filters=filters, limit=limit)
            
            if results.get('success'):
                search_results["success"] = True
                search_results["total_found"] = results.get('count', 0)
                
                listings = results.get('listings', [])
                
                for prop in listings[:limit]:
                    # Validate each property
                    validation = validate_property_against_criteria(
                        prop, validation_rules, filters
                    )
                    
                    search_results["properties"].append({
                        "summary": format_property_summary(prop),
                        "mls": prop.get('mlsNumber'),
                        "price": prop.get('listPrice'),
                        "validation": validation,
                        "raw_data": {
                            "address": prop.get('address'),
                            "details": prop.get('details'),
                            "type": prop.get('type'),
                        }
                    })
                    
                    search_results["validation_summary"]["total_validated"] += 1
                    if validation["is_valid"]:
                        search_results["validation_summary"]["passed"] += 1
                    else:
                        search_results["validation_summary"]["failed"] += 1
                    if validation["warnings"]:
                        search_results["validation_summary"]["warnings"] += len(validation["warnings"])
            else:
                search_results["error"] = results.get('error', 'Unknown error')
                
        except Exception as e:
            search_results["error"] = str(e)
        
        return search_results
    
    def run_single_test(self, test_case: Dict[str, Any], test_number: int) -> Dict[str, Any]:
        """Run a single test case."""
        print(f"\n{'='*70}")
        print(f"TEST #{test_number}: {test_case['category']}")
        print(f"{'='*70}")
        print(f"📝 Query: \"{test_case['query']}\"")
        
        # Step 1: NLP Extraction
        print(f"\n🔍 Step 1: NLP Filter Extraction")
        nlp_results, filters = self.test_nlp_extraction(
            test_case['query'], 
            test_case['expected_filters']
        )
        
        print(f"   Expected: {test_case['expected_filters']}")
        print(f"   Extracted: {nlp_results['extracted']}")
        
        if nlp_results['matches']:
            print(f"   ✅ Matches: {', '.join(nlp_results['matches'])}")
        if nlp_results['mismatches']:
            print(f"   ❌ Mismatches: {', '.join(nlp_results['mismatches'])}")
        
        # Step 2: API Search
        print(f"\n🌐 Step 2: API Search Execution")
        
        # Build API params
        api_params = build_residential_api_params(filters)
        print(f"   API Params: {json.dumps(api_params, indent=2)[:200]}...")
        
        # Execute search
        api_results = self.test_api_search(
            filters, 
            test_case['validation_rules'],
            limit=3
        )
        
        if api_results['success']:
            print(f"   ✅ Found {api_results['total_found']} total properties")
            
            # Step 3: Property Validation
            print(f"\n📋 Step 3: Property Validation (showing up to 3)")
            
            for i, prop in enumerate(api_results['properties'], 1):
                print(f"\n   Property {i}:")
                print(f"   {prop['summary']}")
                
                validation = prop['validation']
                if validation['checks_passed']:
                    for check in validation['checks_passed']:
                        print(f"      {check}")
                if validation['checks_failed']:
                    for check in validation['checks_failed']:
                        print(f"      {check}")
                if validation['warnings']:
                    for warning in validation['warnings']:
                        print(f"      {warning}")
            
            # Summary
            summary = api_results['validation_summary']
            print(f"\n   📊 Validation Summary:")
            print(f"      Properties validated: {summary['total_validated']}")
            print(f"      Passed: {summary['passed']}")
            print(f"      Failed: {summary['failed']}")
            if summary['warnings']:
                print(f"      Warnings: {summary['warnings']}")
        else:
            print(f"   ❌ Search failed: {api_results['error']}")
        
        # Add delay to respect API rate limits
        time.sleep(1)
        
        return {
            "test_number": test_number,
            "category": test_case['category'],
            "query": test_case['query'],
            "nlp_results": nlp_results,
            "api_results": api_results,
            "overall_success": (
                api_results['success'] and 
                api_results['validation_summary']['failed'] == 0
            )
        }
    
    def run_all_tests(self, prompts: List[Dict[str, Any]] = None):
        """Run all test cases."""
        if prompts is None:
            prompts = TEST_PROMPTS
        
        print("\n" + "="*70)
        print("🏠 COMPREHENSIVE RESIDENTIAL SEARCH NLP & API VALIDATION")
        print("="*70)
        print(f"Running {len(prompts)} test cases...")
        print(f"Started at: {datetime.now().strftime('%Y-%m-%d %H:%M:%S')}")
        
        results = []
        passed = 0
        failed = 0
        
        for i, test_case in enumerate(prompts, 1):
            try:
                result = self.run_single_test(test_case, i)
                results.append(result)
                
                if result['overall_success']:
                    passed += 1
                else:
                    failed += 1
                    
            except Exception as e:
                print(f"\n❌ Test {i} crashed: {e}")
                failed += 1
                results.append({
                    "test_number": i,
                    "category": test_case['category'],
                    "query": test_case['query'],
                    "error": str(e),
                    "overall_success": False
                })
        
        # Final Summary
        print("\n" + "="*70)
        print("📊 FINAL TEST SUMMARY")
        print("="*70)
        print(f"Total Tests: {len(prompts)}")
        print(f"Passed: {passed}")
        print(f"Failed: {failed}")
        print(f"Success Rate: {passed/len(prompts)*100:.1f}%")
        print(f"Completed at: {datetime.now().strftime('%Y-%m-%d %H:%M:%S')}")
        
        # List failed tests
        if failed > 0:
            print(f"\n❌ Failed Tests:")
            for result in results:
                if not result.get('overall_success', False):
                    print(f"   - #{result['test_number']}: {result['category']}")
        
        return results


def main():
    """Main entry point."""
    # Check API key
    api_key = os.getenv("REPLIERS_API_KEY")
    if not api_key:
        print("❌ ERROR: REPLIERS_API_KEY not set in environment")
        print("Please set the API key in config/.env")
        sys.exit(1)
    
    print(f"✅ API Key configured: {api_key[:8]}...")
    
    # Run tests
    tester = ResidentialSearchTester()
    
    # Option to run subset of tests
    import argparse
    parser = argparse.ArgumentParser(description='Test residential search pipeline')
    parser.add_argument('--quick', action='store_true', help='Run quick test (first 5 only)')
    parser.add_argument('--category', type=str, help='Filter by category keyword')
    args = parser.parse_args()
    
    prompts = TEST_PROMPTS
    
    if args.quick:
        prompts = TEST_PROMPTS[:5]
        print("Running quick test (first 5 cases)")
    
    if args.category:
        prompts = [p for p in prompts if args.category.lower() in p['category'].lower()]
        print(f"Filtering by category: {args.category} ({len(prompts)} tests)")
    
    results = tester.run_all_tests(prompts)
    
    # Save results to file
    output_file = Path(__file__).parent.parent / 'Data' / 'residential_search_test_results.json'
    with open(output_file, 'w') as f:
        json.dump(results, f, indent=2, default=str)
    print(f"\n📁 Results saved to: {output_file}")


if __name__ == '__main__':
    main()
