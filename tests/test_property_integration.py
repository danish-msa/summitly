"""
Integration Test Script
Tests residential and commercial property detection and routing
"""

import sys
import os

# Add project root to path
sys.path.insert(0, os.path.join(os.path.dirname(__file__), '..'))

def test_property_type_detection():
    """Test property type interpreter"""
    print("=" * 80)
    print("TEST 1: Property Type Detection")
    print("=" * 80)
    
    from services.property_type_interpreter import classify_property_type, PropertyType
    
    test_cases = [
        ("Show me 2 bedroom condos in Toronto", PropertyType.RESIDENTIAL),
        ("Looking for office space downtown", PropertyType.COMMERCIAL),
        ("I need a retail store with parking", PropertyType.COMMERCIAL),
        ("Family home with backyard", PropertyType.RESIDENTIAL),
        ("Bakery for sale in Vancouver", PropertyType.COMMERCIAL),
        ("3 bedroom house near schools", PropertyType.RESIDENTIAL),
        ("Commercial building for lease", PropertyType.COMMERCIAL),
        ("Properties in Ottawa", PropertyType.UNKNOWN),
    ]
    
    passed = 0
    failed = 0
    
    for message, expected_type in test_cases:
        result = classify_property_type(message)
        detected_type = result["property_type"]
        confidence = result["confidence"]
        
        # For UNKNOWN, we expect low confidence
        if expected_type == PropertyType.UNKNOWN:
            success = confidence < 0.5
        else:
            success = detected_type == expected_type and confidence >= 0.6
        
        status = "✅ PASS" if success else "❌ FAIL"
        icon = "🏠" if detected_type == PropertyType.RESIDENTIAL else "🏢" if detected_type == PropertyType.COMMERCIAL else "❓"
        
        print(f"\n{status} {icon} \"{message}\"")
        print(f"   Expected: {expected_type.value}, Got: {detected_type.value} ({confidence:.0%})")
        
        if success:
            passed += 1
        else:
            failed += 1
    
    print(f"\n{'=' * 80}")
    print(f"Results: {passed} passed, {failed} failed")
    print(f"{'=' * 80}\n")
    
    return failed == 0


def main():
    """Run all tests"""
    print("\n" + "=" * 80)
    print("RESIDENTIAL + COMMERCIAL INTEGRATION TEST SUITE")
    print("=" * 80 + "\n")
    
    results = []
    
    # Test 1: Property Type Detection
    try:
        results.append(("Property Type Detection", test_property_type_detection()))
    except Exception as e:
        print(f"❌ Test 1 failed with exception: {e}")
        import traceback
        traceback.print_exc()
        results.append(("Property Type Detection", False))
    
    # Summary
    print("\n" + "=" * 80)
    print("TEST SUMMARY")
    print("=" * 80)
    
    for test_name, passed in results:
        status = "✅ PASSED" if passed else "❌ FAILED"
        print(f"{status}: {test_name}")
    
    all_passed = all(result[1] for result in results)
    
    print("=" * 80)
    if all_passed:
        print("🎉 ALL TESTS PASSED! Integration is working correctly.")
    else:
        print("⚠️  Some tests failed. Check errors above.")
    print("=" * 80 + "\n")
    
    return 0 if all_passed else 1


if __name__ == "__main__":
    sys.exit(main())
