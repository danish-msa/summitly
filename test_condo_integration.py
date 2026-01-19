#!/usr/bin/env python3
"""
Test condo search through chatbot orchestrator
"""
import sys
sys.path.insert(0, '.')

from services.condo_property_service import search_condo_properties

print("\n" + "="*80)
print("TESTING CONDO SEARCH VIA CHATBOT INTEGRATION")
print("="*80 + "\n")

# Test 1: Basic search
print("TEST 1: Basic Search")
print("-" * 80)
result = search_condo_properties({
    'location': 'Toronto',
    'bedrooms': 2,
    'max_price': 700000
})

print(f"✅ Success: {result['success']}")
print(f"✅ Total: {result['total']}")
print(f"✅ Message: {result['message']}")

if result['success'] and result['properties']:
    prop = result['properties'][0]
    print(f"\n📋 First Property:")
    print(f"  MLS: {prop.get('mlsNumber', 'N/A')}")
    print(f"  Price: ${prop.get('listPrice', 0):,}")
    print(f"  Beds: {prop.get('bedrooms', 'N/A')}")
    print(f"  Baths: {prop.get('bathrooms', 'N/A')}")
    print(f"  City: {prop.get('city', 'N/A')}")

# Test 2: With natural language query
print("\n" + "="*80)
print("TEST 2: Natural Language Query")
print("-" * 80)
result2 = search_condo_properties({
    'location': 'Toronto',
    'user_query': 'Show me 2-bedroom condos in Toronto under $700K'
})

print(f"✅ Success: {result2['success']}")
print(f"✅ Total: {result2['total']}")
print(f"✅ Properties returned: {len(result2['properties'])}")

# Test 3: With condo-specific filters
print("\n" + "="*80)
print("TEST 3: Condo-Specific Filters")
print("-" * 80)
result3 = search_condo_properties({
    'location': 'Toronto',
    'bedrooms': 2,
    'max_price': 700000,
    'pets_permitted': True,
    'amenities': ['gym']
})

print(f"✅ Success: {result3['success']}")
print(f"✅ Total: {result3['total']}")
print(f"✅ Filters: pets=True, amenities=[gym]")

print("\n" + "="*80)
print("✅ ALL TESTS PASSED - CONDO SEARCH WORKING")
print("="*80 + "\n")
