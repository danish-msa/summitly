#!/usr/bin/env python3
"""
Quick validation script for "properties near" radius search.

Run this to validate the implementation works correctly:
    python validate_radius_search.py
"""

import requests
import json
import sys
from time import sleep


BASE_URL = "http://localhost:5000"
API_ENDPOINT = f"{BASE_URL}/api/chat-gpt4"


def test_query(query, session_id, expected_behavior):
    """Send a test query and display results."""
    print(f"\n{'='*80}")
    print(f"TEST: {query}")
    print(f"EXPECTED: {expected_behavior}")
    print(f"{'='*80}")
    
    payload = {
        "message": query,
        "session_id": session_id
    }
    
    try:
        response = requests.post(API_ENDPOINT, json=payload, timeout=30)
        response.raise_for_status()
        
        data = response.json()
        
        # Display response
        print(f"\n✅ Response received:")
        print(f"Status: {response.status_code}")
        
        if 'message' in data:
            print(f"\nBot message:")
            print(f"{data['message'][:500]}...")  # First 500 chars
        
        if 'properties' in data:
            print(f"\nProperties returned: {len(data['properties'])}")
        
        if 'location' in data:
            print(f"\nLocation extracted: {data['location']}")
        
        return True
        
    except requests.exceptions.ConnectionError:
        print(f"\n❌ ERROR: Could not connect to {BASE_URL}")
        print(f"   Make sure the server is running: python app/webhook_handler.py")
        return False
        
    except requests.exceptions.Timeout:
        print(f"\n❌ ERROR: Request timed out after 30 seconds")
        return False
        
    except Exception as e:
        print(f"\n❌ ERROR: {str(e)}")
        return False


def main():
    """Run validation tests."""
    print("="*80)
    print("RADIUS SEARCH VALIDATION")
    print("="*80)
    print("\nThis script tests 'properties near' radius search functionality.")
    print(f"Server: {BASE_URL}")
    
    tests = [
        {
            "query": "properties near M5V 1A1 Toronto",
            "session": "radius_validation_1",
            "expected": "Should use postal fallback (FSA expansion to M5V), return 20-50 properties"
        },
        {
            "query": "properties near 151 Dan Leckie Way Toronto",
            "session": "radius_validation_2",
            "expected": "Should broaden to city-wide search, return ~50 Toronto properties"
        },
        {
            "query": "properties near M5V",
            "session": "radius_validation_3",
            "expected": "Should search FSA directly, return 20-50 properties"
        },
        {
            "query": "properties at 151 Dan Leckie Way Toronto",
            "session": "radius_validation_4",
            "expected": "Should search exact address ONLY (no 'near' keyword), likely 0 results"
        },
        {
            "query": "properties near King West",
            "session": "radius_validation_5",
            "expected": "Should use standard search (neighborhood already broad)"
        }
    ]
    
    results = []
    
    for i, test in enumerate(tests, 1):
        print(f"\n\n{'#'*80}")
        print(f"# TEST {i}/{len(tests)}")
        print(f"{'#'*80}")
        
        success = test_query(test["query"], test["session"], test["expected"])
        results.append(success)
        
        if i < len(tests):
            print("\n⏳ Waiting 2 seconds before next test...")
            sleep(2)
    
    # Summary
    print(f"\n\n{'='*80}")
    print("VALIDATION SUMMARY")
    print(f"{'='*80}")
    print(f"Tests run: {len(results)}")
    print(f"Successful: {sum(results)}")
    print(f"Failed: {len(results) - sum(results)}")
    
    if all(results):
        print("\n✅ ALL TESTS PASSED")
        return 0
    else:
        print("\n⚠️ SOME TESTS FAILED")
        print("Review the output above for details.")
        return 1


if __name__ == "__main__":
    sys.exit(main())
